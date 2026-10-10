import React from 'react';
import { useMetroStore } from '../../store/metroStore';
import { KpiStrip } from './KpiStrip';
import { AlertsPanel } from './AlertsPanel';
import { SvgSchematicMap } from '../map/SvgSchematicMap';
import { StationDetailDrawer } from '../map/StationDetailDrawer';
import { CrowdLegend } from '../common/CrowdLegend';
import {
  MapPin,
  Maximize2,
  Zap,
  Activity,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const setTab = useMetroStore((state) => state.setTab);
  const selectedStationId = useMetroStore((state) => state.selectedStationId);
  const selectStation = useMetroStore((state) => state.selectStation);
  const simulateIncident = useMetroStore((state) => state.simulateIncident);

  return (
    <div className="space-y-4">
      {/* 1. KPI Strip */}
      <KpiStrip />

      {/* 2. Main Live Control Floor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Live Network Map Interactive Overview (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Real-Time Network Telemetry
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Line 1 (Teal) & Line 2 (Ruby) · Trains moving every 3s
                  </p>
                </div>
              </div>

              <button
                onClick={() => setTab('map')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                aria-label="Expand full network map screen"
              >
                <span>Full Map View</span>
                <Maximize2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              </button>
            </div>

            {/* Embedded Schematic Map */}
            <div className="relative">
              <SvgSchematicMap heightClass="h-[400px]" interactive={true} />
            </div>

            {/* Bottom crowd legend bar */}
            <div className="mt-3">
              <CrowdLegend compact={true} />
            </div>
          </div>

          {/* Quick Simulation Trigger Bar */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Simulate Network Incidents
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Inject live anomalies into control loop
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => simulateIncident('train_breakdown')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/20 transition-colors"
              >
                Train Breakdown
              </button>
              <button
                onClick={() => simulateIncident('power_failure')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 transition-colors"
              >
                Power Failure
              </button>
              <button
                onClick={() => simulateIncident('overcrowding')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-500/20 transition-colors"
              >
                Crowd Surge
              </button>
              <button
                onClick={() => simulateIncident('medical_emergency')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/20 transition-colors"
              >
                Medical Call
              </button>
            </div>
          </div>
        </div>

        {/* Right: Active Alerts & Station Inspector (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          {selectedStationId ? (
            <StationDetailDrawer onClose={() => selectStation(null)} />
          ) : (
            <AlertsPanel />
          )}

          {/* Quick link to crowd forecasting */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-slate-900/40 to-slate-900/60 border border-teal-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100">AI Crowd Forecasting Active</h3>
                <p className="text-[11px] text-slate-300">
                  +15/30/60m surge confidence bands & dispatch suggestions ready
                </p>
              </div>
            </div>

            <button
              onClick={() => setTab('forecast')}
              className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-colors shrink-0 flex items-center gap-1"
            >
              <span>Forecast</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
