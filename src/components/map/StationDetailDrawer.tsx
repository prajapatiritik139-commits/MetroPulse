import React from 'react';
import { useMetroStore } from '../../store/metroStore';
import { StatusBadge } from '../common/StatusBadge';
import {
  X,
  Users,
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import {
  formatPercentage,
  formatPassengers,
  formatTemperature,
  formatHealthScore,
} from '../../utils/formatters';

interface StationDetailDrawerProps {
  onClose: () => void;
}

export const StationDetailDrawer: React.FC<StationDetailDrawerProps> = ({ onClose }) => {
  const selectedStationId = useMetroStore((state) => state.selectedStationId);
  const stations = useMetroStore((state) => state.stations);
  const assets = useMetroStore((state) => state.assets);
  const lines = useMetroStore((state) => state.lines);
  const executeCrowdAction = useMetroStore((state) => state.executeCrowdAction);
  const addToast = useMetroStore((state) => state.addToast);

  const station = stations.find((s) => s.id === selectedStationId);
  if (!station) return null;

  const stationAssets = assets.filter((a) => a.stationId === station.id);
  const stationLines = lines.filter((l) => station.lines.includes(l.id));

  const handleQuickCommand = (command: string) => {
    addToast('Station Order Dispatched', `${command} executed for ${station.name}.`, 'success');
  };

  return (
    <div
      className="w-full lg:w-96 shrink-0 bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-5 flex flex-col max-h-[85vh] overflow-y-auto"
      role="region"
      aria-label={`Details for ${station.name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {station.code}
            </span>
            {station.isInterchange && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30 uppercase">
                Interchange
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
            {station.name}
          </h2>
          <div className="flex items-center gap-1.5 mt-1">
            {stationLines.map((line) => (
              <span
                key={line.id}
                className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: line.color }}
              >
                {line.name}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close station detail panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Real-time Crowd Status */}
      <div className="py-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Live Crowd Level
          </span>
          <StatusBadge type="crowd" value={station.crowdLevel} size="sm" />
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold font-mono-numbers text-slate-900 dark:text-slate-100">
              {formatPercentage(station.crowdPercentage)}
            </span>
            <span className="text-xs text-slate-400">capacity</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {formatPassengers(station.passengerVolume)} / {formatPassengers(station.capacity)} pax
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-500 ${
              station.crowdPercentage > 90
                ? 'bg-red-500'
                : station.crowdPercentage > 80
                ? 'bg-orange-500'
                : station.crowdPercentage > 60
                ? 'bg-amber-500'
                : station.crowdPercentage > 35
                ? 'bg-yellow-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.round(station.crowdPercentage)}%` }}
          />
        </div>

        {/* Inflow / Outflow */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Inflow</span>
            </div>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
              {Math.round(station.inflowRate)} <span className="text-[10px] text-slate-400">/min</span>
            </span>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400">
              <ArrowUpRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Outflow</span>
            </div>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
              {Math.round(station.outflowRate)} <span className="text-[10px] text-slate-400">/min</span>
            </span>
          </div>
        </div>
      </div>

      {/* Forecast Next 15 / 30 / 60 mins */}
      <div className="py-4 border-b border-slate-100 dark:border-slate-800/80">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2.5">
          Surge Forecast (Next Hour)
        </span>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-400 block">+15 min</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 block">
              {formatPercentage(station.forecast.minute15)}
            </span>
            <span className="text-[10px] text-slate-400">
              {station.forecast.minute15 > station.crowdPercentage ? 'Surging' : 'Easing'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-400 block">+30 min</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 block">
              {formatPercentage(station.forecast.minute30)}
            </span>
            <span className="text-[10px] text-slate-400">
              {station.forecast.minute30 > 80 ? 'Heavy load' : 'Manageable'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-400 block">+60 min</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 block">
              {formatPercentage(station.forecast.minute60)}
            </span>
            <span className="text-[10px] text-slate-400">Projected</span>
          </div>
        </div>
      </div>

      {/* Station Assets */}
      <div className="py-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Station Asset Fleet ({stationAssets.length})
          </span>
          <span className="text-[11px] text-teal-700 dark:text-teal-400 font-mono">Live Telemetry</span>
        </div>

        {stationAssets.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No assets assigned to this station.</p>
        ) : (
          <div className="space-y-2">
            {stationAssets.map((asset) => (
              <div
                key={asset.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-200 truncate max-w-[180px]">
                    {asset.name}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="capitalize">{asset.type.replace('_', ' ')}</span>
                    <span>·</span>
                    <span className="font-mono">{formatTemperature(asset.temperatureCelsius)}</span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <span
                    className={`font-mono font-bold ${
                      asset.healthScore < 60
                        ? 'text-red-700 dark:text-red-400'
                        : asset.healthScore < 75
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {formatHealthScore(asset.healthScore)}
                  </span>
                  <StatusBadge type="risk" value={asset.failureRisk} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Operational Commands */}
      <div className="pt-4 space-y-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          Station Dispatch Commands
        </span>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => handleQuickCommand('Open emergency egress gates')}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-200 text-xs font-medium transition-colors text-left flex items-center justify-between"
          >
            <span>Open Auxiliary Egress Gates</span>
            <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          </button>
          <button
            onClick={() => handleQuickCommand('Deploy crowd marshals')}
            className="w-full py-2 px-3 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 text-xs font-semibold transition-colors text-left flex items-center justify-between shadow-sm"
          >
            <span>Deploy Roving Crowd Marshals</span>
            <Users className="w-3.5 h-3.5 text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
