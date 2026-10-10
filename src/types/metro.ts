export type Role = 'operator' | 'coordinator' | 'commuter';

export type CrowdLevel = 'low' | 'moderate' | 'busy' | 'crowded' | 'critical';

export interface Station {
  id: string;
  name: string;
  code: string;
  lat?: number;
  lng?: number;
  x: number; // SVG schematic coordinate (0-1000)
  y: number; // SVG schematic coordinate (0-620)
  lines: string[]; // line IDs e.g. ['L1'], ['L1', 'L2']
  isInterchange: boolean;
  isTerminal?: boolean;
  crowdLevel: CrowdLevel;
  crowdPercentage: number; // 0 - 100
  passengerVolume: number; // current people at station
  capacity: number; // max design capacity
  inflowRate: number; // pax/min
  outflowRate: number; // pax/min
  forecast: {
    minute15: number;
    minute30: number;
    minute60: number;
  };
  assetIds: string[];
  feederBusIds?: string[];
  accessibilityScore?: number; // 0-100
}

export interface MetroLine {
  id: string;
  name: string;
  code: string;
  color: string; // Hex color: Teal #14B8A6 for Line 1, Ruby #E11D48 for Line 2
  stationIds: string[];
  totalTrains: number;
  operatingSpeedKmh: number;
  headwayMinutes: number;
}

export type TrainStatus = 'in_transit' | 'approaching' | 'boarding' | 'holding' | 'delayed' | 'on_time';

export interface Train {
  id: string;
  name: string; // e.g. "TR-101"
  lineId: string;
  status: TrainStatus;
  currentStationId: string;
  nextStationId: string;
  progressBetweenStations: number; // 0.0 to 1.0
  direction: 'forward' | 'reverse' | 'northbound' | 'southbound' | 'eastbound' | 'westbound';
  loadPercentage: number; // 0 - 100
  speedKmh: number;
  lat?: number;
  lng?: number;
  x: number; // SVG position
  y: number;
  isHeld: boolean;
  passengersOnboard?: number;
  capacity?: number;
  progressRatio?: number;
  carsCount?: number;
  crowdLoadPercentage?: number;
}

export type AssetType = 'escalator' | 'lift' | 'door' | 'signal' | 'afc_gate';
export type FailureRisk = 'low' | 'medium' | 'high' | 'critical';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  stationId: string;
  healthScore: number; // 0 - 100
  failureRisk: FailureRisk;
  operatingHours: number;
  temperatureCelsius: number;
  vibrationMmS: number;
  cyclesCount: number;
  historySparkline: number[]; // 10 historic data points
  lastMaintenance: string;
  workOrderId?: string;
}

export type WorkOrderStatus = 'Open' | 'Assigned' | 'In Progress' | 'Done';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';

export interface WorkOrder {
  id: string;
  assetId: string;
  assetName: string;
  stationName: string;
  assetType: AssetType;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  assignedCrew?: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
  syncStatus?: 'synced' | 'pending';
  // --- Night-shift roster fields (optional, backward compatible) ---
  /** Maintenance task text shown on the night-shift roster. */
  task?: string;
  /** Planned start time of the night-shift slot, 24h "HH:MM". */
  scheduledTime?: string;
  /** Planned duration in minutes. */
  scheduledDuration?: number;
  /** 'roster' = created from the Next-7-Days forecast / night roster. */
  source?: 'roster' | 'manual';
}

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentType =
  | 'train_breakdown'
  | 'power_failure'
  | 'overcrowding'
  | 'medical_emergency'
  | 'signal_fault'
  | 'bus_delay'
  | 'strike';

export interface PlaybookStep {
  stepNumber: number;
  instruction: string;
  executed: boolean;
  executedAt?: string;
  actionId?: string;
}

