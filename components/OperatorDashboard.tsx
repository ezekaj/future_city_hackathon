import React, { useState } from 'react';
import { SimulationResponse, TrafficLight, DayOption } from '../types';
import {
  ArrowLeft, Activity, Droplet, Users, TrendingDown, ChevronDown,
  BarChart3, AlertTriangle, Clock, Gauge
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  data: SimulationResponse;
  weeklyOptions: DayOption[];
  selectedDayIndex: number;
  onDayChange: (index: number) => void;
  onBack: () => void;
}

const OperatorDashboard: React.FC<Props> = ({
  data,
  weeklyOptions,
  selectedDayIndex,
  onDayChange,
  onBack
}) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('bwv_real_data');

  // Calculate statistics
  const hourlyData = data.hourly_data;
  const stats = data.stats;

  // Get current hour data
  const currentHour = new Date().getHours();
  const currentData = hourlyData[currentHour] || hourlyData[0];

  // Calculate district-wide metrics
  const peakDemand = Math.max(...hourlyData.map(h => h.demand));
  const peakDemandFlex = Math.max(...hourlyData.map(h => h.demand_flex));
  const demandReduction = ((peakDemand - peakDemandFlex) / peakDemand * 100).toFixed(1);

  const redHours = hourlyData.filter(h => h.color === TrafficLight.RED).length;
  const redHoursFlex = hourlyData.filter(h => h.color_flex === TrafficLight.RED).length;
  const redHoursReduced = redHours - redHoursFlex;

  const participationRate = data.config.participation_rate * 100;
  const estimatedParticipants = Math.round(2400 * data.config.participation_rate);

  // Prepare chart data
  const chartData = hourlyData.map(h => ({
    hour: `${h.hour}:00`,
    'Without DR': h.demand,
    'With DR': h.demand_flex,
    'Quota Limit': 792
  }));

  // Get current status color
  const getStatusColor = (status: TrafficLight) => {
    switch(status) {
      case TrafficLight.RED: return { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30' };
      case TrafficLight.YELLOW: return { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' };
      case TrafficLight.GREEN: return { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    }
  };

  const statusColor = getStatusColor(currentData.color_flex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-[1800px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Operator Dashboard</h1>
              <p className="text-white/60 text-sm mt-1">Melmark District • Real-time Grid Monitoring</p>
            </div>
          </div>

          {/* Live Indicator */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <div className={`w-2 h-2 rounded-full ${statusColor.bg} animate-pulse`}></div>
            <span className="text-sm font-semibold">LIVE</span>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Current Demand */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${statusColor.bg}/20`}>
                <Activity className={`${statusColor.text}`} size={24} />
              </div>
              <span className="text-xs text-white/50">Hour {currentData.hour}:00</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {currentData.demand_flex.toFixed(0)} <span className="text-lg text-white/60">L/s</span>
            </div>
            <div className="text-sm text-white/60">Current Demand</div>
            <div className={`text-xs ${statusColor.text} mt-2`}>
              {((currentData.demand_flex / 792) * 100).toFixed(1)}% of quota
            </div>
          </div>

          {/* Tank Level */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Droplet className="text-blue-400" size={24} />
              </div>
              <Gauge className="text-white/30" size={20} />
            </div>
            <div className="text-3xl font-bold mb-1">
              {currentData.tank_level_flex.toFixed(1)}<span className="text-lg text-white/60">%</span>
            </div>
            <div className="text-sm text-white/60">Tank Level</div>
            <div className="text-xs text-blue-400 mt-2">
              Min today: {stats.min_tank_flex.toFixed(1)}%
            </div>
          </div>

          {/* Active Participants */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Users className="text-emerald-400" size={24} />
              </div>
              <TrendingDown className="text-emerald-400" size={20} />
            </div>
            <div className="text-3xl font-bold mb-1">{estimatedParticipants}</div>
            <div className="text-sm text-white/60">Active Participants</div>
            <div className="text-xs text-emerald-400 mt-2">
              {participationRate.toFixed(0)}% participation rate
            </div>
          </div>

          {/* Peak Reduction */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <BarChart3 className="text-purple-400" size={24} />
              </div>
              <span className="text-xs text-white/50">Today</span>
            </div>
            <div className="text-3xl font-bold mb-1">-{demandReduction}<span className="text-lg text-white/60">%</span></div>
            <div className="text-sm text-white/60">Peak Reduction</div>
            <div className="text-xs text-purple-400 mt-2">
              {redHoursReduced} red hours avoided
            </div>
          </div>

        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Demand Timeline Chart */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">24-Hour Demand Forecast</h2>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-rose-400"></div>
                  <span>Without DR</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="w-3 h-0.5 bg-emerald-400"></div>
                  <span>With DR</span>
                </div>
              </div>
            </div>

            {/* Before/After Comparison Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWithout" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="hour"
                    stroke="rgba(255,255,255,0.5)"
                    tick={{fontSize: 12}}
                    interval={3}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    tick={{fontSize: 12}}
                    label={{ value: 'Demand (L/s)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Without DR"
                    stroke="#fb7185"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWithout)"
                  />
                  <Area
                    type="monotone"
                    dataKey="With DR"
                    stroke="#34d399"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWith)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Quota Limit"
                    stroke="#fbbf24"
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Impact Summary */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-rose-400">{stats.max_demand.toFixed(0)} L/s</div>
                <div className="text-xs text-white/60 mt-1">Peak w/o DR</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-emerald-400">{stats.max_demand_flex.toFixed(0)} L/s</div>
                <div className="text-xs text-white/60 mt-1">Peak w/ DR</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-purple-400">-{((stats.max_demand - stats.max_demand_flex) / stats.max_demand * 100).toFixed(1)}%</div>
                <div className="text-xs text-white/60 mt-1">Reduction</div>
              </div>
            </div>
          </div>

          {/* Right Column: Controls */}
          <div className="space-y-6">

            {/* Day Selector */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Forecast Day</h3>
              <div className="relative">
                <select
                  value={selectedDayIndex}
                  onChange={(e) => onDayChange(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-white/40 focus:outline-none"
                  style={{ backgroundImage: 'none' }}
                >
                  {weeklyOptions.map((day) => (
                    <option key={day.index} value={day.index} className="bg-slate-900 text-white">
                      {day.day} - {day.date}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/60" size={18} />
              </div>
              <div className="mt-3 text-xs text-white/50">
                Scenario: {weeklyOptions[selectedDayIndex]?.scenario || 'Normal Operation'}
              </div>
            </div>

            {/* Grid Status */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Grid Status</h3>

              <div className="space-y-3">
                {/* Red Hours */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-rose-400" size={16} />
                    <span className="text-sm">Red Hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-rose-400">{stats.red_hours}</span>
                    <span className="text-xs text-white/40">→</span>
                    <span className="text-sm font-bold text-emerald-400">{stats.red_hours_flex}</span>
                  </div>
                </div>

                {/* Yellow Hours */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="text-amber-400" size={16} />
                    <span className="text-sm">Yellow Hours</span>
                  </div>
                  <div className="text-sm font-bold text-amber-400">
                    {hourlyData.filter(h => h.color_flex === TrafficLight.YELLOW).length}
                  </div>
                </div>

                {/* Green Hours */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                    <span className="text-sm">Green Hours</span>
                  </div>
                  <div className="text-sm font-bold text-emerald-400">
                    {hourlyData.filter(h => h.color_flex === TrafficLight.GREEN).length}
                  </div>
                </div>
              </div>
            </div>

            {/* System Info */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">System Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Quota Limit</span>
                  <span className="font-semibold">792 L/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Warning Threshold</span>
                  <span className="font-semibold">750 L/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Total Meters</span>
                  <span className="font-semibold">~2,400</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Coverage</span>
                  <span className="font-semibold">Melmark</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default OperatorDashboard;
