import React, { useState, useRef, useEffect } from 'react';
import { SimulationResponse, TrafficLight, DayOption } from '../types';
import { 
  Smartphone, ThumbsUp, AlertTriangle, Droplet, 
  ChevronRight, ChevronDown, Home, BarChart2, Award, User, Check, 
  Zap, Clock, Shield, Leaf, Settings, Bell, HelpCircle,
  ArrowLeft, LogOut, Wifi, Utensils, Coffee, Wind, Bath, Sprout,
  Car, CloudRain, Waves, Sparkles, Square, Apple, Soup, Dog, Fish, Droplets
} from 'lucide-react';
import { selectActions, getEligibleActionCount, formatSuggestedTime } from '../lib/actionSelector';
import { ActionRecommendation } from '../lib/actionLibrary';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  data: SimulationResponse;
  weeklyOptions: DayOption[];
  selectedDayIndex: number;
  onDayChange: (index: number) => void;
  onBack?: () => void;
}

// Helper for gradient transitions
const BackgroundLayer = ({ active, colorClass }: { active: boolean, colorClass: string }) => (
  <div 
    className={`absolute inset-0 bg-gradient-to-b ${colorClass} transition-opacity duration-1000 ease-in-out ${active ? 'opacity-100' : 'opacity-0'}`}
  />
);

// Icon mapping for action recommendations
const getActionIcon = (iconName: string) => {
  const iconMap: Record<string, typeof Droplet> = {
    Utensils, Coffee, Wind, Bath, Sprout, Car, CloudRain, Waves,
    Sparkles, Square, Apple, Soup, Dog, Fish, Droplets, Smartphone, Droplet
  };
  return iconMap[iconName] || Droplet;
};

