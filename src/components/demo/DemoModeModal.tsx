import React, { useState } from 'react';
import { useMetroStore } from '../../store/metroStore';
import {
  Sparkles,
  Play,
  Pause,
  X,
  FastForward,
  Clock,
  ShieldAlert,
  Bus,
  CheckCircle2,
  ArrowRight,
  Flame,
  Activity,
  Eye,
  Maximize2,
} from 'lucide-react';

export const DemoModeModal: React.FC = () => {
  const isDemoModeActive = useMetroStore((state) => state.isDemoModeActive);
  const stopDemoMode = useMetroStore((state) => state.stopDemoMode);
  const demoPhase = useMetroStore((state) => state.demoPhase);
  const demoSeconds = useMetroStore((state) => state.demoSeconds);
  const advanceDemoPhase = useMetroStore((state) => state.advanceDemoPhase);
  const isSimulating = useMetroStore((state) => state.isSimulating);
  const toggleSimulation = useMetroStore((state) => state.toggleSimulation);

  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  if (!isDemoModeActive) return null;

  const totalDuration = 120; // 2 minutes scripted scenario
  const progressPercent = Math.min(100, Math.round((demoSeconds / totalDuration) * 100));

  const phases = [
    {
      num: 1,
      title: 'Stadium Crowd Surge',
      range: '0:00 – 0:30',
      desc: 'Mass commuter surge at Motera Stadium & Old High Court following cricket tournament egress (96% capacity).',
      icon: Flame,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    {
      num: 2,
      title: 'Line 1 Train Breakdown',
      range: '0:30 – 1:00',
      desc: 'Traction inverter failure on Train TR-101 stalled near Sector 16. Headway widens to 6.4m.',
      icon: ShieldAlert,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    },
    {
      num: 3,
      title: 'Automated Intermodal Bus Response',
      range: '1:00 – 1:30',
      desc: 'Smart dispatch injects 4 AMTS Feeder 42 shuttles & opens bidirectional emergency egress turnstiles.',
      icon: Bus,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    },
    {
      num: 4,
      title: 'Full Network Recovery',
      range: '1:30 – 2:00',
      desc: 'Inverter bypassed, platform cleared, headway compressed back to nominal 3.2m with 98.4% on-time.',
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
  ];

  const currentPhaseInfo = phases[Math.min(3, Math.max(0, demoPhase - 1))];

  // Minimized Live View Floating Bar (Allows watching map & dashboard changes live during drill)
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl animate-bounce-in select-none pointer-events-auto">
        <div className="bg-[#0C182A]/95 backdrop-blur-md text-white rounded-2xl border-2 border-teal-500 shadow-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 ring-4 ring-teal-500/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold truncate text-teal-300">
                  Live Drill: Phase {demoPhase}/4 — {currentPhaseInfo.title}
                </span>
                <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-semibold shrink-0">
                  {Math.floor(demoSeconds / 60)}:{(demoSeconds % 60).toString().padStart(2, '0')} / 2:00
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate hidden sm:block mt-0.5">
                {currentPhaseInfo.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => advanceDemoPhase()}
              className="px-2.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors shadow-xs"
              title="Advance to next scenario phase"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Next Phase</span>
            </button>

            <button
              onClick={() => setIsMinimized(false)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors"
              title="Expand impact metrics and full drill controls"
            >
              <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Expand</span>
            </button>

            <button
              onClick={stopDemoMode}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Conclude Drill"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full Screen Modal Overlay
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-[#0C182A] text-white rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0B1F3A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">MetroPulse 2-Minute Scripted Demo Scenario</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500 text-slate-950">
                  LIVE DRILL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Surge ➔ Train Breakdown ➔ Intermodal Bus Response ➔ Network Recovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Show live view button to minimize overlay so map is visible */}
            <button
              onClick={() => setIsMinimized(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 text-xs font-semibold transition-all shadow-xs"
              title="Minimize overlay to watch map and network changes live"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Show live view</span>
            </button>

            <button
              onClick={stopDemoMode}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Demo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Progress Timeline Bar */}
          <div className="space-y-2 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Elapsed: {Math.floor(demoSeconds / 60)}:{(demoSeconds % 60).toString().padStart(2, '0')} / 2:00</span>
              </span>
              <span className="font-mono text-teal-300 font-bold">
                Phase {demoPhase} of 4: {currentPhaseInfo.title}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-teal-500 via-amber-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* 4 Stage Pills */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {phases.map((p) => {
                const isPast = demoPhase > p.num;
                const isCurrent = demoPhase === p.num;
                return (
                  <div
                    key={p.num}
                    className={`p-1.5 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-teal-500/20 border-teal-500/60 text-teal-300 font-bold shadow-xs'
                        : isPast
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 opacity-80'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span className="block text-[10px] font-mono leading-tight">{p.range}</span>
                    <span className="text-[10px] truncate block leading-tight">{p.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Phase Callout */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${currentPhaseInfo.color}`}>
            <currentPhaseInfo.icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block">{currentPhaseInfo.title}</span>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{currentPhaseInfo.desc}</p>
            </div>
          </div>

          {/* Before vs After Impact Panel */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                Before vs After Impact Panel
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                +34% Overall Efficiency Gain
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Metric 1 */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Avg Dwell Delay</span>
                <div className="flex items-center justify-center gap-1.5 font-mono">
                  <span className="text-xs text-rose-400 line-through">4.8 min</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-sm font-bold text-emerald-400">1.2 min</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold block">-75% Delay</span>
              </div>

              {/* Metric 2 */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Egress Clearance</span>
                <div className="flex items-center justify-center gap-1.5 font-mono">
                  <span className="text-xs text-rose-400 line-through">220/min</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-sm font-bold text-emerald-400">580/min</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold block">+163% Flow</span>
              </div>

              {/* Metric 3 */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">On-Time Reliability</span>
                <div className="flex items-center justify-center gap-1.5 font-mono">
                  <span className="text-xs text-rose-400 line-through">89.5%</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-sm font-bold text-emerald-400">98.4%</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold block">+8.9% OTP</span>
              </div>

              {/* Metric 4 */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Corridor Congestion</span>
                <div className="flex items-center justify-center gap-1.5 font-mono">
                  <span className="text-xs text-rose-400 line-through">96%</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-sm font-bold text-emerald-400">52%</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold block">-44% Peak Load</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#0B1F3A] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSimulation}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating ? 'Pause Drill' : 'Resume Drill'}</span>
            </button>

            <button
              onClick={() => advanceDemoPhase()}
              className="px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-teal-500/30 transition-colors"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Next Phase ({demoPhase < 4 ? demoPhase + 1 : 'Finish'})</span>
            </button>

            <button
              onClick={() => setIsMinimized(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Show Live View</span>
            </button>
          </div>

          <button
            onClick={stopDemoMode}
            className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
          >
            Close Impact Panel
          </button>
        </div>
      </div>
    </div>
  );
};
