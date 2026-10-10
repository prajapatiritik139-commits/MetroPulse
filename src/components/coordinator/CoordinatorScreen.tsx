import React from 'react';
import { useMetroStore } from '../../store/metroStore';
import {
  Bus,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Radio,
  Sliders,
  Check,
  X,
  Gauge,
  Leaf,
  Navigation,
} from 'lucide-react';
import { formatPercentage, formatHeadway } from '../../utils/formatters';

export const CoordinatorScreen: React.FC = () => {
  const feederBuses = useMetroStore((state) => state.feederBuses);
  const disruptions = useMetroStore((state) => state.disruptions);
  const approveDisruptionAction = useMetroStore((state) => state.approveDisruptionAction);
  const rejectDisruptionAction = useMetroStore((state) => state.rejectDisruptionAction);
  const stations = useMetroStore((state) => state.stations);
  const effectiveOnline = useMetroStore((state) => state.effectiveOnline);

  const electricCount = feederBuses.filter((b) => b.electricFleet).length;
  const pendingDirectives = disruptions.filter((d) => d.status === 'pending');

  return (
    <div className="space-y-5" role="region" aria-label="City Transport Coordinator View">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                City Intermodal Transport Coordination
              </h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Coordinator Console
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Surface feeder bus fleet synchronization, bus-bridge deployment, and corridor signal priority.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5" />
            <span>{electricCount}/{feederBuses.length} EV Fleet</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Active Feeder Buses</span>
            <Bus className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {feederBuses.length} Units
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1">
            100% route coverage active
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Avg Feeder Headway</span>
            <Clock className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            5.2 min
          </div>
          <div className="text-[11px] text-teal-400 font-semibold mt-1">
            Synchronized with metro dwells
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Pending Directives</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {pendingDirectives.length} Actions
          </div>
          <div className="text-[11px] text-amber-400 font-semibold mt-1">
            {pendingDirectives.length > 0 ? 'Requires coordinator approval' : 'All directives dispatched'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Transfer Satisfaction</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            96.4%
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1">
            +1.2% vs baseline
          </div>
        </div>
      </div>

      {/* Disruption Response & Playbook Approvals */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Intermodal Disruption Directives & Auto-Response
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {!effectiveOnline && '(Offline Queue Active)'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {disruptions.map((disr) => {
            const station = stations.find((s) => s.id === disr.stationId);
            const isPending = disr.status === 'pending';
            const isApproved = disr.status === 'approved';

            return (
              <div
                key={disr.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isApproved
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : disr.status === 'rejected'
                    ? 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {disr.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isApproved
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : disr.status === 'rejected'
                          ? 'bg-slate-500/20 text-slate-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {disr.status} {disr.syncStatus === 'pending' && '· Pending Sync'}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {disr.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    {disr.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="text-[11px] text-teal-400 font-semibold">
                    Station: {station?.name || disr.stationId}
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => approveDisruptionAction(disr.id)}
                        className="px-2.5 py-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => rejectDisruptionAction(disr.id)}
                        className="p-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500 text-xs transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {isApproved && (
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Dispatched
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Surface Feeder Bus Fleet Live Telemetry */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Active Feeder Bus Fleet Telemetry
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Live GPS Tracking
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="pb-2.5 font-semibold">Bus Route</th>
                <th className="pb-2.5 font-semibold">Assigned Station</th>
                <th className="pb-2.5 font-semibold">Destination</th>
                <th className="pb-2.5 font-semibold">Status</th>
                <th className="pb-2.5 font-semibold">Pax Load</th>
                <th className="pb-2.5 font-semibold">Arrival ETA</th>
                <th className="pb-2.5 font-semibold">Powertrain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {feederBuses.map((bus) => {
                const station = stations.find((s) => s.id === bus.stationId);
                return (
                  <tr key={bus.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 font-bold font-mono text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Bus className="w-3.5 h-3.5 text-teal-400" />
                      {bus.routeNumber}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {station?.name} ({station?.code})
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">
                      {bus.destination}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          bus.status === 'on_time'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : bus.status === 'holding'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-blue-500/15 text-blue-400'
                        }`}
                      >
                        {bus.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${
                              bus.loadPercentage > 80
                                ? 'bg-red-400'
                                : bus.loadPercentage > 60
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                            style={{ width: `${bus.loadPercentage}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px]">{bus.loadPercentage}%</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-teal-400 font-bold">
                      {bus.etaMinutes} min
                    </td>
                    <td className="py-3">
                      {bus.electricFleet ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          <Leaf className="w-3 h-3" />
                          100% Electric
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Hybrid Euro 6</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
