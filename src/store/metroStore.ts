import { create } from 'zustand';
import {
  MetroLine,
  Station,
  Train,
  Asset,
  WorkOrder,
  Incident,
  Alert,
  SuggestedAction,
  NetworkKpis,
  ActionLog,
  IncidentType,
  WorkOrderStatus,
  WorkOrderPriority,
  Role,
  FeederBus,
  DisruptionAction,
} from '../types/metro';
import {
  SEED_LINES,
  SEED_STATIONS,
  SEED_TRAINS,
  SEED_ASSETS,
  SEED_WORK_ORDERS,
  SEED_INCIDENTS,
  SEED_ALERTS,
  SEED_SUGGESTED_ACTIONS,
  INITIAL_KPIS,
  SEED_FEEDER_BUSES,
  SEED_DISRUPTIONS,
} from '../data/seedData';
import { runSimulationTick } from '../simulation/simulationEngine';
import {
  db,
  persistLastKnownState,
  loadLastKnownState,
  enqueueOfflineAction,
  getPendingSyncQueue,
  markSyncQueueItemCompleted,
} from '../core/db';
import { offlineManager } from '../core/offline';
import { PRESET_SCENARIOS } from '../core/scenarios';

export type ScreenTab =
  | 'dashboard'
  | 'map'
  | 'forecast'
  | 'assets'
  | 'incidents'
  | 'coordinator'
  | 'commuter';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'critical';
}

/** Optional roster fields when creating a work order (e.g. from the night-shift roster). */
export interface WorkOrderExtras {
  task?: string;
  assignedCrew?: string;
  scheduledTime?: string;
  scheduledDuration?: number;
  source?: 'roster' | 'manual';
  /** Suppress the per-order toast (used for bulk creation). */
  silent?: boolean;
}
export type WorkOrderDetailsPatch = Partial<
  Pick<WorkOrder, 'task' | 'priority' | 'assignedCrew' | 'scheduledTime' | 'scheduledDuration' | 'notes'>
>;

interface MetroStoreState {
  currentTab: ScreenTab;
  theme: 'dark' | 'light';
  role: Role; // 'operator' | 'coordinator' | 'commuter'
  isSimulating: boolean;
  speedMultiplier: number; // 1, 2, 5
  simulatedTime: Date;

  // Offline PWA State
  isOnline: boolean;
  isSimulatedOffline: boolean;
  effectiveOnline: boolean;
  pendingSyncCount: number;
  lastSyncedTime: string;

  // Settings Modal State
  isSettingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;

  // Demo Mode 2-Minute Scripted Scenario State
  isDemoModeActive: boolean;
  demoPhase: number; // 1, 2, 3, 4
  demoSeconds: number; // 0 to 120
  startDemoMode: () => void;
  stopDemoMode: () => void;
  advanceDemoPhase: (targetPhase?: number) => void;

  lines: MetroLine[];
  stations: Station[];
  trains: Train[];
  assets: Asset[];
  workOrders: WorkOrder[];
  incidents: Incident[];
  alerts: Alert[];
  kpis: NetworkKpis;
  suggestedActions: SuggestedAction[];
  actionLogs: ActionLog[];

  // Intermodal City Feeder System
  feederBuses: FeederBus[];
  disruptions: DisruptionAction[];

  selectedStationId: string | null;
  selectedIncidentId: string | null;
  toasts: ToastNotification[];

  // Actions
  setTab: (tab: ScreenTab) => void;
  setRole: (role: Role) => void;
  toggleTheme: () => void;
  toggleSimulation: () => void;
  setSpeedMultiplier: (speed: number) => void;
  setSimulatedHour: (hour: number, minute?: number) => void;
  tick: () => void;

  // Offline Controls
  setSimulateOffline: (simulate: boolean) => void;
  triggerManualSync: () => Promise<void>;
  updatePendingCount: () => Promise<void>;

  selectStation: (id: string | null) => void;
  selectIncident: (id: string | null) => void;

  acknowledgeAlert: (alertId: string) => void;
  clearAlert: (alertId: string) => void;

  executePlaybookStep: (incidentId: string, stepNumber: number) => void;
  resolveIncident: (incidentId: string) => void;
  simulateIncident: (type: IncidentType, targetStationId?: string) => void;
  simulatePresetScenario: (scenarioId: string) => void;

  executeCrowdAction: (actionId: string) => void;

  // Work Orders & Assets
  updateWorkOrderStatus: (workOrderId: string, status: WorkOrderStatus) => void;
  repairAsset: (assetId: string) => void;
  createManualWorkOrder: (
    assetId: string,
    priority: WorkOrderPriority,
    notes: string,
    extras?: WorkOrderExtras
  ) => string | undefined;
  updateWorkOrderDetails: (workOrderId: string, patch: WorkOrderDetailsPatch) => void;

  // Intermodal Disruption Actions
  approveDisruptionAction: (id: string) => void;
  rejectDisruptionAction: (id: string) => void;

  // Toasts
  addToast: (title: string, message: string, type?: ToastNotification['type']) => void;
  dismissToast: (id: string) => void;

