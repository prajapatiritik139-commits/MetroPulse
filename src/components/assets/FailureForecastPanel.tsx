import React, { useMemo, useState } from 'react';
import { useMetroStore } from '../../store/metroStore';
import { StatusBadge } from '../common/StatusBadge';
import { FailureRisk } from '../../types/metro';
import {
  ASSET_TYPE_LABEL,
  DEMO_CREW_BY_TYPE,
  FailurePrediction,
  predictFailures,
} from '../../core/failurePrediction';
import { CalendarClock, ChevronDown, ChevronUp, FlaskConical, PlusCircle, Wrench } from 'lucide-react';

const RISK_ORDER: FailureRisk[] = ['critical', 'high', 'medium', 'low'];

const riskBar: Record<FailureRisk, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-emerald-500',
};

/** Next 7 Days Asset Failure Prediction. Read-only on assets; reuses the work-order creator. */
export const FailureForecastPanel: React.FC<{ onOpenRoster: () => void }> = ({ onOpenRoster }) => {
  const assets = useMetroStore((s) => s.assets);
  const workOrders = useMetroStore((s) => s.workOrders);
  const createManualWorkOrder = useMetroStore((s) => s.createManualWorkOrder);

  const [filter, setFilter] = useState<'atRisk' | 'all' | FailureRisk>('atRisk');
  const [showMethod, setShowMethod] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const predictions = useMemo(() => predictFailures(assets, workOrders), [assets, workOrders]);
  const isDemo = predictions.some((p) => p.dataSource === 'demo');

  const counts = RISK_ORDER.reduce(
    (acc, r) => ({ ...acc, [r]: predictions.filter((p) => p.riskLevel === r).length }),
    {} as Record<FailureRisk, number>
  );
  const visible = predictions.filter((p) =>
    filter === 'all' ? true : filter === 'atRisk' ? p.riskLevel !== 'low' : p.riskLevel === filter
  );

  const createWo = (p: FailurePrediction) =>
    createManualWorkOrder(
      p.assetId,
      p.riskLevel === 'critical' ? 'critical' : p.riskLevel === 'high' ? 'high' : 'medium',
      p.recommendedAction,
      { task: p.recommendedAction, assignedCrew: DEMO_CREW_BY_TYPE[p.assetType], source: 'roster' }
    );

  return (
    <div className="space-y-4" data-testid="failure-forecast">
      {/* Demo data banner */}
      {isDemo && (
        <div
          className="flex items-start gap-3 p-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300"
          role="note"
        >
          <FlaskConical className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">DEMO DATA – not real predictions.</span> MetroPulse has no historical fault log,
            so fault history is <em>synthetic</em> (generated from each asset's seed health). Live health, vibration,
            temperature and trend come from the running simulation. The score is a rule-based risk index, not a
            calibrated probability.
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Next 7 Days – Assets Most Likely to Fail
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ranked by risk score. Fix these before they break.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenRoster}
            className="self-start md:self-auto px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5" /> Plan tonight's night shift
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {RISK_ORDER.map((r) => (
            <button
              key={r}
              onClick={() => setFilter(filter === r ? 'atRisk' : r)}
              className={`p-2.5 rounded-xl border text-left transition-colors ${
                filter === r
                  ? 'border-teal-500/60 bg-teal-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{r} risk</div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">{counts[r]}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 text-xs">
          <div className="flex items-center gap-1">
            {(['atRisk', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg font-medium ${
                  filter === f
                    ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {f === 'atRisk' ? 'At risk (medium+)' : 'All assets'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowMethod((v) => !v)}
            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-teal-500 flex items-center gap-1"
          >
            How is this scored? {showMethod ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
        {showMethod && (
          <p className="mt-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            Risk score (0–100) = health shortfall (35) + degradation trend (15) + vibration vs limit (15) + temperature
            vs limit (10) + recent fault history (20) + service-interval wear (5). Levels: Critical ≥ 62, High ≥ 42,
            Medium ≥ 25. The "likely window" is a heuristic bucket from the level, not a forecast date.
          </p>
        )}
      </div>

      {/* Prediction list */}
      <div className="space-y-2.5">
        {visible.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800">
            No assets in this category.
          </div>
        )}
        {visible.map((p, idx) => (
          <div
            key={p.assetId}
            data-testid="prediction-row"
            className={`rounded-2xl border bg-white dark:bg-[#0C182A] shadow-sm overflow-hidden ${
              p.riskLevel === 'critical'
                ? 'border-red-500/40'
                : p.riskLevel === 'high'
                ? 'border-orange-500/30'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs">
              {/* Identity */}
              <div className="lg:col-span-3 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">#{idx + 1}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{p.assetId}</span>
                  <StatusBadge type="risk" value={p.riskLevel} size="sm" />
                </div>
                <div className="font-semibold text-slate-900 dark:text-slate-200">{p.assetName}</div>
                <div className="text-slate-500 dark:text-slate-400">
                  <span className="text-teal-700 dark:text-teal-400 font-medium">{p.stationName}</span> ·{' '}
                  {ASSET_TYPE_LABEL[p.assetType]}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full ${riskBar[p.riskLevel]}`} style={{ width: `${p.riskScore}%` }} />
                  </div>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{p.riskScore}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Likely window: <span className="font-semibold">{p.window}</span>
                </div>
              </div>

              {/* Reason */}
              <div className="lg:col-span-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Why at risk
                </div>
                <ul className="space-y-0.5 text-slate-700 dark:text-slate-300 list-disc pl-4">
                  {p.reasons.slice(0, expanded === p.assetId ? 10 : 3).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                {p.reasons.length > 3 && (
                  <button
                    onClick={() => setExpanded(expanded === p.assetId ? null : p.assetId)}
                    className="mt-1 text-[11px] text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    {expanded === p.assetId ? 'Show less' : `+${p.reasons.length - 3} more`}
                  </button>
                )}
              </div>

              {/* Action */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Recommended maintenance
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{p.recommendedAction}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Est. {p.recommendedDurationMin} min
                  </p>
                </div>
                {p.activeWorkOrderId ? (
                  <div className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-semibold">
                    Work order {p.activeWorkOrderId} already open
                  </div>
                ) : p.riskLevel !== 'low' ? (
                  <button
                    onClick={() => createWo(p)}
                    className="self-start px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 font-semibold border border-teal-500/20 flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Create work order
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
