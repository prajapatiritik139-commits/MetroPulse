import React from 'react';
import { useMetroStore } from '../../store/metroStore';
import { MetricCard } from '../common/MetricCard';
import {
  Clock,
  Timer,
  Users,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import {
  formatPassengers,
  formatHeadway,
  formatHealthScore,
  formatPercentage,
} from '../../utils/formatters';

export const KpiStrip: React.FC = () => {
  const kpis = useMetroStore((state) => state.kpis);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. On-Time Performance */}
      <MetricCard
        title="On-Time Performance"
        value={formatPercentage(kpis.onTimePerformance, 1).replace('%', '')}
        unit="%"
        trend={Number(kpis.onTimeTrend.toFixed(1))}
        trendLabel="vs target (98.0%)"
        icon={Clock}
        iconColor="text-emerald-600 dark:text-emerald-400"
      />

      {/* 2. Avg Headway */}
      <MetricCard
        title="Avg Headway"
        value={Number(kpis.avgHeadwayMinutes.toFixed(1))}
        unit="min"
        trend={Number(kpis.headwayTrend.toFixed(1))}
        trendLabel="spacing"
        inverseTrend={true}
        icon={Timer}
        iconColor="text-teal-600 dark:text-teal-400"
      />

      {/* 3. Passengers / Hour */}
      <MetricCard
        title="Passengers / Hour"
        value={formatPassengers(kpis.passengersPerHour)}
        unit="pax"
        trend={Number(kpis.paxTrend.toFixed(1))}
        trendLabel="scaled diurnal"
        icon={Users}
        iconColor="text-blue-600 dark:text-blue-400"
      />

      {/* 4. Active Alerts */}
      <MetricCard
        title="Active Alerts"
        value={Math.round(kpis.activeAlertsCount)}
        subtext={`${kpis.criticalAlertsCount} critical active`}
        icon={AlertTriangle}
        iconColor={kpis.criticalAlertsCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}
        isCriticalAlert={kpis.criticalAlertsCount > 0}
      />

      {/* 5. Asset Availability */}
      <MetricCard
        title="Asset Fleet Health"
        value={Math.round(kpis.assetAvailabilityPercentage)}
        unit="%"
        trend={Number(kpis.availabilityTrend.toFixed(1))}
        trendLabel="fleet uptime"
        icon={CheckCircle}
        iconColor="text-teal-600 dark:text-teal-400"
      />
    </div>
  );
};
