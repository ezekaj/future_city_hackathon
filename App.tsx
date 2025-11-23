import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import CustomerView from './components/CustomerView';
import OperatorDashboard from './components/OperatorDashboard';
import { runSimulationAPI, fetchForecastData, fetchWeeklyOptions } from './services/apiClient';
import { SimulationResponse, DayOption } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'customer' | 'operator'>('landing');
  const [simData, setSimData] = useState<SimulationResponse | null>(null);
  const [weeklyOptions, setWeeklyOptions] = useState<DayOption[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Fetch weekly options on mount
  useEffect(() => {
    const loadWeeklyOptions = async () => {
      const forecastData = await fetchForecastData();
      if (forecastData) {
        const options = fetchWeeklyOptions(forecastData);
        setWeeklyOptions(options);
      }
    };
    loadWeeklyOptions();
  }, []);

  // Fetch data for selected day
  useEffect(() => {
    const fetchData = async () => {
      const apiResult = await runSimulationAPI({
        scenario: 'normal_day',
        participation_rate: 0.15,
        shift_fraction: 0.25
      }, selectedDayIndex);
      
      if (apiResult) {
        setSimData(apiResult);
      }
    };
    fetchData();
  }, [selectedDayIndex]);

  // Landing Page (View Selector)
  if (view === 'landing') {
    return <LandingPage onSelectView={setView} />;
  }

  // Loading state for customer/operator views
  if (!simData) {
    return (
      <div className="h-screen w-full flex items-center justify-center text-slate-500">
        Loading data from server...
      </div>
    );
  }

  // Customer View (Mobile Resident Interface)
  if (view === 'customer') {
    return (
      <div className="h-screen bg-slate-950 flex flex-col font-sans relative overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <CustomerView
            data={simData}
            weeklyOptions={weeklyOptions}
            selectedDayIndex={selectedDayIndex}
            onDayChange={setSelectedDayIndex}
            onBack={() => setView('landing')}
          />
        </div>
      </div>
    );
  }

  // Operator Dashboard (Desktop Utility Interface)
  if (view === 'operator') {
    return (
      <OperatorDashboard
        data={simData}
        weeklyOptions={weeklyOptions}
        selectedDayIndex={selectedDayIndex}
        onDayChange={setSelectedDayIndex}
        onBack={() => setView('landing')}
      />
    );
  }

  // Fallback (should never reach here)
  return null;
};

export default App;
