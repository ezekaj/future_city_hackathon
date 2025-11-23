import React, { useState, useEffect } from 'react';
import CustomerView from './components/CustomerView';
import { runSimulationAPI } from './services/apiClient';
import { SimulationResponse } from './types';

const App: React.FC = () => {
  const [simData, setSimData] = useState<SimulationResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch from external API
      const apiResult = await runSimulationAPI({
        scenario: 'normal_day',
        participation_rate: 0.15,
        shift_fraction: 0.25
      });
      
      if (apiResult) {
        setSimData(apiResult);
      }
    };
    fetchData();
  }, []);

  if (!simData) {
    return (
      <div className="h-screen w-full flex items-center justify-center text-slate-500">
        Loading data from server...
      </div>
    );
  }

  // Customer View (Mobile Resident Interface)
  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans relative overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <CustomerView data={simData} />
      </div>
    </div>
  );
};

export default App;