  // Dexie Hydration
  initIndexedDb: () => Promise<void>;
}

// Initial simulated clock set to 08:35 AM (Morning peak rush)
const initialSimDate = new Date();
initialSimDate.setHours(8, 35, 0, 0);

export const formatSimClock = (d: Date): string => {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatSimClockFull = (d: Date): string => {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const getRelativeSimTime = (base: Date, offsetMinutes: number): string => {
  return formatSimClock(new Date(base.getTime() + offsetMinutes * 60 * 1000));
};

export const getRelativeSimTimeFull = (base: Date, offsetMinutes: number): string => {
  return formatSimClockFull(new Date(base.getTime() + offsetMinutes * 60 * 1000));
};

// Seed initial incidents as "reported 12 min ago" relative to sim time (08:35 -> 08:23)
const initialIncidents: Incident[] = SEED_INCIDENTS.map((inc) => {
  if (inc.id === 'INC-2041') {
    return {
      ...inc,
      reportedAt: getRelativeSimTime(initialSimDate, -12), // 12 min ago formatted as HH:MM
      playbookSteps: inc.playbookSteps.map((s) => ({
        ...s,
        executedAt: s.executed ? getRelativeSimTime(initialSimDate, -10) : undefined,
      })),
    };
  }
  if (inc.id === 'INC-2040') {
    return {
      ...inc,
      reportedAt: getRelativeSimTime(initialSimDate, -17),
      playbookSteps: inc.playbookSteps.map((s, idx) => ({
        ...s,
        executedAt: s.executed ? getRelativeSimTime(initialSimDate, -15 + idx * 2) : undefined,
      })),
    };
  }
  return inc;
});

// Seed initial alerts derived from simulation clock
const initialAlerts: Alert[] = SEED_ALERTS.map((alt) => {
  if (alt.id === 'ALT-301') {
    return { ...alt, timestamp: getRelativeSimTimeFull(initialSimDate, -12) };
  }
  if (alt.id === 'ALT-302') {
    return { ...alt, timestamp: getRelativeSimTimeFull(initialSimDate, -13) };
  }
  return { ...alt, timestamp: getRelativeSimTimeFull(initialSimDate, -17) };
});

const initialActionLogs: ActionLog[] = [
  {
    id: 'LOG-01',
    timestamp: getRelativeSimTimeFull(initialSimDate, -15),
    title: 'Shift Handover Complete',
    details: 'Day shift Gujarat OCC controller logged in. 2 lines nominal, 1 active incident under triage.',
    category: 'system',
  },
  {
    id: 'LOG-02',
    timestamp: getRelativeSimTimeFull(initialSimDate, -10),
    title: 'Playbook Step 1 Executed',
    details: 'Announced platform crowd metering at Old High Court.',
    category: 'playbook',
  },
];

// Helper to apply scripted demo drill phases across the app state
function applyDemoPhaseState(
  phase: number,
  state: MetroStoreState
): Partial<MetroStoreState> {
  const simTimeStr = state.simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (phase === 1) {
    // Phase 1: Surge raises Motera Stadium (ST-08) and Old High Court (ST-05) crowd to 96% on the map
    const updatedStations = state.stations.map((st) => {
      if (st.id === 'ST-08' || st.id === 'ST-05') {
        return {
          ...st,
          crowdPercentage: 96,
          crowdLevel: 'critical' as const,
          passengerVolume: Math.round(st.capacity * 0.96),
          inflowRate: Math.max(st.inflowRate, 142),
          forecast: {
            minute15: 96,
            minute30: 97,
            minute60: 72,
          },
        };
      }
      return st;
    });

    return {
      stations: updatedStations,
      kpis: {
        ...state.kpis,
        passengersPerHour: 24800,
      },
    };
  }

  if (phase === 2) {
    // Phase 2: Breakdown creates a real incident in Incident Command (Train TR-101 stalled near Sector 16)
    const existingDemoInc = state.incidents.find((i) => i.id === 'INC-2042');
    let updatedIncidents = state.incidents;
    if (!existingDemoInc) {
      const demoIncident: Incident = {
        id: 'INC-2042',
        title: 'Traction Inverter Failure — Train TR-101 (Sector 16)',
        type: 'train_breakdown',
        severity: 'critical',
        affectedStationIds: ['ST-02'],
        affectedLineIds: ['L1'],
        reportedAt: simTimeStr,
        status: 'active',
        description: 'Lead traction motor controller tripped on Train TR-101 near Sector 16. Consist immobile on northbound track.',
        playbookSteps: [
          { stepNumber: 1, instruction: 'Issue emergency holding signals to following trains TR-102 and TR-103', executed: false },
          { stepNumber: 2, instruction: 'Dispatch auxiliary shunter locomotive from Gyaspur depot', executed: false },
          { stepNumber: 3, instruction: 'Broadcast passenger delay advisory across Line 1 concourses', executed: false },
          { stepNumber: 4, instruction: 'Institute single-line bidirectional bypass around Sector 16 blockage', executed: false },
        ],
        syncStatus: 'synced',
      };
      updatedIncidents = [demoIncident, ...state.incidents];
    } else {
      updatedIncidents = state.incidents.map((i) => (i.id === 'INC-2042' ? { ...i, status: 'active' as const } : i));
    }

    // Keep Motera Stadium & Old High Court at 96%
    const updatedStations = state.stations.map((st) => {
      if (st.id === 'ST-08' || st.id === 'ST-05') {
        return {
          ...st,
          crowdPercentage: 96,
          crowdLevel: 'critical' as const,
          passengerVolume: Math.round(st.capacity * 0.96),
        };
      }
      return st;
    });

    const activeCritical = updatedIncidents.filter((i) => i.status !== 'resolved' && i.severity === 'critical').length;

    return {
      incidents: updatedIncidents,
      stations: updatedStations,
      kpis: {
        ...state.kpis,
        criticalAlertsCount: activeCritical,
        avgHeadwayMinutes: 6.4,
        onTimePerformance: 89.5,
      },
      selectedIncidentId: 'INC-2042',
    };
  }

  if (phase === 3) {
    // Phase 3: Bus response creates approved items in City Feeder panel
    const updatedDisruptions = state.disruptions.map((d) => ({
      ...d,
      status: 'approved' as const,
      syncStatus: 'synced' as const,
    }));

    return {
      disruptions: updatedDisruptions,
      kpis: {
        ...state.kpis,
        avgHeadwayMinutes: 4.8,
        onTimePerformance: 94.2,
      },
    };
  }

  if (phase === 4) {
    // Phase 4: Recovery lowers crowds and resolves the incident
    const updatedStations = state.stations.map((st) => {
      if (st.id === 'ST-08') {
        return {
          ...st,
          crowdPercentage: 48,
          crowdLevel: 'moderate' as const,
          passengerVolume: Math.round(st.capacity * 0.48),
          forecast: {
            minute15: 52,
            minute30: 56,
            minute60: 42,
          },
        };
      }
      if (st.id === 'ST-05') {
        return {
          ...st,
          crowdPercentage: 58,
          crowdLevel: 'moderate' as const,
          passengerVolume: Math.round(st.capacity * 0.58),
          forecast: {
            minute15: 64,
            minute30: 70,
            minute60: 52,
          },
        };
      }
      return st;
    });

    const updatedIncidents = state.incidents.map((i) => {
      if (i.id === 'INC-2042' || i.id === 'INC-2041') {
        return {
          ...i,
          status: 'resolved' as const,
          playbookSteps: i.playbookSteps.map((s) => ({ ...s, executed: true, executedAt: simTimeStr })),
        };
      }
      return i;
    });

    const updatedAlerts = state.alerts.map((a) => ({ ...a, acknowledged: true }));
    const activeCritical = updatedIncidents.filter((i) => i.status !== 'resolved' && i.severity === 'critical').length;

    return {
      stations: updatedStations,
      incidents: updatedIncidents,
      alerts: updatedAlerts,
      kpis: {
        ...state.kpis,
        criticalAlertsCount: activeCritical,
        avgHeadwayMinutes: 3.2,
        onTimePerformance: 98.4,
      },
    };
  }

  return {};
}

const getInitialStoredTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('metropulse_theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch (e) {}
  }
  return 'dark';
};

export const useMetroStore = create<MetroStoreState>((set, get) => ({
  currentTab: 'dashboard',
  theme: getInitialStoredTheme(),
  role: 'operator',
  isSimulating: true,
  speedMultiplier: 1,
  simulatedTime: initialSimDate,

  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSimulatedOffline: false,
  effectiveOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingSyncCount: 0,
  lastSyncedTime: '08:35',

  isSettingsModalOpen: false,
  setSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),

  isDemoModeActive: false,
  demoPhase: 1,
  demoSeconds: 0,

  lines: SEED_LINES,
  stations: SEED_STATIONS,
  trains: SEED_TRAINS,
  assets: SEED_ASSETS,
  workOrders: SEED_WORK_ORDERS,
  incidents: initialIncidents,
  alerts: initialAlerts,
  kpis: INITIAL_KPIS,
  suggestedActions: SEED_SUGGESTED_ACTIONS,
  feederBuses: SEED_FEEDER_BUSES,
  disruptions: SEED_DISRUPTIONS,
  actionLogs: initialActionLogs,

  selectedStationId: null,
  selectedIncidentId: 'INC-2041',
  toasts: [],

  setTab: (tab) => set({ currentTab: tab }),

  // Role switching changes the default page:
  // Operator -> Dashboard
  // City Coordinator -> City Feeder Fleet (coordinator)
  // Commuter -> Commuter Companion (commuter)
  setRole: (role) => {
    let defaultTab: ScreenTab = 'dashboard';
    if (role === 'coordinator') defaultTab = 'coordinator';
    else if (role === 'commuter') defaultTab = 'commuter';
    else defaultTab = 'dashboard';

    set({ role, currentTab: defaultTab });
    get().addToast('Role Switched', `Active console view set to: ${role.toUpperCase()}`, 'info');
  },

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('metropulse_theme', next);
        } catch (e) {}
      }
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: next };
    });
  },

  toggleSimulation: () => set((state) => ({ isSimulating: !state.isSimulating })),

  setSpeedMultiplier: (speed) => set({ speedMultiplier: speed }),

  setSimulatedHour: (hour, minute = 0) => {
    set((state) => {
      const nextDate = new Date(state.simulatedTime);
      nextDate.setHours(hour, minute, 0, 0);
      return { simulatedTime: nextDate };
    });
  },

  // Offline Simulation & Management
  setSimulateOffline: (simulate) => {
    offlineManager.setSimulateOffline(simulate);
    const status = offlineManager.getStatus();
    set({
      isSimulatedOffline: simulate,
      effectiveOnline: status.effectiveOnline,
    });

    if (simulate) {
      get().addToast(
        'Offline Mode Activated',
        'Simulating disconnect. OCC is operating with cached data from IndexedDB.',
        'warning'
      );
    } else {
      get().triggerManualSync();
    }
  },

  updatePendingCount: async () => {
    const queue = await getPendingSyncQueue();
    set({ pendingSyncCount: queue.length });
  },

  triggerManualSync: async () => {
    const queue = await getPendingSyncQueue();
    const count = queue.length > 0 ? queue.length : 3;

    for (const item of queue) {
      await markSyncQueueItemCompleted(item.id);
    }

    const simClock = get().simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    set((state) => ({
      pendingSyncCount: 0,
      lastSyncedTime: simClock,
      alerts: state.alerts.map((a) => ({ ...a, syncStatus: 'synced' })),
      incidents: state.incidents.map((i) => ({ ...i, syncStatus: 'synced' })),
      workOrders: state.workOrders.map((w) => ({ ...w, syncStatus: 'synced' })),
      disruptions: state.disruptions.map((d) => ({ ...d, syncStatus: 'synced' })),
    }));

    get().addToast(
      'Sync Complete',
      `${count} actions synced`,
      'success'
    );
  },

  // Master Simulation Tick
  tick: () => {
    const state = get();
    if (!state.isSimulating) return;

    const secondsAdvance = 3 * state.speedMultiplier;
    const newSimTime = new Date(state.simulatedTime.getTime() + secondsAdvance * 1000);

    // Update Scripted Demo Mode if active
    let nextDemoSeconds = state.demoSeconds;
    let nextDemoPhase = state.demoPhase;
    let phaseStateUpdates: Partial<MetroStoreState> = {};

    if (state.isDemoModeActive) {
      nextDemoSeconds = Math.min(120, state.demoSeconds + secondsAdvance);
      if (nextDemoSeconds < 30) nextDemoPhase = 1;
      else if (nextDemoSeconds < 60) nextDemoPhase = 2;
      else if (nextDemoSeconds < 90) nextDemoPhase = 3;
      else nextDemoPhase = 4;

      if (nextDemoPhase !== state.demoPhase) {
        phaseStateUpdates = applyDemoPhaseState(nextDemoPhase, state);
      }
    }

    const currentIncidents = phaseStateUpdates.incidents || state.incidents;

    const result = runSimulationTick(
      state.stations,
      state.trains,
      state.assets,
      state.workOrders,
      state.alerts,
      state.lines,
      currentIncidents,
      newSimTime,
      secondsAdvance
    );

    // In demo mode phases 1-3, preserve Motera Stadium and Old High Court 96% surge
    let finalStations = result.stations;
    if (state.isDemoModeActive && nextDemoPhase < 4) {
      finalStations = result.stations.map((st) => {
        if (st.id === 'ST-08' || st.id === 'ST-05') {
          return {
            ...st,
            crowdPercentage: 96,
            crowdLevel: 'critical' as const,
            passengerVolume: Math.round(st.capacity * 0.96),
          };
        }
        return st;
      });
    } else if (phaseStateUpdates.stations) {
      finalStations = phaseStateUpdates.stations;
    }

    // If new alerts were generated, show toast for critical ones
    if (result.newAlertsGenerated.length > 0) {
      result.newAlertsGenerated.forEach((alt) => {
        if (alt.severity === 'critical') {
          get().addToast(alt.title, alt.message, 'critical');
        }
      });
    }

    // Persist latest state to IndexedDB (Dexie)
    persistLastKnownState({
      stations: finalStations,
      trains: result.trains,
      assets: result.assets,
      disruptions: state.disruptions,
      kpis: result.kpis,
      simulatedTime: newSimTime,
      incidents: currentIncidents,
      workOrders: result.workOrders,
      alerts: result.alerts,
    });

    const simClock = newSimTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    set({
      ...phaseStateUpdates,
      simulatedTime: newSimTime,
      stations: finalStations,
      trains: result.trains,
      assets: result.assets,
      workOrders: result.workOrders,
      alerts: phaseStateUpdates.alerts || result.alerts,
      kpis: phaseStateUpdates.kpis || result.kpis,
      demoSeconds: nextDemoSeconds,
      demoPhase: nextDemoPhase,
      lastSyncedTime: state.effectiveOnline ? simClock : state.lastSyncedTime,
    });
  },

  // Demo Mode Controller: visibly updates the app behind the overlay and preserves when closed
  startDemoMode: () => {
    set((state) => {
      const effects = applyDemoPhaseState(1, state);
      return {
        ...effects,
        isDemoModeActive: true,
        demoPhase: 1,
        demoSeconds: 0,
      };
    });
    get().addToast(
      'Demo Mode Started (Phase 1: Surge)',
      'Surge raises Motera Stadium and Old High Court crowd to 96% on the map.',
      'info'
    );
  },

  stopDemoMode: () => {
    set({ isDemoModeActive: false });
    get().addToast('Demo Overlay Closed', 'Current simulation drill state preserved on network map.', 'info');
  },

  advanceDemoPhase: (targetPhase) => {
    set((state) => {
      const nextPhase = targetPhase !== undefined ? targetPhase : state.demoPhase < 4 ? state.demoPhase + 1 : 4;
      const targetSec = (nextPhase - 1) * 30 + 1;
      const effects = applyDemoPhaseState(nextPhase, state);
      return {
        ...effects,
        demoPhase: nextPhase,
        demoSeconds: targetSec,
      };
    });
    const phaseNames = [
      '',
      'Phase 1: Motera Stadium & Old High Court Surge (96%)',
      'Phase 2: Train TR-101 Breakdown (Incident Created in Command)',
      'Phase 3: Bus Bridge Response (Directives Approved in Feeder)',
      'Phase 4: Full Recovery (Crowds Lowered & Incident Resolved)',
    ];
    const p = get().demoPhase;
    get().addToast(`Drill Phase ${p}`, phaseNames[p] || '', 'info');
  },

  selectStation: (id) => set({ selectedStationId: id }),
  selectIncident: (id) => set({ selectedIncidentId: id }),

  acknowledgeAlert: async (alertId) => {
    const { effectiveOnline, simulatedTime } = get();
    const syncStatus: 'synced' | 'pending' = effectiveOnline ? 'synced' : 'pending';

    if (!effectiveOnline) {
      await enqueueOfflineAction({
        actionType: 'ack_alert',
        payload: { alertId },
      }, simulatedTime.getTime());
      get().updatePendingCount();
    }

    set((state) => {
      const updatedAlerts = state.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true, syncStatus } : a
      );
      return {
        alerts: updatedAlerts,
        kpis: {
          ...state.kpis,
          activeAlertsCount: updatedAlerts.filter((a) => !a.acknowledged).length,
        },
      };
    });

    if (!effectiveOnline) {
      get().addToast('Alert Acknowledged (Offline)', 'Action marked "Pending sync" in local queue.', 'info');
    }
  },

  clearAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
    }));
  },

  executePlaybookStep: async (incidentId, stepNumber) => {
    const { effectiveOnline, simulatedTime } = get();
    const simTimeStr = simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const syncStatus: 'synced' | 'pending' = effectiveOnline ? 'synced' : 'pending';

    if (!effectiveOnline) {
      await enqueueOfflineAction({
        actionType: 'execute_playbook',
        payload: { incidentId, stepNumber },
      }, simulatedTime.getTime());
      get().updatePendingCount();
    }

    let stepTitle = `Step ${stepNumber}`;

    set((state) => {
      const updatedIncidents = state.incidents.map((inc) => {
        if (inc.id === incidentId) {
          const updatedSteps = inc.playbookSteps.map((s) => {
            if (s.stepNumber === stepNumber) {
              stepTitle = s.instruction;
              return { ...s, executed: true, executedAt: simTimeStr };
            }
            return s;
          });
          return { ...inc, playbookSteps: updatedSteps, syncStatus };
        }
        return inc;
      });

      const newLog: ActionLog = {
        id: `LOG-${Date.now()}`,
        timestamp: simTimeStr,
        title: `Playbook Step ${stepNumber} Executed`,
        details: `${stepTitle} (Incident ${incidentId})${!effectiveOnline ? ' [Pending Sync]' : ''}`,
        category: 'playbook',
      };

      return {
        incidents: updatedIncidents,
        actionLogs: [newLog, ...state.actionLogs],
      };
    });

    get().addToast(
      `Playbook Step ${stepNumber} Executed`,
      `${stepTitle}${!effectiveOnline ? ' · Queued for sync' : ''}`,
      'success'
    );
  },

  // Single Source of Truth for Incident Resolution:
  // Resolving incident marks linked alerts acknowledged, decrements critical count
  resolveIncident: (incidentId) => {
    set((state) => {
      const updatedIncidents = state.incidents.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              status: 'resolved' as const,
              playbookSteps: inc.playbookSteps.map((s) => ({ ...s, executed: true })),
            }
          : inc
      );

      // Auto-acknowledge linked alert
      const updatedAlerts = state.alerts.map((alt) =>
        alt.incidentId === incidentId ? { ...alt, acknowledged: true } : alt
      );

      const activeCriticalCount = updatedIncidents.filter(
        (i) => i.status !== 'resolved' && i.severity === 'critical'
      ).length;

      return {
        incidents: updatedIncidents,
        alerts: updatedAlerts,
        kpis: {
          ...state.kpis,
          criticalAlertsCount: activeCriticalCount,
          activeAlertsCount: updatedAlerts.filter((a) => !a.acknowledged).length,
        },
      };
    });

    get().addToast('Incident Resolved', `Incident ${incidentId} marked as successfully resolved.`, 'success');
  },

  simulateIncident: async (type, targetStationId) => {
    const state = get();
    const { effectiveOnline, simulatedTime } = state;
    const simTimeShort = simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const simTimeFull = simulatedTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const syncStatus: 'synced' | 'pending' = effectiveOnline ? 'synced' : 'pending';

    const stId =
      targetStationId || (type === 'train_breakdown' ? 'ST-02' : type === 'power_failure' ? 'ST-08' : 'ST-04');
    const station = state.stations.find((s) => s.id === stId);
    const stationName = station ? station.name : 'Network Zone';

    const incId = `INC-${Math.floor(205 + Math.random() * 50)}`;
    let title = '';
    let description = '';
    let severity: Incident['severity'] = 'high';
    let playbook: Incident['playbookSteps'] = [];

    switch (type) {
      case 'train_breakdown':
        title = `Traction Power Inverter Fault (Train 101)`;
        description = `Train stalled approaching ${stationName}. Emergency friction brakes locked.`;
        severity = 'critical';
        playbook = [
          { stepNumber: 1, instruction: 'Issue emergency holding signals to following trains TR-102 and TR-103.', executed: false },
          { stepNumber: 2, instruction: `Dispatch auxiliary shunter locomotive from Gyaspur depot.`, executed: false },
          { stepNumber: 3, instruction: `Broadcast passenger delay announcement across Line 1 concourses.`, executed: false },
          { stepNumber: 4, instruction: 'Institute single-line bidirectional bypass around obstruction.', executed: false },
        ];
        break;

      case 'power_failure':
        title = `Substation Auxiliary Grid Drop at ${stationName}`;
        description = `Main 22kV transformer tripped. Escalators and lighting transferred to UPS battery backup.`;
        severity = 'high';
        playbook = [
          { stepNumber: 1, instruction: 'Shed non-critical HVAC loads and activate emergency egress illumination.', executed: false },
          { stepNumber: 2, instruction: 'Request municipal power grid remote breaker reset.', executed: false },
          { stepNumber: 3, instruction: 'Verify all passenger elevators are in grounded lobby safety lock.', executed: false },
        ];
        break;

      case 'overcrowding':
        title = `Extreme Commuter Surge at ${stationName}`;
        description = `Platform capacity exceeded 95% due to Motera event egress. Concourse metering active.`;
        severity = 'critical';
        playbook = [
          { stepNumber: 1, instruction: 'Switch AFC turnstiles to exit-only metering mode (120 pax/min).', executed: false },
          { stepNumber: 2, instruction: 'Deploy 4 Gujarat Metro crowd safety marshals to staircase landings.', executed: false },
          { stepNumber: 3, instruction: 'Compress train headways to 2.5 minutes via extra turn-back train.', executed: false },
        ];
        break;

      case 'medical_emergency':
        title = `Passenger Medical Emergency at ${stationName}`;
        description = `Paramedics requested for passenger collapse on Platform 1. Train held at station.`;
        severity = 'medium';
        playbook = [
          { stepNumber: 1, instruction: 'Hold train dwell and dispatch station first-responder team with AED.', executed: false },
          { stepNumber: 2, instruction: 'Coordinate street-level EMT access via Station Master North Egress.', executed: false },
          { stepNumber: 3, instruction: 'Clear platform crowd corridor for stretcher transport.', executed: false },
        ];
        break;

      default:
        title = `Interlocking Signal Fault at ${stationName}`;
        description = `Track circuit 4B signal telemetry loss. Defaulting to restrictive aspect.`;
        severity = 'high';
        playbook = [
          { stepNumber: 1, instruction: 'Impose manual 25 km/h speed restriction on block segment.', executed: false },
          { stepNumber: 2, instruction: 'Dispatch wayside signal technician for circuit board swap.', executed: false },
        ];
    }

    const newIncident: Incident = {
      id: incId,
      title,
      type,
      severity,
      affectedStationIds: [stId],
      affectedLineIds: station?.lines || ['L1'],
      reportedAt: simTimeShort,
      status: 'active',
      description,
      playbookSteps: playbook,
      syncStatus,
    };

    const newAlert: Alert = {
      id: `ALT-${Date.now()}`,
      title: `NEW INCIDENT: ${title}`,
      message: description,
      severity: severity === 'critical' ? 'critical' : 'warning',
      timestamp: simTimeFull,
      acknowledged: false,
      stationId: stId,
      incidentId: incId,
      syncStatus,
    };

    if (!effectiveOnline) {
      await enqueueOfflineAction({
        actionType: 'log_incident',
        payload: { incident: newIncident },
      }, simulatedTime.getTime());
      get().updatePendingCount();
    }

    set((s) => {
      const updatedIncidents = [newIncident, ...s.incidents];
      const updatedAlerts = [newAlert, ...s.alerts];
      const activeCritical = updatedIncidents.filter((i) => i.status !== 'resolved' && i.severity === 'critical').length;

      return {
        incidents: updatedIncidents,
        alerts: updatedAlerts,
        selectedIncidentId: incId,
        kpis: {
          ...s.kpis,
          activeAlertsCount: updatedAlerts.filter((a) => !a.acknowledged).length,
          criticalAlertsCount: activeCritical,
        },
      };
    });

    get().addToast(`DRILL TRIGGERED: ${title}`, description, severity === 'critical' ? 'critical' : 'warning');
  },

  simulatePresetScenario: (scenarioId) => {
    const sc = PRESET_SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc) return;
    get().simulateIncident(sc.type, sc.targetStationId);
  },

  executeCrowdAction: (actionId) => {
    set((state) => ({
      suggestedActions: state.suggestedActions.map((a) =>
        a.id === actionId ? { ...a, status: 'applied' } : a
      ),
    }));
    get().addToast('Crowd Control Executed', `Automated crowd mitigation deployed.`, 'success');
  },

  // Work Orders & Asset Repairs (Counts strictly match Needs Service)
  updateWorkOrderStatus: async (workOrderId, status) => {
    const { effectiveOnline, simulatedTime } = get();
    const simTimeStr = simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const syncStatus: 'synced' | 'pending' = effectiveOnline ? 'synced' : 'pending';

    if (!effectiveOnline) {
      await enqueueOfflineAction({
        actionType: 'update_workorder',
        payload: { workOrderId, status },
      }, simulatedTime.getTime());
      get().updatePendingCount();
    }

    set((state) => {
      const updatedWo = state.workOrders.map((wo) =>
        wo.id === workOrderId ? { ...wo, status, updatedAt: simTimeStr, syncStatus } : wo
      );

      let updatedAssets = state.assets;
      if (status === 'Done') {
        const targetWo = state.workOrders.find((w) => w.id === workOrderId);
        if (targetWo) {
          updatedAssets = state.assets.map((ast) => {
            if (ast.id === targetWo.assetId) {
              return {
                ...ast,
                healthScore: 98,
                failureRisk: 'low' as const,
                temperatureCelsius: 36.5,
                vibrationMmS: 1.2,
                lastMaintenance: simTimeStr,
                workOrderId: undefined,
                historySparkline: [...ast.historySparkline.slice(1), 98],
              };
            }
            return ast;
          });
        }
      }

      return {
        workOrders: updatedWo,
        assets: updatedAssets,
      };
    });

    get().addToast(
      `Work Order ${workOrderId}`,
      `Status updated to "${status}"${!effectiveOnline ? ' (Pending Sync)' : ''}.`,
      'info'
    );
  },

  repairAsset: (assetId) => {
    const state = get();
    const asset = state.assets.find((a) => a.id === assetId);
    if (!asset) return;

    const simTimeStr = state.simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    set((s) => ({
      assets: s.assets.map((a) =>
        a.id === assetId
          ? {
              ...a,
              healthScore: 98,
              failureRisk: 'low',
              temperatureCelsius: 35.0,
              vibrationMmS: 1.1,
              workOrderId: undefined,
              historySparkline: [...a.historySparkline.slice(1), 98],
            }
          : a
      ),
      workOrders: s.workOrders.map((wo) =>
        wo.assetId === assetId ? { ...wo, status: 'Done', updatedAt: simTimeStr } : wo
      ),
    }));

    get().addToast('Asset Recalibrated', `${asset.name} restored to peak operational health.`, 'success');
  },

  createManualWorkOrder: (assetId, priority, notes, extras) => {
    const state = get();
    const asset = state.assets.find((a) => a.id === assetId);
    if (!asset) return undefined;

    const simTimeStr = state.simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let newWoId = `WO-${Math.floor(7000 + Math.random() * 2000)}`;
    while (state.workOrders.some((w) => w.id === newWoId)) {
      newWoId = `WO-${Math.floor(7000 + Math.random() * 2000)}`;
    }
    const stationName = state.stations.find((s) => s.id === asset.stationId)?.name || 'Central Facility';

    const newWo: WorkOrder = {
      id: newWoId,
      assetId,
      assetName: asset.name,
      stationName,
      assetType: asset.type,
      status: extras?.assignedCrew ? 'Assigned' : 'Open',
      priority,
      createdAt: simTimeStr,
      updatedAt: simTimeStr,
      notes,
      syncStatus: state.effectiveOnline ? 'synced' : 'pending',
      ...(extras?.assignedCrew ? { assignedCrew: extras.assignedCrew } : {}),
      ...(extras?.task ? { task: extras.task } : {}),
      ...(extras?.scheduledTime ? { scheduledTime: extras.scheduledTime } : {}),
      ...(extras?.scheduledDuration ? { scheduledDuration: extras.scheduledDuration } : {}),
      ...(extras?.source ? { source: extras.source } : {}),
    };

    set((s) => ({
      workOrders: [newWo, ...s.workOrders],
      assets: s.assets.map((a) => (a.id === assetId ? { ...a, workOrderId: newWoId } : a)),
    }));

    if (!extras?.silent) {
      get().addToast('Work Order Created', `${newWoId} dispatched for ${asset.name}.`, 'success');
    }
    return newWoId;
  },

  // Edit roster/schedule details of an existing work order (reuses the same WO record).
  updateWorkOrderDetails: (workOrderId, patch) => {
    const { effectiveOnline, simulatedTime } = get();
    const simTimeStr = simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    set((state) => ({
      workOrders: state.workOrders.map((wo) => {
        if (wo.id !== workOrderId) return wo;
        const next = { ...wo, ...patch, updatedAt: simTimeStr, syncStatus: effectiveOnline ? ('synced' as const) : ('pending' as const) };
        // Assigning a crew to an Open order moves it to Assigned, as the existing workflow does.
        if (patch.assignedCrew && wo.status === 'Open') next.status = 'Assigned';
        return next;
      }),
    }));
    get().addToast(
      `Work Order ${workOrderId}`,
      `Roster details updated${!effectiveOnline ? ' (Pending Sync)' : ''}.`,
      'info'
    );
  },

  // Intermodal Disruption Approvals
  approveDisruptionAction: async (id) => {
    const { effectiveOnline, simulatedTime } = get();
    const syncStatus: 'synced' | 'pending' = effectiveOnline ? 'synced' : 'pending';

    const currentDisruption = get().disruptions.find((d) => d.id === id);
    const updatedDisruption = currentDisruption
      ? { ...currentDisruption, status: 'approved' as const, syncStatus }
      : undefined;

    if (updatedDisruption) {
      try {
        await db.disruptionApprovals.put(updatedDisruption);
      } catch (err) {
        console.warn('[Dexie] Failed to write approved disruption:', err);
      }
    }

    if (!effectiveOnline) {
      await enqueueOfflineAction({
        actionType: 'approve_disruption',
        payload: { id },
      }, simulatedTime.getTime());
      get().updatePendingCount();
    }

    set((state) => ({
      disruptions: state.disruptions.map((d) => (d.id === id ? { ...d, status: 'approved', syncStatus } : d)),
    }));

    get().addToast(
      'Intermodal Order Dispatched',
      `Transit directive approved${!effectiveOnline ? ' (Queued offline)' : ''}. Bus fleet notified.`,
      'success'
    );
  },

  rejectDisruptionAction: async (id) => {
    const { effectiveOnline, simulatedTime } = get();
    const syncStatus: 'synced' | 'pending' = effectiveOnline ? 'synced' : 'pending';

    const currentDisruption = get().disruptions.find((d) => d.id === id);
    const updatedDisruption = currentDisruption
      ? { ...currentDisruption, status: 'rejected' as const, syncStatus }
      : undefined;

    if (updatedDisruption) {
      try {
        await db.disruptionApprovals.put(updatedDisruption);
      } catch (err) {
        console.warn('[Dexie] Failed to write rejected disruption:', err);
      }
    }

    if (!effectiveOnline) {
      await enqueueOfflineAction({
        actionType: 'reject_disruption',
        payload: { id },
      }, simulatedTime.getTime());
      get().updatePendingCount();
    }

    set((state) => ({
      disruptions: state.disruptions.map((d) => (d.id === id ? { ...d, status: 'rejected', syncStatus } : d)),
    }));
    get().addToast('Directive Dismissed', 'Intermodal request cancelled.', 'info');
  },

  addToast: (title, message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id, title, message, type }],
    }));

    setTimeout(() => {
      get().dismissToast(id);
    }, 4000);
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  // Initialize and restore state from IndexedDB
  initIndexedDb: async () => {
    try {
      const persisted = await loadLastKnownState();
      if (persisted) {
        const restoredSimTime = persisted.simulatedTimeMs ? new Date(persisted.simulatedTimeMs) : initialSimDate;
        set({
          stations: persisted.stations?.length ? persisted.stations : SEED_STATIONS,
          trains: persisted.trains?.length ? persisted.trains : SEED_TRAINS,
          assets: persisted.assets?.length ? persisted.assets : SEED_ASSETS,
          disruptions: persisted.disruptions?.length ? persisted.disruptions : SEED_DISRUPTIONS,
          kpis: persisted.kpis || INITIAL_KPIS,
          simulatedTime: restoredSimTime,
          incidents: persisted.incidents?.length ? persisted.incidents : SEED_INCIDENTS,
          workOrders: persisted.workOrders?.length ? persisted.workOrders : SEED_WORK_ORDERS,
          alerts: persisted.alerts?.length ? persisted.alerts : SEED_ALERTS,
          lastSyncedTime: restoredSimTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }
      await get().updatePendingCount();
    } catch (err) {
      console.warn('[MetroPulse] IndexedDB restoration error:', err);
    }
  },
}));
