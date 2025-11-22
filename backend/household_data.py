"""
Household consumption data parser for real Melmark meters
"""

import pandas as pd
from pathlib import Path
from typing import Dict, List
import numpy as np

DATA_DIR = Path(r"C:/Users/User/Downloads/hack_the_flow_data/hack the flow")

# German water consumption data (BDEW statistics)
WATER_ACTIVITIES = {
    "shower": {"volume_L": 70, "flexibility": 0.1, "typical_hours": [7, 8, 19, 20]},
    "toilet": {"volume_L": 6, "flexibility": 0.0, "typical_hours": list(range(24))},
    "laundry": {"volume_L": 50, "flexibility": 1.0, "typical_hours": [10, 11, 18, 19]},
    "dishwasher": {"volume_L": 10, "flexibility": 0.9, "typical_hours": [20, 21, 22]},
    "garden": {"volume_L": 500, "flexibility": 1.0, "typical_hours": [18, 19, 20]},
    "cooking": {"volume_L": 5, "flexibility": 0.2, "typical_hours": [7, 12, 18, 19]},
}

def parse_household_consumption(meter_id: str) -> Dict:
    """Parse Verbrauchsverlauf file for a specific meter"""
    file_pattern = f"Verbrauchsverlauf_{meter_id}.xlsx"
    file_path = DATA_DIR / file_pattern

    if not file_path.exists():
        raise FileNotFoundError(f"Meter data not found: {file_pattern}")

    df = pd.read_excel(file_path, sheet_name=0)
    df['Datum'] = pd.to_datetime(df['Datum'], format='%d.%m.%Y', errors='coerce')
    df = df.dropna(subset=['Datum', 'Verbrauch'])

    # Calculate statistics
    total_m3 = float(df['Verbrauch'].sum())
    days = len(df)
    avg_daily_m3 = float(df['Verbrauch'].mean())
    avg_daily_L = avg_daily_m3 * 1000
    annual_m3 = avg_daily_m3 * 365
    estimated_people = round(avg_daily_L / 125, 1)

    # Find peak consumption days (weekends with laundry)
    df['weekday'] = df['Datum'].dt.day_name()
    top_days = df.nlargest(5, 'Verbrauch')[['Datum', 'Verbrauch', 'weekday']].to_dict('records')

    return {
        "meter_id": meter_id,
        "data_period_days": days,
        "start_date": df['Datum'].min().strftime('%Y-%m-%d'),
        "end_date": df['Datum'].max().strftime('%Y-%m-%d'),
        "total_consumption_m3": round(total_m3, 2),
        "avg_daily_consumption_m3": round(avg_daily_m3, 3),
        "avg_daily_consumption_L": round(avg_daily_L, 0),
        "projected_annual_m3": round(annual_m3, 0),
        "estimated_household_size": estimated_people,
        "min_daily_m3": float(df['Verbrauch'].min()),
        "max_daily_m3": float(df['Verbrauch'].max()),
        "median_daily_m3": float(df['Verbrauch'].median()),
        "top_consumption_days": [
            {
                "date": day['Datum'].strftime('%Y-%m-%d'),
                "weekday": day['weekday'],
                "consumption_m3": round(float(day['Verbrauch']), 3),
                "consumption_L": round(float(day['Verbrauch']) * 1000, 0)
            }
            for day in top_days
        ]
    }

def calculate_savings_potential(household_profile: Dict) -> Dict:
    """Calculate potential savings from demand response"""
    annual_m3 = household_profile['projected_annual_m3']

    # Assume 24% of consumption is flexible (laundry, dishwasher, garden)
    # Based on BDEW breakdown: Laundry 12% + Dishwashing 6% + Garden 6%
    flexible_fraction = 0.24
    flexible_m3 = annual_m3 * flexible_fraction

    # Price difference between peak (€2.80) and off-peak (€2.20)
    price_diff = 0.60

    # Annual savings if ALL flexible consumption shifts
    max_annual_savings = flexible_m3 * price_diff

    # Realistic savings (assume 70% adoption of flexible shifting)
    realistic_annual_savings = max_annual_savings * 0.7
    realistic_monthly_savings = realistic_annual_savings / 12

    # Activity-specific savings
    activities_savings = {}
    for activity, props in WATER_ACTIVITIES.items():
        if props['flexibility'] > 0.5:  # Only flexible activities
            volume_m3 = props['volume_L'] / 1000
            per_event_savings = volume_m3 * price_diff
            activities_savings[activity] = {
                "volume_L": props['volume_L'],
                "peak_price_eur": round(volume_m3 * 2.80, 3),
                "offpeak_price_eur": round(volume_m3 * 2.20, 3),
                "savings_per_event_eur": round(per_event_savings, 3)
            }

    return {
        "flexible_consumption_m3_year": round(flexible_m3, 1),
        "max_annual_savings_eur": round(max_annual_savings, 2),
        "realistic_annual_savings_eur": round(realistic_annual_savings, 2),
        "realistic_monthly_savings_eur": round(realistic_monthly_savings, 2),
        "activities": activities_savings
    }

def get_household_profile_with_savings(meter_id: str = "8APA0180428234") -> Dict:
    """Get complete household profile with savings calculations"""
    profile = parse_household_consumption(meter_id)
    savings = calculate_savings_potential(profile)

    return {
        "profile": profile,
        "savings_potential": savings,
        "activities_catalog": WATER_ACTIVITIES
    }

if __name__ == "__main__":
    # Test the parser
    result = get_household_profile_with_savings()
    import json
    print(json.dumps(result, indent=2))
