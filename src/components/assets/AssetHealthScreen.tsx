import React, { useState } from 'react';
import { useMetroStore } from '../../store/metroStore';
import { StatusBadge } from '../common/StatusBadge';
import { AssetType, WorkOrderStatus, FailureRisk } from '../../types/metro';
import {
  Wrench,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  PlusCircle,
  Thermometer,
  Vibrate,
  ShieldAlert,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import {
  formatHealthScore,
  formatTemperature,
  formatVibration,
  formatCycles,
} from '../../utils/formatters';
import { getStationName } from '../../data/stations';
import { FailureForecastPanel } from './FailureForecastPanel';
import { NightRosterPanel } from './NightRosterPanel';

export const AssetHealthScreen: React.FC = () => {
  const {
    assets,
    workOrders,
    stations,
    updateWorkOrderStatus,
    repairAsset,
    createManualWorkOrder,
  } = useMetroStore();

  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | AssetType>('all');
  const [healthFilter, setHealthFilter] = useState<'all' | 'degraded' | 'healthy'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'assets' | 'workOrders' | 'forecast' | 'roster'>('assets');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssetForWo, setSelectedAssetForWo] = useState<string>(assets[0]?.id || '');
  const [woPriority, setWoPriority] = useState<'high' | 'medium' | 'critical'>('high');
  const [woNotes, setWoNotes] = useState('Routine preventive overhaul.');

  const stationMap = new Map(stations.map((s) => [s.id, s.name]));

  // Filter Assets
  const filteredAssets = assets.filter((asset) => {
    if (activeTypeFilter !== 'all' && asset.type !== activeTypeFilter) return false;
    if (healthFilter === 'degraded' && asset.healthScore >= 60) return false;
    if (healthFilter === 'healthy' && asset.healthScore < 60) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const stationName = stationMap.get(asset.stationId)?.toLowerCase() || '';
      return (
        asset.name.toLowerCase().includes(q) ||
        asset.id.toLowerCase().includes(q) ||
        stationName.includes(q)
      );
    }
    return true;
  });

  const degradedAssetsCount = assets.filter((a) => a.healthScore < 60).length;
  const activeWorkOrdersCount = workOrders.filter((w) => w.status !== 'Done').length;

  const handleCreateWoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForWo) return;
    createManualWorkOrder(selectedAssetForWo, woPriority, woNotes);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Predictive Asset Health & Work Orders</span>
              {degradedAssetsCount > 0 && (
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30">
                  {degradedAssetsCount} Needs Service (&lt;60%)
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Escalators, lifts, doors, signals, AFC gates. Health &lt; 60 triggers automated work orders.
            </p>
          </div>
        </div>

        {/* View Toggle (Asset Fleet vs Work Orders Queue) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'assets'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white'
              }`}
            >
              Asset Fleet ({assets.length})
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              data-testid="tab-forecast"
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === 'forecast'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white'
              }`}
            >
              7-Day Forecast
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              data-testid="tab-roster"
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === 'roster'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white'
              }`}
            >
              Night Roster
            </button>
            <button
              onClick={() => setActiveTab('workOrders')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'workOrders'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white'
              }`}
            >
              <span>Work Orders</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
                {activeWorkOrdersCount}
              </span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dispatch Order</span>
          </button>
        </div>
      </div>

      {activeTab === 'forecast' ? (
        <FailureForecastPanel onOpenRoster={() => setActiveTab('roster')} />
      ) : activeTab === 'roster' ? (
        <NightRosterPanel />
      ) : activeTab === 'assets' ? (
        <>
          {/* Filter Bar */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Asset Type Filters */}
            <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
              {(
                [
                  ['all', 'All Equipment'],
                  ['escalator', 'Escalators'],
                  ['lift', 'Lifts'],
                  ['door', 'Platform Doors'],
                  ['signal', 'Signals'],
                  ['afc_gate', 'AFC Gates'],
                ] as const
              ).map(([typeKey, typeLabel]) => (
                <button
                  key={typeKey}
                  onClick={() => setActiveTypeFilter(typeKey)}
                  className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-colors font-medium ${
                    activeTypeFilter === typeKey
                      ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {typeLabel}
                </button>
              ))}
            </div>

            {/* Health Filter & Search */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search asset or station..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Health</option>
                <option value="degraded">Degraded (&lt;60%)</option>
                <option value="healthy">Healthy (≥60%)</option>
              </select>
            </div>
          </div>

          {/* Asset Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredAssets.map((asset) => {
              const stationName = getStationName(asset.stationId, stationMap.get(asset.stationId) || 'Central Facility');
              const isDegraded = asset.healthScore < 60;
              const activeWo = workOrders.find((w) => w.assetId === asset.id && w.status !== 'Done');

              // Mini SVG sparkline calculation
              const minVal = Math.min(...asset.historySparkline, 40);
              const maxVal = Math.max(...asset.historySparkline, 100);
              const range = maxVal - minVal || 1;
              const points = asset.historySparkline
                .map((val, idx) => {
                  const x = (idx / (asset.historySparkline.length - 1)) * 90 + 5;
                  const y = 35 - ((val - minVal) / range) * 28;
                  return `${x},${y}`;
                })
                .join(' ');

              return (
                <div
                  key={asset.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDegraded
                      ? 'bg-red-950/15 border-red-500/30 shadow-sm'
                      : 'bg-white dark:bg-[#0C182A] border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  {/* Top line: Name & Risk Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{asset.id}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{stationName}</span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5 line-clamp-1">
                        {asset.name}
                      </h3>
                    </div>
                    <StatusBadge type="risk" value={asset.failureRisk} size="sm" />
                  </div>

                  {/* Health Score & Sparkline */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 items-center">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Health Score
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span
                          className={`text-2xl font-bold font-mono ${
                            isDegraded
                              ? 'text-red-700 dark:text-red-400'
                              : asset.healthScore < 75
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {formatHealthScore(asset.healthScore)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-1">
                        <div
                          className={`h-full ${
                            isDegraded
                              ? 'bg-red-500'
                              : asset.healthScore < 75
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.round(asset.healthScore)}%` }}
                        />
                      </div>
                    </div>

                    {/* SVG Sparkline */}
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Degradation Trend</span>
                      <svg viewBox="0 0 100 40" className="w-24 h-9">
                        <polyline
                          fill="none"
                          stroke={isDegraded ? '#EF4444' : '#14B8A6'}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={points}
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Telemetry row */}
                  <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-500 dark:text-slate-400 py-1.5 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      <span className="font-mono text-slate-800 dark:text-slate-200">{formatTemperature(asset.temperatureCelsius)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Vibrate className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                      <span className="font-mono text-slate-800 dark:text-slate-200">{formatVibration(asset.vibrationMmS)}</span>
                    </div>
                    <div className="text-right font-mono text-slate-800 dark:text-slate-200">
                      {formatCycles(asset.cyclesCount)} cyc
                    </div>
                  </div>

                  {/* Work Order and Overhaul Action */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    {activeWo ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-semibold">
                          {activeWo.id}
                        </span>
                        <StatusBadge type="workOrder" value={activeWo.status} size="sm" />
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Nominal / No WO</span>
                    )}

                    <button
                      onClick={() => repairAsset(asset.id)}
                      className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-400 font-medium text-[11px] border border-teal-500/20 transition-colors ml-auto"
                      title="Calibrate and restore health to 99%"
                    >
                      Overhaul / Calibrate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Work Orders Kanban / List */
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Maintenance Work Order Pipeline
              </h2>
              <p className="text-[11px] text-slate-400">
                Lifecycle: Open → Assigned → In Progress → Done (Restores asset health)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {workOrders.map((wo) => {
              return (
                <div
                  key={wo.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {wo.id}
                      </span>
                      <StatusBadge type="workOrder" value={wo.status} size="sm" />
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                          wo.priority === 'critical'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {wo.priority} Priority
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Created {wo.createdAt}</span>
                      {wo.syncStatus === 'pending' && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                          Pending sync
                        </span>
                      )}
                    </div>

                    <div className="font-semibold text-slate-900 dark:text-slate-200">
                      {wo.assetName} · <span className="text-teal-700 dark:text-teal-400">{wo.stationName}</span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {wo.notes}
                    </p>

                    {wo.assignedCrew && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        <span>Crew: {wo.assignedCrew}</span>
                      </div>
                    )}
                  </div>

                  {/* Stage Transition Control */}
                  <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                    {wo.status === 'Open' && (
                      <button
                        onClick={() => updateWorkOrderStatus(wo.id, 'Assigned')}
                        className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-semibold transition-colors flex items-center gap-1"
                      >
                        <span>Assign Crew</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {wo.status === 'Assigned' && (
                      <button
                        onClick={() => updateWorkOrderStatus(wo.id, 'In Progress')}
                        className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold transition-colors flex items-center gap-1"
                      >
                        <span>Start Work</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {wo.status === 'In Progress' && (
                      <button
                        onClick={() => updateWorkOrderStatus(wo.id, 'Done')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Done</span>
                      </button>
                    )}

                    {wo.status === 'Done' && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-mono text-[11px] px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed & Restored
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Work Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
              Dispatch Manual Maintenance Work Order
            </h3>
            <form onSubmit={handleCreateWoSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Target Asset:</label>
                <select
                  value={selectedAssetForWo}
                  onChange={(e) => setSelectedAssetForWo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.healthScore}% health)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Priority:</label>
                <select
                  value={woPriority}
                  onChange={(e) => setWoPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dispatch Instructions / Notes:</label>
                <textarea
                  rows={3}
                  value={woNotes}
                  onChange={(e) => setWoNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-colors"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
