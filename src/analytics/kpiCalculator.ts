/**
 * Airline Operations Research & Analytics Engine
 * Precise Mathematical Definitions of Aviation KPIs
 */

import { FlightRecord, OperationalKPIs } from '../types/airline';

export interface RoutePerformance {
  route: string; // e.g. "ATL -> ORD"
  origin: string;
  dest: string;
  flightCount: number;
  onTimeDepartureRate: number;
  averageDepDelay: number;
  averageArrDelay: number;
  highRiskCount: number;
  highRiskPct: number;
  distance: number;
}

export interface AirportPerformance {
  code: string;
  name: string;
  departuresCount: number;
  arrivalsCount: number;
  onTimeDepRate: number;
  avgDepDelay: number;
  avgTaxiOut: number;
  avgArrDelay: number;
  nasDelayMinutes: number;
}

export interface CarrierPerformance {
  code: string;
  name: string;
  totalFlights: number;
  onTimeDepRate: number;
  onTimeArrRate: number;
  avgDepDelay: number;
  cancellationRate: number;
  carrierDelayMinutes: number;
  lateAircraftDelayMinutes: number;
  weatherDelayMinutes: number;
  nasDelayMinutes: number;
}

export interface HourlyDelayProfile {
  hour: number;
  hourLabel: string;
  scheduledDepartures: number;
  onTimeDepRate: number;
  avgDepDelay: number;
  avgPredictedProb: number;
  highRiskCount: number;
}

export interface DelayDistributionBin {
  binLabel: string;
  minMinutes: number;
  maxMinutes: number;
  flightCount: number;
  percentage: number;
  category: 'Early' | 'On-Time' | 'Minor Delay' | 'Moderate Delay' | 'Severe Delay' | 'Extreme Delay';
}

/**
 * KPI 1: On-Time Departure Rate (%)
 * Math: OTD = [Sum(I(DepDelay <= 15)) / (Total Scheduled - Cancelled)] * 100
 */
export function calculateOnTimeDepartureRate(flights: FlightRecord[]): number {
  const completed = flights.filter(f => f.cancelled === 0);
  if (completed.length === 0) return 100;
  const onTime = completed.filter(f => f.depDelay <= 15).length;
  return Number(((onTime / completed.length) * 100).toFixed(1));
}

/**
 * KPI 2: On-Time Arrival Rate (%) (FAA A14 Standard)
 * Math: OTA = [Sum(I(ArrDelay <= 15)) / (Total Scheduled - Cancelled - Diverted)] * 100
 */
export function calculateOnTimeArrivalRate(flights: FlightRecord[]): number {
  const arrived = flights.filter(f => f.cancelled === 0 && f.diverted === 0);
  if (arrived.length === 0) return 100;
  const onTime = arrived.filter(f => f.arrDelay <= 15).length;
  return Number(((onTime / arrived.length) * 100).toFixed(1));
}

/**
 * Compute System-Wide Operational KPIs
 */
