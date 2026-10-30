/**
 * Airline Operations Intelligence - Domain Types
 * Bureau of Transportation Statistics (BTS) On-Time Performance Schema
 */

export type RiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk';

export type DelayCause = 
  | 'Carrier' 
  | 'Weather' 
  | 'National Aviation System (NAS)' 
  | 'Security' 
  | 'Late Aircraft';

export interface Airport {
  code: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lon: number;
  hubType: 'Large Hub' | 'Medium Hub' | 'Small Hub';
  runways: number;
  averageTaxiOutMinutes: number;
  hourlyCapacity: number;
}

export interface Airline {
  code: string;
  name: string;
  fleetSize: number;
  headquarters: string;
  marketSharePct: number;
}

export interface FlightRecord {
  id: string;
  flightNumber: string;
  carrierCode: string;
  carrierName: string;
  origin: string;
  originName: string;
  originCity: string;
  dest: string;
  destName: string;
  destCity: string;
  flightDate: string; // YYYY-MM-DD
  crsDepTime: string; // HH:MM
  crsDepHour: number; // 0-23
  crsArrTime: string; // HH:MM
  crsArrHour: number;
  crsElapsedTime: number; // minutes
  distance: number; // miles
  dayOfWeek: number; // 1 (Mon) - 7 (Sun)
  month: number; // 1 - 12
  
  // Pre-departure engineered predictive features (Zero Target Leakage)
  originCongestionIndex: number; // 0.0 - 1.0 (departures scheduled in same hour window)
  destCongestionIndex: number;   // 0.0 - 1.0 (arrivals scheduled in destination window)
  historicalCarrierDelayRate: number; // historical prior (out-of-sample)
  historicalRouteDelayRate: number;   // historical prior (out-of-sample)
  scheduledTurnaroundBuffer: number;  // minutes buffer from previous inbound leg
  originPeakBank: boolean;            // true if in peak hub departure bank (07:00-09:00 or 16:30-19:30)
  inboundLegDelayRisk: number;        // probability factor derived from prior network chain
  weatherSeverityIndex: number;       // pre-flight METAR/TAF convective/wind risk (0.0 - 1.0)

  // Observed historical ground-truth outcomes
  depDelay: number; // actual departure delay in minutes (-15 to 300)
  arrDelay: number; // actual arrival delay in minutes
  depDelay15: 0 | 1; // Target variable: 1 if depDelay > 15 min, else 0
  arrDelay15: 0 | 1; // 1 if arrDelay > 15 min, else 0
  cancelled: 0 | 1;
  cancellationCode?: string;
  diverted: 0 | 1;
  actualElapsedTime?: number;
  taxiOutMinutes: number;
  taxiInMinutes: number;

  // BTS Cause Breakdown (only observed when depDelay > 15)
  carrierDelay: number;
  weatherDelay: number;
  nasDelay: number;
  securityDelay: number;
  lateAircraftDelay: number;

  // Model Inferences
  predictedDelayProb: number; // 0.00 - 1.00
  predictedClass: 0 | 1;
  riskLevel: RiskLevel;
  shapValues?: Record<string, number>;
  baseValue?: number;

  // Data classification tag
  dataType: 'Observed BTS Data' | 'Derived Analytical Variable' | 'Simulated Demonstration';
}

export interface ModelMetric {
  modelName: string;
  algorithmFamily: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  prAuc: number;
  brierScore: number;
  trainingTimeSec: number;
  inferenceLatencyMs: number;
  hyperparameters: Record<string, string | number>;
  strengths: string;
  weaknesses: string;
  recommendedForProduction: boolean;
}

export interface ShapFeatureContribution {
  feature: string;
  displayName: string;
  featureValue: string | number;
  shapValue: number; // contribution to log-odds or probability
  isPositive: boolean; // increases delay risk vs decreases
}

export interface OperationalKPIs {
  totalFlights: number;
  onTimeDepartureRate: number; // DepDelay <= 15
  onTimeArrivalRate: number;   // ArrDelay <= 15
  averageDepDelay: number;
  averageArrDelay: number;
  cancellationRate: number;
  diversionRate: number;
  delayedFlightsCount: number;
  highRiskFlightsCount: number;
  highRiskPercentage: number;
  carrierDelayShare: number;
  weatherDelayShare: number;
  nasDelayShare: number;
  lateAircraftDelayShare: number;
}

export interface OperationalException {
  id: string;
  severity: 'Critical' | 'Warning' | 'Advisory';
  category: 'Turnaround Cascade' | 'Hub Congestion' | 'Weather Ground Stop' | 'Late Aircraft Propagation' | 'Route Degradation';
  title: string;
  flightNumber: string;
  carrier: string;
  route: string;
  scheduledDep: string;
  delayProbability: number;
  rootCauseAttribution: string;
  recommendedAction: string;
  estimatedCostAvoidance: string;
}
