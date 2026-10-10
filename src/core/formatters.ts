/**
 * Core MetroPulse Number and Metric Formatters
 */

export const formatHealthScore = (val: number): string => {
  return `${Math.round(val)}%`;
};

export const formatTemperature = (val: number): string => {
  return `${Number(val).toFixed(1)}°C`;
};

export const formatVibration = (val: number): string => {
  return `${Number(val).toFixed(2)} mm/s`;
};

export const formatCycles = (cycles: number): string => {
  if (cycles >= 1000) {
    return `${Math.round(cycles / 1000)}k`;
  }
  return `${Math.round(cycles)}`;
};

export const formatOperatingHours = (hours: number): string => {
  return `${Math.round(hours).toLocaleString()}h`;
};

export const formatPassengers = (pax: number): string => {
  return Math.round(pax).toLocaleString();
};

export const formatHeadway = (val: number): string => {
  return `${Number(val).toFixed(1)} min`;
};

export const formatSpeed = (val: number): string => {
  return `${Math.round(val)} km/h`;
};

export const formatPercentage = (val: number, decimals: number = 0): string => {
  if (decimals === 0) {
    return `${Math.round(val)}%`;
  }
  return `${Number(val).toFixed(decimals)}%`;
};

export const formatMinutes = (mins: number): string => {
  return `${Math.round(mins)} min`;
};

export const formatFare = (val: number): string => {
  return `₹${Math.round(val)}`;
};
