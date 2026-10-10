/**
 * Next-7-Days failure prediction + prioritised night-shift roster.
 *
 * DATA HONESTY NOTE
 * -----------------
 * MetroPulse has no historical fault log. `DEMO_FAULT_LOG` below is SYNTHETIC,
 * generated deterministically from each asset's seed health so the demo is
 * repeatable. It is NOT real maintenance history and every UI surface that
 * shows it is labelled "DEMO". `predictFailures()` accepts a real fault log as
 * its 3rd argument; pass one in and the output is labelled "Fault log" instead.
 *
 * The score is a transparent, rule-based risk INDEX (0-100), not a calibrated
 * probability. Every contributing factor is returned so it can be audited.
 */
import { Asset, AssetType, FailureRisk, WorkOrder, WorkOrderPriority } from '../types/metro';
import { SEED_ASSETS } from '../data/seedData';
import { getStationName } from '../data/stations';

/* ------------------------------------------------------------------ */
/* Fault log                                                           */
/* ------------------------------------------------------------------ */

export interface FaultLogEntry {
  id: string;
  assetId: string;
  /** How many days before "now" the fault happened. */
  daysAgo: number;
  faultType: string;
  severity: 'minor' | 'major';
  downtimeMin: number;
}

const FAULT_TYPES: Record<AssetType, string[]> = {
  escalator: ['Bearing overheat', 'Step-chain jam', 'Handrail slip', 'Drive vibration alarm'],
  lift: ['Leveling sensor fault', 'Door operator trip', 'Hydraulic pressure drop', 'Overload sensor reset'],
  door: ['Obstruction sensor fault', 'Door motor stall', 'Track misalignment', 'Lock-switch fault'],
  signal: ['Relay chatter', 'Lamp/optic misalignment', 'Track circuit dropout', 'Interlocking comms loss'],
  afc_gate: ['Flap motor jam', 'Card reader timeout', 'Gate controller reboot', 'Barrier sensor fault'],
};

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic SYNTHETIC 90-day fault history (weaker assets fault more, and more recently). */
export function generateDemoFaultLog(assets: Asset[]): FaultLogEntry[] {
  const log: FaultLogEntry[] = [];
  for (const a of assets) {
    const rng = mulberry32(hashString(a.id));
    const fragility = Math.max(0, 92 - a.healthScore) / 12; // health 48 -> ~3.7
    const count = Math.round(fragility + rng() * 1.2);
    const types = FAULT_TYPES[a.type];
    // The most-fragile assets repeat their *dominant* fault type.
    const dominant = types[Math.floor(rng() * types.length)];
    for (let i = 0; i < count; i++) {
      const bias = a.healthScore < 70 ? 1.8 : 1; // low health -> faults cluster recently
      const daysAgo = Math.floor(90 * Math.pow(rng(), bias));
      const repeat = a.healthScore < 70 && rng() < 0.6;
      log.push({
        id: `DEMO-F-${a.id.replace('AST-', '')}-${i + 1}`,
        assetId: a.id,
        daysAgo,
        faultType: repeat ? dominant : types[Math.floor(rng() * types.length)],
        severity: a.healthScore < 60 && rng() < 0.5 ? 'major' : 'minor',
        downtimeMin: Math.round(10 + rng() * (a.healthScore < 60 ? 110 : 45)),
      });
    }
  }
  return log.sort((x, y) => x.daysAgo - y.daysAgo);
}

export const DEMO_FAULT_LOG: FaultLogEntry[] = generateDemoFaultLog(SEED_ASSETS);

/* ------------------------------------------------------------------ */
/* Prediction                                                          */
/* ------------------------------------------------------------------ */

const LIMITS: Record<AssetType, { vib: number; temp: number; serviceHours: number }> = {
  escalator: { vib: 3.0, temp: 55, serviceHours: 8000 },
  lift: { vib: 2.5, temp: 50, serviceHours: 7000 },
  door: { vib: 2.5, temp: 50, serviceHours: 7500 },
  signal: { vib: 3.0, temp: 55, serviceHours: 9000 },
  afc_gate: { vib: 2.0, temp: 45, serviceHours: 7000 },
};

