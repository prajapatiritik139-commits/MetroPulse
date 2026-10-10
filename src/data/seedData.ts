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
  FeederBus,
  BusRoute,
  DisruptionAction,
} from '../types/metro';
import {
  STATIONS,
  LINE_1_STATION_IDS,
  LINE_2_STATION_IDS,
  getStationName,
  getStationCode,
} from './stations';

export const SEED_LINES: MetroLine[] = [
  {
    id: 'L1',
    name: 'Teal Line (Line 1 - Gandhinagar to Ahmedabad)',
    code: 'L1-TL',
    color: '#14B8A6',
    stationIds: LINE_1_STATION_IDS,
    totalTrains: 4,
    operatingSpeedKmh: 68,
    headwayMinutes: 3.2,
  },
  {
    id: 'L2',
    name: 'Ruby Line (Line 2 - East-West)',
    code: 'L2-RB',
    color: '#E11D48',
    stationIds: LINE_2_STATION_IDS,
    totalTrains: 4,
    operatingSpeedKmh: 74,
    headwayMinutes: 3.8,
  },
];

// Helper to calculate realistic surge forecast curve (rise toward peak around +30 min, then ease)
// and strictly capped by capacity (never 99% for all three horizons).
function makeStationForecast(currentPct: number, isInterchange: boolean) {
  // Peak reaches at +30m, capped between 74% and 94%
  const peak = Math.min(
    isInterchange ? 94 : 90,
    Math.max(currentPct + 6, Math.round(currentPct * 1.15))
  );
  // +15m is rising halfway toward peak
  const m15 = Math.min(90, Math.round(currentPct + (peak - currentPct) * 0.62));
  // +30m is the peak
  const m30 = peak;
  // +60m eases off significantly
  const m60 = Math.max(28, Math.round(peak * 0.74));

  return {
    minute15: m15,
    minute30: m30,
    minute60: m60,
  };
}

// 11 Stations reading directly from stations.ts single source of truth
export const SEED_STATIONS: Station[] = STATIONS.map((st) => {
  let crowdPct = 52;
  let inRate = 32;
  let outRate = 28;

  if (st.id === 'ST-05') {
    // Old High Court (Interchange)
    crowdPct = 94;
    inRate = 88;
    outRate = 74;
  } else if (st.id === 'ST-08') {
    // Motera Stadium
    crowdPct = 78;
    inRate = 62;
    outRate = 54;
  } else if (st.id === 'ST-03') {
    // Infocity
    crowdPct = 82;
    inRate = 60;
    outRate = 52;
  } else if (st.id === 'ST-02') {
    // Sector 16
    crowdPct = 68;
    inRate = 44;
    outRate = 38;
  } else if (st.id === 'ST-04') {
    // Sachivalaya
    crowdPct = 72;
    inRate = 48;
    outRate = 42;
  } else if (st.id === 'ST-07') {
    // Akshardham
    crowdPct = 64;
    inRate = 38;
    outRate = 34;
  } else if (st.id === 'ST-10') {
    // GIFT City
    crowdPct = 60;
    inRate = 36;
    outRate = 32;
  } else if (st.id === 'ST-06') {
    // Sabarmati
    crowdPct = 58;
    inRate = 34;
    outRate = 30;
  } else if (st.id === 'ST-09') {
    // Kalupur
    crowdPct = 48;
    inRate = 28;
    outRate = 26;
  } else if (st.id === 'ST-11') {
    // Gyaspur
    crowdPct = 32;
    inRate = 18;
    outRate = 20;
  }

  const crowdLevel =
    crowdPct >= 92 ? 'critical' : crowdPct >= 80 ? 'crowded' : crowdPct >= 65 ? 'busy' : crowdPct >= 40 ? 'moderate' : 'low';
  const paxVolume = Math.round((crowdPct / 100) * st.capacity);

  return {
    id: st.id,
    name: st.name,
    code: st.code,
    lat: st.lat,
    lng: st.lng,
    x: st.x,
    y: st.y,
    lines: st.lines,
    isInterchange: st.isInterchange,
    isTerminal: st.isTerminal,
    crowdLevel,
    crowdPercentage: crowdPct,
    passengerVolume: paxVolume,
    capacity: st.capacity,
    inflowRate: inRate,
    outflowRate: outRate,
    forecast: makeStationForecast(crowdPct, st.isInterchange),
    assetIds: [`AST-${st.id.replace('ST-', '1')}`],
    feederBusIds: ['BUS-40'],
    accessibilityScore: st.accessibilityScore,
  };
});

