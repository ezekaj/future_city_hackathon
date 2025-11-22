import { SimulationResponse, TrafficLight, HourlyData, ScenarioType } from '../types';

// Constants reflecting the physical constraints of Melmark (Mocked based on README context)
const N_HOUSEHOLDS = 4000;
const MAX_SAFE_FLOW = 280; // m3/h - threshold for stress
const TANK_CAPACITY = 3000; // m3
const INITIAL_TANK = 2500; // m3
const INFLOW_RATE = 200; // Constant inflow for simplification

// Base demand curve (normalized per household in liters/h)
// 00:00 to 23:00
const BASELINE_PROFILE_LITERS = [
  10, 8, 6, 5, 6, 15, 45, 70, 65, 50, 
  45, 45, 50, 45, 40, 45, 55, 75, 90, 
  85, 70, 50, 30, 15
];

// Generate Synthetic Data
export const runSimulation = (
  scenario: ScenarioType,
  participationRate: number, // 0.0 to 1.0
  shiftFraction: number // 0.0 to 1.0
): SimulationResponse => {
  
  // 1. Build District Baseline Demand (m3/h)
  let hourlyDemand = BASELINE_PROFILE_LITERS.map(l => (l * N_HOUSEHOLDS) / 1000);

  // 2. Apply Scenario Modifiers
  if (scenario === 'hot_day' || scenario === 'combined_day') {
    // Heat wave: Higher usage 18:00-22:00 (watering, showers)
    for (let h = 18; h <= 21; h++) {
      hourlyDemand[h] *= 1.6;
    }
  }

  if (scenario === 'football_day' || scenario === 'combined_day') {
    // Halftime spike at 20:00
    hourlyDemand[20] *= 2.2; 
  }

  // 3. Apply Flexibility (Demand Response)
  const demandFlex = [...hourlyDemand];
  const demandShiftedAmounts = new Array(24).fill(0);

  // Identify Red hours first to know where to shift FROM
  const isRed = (demand: number, tank: number) => {
    const stress = demand / MAX_SAFE_FLOW;
    const tankPct = tank / TANK_CAPACITY;
    return stress >= 0.85 || tankPct < 0.25;
  };

  // Pre-calculate colors to identify shift sources
  // Note: simplified pre-calculation assuming constant tank for identification
  // In a real solver, this is iterative. Here we use raw demand for identification.
  
  for (let h = 0; h < 24; h++) {
    // Simple heuristic: Shift from high demand hours
    if (hourlyDemand[h] > MAX_SAFE_FLOW * 0.85) {
      const amountToShift = hourlyDemand[h] * participationRate * shiftFraction;
      demandFlex[h] -= amountToShift;
      
      // Shift logic: Move to h+3 or h+4, wrapping around is rare for evening peaks
      // but let's keep it within the day for the prototype
      let targetH = h + 3;
      if (targetH < 24) {
        demandShiftedAmounts[targetH] += amountToShift;
      }
    }
  }

  // Apply the shifted load
  for (let h = 0; h < 24; h++) {
    demandFlex[h] += demandShiftedAmounts[h];
  }

  // 4. Calculate Tank Levels and Colors
  const hourlyData: HourlyData[] = [];
  let tankBase = INITIAL_TANK;
  let tankFlex = INITIAL_TANK;

  for (let h = 0; h < 24; h++) {
    // Baseline Tank
    tankBase = Math.min(TANK_CAPACITY, tankBase + INFLOW_RATE - hourlyDemand[h]);
    if (tankBase < 0) tankBase = 0; // Physical limit

    // Flex Tank
    tankFlex = Math.min(TANK_CAPACITY, tankFlex + INFLOW_RATE - demandFlex[h]);
    if (tankFlex < 0) tankFlex = 0;

    // Metrics
    const stressBase = hourlyDemand[h] / MAX_SAFE_FLOW;
    const stressFlex = demandFlex[h] / MAX_SAFE_FLOW;

    // Color Logic
    const determineColor = (stress: number, tank: number): TrafficLight => {
      const tankPct = tank / TANK_CAPACITY;
      if (stress >= 0.85 || tankPct < 0.25) return TrafficLight.RED;
      if (stress >= 0.60 || tankPct < 0.40) return TrafficLight.YELLOW;
      return TrafficLight.GREEN;
    };

    hourlyData.push({
      hour: h,
      demand: hourlyDemand[h],
      demand_flex: demandFlex[h],
      tank_level: tankBase,
      tank_level_flex: tankFlex,
      stress_index: stressBase,
      stress_index_flex: stressFlex,
      color: determineColor(stressBase, tankBase),
      color_flex: determineColor(stressFlex, tankFlex),
    });
  }

  // 5. Calculate Stats
  const redHoursBase = hourlyData.filter(d => d.color === TrafficLight.RED).length;
  const redHoursFlex = hourlyData.filter(d => d.color_flex === TrafficLight.RED).length;
  const minTankBase = Math.min(...hourlyData.map(d => d.tank_level));
  const minTankFlex = Math.min(...hourlyData.map(d => d.tank_level_flex));
  const maxDemandBase = Math.max(...hourlyData.map(d => d.demand));
  const maxDemandFlex = Math.max(...hourlyData.map(d => d.demand_flex));

  return {
    hourly_data: hourlyData,
    stats: {
      max_demand: maxDemandBase,
      max_demand_flex: maxDemandFlex,
      red_hours: redHoursBase,
      red_hours_flex: redHoursFlex,
      min_tank: minTankBase,
      min_tank_flex: minTankFlex,
    },
    config: {
      scenario,
      participation_rate: participationRate,
      shift_fraction: shiftFraction,
    }
  };
};