export const ASSET_TYPE_LABEL: Record<AssetType, string> = {
  escalator: 'Escalator',
  lift: 'Lift',
  door: 'Platform Door',
  signal: 'Signal',
  afc_gate: 'AFC Gate',
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export interface PredictionFactor {
  key: 'health' | 'trend' | 'vibration' | 'temperature' | 'faults' | 'wear';
  points: number;
  text: string;
}

export interface FailurePrediction {
  assetId: string;
  assetName: string;
  stationId: string;
  stationName: string;
  assetType: AssetType;
  healthScore: number;
  /** 0-100 rule-based risk index. */
  riskScore: number;
  riskLevel: FailureRisk;
  /** Heuristic window in which failure is most likely. */
  window: string;
  reasons: string[];
  factors: PredictionFactor[];
  recommendedAction: string;
  recommendedDurationMin: number;
  faultsLast30d: number;
  faultsLast90d: number;
  dataSource: 'demo' | 'fault-log';
  activeWorkOrderId?: string;
}

export function riskLevelFromScore(score: number): FailureRisk {
  if (score >= 62) return 'critical';
  if (score >= 42) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

const WINDOW: Record<FailureRisk, string> = {
  critical: 'Within 48 hours',
  high: 'Days 2–4',
  medium: 'Days 4–7',
  low: 'Not expected in 7 days',
};

const BASE_DURATION: Record<AssetType, number> = { escalator: 120, lift: 90, door: 60, signal: 75, afc_gate: 45 };

function recommendAction(type: AssetType, dominant: PredictionFactor['key'] | undefined, level: FailureRisk): string {
  const mechanical = dominant === 'vibration' || dominant === 'temperature';
  switch (type) {
    case 'escalator':
      return mechanical
        ? 'Inspect and replace drive/gearbox bearings, check gearbox oil level, lubricate step chain'
        : 'Step-chain tension check, comb-plate and handrail inspection, lubrication';
    case 'lift':
      return mechanical
        ? 'Check hydraulic pump and oil temperature, inspect guide rollers, re-level car'
        : 'Recalibrate leveling sensor, test door operator and overload sensor';
    case 'door':
      return mechanical
        ? 'Inspect door motor and drive belt, re-align track, lubricate rollers'
        : 'Test obstruction sensors, check lock switches and door-close force';
    case 'signal':
      return mechanical
        ? 'Replace relay vibration dampers, re-seat relays, check power supply'
        : 'Clean/align optics, test relays and track-circuit, verify interlocking comms';
    case 'afc_gate':
      return mechanical
        ? 'Service flap motor and barrier mechanism, check cooling fan'
        : 'Clean and test card readers, update gate controller, swap faulty module if needed';
  }
}

export function predictFailures(
  assets: Asset[],
  workOrders: WorkOrder[],
  faultLog?: FaultLogEntry[],
  stationNameOf?: (stationId: string) => string
): FailurePrediction[] {
  const usingDemo = !faultLog;
  const log = faultLog ?? DEMO_FAULT_LOG;
  const tag = usingDemo ? ' (DEMO history)' : '';

  const out = assets.map((a): FailurePrediction => {
    const lim = LIMITS[a.type];
    const factors: PredictionFactor[] = [];

    // 1. Health (max 35)
    const healthPts = 35 * clamp01((90 - a.healthScore) / 50);
    if (healthPts > 4)
      factors.push({
        key: 'health',
        points: healthPts,
        text: `Health ${Math.round(a.healthScore)}%${a.healthScore < 60 ? ' – below 60% service line' : ''}`,
      });

    // 2. Degradation trend (max 15): average change per reading over the sparkline
    const sp = a.historySparkline;
    const slope = sp.length > 1 ? (sp[sp.length - 1] - sp[0]) / (sp.length - 1) : 0;
    const trendPts = 15 * clamp01(-slope / 1.5);
    if (trendPts > 5)
      factors.push({
        key: 'trend',
        points: trendPts,
        text: `Health falling ~${Math.abs(slope).toFixed(1)} pts per reading`,
      });

    // 3. Vibration (max 15)
    const vibPts = 15 * clamp01((a.vibrationMmS / lim.vib - 0.4) / 0.6);
    if (vibPts > 3)
      factors.push({
        key: 'vibration',
        points: vibPts,
        text: `Vibration ${a.vibrationMmS.toFixed(2)} mm/s (limit ${lim.vib})`,
      });

    // 4. Temperature (max 10)
    const tempPts = 10 * clamp01((a.temperatureCelsius / lim.temp - 0.65) / 0.35);
    if (tempPts > 2)
      factors.push({
        key: 'temperature',
        points: tempPts,
        text: `Temperature ${a.temperatureCelsius.toFixed(1)}°C (limit ${lim.temp}°C)`,
      });

    // 5. Fault history (max 20): recency-weighted count
    const mine = log.filter((f) => f.assetId === a.id);
    const last30 = mine.filter((f) => f.daysAgo <= 30);
    const weighted = mine.reduce((sum, f) => {
      const recency = f.daysAgo <= 30 ? 1 : f.daysAgo <= 60 ? 0.6 : 0.3;
      return sum + recency * (f.severity === 'major' ? 1.5 : 1);
    }, 0);
    const faultPts = 20 * clamp01(weighted / 5);
    if (mine.length > 0 && faultPts > 2) {
      factors.push({
        key: 'faults',
        points: faultPts,
        text: `${last30.length} fault${last30.length === 1 ? '' : 's'} in last 30 days, ${mine.length} in 90 days${tag}`,
      });
      const counts = new Map<string, number>();
      mine.forEach((f) => counts.set(f.faultType, (counts.get(f.faultType) || 0) + 1));
      const top = [...counts.entries()].sort((x, y) => y[1] - x[1])[0];
      if (top && top[1] >= 2)
        factors.push({ key: 'faults', points: 0, text: `Repeat fault: ${top[0]} ×${top[1]}${tag}` });
    }

    // 6. Wear (max 5)
    const wearPts = 5 * clamp01((a.operatingHours / lim.serviceHours - 0.7) / 0.5);
    if (wearPts > 1)
      factors.push({
        key: 'wear',
        points: wearPts,
        text: `${Math.round((a.operatingHours / lim.serviceHours) * 100)}% of service interval used`,
      });

    const riskScore = Math.round(Math.min(100, healthPts + trendPts + vibPts + tempPts + faultPts + wearPts));
    const riskLevel = riskLevelFromScore(riskScore);
    const sorted = [...factors].sort((x, y) => y.points - x.points);
    const dominant = sorted[0]?.key;
    const duration = Math.round(
      (BASE_DURATION[a.type] * (riskLevel === 'critical' ? 1 : riskLevel === 'high' ? 0.85 : 0.6)) / 5
    ) * 5;
    const activeWo = workOrders.find((w) => w.assetId === a.id && w.status !== 'Done');

    return {
      assetId: a.id,
      assetName: a.name,
      stationId: a.stationId,
      stationName: stationNameOf ? stationNameOf(a.stationId) : getStationName(a.stationId, 'Central Facility'),
      assetType: a.type,
      healthScore: a.healthScore,
      riskScore,
      riskLevel,
      window: WINDOW[riskLevel],
      reasons: sorted.length ? sorted.map((f) => f.text) : ['No abnormal indicators'],
      factors: sorted,
      recommendedAction: recommendAction(a.type, dominant, riskLevel),
      recommendedDurationMin: duration,
      faultsLast30d: last30.length,
      faultsLast90d: mine.length,
      dataSource: usingDemo ? 'demo' : 'fault-log',
      activeWorkOrderId: activeWo?.id,
    };
  });

  return out.sort((x, y) => y.riskScore - x.riskScore);
}

/* ------------------------------------------------------------------ */
/* Night-shift roster                                                  */
/* ------------------------------------------------------------------ */

export const SHIFT_START = '23:30';
export const SHIFT_END = '04:30';
const SHIFT_START_MIN = 23 * 60 + 30;
const SHIFT_LENGTH_MIN = 300;
const TRAVEL_BUFFER_MIN = 10;

/** DEMO crew pool (no technician master data exists in the project). */
export const DEMO_CREW_BY_TYPE: Record<AssetType, string> = {
  escalator: 'Mechanical Rapid Unit 2 (Ahmedabad)',
  lift: 'Lift & Hydraulics Unit 1 (Ahmedabad)',
  door: 'Platform Door Unit (Gandhinagar)',
  signal: 'Signals Delta Unit (Gandhinagar)',
  afc_gate: 'AFC Systems Unit (Ahmedabad)',
};
export const DEMO_CREWS: string[] = Array.from(new Set(Object.values(DEMO_CREW_BY_TYPE)));

const PRIORITY_RANK: Record<WorkOrderPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export interface RosterItem {
  assetId: string;
  assetName: string;
  stationName: string;
  assetType: AssetType;
  priority: WorkOrderPriority;
  riskScore: number;
  riskLevel: FailureRisk;
  task: string;
  reason: string;
  crew: string;
  /** true when crew comes from the demo pool rather than the work order. */
  crewIsSuggested: boolean;
  startTime: string;
  endTime: string;
  durationMin: number;
  /** true when time was auto-assigned rather than saved on the work order. */
  timeIsSuggested: boolean;
  /** true when it does not fit in tonight's 23:30–04:30 window. */
  overflow: boolean;
  workOrderId?: string;
  workOrderStatus?: WorkOrder['status'];
  workOrderSyncPending?: boolean;
}

export const toHHMM = (minutesOfDay: number) => {
  const m = ((minutesOfDay % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
const toShiftOffset = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h * 60 + m - SHIFT_START_MIN + 1440) % 1440;
};

export function buildRoster(predictions: FailurePrediction[], workOrders: WorkOrder[]): RosterItem[] {
  type Draft = Omit<RosterItem, 'startTime' | 'endTime' | 'timeIsSuggested' | 'overflow'> & {
    fixedOffset?: number;
  };
  const drafts: Draft[] = [];

  for (const p of predictions) {
    const wo = workOrders.find((w) => w.assetId === p.assetId && w.status !== 'Done');
    if (!wo && p.riskLevel !== 'critical' && p.riskLevel !== 'high' && p.riskLevel !== 'medium') continue;
    const priority: WorkOrderPriority = wo
      ? wo.priority
      : p.riskLevel === 'critical'
      ? 'critical'
      : p.riskLevel === 'high'
      ? 'high'
      : 'medium';
    drafts.push({
      assetId: p.assetId,
      assetName: p.assetName,
      stationName: p.stationName,
      assetType: p.assetType,
      priority,
      riskScore: p.riskScore,
      riskLevel: p.riskLevel,
      task: wo?.task || (wo ? wo.notes : p.recommendedAction),
      reason: p.reasons.slice(0, 2).join(' · '),
      crew: wo?.assignedCrew || DEMO_CREW_BY_TYPE[p.assetType],
      crewIsSuggested: !wo?.assignedCrew,
      durationMin: wo?.scheduledDuration || p.recommendedDurationMin,
      fixedOffset: wo?.scheduledTime ? toShiftOffset(wo.scheduledTime) : undefined,
      workOrderId: wo?.id,
      workOrderStatus: wo?.status,
      workOrderSyncPending: wo?.syncStatus === 'pending',
    });
  }

  drafts.sort(
    (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || b.riskScore - a.riskScore
  );

  // Busy intervals per crew, in minutes after SHIFT_START.
  const busy = new Map<string, Array<[number, number]>>();
  const reserve = (crew: string, s: number, e: number) => {
    const list = busy.get(crew) || [];
    list.push([s, e + TRAVEL_BUFFER_MIN]);
    busy.set(crew, list);
  };
  // Pass 1: tasks that already have a saved time keep it.
  drafts.forEach((d) => d.fixedOffset !== undefined && reserve(d.crew, d.fixedOffset, d.fixedOffset + d.durationMin));

  const result: RosterItem[] = [];
  for (const d of drafts) {
    let start: number;
    const suggested = d.fixedOffset === undefined;
    if (!suggested) {
      start = d.fixedOffset!;
    } else {
      // Earliest gap for this crew, highest-priority first.
      start = 0;
      const list = [...(busy.get(d.crew) || [])].sort((a, b) => a[0] - b[0]);
      for (const [s, e] of list) {
        if (start + d.durationMin + TRAVEL_BUFFER_MIN <= s) break;
        if (start < e) start = Math.max(start, e);
      }
      reserve(d.crew, start, start + d.durationMin);
    }
    const { fixedOffset, ...rest } = d;
    result.push({
      ...rest,
      startTime: toHHMM(SHIFT_START_MIN + start),
      endTime: toHHMM(SHIFT_START_MIN + start + d.durationMin),
      timeIsSuggested: suggested,
      overflow: start + d.durationMin > SHIFT_LENGTH_MIN,
    });
  }
  return result;
}

/** Plain-text roster for sharing (WhatsApp / SMS / print). */
export function rosterToText(items: RosterItem[], isDemo: boolean): string {
  const lines = [
    `NIGHT-SHIFT MAINTENANCE ROSTER  ${SHIFT_START} – ${SHIFT_END}`,
    isDemo ? 'NOTE: predictions use DEMO fault history – verify before dispatch.' : '',
    '',
  ].filter((l, i) => l !== '' || i > 1);
  const byCrew = new Map<string, RosterItem[]>();
  items.forEach((i) => byCrew.set(i.crew, [...(byCrew.get(i.crew) || []), i]));
  byCrew.forEach((list, crew) => {
    lines.push(`== ${crew} ==`);
    list
      .sort((a, b) => toShiftOffset(a.startTime) - toShiftOffset(b.startTime))
      .forEach((i) =>
        lines.push(
          `${i.startTime}-${i.endTime} [${i.priority.toUpperCase()}] ${i.assetId} @ ${i.stationName}: ${i.task}${
            i.workOrderId ? ` (${i.workOrderId})` : ''
          }${i.overflow ? ' [NEXT NIGHT]' : ''}`
        )
      );
    lines.push('');
  });
  return lines.join('\n');
}
