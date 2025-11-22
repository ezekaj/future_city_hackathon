
from typing import Dict
import numpy as np
from data_ingestion import get_real_baseline_profile

MAX_SAFE_FLOW_M3_PER_H = 800  # Updated based on real data (peak is 792)
TANK_CAPACITY_M3 = 3000
INITIAL_TANK_LEVEL_RATIO = 0.7

def get_baseline_demand() -> np.ndarray:
    try:
        real_data = get_real_baseline_profile()
        baseline = np.array(real_data['hourly_baseline'])
        return baseline
    except Exception as e:
        print(f"Using fallback baseline: {e}")
        return np.array([10, 8, 6, 5, 4, 3, 3, 4, 15, 25, 20, 18, 16, 15, 14, 16, 20, 25, 30, 28, 22, 18, 14, 12])

def apply_scenario_modifier(baseline: np.ndarray, scenario: str) -> np.ndarray:
    demand = baseline.copy()
    if scenario == 'hot_day':
        for h in range(18, 22):
            demand[h] *= 1.6
    elif scenario == 'football_day':
        demand[20] *= 2.2
    elif scenario == 'combined':
        for h in range(18, 22):
            demand[h] *= 1.6
        demand[20] *= 2.2
    return demand

def calculate_stress_and_tank(demand: np.ndarray) -> tuple:
    stress_index = demand / MAX_SAFE_FLOW_M3_PER_H
    tank_level = np.zeros(24)
    tank_level[0] = TANK_CAPACITY_M3 * INITIAL_TANK_LEVEL_RATIO
    avg_demand = demand.mean()
    inflow_rate = avg_demand * 1.2
    for h in range(1, 24):
        tank_level[h] = tank_level[h-1] + inflow_rate - demand[h-1]
        tank_level[h] = np.clip(tank_level[h], 0, TANK_CAPACITY_M3)
    return stress_index, tank_level

def get_traffic_light(stress: float, tank_level: float) -> str:
    tank_ratio = tank_level / TANK_CAPACITY_M3
    if stress >= 0.85 or tank_ratio < 0.25:
        return 'red'
    elif stress >= 0.6 or tank_ratio < 0.4:
        return 'yellow'
    return 'green'

def apply_demand_response(demand: np.ndarray, participation_rate: float, shift_fraction: float) -> np.ndarray:
    demand_flex = demand.copy()
    stress_index, tank_level = calculate_stress_and_tank(demand)
    for h in range(24):
        color = get_traffic_light(stress_index[h], tank_level[h])
        if color == 'red':
            shifted_amount = demand[h] * participation_rate * shift_fraction
            demand_flex[h] -= shifted_amount
            target_hour = (h + 3) % 24
            if target_hour < 24:
                demand_flex[target_hour] += shifted_amount
    return demand_flex

def run_simulation(scenario: str, participation_rate: float, shift_fraction: float) -> Dict:
    baseline = get_baseline_demand()
    demand_baseline = apply_scenario_modifier(baseline, scenario)
    demand_flex = apply_demand_response(demand_baseline, participation_rate, shift_fraction)
    
    stress_baseline, tank_baseline = calculate_stress_and_tank(demand_baseline)
    stress_flex, tank_flex = calculate_stress_and_tank(demand_flex)
    
    colors_baseline = [get_traffic_light(stress_baseline[h], tank_baseline[h]) for h in range(24)]
    colors_flex = [get_traffic_light(stress_flex[h], tank_flex[h]) for h in range(24)]
    
    return {
        'hourly_data': [
            {
                'hour': h,
                'demand': float(demand_baseline[h]),
                'demand_flex': float(demand_flex[h]),
                'stress_index': float(stress_baseline[h]),
                'stress_index_flex': float(stress_flex[h]),
                'tank_level': float(tank_baseline[h]),
                'tank_level_flex': float(tank_flex[h]),
                'color': colors_baseline[h],
                'color_flex': colors_flex[h]
            }
            for h in range(24)
        ],
        'stats': {
            'max_demand': float(demand_baseline.max()),
            'max_demand_flex': float(demand_flex.max()),
            'red_hours': sum(1 for c in colors_baseline if c == 'red'),
            'red_hours_flex': sum(1 for c in colors_flex if c == 'red'),
            'min_tank': float(tank_baseline.min()) / TANK_CAPACITY_M3 * 100,
            'min_tank_flex': float(tank_flex.min()) / TANK_CAPACITY_M3 * 100
        }
    }

if __name__ == "__main__":
    print("Testing simulation with real Melmark baseline...")
    result = run_simulation('normal_day', 0.25, 0.3)
    print(f"Max demand baseline: {result['stats']['max_demand']:.2f} m3/h")
    print(f"Max demand flex: {result['stats']['max_demand_flex']:.2f} m3/h")
    print(f"Red hours baseline: {result['stats']['red_hours']}")
    print(f"Red hours flex: {result['stats']['red_hours_flex']}")
    print(f"Min tank baseline: {result['stats']['min_tank']:.1f}%")
    print(f"Min tank flex: {result['stats']['min_tank_flex']:.1f}%")