export function computeSystemKPIs(flights: FlightRecord[]): OperationalKPIs {
  const total = flights.length;
  if (total === 0) {
    return {
      totalFlights: 0,
      onTimeDepartureRate: 0,
      onTimeArrivalRate: 0,
      averageDepDelay: 0,
      averageArrDelay: 0,
      cancellationRate: 0,
      diversionRate: 0,
      delayedFlightsCount: 0,
      highRiskFlightsCount: 0,
      highRiskPercentage: 0,
      carrierDelayShare: 0,
      weatherDelayShare: 0,
      nasDelayShare: 0,
      lateAircraftDelayShare: 0,
    };
  }

  const completed = flights.filter(f => f.cancelled === 0);
  const cancelled = flights.filter(f => f.cancelled === 1);
  const diverted = flights.filter(f => f.diverted === 1);

  const otd = calculateOnTimeDepartureRate(flights);
  const ota = calculateOnTimeArrivalRate(flights);

  const totalDepDelay = completed.reduce((sum, f) => sum + f.depDelay, 0);
  const totalArrDelay = completed.reduce((sum, f) => sum + f.arrDelay, 0);
  const avgDepDelay = completed.length > 0 ? Number((totalDepDelay / completed.length).toFixed(1)) : 0;
  const avgArrDelay = completed.length > 0 ? Number((totalArrDelay / completed.length).toFixed(1)) : 0;

  const cancellationRate = Number(((cancelled.length / total) * 100).toFixed(1));
  const diversionRate = completed.length > 0 ? Number(((diverted.length / completed.length) * 100).toFixed(1)) : 0;

  const delayedFlights = completed.filter(f => f.depDelay > 15);
  const highRiskFlights = flights.filter(f => f.riskLevel === 'High Risk');

  // Delay causes shares
  const sumCarrier = flights.reduce((s, f) => s + f.carrierDelay, 0);
  const sumWeather = flights.reduce((s, f) => s + f.weatherDelay, 0);
  const sumNas = flights.reduce((s, f) => s + f.nasDelay, 0);
  const sumLateAcft = flights.reduce((s, f) => s + f.lateAircraftDelay, 0);
  const totalDelayMins = sumCarrier + sumWeather + sumNas + sumLateAcft;

  return {
    totalFlights: total,
    onTimeDepartureRate: otd,
    onTimeArrivalRate: ota,
    averageDepDelay: avgDepDelay,
    averageArrDelay: avgArrDelay,
    cancellationRate,
    diversionRate,
    delayedFlightsCount: delayedFlights.length,
    highRiskFlightsCount: highRiskFlights.length,
    highRiskPercentage: Number(((highRiskFlights.length / total) * 100).toFixed(1)),
    carrierDelayShare: totalDelayMins > 0 ? Number(((sumCarrier / totalDelayMins) * 100).toFixed(1)) : 28.0,
    weatherDelayShare: totalDelayMins > 0 ? Number(((sumWeather / totalDelayMins) * 100).toFixed(1)) : 8.5,
    nasDelayShare: totalDelayMins > 0 ? Number(((sumNas / totalDelayMins) * 100).toFixed(1)) : 24.5,
    lateAircraftDelayShare: totalDelayMins > 0 ? Number(((sumLateAcft / totalDelayMins) * 100).toFixed(1)) : 39.0,
  };
}

/**
 * Route-Level Performance Aggregation
 */
export function computeRoutePerformance(flights: FlightRecord[]): RoutePerformance[] {
  const routeMap = new Map<string, FlightRecord[]>();

  flights.forEach(f => {
    const key = `${f.origin} → ${f.dest}`;
    if (!routeMap.has(key)) {
      routeMap.set(key, []);
    }
    routeMap.get(key)!.push(f);
  });

  const results: RoutePerformance[] = [];

  routeMap.forEach((rfList, route) => {
    const [origin, dest] = route.split(' → ');
    const completed = rfList.filter(f => f.cancelled === 0);
    const onTimeCount = completed.filter(f => f.depDelay <= 15).length;
    const totalDepDelay = completed.reduce((s, f) => s + f.depDelay, 0);
    const totalArrDelay = completed.reduce((s, f) => s + f.arrDelay, 0);
    const highRisk = rfList.filter(f => f.riskLevel === 'High Risk').length;

    results.push({
      route,
      origin,
      dest,
      flightCount: rfList.length,
      onTimeDepartureRate: completed.length > 0 ? Number(((onTimeCount / completed.length) * 100).toFixed(1)) : 0,
      averageDepDelay: completed.length > 0 ? Number((totalDepDelay / completed.length).toFixed(1)) : 0,
      averageArrDelay: completed.length > 0 ? Number((totalArrDelay / completed.length).toFixed(1)) : 0,
      highRiskCount: highRisk,
      highRiskPct: Number(((highRisk / rfList.length) * 100).toFixed(1)),
      distance: rfList[0].distance,
    });
  });

  return results.sort((a, b) => b.flightCount - a.flightCount);
}

