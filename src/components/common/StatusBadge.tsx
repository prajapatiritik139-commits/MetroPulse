import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Clock,
  Activity,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { CrowdLevel, FailureRisk, AlertSeverity, WorkOrderStatus } from '../../types/metro';

interface StatusBadgeProps {
  type: 'crowd' | 'risk' | 'alert' | 'workOrder' | 'train';
  value: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  value,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (type === 'crowd') {
    const level = value as CrowdLevel;
    switch (level) {
      case 'low':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 ${sizeClasses} ${className}`}
            aria-label="Crowd level: Low"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            <span>Low (&lt;35%)</span>
          </span>
        );
      case 'moderate':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20 ${sizeClasses} ${className}`}
            aria-label="Crowd level: Moderate"
          >
            <Activity className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 shrink-0" aria-hidden="true" />
            <span>Moderate (36–60%)</span>
          </span>
        );
      case 'busy':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 ${sizeClasses} ${className}`}
            aria-label="Crowd level: Busy"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span>Busy (61–80%)</span>
          </span>
        );
      case 'crowded':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30 ${sizeClasses} ${className}`}
            aria-label="Crowd level: Crowded"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" aria-hidden="true" />
            <span>Crowded (81–90%)</span>
          </span>
        );
      case 'critical':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 ${sizeClasses} ${className}`}
            aria-label="Crowd level: Critical surge"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0 animate-pulse" aria-hidden="true" />
            <span>Surge (&gt;90%)</span>
          </span>
        );
    }
  }

  if (type === 'risk') {
    const risk = value as FailureRisk;
    switch (risk) {
      case 'low':
        return (
          <span
            className={`inline-flex items-center gap-1 font-medium rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 ${sizeClasses} ${className}`}
            aria-label="Failure risk: Low"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Low Risk</span>
          </span>
        );
      case 'medium':
        return (
          <span
            className={`inline-flex items-center gap-1 font-medium rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 ${sizeClasses} ${className}`}
            aria-label="Failure risk: Medium"
          >
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>Medium Risk</span>
          </span>
        );
      case 'high':
        return (
          <span
            className={`inline-flex items-center gap-1 font-medium rounded-md bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30 ${sizeClasses} ${className}`}
            aria-label="Failure risk: High"
          >
            <AlertTriangle className="w-3 h-3 text-orange-600 dark:text-orange-400" aria-hidden="true" />
            <span>High Risk</span>
          </span>
        );
      case 'critical':
        return (
          <span
            className={`inline-flex items-center gap-1 font-semibold rounded-md bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 ${sizeClasses} ${className}`}
            aria-label="Failure risk: Critical"
          >
            <AlertOctagon className="w-3 h-3 text-red-600 dark:text-red-400 animate-pulse" aria-hidden="true" />
            <span>Critical Risk</span>
          </span>
        );
    }
  }

  if (type === 'alert') {
    const sev = value as AlertSeverity;
    switch (sev) {
      case 'critical':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-md bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 ${sizeClasses} ${className}`}
            aria-label="Severity: Critical"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-red-600 dark:text-red-400 animate-pulse shrink-0" aria-hidden="true" />
            <span>Critical</span>
          </span>
        );
      case 'warning':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 ${sizeClasses} ${className}`}
            aria-label="Severity: Caution warning"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span>Warning</span>
          </span>
        );
      case 'info':
        return (
          <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 ${sizeClasses} ${className}`}
            aria-label="Severity: Informational"
          >
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
            <span>Info</span>
          </span>
        );
    }
  }

  if (type === 'workOrder') {
    const status = value as WorkOrderStatus;
    switch (status) {
      case 'Open':
        return (
          <span
            className={`inline-flex items-center gap-1 font-medium rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 ${sizeClasses} ${className}`}
            aria-label="Work order: Open"
          >
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>Open</span>
          </span>
        );
      case 'Assigned':
        return (
          <span
            className={`inline-flex items-center gap-1 font-medium rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 ${sizeClasses} ${className}`}
            aria-label="Work order: Assigned"
          >
            <UserCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>Assigned</span>
          </span>
        );
      case 'In Progress':
        return (
          <span
            className={`inline-flex items-center gap-1 font-medium rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 ${sizeClasses} ${className}`}
            aria-label="Work order: In Progress"
          >
            <Wrench className="w-3 h-3 text-teal-600 dark:text-teal-400" aria-hidden="true" />
            <span>In Progress</span>
          </span>
        );
      case 'Done':
        return (
          <span
            className={`inline-flex items-center gap-1 font-medium rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 ${sizeClasses} ${className}`}
            aria-label="Work order: Completed"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Done</span>
          </span>
        );
    }
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-md text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 ${sizeClasses}`}>
      {value}
    </span>
  );
};
