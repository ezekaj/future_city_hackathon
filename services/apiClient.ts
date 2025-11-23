/**
 * API Client for PeakFlow Backend
 * Handles communication with External API server
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface SimulationParams {
  scenario: string;
  participation_rate: number;
  shift_fraction: number;
}

export interface BaselineData {
  hourly_baseline: number[];
  total_delivery_m3: number;
  total_consumption_m3: number;
  leak_rate_pct: number;
  num_meters: number;
  data_date_range: {
    start: string;
    end: string;
  };
}

/**
 * Fetch forecast data from external API
 */
export async function fetchForecastData(): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE}/api/forecast`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to fetch forecast:', error);
    return null;
  }
}

/**
 * Extract weekly day options from forecast data
 */
export function fetchWeeklyOptions(forecastData: any): any[] {
  if (!forecastData || !forecastData.weeklyData) {
    return [];
  }
  
  return forecastData.weeklyData.map((day: any, index: number) => ({
    index,
    day: day.day,
    date: day.date,
    scenario: day.scenario || 'Normal Operation'
  }));
}

/**
 * Transform forecast data to simulation response format
 */
export function transformForecastToSimulation(forecastData: any, dayIndex: number = 0): any {
  if (!forecastData || !forecastData.weeklyData || forecastData.weeklyData.length === 0) {
    return null;
  }

  if (dayIndex < 0 || dayIndex >= forecastData.weeklyData.length) {
    dayIndex = 0;
  }

  const selectedDay = forecastData.weeklyData[dayIndex];
  const dayData = selectedDay.data;
  const quota_limit = forecastData.meta.quota_limit_l_s;
  const warning_threshold = forecastData.meta.warning_threshold_l_s;

  // Transform hourly data
  const hourly_data = dayData.map((item: any, index: number) => {
    const flowRate = item.flowRate;
    const utilization = flowRate / quota_limit;
    
    // Determine color based on flow rate
    let color: string;
    if (flowRate >= warning_threshold) {
      color = 'Red';
    } else if (flowRate >= quota_limit * 0.7) {
      color = 'Yellow';
    } else {
      color = 'Green';
    }

    // Simulate flex scenario (reduced demand)
    const demand_flex = flowRate * 0.85;
    let color_flex: string;
    if (demand_flex >= warning_threshold) {
      color_flex = 'Red';
    } else if (demand_flex >= quota_limit * 0.7) {
      color_flex = 'Yellow';
    } else {
      color_flex = 'Green';
    }

    return {
      hour: index,
      demand: flowRate,
      demand_flex: demand_flex,
      tank_level: 100 - (utilization * 50), // Simulated tank level
      tank_level_flex: 100 - ((demand_flex / quota_limit) * 40),
      stress_index: utilization,
      stress_index_flex: demand_flex / quota_limit,
      color: color,
      color_flex: color_flex
    };
  });

  // Calculate stats
  const demands = hourly_data.map((h: any) => h.demand);
  const demands_flex = hourly_data.map((h: any) => h.demand_flex);
  const tank_levels = hourly_data.map((h: any) => h.tank_level);
  const tank_levels_flex = hourly_data.map((h: any) => h.tank_level_flex);

  const stats = {
    max_demand: Math.max(...demands),
    max_demand_flex: Math.max(...demands_flex),
    red_hours: hourly_data.filter((h: any) => h.color === 'Red').length,
    red_hours_flex: hourly_data.filter((h: any) => h.color_flex === 'Red').length,
    min_tank: Math.min(...tank_levels),
    min_tank_flex: Math.min(...tank_levels_flex)
  };

  return {
    hourly_data,
    stats,
    config: {
      scenario: 'bwv_real_data',
      participation_rate: 0.15,
      shift_fraction: 0.25
    },
    dayInfo: {
      day: selectedDay.day,
      date: selectedDay.date,
      scenario: selectedDay.scenario || 'Normal Operation'
    }
  };
}

/**
 * Fetch real baseline data from Melmark meters
 */
export async function fetchRealBaseline(): Promise<BaselineData | null> {
  try {
    const response = await fetch(`${API_BASE}/api/baseline`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
    console.error('API returned error:', result.error);
    return null;
  } catch (error) {
    console.error('Failed to fetch baseline:', error);
    return null;
  }
}

/**
 * Run simulation via backend API (uses forecast data)
 */
export async function runSimulationAPI(params: SimulationParams, dayIndex: number = 0): Promise<any | null> {
  // Fetch from /api/forecast and transform
  const forecastData = await fetchForecastData();
  if (forecastData) {
    return transformForecastToSimulation(forecastData, dayIndex);
  }
  return null;
}

/**
 * Fetch available scenarios
 */
export async function fetchScenarios(): Promise<any[] | null> {
  try {
    const response = await fetch(`${API_BASE}/api/scenarios`);
    const result = await response.json();
    
    if (result.success) {
      return result.data.scenarios;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch scenarios:', error);
    return null;
  }
}

/**
 * Health check for backend
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/`, { method: 'GET' });
    return response.ok;
  } catch (error) {
    return false;
  }
}