// Color mapping for action icons
const getActionColor = (index: number) => {
  const colors = [
    { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    { bg: 'bg-purple-500/20', text: 'text-purple-400' },
    { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    { bg: 'bg-rose-500/20', text: 'text-rose-400' }
  ];
  return colors[index % colors.length];
};

const CustomerView: React.FC<Props> = ({ data, weeklyOptions, selectedDayIndex, onDayChange }) => {
  const [currentHourIndex, setCurrentHourIndex] = useState(17); // Start at 5 PM
  const [committedActions, setCommittedActions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'home' | 'usage' | 'rewards' | 'profile'>('home');
  
  // Profile Sub-view state
  const [profileView, setProfileView] = useState<'main' | 'settings' | 'notifications' | 'help'>('main');

  // Settings State
  const [settings, setSettings] = useState({
    dataSharing: true,
    autoShift: false,
    peakAlerts: true,
    weeklyReport: true
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Scroll ref for timeline
  const timelineRef = useRef<HTMLDivElement>(null);

  // Ensure data exists for the specific hour
  const getHourData = (index: number) => {
    const wrappedIndex = index % 24;
    return data.hourly_data[wrappedIndex];
  };

  const currentData = getHourData(currentHourIndex);

  // Get smart action recommendations based on current context
  const selectedActions = selectActions(
    currentHourIndex,
    currentData.color_flex,
    new Date(),
    2 // Show 2 actions
  );

  const eligibleActionCount = getEligibleActionCount(
    currentHourIndex,
    currentData.color_flex,
    new Date()
  );

  // Generate a static 24h day view for the timeline
  const dayHours = Array.from({ length: 24 }, (_, i) => {
    return {
      index: i,
      displayHour: i,
      data: getHourData(i)
    };
  });

  // Create an ordered list starting from the current hour for the "Upcoming" view
  // This handles the requirement to not show previous hours
  const upcomingHours = [
    ...dayHours.slice(currentHourIndex),
    ...dayHours.slice(0, currentHourIndex)
  ];

  const toggleAction = (id: string) => {
    const newSet = new Set(committedActions);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setCommittedActions(newSet);
  };

  // Theme configuration
  const getTheme = (status: TrafficLight) => {
    switch(status) {
      case TrafficLight.RED: 
        return {
          statusText: 'Critical Peak',
          subText: 'Grid under heavy stress. Shift usage now.',
          gaugeColor: '#f43f5e',
          accentColor: 'text-rose-400',
          buttonBg: 'bg-rose-500',
          icon: <AlertTriangle className="w-8 h-8 text-rose-500 mb-2 animate-pulse" />
        };
      case TrafficLight.YELLOW: 
        return {
          statusText: 'High Demand',
          subText: 'Grid load is high. Conserve if possible.',
          gaugeColor: '#fbbf24',
          accentColor: 'text-amber-400',
          buttonBg: 'bg-amber-500',
          icon: <Clock className="w-8 h-8 text-amber-400 mb-2" />
        };
      case TrafficLight.GREEN: 
      default:
        return {
          statusText: 'Grid Healthy',
          subText: 'Usage levels are normal. Green light!',
          gaugeColor: '#10b981',
          accentColor: 'text-emerald-400',
          buttonBg: 'bg-emerald-500',
          icon: <Leaf className="w-8 h-8 text-emerald-500 mb-2" />
        };
    }
  };

  const theme = getTheme(currentData.color_flex);

  // CSS for hiding scrollbar
  const hideScrollbarStyle = `
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `;

  // Toggle Switch Component
  const ToggleSwitch = ({ isOn, onToggle }: { isOn: boolean, onToggle: () => void }) => (
    <button 
      onClick={onToggle} 
      className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${isOn ? 'bg-emerald-500' : 'bg-slate-600'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isOn ? 'left-5' : 'left-1'}`}></div>
    </button>
  );

  // --- Sub-Views ---

  const renderHome = () => (
    <div className="flex flex-col min-h-full pt-2 pb-32">
      
      {/* Main Gauge Section */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-4 pb-8 min-h-[320px]">
        <div className="relative w-72 h-72 flex items-center justify-center">
          {/* Outer Glow */}
          <div className="absolute inset-0 rounded-full blur-3xl opacity-20 transition-colors duration-1000" style={{ backgroundColor: theme.gaugeColor }}></div>
          
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Track */}
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            {/* Progress */}
            <circle 
              cx="50" cy="50" r="42" fill="none" 
              stroke={theme.gaugeColor} 
              strokeWidth="4" 
              strokeDasharray="264"
              strokeDashoffset={264 * (1 - Math.min(currentData.stress_index_flex, 1))} 
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            {theme.icon}
            <h2 className="text-4xl font-bold text-white tracking-tighter mb-1 transition-all">{theme.statusText}</h2>
            <p className={`text-sm font-medium text-white/80 max-w-[200px] leading-relaxed`}>
              {theme.subText}
            </p>
          </div>
        </div>
      </div>

      {/* Day Selector Dropdown */}
      {weeklyOptions.length > 0 && (
        <div className="px-6 mb-4 relative z-10">
          <select
            value={selectedDayIndex}
            onChange={(e) => onDayChange(Number(e.target.value))}
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 text-white text-sm font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-white/40 focus:outline-none transition-all hover:bg-white/15"
            style={{ backgroundImage: 'none' }}
          >
            {weeklyOptions.map((day) => (
              <option key={day.index} value={day.index} className="bg-slate-900 text-white">
                {day.day}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-white/60" size={18} />
        </div>
      )}

      {/* Timeline Forecast */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center justify-between px-6 mb-3">
           <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">
             {weeklyOptions[selectedDayIndex]?.day || 'Forecast'} ({weeklyOptions[selectedDayIndex]?.date || '24h'})
           </h3>
        </div>
        
        <div 
          ref={timelineRef}
          className="flex gap-3 overflow-x-auto py-4 px-6 no-scrollbar snap-x w-full"
        >
          {dayHours.map((h, idx) => {
            const isSelected = h.index === currentHourIndex;
            const isPast = h.index < currentHourIndex;
            const statusColor = 
              h.data.color_flex === TrafficLight.RED ? 'bg-rose-500 shadow-rose-500/40' : 
              h.data.color_flex === TrafficLight.YELLOW ? 'bg-amber-500 shadow-amber-500/40' : 
              'bg-emerald-500 shadow-emerald-500/40';
            
            return (
              <button 
                key={`${h.index}-${idx}`}
                onClick={() => {
                  setCurrentHourIndex(h.index);
                }}
                className={`snap-start relative flex-shrink-0 w-16 h-24 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 border border-transparent
                  ${isSelected ? 'bg-white/20 backdrop-blur-md ring-1 ring-white/50 z-10 shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'bg-white/5 hover:bg-white/10'}
                  ${isPast ? 'opacity-40' : 'opacity-70'}
                `}
              >
                <span className="text-xs font-bold text-white">{h.displayHour}:00</span>
                <div className={`w-2 h-2 rounded-full shadow-lg ${statusColor}`}></div>
                <div className="h-8 w-1 rounded-full bg-white/10 overflow-hidden flex items-end">
                   <div 
                    className={`w-full rounded-full transition-all duration-500 ${statusColor}`} 
                    style={{ height: `${Math.min(h.data.stress_index_flex * 100, 100)}%` }}
                   ></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions Section */}
      <div className="px-6 relative z-10 space-y-4">
        <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">
          {currentData.color_flex === TrafficLight.GREEN ? 'Grid Status' : 'Recommended Actions'}
        </h3>

        {currentData.color_flex !== TrafficLight.GREEN ? (
          <div className="space-y-3">
            {/* Dynamic Action Cards */}
            {selectedActions.length > 0 ? (
              selectedActions.map((action, index) => {
                const Icon = getActionIcon(action.icon);
                const color = getActionColor(index);
                const suggestedTime = formatSuggestedTime(action.suggestedTime.start, currentHourIndex, new Date());
                
                return (
                  <div key={action.id} className="group relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 transition-all active:scale-[0.98]">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-10 h-10 rounded-full ${color.bg} flex items-center justify-center ${color.text}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-sm">{action.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                            {action.waterUsage}L • +{action.points} pts
                          </span>
                          <span className="text-xs text-white/50">{suggestedTime}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleAction(action.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          committedActions.has(action.id) 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                            : 'bg-white/10 text-white/50 hover:bg-white/20'
                        }`}
                      >
                        {committedActions.has(action.id) ? <Check size={20} strokeWidth={3} /> : <ChevronRight size={20} />}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-sm text-white/60">No actions available at this time</p>
              </div>
            )}
            
            {/* Action variety indicator */}
            {eligibleActionCount > 0 && (
              <div className="text-center">
                <p className="text-xs text-white/40">
                  Showing {selectedActions.length} of {eligibleActionCount} available actions
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center text-center backdrop-blur-md">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 shadow-inner shadow-emerald-500/10">
              <ThumbsUp size={28} strokeWidth={2.5} />
            </div>
            <h4 className="text-white font-bold text-lg">All Clear!</h4>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              Thank you for maintaining grid stability. You are contributing to a sustainable Melmark.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderUsage = () => {
    // Prepare chart data from the day timeline
    const chartData = dayHours.map(h => ({
      name: `${h.displayHour}:00`,
      value: h.data.demand_flex,
    }));

    return (
      <div className="flex flex-col h-full pt-8 px-6 pb-32 text-white">
        <h2 className="text-2xl font-bold mb-6">Your Consumption</h2>
        
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <BarChart2 className="text-blue-400" size={24} />
            </div>
            <div>
              <div className="text-sm text-white/60">Daily Average</div>
              <div className="text-xl font-bold">142 Liters</div>
            </div>
          </div>
          
          <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: 'rgba(255,255,255,0.5)'}} 
                    interval={3}
                  />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}}
                    itemStyle={{color: '#fff'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorUsage)" 
                  />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider">Insights</h3>
          <div className="bg-white/5 rounded-2xl p-4 flex items-start gap-4">
             <Zap className="text-amber-400 shrink-0" />
             <div>
               <h4 className="font-bold text-sm">Peak Shifter</h4>
               <p className="text-xs text-white/60 mt-1">You successfully shifted 15% of your usage out of red zones this week.</p>
             </div>
          </div>
        </div>
      </div>
    );
  };


  const renderRewards = () => (
    <div className="flex flex-col h-full pt-8 px-6 pb-32 text-white overflow-y-auto">
       <div className="text-center mb-8">
         <h2 className="text-2xl font-bold">Your Impact</h2>
         <p className="text-white/60 text-sm mt-2">Points earned by shifting peak demand</p>
       </div>

       {/* Point Balance Card */}
       <div className="bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 rounded-3xl p-6 mb-6 relative overflow-hidden">
         <div className="relative z-10 text-center">
           <span className="text-xs text-emerald-200 uppercase tracking-wider">Total Impact Points</span>
           <div className="text-6xl font-black text-white mt-2 drop-shadow-lg">1,240</div>
           <div className="text-sm text-emerald-300 mt-2">Next milestone: 1,500 pts</div>
         </div>

         {/* Progress Bar */}
         <div className="relative z-10 mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
           <div className="h-full bg-emerald-400" style={{ width: '82.6%' }}></div>
         </div>

         <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/30 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2"></div>
       </div>

       {/* This Month Impact */}
       <div className="bg-white/10 rounded-2xl p-4 mb-6">
         <div className="flex items-center justify-between mb-2">
           <span className="text-sm text-white/60">This Month</span>
           <span className="text-2xl font-bold text-emerald-400">+380 pts</span>
         </div>
         <div className="text-xs text-white/40">38 liters shifted from peak hours</div>
       </div>

       {/* Redemption Tiers */}
       <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Reward Tiers</h3>
       <div className="space-y-3">

         {/* 500 pts - Unlocked */}
         <div className="bg-white/10 rounded-2xl p-4 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check size={18} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm">Early Adopter</div>
                  <div className="text-xs text-white/60">Exclusive badge</div>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-400">500 pts</span>
            </div>
         </div>

         {/* 1,000 pts - Unlocked */}
         <div className="bg-white/10 rounded-2xl p-4 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check size={18} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm">Tree Planter</div>
                  <div className="text-xs text-white/60">1 tree planted in your name</div>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-400">1,000 pts</span>
            </div>
         </div>

         {/* 1,500 pts - Locked */}
         <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white/30"></div>
                </div>
                <div>
                  <div className="font-bold text-sm">Bill Credit</div>
                  <div className="text-xs text-white/60">€5 off next water bill</div>
                </div>
              </div>
              <span className="text-sm font-bold text-white/40">1,500 pts</span>
            </div>
         </div>

         {/* 5,000 pts - Locked */}
         <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white/30"></div>
                </div>
                <div>
                  <div className="font-bold text-sm">Grid Guardian</div>
                  <div className="text-xs text-white/60">VIP status + priority support</div>
                </div>
              </div>
              <span className="text-sm font-bold text-white/40">5,000 pts</span>
            </div>
         </div>

       </div>
    </div>
  );



  const renderProfile = () => {
    if (profileView === 'settings') {
      return (
        <div className="flex flex-col h-full pt-8 px-6 pb-32 text-white animate-in slide-in-from-right duration-300">
          <button onClick={() => setProfileView('main')} className="flex items-center gap-2 text-white/60 hover:text-white mb-6">
            <ArrowLeft size={18} /> Back
          </button>
          <h2 className="text-2xl font-bold mb-6">Smart Meter Settings</h2>
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-4 flex justify-between items-center cursor-pointer" onClick={() => toggleSetting('dataSharing')}>
               <span>Data Sharing</span>
               <ToggleSwitch isOn={settings.dataSharing} onToggle={() => toggleSetting('dataSharing')} />
            </div>
            <div className="bg-white/10 rounded-xl p-4 flex justify-between items-center cursor-pointer" onClick={() => toggleSetting('autoShift')}>
               <span>Auto-Shift Devices</span>
               <ToggleSwitch isOn={settings.autoShift} onToggle={() => toggleSetting('autoShift')} />
            </div>
             <p className="text-xs text-white/40 px-2">
              When enabled, PeakFlow can communicate with compatible washing machines to delay cycles during red hours.
            </p>
          </div>
        </div>
      );
    }

    if (profileView === 'notifications') {
       return (
        <div className="flex flex-col h-full pt-8 px-6 pb-32 text-white animate-in slide-in-from-right duration-300">
          <button onClick={() => setProfileView('main')} className="flex items-center gap-2 text-white/60 hover:text-white mb-6">
            <ArrowLeft size={18} /> Back
          </button>
          <h2 className="text-2xl font-bold mb-6">Notifications</h2>
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-4 cursor-pointer" onClick={() => toggleSetting('peakAlerts')}>
               <div className="flex justify-between mb-1 items-center">
                 <span className="font-bold">Peak Alerts</span>
                 <ToggleSwitch isOn={settings.peakAlerts} onToggle={() => toggleSetting('peakAlerts')} />
               </div>
               <p className="text-xs text-white/50">Get notified 30 mins before a red hour starts.</p>
            </div>
             <div className="bg-white/10 rounded-xl p-4 cursor-pointer" onClick={() => toggleSetting('weeklyReport')}>
               <div className="flex justify-between mb-1 items-center">
                 <span className="font-bold">Weekly Report</span>
                 <ToggleSwitch isOn={settings.weeklyReport} onToggle={() => toggleSetting('weeklyReport')} />
               </div>
               <p className="text-xs text-white/50">Summary of your savings and points.</p>
            </div>
          </div>
        </div>
      );
    }

    if (profileView === 'help') {
       return (
        <div className="flex flex-col h-full pt-8 px-6 pb-32 text-white animate-in slide-in-from-right duration-300">
          <button onClick={() => setProfileView('main')} className="flex items-center gap-2 text-white/60 hover:text-white mb-6">
            <ArrowLeft size={18} /> Back
          </button>
          <h2 className="text-2xl font-bold mb-6">Help & Support</h2>
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-4">
               <h4 className="font-bold mb-2">What is a Red Hour?</h4>
               <p className="text-xs text-white/70 leading-relaxed">
                 A Red Hour indicates that the local water infrastructure is under high stress. Reducing usage helps preventing tank depletion.
               </p>
            </div>
            <button className="w-full bg-blue-600 py-3 rounded-xl font-bold text-sm">Contact Support</button>
          </div>
        </div>
      );
    }

    // Main Profile View
    return (
      <div className="flex flex-col h-full pt-8 px-6 pb-32 text-white animate-in fade-in duration-300">
        <h2 className="text-2xl font-bold mb-6">My Profile</h2>
        <div className="bg-white/10 rounded-3xl p-6 flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-2xl font-bold text-emerald-950 shadow-lg shadow-emerald-500/20">
            13
          </div>
          <div>
            <h3 className="text-lg font-bold">13thirty8</h3>
            <p className="text-white/60 text-sm">Melmark District</p>
            <div className="flex items-center gap-2 mt-2">
              <Shield size={14} className="text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Verified Resident</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={() => setProfileView('settings')} className="w-full bg-white/5 hover:bg-white/10 p-4 rounded-2xl text-left flex justify-between items-center transition">
            <div className="flex items-center gap-3">
               <Settings size={18} className="text-white/70" />
               <span className="font-medium text-sm">Smart Meter Settings</span>
            </div>
            <ChevronRight size={16} className="text-white/40" />
          </button>
          <button onClick={() => setProfileView('notifications')} className="w-full bg-white/5 hover:bg-white/10 p-4 rounded-2xl text-left flex justify-between items-center transition">
             <div className="flex items-center gap-3">
               <Bell size={18} className="text-white/70" />
               <span className="font-medium text-sm">Notifications</span>
            </div>
            <ChevronRight size={16} className="text-white/40" />
          </button>
          <button onClick={() => setProfileView('help')} className="w-full bg-white/5 hover:bg-white/10 p-4 rounded-2xl text-left flex justify-between items-center transition">
             <div className="flex items-center gap-3">
               <HelpCircle size={18} className="text-white/70" />
               <span className="font-medium text-sm">Help & Support</span>
            </div>
            <ChevronRight size={16} className="text-white/40" />
          </button>
           <button className="w-full bg-white/5 hover:bg-rose-500/20 p-4 rounded-2xl text-left flex justify-between items-center transition group">
             <div className="flex items-center gap-3">
               <LogOut size={18} className="text-rose-400" />
               <span className="font-medium text-sm text-rose-400">Log Out</span>
            </div>
          </button>
        </div>
        
        <div className="mt-auto text-center pt-8">
          <p className="text-xs text-white/30">Version 1.0.2 (Hackathon Build)</p>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="flex justify-center h-full items-center p-4 font-sans perspective-[1200px] transition-all duration-1000 ease-in-out w-full"
      style={{
        background: `radial-gradient(circle at center, ${theme.gaugeColor}30 0%, #0f172a 70%)`
      }}
    >
      <style>{hideScrollbarStyle}</style>
      {/* Phone Frame */}
      <div className="w-[375px] h-[812px] bg-slate-950 rounded-[3rem] shadow-2xl border-[8px] border-slate-900 overflow-hidden relative flex flex-col ring-1 ring-white/20 transform transition-all hover:scale-[1.01] duration-500">
        
        {/* Dynamic Background System */}
        <div className="absolute inset-0 z-0">
          <BackgroundLayer active={theme.statusText === 'Critical Peak'} colorClass="from-rose-900 via-slate-900 to-slate-950" />
          <BackgroundLayer active={theme.statusText === 'High Demand'} colorClass="from-amber-900 via-slate-900 to-slate-950" />
          <BackgroundLayer active={theme.statusText === 'Grid Healthy'} colorClass="from-emerald-900 via-slate-900 to-slate-950" />
          
          {/* Noise Texture for premium feel */}
          <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        </div>

        {/* Status Bar Area */}
        <div className="relative z-20 px-8 pt-5 pb-2 flex justify-between items-center text-white text-xs font-medium">
          <span className="tracking-wide">{currentHourIndex}:00</span>
          <div className="flex gap-1.5">
             <Wifi size={14} />
             <div className="w-6 h-3 bg-white rounded-[2px] relative overflow-hidden">
                <div className="absolute inset-0 bg-black/20 w-1/4 ml-auto"></div>
             </div>
          </div>
        </div>

        {/* Top Header (Context aware) */}
        <div className="relative z-20 px-6 py-2 flex items-center justify-between min-h-[44px]">
          {activeTab === 'home' && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.gaugeColor }}></span>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live Grid</span>
            </div>
          )}
          {activeTab !== 'home' && <div />} {/* Spacer */}
          
          <div className="flex gap-3">
            <div className="flex flex-col items-end">
               <span className="text-[10px] text-white/60 font-bold uppercase">Impact</span>
               <span className="text-sm font-bold text-white">1,240</span>
            </div>
          </div>
        </div>

        {/* Main Content Area with Tab Switching */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 no-scrollbar">
           {activeTab === 'home' && renderHome()}
           {activeTab === 'usage' && renderUsage()}
           {activeTab === 'rewards' && renderRewards()}
           {activeTab === 'profile' && renderProfile()}
        </div>

        {/* Bottom Glass Navigation */}
        <div className="absolute bottom-0 left-0 right-0 h-[88px] bg-black/40 backdrop-blur-xl border-t border-white/5 flex items-start justify-between px-6 pt-4 pb-8 z-30">
           <button 
            onClick={() => setActiveTab('home')} 
            className={`flex flex-col items-center gap-1.5 transition-all w-14 ${activeTab === 'home' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
          >
             <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
             <span className="text-[10px] font-medium">Home</span>
           </button>
           
           <button 
             onClick={() => setActiveTab('usage')}
             className={`flex flex-col items-center gap-1.5 transition-all w-14 ${activeTab === 'usage' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
            >
             <BarChart2 size={24} strokeWidth={activeTab === 'usage' ? 2.5 : 2} />
             <span className="text-[10px] font-medium">Usage</span>
           </button>
           
           <button 
             onClick={() => setActiveTab('rewards')}
             className={`flex flex-col items-center gap-1.5 transition-all w-14 ${activeTab === 'rewards' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
           >
             <Award size={24} strokeWidth={activeTab === 'rewards' ? 2.5 : 2} />
             <span className="text-[10px] font-medium">Rewards</span>
           </button>

           <button 
             onClick={() => {
               setActiveTab('profile');
               setProfileView('main');
             }}
             className={`flex flex-col items-center gap-1.5 transition-all w-14 ${activeTab === 'profile' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
           >
             <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
             <span className="text-[10px] font-medium">Profile</span>
           </button>
        </div>
        
        {/* iOS Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-40"></div>

      </div>
    </div>
  );
};

export default CustomerView;