export const SEED_TRAINS: Train[] = [
  {
    id: 'TR-101',
    name: 'Sabarmati Superfast (T-101)',
    lineId: 'L1',
    currentStationId: 'ST-02',
    nextStationId: 'ST-03',
    lat: 23.208,
    lng: 72.64,
    x: 300,
    y: 125,
    status: 'on_time',
    speedKmh: 64,
    loadPercentage: 74,
    crowdLoadPercentage: 74,
    passengersOnboard: 666,
    capacity: 900,
    direction: 'southbound',
    progressBetweenStations: 0.5,
    progressRatio: 0.5,
    carsCount: 6,
    isHeld: false,
  },
  {
    id: 'TR-102',
    name: 'Gandhinagar Pioneer (T-102)',
    lineId: 'L1',
    currentStationId: 'ST-04',
    nextStationId: 'ST-05',
    lat: 23.12,
    lng: 72.61,
    x: 460,
    y: 275,
    status: 'on_time',
    speedKmh: 68,
    loadPercentage: 86,
    crowdLoadPercentage: 86,
    passengersOnboard: 774,
    capacity: 900,
    direction: 'southbound',
    progressBetweenStations: 0.6,
    progressRatio: 0.6,
    carsCount: 6,
    isHeld: false,
  },
  {
    id: 'TR-103',
    name: 'Riverfront Flyer (T-103)',
    lineId: 'L1',
    currentStationId: 'ST-06',
    nextStationId: 'ST-05',
    lat: 23.06,
    lng: 72.58,
    x: 440,
    y: 375,
    status: 'on_time',
    speedKmh: 62,
    loadPercentage: 58,
    crowdLoadPercentage: 58,
    passengersOnboard: 522,
    capacity: 900,
    direction: 'northbound',
    progressBetweenStations: 0.5,
    progressRatio: 0.5,
    carsCount: 6,
    isHeld: false,
  },
  {
    id: 'TR-104',
    name: 'Capital Shuttler (T-104)',
    lineId: 'L1',
    currentStationId: 'ST-01',
    nextStationId: 'ST-02',
    lat: 23.2198,
    lng: 72.6483,
    x: 200,
    y: 90,
    status: 'on_time',
    speedKmh: 58,
    loadPercentage: 50,
    crowdLoadPercentage: 50,
    passengersOnboard: 450,
    capacity: 900,
    direction: 'southbound',
    progressBetweenStations: 0.5,
    progressRatio: 0.5,
    carsCount: 6,
    isHeld: false,
  },
  {
    id: 'TR-201',
    name: 'Akshardham Express (T-201)',
    lineId: 'L2',
    currentStationId: 'ST-07',
    nextStationId: 'ST-08',
    lat: 23.16,
    lng: 72.64,
    x: 770,
    y: 135,
    status: 'on_time',
    speedKmh: 72,
    loadPercentage: 58,
    crowdLoadPercentage: 58,
    passengersOnboard: 522,
    capacity: 900,
    direction: 'westbound',
    progressBetweenStations: 0.5,
    progressRatio: 0.5,
    carsCount: 6,
    isHeld: false,
  },
  {
    id: 'TR-202',
    name: 'Motera Super (T-202)',
    lineId: 'L2',
    currentStationId: 'ST-08',
    nextStationId: 'ST-05',
    lat: 23.06,
    lng: 72.58,
    x: 590,
    y: 245,
    status: 'on_time',
    speedKmh: 70,
    loadPercentage: 88,
    crowdLoadPercentage: 88,
    passengersOnboard: 792,
    capacity: 900,
    direction: 'westbound',
    progressBetweenStations: 0.6,
    progressRatio: 0.6,
    carsCount: 6,
    isHeld: false,
  },
  {
    id: 'TR-203',
    name: 'Karnavati Express (T-203)',
    lineId: 'L2',
    currentStationId: 'ST-05',
    nextStationId: 'ST-09',
    lat: 23.03,
    lng: 72.58,
    x: 560,
    y: 345,
    status: 'delayed',
    speedKmh: 38,
    loadPercentage: 82,
    crowdLoadPercentage: 82,
    passengersOnboard: 738,
    capacity: 900,
    direction: 'eastbound',
    progressBetweenStations: 0.4,
    progressRatio: 0.4,
    carsCount: 6,
    isHeld: false,
  },
  {
    id: 'TR-204',
    name: 'GIFT Smart Metro (T-204)',
    lineId: 'L2',
    currentStationId: 'ST-10',
    nextStationId: 'ST-11',
    lat: 23.05,
    lng: 72.62,
    x: 800,
    y: 495,
    status: 'on_time',
    speedKmh: 66,
    loadPercentage: 46,
    crowdLoadPercentage: 46,
    passengersOnboard: 414,
    capacity: 900,
    direction: 'eastbound',
    progressBetweenStations: 0.5,
    progressRatio: 0.5,
    carsCount: 6,
    isHeld: false,
  },
];

