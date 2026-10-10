import { eventBus, METRO_EVENTS } from './eventBus';
import { IncidentType } from './types';
import { getStationName } from '../data/stations';

export interface ScenarioDefinition {
  id: string;
  name: string;
  type: IncidentType;
  description: string;
  targetStationId: string;
  impactMinutes: number;
}

export const PRESET_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'sc-surge',
    name: 'Major Event Stadium Crowd Surge',
    type: 'overcrowding',
    description: `Sudden influx of 2,400 passengers arriving at ${getStationName('ST-04')} from sports arena.`,
    targetStationId: 'ST-04',
    impactMinutes: 18,
  },
  {
    id: 'sc-breakdown',
    name: 'Traction Inverter Fault (Train 101)',
    type: 'train_breakdown',
    description: `Lead motor controller failed on northbound approach to ${getStationName('ST-02')}.`,
    targetStationId: 'ST-02',
    impactMinutes: 35,
  },
  {
    id: 'sc-power',
    name: 'Substation 22kV Transformer Trip',
    type: 'power_failure',
    description: `${getStationName('ST-08')} feeder dropped to auxiliary UPS battery mode.`,
    targetStationId: 'ST-08',
    impactMinutes: 25,
  },
  {
    id: 'sc-medical',
    name: 'Platform Medical Assistance Emergency',
    type: 'medical_emergency',
    description: `Commuter emergency assistance requested at ${getStationName('ST-03')} Platform 1.`,
    targetStationId: 'ST-03',
    impactMinutes: 12,
  },
  {
    id: 'sc-strike',
    name: 'Terminal Transit Staff Action',
    type: 'strike',
    description: `Temporary labor action impacting ${getStationName('ST-12')} terminal turnstiles.`,
    targetStationId: 'ST-12',
    impactMinutes: 40,
  },
];

export interface DemoScenarioStage {
  timeSeconds: number;
  stageName: string;
  headline: string;
  detail: string;
  actionTaken: string;
  metrics: {
    delaySavedMin: number;
    paxRerouted: number;
    busesDispatched: number;
    headwayImpact: string;
  };
}

export const DEMO_STAGES: DemoScenarioStage[] = [
  {
    timeSeconds: 0,
    stageName: 'Baseline Operations',
    headline: 'Nominal Morning Commute',
    detail: 'All 2 lines running nominal headway (3.2m), on-time performance 98.4%.',
    actionTaken: 'Normal automated timetable control.',
    metrics: { delaySavedMin: 0, paxRerouted: 0, busesDispatched: 0, headwayImpact: '3.2 min' },
  },
  {
    timeSeconds: 20,
    stageName: 'Crowd Surge Influx',
    headline: `Platform Surge at ${getStationName('ST-04')}`,
    detail: 'Crowd load spikes to 95% on Platform 2 transfer concourse.',
    actionTaken: 'Auto-metering gates deployed; platform holding pattern announced.',
    metrics: { delaySavedMin: 8, paxRerouted: 450, busesDispatched: 2, headwayImpact: '3.6 min' },
  },
  {
    timeSeconds: 50,
    stageName: 'Traction Breakdown',
    headline: `Train 101 Stalled at ${getStationName('ST-02')}`,
    detail: 'Emergency friction brakes locked; single track blockage on Line 1.',
    actionTaken: 'Holding orders issued to following trains; crossover single-line bypass initiated.',
    metrics: { delaySavedMin: 22, paxRerouted: 1850, busesDispatched: 6, headwayImpact: '4.8 min' },
  },
  {
    timeSeconds: 85,
    stageName: 'Intermodal Bus Bridge',
    headline: 'City Coordinator Feeder Shuttle Injection',
    detail: 'City transport coordinator approves 6 rapid AMTS & GSRTC feeder buses to bypass blocked track.',
    actionTaken: `Signal priority requested for ${getStationName('ST-01')} corridor; passengers seamlessly diverted.`,
    metrics: { delaySavedMin: 38, paxRerouted: 3100, busesDispatched: 8, headwayImpact: '3.9 min' },
  },
  {
    timeSeconds: 110,
    stageName: 'System Full Recovery',
    headline: 'Service Normalized & Consist Towed',
    detail: 'Auxiliary shunter cleared track; regular line headways restored.',
    actionTaken: 'Timetable synchronization complete. Closed incident archive logged.',
    metrics: { delaySavedMin: 46, paxRerouted: 3850, busesDispatched: 8, headwayImpact: '3.2 min' },
  },
];
