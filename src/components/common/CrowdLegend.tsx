import React from 'react';
import { CheckCircle2, Activity, AlertTriangle, AlertOctagon } from 'lucide-react';

interface CrowdLegendProps {
  compact?: boolean;
}

export const CrowdLegend: React.FC<CrowdLegendProps> = ({ compact = false }) => {
  const steps = [
    { label: 'Low', range: '<35%', color: 'bg-emerald-500', text: 'text-emerald-400', icon: CheckCircle2 },
    { label: 'Moderate', range: '36–60%', color: 'bg-yellow-500', text: 'text-yellow-400', icon: Activity },
    { label: 'Busy', range: '61–80%', color: 'bg-amber-500', text: 'text-amber-400', icon: AlertTriangle },
    { label: 'Crowded', range: '81–90%', color: 'bg-orange-500', text: 'text-orange-400', icon: AlertTriangle },
    { label: 'Surge', range: '>90%', color: 'bg-red-500', text: 'text-red-400', icon: AlertOctagon, pulse: true },
  ];

  if (compact) {
    return (
      <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400">
        <span className="font-medium text-slate-300">Crowd Scale:</span>
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${s.color} ${s.pulse ? 'animate-pulse' : ''}`} />
              <span className={`font-mono text-[11px] ${s.text}`}>{s.label} ({s.range})</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-xl p-3 bg-slate-900/60 border border-slate-800 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-slate-200">Crowd Density Indicator</span>
        <span className="text-[11px] text-slate-400">Color-Blind Safe</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex flex-col items-center p-1.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-center"
            >
              <div className="flex items-center gap-1 mb-1">
                <span className={`w-2 h-2 rounded-full ${s.color} ${s.pulse ? 'animate-pulse' : ''}`} />
                <Icon className={`w-3 h-3 ${s.text}`} aria-hidden="true" />
              </div>
              <span className="font-medium text-slate-200 text-[11px] leading-tight">{s.label}</span>
              <span className="font-mono text-[10px] text-slate-400 mt-0.5">{s.range}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
