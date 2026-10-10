import {
  Station,
  Train,
  Asset,
  WorkOrder,
  Incident,
  Alert,
  NetworkKpis,
  CrowdLevel,
  MetroLine,
} from '../types/metro';

export function getDiurnalFactor(date: Date): number {
  const hours = date.getHours() + date.getMinutes() / 60;
  // Morning peak: 08:00 - 10:00, peak at 08:45
  if (hours >= 7.5 && hours <= 10.5) {
    const diff = Math.abs(hours - 8.75);
    return 1.4 + Math.max(0, 0.6 - diff * 0.4);
  }
  // Evening peak: 17:00 - 20:00, peak at 18:15
  if (hours >= 16.5 && hours <= 20.5) {
    const diff = Math.abs(hours - 18.25);
    return 1.5 + Math.max(0, 0.65 - diff * 0.35);
  }
  // Midday moderate: 11:00 - 16:00
  if (hours >= 11.0 && hours <= 16.0) {
    return 0.75 + Math.sin((hours - 11) * 0.5) * 0.15;
  }
  // Night low: 22:00 - 06:00
  if (hours >= 22.0 || hours <= 6.0) {
    return 0.25;
  }
  // Shoulder hours
  return 0.55;
}

export function computeCrowdLevel(pct: number): CrowdLevel {
  if (pct < 35) return 'low';
  if (pct <= 60) return 'moderate';
  if (pct <= 80) return 'busy';
  if (pct <= 90) return 'crowded';
  return 'critical';
}

export interface SimulationTickResult {
  stations: Station[];
  trains: Train[];
  assets: Asset[];
  workOrders: WorkOrder[];
  alerts: Alert[];
  kpis: NetworkKpis;
  newAlertsGenerated: Alert[];
  newWorkOrdersGenerated: WorkOrder[];
}