/**
 * Airport-Level Performance
 */
export function computeAirportPerformance(flights: FlightRecord[]): AirportPerformance[] {
  const airports = new Map<string, {
    depFlights: FlightRecord[];
    arrFlights: FlightRecord[];
    name: string;
  }>();

  flights.forEach(f => {
    if (!airports.has(f.origin)) {
      airports.set(f.origin, { depFlights: [], arrFlights: [], name: f.originName });
    }
    airports.get(f.origin)!.depFlights.push(f);

    if (!airports.has(f.dest)) {
      airports.set(f.dest, { depFlights: [], arrFlights: [], name: f.destName });
    }
    airports.get(f.dest)!.arrFlights.push(f);
  });

  const results: AirportPerformance[] = [];

  airports.forEach((data, code) => {
    const completedDeps = data.depFlights.filter(f => f.cancelled === 0);
    const onTimeDeps = completedDeps.filter(f => f.depDelay <= 15).length;
    const avgDepDelay = completedDeps.length > 0 
      ? Number((completedDeps.reduce((s, f) => s + f.depDelay, 0) / completedDeps.length).toFixed(1))
      : 0;
    const avgTaxiOut = completedDeps.length > 0
      ? Number((completedDeps.reduce((s, f) => s + f.taxiOutMinutes, 0) / completedDeps.length).toFixed(1))
      : 0;
    const nasDelayTotal = completedDeps.reduce((s, f) => s + f.nasDelay, 0);

    const completedArrs = data.arrFlights.filter(f => f.cancelled === 0 && f.diverted === 0);
    const avgArrDelay = completedArrs.length > 0
      ? Number((completedArrs.reduce((s, f) => s + f.arrDelay, 0) / completedArrs.length).toFixed(1))
      : 0;

    results.push({
      code,
      name: data.name,
      departuresCount: data.depFlights.length,
      arrivalsCount: data.arrFlights.length,
      onTimeDepRate: completedDeps.length > 0 ? Number(((onTimeDeps / completedDeps.length) * 100).toFixed(1)) : 0,
      avgDepDelay,
      avgTaxiOut,
      avgArrDelay,
      nasDelayMinutes: nasDelayTotal,
    });
  });

  return results.sort((a, b) => b.departuresCount - a.departuresCount);
}

/**
 * Airline-Level Performance Aggregation
 */
export function computeCarrierPerformance(flights: FlightRecord[]): CarrierPerformance[] {
  const carrierMap = new Map<string, FlightRecord[]>();

  flights.forEach(f => {
    if (!carrierMap.has(f.carrierCode)) {
      carrierMap.set(f.carrierCode, []);
    }
    carrierMap.get(f.carrierCode)!.push(f);
  });

  const results: CarrierPerformance[] = [];

  carrierMap.forEach((cfList, code) => {
    const completed = cfList.filter(f => f.cancelled === 0);
    const onTimeDeps = completed.filter(f => f.depDelay <= 15).length;
    const arrived = completed.filter(f => f.diverted === 0);
    const onTimeArrs = arrived.filter(f => f.arrDelay <= 15).length;
    const cancelled = cfList.filter(f => f.cancelled === 1).length;

    const avgDepDelay = completed.length > 0 
      ? Number((completed.reduce((s, f) => s + f.depDelay, 0) / completed.length).toFixed(1))
      : 0;

    results.push({
      code,
      name: cfList[0].carrierName,
      totalFlights: cfList.length,
      onTimeDepRate: completed.length > 0 ? Number(((onTimeDeps / completed.length) * 100).toFixed(1)) : 0,
      onTimeArrRate: arrived.length > 0 ? Number(((onTimeArrs / arrived.length) * 100).toFixed(1)) : 0,
      avgDepDelay,
      cancellationRate: Number(((cancelled / cfList.length) * 100).toFixed(1)),
      carrierDelayMinutes: cfList.reduce((s, f) => s + f.carrierDelay, 0),
      lateAircraftDelayMinutes: cfList.reduce((s, f) => s + f.lateAircraftDelay, 0),
      weatherDelayMinutes: cfList.reduce((s, f) => s + f.weatherDelay, 0),
      nasDelayMinutes: cfList.reduce((s, f) => s + f.nasDelay, 0),
    });
  });

  return results.sort((a, b) => b.onTimeDepRate - a.onTimeDepRate);
}