export interface Incident {
  id: string;
  title: string;
  type: IncidentType;
  severity: IncidentSeverity;
  affectedStationIds: string[];
  affectedLineIds: string[];
  reportedAt: string;
  status: 'active' | 'mitigating' | 'resolved';
  description: string;
  playbookSteps: PlaybookStep[];
  syncStatus?: 'synced' | 'pending';
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  acknowledged: boolean;
  stationId?: string;
  assetId?: string;
  incidentId?: string;
  syncStatus?: 'synced' | 'pending';
}

export interface NetworkKpis {
  onTimePerformance: number; // 92 - 99%
  onTimeTrend: number;
  avgHeadwayMinutes: number; // ~3.4 min
  headwayTrend: number;
  passengersPerHour: number; // 8,000 - 25,000
  paxTrend: number;
  activeAlertsCount: number;
  criticalAlertsCount: number;
  assetAvailabilityPercentage: number;
  availabilityTrend: number;
}

export interface CrowdForecastDataPoint {
  timeLabel: string;
  actual?: number;
  forecast: number;
  confidenceLower: number;
  confidenceUpper: number;
  isPeakPeriod?: boolean;
}

export interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  type: 'hold_train' | 'short_turn' | 'open_gates' | 'deploy_marshals' | 'deploy_buses' | 'signal_priority';
  category?: 'Hold train' | 'Short-turn' | 'Open extra gates' | 'Deploy buses' | 'Signal priority';
  stationId?: string;
  trainId?: string;
  urgency: 'high' | 'medium' | 'low';
  impact: string;
  status: 'pending' | 'applied';
  syncStatus?: 'synced' | 'pending';
}

export interface Recommendation {
  id: string;
  category: 'Hold train' | 'Short-turn' | 'Open extra gates' | 'Deploy buses' | 'Signal priority';
  problem: string;
  suggestion: string;
  impact: string;
  urgency: 'high' | 'medium' | 'low';
  targetEntityId?: string;
  status: 'pending' | 'applied';
  syncStatus?: 'synced' | 'pending';
}

export interface ActionLog {
  id: string;
  timestamp: string;
  title: string;
  details: string;
  category: 'playbook' | 'crowd_action' | 'work_order' | 'system';
}

// Intermodal City Feeder Fleet & Disruption Auto-Response
export interface FeederBus {
  id: string;
  routeNumber: string;
  stationId: string;
  destination: string;
  status: 'on_time' | 'delayed' | 'holding' | 'dispatched';
  loadPercentage: number;
  etaMinutes: number;
  headwayMinutes: number;
  electricFleet: boolean;
}

export interface BusRoute {
  id: string;
  routeNumber: string;
  name: string;
  stationsServed: string[];
  frequencyMinutes: number;
  activeBuses: number;
  congestionLevel: 'low' | 'medium' | 'high';
}

export interface DisruptionAction {
  id: string;
  title: string;
  description: string;
  type: 'add_buses' | 'hold_buses' | 'alternate_route' | 'signal_priority' | 'shuttle_deploy';
  stationId: string;
  busRoute?: string;
  impactMinutes: number;
  status: 'pending' | 'approved' | 'rejected';
  syncStatus?: 'synced' | 'pending';
}

// Commuter Journey Models
export interface JourneyStep {
  mode: 'metro' | 'bus' | 'walk';
  instruction: string;
  durationMinutes: number;
  lineOrRoute?: string;
  crowdLevel?: CrowdLevel;
  distanceMeters?: number;
}

export interface JourneyPlan {
  id: string;
  originStationId: string;
  destinationStationId: string;
  totalDurationMinutes: number;
  walkingMinutes: number;
  fare: string;
  crowdScore: CrowdLevel;
  steps: JourneyStep[];
  isAlternativeDueToDisruption?: boolean;
}

// Offline Sync Queue Item
export interface SyncQueueItem {
  id: string;
  actionType:
    | 'ack_alert'
    | 'execute_playbook'
    | 'update_workorder'
    | 'approve_disruption'
    | 'reject_disruption'
    | 'log_incident'
    | 'apply_recommendation';
  payload: any;
  timestamp: number;
  status: 'pending' | 'synced';
}
