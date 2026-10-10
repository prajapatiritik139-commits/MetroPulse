import { Recommendation, Station, Incident } from './types';
import { getStationName } from '../data/stations';

export function generateRankedRecommendations(
  stations: Station[],
  incidents: Incident[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 1. Check for overcrowding at interchange or major stations
  const surgeStation = stations.find((s) => s.crowdPercentage >= 85);
  if (surgeStation) {
    recommendations.push({
      id: `rec-open-gates-${surgeStation.id}`,
      category: 'Open extra gates',
      problem: `${surgeStation.name} concourse capacity reached ${surgeStation.crowdPercentage}%.`,
      suggestion: `Switch AFC turnstiles 5–8 at ${surgeStation.name} into exit-only free-flow egress mode.`,
      impact: 'Increases platform discharge rate by +420 pax/min',
      urgency: 'high',
      targetEntityId: surgeStation.id,
      status: 'pending',
    });

    recommendations.push({
      id: `rec-hold-train-${surgeStation.id}`,
      category: 'Hold train',
      problem: `Transfer bottleneck forming between arriving Line 1 & Line 2 consists.`,
      suggestion: `Hold dwell time of Train TR-102 by 90 seconds at ${surgeStation.name}.`,
      impact: 'Reduces platform congestion surge by 18% in 3 min',
      urgency: 'high',
      targetEntityId: surgeStation.id,
      status: 'pending',
    });
  }

  // 2. Check for line imbalances or delay gaps
  recommendations.push({
    id: 'rec-short-turn-t203',
    category: 'Short-turn',
    problem: 'Southbound rush-hour headway gap exceeding 5.2 minutes on Line 2.',
    suggestion: `Short-turn Train TR-203 at ${getStationName('ST-02')} pocket siding to return south early.`,
    impact: 'Closes headway gap from 5.4m to nominal 3.2m',
    urgency: 'medium',
    targetEntityId: 'ST-02',
    status: 'pending',
  });

  // 3. Check for incident-driven disruption
  const activeIncident = incidents.find((i) => i.status !== 'resolved');
  if (activeIncident) {
    recommendations.push({
      id: `rec-feeder-bus-${activeIncident.id}`,
      category: 'Deploy buses',
      problem: `${activeIncident.title} is causing single-line congestion.`,
      suggestion: 'Dispatch 4 high-capacity electric feeder shuttle buses between affected stations.',
      impact: 'Saves an estimated 32 commuter delay minutes',
      urgency: 'high',
      targetEntityId: activeIncident.affectedStationIds[0],
      status: 'pending',
    });

    recommendations.push({
      id: `rec-signal-priority-${activeIncident.id}`,
      category: 'Signal priority',
      problem: 'Surface feeder road congestion at emergency bus transfer gate.',
      suggestion: `Trigger Green-Wave traffic signal priority on ${getStationName('ST-04')} corridor.`,
      impact: 'Cuts feeder bus transfer time by 6.5 minutes',
      urgency: 'medium',
      targetEntityId: activeIncident.affectedStationIds[0],
      status: 'pending',
    });
  }

  // Sort by urgency: high first
  const urgencyWeight: Record<'high' | 'medium' | 'low', number> = { high: 3, medium: 2, low: 1 };
  return recommendations.sort((a, b) => urgencyWeight[b.urgency] - urgencyWeight[a.urgency]);
}
