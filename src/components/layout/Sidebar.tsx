import React from 'react';
import { useMetroStore, ScreenTab } from '../../store/metroStore';
import {
  LayoutDashboard,
  MapPin,
  TrendingUp,
  Wrench,
  ShieldAlert,
  TrainFront,
  Radio,
  Layers,
  Bus,
  UserCheck,
  Bell,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const currentTab = useMetroStore((state) => state.currentTab);
  const setTab = useMetroStore((state) => state.setTab);
  const role = useMetroStore((state) => state.role);
  const kpis = useMetroStore((state) => state.kpis);
  const workOrders = useMetroStore((state) => state.workOrders);
  const incidents = useMetroStore((state) => state.incidents);
  const disruptions = useMetroStore((state) => state.disruptions);
  const alerts = useMetroStore((state) => state.alerts);

  const openWorkOrders = workOrders.filter((wo) => wo.status !== 'Done').length;
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved').length;
  const criticalIncidentsCount = incidents.filter((i) => i.status !== 'resolved' && i.severity === 'critical').length;
  const unackedAlertsCount = alerts.filter((a) => !a.acknowledged).length;
  const pendingDisruptions = disruptions.filter((d) => d.status === 'pending').length;

  // Master List of Nav Items
  const allNavItems: Record<
    ScreenTab,
    {
      id: ScreenTab;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: number;
      badgeCritical?: boolean;
      badgeWarning?: boolean;
    }
  > = {
    dashboard: {
      id: 'dashboard',
      label: 'Control Dashboard',
      icon: LayoutDashboard,
    },
    map: {
      id: 'map',
      label: 'Network Map',
      icon: MapPin,
    },
    forecast: {
      id: 'forecast',
      label: 'Crowd Forecast',
      icon: TrendingUp,
    },
    assets: {
      id: 'assets',
      label: 'Asset Health',
      icon: Wrench,
      badge: openWorkOrders > 0 ? openWorkOrders : undefined,
      badgeWarning: true,
    },
    incidents: {
      id: 'incidents',
      label: role === 'coordinator' ? 'Alerts & Incidents' : 'Incident Command',
      icon: role === 'coordinator' ? Bell : ShieldAlert,
      badge: role === 'coordinator' ? (unackedAlertsCount > 0 ? unackedAlertsCount : undefined) : (activeIncidents > 0 ? activeIncidents : undefined),
      badgeCritical: criticalIncidentsCount > 0,
    },
    coordinator: {
      id: 'coordinator',
      label: 'City Feeder Fleet',
      icon: Bus,
      badge: pendingDisruptions > 0 ? pendingDisruptions : undefined,
      badgeWarning: true,
    },
    commuter: {
      id: 'commuter',
      label: 'Commuter Companion',
      icon: UserCheck,
    },
  };

  // Filter based on active user Role:
  // Operator: Dashboard, Network Map, Crowd Forecast, Asset Health, Incident Command
  // City Coordinator: City Feeder Fleet, Network Map, and an alerts view
  // Commuter: Commuter Companion only
  const activeNavKeys: ScreenTab[] =
    role === 'operator'
      ? ['dashboard', 'map', 'forecast', 'assets', 'incidents']
      : role === 'coordinator'
      ? ['coordinator', 'map', 'incidents']
      : ['commuter'];

  const visibleNavItems = activeNavKeys.map((key) => allNavItems[key]);

  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0 bg-[#0B1F3A] border-r border-slate-800 text-slate-300 min-h-[calc(100vh-57px)] select-none"
      aria-label="Main Navigation"
    >
      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5">
        <div className="px-3 pb-2 flex items-center justify-between text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          <span>
            {role === 'operator'
              ? 'Operator Console'
              : role === 'coordinator'
              ? 'Coordinator Console'
              : 'Commuter View'}
          </span>
          <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.2 rounded capitalize">
            {role}
          </span>
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-teal-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-mono font-bold rounded-md ${
                    item.badgeCritical
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                      : item.badgeWarning
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-teal-500/20 text-teal-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Network Overview Mini Status */}
      <div className="p-3 mx-3 mb-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-xs">
            <Radio className="w-3.5 h-3.5 text-teal-400" />
            <span>Gujarat Metro</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-medium">12 Stns Live</span>
        </div>

        <div className="space-y-1.5 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span>Teal Line 1</span>
            </div>
            <span className="font-mono text-emerald-400 font-semibold">98.4% Nominal</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Ruby Line 2</span>
            </div>
            <span className="font-mono text-emerald-400 font-semibold">97.8% Nominal</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