export function runSimulationTick(
  prevStations: Station[],
  prevTrains: Train[],
  prevAssets: Asset[],
  prevWorkOrders: WorkOrder[],
  prevAlerts: Alert[],
  lines: MetroLine[],
  incidents: Incident[],
  simulatedTime: Date,
  timeStepSeconds: number
): SimulationTickResult {
  const stationMap = new Map<string, Station>(prevStations.map((s) => [s.id, s]));
  const lineMap = new Map<string, MetroLine>(lines.map((l) => [l.id, l]));

  const diurnal = getDiurnalFactor(simulatedTime);
  const newAlertsGenerated: Alert[] = [];
  const newWorkOrdersGenerated: WorkOrder[] = [];

  // Realistic network throughput scaled strictly between 8,000 and 25,000 pax/hour
  const rawPaxPerHour = Math.round(14500 * diurnal + (Math.random() - 0.5) * 500);
  const passengersPerHour = Math.min(25000, Math.max(8000, rawPaxPerHour));

  // Total capacity of all stations is approx 22,500
  const totalNetworkCapacity = prevStations.reduce((sum, s) => sum + s.capacity, 0) || 22500;

  // Station type baseline: Interchange highest (94%), core commercial (67-85%), terminals medium (48-82%), suburban lowest (31-43%)
  const getStationBaseCrowd = (stId: string, isInterchange: boolean) => {
    switch (stId) {
      case 'ST-05': return 94; // Old High Court (Interchange highest)
      case 'ST-03': return 85; // Infocity
      case 'ST-08': return 82; // Motera Stadium
      case 'ST-07': return 78; // Akshardham
      case 'ST-02': return 72; // Sector 16
      case 'ST-10': return 70; // GIFT City
      case 'ST-06': return 61; // Sabarmati
      case 'ST-04': return 58; // Sachivalaya
      case 'ST-01': return 54; // Mahatma Mandir
      case 'ST-09': return 50; // Kalupur
      case 'ST-11': return 42; // Gyaspur (suburban terminal)
      default: return isInterchange ? 92 : 55;
    }
  };

  // 1. Update Stations
  const updatedStations = prevStations.map((st) => {
    // Check if station has active incident
    const hasActiveIncident = incidents.some(
      (inc) => inc.status !== 'resolved' && inc.affectedStationIds.includes(st.id)
    );

    const basePct = getStationBaseCrowd(st.id, st.isInterchange);
    const noise = (Math.random() - 0.48) * 2; // subtle organic jitter
    // Modulate around the station-specific baseline
    let targetPct = Math.min(95, Math.max(30, basePct * (0.88 + 0.12 * diurnal) + noise));
    if (hasActiveIncident) {
      targetPct = Math.min(98, targetPct + 15);
    }

    // Smooth transition
    const smoothedPct = Math.min(98, Math.max(28, Math.round(st.crowdPercentage * 0.85 + targetPct * 0.15)));
    const passengerVolume = Math.round((smoothedPct / 100) * st.capacity);
    
    // Inflow scaled to match overall network throughput of 8,000 - 25,000 pax/hr
    const stationShare = st.capacity / totalNetworkCapacity;
    const inflowRate = Math.max(6, Math.round((passengersPerHour / 60) * stationShare * (0.95 + Math.random() * 0.1)));
    const outflowRate = Math.max(5, Math.round(inflowRate * (0.92 + Math.random() * 0.15)));

    // Forecast projection follows realistic curve: rise toward peak at +30m, then ease, capped by capacity
    const peak = Math.min(st.isInterchange ? 94 : 90, Math.max(smoothedPct + 5, Math.round(smoothedPct * 1.14)));
    const f15 = Math.min(90, Math.round(smoothedPct + (peak - smoothedPct) * 0.62));
    const f30 = Math.min(94, peak);
    const f60 = Math.max(28, Math.round(peak * 0.74));

    return {
      ...st,
      crowdPercentage: smoothedPct,
      crowdLevel: computeCrowdLevel(smoothedPct),
      passengerVolume,
      inflowRate,
      outflowRate,
      forecast: {
        minute15: f15,
        minute30: f30,
        minute60: f60,
      },
    };
  });

  // 2. Update Trains
  const updatedTrains = prevTrains.map((tr) => {
    const line = lineMap.get(tr.lineId);
    if (!line) return tr;

    const stationList = line.stationIds;
    const currentIdx = stationList.indexOf(tr.currentStationId);
    const nextIdx = stationList.indexOf(tr.nextStationId);

    // If train is held by operator
    if (tr.isHeld || tr.status === 'holding') {
      return {
        ...tr,
        status: 'holding' as const,
        speedKmh: 0,
      };
    }

    // Advance train progress
    const progressSpeed = 0.065 * (timeStepSeconds / 3);
    let newProgress = tr.progressBetweenStations + progressSpeed;
    let newStatus = tr.status;
    let newCurrentStation = tr.currentStationId;
    let newNextStation = tr.nextStationId;
    let newDirection = tr.direction;
    let newSpeed = line.operatingSpeedKmh + (Math.random() - 0.5) * 6;

    if (newProgress >= 1.0) {
      // Arrived at next station
      newProgress = 0.0;
      newCurrentStation = tr.nextStationId;
      newStatus = 'boarding';
      newSpeed = 0;

      // Determine next station
      const currIdxInList = stationList.indexOf(newCurrentStation);
      if (newDirection === 'forward') {
        if (currIdxInList >= stationList.length - 1) {
          newDirection = 'reverse';
          newNextStation = stationList[stationList.length - 2];
        } else {
          newNextStation = stationList[currIdxInList + 1];
        }
      } else {
        if (currIdxInList <= 0) {
          newDirection = 'forward';
          newNextStation = stationList[1];
        } else {
          newNextStation = stationList[currIdxInList - 1];
        }
      }
    } else if (newProgress > 0.8) {
      newStatus = 'approaching';
      newSpeed = Math.round(line.operatingSpeedKmh * 0.4);
    } else {
      newStatus = 'in_transit';
    }

    // Interpolate GPS coordinates and SVG schematic coordinates between currentStation and nextStation
    const stA = stationMap.get(newCurrentStation);
    const stB = stationMap.get(newNextStation);
    let lat = tr.lat;
    let lng = tr.lng;
    let x = tr.x ?? 500;
    let y = tr.y ?? 310;

    if (stA && stB) {
      if (stA.lat !== undefined && stB.lat !== undefined) {
        lat = stA.lat + (stB.lat - stA.lat) * newProgress;
      }
      if (stA.lng !== undefined && stB.lng !== undefined) {
        lng = stA.lng + (stB.lng - stA.lng) * newProgress;
      }
      x = Math.round(stA.x + (stB.x - stA.x) * newProgress);
      y = Math.round(stA.y + (stB.y - stA.y) * newProgress);
    }

    // Fluctuate load percentage slightly based on current station crowd
    const stationCrowd = stA?.crowdPercentage || 50;
    const newLoad = Math.min(98, Math.max(15, Math.round(tr.loadPercentage * 0.9 + stationCrowd * 0.1 + (Math.random() - 0.5) * 3)));

    return {
      ...tr,
      progressBetweenStations: newProgress,
      status: newStatus,
      currentStationId: newCurrentStation,
      nextStationId: newNextStation,
      direction: newDirection,
      speedKmh: Math.max(0, Math.round(newSpeed)),
      lat,
      lng,
      x,
      y,
      loadPercentage: newLoad,
    };
  });

  // 3. Update Assets & Degrade Slowly
  let currentWorkOrders = [...prevWorkOrders];
  const updatedAssets = prevAssets.map((ast) => {
    // Natural slight wear & tear
    const hoursIncr = (timeStepSeconds / 3600) * 1.5;
    const cyclesIncr = Math.floor(Math.random() * 4) + 1;
    
    // Check if asset is under active work order repair
    const activeWo = currentWorkOrders.find(
      (wo) => wo.assetId === ast.id && (wo.status === 'In Progress' || wo.status === 'Assigned')
    );

    let newHealth = ast.healthScore;
    let newTemp = ast.temperatureCelsius;
    let newVibe = ast.vibrationMmS;

    if (activeWo && activeWo.status === 'In Progress') {
      // Crew is working: slight health improvement or stabilized
      newHealth = Math.min(98, ast.healthScore + 0.15);
      newTemp = Math.max(32, ast.temperatureCelsius - 0.2);
      newVibe = Math.max(1.0, ast.vibrationMmS - 0.05);
    } else {
      // Normal wear: 20% chance of small degradation
      if (Math.random() < 0.2) {
        newHealth = Math.max(15, Number((ast.healthScore - (Math.random() * 0.3)).toFixed(1)));
      }
      newTemp = Number((ast.temperatureCelsius + (Math.random() - 0.5) * 0.4).toFixed(1));
      newVibe = Number((ast.vibrationMmS + (Math.random() - 0.5) * 0.08).toFixed(2));
    }

    // Failure risk evaluation
    let failureRisk: Asset['failureRisk'] = 'low';
    if (newHealth < 40) failureRisk = 'critical';
    else if (newHealth < 60) failureRisk = 'high';
    else if (newHealth < 75) failureRisk = 'medium';

    // Auto-create Work Order if health drops below 60 and no open work order exists
    let woId = ast.workOrderId;
    if (newHealth < 60 && !currentWorkOrders.some((wo) => wo.assetId === ast.id && wo.status !== 'Done')) {
      const generatedWoId = `WO-${Math.floor(8000 + Math.random() * 1999)}`;
      woId = generatedWoId;

      const stationName = stationMap.get(ast.stationId)?.name || 'Central Facility';
      const simTimeStr = simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newWo: WorkOrder = {
        id: generatedWoId,
        assetId: ast.id,
        assetName: ast.name,
        stationName,
        assetType: ast.type,
        status: 'Open',
        priority: newHealth < 45 ? 'critical' : 'high',
        assignedCrew: undefined,
        createdAt: simTimeStr,
        updatedAt: simTimeStr,
        notes: `System auto-generated: asset health dropped to ${newHealth}%. Telemetry flagged ${newTemp}°C / ${newVibe} mm/s.`,
      };

      currentWorkOrders.unshift(newWo);
      newWorkOrdersGenerated.push(newWo);

      // Create alert
      const newAlert: Alert = {
        id: `ALT-${Date.now()}-${Math.floor(Math.random() * 100)}`,
        title: `Auto Work Order ${generatedWoId}`,
        message: `${ast.name} health degraded to ${newHealth}%. Automatic work order dispatched to maintenance queue.`,
        severity: newHealth < 45 ? 'critical' : 'warning',
        timestamp: simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        acknowledged: false,
        stationId: ast.stationId,
        assetId: ast.id,
      };
      newAlertsGenerated.push(newAlert);
    }

    // Update sparkline with newest reading every few cycles
    const newSparkline = [...ast.historySparkline];
    if (Math.random() < 0.25) {
      newSparkline.shift();
      newSparkline.push(Math.round(newHealth));
    }

    return {
      ...ast,
      healthScore: newHealth,
      failureRisk,
      operatingHours: Number((ast.operatingHours + hoursIncr).toFixed(1)),
      cyclesCount: ast.cyclesCount + cyclesIncr,
      temperatureCelsius: newTemp,
      vibrationMmS: newVibe,
      workOrderId: woId,
      historySparkline: newSparkline,
    };
  });

  // 4. Combine alerts
  const updatedAlerts = [...newAlertsGenerated, ...prevAlerts].slice(0, 30);

  // 5. Compute Network KPIs
  const healthyAssetsCount = updatedAssets.filter((a) => a.healthScore >= 60).length;
  const assetAvailabilityPercentage = Number(
    ((healthyAssetsCount / Math.max(1, updatedAssets.length)) * 100).toFixed(1)
  );

  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const delayedTrains = updatedTrains.filter((t) => t.status === 'delayed' || t.status === 'holding');
  
  // Base on-time strictly between 92% and 99%
  const onTimePerformance = Number(
    Math.min(99.0, Math.max(92.0, 98.7 - delayedTrains.length * 1.3 - activeIncidents.length * 1.5)).toFixed(1)
  );

  const activeAlertsCount = updatedAlerts.filter((a) => !a.acknowledged).length;
  // Single source of truth for critical alerts: strictly matches active critical incidents
  const criticalAlertsCount = incidents.filter((i) => i.status !== 'resolved' && i.severity === 'critical').length;

  const kpis: NetworkKpis = {
    onTimePerformance,
    onTimeTrend: Number((Math.random() * 0.4 - 0.2).toFixed(1)),
    avgHeadwayMinutes: Number((3.2 + activeIncidents.length * 0.4).toFixed(1)),
    headwayTrend: activeIncidents.length > 0 ? +0.2 : -0.1,
    passengersPerHour,
    paxTrend: Number(((diurnal - 1) * 10 + (Math.random() * 2 - 1)).toFixed(1)),
    activeAlertsCount,
    criticalAlertsCount,
    assetAvailabilityPercentage,
    availabilityTrend: Number((Math.random() * 0.2 - 0.1).toFixed(1)),
  };

  return {
    stations: updatedStations,
    trains: updatedTrains,
    assets: updatedAssets,
    workOrders: currentWorkOrders,
    alerts: updatedAlerts,
    kpis,
    newAlertsGenerated,
    newWorkOrdersGenerated,
  };
}
