export enum TrafficLight {
  GREEN = 'Green',
  YELLOW = 'Yellow',
  RED = 'Red'
}

export interface HourlyData {
  hour: number;
  demand: number;
  demand_flex: number;
  tank_level: number;
  tank_level_flex: number;
  stress_index: number;
  stress_index_flex: number;
  color: TrafficLight;
  color_flex: TrafficLight;
}

export interface SimulationStats {
  max_demand: number;
  max_demand_flex: number;
  red_hours: number;
  red_hours_flex: number;
  min_tank: number;
  min_tank_flex: number;
}

export interface SimulationResponse {
  hourly_data: HourlyData[];
  stats: SimulationStats;
  config: {
    scenario: string;
    participation_rate: number;
    shift_fraction: number;
  };
}

export type ScenarioType = 'normal_day' | 'hot_day' | 'football_day' | 'combined_day';