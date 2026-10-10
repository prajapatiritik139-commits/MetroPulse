import React, { useState } from 'react';
import { useMetroStore } from '../../store/metroStore';
import { SvgSchematicMap } from './SvgSchematicMap';
import { StationDetailDrawer } from './StationDetailDrawer';
import { CrowdLegend } from '../common/CrowdLegend';
import { StatusBadge } from '../common/StatusBadge';
import {
  TrainFront,
  Navigation,
  Activity,
  Layers,
  MapPin,
  Clock,
  Gauge,
} from 'lucide-react';
import { formatPercentage, formatSpeed } from '../../utils/formatters';

export const NetworkMapScreen: React.FC = () => {
  const {
    stations,
    trains,
    lines,
    selectedStationId,
    selectStation,
  } = useMetroStore();

  const [activeLineFilter, setActiveLineFilter] = useState<'all' | 'L1' | 'L2'>('all');

  const filteredStations = stations.filter((s) => {
    if (activeLineFilter === 'all') return true;
    return s.lines.includes(activeLineFilter);
  });

  const filteredTrains = trains.filter((t) => {
    if (activeLineFilter === 'all') return true;
    return t.lineId === activeLineFilter;
  });

  return (
    <div className="space-y-4">
      {/* Top Map Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Metro Schematic Transit Network</span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400">
                Vector Schematic · 3s Sync
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any station to inspect crowd pressure, sensor telemetry, and dispatch commands.
            </p>
          </div>
        </div>

        {/* Line Filter controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs">
            <button
              onClick={() => setActiveLineFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeLineFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white'
              }`}
            >
              All Lines (12 Stn)
            </button>
            <button
              onClick={() => setActiveLineFilter('L1')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeLineFilter === 'L1'
                  ? 'bg-white dark:bg-slate-900 text-teal-400 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span>Line 1 (Teal)</span>
            </button>
            <button
              onClick={() => setActiveLineFilter('L2')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeLineFilter === 'L2'
                  ? 'bg-white dark:bg-slate-900 text-rose-400 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Line 2 (Ruby)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map + Side Drawer Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Container */}
        <div className={`${selectedStationId ? 'lg:col-span-8' : 'lg:col-span-12'} flex flex-col space-y-3 transition-all duration-300`}>
          <div className="relative min-h-[70vh] rounded-2xl">
            <SvgSchematicMap
              heightClass="min-h-[70vh] h-[70vh]"
              lineFilter={activeLineFilter === 'all' ? 'ALL' : activeLineFilter}
              onLineFilterChange={(flt) => setActiveLineFilter(flt === 'ALL' ? 'all' : flt)}
              onStationSelect={(id) => selectStation(id)}
            />
          </div>

          {/* Station Quick Jump Pills */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Stations:
            </span>
            {filteredStations.map((st) => (
              <button
                key={st.id}
                onClick={() => selectStation(st.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                  selectedStationId === st.id
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/60 shadow-sm font-bold'
                    : 'bg-slate-100 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                <span>{st.name}</span>
                <span
                  className={`font-mono text-[10px] font-bold ${
                    st.crowdPercentage > 90
                      ? 'text-red-700 dark:text-red-400'
                      : st.crowdPercentage > 60
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {formatPercentage(st.crowdPercentage)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Station Side Panel */}
        {selectedStationId && (
          <div className="lg:col-span-4">
            <StationDetailDrawer onClose={() => selectStation(null)} />
          </div>
        )}
      </div>

      {/* Real-Time Trains Status Grid */}
      <div className="rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrainFront className="w-4 h-4 text-teal-400" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Active Consist Fleet Telemetry ({filteredTrains.length} Trains In Service)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Headway Nominal</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTrains.map((tr) => {
            const line = lines.find((l) => l.id === tr.lineId);
            const currentStation = stations.find((s) => s.id === tr.currentStationId);
            const nextStation = stations.find((s) => s.id === tr.nextStationId);

            return (
              <div
                key={tr.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: line?.color || '#14B8A6' }}
                    />
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {tr.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {line?.name.split(' ')[0]}
                    </span>
                  </div>

                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                      tr.status === 'boarding'
                        ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                        : tr.status === 'holding'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                        : tr.status === 'delayed'
                        ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 animate-pulse'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {tr.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Routing:</span>
                  <span className="font-medium text-slate-200">
                    {currentStation?.code || 'DEP'} → {nextStation?.code || 'ARR'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px]">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Gauge className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                    <span>Speed:</span>
                    <span className="font-mono font-bold text-slate-200">{formatSpeed(tr.speedKmh)}</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 justify-end">
                    <span>Load:</span>
                    <span
                      className={`font-mono font-bold ${
                        tr.loadPercentage > 85 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      {formatPercentage(tr.loadPercentage)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
