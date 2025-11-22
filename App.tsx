import React, { useState, useEffect } from 'react';
import UtilityDashboard from './components/UtilityDashboard';
import CustomerView from './components/CustomerView';
import { runSimulation } from './services/simulationEngine';
import { runSimulationAPI, fetchRealBaseline } from './services/apiClient';

import { SimulationResponse, ScenarioType } from './types';
import { LayoutDashboard, Smartphone, Droplet, ArrowLeft, User, Building2 } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'utility' | 'customer'>('landing');
  const [config, setConfig] = useState({
    scenario: 'normal_day' as ScenarioType,
    participation: 0.15,
    shift: 0.25,
  });
  const [simData, setSimData] = useState<SimulationResponse | null>(null);
  const [usingRealData, setUsingRealData] = useState(false);
  const [baselineData, setBaselineData] = useState<any>(null);


  useEffect(() => {
    const runSim = async () => {
      // Try API first
      const apiResult = await runSimulationAPI({
        scenario: config.scenario,
        participation_rate: config.participation,
        shift_fraction: config.shift
      });
      
      if (apiResult) {
        setSimData(apiResult);
        setUsingRealData(true);
      } else {
        // Fallback to local simulation
        const localData = runSimulation(config.scenario, config.participation, config.shift);
        setSimData(localData);
        setUsingRealData(false);
      }
    };
    runSim();
  }, [config]);

  // Fetch baseline data for leak detection
  useEffect(() => {
    fetchRealBaseline().then(data => {
      if (data) setBaselineData(data);
    });
  }, []);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (!simData) return <div className="h-screen w-full flex items-center justify-center text-slate-500">Initializing Simulation Model...</div>;

  // Landing Page for Role Selection
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-lg shadow-blue-200">
            <Droplet className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">PeakFlow Melmark</h1>
          <p className="text-slate-500 text-lg max-w-md mx-auto">
            Water Demand Response System. <br />Select your role to enter the simulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          <button 
            onClick={() => setView('utility')}
            className="group bg-white hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-8 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Utility Operator</h2>
            <p className="text-slate-500 leading-relaxed">
              Monitor district water demand, tank levels, and trigger flexibility campaigns to manage peak loads.
            </p>
          </button>

          <button 
            onClick={() => setView('customer')}
            className="group bg-white hover:bg-emerald-50 border-2 border-slate-200 hover:border-emerald-500 rounded-2xl p-8 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <User className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Melmark Resident</h2>
            <p className="text-slate-500 leading-relaxed">
              View current water status, receive usage advice, and earn rewards for shifting consumption.
            </p>
          </button>
        </div>

        <div className="mt-16 text-center">
             <p className="text-slate-400 text-xs">Hack the Flow • HNVG • Prototype</p>
        </div>
      </div>
    );
  }

  // Utility Dashboard View
  if (view === 'utility') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
             <button 
              onClick={() => setView('landing')}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
              title="Back to Role Selection"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Droplet className="text-white w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold text-slate-800">
                PeakFlow <span className="text-slate-400 font-normal ml-1">Operator Dashboard</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md text-xs font-medium text-slate-600">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Simulation Active
             </div>
          </div>
        </nav>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-[1600px] mx-auto h-full">
            <UtilityDashboard
              usingRealData={usingRealData}
              baselineData={baselineData} 
              data={simData} 
              config={config} 
              onConfigChange={handleConfigChange} 
            />
          </div>
        </main>
      </div>
    );
  }

  // Customer View
  if (view === 'customer') {
    return (
      <div className="h-screen bg-slate-950 flex flex-col font-sans relative overflow-hidden">
        <div className="absolute top-6 left-6 z-50">
          <button 
            onClick={() => setView('landing')}
            className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-white/10 text-sm font-medium text-white hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Exit App
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
           <CustomerView data={simData} />
        </div>
      </div>
    );
  }

  return null;
};

export default App;