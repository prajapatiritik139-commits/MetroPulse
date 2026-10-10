import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useMetroStore } from '../../store/metroStore';
import { StatusBadge } from '../common/StatusBadge';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Sliders,
  TrainFront,
  RotateCcw,
  DoorOpen,
  AlertTriangle,
} from 'lucide-react';
import { formatPassengers, formatPercentage } from '../../utils/formatters';
import { getStationName } from '../../data/stations';

interface RecommendedActionItem {
  id: string;
  category: 'Hold train' | 'Short-turn' | 'Open extra gates';
  title: string;
  description: string;
  impact: string;
  urgency: 'high' | 'medium';
  icon: React.ComponentType<{ className?: string }>;
}

export const CrowdForecastScreen: React.FC = () => {
  const stations = useMetroStore((state) => state.stations);
  const simulatedTime = useMetroStore((state) => state.simulatedTime);
  const effectiveOnline = useMetroStore((state) => state.effectiveOnline);
  const lastSyncedTime = useMetroStore((state) => state.lastSyncedTime);
  const addToast = useMetroStore((state) => state.addToast);

  const [selectedStationId, setSelectedStationId] = useState<string>('ST-05'); // default to Old High Court
  const [appliedActionIds, setAppliedActionIds] = useState<Record<string, boolean>>({});

  const selectedStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  // Specific 3 recommended actions reading station names from stations.ts
  const recommendedActions: RecommendedActionItem[] = [
    {
      id: 'rec-act-hold',
      category: 'Hold train',
      title: `Hold Train TR-102 at ${getStationName('ST-05')} (90s)`,
      description: 'Extend station platform dwell to smooth passenger absorption and deconflict incoming Line 2 transfer wave.',
      impact: 'Reduces platform congestion surge by 18% in 3 min',
      urgency: 'high',
      icon: TrainFront,
    },
    {
      id: 'rec-act-short-turn',
      category: 'Short-turn',
      title: `Short-Turn Train TR-203 at ${getStationName('ST-02')}`,
      description: 'Switch consist early onto reverse siding to reinforce high-demand southbound corridor frequencies.',
      impact: 'Closes headway gap from 5.4m to nominal 3.2m',
      urgency: 'medium',
      icon: RotateCcw,
    },
    {
      id: 'rec-act-open-gates',
      category: 'Open extra gates',
      title: 'Open Extra AFC Emergency Egress Gates',
      description: `Reconfigure turnstiles 5–8 at ${getStationName('ST-05')} to exit-only free-flow metering mode.`,
      impact: 'Boosts concourse discharge volume by +420 pax/min',
      urgency: 'high',
      icon: DoorOpen,
    },
  ];

  const handleApplyAction = (action: RecommendedActionItem) => {
    setAppliedActionIds((prev) => ({ ...prev, [action.id]: true }));
    addToast(
      `Action Applied: ${action.category}`,
      `${action.title} executed successfully. Impact: ${action.impact}`,
      'success'
    );
  };

  // Helper to format time slot strings
  const formatTimeSlot = (offsetMinutes: number) => {
    const slotDate = new Date(simulatedTime.getTime() + offsetMinutes * 60 * 1000);
    return slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const labelNow = `${formatTimeSlot(0)} (NOW)`;
  const label15 = formatTimeSlot(15);
  const label30 = formatTimeSlot(30);
  const label45 = formatTimeSlot(45);
  const label60 = formatTimeSlot(60);

  // Station base load
  const currentLoad = Math.min(96, Math.max(45, selectedStation.crowdPercentage));

  // Realistic curve: rises toward peak around 09:00 (+30m), then eases off noticeably (+60m)
  // Confidence band widens progressively into the future (+/-2 at NOW, +/-5 at 15m, +/-9 at 30m, +/-16 at 60m)
  const peakLoad = Math.min(97, Math.max(78, currentLoad + 14));
  const f15 = Math.min(95, Math.round(currentLoad + (peakLoad - currentLoad) * 0.65));
  const f30 = Math.min(97, peakLoad);
  const f45 = Math.round(f30 * 0.9);
  const f60 = Math.max(48, Math.round(f30 * 0.76)); // eases off significantly

  const forecastData = [
    {
      timeLabel: formatTimeSlot(-30),
      actual: Math.max(42, currentLoad - 12),
      forecast: undefined,
      confidenceLower: undefined,
      confidenceUpper: undefined,
      status: 'Historical Telemetry (-30m)',
    },
    {
      timeLabel: formatTimeSlot(-15),
      actual: Math.max(46, currentLoad - 6),
      forecast: undefined,
      confidenceLower: undefined,
      confidenceUpper: undefined,
      status: 'Historical Telemetry (-15m)',
    },
    {
      timeLabel: labelNow,
      actual: currentLoad,
      forecast: currentLoad,
      confidenceLower: Math.max(40, currentLoad - 2),
      confidenceUpper: Math.min(100, currentLoad + 2),
      status: 'Current Measured Telemetry',
    },
    {
      timeLabel: label15,
      actual: undefined,
      forecast: f15,
      confidenceLower: Math.max(40, f15 - 5),
      confidenceUpper: Math.min(100, f15 + 5),
      status: 'Prediction +15m (Surging)',
      isMarker15: true,
    },
    {
      timeLabel: label30,
      actual: undefined,
      forecast: f30,
      confidenceLower: Math.max(40, f30 - 9),
      confidenceUpper: Math.min(100, f30 + 9),
      status: 'Prediction +30m (~09:00 Peak Rush)',
      isMarker30: true,
    },
    {
      timeLabel: label45,
      actual: undefined,
      forecast: f45,
      confidenceLower: Math.max(40, f45 - 12),
      confidenceUpper: Math.min(100, f45 + 13),
      status: 'Prediction +45m (Post-Peak)',
    },
    {
      timeLabel: label60,
      actual: undefined,
      forecast: f60,
      confidenceLower: Math.max(40, f60 - 16), // Widened confidence band
      confidenceUpper: Math.min(100, f60 + 16),
      status: 'Prediction +60m (Easing Off)',
      isMarker60: true,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header and Station Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Predictive Crowd Density & Dispatch Automation</span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30">
                Wider Confidence Interval
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Demand forecast peaks around 09:00 rush hour before easing off, with progressive uncertainty band.
            </p>
          </div>
        </div>

        {/* Station Select Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-400">Station:</label>
          <select
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {stations.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.code}) - {formatPercentage(st.crowdPercentage)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chart Card (Y-axis 40-100% to fill chart) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{selectedStation.name} — Rush Hour Projection (08:00 – 10:00)</span>
                <StatusBadge type="crowd" value={selectedStation.crowdLevel} size="sm" />
              </h2>
              {!effectiveOnline && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-semibold animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Stale data · Cached {lastSyncedTime}</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Capacity: {formatPassengers(selectedStation.capacity)} pax · Current Volume: {formatPassengers(selectedStation.passengerVolume)} pax · Range: 40%–100%
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span>Actual Measured</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-0.5 bg-teal-400 border-dashed border-b-2" />
              <span>Forecast</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-teal-500/20 border border-teal-500/40" />
              <span>Widening Confidence Band</span>
            </div>
          </div>
        </div>

        {/* Recharts Container with YAxis domain 40-100 */}
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={forecastData}
              margin={{ top: 15, right: 25, bottom: 20, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                domain={[40, 100]}
                unit="%"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-slate-950/95 border border-slate-700 shadow-xl text-xs space-y-1">
                        <p className="font-bold text-teal-300">{label}</p>
                        <p className="text-[11px] text-slate-400">{data.status}</p>
                        {data.actual !== undefined && (
                          <p className="text-emerald-400 font-mono">
                            Actual Load: <span className="font-bold">{formatPercentage(data.actual)}</span>
                          </p>
                        )}
                        {data.forecast !== undefined && (
                          <p className="text-teal-400 font-mono">
                            Forecast: <span className="font-bold">{formatPercentage(data.forecast)}</span>
                          </p>
                        )}
                        {data.confidenceLower !== undefined && (
                          <p className="text-slate-400 font-mono text-[11px]">
                            Confidence Band: {formatPercentage(data.confidenceLower)} — {formatPercentage(data.confidenceUpper)}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Confidence Band Area (Widening further into future) */}
              <Area
                type="monotone"
                dataKey="confidenceUpper"
                stroke="transparent"
                fill="#14B8A6"
                fillOpacity={0.16}
                name="Confidence Upper"
              />
              <Area
                type="monotone"
                dataKey="confidenceLower"
                stroke="transparent"
                fill="#0C182A"
                fillOpacity={0.82}
                name="Confidence Lower"
              />

              {/* Distinct Markers at +15 min, +30 min, and +60 min */}
              <ReferenceLine
                x={label15}
                stroke="#14B8A6"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: '+15m Marker',
                  fill: '#14B8A6',
                  fontSize: 10,
                  position: 'insideTopLeft',
                }}
              />
              <ReferenceLine
                x={label30}
                stroke="#EF4444"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: '+30m Peak (~09:00)',
                  fill: '#EF4444',
                  fontSize: 10,
                  position: 'insideTopLeft',
                }}
              />
              <ReferenceLine
                x={label60}
                stroke="#3B82F6"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: '+60m Easing Marker',
                  fill: '#3B82F6',
                  fontSize: 10,
                  position: 'insideTopLeft',
                }}
              />

              {/* Threshold Danger Line at 90% */}
              <ReferenceLine
                y={90}
                label={{ value: 'CRITICAL THRESHOLD (90%)', fill: '#EF4444', fontSize: 10, position: 'top' }}
                stroke="#EF4444"
                strokeDasharray="4 4"
                strokeWidth={1}
                opacity={0.7}
              />

              {/* Actual Measured Line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#22C55E"
                strokeWidth={3}
                dot={{ r: 4, fill: '#22C55E' }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />

              {/* Forecast Projection Line */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#14B8A6"
                strokeWidth={3}
                strokeDasharray="4 4"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isMarker15 || payload.isMarker30 || payload.isMarker60) {
                    const color = payload.isMarker30 ? '#EF4444' : '#14B8A6';
                    return (
                      <circle
                        key={`marker-${payload.timeLabel}`}
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={color}
                        stroke="#0B1F3A"
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle key={cx} cx={cx} cy={cy} r={3} fill="#14B8A6" />;
                }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3 Recommended Action Cards (Hold train, Short-turn, Open extra gates) with "Apply" button */}
      <div className="rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Recommended Operational Action Cards</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-500/15 text-teal-300">
                  3 Protocols Ready
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Actionable interventions to flatten the projected 09:00 peak surge and balance passenger distribution
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {Object.keys(appliedActionIds).length} of 3 Applied
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {recommendedActions.map((action) => {
            const isApplied = appliedActionIds[action.id];
            const Icon = action.icon;

            return (
              <div
                key={action.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isApplied
                    ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-80'
                    : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-lg bg-teal-500/15 text-teal-400">
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-bold text-teal-400 uppercase tracking-wide">
                        {action.category}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                        action.urgency === 'high'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {action.urgency}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1 leading-snug">
                    {action.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {action.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs mt-auto">
                  <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium truncate mr-2">
                    {action.impact}
                  </span>

                  {!isApplied ? (
                    <button
                      onClick={() => handleApplyAction(action)}
                      className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-sm active:scale-95 shrink-0 flex items-center gap-1"
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold font-mono shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Applied
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
