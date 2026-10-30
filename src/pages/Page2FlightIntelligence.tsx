/**
 * PAGE 2: FLIGHT INTELLIGENCE
 * High-density operational data grid with multi-dimensional filtering, ML delay probabilities,
 * risk classification, CSV export, and one-click SHAP explainability inspection.
 */

import React, { useState, useMemo } from 'react';
import { FlightRecord } from '../types/airline';
import { US_AIRPORTS, US_AIRLINES } from '../data/btsData';
import { Search, ArrowUpDown, ChevronRight, Plane, ArrowRight, Download } from 'lucide-react';

interface Page2FlightIntelligenceProps {
  flights: FlightRecord[];
  onSelectFlight: (flight: FlightRecord) => void;
}

export const Page2FlightIntelligence: React.FC<Page2FlightIntelligenceProps> = ({
  flights,
  onSelectFlight,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState<string>('ALL');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING'>('ALL');
  const [sortField, setSortField] = useState<'prob' | 'depTime' | 'delay' | 'distance'>('prob');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  // Filter pipeline
  const filteredFlights = useMemo(() => {
    return flights.filter(f => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFlight = f.flightNumber.toLowerCase().includes(q);
        const matchCarrier = f.carrierName.toLowerCase().includes(q);
        const matchOrigin = f.origin.toLowerCase().includes(q) || f.originCity.toLowerCase().includes(q);
        const matchDest = f.dest.toLowerCase().includes(q) || f.destCity.toLowerCase().includes(q);
        if (!matchFlight && !matchCarrier && !matchOrigin && !matchDest) return false;
      }

      if (selectedCarrier !== 'ALL' && f.carrierCode !== selectedCarrier) return false;
      if (selectedOrigin !== 'ALL' && f.origin !== selectedOrigin) return false;
      if (selectedRisk !== 'ALL' && f.riskLevel !== selectedRisk) return false;

      if (timeFilter === 'MORNING' && (f.crsDepHour < 6 || f.crsDepHour >= 12)) return false;
      if (timeFilter === 'AFTERNOON' && (f.crsDepHour < 12 || f.crsDepHour >= 17)) return false;
      if (timeFilter === 'EVENING' && f.crsDepHour < 17) return false;

      return true;
    });
  }, [flights, searchQuery, selectedCarrier, selectedOrigin, selectedRisk, timeFilter]);

  // Sort pipeline
  const sortedFlights = useMemo(() => {
    return [...filteredFlights].sort((a, b) => {
      let valA: number;
      let valB: number;
      if (sortField === 'prob') {
        valA = a.predictedDelayProb;
        valB = b.predictedDelayProb;
      } else if (sortField === 'depTime') {
        valA = a.crsDepHour * 60;
        valB = b.crsDepHour * 60;
      } else if (sortField === 'delay') {
        valA = a.depDelay;
        valB = b.depDelay;
      } else {
        valA = a.distance;
        valB = b.distance;
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [filteredFlights, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedFlights.length / pageSize) || 1;
  const paginatedFlights = sortedFlights.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportFilteredCSV = () => {
    const headers = [
      'FlightID',
      'FlightNumber',
      'Carrier',
      'Origin',
      'Dest',
      'Date',
      'SchedDepTime',
      'DistanceMi',
      'TurnaroundBufferMin',
      'PredictedDelayProb',
      'RiskLevel',
      'ObservedDepDelayMin',
      'ObservedArrDelayMin',
    ];
    const rows = sortedFlights.map(f => [
      f.id,
      f.flightNumber,
      f.carrierCode,
      f.origin,
      f.dest,
      f.flightDate,
      f.crsDepTime,
      f.distance,
      f.scheduledTurnaroundBuffer,
      f.predictedDelayProb,
      f.riskLevel,
      f.depDelay,
      f.arrDelay,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `filtered_flights_intelligence_${sortedFlights.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Flight Intelligence Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Flight-level operational records with pre-departure ML delay probability and SHAP root-cause breakdown.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            Showing <strong className="text-white">{sortedFlights.length}</strong> matching flights
          </span>
          <button
            onClick={handleExportFilteredCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search flight #, carrier, airport, city..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Carrier Select */}
          <div className="md:col-span-2">
            <select
              value={selectedCarrier}
              onChange={e => { setSelectedCarrier(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Carriers</option>
              {Object.keys(US_AIRLINES).map(c => (
                <option key={c} value={c}>{c} - {US_AIRLINES[c].name.split(' ')[0]}</option>
              ))}
            </select>
          </div>

          {/* Origin Hub Select */}
          <div className="md:col-span-2">
            <select
              value={selectedOrigin}
              onChange={e => { setSelectedOrigin(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Hubs (Origin)</option>
              {Object.keys(US_AIRPORTS).map(a => (
                <option key={a} value={a}>{a} - {US_AIRPORTS[a].city}</option>
              ))}
            </select>
          </div>

          {/* Risk Tier Select */}
          <div className="md:col-span-2">
            <select
              value={selectedRisk}
              onChange={e => { setSelectedRisk(e.target.value); setPage(1); }}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="High Risk">High Risk (&ge; 55%)</option>
              <option value="Medium Risk">Medium Risk (25–54%)</option>
              <option value="Low Risk">Low Risk (&lt; 25%)</option>
            </select>
          </div>

          {/* Time Segmented Buttons */}
          <div className="md:col-span-2 flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
            {(['ALL', 'MORNING', 'AFTERNOON', 'EVENING'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTimeFilter(t); setPage(1); }}
                className={`flex-1 py-1 text-[10px] font-semibold rounded transition-colors ${
                  timeFilter === t
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'ALL' ? 'All' : t.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flight Grid Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-medium">Flight</th>
                <th className="py-3 px-3 font-medium">Route</th>
                <th
                  onClick={() => toggleSort('depTime')}
                  className="py-3 px-3 font-medium cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Sched Dep</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('distance')}
                  className="py-3 px-3 text-right font-medium cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Distance</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right font-medium">Turnaround</th>
                <th
                  onClick={() => toggleSort('prob')}
                  className="py-3 px-3 text-right font-medium cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Delay Prob</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-3 font-medium">Risk Classification</th>
                <th
                  onClick={() => toggleSort('delay')}
                  className="py-3 px-3 text-right font-medium cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Observed Delay</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right font-medium">Explain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {paginatedFlights.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                    No flight records match the active filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedFlights.map(flight => {
                  const riskTextStyle =
                    flight.riskLevel === 'High Risk'
                      ? 'text-rose-400 font-semibold'
                      : flight.riskLevel === 'Medium Risk'
                      ? 'text-amber-400 font-medium'
                      : 'text-emerald-400';

                  return (
                    <tr
                      key={flight.id}
                      onClick={() => onSelectFlight(flight)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      {/* Flight Number & Carrier */}
                      <td className="py-3 px-4 font-sans font-medium text-white">
                        <div className="flex items-center gap-2">
                          <Plane className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" />
                          <span>{flight.flightNumber}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{flight.carrierCode}</span>
                        </div>
                      </td>

                      {/* Route */}
                      <td className="py-3 px-3 font-sans">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <span className="font-mono font-bold text-sky-400">{flight.origin}</span>
                          <ArrowRight className="w-3 h-3 text-slate-600" />
                          <span className="font-mono font-bold text-slate-300">{flight.dest}</span>
                        </div>
                      </td>

                      {/* Sched Dep */}
                      <td className="py-3 px-3 text-slate-300">
                        <span>{flight.crsDepTime}</span>
                        {flight.originPeakBank && (
                          <span className="text-[10px] text-indigo-400 ml-1.5 font-sans">
                            · Peak Bank
                          </span>
                        )}
                      </td>

                      {/* Distance */}
                      <td className="py-3 px-3 text-right text-slate-400">
                        {flight.distance} mi
                      </td>

                      {/* Turnaround buffer */}
                      <td className="py-3 px-3 text-right">
                        <span className={flight.scheduledTurnaroundBuffer < 45 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {flight.scheduledTurnaroundBuffer}m
                        </span>
                      </td>

                      {/* Predicted Prob */}
                      <td className="py-3 px-3 text-right font-bold text-slate-100">
                        {(flight.predictedDelayProb * 100).toFixed(1)}%
                      </td>

                      {/* Unboxed Semantic Risk Label */}
                      <td className="py-3 px-3 font-sans">
                        <span className={`text-xs ${riskTextStyle}`}>
                          {flight.riskLevel}
                        </span>
                      </td>

                      {/* Observed Dep Delay */}
                      <td className="py-3 px-3 text-right">
                        {flight.cancelled ? (
                          <span className="text-rose-500 font-sans font-semibold">Cancelled</span>
                        ) : (
                          <span className={flight.depDelay > 15 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                            {flight.depDelay > 0 ? `+${flight.depDelay}m` : `${flight.depDelay}m`}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectFlight(flight); }}
                          className="px-2.5 py-1 text-[11px] font-sans font-medium text-sky-400 hover:text-sky-300 hover:bg-sky-950/60 rounded border border-sky-900/50 transition-colors inline-flex items-center gap-1"
                        >
                          SHAP
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/70 border-t border-slate-800 text-xs text-slate-400">
          <span>
            Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded text-slate-200 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded text-slate-200 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
