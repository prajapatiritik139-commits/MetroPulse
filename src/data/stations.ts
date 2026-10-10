/**
 * SINGLE SOURCE OF TRUTH FOR METRO STATIONS
 * Gandhinagar - Ahmedabad Metro Network (Gujarat Metro Rail Corporation)
 *
 * Line 1 (teal, Gandhinagar to Ahmedabad):
 * 1. Mahatma Mandir (MMD)
 * 2. Sector 16 (S16)
 * 3. Infocity (INF)
 * 4. Sachivalaya (SCH)
 * 5. Old High Court (OHC, interchange)
 * 6. Sabarmati (SBR)
 *
 * Line 2 (ruby):
 * 1. Akshardham (AKS)
 * 2. Motera Stadium (MOT)
 * 3. Old High Court (OHC, interchange)
 * 4. Kalupur (KLP)
 * 5. GIFT City (GFT)
 * 6. Gyaspur (GYA)
 */

export interface StationDefinition {
  id: string;
  code: string;
  name: string;
  line: 'L1' | 'L2' | 'L1, L2';
  lines: ('L1' | 'L2')[];
  order: number;
  isInterchange: boolean;
  isTerminal: boolean;
  x: number;
  y: number;
  lat: number;
  lng: number;
  capacity: number;
  accessibilityScore: number;
}

export const STATIONS: StationDefinition[] = [
  // Line 1: Gandhinagar to Ahmedabad
  {
    id: 'ST-01',
    code: 'MMD',
    name: 'Mahatma Mandir',
    line: 'L1',
    lines: ['L1'],
    order: 1,
    isInterchange: false,
    isTerminal: true,
    x: 140,
    y: 90,
    lat: 23.2156,
    lng: 72.6455,
    capacity: 2400,
    accessibilityScore: 96,
  },
  {
    id: 'ST-02',
    code: 'S16',
    name: 'Sector 16',
    line: 'L1',
    lines: ['L1'],
    order: 2,
    isInterchange: false,
    isTerminal: false,
    x: 260,
    y: 90,
    lat: 23.2241,
    lng: 72.6512,
    capacity: 2500,
    accessibilityScore: 92,
  },
  {
    id: 'ST-03',
    code: 'INF',
    name: 'Infocity',
    line: 'L1',
    lines: ['L1'],
    order: 3,
    isInterchange: false,
    isTerminal: false,
    x: 340,
    y: 165,
    lat: 23.1932,
    lng: 72.6288,
    capacity: 2900,
    accessibilityScore: 95,
  },
  {
    id: 'ST-04',
    code: 'SCH',
    name: 'Sachivalaya',
    line: 'L1',
    lines: ['L1'],
    order: 4,
    isInterchange: false,
    isTerminal: false,
    x: 420,
    y: 240,
    lat: 23.2189,
    lng: 72.6628,
    capacity: 2600,
    accessibilityScore: 94,
  },
  {
    id: 'ST-05',
    code: 'OHC',
    name: 'Old High Court',
    line: 'L1, L2',
    lines: ['L1', 'L2'],
    order: 5,
    isInterchange: true,
    isTerminal: false,
    x: 500,
    y: 310,
    lat: 23.0365,
    lng: 72.5684,
    capacity: 3900,
    accessibilityScore: 99,
  },
  {
    id: 'ST-06',
    code: 'SBR',
    name: 'Sabarmati',
    line: 'L1',
    lines: ['L1'],
    order: 6,
    isInterchange: false,
    isTerminal: true,
    x: 380,
    y: 440,
    lat: 23.0845,
    lng: 72.5892,
    capacity: 2700,
    accessibilityScore: 94,
  },

  // Line 2: East-West & Suburbs
  {
    id: 'ST-07',
    code: 'AKS',
    name: 'Akshardham',
    line: 'L2',
    lines: ['L2'],
    order: 1,
    isInterchange: false,
    isTerminal: true,
    x: 860,
    y: 90,
    lat: 23.2324,
    lng: 72.6741,
    capacity: 2800,
    accessibilityScore: 96,
  },
  {
    id: 'ST-08',
    code: 'MOT',
    name: 'Motera Stadium',
    line: 'L2',
    lines: ['L2'],
    order: 2,
    isInterchange: false,
    isTerminal: false,
    x: 680,
    y: 185,
    lat: 23.0912,
    lng: 72.5976,
    capacity: 3400,
    accessibilityScore: 98,
  },
  {
    id: 'ST-09',
    code: 'KLP',
    name: 'Kalupur',
    line: 'L2',
    lines: ['L2'],
    order: 4,
    isInterchange: false,
    isTerminal: false,
    x: 620,
    y: 385,
    lat: 23.0298,
    lng: 72.6015,
    capacity: 2500,
    accessibilityScore: 89,
  },
  {
    id: 'ST-10',
    code: 'GFT',
    name: 'GIFT City',
    line: 'L2',
    lines: ['L2'],
    order: 5,
    isInterchange: false,
    isTerminal: false,
    x: 740,
    y: 460,
    lat: 23.1611,
    lng: 72.6842,
    capacity: 2800,
    accessibilityScore: 98,
  },
  {
    id: 'ST-11',
    code: 'GYA',
    name: 'Gyaspur',
    line: 'L2',
    lines: ['L2'],
    order: 6,
    isInterchange: false,
    isTerminal: true,
    x: 860,
    y: 530,
    lat: 22.9812,
    lng: 72.5621,
    capacity: 2000,
    accessibilityScore: 85,
  },
];

export const STATIONS_BY_ID: Record<string, StationDefinition> = Object.fromEntries(
  STATIONS.map((s) => [s.id, s])
);

export const STATION_NAMES: Record<string, string> = Object.fromEntries(
  STATIONS.map((s) => [s.id, s.name])
);

export const STATION_CODES: Record<string, string> = Object.fromEntries(
  STATIONS.map((s) => [s.id, s.code])
);

export const INTERCHANGE_STATION = STATIONS.find((s) => s.isInterchange)!;
export const INTERCHANGE_NAME = INTERCHANGE_STATION.name; // 'Old High Court'
export const INTERCHANGE_CODE = INTERCHANGE_STATION.code; // 'OHC'

export function getStationName(stationId: string, fallback?: string): string {
  return STATIONS_BY_ID[stationId]?.name || fallback || stationId;
}

export function getStationCode(stationId: string): string {
  return STATIONS_BY_ID[stationId]?.code || stationId;
}

export function getStation(stationId: string): StationDefinition | undefined {
  return STATIONS_BY_ID[stationId];
}

// Line specific ordered lists
export const LINE_1_STATION_IDS = ['ST-01', 'ST-02', 'ST-03', 'ST-04', 'ST-05', 'ST-06'];
export const LINE_2_STATION_IDS = ['ST-07', 'ST-08', 'ST-05', 'ST-09', 'ST-10', 'ST-11'];