// Requirement 1: Make asset station names match their asset names
export const SEED_ASSETS: Asset[] = [
  {
    id: 'AST-101',
    name: 'Mahatma Mandir Escalator M-1',
    type: 'escalator',
    stationId: 'ST-01',
    healthScore: 88,
    failureRisk: 'low',
    operatingHours: 7240,
    temperatureCelsius: 38.4,
    vibrationMmS: 0.95,
    cyclesCount: 312000,
    historySparkline: [92, 91, 90, 89, 89, 88, 88, 88, 88, 88],
    lastMaintenance: '08:00',
  },
  {
    id: 'AST-102',
    name: 'Mahatma Mandir Platform Elevator L-1',
    type: 'lift',
    stationId: 'ST-01',
    healthScore: 78,
    failureRisk: 'low',
    operatingHours: 5120,
    temperatureCelsius: 41.2,
    vibrationMmS: 1.45,
    cyclesCount: 184000,
    historySparkline: [82, 81, 80, 80, 79, 79, 78, 78, 78, 78],
    lastMaintenance: '07:30',
  },
  {
    id: 'AST-103',
    name: 'Mahatma Mandir Concourse Turnstiles A',
    type: 'afc_gate',
    stationId: 'ST-01',
    healthScore: 92,
    failureRisk: 'low',
    operatingHours: 6400,
    temperatureCelsius: 32.1,
    vibrationMmS: 0.65,
    cyclesCount: 680000,
    historySparkline: [95, 94, 94, 93, 93, 92, 92, 92, 92, 92],
    lastMaintenance: '08:15',
  },
  {
    id: 'AST-104',
    name: 'Sector 16 Traction Signal S-12',
    type: 'signal',
    stationId: 'ST-02',
    healthScore: 54, // Health < 60 -> Needs Service #1
    failureRisk: 'high',
    operatingHours: 8940,
    temperatureCelsius: 48.7,
    vibrationMmS: 2.85,
    cyclesCount: 940000,
    historySparkline: [68, 65, 63, 61, 59, 58, 56, 55, 55, 54],
    lastMaintenance: '06:45',
    workOrderId: 'WO-1001',
  },
  {
    id: 'AST-105',
    name: 'Sector 16 Platform Screen Doors T1',
    type: 'door',
    stationId: 'ST-02',
    healthScore: 71,
    failureRisk: 'medium',
    operatingHours: 7300,
    temperatureCelsius: 43.6,
    vibrationMmS: 1.82,
    cyclesCount: 420000,
    historySparkline: [77, 76, 75, 74, 73, 73, 72, 72, 71, 71],
    lastMaintenance: '07:15',
  },
  {
    id: 'AST-106',
    name: 'Infocity Heavy Escalator E-4',
    type: 'escalator',
    stationId: 'ST-03',
    healthScore: 48, // Health < 60 -> Needs Service #2
    failureRisk: 'critical',
    operatingHours: 11450,
    temperatureCelsius: 52.8,
    vibrationMmS: 3.42,
    cyclesCount: 890000,
    historySparkline: [62, 59, 57, 54, 52, 51, 50, 49, 48, 48],
    lastMaintenance: '07:00',
    workOrderId: 'WO-1002',
  },
  {
    id: 'AST-107',
    name: 'Infocity Smart AFC Gates Bank B',
    type: 'afc_gate',
    stationId: 'ST-03',
    healthScore: 88,
    failureRisk: 'low',
    operatingHours: 4200,
    temperatureCelsius: 34.2,
    vibrationMmS: 0.78,
    cyclesCount: 510000,
    historySparkline: [92, 91, 90, 90, 89, 89, 88, 88, 88, 88],
    lastMaintenance: '08:10',
  },
  {
    id: 'AST-108',
    name: 'Sachivalaya Platform Screen Doors S-1',
    type: 'door',
    stationId: 'ST-04',
    healthScore: 84,
    failureRisk: 'low',
    operatingHours: 5200,
    temperatureCelsius: 37.1,
    vibrationMmS: 1.1,
    cyclesCount: 390000,
    historySparkline: [88, 87, 86, 85, 85, 84, 84, 84, 84, 84],
    lastMaintenance: '07:45',
  },
  {
    id: 'AST-109',
    name: 'Old High Court Main Escalator E-01',
    type: 'escalator',
    stationId: 'ST-05',
    healthScore: 66,
    failureRisk: 'medium',
    operatingHours: 9200,
    temperatureCelsius: 45.3,
    vibrationMmS: 2.14,
    cyclesCount: 740000,
    historySparkline: [73, 72, 70, 69, 68, 68, 67, 67, 66, 66],
    lastMaintenance: '07:50',
  },
  {
    id: 'AST-110',
    name: 'Old High Court Transfer Lift L-04',
    type: 'lift',
    stationId: 'ST-05',
    healthScore: 58, // Health < 60 -> Needs Service #3
    failureRisk: 'high',
    operatingHours: 8700,
    temperatureCelsius: 47.9,
    vibrationMmS: 2.76,
    cyclesCount: 460000,
    historySparkline: [69, 67, 65, 63, 62, 60, 59, 59, 58, 58],
    lastMaintenance: '06:30',
    workOrderId: 'WO-1003',
  },
  {
    id: 'AST-111',
    name: 'Old High Court Cross-Platform Doors',
    type: 'door',
    stationId: 'ST-05',
    healthScore: 79,
    failureRisk: 'low',
    operatingHours: 5400,
    temperatureCelsius: 39.5,
    vibrationMmS: 1.34,
    cyclesCount: 520000,
    historySparkline: [84, 83, 82, 81, 80, 80, 79, 79, 79, 79],
    lastMaintenance: '08:20',
  },
  {
    id: 'AST-112',
    name: 'Old High Court Crossing Signal SC-X1',
    type: 'signal',
    stationId: 'ST-05',
    healthScore: 91,
    failureRisk: 'low',
    operatingHours: 4900,
    temperatureCelsius: 35.8,
    vibrationMmS: 0.95,
    cyclesCount: 610000,
    historySparkline: [93, 93, 92, 92, 91, 91, 91, 91, 91, 91],
    lastMaintenance: '08:05',
  },
  {
    id: 'AST-113',
    name: 'Old High Court AFC Fare Gates 1-12',
    type: 'afc_gate',
    stationId: 'ST-05',
    healthScore: 73,
    failureRisk: 'medium',
    operatingHours: 8100,
    temperatureCelsius: 42.1,
    vibrationMmS: 1.68,
    cyclesCount: 980000,
    historySparkline: [78, 77, 76, 75, 74, 74, 73, 73, 73, 73],
    lastMaintenance: '07:25',
  },
  {
    id: 'AST-114',
    name: 'Sabarmati Concourse Escalator SB-1',
    type: 'escalator',
    stationId: 'ST-06',
    healthScore: 86,
    failureRisk: 'low',
    operatingHours: 4100,
    temperatureCelsius: 36.5,
    vibrationMmS: 0.92,
    cyclesCount: 310000,
    historySparkline: [90, 89, 88, 88, 87, 87, 86, 86, 86, 86],
    lastMaintenance: '07:40',
  },
  {
    id: 'AST-115',
    name: 'Akshardham Concourse Escalator A-01',
    type: 'escalator',
    stationId: 'ST-07',
    healthScore: 87,
    failureRisk: 'low',
    operatingHours: 3900,
    temperatureCelsius: 36.2,
    vibrationMmS: 0.92,
    cyclesCount: 290000,
    historySparkline: [90, 89, 89, 88, 88, 87, 87, 87, 87, 87],
    lastMaintenance: '07:40',
  },
  {
    id: 'AST-116',
    name: 'Motera Stadium Heavy Escalator MS-1',
    type: 'escalator',
    stationId: 'ST-08',
    healthScore: 70,
    failureRisk: 'medium',
    operatingHours: 7200,
    temperatureCelsius: 44.0,
    vibrationMmS: 1.95,
    cyclesCount: 560000,
    historySparkline: [78, 76, 75, 74, 73, 72, 71, 70, 70, 70],
    lastMaintenance: '07:10',
  },
  {
    id: 'AST-117',
    name: 'Kalupur Junction Lift KL-1',
    type: 'lift',
    stationId: 'ST-09',
    healthScore: 82,
    failureRisk: 'low',
    operatingHours: 4800,
    temperatureCelsius: 38.2,
    vibrationMmS: 1.15,
    cyclesCount: 340000,
    historySparkline: [86, 85, 84, 84, 83, 83, 82, 82, 82, 82],
    lastMaintenance: '07:55',
  },
  {
    id: 'AST-118',
    name: 'GIFT City FinTech Smart Turnstile G-1',
    type: 'afc_gate',
    stationId: 'ST-10',
    healthScore: 94,
    failureRisk: 'low',
    operatingHours: 3200,
    temperatureCelsius: 31.8,
    vibrationMmS: 0.58,
    cyclesCount: 420000,
    historySparkline: [96, 96, 95, 95, 94, 94, 94, 94, 94, 94],
    lastMaintenance: '08:20',
  },
  {
    id: 'AST-119',
    name: 'Gyaspur Depot Interlocking Signal GP-1',
    type: 'signal',
    stationId: 'ST-11',
    healthScore: 89,
    failureRisk: 'low',
    operatingHours: 4100,
    temperatureCelsius: 35.0,
    vibrationMmS: 0.88,
    cyclesCount: 310000,
    historySparkline: [92, 91, 90, 90, 89, 89, 89, 89, 89, 89],
    lastMaintenance: '08:00',
  },
];

