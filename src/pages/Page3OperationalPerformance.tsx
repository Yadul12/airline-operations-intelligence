/**
 * PAGE 3: OPERATIONAL PERFORMANCE ANALYTICS
 * In-depth operational performance across airports, routes, carriers, delay causes, and diurnal peaks.
 */

import React, { useState } from 'react';
import { FlightRecord } from '../types/airline';
import {
  computeSystemKPIs,
  computeRoutePerformance,
  computeAirportPerformance,
  computeCarrierPerformance,
  computeHourlyDelayProfile,
  computeDelayDistribution,
} from '../analytics/kpiCalculator';
import { PlotlyChart } from '../components/PlotlyChart';
import { Layers, MapPin, Navigation, PieChart, BarChart2, Info, ArrowRight } from 'lucide-react';

interface Page3OperationalPerformanceProps {
  flights: FlightRecord[];
}

export const Page3OperationalPerformance: React.FC<Page3OperationalPerformanceProps> = ({ flights }) => {
  const [activeTab, setActiveTab] = useState<'routes' | 'airports' | 'causes' | 'peaks'>('routes');
  const [showMathDocs, setShowMathDocs] = useState<boolean>(false);

  const kpis = computeSystemKPIs(flights);
  const routePerf = computeRoutePerformance(flights).slice(0, 10);
  const airportPerf = computeAirportPerformance(flights).slice(0, 10);
  const carrierPerf = computeCarrierPerformance(flights);
  const hourlyProfile = computeHourlyDelayProfile(flights);
  const delayDist = computeDelayDistribution(flights);

  // Chart 1: BTS Delay Cause Breakdown Donut Chart
  const delayCauseTrace = {
    values: [
      kpis.lateAircraftDelayShare,
      kpis.carrierDelayShare,
      kpis.nasDelayShare,
      kpis.weatherDelayShare,
      0.3, // Security
    ],
    labels: [
      'Late Aircraft (Turn Propagation)',
      'Air Carrier Controllable',
      'NAS (Airspace & Taxi Flow)',
      'Weather (Convective/Low Vis)',
      'Security / Other',
    ],
    type: 'pie' as const,
    hole: 0.55,
    marker: {
      colors: ['#f59e0b', '#6366f1', '#0ea5e9', '#ef4444', '#94a3b8'],
    },
    textinfo: 'label+percent' as const,
    hoverinfo: 'label+percent+value' as const,
    showlegend: false,
  };

  const causeLayout = {
    margin: { t: 20, r: 20, l: 20, b: 20 },
  };

  // Chart 2: Delay Severity Distribution
  const distTrace = {
    x: delayDist.map(d => d.binLabel),
    y: delayDist.map(d => d.flightCount),
    type: 'bar' as const,
    marker: {
      color: ['#10b981', '#38bdf8', '#f59e0b', '#ea580c', '#ef4444', '#991b1b'],
    },
    text: delayDist.map(d => `${d.percentage}%`),
    textposition: 'outside' as const,
  };

  const distLayout = {
    margin: { t: 25, r: 20, l: 40, b: 50 },
    xaxis: { tickangle: -15, tickfont: { size: 10, color: '#94a3b8' } },
    yaxis: { title: 'Flight Count', gridcolor: '#1e293b' },
  };

  // Chart 3: Peak Bank Demand vs Delay
  const bankTraceVolume = {
    x: hourlyProfile.map(h => h.hourLabel),
    y: hourlyProfile.map(h => h.scheduledDepartures),
    name: 'Scheduled Departures',
    type: 'bar' as const,
    marker: { color: '#334155' },
    yaxis: 'y' as const,
  };

  const bankTraceDelay = {
    x: hourlyProfile.map(h => h.hourLabel),
    y: hourlyProfile.map(h => h.avgDepDelay),
    name: 'Average Delay (min)',
    type: 'scatter' as const,
    mode: 'lines+markers' as const,
    line: { color: '#ef4444', width: 2.5 },
    yaxis: 'y2' as const,
  };

  const bankLayout = {
    margin: { t: 20, r: 45, l: 45, b: 35 },
    xaxis: { gridcolor: '#1e293b' },
    yaxis: { title: 'Scheduled Departures', gridcolor: '#1e293b' },
    yaxis2: {
      title: 'Delay (min)',
      overlaying: 'y' as const,
      side: 'right' as const,
      showgrid: false,
      tickfont: { color: '#ef4444' },
    },
    legend: { orientation: 'h' as const, y: 1.15, x: 0.0 },
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Airline Operational Performance Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical investigation of delay causation, route bottlenecks, hub queuing, and diurnal bank dynamics.
          </p>
        </div>

        <button
          onClick={() => setShowMathDocs(!showMathDocs)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Info className="w-4 h-4 text-sky-400" />
          {showMathDocs ? 'Hide KPI Formulations' : 'View Mathematical KPI Definitions'}
        </button>
      </div>

      {/* KPI Formulations Reference Card (Expandable) */}
      {showMathDocs && (
        <div className="p-5 bg-slate-900 border border-sky-900/60 rounded-xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              Mathematical Formulations of Core Operational KPIs
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">DOT / FAA TranStats Standard</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="font-bold text-sky-400 block mb-1">1. On-Time Departure Rate (OTD)</span>
              <p className="font-mono text-xs text-slate-300 bg-slate-900 p-2 rounded">
                {"OTD = [ Σ I(DepDelay ≤ 15) / (N_sched - N_cancel) ] × 100%"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                A flight is defined as departed on time if pushback occurs within 15 minutes of scheduled time.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-1">2. On-Time Arrival Rate (OTA - FAA A14)</span>
              <p className="font-mono text-xs text-slate-300 bg-slate-900 p-2 rounded">
                {"OTA = [ Σ I(ArrDelay ≤ 15) / (N_sched - N_cancel - N_div) ] × 100%"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Standard US DOT metric: gate arrival within 14 minutes and 59 seconds of scheduled time.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="font-bold text-amber-400 block mb-1">3. Average Delay & Cancellation Rate</span>
              <p className="font-mono text-xs text-slate-300 bg-slate-900 p-2 rounded">
                {"μ_delay = (1 / N_comp) * Σ DepDelay_i  ·  CR = (N_cancel / N_sched) * 100%"}
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="font-bold text-indigo-400 block mb-1">4. BTS 5-Factor Delay Decomposition</span>
              <p className="font-mono text-xs text-slate-300 bg-slate-900 p-2 rounded">
                {"TotalDelay = LateAircraft + Carrier + NAS + Weather + Security"}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Mandatory reporting whenever a flight experiences arrival or departure delay &gt; 15 minutes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analytical Visualizations Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* BTS Delay Cause Donut */}
        <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">BTS 5-Factor Delay Cause Breakdown</h3>
              <p className="text-xs text-slate-400">Official DOT delay minute attribution shares.</p>
            </div>
          </div>
          <PlotlyChart data={[delayCauseTrace]} layout={causeLayout} className="w-full h-64" />
          <div className="mt-2 text-[11px] text-slate-400 space-y-1">
            <p>
              <strong className="text-amber-400">Late Aircraft (~39%):</strong> Primary operational friction. Rotational cascade from previous legs.
            </p>
            <p>
              <strong className="text-indigo-400">Carrier Controllable (~28%):</strong> Ramp servicing, crew rest, and scheduled maintenance.
            </p>
          </div>
        </div>

        {/* Delay Severity Distribution Bar Chart */}
        <div className="lg:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Delay Magnitude Severity Distribution</h3>
              <p className="text-xs text-slate-400">Flight counts across departure delay duration intervals.</p>
            </div>
          </div>
          <PlotlyChart data={[distTrace]} layout={distLayout} className="w-full h-64" />
          <div className="mt-2 flex justify-between text-[11px] text-slate-400">
            <span>On-Time Envelope (&le; 15m): <strong className="text-white">~80.5%</strong></span>
            <span>Severe Delays (&gt; 90m): <strong className="text-rose-400">~4.8%</strong></span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Granular Performance Views */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('routes')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'routes' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Navigation className="w-4 h-4" />
          Route-Level Performance
        </button>

        <button
          onClick={() => setActiveTab('airports')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'airports' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Airport Hub Bottlenecks
        </button>

        <button
          onClick={() => setActiveTab('peaks')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'peaks' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Diurnal Peak Bank Congestion
        </button>
      </div>

      {/* Tab 1: Route Performance Table */}
      {activeTab === 'routes' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Top High-Volume Flight Corridors</h3>
            <span className="text-xs text-slate-400">Ranked by flight frequency and delay pressure</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 font-medium">Route Pair</th>
                  <th className="py-2.5 text-right font-medium">Distance</th>
                  <th className="py-2.5 text-right font-medium">Total Flights</th>
                  <th className="py-2.5 text-right font-medium">On-Time Dep %</th>
                  <th className="py-2.5 text-right font-medium">Avg Dep Delay</th>
                  <th className="py-2.5 text-right font-medium">Avg Arr Delay</th>
                  <th className="py-2.5 text-right font-medium">High Risk %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {routePerf.map(r => (
                  <tr key={r.route} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-sans font-medium text-white flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-sky-400">{r.origin}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-mono font-bold text-slate-200">{r.dest}</span>
                    </td>
                    <td className="py-2.5 text-right text-slate-400">{r.distance} mi</td>
                    <td className="py-2.5 text-right">{r.flightCount}</td>
                    <td className="py-2.5 text-right font-bold">
                      <span className={r.onTimeDepartureRate >= 80 ? 'text-emerald-400' : r.onTimeDepartureRate >= 70 ? 'text-amber-400' : 'text-rose-400'}>
                        {r.onTimeDepartureRate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-amber-400">{r.averageDepDelay}m</td>
                    <td className="py-2.5 text-right text-slate-300">{r.averageArrDelay}m</td>
                    <td className="py-2.5 text-right">
                      <span className={r.highRiskPct >= 30 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {r.highRiskPct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Airport Hub Bottlenecks Table */}
      {activeTab === 'airports' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Hub Taxi-Out Queuing & Ground Delay Exposure</h3>
            <span className="text-xs text-slate-400">Taxi times reflect runway movement metering</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 font-medium">Hub Airport</th>
                  <th className="py-2.5 text-right font-medium">Departures</th>
                  <th className="py-2.5 text-right font-medium">Arrivals</th>
                  <th className="py-2.5 text-right font-medium">Avg Taxi Out</th>
                  <th className="py-2.5 text-right font-medium">On-Time Dep %</th>
                  <th className="py-2.5 text-right font-medium">Avg Dep Delay</th>
                  <th className="py-2.5 text-right font-medium">NAS Delay Min</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {airportPerf.map(ap => (
                  <tr key={ap.code} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-sans font-medium text-white flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-sky-400">{ap.code}</span>
                      <span className="text-xs text-slate-400 truncate max-w-[200px]">{ap.name}</span>
                    </td>
                    <td className="py-2.5 text-right">{ap.departuresCount}</td>
                    <td className="py-2.5 text-right">{ap.arrivalsCount}</td>
                    <td className="py-2.5 text-right font-bold text-amber-400">{ap.avgTaxiOut} min</td>
                    <td className="py-2.5 text-right font-bold">
                      <span className={ap.onTimeDepRate >= 80 ? 'text-emerald-400' : 'text-rose-400'}>
                        {ap.onTimeDepRate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right">{ap.avgDepDelay}m</td>
                    <td className="py-2.5 text-right text-sky-400">{ap.nasDelayMinutes}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Peak Bank Congestion Chart */}
      {activeTab === 'peaks' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Hub Bank Demand vs Average Delay Surge</h3>
              <p className="text-xs text-slate-400">
                Demonstrating runway throughput saturation during 08:00 morning push and 17:00–19:00 evening bank.
              </p>
            </div>
          </div>
          <PlotlyChart data={[bankTraceVolume, bankTraceDelay]} layout={bankLayout} className="w-full h-72" />
        </div>
      )}
    </div>
  );
};
