import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart, Bar, ReferenceLine, Legend } from 'recharts';
import { TrafficLight, SimulationResponse, ScenarioType } from '../types';
import { Zap, Activity, TrendingDown, AlertTriangle, Droplet } from 'lucide-react';

interface Props {
  data: SimulationResponse;
  config: {
    scenario: ScenarioType;
    participation: number;
    shift: number;
  };
  onConfigChange: (key: string, value: any) => void;
}

const UtilityDashboard: React.FC<Props> = ({ data, config, onConfigChange }) => {
  
  const formatHour = (tick: number) => `${tick}:00`;

  // Helper to render traffic light background
  const CustomBackground = (props: any) => {
    const { x, y, width, height, index } = props;
    const hourData = data.hourly_data[index];
    
    if (!hourData) return null;

    let fill = 'transparent';
    if (hourData.color === TrafficLight.RED) fill = 'rgba(244, 63, 94, 0.15)'; // Red-500 low opacity
    else if (hourData.color === TrafficLight.YELLOW) fill = 'rgba(251, 191, 36, 0.15)'; // Amber-500
    else fill = 'rgba(16, 185, 129, 0.05)'; // Emerald-500

    return <rect x={x} y={y} width={width} height={height} fill={fill} />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      
      {/* Left Panel: Controls & Stats */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" /> Simulation Control
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scenario</label>
              <select 
                value={config.scenario}
                onChange={(e) => onConfigChange('scenario', e.target.value)}
                className="w-full rounded-lg border-slate-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="normal_day">Normal Day</option>
                <option value="hot_day">Hot Summer Day</option>
                <option value="football_day">Football Match (Spike)</option>
                <option value="combined_day">Combined Stress</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Participation Rate: {Math.round(config.participation * 100)}%
              </label>
              <input 
                type="range" min="0" max="0.5" step="0.05"
                value={config.participation}
                onChange={(e) => onConfigChange('participation', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Flex Shift Amount: {Math.round(config.shift * 100)}%
              </label>
              <input 
                type="range" min="0" max="0.5" step="0.05"
                value={config.shift}
                onChange={(e) => onConfigChange('shift', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-xs text-slate-500 mt-1">
                % of consumption shifted from red hours to later.
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Peak Demand</span>
              <Activity className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-800">{Math.round(data.stats.max_demand_flex)}</span>
              <span className="text-sm text-slate-400 mb-1">m³/h</span>
            </div>
            {data.stats.max_demand !== data.stats.max_demand_flex && (
               <div className="text-xs text-emerald-600 font-medium mt-1">
                 Reduced from {Math.round(data.stats.max_demand)} m³/h
               </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Critical Hours</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-bold ${data.stats.red_hours_flex > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {data.stats.red_hours_flex}
              </span>
              <span className="text-sm text-slate-400 mb-1">hrs</span>
            </div>
             {data.stats.red_hours !== data.stats.red_hours_flex && (
               <div className="text-xs text-emerald-600 font-medium mt-1">
                 Down from {data.stats.red_hours} hours
               </div>
            )}
          </div>

           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Min Tank Level</span>
              <Droplet className="w-4 h-4 text-sky-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-800">{Math.round((data.stats.min_tank_flex / 3000) * 100)}%</span>
            </div>
            {data.stats.min_tank_flex > data.stats.min_tank && (
               <div className="text-xs text-emerald-600 font-medium mt-1">
                 Improved from {Math.round((data.stats.min_tank / 3000) * 100)}%
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Charts */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Main Demand Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96 flex flex-col">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">District Demand vs Capacity</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.hourly_data} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tickFormatter={formatHour} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => [`${Math.round(val)} m³`, '']}
                />
                <Legend iconType="circle" />
                
                {/* Max Safe Flow Line */}
                <ReferenceLine y={280} label="Limit" stroke="#ef4444" strokeDasharray="3 3" />

                {/* Baseline Area */}
                <Area 
                  type="monotone" 
                  dataKey="demand" 
                  name="Baseline Demand" 
                  fill="#e2e8f0" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  fillOpacity={0.3}
                />

                {/* Flex Line */}
                <Line 
                  type="monotone" 
                  dataKey="demand_flex" 
                  name="With Flex" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tank Level Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-64 flex flex-col">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Reservoir Tank Levels</h3>
          <div className="flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.hourly_data} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tickFormatter={formatHour} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 3000]} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(val: number) => [`${Math.round(val)} m³`, '']} />
                <Legend />
                
                <Line type="monotone" dataKey="tank_level" name="Baseline Tank" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                <Area type="monotone" dataKey="tank_level_flex" name="Flex Tank" fill="#bae6fd" stroke="#0ea5e9" fillOpacity={0.4} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UtilityDashboard;