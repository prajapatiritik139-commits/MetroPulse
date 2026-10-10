import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  inverseTrend?: boolean; // e.g. headway down is good
  icon: LucideIcon;
  iconColor?: string;
  subtext?: string;
  isCriticalAlert?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  trendLabel,
  inverseTrend = false,
  icon: Icon,
  iconColor = 'text-teal-400',
  subtext,
  isCriticalAlert = false,
}) => {
  const isPositive = trend !== undefined && trend > 0;
  const isNeutral = trend !== undefined && trend === 0;

  // For positive/negative color determination
  const isGood = inverseTrend ? !isPositive : isPositive;
  const trendColorClass = isNeutral
    ? 'text-slate-500 dark:text-slate-400'
    : isGood
    ? 'text-emerald-700 dark:text-emerald-400'
    : 'text-amber-700 dark:text-amber-400';

  return (
    <div
      className={`relative rounded-2xl p-4 transition-all duration-200 border ${
        isCriticalAlert
          ? 'bg-red-950/20 border-red-500/40 shadow-sm shadow-red-500/10'
          : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
          {title}
        </span>
        <div
          className={`p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 ${iconColor} shrink-0 ${
            isCriticalAlert ? 'animate-pulse' : ''
          }`}
        >
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1.5">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono-numbers">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
        {trend !== undefined ? (
          <div className={`flex items-center gap-1 font-mono-numbers ${trendColorClass}`}>
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : isNeutral ? (
              <Minus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>
              {isPositive ? `+${trend}` : trend}%
            </span>
            {trendLabel && (
              <span className="text-slate-400 font-sans ml-1 text-[11px] truncate">
                {trendLabel}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 text-[11px] truncate">{subtext || 'Nominal'}</span>
        )}

        {isCriticalAlert && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400" />
            Action req.
          </span>
        )}
      </div>
    </div>
  );
};