// Work orders count = 3, strictly matching the 3 degraded assets needing service
export const SEED_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'WO-1001',
    assetId: 'AST-104',
    assetName: 'Sector 16 Traction Signal S-12',
    stationName: 'Sector 16',
    assetType: 'signal',
    status: 'In Progress',
    priority: 'high',
    assignedCrew: 'Signals Delta Unit (Gandhinagar)',
    createdAt: '08:15',
    updatedAt: '08:28',
    notes: 'Optical reflector alignment and relay vibration damper replacement.',
    syncStatus: 'synced',
  },
  {
    id: 'WO-1002',
    assetId: 'AST-106',
    assetName: 'Infocity Heavy Escalator E-4',
    stationName: 'Infocity',
    assetType: 'escalator',
    status: 'Assigned',
    priority: 'critical',
    assignedCrew: 'Mechanical Rapid Unit 2 (Ahmedabad)',
    createdAt: '08:20',
    updatedAt: '08:31',
    notes: 'Bearing temperature spike detected. Motor gearbox overhaul scheduled.',
    syncStatus: 'synced',
  },
  {
    id: 'WO-1003',
    assetId: 'AST-110',
    assetName: 'Old High Court Transfer Lift L-04',
    stationName: 'Old High Court',
    assetType: 'lift',
    status: 'Open',
    priority: 'high',
    createdAt: '08:25',
    updatedAt: '08:25',
    notes: 'Hydraulic leveling sensor recalibration required before morning rush.',
    syncStatus: 'synced',
  },
];

