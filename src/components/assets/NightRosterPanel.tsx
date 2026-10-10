import React, { useMemo, useState } from 'react';
import { useMetroStore } from '../../store/metroStore';
import { StatusBadge } from '../common/StatusBadge';
import { WorkOrderPriority } from '../../types/metro';
import {
  ASSET_TYPE_LABEL,
  buildRoster,
  DEMO_CREWS,
  predictFailures,
  RosterItem,
  rosterToText,
  SHIFT_END,
  SHIFT_START,
} from '../../core/failurePrediction';
import { ArrowRight, CheckCircle2, ClipboardCopy, FlaskConical, Moon, Pencil, PlusCircle, UserCheck } from 'lucide-react';

const prioStyle: Record<WorkOrderPriority, string> = {
  critical: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40',
  high: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/40',
  medium: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
  low: 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/40',
};

interface EditState {
  item: RosterItem;
  task: string;
  priority: WorkOrderPriority;
  crew: string;
  startTime: string;
  durationMin: number;
}

/** Prioritised night-shift roster. Rows are backed by the existing Work Orders. */
export const NightRosterPanel: React.FC = () => {
  const assets = useMetroStore((s) => s.assets);
  const workOrders = useMetroStore((s) => s.workOrders);
  const createManualWorkOrder = useMetroStore((s) => s.createManualWorkOrder);
  const updateWorkOrderDetails = useMetroStore((s) => s.updateWorkOrderDetails);
  const updateWorkOrderStatus = useMetroStore((s) => s.updateWorkOrderStatus);
  const addToast = useMetroStore((s) => s.addToast);

  const [view, setView] = useState<'priority' | 'crew'>('priority');
  const [edit, setEdit] = useState<EditState | null>(null);

  const predictions = useMemo(() => predictFailures(assets, workOrders), [assets, workOrders]);
  const roster = useMemo(() => buildRoster(predictions, workOrders), [predictions, workOrders]);
  const isDemo = predictions.some((p) => p.dataSource === 'demo');
  const unscheduled = roster.filter((r) => !r.workOrderId);

  const approve = (r: RosterItem) =>
    createManualWorkOrder(r.assetId, r.priority, r.task, {
      task: r.task,
      assignedCrew: r.crew,
      scheduledTime: r.startTime,
      scheduledDuration: r.durationMin,
      source: 'roster',
    });

  const approveAll = () => {
    unscheduled.forEach((r) =>
      createManualWorkOrder(r.assetId, r.priority, r.task, {
        task: r.task,
        assignedCrew: r.crew,
        scheduledTime: r.startTime,
        scheduledDuration: r.durationMin,
        source: 'roster',
        silent: true,
      })
    );
    addToast('Roster Published', `${unscheduled.length} work order(s) created and assigned for tonight.`, 'success');
  };

  const saveEdit = () => {
    if (!edit) return;
    const { item, task, priority, crew, startTime, durationMin } = edit;
    const patch = { task, priority, assignedCrew: crew, scheduledTime: startTime, scheduledDuration: durationMin };
    if (item.workOrderId) updateWorkOrderDetails(item.workOrderId, patch);
    else
      createManualWorkOrder(item.assetId, priority, task, {
        task,
        assignedCrew: crew,
        scheduledTime: startTime,
        scheduledDuration: durationMin,
        source: 'roster',
      });
    setEdit(null);
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(rosterToText(roster, isDemo));
      addToast('Roster Copied', 'Plain-text roster copied – paste into WhatsApp/SMS/email.', 'success');
    } catch {
      addToast('Copy Failed', 'Clipboard not available in this browser.', 'warning');
    }
  };

  // Demo crews first (stable order), then any custom crew names already on work orders.
  const crewNames: string[] = [...DEMO_CREWS];
  roster.forEach((r) => {
    if (!crewNames.includes(r.crew)) crewNames.push(r.crew);
  });

  const groups: Array<{ title: string | null; items: RosterItem[] }> =
    view === 'crew'
      ? crewNames
          .map((crew) => ({
            title: crew,
            items: roster.filter((r) => r.crew === crew).sort((a, b) => timeKey(a) - timeKey(b)),
          }))
          .filter((g) => g.items.length)
      : [{ title: null, items: roster }];

  return (
    <div className="space-y-4" data-testid="night-roster">
      {isDemo && (
        <div className="flex items-start gap-3 p-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300" role="note">
          <FlaskConical className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">DEMO DATA.</span> Priorities come from demo-labelled predictions, and crews marked{' '}
            <em>Suggested</em> are from a demo crew pool (no technician master data exists). Review before dispatching.
          </div>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Tonight's Night-Shift Roster · {SHIFT_START} – {SHIFT_END}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {roster.length} task{roster.length === 1 ? '' : 's'} · {unscheduled.length} not yet a work order · highest
              risk first
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
            {(['priority', 'crew'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1 rounded-lg font-medium ${
                  view === v
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 font-bold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {v === 'priority' ? 'By priority' : 'By crew'}
              </button>
            ))}
          </div>
          <button
            onClick={copyText}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
          >
            <ClipboardCopy className="w-3.5 h-3.5" /> Copy text
          </button>
          <button
            onClick={approveAll}
            disabled={unscheduled.length === 0}
            className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-semibold flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Publish all as work orders ({unscheduled.length})
          </button>
        </div>
      </div>

      {roster.length === 0 && (
        <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800">
          No assets need night-shift maintenance right now.
        </div>
      )}

      {groups.map((g) => (
        <div key={g.title ?? 'all'} className="space-y-2">
          {g.title && (
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
              <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> {g.title}
              <span className="font-mono text-slate-400">({g.items.length})</span>
            </h3>
          )}
          {g.items.map((r, i) => (
            <div
              key={r.assetId}
              data-testid="roster-row"
              className={`p-3.5 rounded-2xl border bg-white dark:bg-[#0C182A] shadow-sm flex flex-col md:flex-row md:items-center gap-3 ${
                r.priority === 'critical' ? 'border-red-500/40' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Time block – largest element so technicians see it first */}
              <div className="md:w-36 shrink-0">
                <div className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100 leading-none">
                  {r.startTime}
                  <span className="text-slate-400 font-normal"> – {r.endTime}</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  {r.overflow ? (
                    <span className="font-bold text-red-600 dark:text-red-400">Won't fit tonight – next night</span>
                  ) : r.timeIsSuggested ? (
                    'Suggested slot'
                  ) : (
                    'Scheduled'
                  )}{' '}
                  · {r.durationMin} min
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-1 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {view === 'priority' && (
                    <span className="font-mono text-[11px] font-bold text-slate-400">#{i + 1}</span>
                  )}
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${prioStyle[r.priority]}`}>
                    {r.priority}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{r.assetId}</span>
                  <span className="text-teal-700 dark:text-teal-400 font-semibold">{r.stationName}</span>
                  <span className="text-slate-500 dark:text-slate-400">· {ASSET_TYPE_LABEL[r.assetType]}</span>
                  {r.workOrderId ? (
                    <>
                      <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400 font-semibold">{r.workOrderId}</span>
                      {r.workOrderStatus && <StatusBadge type="workOrder" value={r.workOrderStatus} size="sm" />}
                      {r.workOrderSyncPending && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                          Pending sync
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/30">
                      Not yet a work order
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">{r.task}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Why: {r.reason}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                  {r.crew}
                  {r.crewIsSuggested && <span className="italic text-slate-400">(suggested – demo crew)</span>}
                </p>
              </div>

              <div className="flex md:flex-col items-center md:items-stretch gap-1.5 shrink-0 text-xs">
                {!r.workOrderId && (
                  <button
                    onClick={() => approve(r)}
                    className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
                {r.workOrderId && r.workOrderStatus === 'Assigned' && (
                  <button
                    onClick={() => updateWorkOrderStatus(r.workOrderId!, 'In Progress')}
                    className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold flex items-center justify-center gap-1"
                  >
                    Start <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {r.workOrderId && r.workOrderStatus === 'Open' && (
                  <button
                    onClick={() => updateWorkOrderStatus(r.workOrderId!, 'Assigned')}
                    className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-semibold flex items-center justify-center gap-1"
                  >
                    Assign <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {r.workOrderId && r.workOrderStatus === 'In Progress' && (
                  <button
                    onClick={() => updateWorkOrderStatus(r.workOrderId!, 'Done')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Done
                  </button>
                )}
                <button
                  onClick={() =>
                    setEdit({
                      item: r,
                      task: r.task,
                      priority: r.priority,
                      crew: r.crew,
                      startTime: r.startTime,
                      durationMin: r.durationMin,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Edit modal */}
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Review roster task</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              {edit.item.assetId} · {edit.item.stationName}.{' '}
              {edit.item.workOrderId
                ? `Updates work order ${edit.item.workOrderId}.`
                : 'Saving creates a new work order for this task.'}
            </p>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="block text-slate-500 dark:text-slate-400 mb-1">Maintenance task</span>
                <textarea
                  rows={3}
                  value={edit.task}
                  onChange={(e) => setEdit({ ...edit, task: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-slate-500 dark:text-slate-400 mb-1">Priority</span>
                  <select
                    value={edit.priority}
                    onChange={(e) => setEdit({ ...edit, priority: e.target.value as WorkOrderPriority })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <label className="block">
                  <span className="block text-slate-500 dark:text-slate-400 mb-1">Duration (min)</span>
                  <input
                    type="number"
                    min={15}
                    max={300}
                    step={5}
                    value={edit.durationMin}
                    onChange={(e) => setEdit({ ...edit, durationMin: Math.max(15, Number(e.target.value) || 15) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </label>
              </div>
              <label className="block">
                <span className="block text-slate-500 dark:text-slate-400 mb-1">Crew / technician</span>
                <select
                  value={edit.crew}
                  onChange={(e) => setEdit({ ...edit, crew: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {(DEMO_CREWS.includes(edit.crew) ? DEMO_CREWS : [edit.crew, ...DEMO_CREWS]).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-slate-500 dark:text-slate-400 mb-1">Start time (night shift {SHIFT_START}–{SHIFT_END})</span>
                <input
                  type="time"
                  value={edit.startTime}
                  onChange={(e) => setEdit({ ...edit, startTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                />
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setEdit(null)} className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white">
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={!edit.task.trim() || !edit.startTime}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-bold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function timeKey(r: RosterItem): number {
  const [h, m] = r.startTime.split(':').map(Number);
  return (h * 60 + m - (23 * 60 + 30) + 1440) % 1440;
}