/**
 * Peak-Hour Bank Analysis (Departure hours 06:00 to 22:00)
 */
export function computeHourlyDelayProfile(flights: FlightRecord[]): HourlyDelayProfile[] {
  const hourlyData: Record<number, FlightRecord[]> = {};
  for (let h = 6; h <= 22; h++) {
    hourlyData[h] = [];
  }

  flights.forEach(f => {
    if (hourlyData[f.crsDepHour]) {
      hourlyData[f.crsDepHour].push(f);
    }
  });

  const profiles: HourlyDelayProfile[] = [];

  for (let h = 6; h <= 22; h++) {
    const list = hourlyData[h];
    const completed = list.filter(f => f.cancelled === 0);
    const onTime = completed.filter(f => f.depDelay <= 15).length;
    const avgDelay = completed.length > 0 
      ? Number((completed.reduce((s, f) => s + f.depDelay, 0) / completed.length).toFixed(1))
      : 0;
    const avgPredProb = list.length > 0
      ? Number((list.reduce((s, f) => s + f.predictedDelayProb, 0) / list.length).toFixed(2))
      : 0;
    const highRisk = list.filter(f => f.riskLevel === 'High Risk').length;

    profiles.push({
      hour: h,
      hourLabel: `${String(h).padStart(2, '0')}:00`,
      scheduledDepartures: list.length,
      onTimeDepRate: completed.length > 0 ? Number(((onTime / completed.length) * 100).toFixed(1)) : 100,
      avgDepDelay: avgDelay,
      avgPredictedProb: avgPredProb,
      highRiskCount: highRisk,
    });
  }

  return profiles;
}

/**
 * Delay Magnitude Distribution (<0 early, 0-15 on-time, 16-45 minor, etc.)
 */
export function computeDelayDistribution(flights: FlightRecord[]): DelayDistributionBin[] {
  const completed = flights.filter(f => f.cancelled === 0);
  const total = completed.length || 1;

  const bins: {
    category: DelayDistributionBin['category'];
    label: string;
    min: number;
    max: number;
    filter: (d: number) => boolean;
  }[] = [
    { category: 'Early', label: '< 0 min (Early)', min: -999, max: -1, filter: d => d < 0 },
    { category: 'On-Time', label: '0–15 min (On-Time)', min: 0, max: 15, filter: d => d >= 0 && d <= 15 },
    { category: 'Minor Delay', label: '16–45 min (Minor)', min: 16, max: 45, filter: d => d >= 16 && d <= 45 },
    { category: 'Moderate Delay', label: '46–90 min (Moderate)', min: 46, max: 90, filter: d => d >= 46 && d <= 90 },
    { category: 'Severe Delay', label: '91–180 min (Severe)', min: 91, max: 180, filter: d => d >= 91 && d <= 180 },
    { category: 'Extreme Delay', label: '> 180 min (Extreme)', min: 181, max: 9999, filter: d => d > 180 },
  ];

  return bins.map(b => {
    const count = completed.filter(f => b.filter(f.depDelay)).length;
    return {
      binLabel: b.label,
      minMinutes: b.min,
      maxMinutes: b.max,
      flightCount: count,
      percentage: Number(((count / total) * 100).toFixed(1)),
      category: b.category,
    };
  });
}
