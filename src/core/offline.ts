import { useEffect, useState } from 'react';
import { db, getPendingSyncQueue, markSyncQueueItemCompleted } from './db';
import { eventBus, METRO_EVENTS } from './eventBus';

export interface OfflineStatus {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  effectiveOnline: boolean;
  pendingSyncCount: number;
  lastSyncedAt: Date;
}

class OfflineManager {
  private isOnlineNative: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSimulatedOffline: boolean = false;
  private lastSyncedAt: Date = new Date();
  private pendingCount: number = 0;
  private listeners: Set<(status: OfflineStatus) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNativeConnectivityChange(true));
      window.addEventListener('offline', () => this.handleNativeConnectivityChange(false));
      this.refreshPendingCount();
    }
  }

  private handleNativeConnectivityChange(online: boolean) {
    this.isOnlineNative = online;
    if (online && !this.isSimulatedOffline) {
      this.triggerAutoSync();
    }
    this.notify();
  }

  public setSimulateOffline(simulate: boolean) {
    this.isSimulatedOffline = simulate;
    if (!simulate && this.isOnlineNative) {
      this.triggerAutoSync();
    }
    this.notify();
  }

  public getStatus(): OfflineStatus {
    const effectiveOnline = this.isOnlineNative && !this.isSimulatedOffline;
    return {
      isOnline: this.isOnlineNative,
      isSimulatedOffline: this.isSimulatedOffline,
      effectiveOnline,
      pendingSyncCount: this.pendingCount,
      lastSyncedAt: this.lastSyncedAt,
    };
  }

  public subscribe(cb: (status: OfflineStatus) => void): () => void {
    this.listeners.add(cb);
    cb(this.getStatus());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((cb) => cb(status));
  }

  public async refreshPendingCount(): Promise<number> {
    const items = await getPendingSyncQueue();
    this.pendingCount = items.length;
    this.notify();
    return this.pendingCount;
  }

  public async triggerAutoSync(): Promise<{ syncedCount: number }> {
    const pending = await getPendingSyncQueue();
    if (pending.length === 0) return { syncedCount: 0 };

    let count = 0;
    for (const item of pending) {
      await markSyncQueueItemCompleted(item.id);
      count++;
    }

    this.lastSyncedAt = new Date();
    await this.refreshPendingCount();

    eventBus.publish(METRO_EVENTS.OFFLINE_SYNC, {
      syncedCount: count,
      timestamp: this.lastSyncedAt,
    });

    return { syncedCount: count };
  }
}

export const offlineManager = new OfflineManager();

export function useOfflineStatus(): OfflineStatus {
  const [status, setStatus] = useState<OfflineStatus>(offlineManager.getStatus());

  useEffect(() => {
    return offlineManager.subscribe((newStatus) => {
      setStatus(newStatus);
    });
  }, []);

  return status;
}
