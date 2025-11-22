
import pandas as pd
import glob
from pathlib import Path
from typing import Dict
import numpy as np

DATA_DIR = Path(r"C:/Users/User/Downloads/hack_the_flow_data/hack the flow")

def parse_delivery_data(file_path: str) -> pd.DataFrame:
    df = pd.read_excel(file_path, sheet_name=0, skiprows=1)
    df.columns = ['timestamp', 'zw22_inflow', 'zw40_outflow', 'unused1', 'unused2']
    df = df.dropna(subset=['timestamp'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], format='%d.%m.%Y %H:%M', errors='coerce')
    df = df.dropna(subset=['timestamp'])
    df['zw22_inflow_m3'] = pd.to_numeric(df['zw22_inflow'], errors='coerce').fillna(0)
    df['zw40_outflow_m3'] = pd.to_numeric(df['zw40_outflow'], errors='coerce').fillna(0)
    return df[['timestamp', 'zw22_inflow_m3', 'zw40_outflow_m3']]

def aggregate_to_hourly(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.set_index('timestamp', inplace=True)
    hourly = df.resample('H').sum()
    hourly['hour_of_day'] = hourly.index.hour
    return hourly.reset_index()

def calculate_hourly_baseline(df_hourly: pd.DataFrame) -> np.ndarray:
    baseline = df_hourly.groupby('hour_of_day')['zw40_outflow_m3'].mean()
    baseline = baseline.reindex(range(24))
    baseline = baseline.interpolate(method='linear').fillna(method='bfill').fillna(method='ffill')
    return baseline.values

def parse_consumer_consumption(file_path: str) -> pd.DataFrame:
    df = pd.read_excel(file_path, sheet_name=0)
    df['date'] = pd.to_datetime(df['Datum'], format='%d.%m.%Y', errors='coerce')
    df['consumption_m3'] = pd.to_numeric(df['Verbrauch'], errors='coerce').fillna(0)
    meter_id = Path(file_path).stem.replace('Verbrauchsverlauf_', '')
    df['meter_id'] = meter_id
    return df[['date', 'meter_id', 'consumption_m3']].dropna()

def parse_all_consumer_meters() -> pd.DataFrame:
    pattern = str(DATA_DIR / "Verbrauchsverlauf_*.xlsx")
    files = glob.glob(pattern)
    all_data = []
    for file_path in files:
        try:
            df = parse_consumer_consumption(file_path)
            all_data.append(df)
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
    if not all_data:
        return pd.DataFrame()
    return pd.concat(all_data, ignore_index=True)

def get_real_baseline_profile() -> Dict:
    delivery_files = glob.glob(str(DATA_DIR / "Compare_Data*.xlsx"))
    if not delivery_files:
        raise FileNotFoundError("No Compare_Data*.xlsx files found")
    delivery_file = max(delivery_files, key=lambda x: Path(x).stat().st_mtime)
    df_delivery = parse_delivery_data(delivery_file)
    df_hourly = aggregate_to_hourly(df_delivery)
    hourly_baseline = calculate_hourly_baseline(df_hourly)
    df_meters = parse_all_consumer_meters()
    num_meters = df_meters['meter_id'].nunique() if not df_meters.empty else 0
    total_delivery_m3 = df_hourly['zw40_outflow_m3'].sum()
    total_consumption_m3 = df_meters['consumption_m3'].sum() if not df_meters.empty else 0
    leak_rate_pct = ((total_delivery_m3 - total_consumption_m3) / total_delivery_m3) * 100 if total_delivery_m3 > 0 else 0
    return {
        'hourly_baseline': hourly_baseline.tolist(),
        'total_delivery_m3': float(total_delivery_m3),
        'total_consumption_m3': float(total_consumption_m3),
        'leak_rate_pct': float(leak_rate_pct),
        'num_meters': int(num_meters),
        'data_date_range': {
            'start': df_hourly['timestamp'].min().isoformat() if not df_hourly.empty else None,
            'end': df_hourly['timestamp'].max().isoformat() if not df_hourly.empty else None
        }
    }

if __name__ == "__main__":
    print("PeakFlow Data Ingestion Test")
    result = get_real_baseline_profile()
    print(f"Date range: {result['data_date_range']}")
    print(f"Smart meters: {result['num_meters']}")
    print(f"Total delivery: {result['total_delivery_m3']:.2f} m3")
    print(f"Total consumption: {result['total_consumption_m3']:.2f} m3")
    print(f"Leak rate: {result['leak_rate_pct']:.1f}%")
