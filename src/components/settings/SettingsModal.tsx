import React, { useState, useEffect } from 'react';
import { useMetroStore } from '../../store/metroStore';
import { getPendingSyncQueue } from '../../core/db';
import {
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  X,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const isSettingsModalOpen = useMetroStore((state) => state.isSettingsModalOpen);
  const setSettingsModalOpen = useMetroStore((state) => state.setSettingsModalOpen);
  const isSimulatedOffline = useMetroStore((state) => state.isSimulatedOffline);
  const setSimulateOffline = useMetroStore((state) => state.setSimulateOffline);
  const effectiveOnline = useMetroStore((state) => state.effectiveOnline);
  const pendingSyncCount = useMetroStore((state) => state.pendingSyncCount);
  const lastSyncedTime = useMetroStore((state) => state.lastSyncedTime);
  const triggerManualSync = useMetroStore((state) => state.triggerManualSync);
  const stations = useMetroStore((state) => state.stations);
  const workOrders = useMetroStore((state) => state.workOrders);
  const alerts = useMetroStore((state) => state.alerts);
  const theme = useMetroStore((state) => state.theme);
  const toggleTheme = useMetroStore((state) => state.toggleTheme);

  const [queueItems, setQueueItems] = useState<any[]>([]);

  useEffect(() => {
    if (isSettingsModalOpen) {
      getPendingSyncQueue().then((items) => setQueueItems(items));
    }
  }, [isSettingsModalOpen, pendingSyncCount]);

  if (!isSettingsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg bg-[#0C182A] text-white rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0B1F3A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">MetroPulse Console Settings</h2>
              <p className="text-xs text-slate-400">Offline PWA Simulation & Data Synchronization</p>
            </div>
          </div>

          <button
            onClick={() => setSettingsModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Section 1: Offline Simulation Toggle */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-200">Simulate Offline Mode</span>
                  {isSimulatedOffline ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      OFFLINE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      LIVE ONLINE
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Disconnects OCC central telemetry for testing. Actions taken offline (acknowledging alerts, executing playbooks, dispatching work orders) receive a <strong className="text-amber-300">Pending sync</strong> tag and auto-sync on reconnect.
                </p>
              </div>

              {/* iOS Style Toggle Switch */}
              <button
                role="switch"
                aria-checked={isSimulatedOffline}
                onClick={() => setSimulateOffline(!isSimulatedOffline)}
                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isSimulatedOffline ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isSimulatedOffline ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                {effectiveOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Status: {effectiveOnline ? 'Telemetry Live' : 'Operating with IndexedDB cache'}</span>
              </div>
              <span className="font-mono">Last Synced: {lastSyncedTime}</span>
            </div>
          </div>

          {/* Section 2: Sync Queue Inspector */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 text-teal-400 ${pendingSyncCount > 0 ? 'animate-spin' : ''}`} />
                <span className="font-bold text-slate-200">Local Action Sync Queue</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                {pendingSyncCount} Action{pendingSyncCount !== 1 ? 's' : ''} Queued
              </span>
            </div>

            {queueItems.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-slate-300">All offline actions synchronized</span>
                <p className="text-[10px]">No pending mutations in local queue.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {queueItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-mono font-bold text-amber-300 capitalize">
                        {item.actionType.replace('_', ' ')}
                      </span>
                      <span className="text-slate-400 block text-[10px] font-mono">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Pending sync
                    </span>
                  </div>
                ))}
              </div>
            )}

            {pendingSyncCount > 0 && effectiveOnline && (
              <button
                onClick={triggerManualSync}
                className="w-full py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Synchronize Now ({pendingSyncCount})</span>
              </button>
            )}
          </div>

          {/* Section 3: IndexedDB & PWA Status */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-slate-200">Offline PWA & Storage Layer</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">IndexedDB Cache</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Dexie DB Active
                </span>
                <span className="text-slate-400 block text-[10px] mt-0.5 font-mono">
                  {stations.length} Stns · {workOrders.length} Work Orders
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Service Worker</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  Cache-First /sw.js
                </span>
                <span className="text-slate-400 block text-[10px] mt-0.5 font-mono">
                  PWA Standalone Ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#0B1F3A] flex items-center justify-end">
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
