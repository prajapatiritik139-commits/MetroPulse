import Dexie, { Table } from 'dexie';
import {
  Incident,
  WorkOrder,
  Alert,
  DisruptionAction,
  SyncQueueItem,
  Station,
  Train,
  NetworkKpis,
  Asset,
} from './types';

export interface PersistedNetworkState {
  id: string; // 'current'
  timestamp: number;
  stations: Station[];
  trains: Train[];
  assets: Asset[];
  disruptions: DisruptionAction[];
  kpis: NetworkKpis;
  simulatedTimeMs: number;
  incidents: Incident[];
  workOrders: WorkOrder[];
  alerts: Alert[];
}

export interface PersistedSetting {
  key: string;
  value: any;
}

export class MetroPulseDB extends Dexie {
  incidents!: Table<Incident, string>;
  workOrders!: Table<WorkOrder, string>;
  alerts!: Table<Alert, string>;
  disruptionApprovals!: Table<DisruptionAction, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  networkState!: Table<PersistedNetworkState, string>;
  settings!: Table<PersistedSetting, string>;

  constructor() {
    super('MetroPulseDB');
    this.version(1).stores({
      incidents: 'id, status, severity, reportedAt, syncStatus',
      workOrders: 'id, assetId, status, priority, syncStatus',
      alerts: 'id, severity, acknowledged, timestamp, syncStatus',
      disruptionApprovals: 'id, status, stationId, syncStatus',
      syncQueue: 'id, actionType, timestamp, status',
      networkState: 'id, timestamp',
      settings: 'key',
    });

    this.version(2)
      .stores({
        incidents: 'id, status, severity, reportedAt, syncStatus',
        workOrders: 'id, assetId, status, priority, syncStatus',
        alerts: 'id, severity, acknowledged, timestamp, syncStatus',
        disruptionApprovals: 'id, status, stationId, syncStatus',
        syncQueue: 'id, actionType, timestamp, status',
        networkState: 'id, timestamp',
        settings: 'key',
      })
      .upgrade((tx) => {
        return tx.table('networkState').clear();
      });
  }
}

export const db = new MetroPulseDB();

// Helper to save last known full state
export async function persistLastKnownState(state: {
  stations: Station[];
  trains: Train[];
  assets: Asset[];
  disruptions: DisruptionAction[];
  kpis: NetworkKpis;
  simulatedTime: Date;
  incidents: Incident[];
  workOrders: WorkOrder[];
  alerts: Alert[];
}) {
  try {
    const simTimeMs = state.simulatedTime.getTime();
    await db.networkState.put({
      id: 'current',
      timestamp: simTimeMs,
      stations: state.stations,
      trains: state.trains,
      assets: state.assets,
      disruptions: state.disruptions,
      kpis: state.kpis,
      simulatedTimeMs: simTimeMs,
      incidents: state.incidents,
      workOrders: state.workOrders,
      alerts: state.alerts,
    });
  } catch (err) {
    console.warn('[Dexie] Failed to persist network state:', err);
  }
}

// Helper to load last known state on reload
export async function loadLastKnownState(): Promise<PersistedNetworkState | undefined> {
  try {
    return await db.networkState.get('current');
  } catch (err) {
    console.warn('[Dexie] Failed to load last known network state:', err);
    return undefined;
  }
}

// Enqueue offline action
export async function enqueueOfflineAction(
  action: Omit<SyncQueueItem, 'id' | 'timestamp' | 'status'>,
  simulatedTimeMs?: number
): Promise<string> {
  const timestamp = simulatedTimeMs ?? 0;
  const id = `sync-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
  const item: SyncQueueItem = {
    ...action,
    id,
    timestamp,
    status: 'pending',
  };
  try {
    await db.syncQueue.put(item);
  } catch (err) {
    console.warn('[Dexie] Failed to enqueue offline action:', err);
  }
  return id;
}

// Get all pending sync items
export async function getPendingSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    return await db.syncQueue.where('status').equals('pending').toArray();
  } catch {
    return [];
  }
}

// Clear or mark items synced
export async function markSyncQueueItemCompleted(id: string): Promise<void> {
  try {
    await db.syncQueue.update(id, { status: 'synced' });
    await db.syncQueue.delete(id);
  } catch (err) {
    console.warn('[Dexie] Failed to complete sync item:', err);
  }
}
