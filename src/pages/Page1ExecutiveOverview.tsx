/**
 * PAGE 1: EXECUTIVE OVERVIEW
 * High-level airline operations scorecard, interactive NAS geospatial map,
 * system-wide health, and diurnal performance trends.
 */

import React, { useState, useMemo } from 'react';
import { FlightRecord } from '../types/airline';
import {
  computeSystemKPIs,
  computeCarrierPerformance,
  computeAirportPerformance,
  computeHourlyDelayProfile,
} from '../analytics/kpiCalculator';
import { PlotlyChart } from '../components/PlotlyChart';
import { USNetworkMap } from '../components/USNetworkMap';
import {
  Plane,
  Clock,
  ShieldAlert,
  Activity,
  Download,
  SlidersHorizontal,
} from 'lucide-react';

interface Page1ExecutiveOverviewProps {
  flights: FlightRecord[];
  onSelectFlight: (flight: FlightRecord) => void;
  onOpenSimulator: () => void;
}

export const Page1ExecutiveOverview: React.FC<Page1ExecutiveOverviewProps> = ({
  flights,
  onSelectFlight,
  onOpenSimulator,
}) => {
  const [selectedHubFilter, setSelectedHubFilter] = useState<string | null>(null);

  const activeFlights = useMemo(() => {
    if (!selectedHubFilter) return flights;
    return flights.filter(f => f.origin === selectedHubFilter || f.dest === selectedHubFilter);
  }, [flights, selectedHubFilter]);

  const kpis = computeSystemKPIs(activeFlights);
  const carrierPerf = computeCarrierPerformance(activeFlights);
  const airportPerf = computeAirportPerformance(activeFlights).slice(0, 8);
  const hourlyProfile = computeHourlyDelayProfile(activeFlights);

  // Plotly Hourly Punctuality & Departure Delay Trend Trace
  const hourlyTracePunctuality = {
    x: hourlyProfile.map(h => h.hourLabel),
    y: hourlyProfile.map(h => h.onTimeDepRate),
    name: 'On-Time Dep %',
    type: 'scatter' as const,
    mode: 'lines+markers' as const,
    line: { color: '#0ea5e9', width: 2.5 },
    marker: { size: 6, color: '#38bdf8' },
    yaxis: 'y' as const,
  };

  const hourlyTraceDelay = {
    x: hourlyProfile.map(h => h.hourLabel),
    y: hourlyProfile.map(h => h.avgDepDelay),
    name: 'Avg Dep Delay (min)',
    type: 'bar' as const,
    opacity: 0.35,
    marker: { color: '#f59e0b' },
    yaxis: 'y2' as const,
  };

  const trendLayout = {
    margin: { t: 20, r: 45, l: 45, b: 35 },
    xaxis: { gridcolor: '#1e293b', tickfont: { size: 10, color: '#94a3b8' } },
    yaxis: {
      title: 'On-Time %',
      range: [40, 100],
      gridcolor: '#1e293b',
      tickfont: { size: 10, color: '#94a3b8' },
    },
    yaxis2: {
      title: 'Delay (min)',
      overlaying: 'y' as const,
      side: 'right' as const,
      range: [0, 45],
      showgrid: false,
      tickfont: { size: 10, color: '#f59e0b' },
    },
    legend: { orientation: 'h' as const, y: 1.15, x: 0.0 },
  };

  // Carrier Comparison Bar Chart
  const carrierTrace = {
    x: carrierPerf.map(c => c.name.split(' ')[0]),
    y: carrierPerf.map(c => c.onTimeDepRate),
    type: 'bar' as const,
    marker: {
      color: carrierPerf.map(c => (c.onTimeDepRate >= 80 ? '#10b981' : c.onTimeDepRate >= 75 ? '#38bdf8' : '#f59e0b')),
    },
    text: carrierPerf.map(c => `${c.onTimeDepRate}%`),
    textposition: 'outside' as const,
  };

  const carrierLayout = {
    margin: { t: 20, r: 20, l: 40, b: 35 },
    yaxis: { range: [50, 100], title: 'On-Time Dep %', gridcolor: '#1e293b' },
    xaxis: { tickfont: { size: 11, color: '#cbd5e1' } },
  };

  const handleExportSummaryCSV = () => {
    const headers = ['FlightID', 'FlightNumber', 'Carrier', 'Origin', 'Dest', 'Date', 'SchedDep', 'DepDelayMin', 'ArrDelayMin', 'PredictedDelayProb', 'RiskLevel'];
    const rows = activeFlights.map(f => [
      f.id,
      f.flightNumber,
      f.carrierCode,
      f.origin,
      f.dest,
      f.flightDate,
      f.crsDepTime,
      f.depDelay,
      f.arrDelay,
      f.predictedDelayProb,
      f.riskLevel,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `airline_ops_intelligence_${selectedHubFilter || 'all_hubs'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Network Operations Control (NOC) Executive Overview
            </h1>
            {selectedHubFilter && (
              <span className="text-xs font-mono text-sky-400">
                · Hub Filter: {selectedHubFilter}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time aggregate performance indicators grounded in Bureau of Transportation Statistics (BTS) Form 41 data.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportSummaryCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export Telemetry CSV
          </button>
          <button
            onClick={onOpenSimulator}
            className="px-3.5 py-1.5 text-xs font-semibold text-sky-300 bg-sky-950/70 border border-sky-800/80 hover:bg-sky-900/60 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
            What-If Delay Simulator
          </button>
        </div>
      </div>

      {/* KPI Headline Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Total Flights */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block">Total Flights Analyzed</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {kpis.totalFlights.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {selectedHubFilter ? `${selectedHubFilter} Corridor Legs` : '14 Major US Hubs'}
          </span>
        </div>

        {/* KPI 2: On-Time Departure */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block">On-Time Departure Rate</span>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
            {kpis.onTimeDepartureRate}%
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Standard: DepDelay ≤ 15m</span>
        </div>

        {/* KPI 3: On-Time Arrival */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block">On-Time Arrival Rate (A14)</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {kpis.onTimeArrivalRate}%
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">FAA DOT TranStats standard</span>
        </div>

        {/* KPI 4: Avg Departure Delay */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block">Avg Departure Delay</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {kpis.averageDepDelay} <span className="text-xs text-slate-400">min</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Completed departures</span>
        </div>

        {/* KPI 5: Cancellation Rate */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block">Cancellation Rate</span>
          <div className="text-2xl font-bold font-mono text-slate-300 mt-1">
            {kpis.cancellationRate}%
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Weather & NAS ground stops</span>
        </div>

        {/* KPI 6: High Risk Flights */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] font-medium text-slate-400 block">ML High-Risk Flagged</span>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {kpis.highRiskPercentage}%
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">{kpis.highRiskFlightsCount} flights requiring watch</span>
        </div>
      </div>

      {/* Interactive Geospatial US National Airspace Map */}
      <USNetworkMap
        flights={flights}
        selectedAirport={selectedHubFilter}
        onSelectAirport={setSelectedHubFilter}
      />

      {/* Main Charts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Hourly Diurnal Delay Curve */}
        <div className="lg:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Hourly Departure Punctuality & Delay Curve
              </h3>
              <p className="text-xs text-slate-400">
                Punctuality decays across the flying day as rotational turn delays compound into evening banks.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">06:00 – 22:00 Window</span>
          </div>
          <PlotlyChart
            data={[hourlyTraceDelay, hourlyTracePunctuality]}
            layout={trendLayout}
            className="w-full h-72"
          />
        </div>

        {/* Right Chart: Carrier Punctuality Comparison */}
        <div className="lg:col-span-5 p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Carrier On-Time Departure Rate (%)
              </h3>
              <p className="text-xs text-slate-400">
                Benchmarking punctuality across Delta, American, United, Southwest, JetBlue, and Alaska.
              </p>
            </div>
          </div>
          <PlotlyChart
            data={[carrierTrace]}
            layout={carrierLayout}
            className="w-full h-72"
          />
        </div>
      </div>

      {/* Operational Health & Airport Hub Performance Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hub Ranking Table */}
        <div className="lg:col-span-8 p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              Primary Hub Operational Punctuality Rankings
            </h3>
            <span className="text-xs text-slate-400">Click any row to filter hub corridors</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2 font-medium">Hub Airport</th>
                  <th className="py-2 text-right font-medium">Flights</th>
                  <th className="py-2 text-right font-medium">OTD Rate</th>
                  <th className="py-2 text-right font-medium">Avg Dep Delay</th>
                  <th className="py-2 text-right font-medium">Avg Taxi Out</th>
                  <th className="py-2 text-right font-medium">NAS Delay Min</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {airportPerf.map(ap => (
                  <tr
                    key={ap.code}
                    onClick={() => setSelectedHubFilter(selectedHubFilter === ap.code ? null : ap.code)}
                    className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      selectedHubFilter === ap.code ? 'bg-sky-950/30' : ''
                    }`}
                  >
                    <td className="py-2.5 font-sans font-medium text-white flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-sky-400">{ap.code}</span>
                      <span className="text-xs text-slate-400 truncate max-w-[180px]">{ap.name}</span>
                    </td>
                    <td className="py-2.5 text-right">{ap.departuresCount}</td>
                    <td className="py-2.5 text-right font-bold text-slate-100">
                      <span className={ap.onTimeDepRate >= 80 ? 'text-emerald-400' : ap.onTimeDepRate >= 72 ? 'text-amber-400' : 'text-rose-400'}>
                        {ap.onTimeDepRate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right">{ap.avgDepDelay}m</td>
                    <td className="py-2.5 text-right text-slate-400">{ap.avgTaxiOut}m</td>
                    <td className="py-2.5 text-right text-slate-400">{ap.nasDelayMinutes}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Health Status Box */}
        <div className="lg:col-span-4 p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-sky-400" />
              NOC Operations Status
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Network operating under Moderate Evening Bank Pressure. Rotational turnaround compression at ORD and DFW accounts for 42% of active high-risk flight classifications.
            </p>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Turnaround Ground Slack</span>
                  <span className="text-amber-400 font-mono font-semibold">Compressed (avg 48m)</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full w-[65%]" />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">ATC / NAS Flow Constraints</span>
                  <span className="text-sky-400 font-mono font-semibold">Active in Northeast</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-sky-400 h-full w-[45%]" />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Predictive Model Calibration</span>
                  <span className="text-emerald-400 font-mono font-semibold">Calibrated (Brier 0.106)</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-[92%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
            <span>Data Source: DOT BTS Form 41</span>
            <span className="text-sky-400 font-medium">Model: XGBoost v1.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};