// Function to generate seed incidents relative to simulated clock
export function generateSeedIncidents(simTime: Date): Incident[] {
  const getOffsetHHMM = (offsetMinutes: number) => {
    const d = new Date(simTime.getTime() + offsetMinutes * 60 * 1000);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  return [
    {
      id: 'INC-2041',
      title: 'Platform 2 Crowd Surge - Old High Court',
      type: 'overcrowding',
      severity: 'critical',
      affectedStationIds: ['ST-05'],
      affectedLineIds: ['L1', 'L2'],
      reportedAt: getOffsetHHMM(-12), // Reported 12 min ago relative to sim time
      status: 'active',
      description:
        'Transfer corridor density exceeded 4 pax/m² following arrival of paired trains from Gandhinagar and Motera.',
      playbookSteps: [
        {
          stepNumber: 1,
          instruction: 'Announce platform crowd metering via station Gujarati & Hindi PA systems',
          executed: true,
          executedAt: getOffsetHHMM(-10),
        },
        {
          stepNumber: 2,
          instruction: 'Hold arriving Line 2 Train T-202 dwell time by 90s to space platform egress',
          executed: false,
        },
        {
          stepNumber: 3,
          instruction: 'Switch Concourse Turnstiles 5-8 into Exit-Only emergency egress mode',
          executed: false,
        },
        {
          stepNumber: 4,
          instruction: 'Deploy Gujarat Metro security marshals to stairway B to direct flow to outer mezzanine',
          executed: false,
        },
      ],
      syncStatus: 'synced',
    },
    {
      id: 'INC-2040',
      title: 'Traction Signal Latency S-12 - Sector 16',
      type: 'signal_fault',
      severity: 'medium',
      affectedStationIds: ['ST-02'],
      affectedLineIds: ['L1'],
      reportedAt: getOffsetHHMM(-17),
      status: 'mitigating',
      description:
        'Signal interlocking showing sporadic latency fluctuations. Headway spacing increased by 20s as safeguard.',
      playbookSteps: [
        {
          stepNumber: 1,
          instruction: 'Notify OCC signaling supervisor and dispatch field crew',
          executed: true,
          executedAt: getOffsetHHMM(-15),
        },
        {
          stepNumber: 2,
          instruction: 'Enforce fail-safe speed cap of 50 km/h across block 12-B',
          executed: true,
          executedAt: getOffsetHHMM(-13),
        },
        {
          stepNumber: 3,
          instruction: 'Verify automated cab-signaling redundancy',
          executed: false,
        },
      ],
      syncStatus: 'synced',
    },
  ];
}

export function generateSeedAlerts(simTime: Date): Alert[] {
  const getOffsetHHMMSS = (offsetMinutes: number) => {
    const d = new Date(simTime.getTime() + offsetMinutes * 60 * 1000);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return [
    {
      id: 'ALT-301',
      title: 'Old High Court Platform Surge Critical',
      message: 'Old High Court crowd density at 94% design threshold.',
      severity: 'critical',
      timestamp: getOffsetHHMMSS(-12),
      acknowledged: false,
      stationId: 'ST-05',
      incidentId: 'INC-2041',
      syncStatus: 'synced',
    },
    {
      id: 'ALT-302',
      title: 'Escalator E-4 High Vibration Anomaly',
      message: 'Bearing vibration 3.42 mm/s on Infocity transfer unit.',
      severity: 'warning',
      timestamp: getOffsetHHMMSS(-13),
      acknowledged: false,
      stationId: 'ST-03',
      assetId: 'AST-106',
      syncStatus: 'synced',
    },
    {
      id: 'ALT-303',
      title: 'Signal S-12 Auxiliary Redundancy Active',
      message: 'Sector 16 block signal running on backup channel.',
      severity: 'warning',
      timestamp: getOffsetHHMMSS(-17),
      acknowledged: true,
      stationId: 'ST-02',
      assetId: 'AST-104',
      incidentId: 'INC-2040',
      syncStatus: 'synced',
    },
  ];
}

// Fallback static references for initial module import
const _defaultSimTime = new Date();
_defaultSimTime.setHours(8, 35, 0, 0);
export const SEED_INCIDENTS = generateSeedIncidents(_defaultSimTime);
export const SEED_ALERTS = generateSeedAlerts(_defaultSimTime);

export const SEED_SUGGESTED_ACTIONS: SuggestedAction[] = [
  {
    id: 'ACT-01',
    title: 'Hold Train TR-102 (Dwell +90s)',
    description: 'Pause train TR-102 departure at Old High Court to relieve platform 1 bottleneck.',
    type: 'hold_train',
    category: 'Hold train',
    stationId: 'ST-05',
    trainId: 'TR-102',
    urgency: 'high',
    impact: 'Reduces platform congestion spike by 22% over next 4 mins',
    status: 'pending',
    syncStatus: 'synced',
  },
  {
    id: 'ACT-02',
    title: 'Short-Turn TR-203 at Sector 16',
    description: 'Reverse train early to restore 3.2m headway on northbound loop.',
    type: 'short_turn',
    category: 'Short-turn',
    stationId: 'ST-02',
    trainId: 'TR-203',
    urgency: 'medium',
    impact: 'Eliminates 5.4m headway gap on northbound corridor',
    status: 'pending',
    syncStatus: 'synced',
  },
  {
    id: 'ACT-03',
    title: 'Open Extra AFC Turnstiles (Exit Mode)',
    description: 'Switch AFC gates 5-8 at Old High Court to bidirectional exit free-flow.',
    type: 'open_gates',
    category: 'Open extra gates',
    stationId: 'ST-05',
    urgency: 'high',
    impact: 'Increases platform egress clearance rate by +420 pax/min',
    status: 'pending',
    syncStatus: 'synced',
  },
];

export const INITIAL_KPIS: NetworkKpis = {
  onTimePerformance: 98.4,
  onTimeTrend: +0.2,
  avgHeadwayMinutes: 3.4,
  headwayTrend: -0.1,
  passengersPerHour: 18450,
  paxTrend: +3.2,
  activeAlertsCount: 2,
  criticalAlertsCount: 1, // Exactly 1 critical active incident
  assetAvailabilityPercentage: 96.8,
  availabilityTrend: -0.4,
};

// Local bus names: GSRTC and AMTS feeders
export const SEED_FEEDER_BUSES: FeederBus[] = [
  {
    id: 'BUS-40',
    routeNumber: 'AMTS Feeder 40 Express',
    stationId: 'ST-05',
    destination: 'Sabarmati Riverfront & Ashram Road',
    status: 'on_time',
    loadPercentage: 68,
    etaMinutes: 3,
    headwayMinutes: 5,
    electricFleet: true,
  },
  {
    id: 'BUS-42',
    routeNumber: 'AMTS Route 42 Shuttler',
    stationId: 'ST-05',
    destination: 'Kalupur Railway Junction Connector',
    status: 'holding',
    loadPercentage: 82,
    etaMinutes: 1,
    headwayMinutes: 4,
    electricFleet: true,
  },
  {
    id: 'BUS-12',
    routeNumber: 'GSRTC Feeder 12',
    stationId: 'ST-01',
    destination: 'Gandhinagar Sachivalaya & Vidhan Sabha',
    status: 'on_time',
    loadPercentage: 45,
    etaMinutes: 4,
    headwayMinutes: 6,
    electricFleet: true,
  },
  {
    id: 'BUS-21',
    routeNumber: 'GSRTC IT Express 21',
    stationId: 'ST-02',
    destination: 'Infocity DA-IICT & TCS Garima Park',
    status: 'on_time',
    loadPercentage: 74,
    etaMinutes: 2,
    headwayMinutes: 5,
    electricFleet: true,
  },
  {
    id: 'BUS-81',
    routeNumber: 'GSRTC / AMTS GIFT Shuttler 81',
    stationId: 'ST-10',
    destination: 'GIFT Tower One & SEZ FinTech Hub',
    status: 'on_time',
    loadPercentage: 58,
    etaMinutes: 5,
    headwayMinutes: 7,
    electricFleet: true,
  },
  {
    id: 'BUS-110',
    routeNumber: 'AMTS Feeder 110 (Stadium Link)',
    stationId: 'ST-08',
    destination: 'Narendra Modi Stadium Gate 1 VIP Plaza',
    status: 'on_time',
    loadPercentage: 62,
    etaMinutes: 4,
    headwayMinutes: 6,
    electricFleet: true,
  },
  {
    id: 'BUS-120',
    routeNumber: 'GSRTC Sabarmati Shuttler 120',
    stationId: 'ST-06',
    destination: 'Sabarmati High-Speed Rail Terminal',
    status: 'on_time',
    loadPercentage: 54,
    etaMinutes: 5,
    headwayMinutes: 8,
    electricFleet: true,
  },
];

export const SEED_DISRUPTIONS: DisruptionAction[] = [
  {
    id: 'DISR-01',
    title: 'Inject 4 AMTS Feeder Shuttles at Old High Court',
    description: 'Provide rapid surface connection to Sabarmati to relieve platform 2 crowd surge.',
    type: 'add_buses',
    stationId: 'ST-05',
    busRoute: 'AMTS Route 42 Shuttler',
    impactMinutes: 14,
    status: 'pending',
    syncStatus: 'synced',
  },
  {
    id: 'DISR-02',
    title: 'Hold AMTS 110 Stadium Link (4 min) at Motera Stadium',
    description: 'Synchronize with arriving Line 2 train to transfer 140 passengers smoothly to stadium concourse.',
    type: 'hold_buses',
    stationId: 'ST-08',
    busRoute: 'AMTS Feeder 110 (Stadium Link)',
    impactMinutes: 8,
    status: 'pending',
    syncStatus: 'synced',
  },
  {
    id: 'DISR-03',
    title: 'Request Transit Signal Priority on Ashram Road Corridor',
    description: 'Activate smart traffic signal priority green waves for feeder fleet around Old High Court.',
    type: 'signal_priority',
    stationId: 'ST-05',
    impactMinutes: 6,
    status: 'pending',
    syncStatus: 'synced',
  },
];
