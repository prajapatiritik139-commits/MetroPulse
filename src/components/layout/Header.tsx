import React, { useState, useRef, useEffect } from 'react';
import { useMetroStore } from '../../store/metroStore';
import { Role } from '../../types/metro';
import {
  Play,
  Pause,
  Sun,
  Moon,
  Clock,
  Zap,
  Flame,
  ChevronDown,
  Sliders,
  Sunrise,
  SunMedium,
  Sunset,
  MoonStar,
  Wifi,
  WifiOff,
  RefreshCw,
  UserCheck,
  Bus,
  TrainFront,
  ShieldAlert,
  Sparkles,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import { DemoModeModal } from '../demo/DemoModeModal';
import { SettingsModal } from '../settings/SettingsModal';

export const Header: React.FC = () => {
  const {
    theme,
    toggleTheme,
    role,
    setRole,
    isSimulating,
    toggleSimulation,
    speedMultiplier,
    setSpeedMultiplier,
    simulatedTime,
    setSimulatedHour,
    kpis,
    incidents,
    setTab,
    effectiveOnline,
    isSimulatedOffline,
    setSimulateOffline,
    pendingSyncCount,
    lastSyncedTime,
    triggerManualSync,
    setSettingsModalOpen,
    startDemoMode,
    isDemoModeActive,
  } = useMetroStore();

  const [simMenuOpen, setSimMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const roleDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSimMenuOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formattedTime = simulatedTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const hour = simulatedTime.getHours();
  const isMorningPeak = hour >= 8 && hour < 10;
  const isEveningPeak = hour >= 17 && hour < 20;

  return (
    <>
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between px-3 sm:px-6 py-2 bg-[#0B1F3A] text-white border-b border-slate-800 shadow-md gap-2">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold text-base tracking-wider shadow-inner">
              M
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block leading-none">
                MetroPulse
              </span>
              <p className="text-[11px] text-slate-300 hidden sm:block mt-0.5">
                Gujarat Metro OCC · Gandhinagar–Ahmedabad Corridor
              </p>
            </div>
          </div>

          {/* Live / Offline Status Badge */}
          <div className="flex items-center gap-1.5 ml-1">
            {effectiveOnline ? (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold"
                title="Real-time telemetry connection active"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold"
                title={`Operating offline with cached data. Last synced: ${lastSyncedTime}`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Offline, using last known data</span>
                {pendingSyncCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-[10px] font-mono text-amber-200">
                    {pendingSyncCount} pending
                  </span>
                )}
              </div>
            )}

            {/* Offline Simulation Quick Toggle */}
            <button
              onClick={() => setSimulateOffline(!isSimulatedOffline)}
              className={`p-1 rounded-lg text-xs transition-colors border ${
                isSimulatedOffline
                  ? 'bg-amber-500/30 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
              title={isSimulatedOffline ? 'Switch to Online mode' : 'Simulate Offline PWA mode'}
              aria-label="Toggle offline simulation"
            >
              {isSimulatedOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            </button>

            {pendingSyncCount > 0 && effectiveOnline && (
              <button
                onClick={triggerManualSync}
                className="p-1 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs hover:bg-teal-500/30 transition-colors"
                title="Sync pending offline actions now"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </button>
            )}
          </div>
        </div>

        {/* Middle Zone: Simulated Clock + Compact Simulation Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time Clock display */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-slate-100 tabular-nums">
                {formattedTime}
              </span>
              <span className="text-slate-500 text-[10px] hidden md:inline">·</span>
              <span className="text-[10px] text-slate-300 font-medium hidden md:inline">
                {isMorningPeak ? (
                  <span className="text-amber-400">AM Rush (08:00–10:00)</span>
                ) : isEveningPeak ? (
                  <span className="text-amber-400">PM Rush (17:00–20:00)</span>
                ) : (
                  <span>Standard Off-Peak</span>
                )}
              </span>
            </div>
          </div>

          {/* Compact Simulation Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setSimMenuOpen(!simMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-200 transition-colors shadow-inner"
              aria-expanded={simMenuOpen}
              aria-haspopup="true"
              aria-label="Simulation controls dropdown"
            >
              <Sliders className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-semibold">Sim</span>
              <span className="font-mono text-teal-300 font-bold bg-teal-500/20 px-1.5 py-0.2 rounded text-[11px]">
                {speedMultiplier}x
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
                title={isSimulating ? 'Simulation running' : 'Simulation paused'}
              />
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${simMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {simMenuOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 mt-2 w-72 rounded-2xl bg-[#0C182A] border border-slate-700 shadow-2xl p-3.5 z-50 text-xs space-y-3 backdrop-blur-md">
                {/* Play/Pause row */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <span className="font-semibold text-slate-200">Simulation Engine</span>
                  <button
                    onClick={toggleSimulation}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      isSimulating
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    }`}
                  >
                    {isSimulating ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Speed Multiplier */}
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                    Execution Speed
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 font-mono">
                    {[1, 2, 5].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          setSpeedMultiplier(speed);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          speedMultiplier === speed
                            ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-sm'
                            : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {speed}x {speed === 1 ? '(Real)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time of Day Shifts */}
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                    Time of Day Preset
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        setSimulatedHour(8, 30);
                        setSimMenuOpen(false);
                      }}
                      className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-colors ${
                        isMorningPeak
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Sunrise className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="font-bold block text-[11px]">AM Peak</span>
                        <span className="text-[10px] text-slate-400 font-mono">08:30 Rush</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSimulatedHour(13, 0);
                        setSimMenuOpen(false);
                      }}
                      className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-colors ${
                        hour >= 11 && hour <= 16
                          ? 'bg-teal-500/20 border-teal-500/50 text-teal-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <SunMedium className="w-4 h-4 text-teal-400 shrink-0" />
                      <div>
                        <span className="font-bold block text-[11px]">Midday</span>
                        <span className="text-[10px] text-slate-400 font-mono">13:00 Off-Peak</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSimulatedHour(18, 15);
                        setSimMenuOpen(false);
                      }}
                      className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-colors ${
                        isEveningPeak
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Sunset className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="font-bold block text-[11px]">PM Peak</span>
                        <span className="text-[10px] text-slate-400 font-mono">18:15 Rush</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSimulatedHour(23, 0);
                        setSimMenuOpen(false);
                      }}
                      className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-colors ${
                        hour >= 22 || hour <= 5
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <MoonStar className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <span className="font-bold block text-[11px]">Late Night</span>
                        <span className="text-[10px] text-slate-400 font-mono">23:00 Low</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Zone: Demo Mode, Role Switcher, Critical Badge, Settings, Theme */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Demo Mode Button (Scripted 2-Minute Scenario) */}
          <button
            onClick={startDemoMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
              isDemoModeActive
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950'
            }`}
            title="Launch scripted 2-minute incident and recovery demo"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden sm:inline">Demo Mode</span>
            <span className="sm:hidden">Demo</span>
          </button>

          {/* Multi-Role Switcher */}
          <div className="relative" ref={roleDropdownRef}>
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-colors"
              aria-label="Switch User Role"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              <span className="capitalize">{role}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#0C182A] border border-slate-700 shadow-2xl p-2 z-50 text-xs space-y-1">
                <button
                  onClick={() => {
                    setRole('operator');
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl text-left flex items-center gap-2 transition-colors ${
                    role === 'operator'
                      ? 'bg-teal-500/20 text-teal-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <TrainFront className="w-4 h-4 text-teal-400" />
                  <div>
                    <span className="block font-bold">Operator (OCC)</span>
                    <span className="text-[10px] text-slate-400">Control Room & Map</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setRole('coordinator');
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl text-left flex items-center gap-2 transition-colors ${
                    role === 'coordinator'
                      ? 'bg-teal-500/20 text-teal-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Bus className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="block font-bold">Coordinator</span>
                    <span className="text-[10px] text-slate-400">Feeder Fleet & Alerts</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setRole('commuter');
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl text-left flex items-center gap-2 transition-colors ${
                    role === 'commuter'
                      ? 'bg-teal-500/20 text-teal-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="block font-bold">Commuter</span>
                    <span className="text-[10px] text-slate-400">Mobile Phone View</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Critical alert triage badge vs green All Clear badge */}
          {(() => {
            const unresolvedCritical = incidents.filter(
              (i) => i.status !== 'resolved' && i.severity === 'critical'
            ).length;

            if (unresolvedCritical > 0) {
              return (
                <button
                  onClick={() => setTab('incidents')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-semibold hover:bg-red-500/30 transition-all animate-pulse"
                  title="View Critical Incidents in Command"
                >
                  <Flame className="w-3.5 h-3.5 text-red-400" aria-hidden="true" />
                  <span className="font-mono-numbers">{unresolvedCritical} Critical</span>
                </button>
              );
            }

            return (
              <button
                onClick={() => setTab('incidents')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30 transition-all"
                title="All Clear — No active critical incidents"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span>All Clear</span>
              </button>
            );
          })()}

          {/* Settings Modal Toggle */}
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Settings (Offline PWA & Sync Queue)"
            aria-label="Open settings modal"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle light/dark theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-teal-300" />}
          </button>
        </div>
      </header>

      {/* Scripted 2-Minute Demo Modal */}
      <DemoModeModal />

      {/* Settings Modal (Offline mode & Sync Queue) */}
      <SettingsModal />
    </>
  );
};
