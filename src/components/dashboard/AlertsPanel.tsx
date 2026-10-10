import React, { useState } from 'react';
import { useMetroStore } from '../../store/metroStore';
import { StatusBadge } from '../common/StatusBadge';
import { AlertSeverity } from '../../types/metro';
import {
  Bell,
  Check,
  ExternalLink,
  ShieldAlert,
  Inbox,
  Filter,
} from 'lucide-react';

export const AlertsPanel: React.FC = () => {
  const alerts = useMetroStore((state) => state.alerts);
  const acknowledgeAlert = useMetroStore((state) => state.acknowledgeAlert);
  const setTab = useMetroStore((state) => state.setTab);
  const selectStation = useMetroStore((state) => state.selectStation);
  const selectIncident = useMetroStore((state) => state.selectIncident);

  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const filteredAlerts = alerts.filter((alert) => {
    if (!showAcknowledged && alert.acknowledged) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    return true;
  });

  const handleAlertAction = (alert: (typeof alerts)[0]) => {
    if (alert.incidentId) {
      selectIncident(alert.incidentId);
      setTab('incidents');
    } else if (alert.assetId) {
      setTab('assets');
    } else if (alert.stationId) {
      selectStation(alert.stationId);
      setTab('map');
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#0C182A] border border-slate-200 dark:border-slate-800 p-5 flex flex-col h-full shadow-sm">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-teal-600 dark:text-teal-400">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Active Control Room Alerts</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {alerts.filter((a) => !a.acknowledged).length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Live operational exceptions feed</p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs">
            {(['all', 'critical', 'warning', 'info'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                  severityFilter === sev
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer ml-1 select-none">
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={(e) => setShowAcknowledged(e.target.checked)}
              className="rounded border-slate-700 text-teal-500 focus:ring-teal-400"
            />
            <span>Show Acked</span>
          </label>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pt-4 pr-1 max-h-[380px]">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Inbox className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              No alerts matching criteria
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Network operating nominal within safety thresholds.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  alert.acknowledged
                    ? 'opacity-60 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60'
                    : isCritical
                    ? 'bg-red-950/15 border-red-500/30'
                    : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <StatusBadge type="alert" value={alert.severity} size="sm" />
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {alert.title}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono ml-auto">
                        {alert.timestamp}
                      </span>
                      {alert.syncStatus === 'pending' && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Pending sync
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-xs">
                      {/* Navigation CTA */}
                      {(alert.incidentId || alert.assetId || alert.stationId) && (
                        <button
                          onClick={() => handleAlertAction(alert)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                        >
                          <span>Triage Target</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}

                      {/* Acknowledge Action */}
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 ml-auto px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Acknowledge</span>
                        </button>
                      )}

                      {alert.acknowledged && (
                        <span className="text-[10px] font-mono text-slate-400 ml-auto italic">
                          Acknowledged
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
