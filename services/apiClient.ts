/**
 * API Client for PeakFlow Backend
 * Handles communication with FastAPI server
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
 * Run simulation via backend API
 */
export async function runSimulationAPI(params: SimulationParams): Promise<any | null> {
  try {
    const response = await fetch(`${API_BASE}/api/simulation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    }
    console.error('Simulation API returned error:', result.error);
    return null;
  } catch (error) {
    console.error('Failed to run simulation:', error);
    return null;
  }
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
