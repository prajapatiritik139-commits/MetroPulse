/**
 * Shared MetroPulse Number and Metric Formatters
 * Enforces unified formatting across all control room screens:
 * - Health scores: whole numbers (e.g., "62%")
 * - Temperature: 1 decimal place (e.g., "47.2°C")
 * - Vibration: 2 decimal places (e.g., "2.05 mm/s")
 * - Cycles: thousands with 'k' (e.g., "311k")
 * - Headway: 1 decimal place (e.g., "3.4 min")
 * - Speed: whole number (e.g., "64 km/h")
 * - Passenger volumes: whole numbers with locale separator (e.g., "18,450")
 * - Currency/Fares: INR format (e.g., "₹25")
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

export const formatFare = (val: number): string => {
  return `₹${Math.round(val)}`;
};

export const formatSimClock = (date: Date): string => {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
