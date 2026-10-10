type EventCallback<T = any> = (payload: T) => void;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  subscribe<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  publish<T = any>(event: string, payload: T): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[EventBus] Error handling event "${event}":`, err);
        }
      });
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();

// Standard event constants
export const METRO_EVENTS = {
  CROWD_SURGE: 'crowd.surge',
  ASSET_FAULT: 'asset.fault',
  INCIDENT_CREATED: 'incident.created',
  INCIDENT_RESOLVED: 'incident.resolved',
  PLAYBOOK_STEP: 'playbook.step',
  BUS_DELAY: 'bus.delay',
  DISRUPTION_APPROVED: 'disruption.approved',
  WORKORDER_CREATED: 'workorder.created',
  WORKORDER_UPDATED: 'workorder.updated',
  OFFLINE_SYNC: 'offline.sync',
  DEMO_STAGE_CHANGED: 'demo.stage_changed',
} as const;
