import React, { useEffect } from 'react';
import { useMetroStore } from './store/metroStore';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { ToastContainer } from './components/common/ToastContainer';

// Screens
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { NetworkMapScreen } from './components/map/NetworkMapScreen';
import { CrowdForecastScreen } from './components/forecast/CrowdForecastScreen';
import { AssetHealthScreen } from './components/assets/AssetHealthScreen';
import { IncidentCommandScreen } from './components/incidents/IncidentCommandScreen';
import { CoordinatorScreen } from './components/coordinator/CoordinatorScreen';
import { CommuterScreen } from './components/commuter/CommuterScreen';

export default function App() {
  const currentTab = useMetroStore((state) => state.currentTab);
  const theme = useMetroStore((state) => state.theme);
  const tick = useMetroStore((state) => state.tick);
  const initIndexedDb = useMetroStore((state) => state.initIndexedDb);
  const triggerManualSync = useMetroStore((state) => state.triggerManualSync);

  // Initialize Dexie State on initial boot
  useEffect(() => {
    initIndexedDb();
  }, [initIndexedDb]);

  // Online / Offline Connectivity Detection
  useEffect(() => {
    const handleOnline = () => {
      triggerManualSync();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [triggerManualSync]);

  // Initialize Theme (Dark mode default)
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Master Simulation Engine: 3-Second Heartbeat Tick
  useEffect(() => {
    const timer = setInterval(() => {
      tick();
    }, 3000);

    return () => clearInterval(timer);
  }, [tick]);

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'map':
        return <NetworkMapScreen />;
      case 'forecast':
        return <CrowdForecastScreen />;
      case 'assets':
        return <AssetHealthScreen />;
      case 'incidents':
        return <IncidentCommandScreen />;
      case 'coordinator':
        return <CoordinatorScreen />;
      case 'commuter':
        return <CommuterScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060D17] text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-teal-500 selection:text-slate-950 font-sans pb-16 md:pb-0">
      {/* Top Header */}
      <Header />

      {/* Main Control Console Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Nav Sidebar (Desktop) */}
        <Sidebar />

        {/* Content Viewport */}
        <main
          className="flex-1 p-3.5 sm:p-5 lg:p-6 overflow-y-auto max-w-[1720px] mx-auto w-full"
          role="main"
          aria-label="MetroPulse Control Center View"
        >
          {renderActiveScreen()}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar />

      {/* Interactive Global Toast Container */}
      <ToastContainer />
    </div>
  );
}
