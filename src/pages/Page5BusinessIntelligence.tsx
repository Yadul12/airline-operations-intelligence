/**
 * PAGE 5: BUSINESS INTELLIGENCE & OPERATIONAL DECISION SUPPORT
 * Tactical exception monitoring, root cause isolation, baseline deterioration analysis,
 * and high-impact executive recommendations grounded strictly in empirical findings.
 */

import React, { useState } from 'react';
import { FlightRecord, OperationalException } from '../types/airline';
import { detectOperationalExceptions, generateStrategicRecommendations, ActionableRecommendation } from '../analytics/decisionSupport';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  TrendingDown,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Zap,
  Clock,
  Layers,
} from 'lucide-react';

interface Page5BusinessIntelligenceProps {
  flights: FlightRecord[];
  onSelectFlight: (flight: FlightRecord) => void;
}

export const Page5BusinessIntelligence: React.FC<Page5BusinessIntelligenceProps> = ({
  flights,
  onSelectFlight,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const exceptions = detectOperationalExceptions(flights);
  const recommendations = generateStrategicRecommendations(flights);

  const filteredExceptions = selectedCategory === 'ALL'
    ? exceptions
    : exceptions.filter(e => e.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Operational Decision Support & Business Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Converting predictive risk classifications and BTS delay patterns into actionable NOC/SOC management interventions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-950/70 border border-amber-800 text-amber-400 text-xs font-semibold rounded-lg flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            {exceptions.length} Active Operational Exceptions Flagged
          </span>
        </div>
      </div>

      {/* Strategic Executive Recommendations Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-400" />
            Prioritized Management Interventions (Evidence-Supported)
          </h2>
          <span className="text-xs text-slate-400">Strictly grounded in analytical data</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map(rec => (
            <div
              key={rec.id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    rec.priority === 'Immediate Action'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : rec.priority === 'Tactical Watch'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  }`}>
                    {rec.priority}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{rec.domain}</span>
                </div>

                <h3 className="text-sm font-bold text-white mt-2 leading-snug">
                  {rec.title}
                </h3>

                <div className="mt-2.5 p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1.5">
                  <p className="text-slate-300">
                    <strong className="text-sky-400">Empirical Evidence:</strong> {rec.analyticalEvidence}
                  </p>
                  <p className="text-slate-300">
                    <strong className="text-emerald-400">Recommended Action:</strong> {rec.recommendedIntervention}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-emerald-400 font-medium">
                  <span>Targeted Impact:</span>
                  <span>{rec.expectedOutcome}</span>
                </div>
                <div className="text-[10px] text-slate-500 italic">
                  <strong>Operational Bound:</strong> {rec.operationalBoundaryNote}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Exceptions Monitoring Feed */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Tactical Flight Exception Feed (Supervisor Action Queue)
            </h3>
            <p className="text-xs text-slate-400">
              Flights flagged with delay probability &ge; 55% requiring gate supervisor and station ramp coordination.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
            {['ALL', 'Turnaround Cascade', 'Weather Ground Stop', 'Hub Congestion', 'Route Degradation'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Alerts' : cat.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Exceptions Grid */}
        <div className="space-y-3">
          {filteredExceptions.map(exc => (
            <div
              key={exc.id}
              className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    exc.severity === 'Critical'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {exc.severity}
                  </span>
                  <span className="text-sm font-bold font-mono text-white">{exc.flightNumber}</span>
                  <span className="text-xs text-slate-300">{exc.carrier}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs font-mono font-semibold text-sky-400">{exc.route}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-400">Sched: {exc.scheduledDep}</span>
                </div>

                <p className="text-xs text-slate-300">
                  <strong className="text-slate-400">Root Cause Driver:</strong> {exc.rootCauseAttribution}
                </p>

                <p className="text-xs text-emerald-400">
                  <strong className="text-slate-400">Station Directive:</strong> {exc.recommendedAction}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0 md:text-right">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Delay Prob</span>
                  <span className="text-lg font-bold font-mono text-rose-400">
                    {(exc.delayProbability * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">Cost Avoidance: {exc.estimatedCostAvoidance}</span>
                </div>

                <button
                  onClick={() => {
                    const match = flights.find(f => f.flightNumber === exc.flightNumber);
                    if (match) onSelectFlight(match);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-sky-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  Inspect
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
