import React from 'react';
import { Smartphone, BarChart3, Droplet, Users } from 'lucide-react';

interface Props {
  onSelectView: (view: 'customer' | 'operator') => void;
}

const LandingPage: React.FC<Props> = ({ onSelectView }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Droplet className="w-12 h-12 text-blue-400" strokeWidth={2} />
            <h1 className="text-6xl font-black text-white tracking-tight">PeakFlow</h1>
          </div>
          <p className="text-xl text-white/70 font-medium">
            Smart Water Demand Response for Melmark District
          </p>
          <p className="text-sm text-white/50 mt-2">
            Balancing peak demand • Protecting infrastructure • Rewarding participation
          </p>
        </div>

        {/* View Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Resident View Card */}
          <button
            onClick={() => onSelectView('customer')}
            className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] text-left"
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-colors">
              <Smartphone className="w-8 h-8 text-blue-400" strokeWidth={2.5} />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white mb-3">
              I'm a Resident
            </h2>

            {/* Description */}
            <p className="text-white/70 mb-6 leading-relaxed">
              View real-time grid status, shift your water usage to off-peak hours, and earn Impact Points for helping maintain grid stability.
            </p>

            {/* Features */}
            <ul className="space-y-2 text-sm text-white/60">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                Live 24-hour demand forecast
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                Personalized action recommendations
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                Impact Points rewards system
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                Mobile-optimized interface
              </li>
            </ul>

            {/* Arrow Indicator */}
            <div className="mt-8 flex items-center gap-2 text-blue-400 font-semibold group-hover:gap-4 transition-all">
              <span>Enter Mobile View</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>

            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent transition-all pointer-events-none"></div>
          </button>

          {/* Operator View Card */}
          <button
            onClick={() => onSelectView('operator')}
            className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] text-left"
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:bg-emerald-500/30 transition-colors">
              <BarChart3 className="w-8 h-8 text-emerald-400" strokeWidth={2.5} />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white mb-3">
              I'm a Utility Operator
            </h2>

            {/* Description */}
            <p className="text-white/70 mb-6 leading-relaxed">
              Monitor district-wide demand, analyze demand response effectiveness, and manage scenarios to optimize grid performance.
            </p>

            {/* Features */}
            <ul className="space-y-2 text-sm text-white/60">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                Real-time grid monitoring dashboard
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                Before/After demand comparison
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                Scenario analysis tools
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                Participation metrics tracking
              </li>
            </ul>

            {/* Arrow Indicator */}
            <div className="mt-8 flex items-center gap-2 text-emerald-400 font-semibold group-hover:gap-4 transition-all">
              <span>Enter Operator Dashboard</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>

            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-transparent transition-all pointer-events-none"></div>
          </button>

        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-white/40 text-sm">
          <p>Heilbronn-Neckargartach Water District • BWV Partnership</p>
          <p className="mt-2">Future City Hackathon 2025</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
