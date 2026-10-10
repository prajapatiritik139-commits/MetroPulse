import React from 'react';
import { useMetroStore, ScreenTab } from '../../store/metroStore';
import {
  LayoutDashboard,
  MapPin,
  TrendingUp,
  Wrench,
  ShieldAlert,
  Bus,
  Bell,
  UserCheck,
} from 'lucide-react';

export const MobileTabBar: React.FC = () => {
  const currentTab = useMetroStore((state) => state.currentTab);
  const setTab = useMetroStore((state) => state.setTab);
  const role = useMetroStore((state) => state.role);
  const kpis = useMetroStore((state) => state.kpis);
  const workOrders = useMetroStore((state) => state.workOrders);
  const incidents = useMetroStore((state) => state.incidents);
  const disruptions = useMetroStore((state) => state.disruptions);
  const alerts = useMetroStore((state) => state.alerts);

  // Commuter screen has its own bottom tab bar inside the phone view
  if (role === 'commuter') {
    return null;
  }

  const openWorkOrders = workOrders.filter((wo) => wo.status !== 'Done').length;
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved').length;
  const unackedAlerts = alerts.filter((a) => !a.acknowledged).length;
  const pendingDisruptions = disruptions.filter((d) => d.status === 'pending').length;

  const operatorTabs: Array<{
    id: ScreenTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    isCritical?: boolean;
  }> = [
    { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'assets', label: 'Assets', icon: Wrench, badge: openWorkOrders || undefined },
    {
      id: 'incidents',
      label: 'Command',
      icon: ShieldAlert,
      badge: activeIncidents || undefined,
      isCritical: kpis.criticalAlertsCount > 0,
    },
  ];

  const coordinatorTabs: Array<{
    id: ScreenTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    isCritical?: boolean;
  }> = [
    { id: 'coordinator', label: 'Feeder', icon: Bus, badge: pendingDisruptions || undefined },
    { id: 'map', label: 'Map', icon: MapPin },
    {
      id: 'incidents',
      label: 'Alerts',
      icon: Bell,
      badge: unackedAlerts || undefined,
      isCritical: kpis.criticalAlertsCount > 0,
    },
  ];

  const tabs = role === 'coordinator' ? coordinatorTabs : operatorTabs;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1F3A] border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg"
      aria-label="Mobile Bottom Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-2 min-w-[56px] rounded-lg transition-colors ${
              isActive ? 'text-teal-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {tab.badge !== undefined && (
                <span
                  className={`absolute -top-1 -right-2 px-1 text-[9px] font-mono font-bold rounded-full ${
                    tab.isCritical
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-amber-500 text-slate-950'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
