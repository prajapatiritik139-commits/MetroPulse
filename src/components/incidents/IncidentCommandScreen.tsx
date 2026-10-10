import React, { useState } from 'react';
import { useMetroStore } from '../../store/metroStore';
import { StatusBadge } from '../common/StatusBadge';
import { IncidentType, IncidentSeverity } from '../../types/metro';
import { getStationName } from '../../data/stations';
import {
  ShieldAlert,
  Flame,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Clock,
  MapPin,
  ListOrdered,
  History,
  Activity,
  UserPlus,
  ShieldCheck,
  Send,
} from 'lucide-react';

export const IncidentCommandScreen: React.FC = () => {
  const {
    incidents,
    stations,
    lines,
    selectedIncidentId,
    selectIncident,
    executePlaybookStep,
    resolveIncident,
    simulateIncident,
    actionLogs,
  } = useMetroStore();

  const [simulationModalOpen, setSimulationModalOpen] = useState(false);
  const [selectedIncidentType, setSelectedIncidentType] = useState<IncidentType>('train_breakdown');
  const [targetStationId, setTargetStationId] = useState<string>('ST-04');

  const stationMap = new Map(stations.map((s) => [s.id, s.name]));

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const activeCriticalIncidents = incidents.filter((i) => i.status !== 'resolved' && i.severity === 'critical');
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved');

  const currentIncident =
    incidents.find((i) => i.id === selectedIncidentId) ||
    activeIncidents[0] ||
    incidents[0];

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    simulateIncident(selectedIncidentType, targetStationId);
    setSimulationModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Emergency Incident Command & Standard Operating Procedures</span>
              {activeIncidents.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-300">
                    {activeIncidents.length} Active
                  </span>
                  {activeCriticalIncidents.length > 0 && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
                      {activeCriticalIncidents.length} Critical
                    </span>
                  )}
                </div>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Execute standardized playbooks, dispatch response units, and resolve network anomalies.
            </p>
          </div>
        </div>

        {/* Simulate Incident CTA */}
        <button
          onClick={() => setSimulationModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-sm active:scale-95 flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          <span>Simulate Incident</span>
        </button>
      </div>

      {/* Main Grid: Incident List on Left, Active Playbook on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Incidents Triage List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
              Active Triage Queue ({activeIncidents.length})
            </h2>

            {activeIncidents.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-200">All Incidents Cleared</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click "Simulate Incident" to inject train breakdown or power failure.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeIncidents.map((inc) => {
                  const isSelected = currentIncident?.id === inc.id;
                  const isCritical = inc.severity === 'critical';
                  const stepsCompleted = inc.playbookSteps.filter((s) => s.executed).length;
                  const totalSteps = inc.playbookSteps.length;

                  return (
                    <div
                      key={inc.id}
                      onClick={() => selectIncident(inc.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500/10 shadow-sm'
                          : isCritical
                          ? 'border-red-500/40 bg-red-950/20 hover:border-red-400'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {inc.id}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                              isCritical
                                ? 'bg-red-500/20 text-red-300 animate-pulse'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {inc.severity}
                          </span>
                          {inc.syncStatus === 'pending' && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Pending sync
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {inc.reportedAt}
                        </span>
                      </div>

                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">
                        {inc.title}
                      </h3>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                        {inc.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3 h-3 text-teal-400" />
                          <span>
                            {inc.affectedStationIds.map((id) => getStationName(id, stationMap.get(id))).join(', ')}
                          </span>
                        </div>

                        <span className="font-mono font-semibold text-teal-400">
                          {stepsCompleted}/{totalSteps} Steps Executed
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resolved Incidents History */}
          {resolvedIncidents.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Resolved Incident Archive ({resolvedIncidents.length})</span>
              </h2>
              <div className="space-y-1.5">
                {resolvedIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 text-xs flex items-center justify-between text-slate-400"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{inc.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                      Resolved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Incident Playbook Steps (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {currentIncident ? (
            <div className="rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              {/* Incident Header */}
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {currentIncident.id}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        currentIncident.severity === 'critical'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {currentIncident.severity}
                    </span>
                    <span className="text-xs text-slate-400">
                      Status: <strong className="text-slate-200 uppercase">{currentIncident.status}</strong>
                    </span>
                  </div>

                  {currentIncident.status !== 'resolved' && (
                    <button
                      onClick={() => resolveIncident(currentIncident.id)}
                      className="px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-semibold text-xs border border-emerald-500/30 transition-colors"
                    >
                      Resolve Incident
                    </button>
                  )}
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {currentIncident.title}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {currentIncident.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    <span>
                      Affected Stations:{' '}
                      <strong className="text-slate-200">
                        {currentIncident.affectedStationIds
                          .map((id) => stationMap.get(id) || id)
                          .join(', ')}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>Reported {currentIncident.reportedAt}</span>
                  </div>
                </div>
              </div>

              {/* Playbook Steps Execution Checklist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-teal-400" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Standard Operating Playbook Checklist
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-teal-400">
                    {currentIncident.playbookSteps.filter((s) => s.executed).length} of{' '}
                    {currentIncident.playbookSteps.length} Steps Complete
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentIncident.playbookSteps.map((step) => {
                    return (
                      <div
                        key={step.stepNumber}
                        className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          step.executed
                            ? 'bg-emerald-950/10 border-emerald-500/30 opacity-90'
                            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                              step.executed
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {step.executed ? <CheckCircle2 className="w-4 h-4" /> : step.stepNumber}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs font-medium leading-relaxed ${
                                step.executed
                                  ? 'text-slate-400 line-through'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {step.instruction}
                            </p>
                            {step.executed && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono text-emerald-400">
                                  Executed {step.executedAt || 'Recently'}
                                </span>
                                {currentIncident.syncStatus === 'pending' && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    Pending sync
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Execute Button */}
                        {!step.executed ? (
                          <button
                            onClick={() => executePlaybookStep(currentIncident.id, step.stepNumber)}
                            className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-sm active:scale-95 shrink-0 flex items-center gap-1"
                          >
                            <span>Execute</span>
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-400 shrink-0 font-semibold">
                            Complete
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Log / Audit Trail */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  OCC Operator Action Log Audit Trail
                </h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {actionLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 flex items-start justify-between gap-2"
                    >
                      <div>
                        <span className="font-semibold text-slate-200">{log.title}: </span>
                        <span className="text-slate-400">{log.details}</span>
                      </div>
                      <span className="font-mono text-[10px] text-teal-400 shrink-0">
                        {log.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-400">No incident selected</p>
            </div>
          )}
        </div>
      </div>

      {/* Simulate Incident Modal */}
      {simulationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-teal-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Simulate Operational Incident
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Inject live emergency scenarios into the OCC network to test playbook procedures, headway buffering, and automatic work order generation.
            </p>

            <form onSubmit={handleSimulateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-2">
                  Select Incident Scenario Preset:
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { id: 'train_breakdown', label: 'Train Breakdown', icon: Flame, color: 'text-red-400' },
                    { id: 'power_failure', label: 'Power Grid Failure', icon: Zap, color: 'text-amber-400' },
                    { id: 'overcrowding', label: 'Platform Surge Overcrowding', icon: Activity, color: 'text-orange-400' },
                    { id: 'medical_emergency', label: 'Medical Emergency', icon: ShieldAlert, color: 'text-blue-400' },
                  ].map((sc) => {
                    const Icon = sc.icon;
                    const isSelected = selectedIncidentType === sc.id;
                    return (
                      <button
                        type="button"
                        key={sc.id}
                        onClick={() => setSelectedIncidentType(sc.id as IncidentType)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-teal-500/15 border-teal-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${sc.color}`} />
                        <div>
                          <span className="font-semibold block text-slate-200">{sc.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Quick One-Click Scenarios:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        simulateIncident('overcrowding', 'ST-04');
                        setSimulationModalOpen(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-teal-500/20 text-teal-300 text-[11px] font-semibold hover:bg-teal-500/30 transition-colors"
                    >
                      Stadium Surge (Central)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        simulateIncident('train_breakdown', 'ST-02');
                        setSimulationModalOpen(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 text-[11px] font-semibold hover:bg-red-500/30 transition-colors"
                    >
                      Traction Motor Fault (Train 101)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        simulateIncident('power_failure', 'ST-08');
                        setSimulationModalOpen(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-semibold hover:bg-amber-500/30 transition-colors"
                    >
                      Substation 22kV Trip (GIFT City)
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Target Station Location:
                </label>
                <select
                  value={targetStationId}
                  onChange={(e) => setTargetStationId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.code}) {st.isInterchange ? '★ Interchange' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSimulationModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-colors shadow-sm"
                >
                  Inject Incident into Simulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
