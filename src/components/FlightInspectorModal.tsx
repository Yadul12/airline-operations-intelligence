/**
 * Flight Inspector & SHAP Waterfall Explanation Modal
 * Deep-dive individual flight operational profile and ML attribution
 */

import React from 'react';
import { FlightRecord } from '../types/airline';
import { getLocalShapWaterfall } from '../ml/shapEngine';
import { PlotlyChart } from './PlotlyChart';
import { X, Plane, Clock, ShieldAlert, AlertTriangle, ArrowRight, Activity, MapPin } from 'lucide-react';

interface FlightInspectorModalProps {
  flight: FlightRecord | null;
  onClose: () => void;
}

export const FlightInspectorModal: React.FC<FlightInspectorModalProps> = ({ flight, onClose }) => {
  if (!flight) return null;

  const shapData = getLocalShapWaterfall(flight);

  // Plotly waterfall / horizontal bar chart for SHAP contributions
  const barTrace = {
    type: 'bar' as const,
    orientation: 'h' as const,
    y: shapData.contributions.map(c => c.displayName),
    x: shapData.contributions.map(c => c.shapValue),
    text: shapData.contributions.map(c => `${c.shapValue >= 0 ? '+' : ''}${(c.shapValue * 100).toFixed(1)}% (${c.featureValue})`),
    textposition: 'outside' as const,
    marker: {
      color: shapData.contributions.map(c => (c.shapValue >= 0 ? '#ef4444' : '#10b981')),
    },
    hoverinfo: 'text' as const,
  };

  const waterfallLayout = {
    margin: { t: 10, r: 90, l: 190, b: 35 },
    xaxis: {
      title: 'SHAP Contribution to Delay Probability',
      zeroline: true,
      zerolinecolor: '#475569',
      gridcolor: '#1e293b',
    },
    yaxis: {
      autorange: 'reversed' as const,
      tickfont: { size: 11, color: '#cbd5e1' },
    },
  };

  const riskBadgeColor =
    flight.riskLevel === 'High Risk'
      ? 'text-rose-400 bg-rose-950/60 border border-rose-800/60'
      : flight.riskLevel === 'Medium Risk'
      ? 'text-amber-400 bg-amber-950/60 border border-amber-800/60'
      : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Plane className="w-5 h-5 text-sky-400" />
                {flight.carrierCode} {flight.flightNumber}
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md ${riskBadgeColor}`}>
                {flight.riskLevel} ({(flight.predictedDelayProb * 100).toFixed(1)}% prob)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {flight.flightDate}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-slate-300 font-medium">{flight.origin} ({flight.originCity})</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-300 font-medium">{flight.dest} ({flight.destCity})</span>
              <span className="text-slate-600">·</span>
              <span>{flight.distance} miles</span>
              <span className="text-slate-600">·</span>
              <span>Sched: {flight.crsDepTime} → {flight.crsArrTime}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operational Overview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5">
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-xs text-slate-400 block">Pre-Flight Risk Score</span>
            <span className="text-xl font-bold font-mono text-sky-400">
              {(flight.predictedDelayProb * 100).toFixed(1)}%
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Base prior: {(flight.baseValue! * 100).toFixed(1)}%</span>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-xs text-slate-400 block">Observed Departure Delay</span>
            <span className={`text-xl font-bold font-mono ${flight.depDelay > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {flight.depDelay > 0 ? `+${flight.depDelay}m` : `${flight.depDelay}m`}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {flight.depDelay <= 15 ? 'Met Punctuality Standard' : 'FAA A14 Breach (>15m)'}
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-xs text-slate-400 block">Turnaround Buffer</span>
            <span className="text-xl font-bold font-mono text-amber-400">
              {flight.scheduledTurnaroundBuffer} min
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Inbound Risk: {(flight.inboundLegDelayRisk * 100).toFixed(0)}%
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <span className="text-xs text-slate-400 block">Origin Hub Congestion</span>
            <span className="text-xl font-bold font-mono text-indigo-400">
              {(flight.originCongestionIndex * 100).toFixed(0)}%
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Taxi out: {flight.taxiOutMinutes}m
            </span>
          </div>
        </div>

        {/* SHAP Feature Attribution Breakdown */}
        <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <h4 className="text-sm font-semibold text-white">
                {"SHAP Local Feature Attribution: f(x) = E[f(x)] + Σ φ_i"}
              </h4>
            </div>
            <span className="text-xs text-slate-400">
              Red increases delay risk · Green reduces delay risk
            </span>
          </div>

          <PlotlyChart
            data={[barTrace]}
            layout={waterfallLayout}
            className="w-full h-64"
          />

          <p className="text-xs text-slate-400 mt-2 italic">
            <strong>Analytical Interpretation:</strong> The model baseline expectation was {(shapData.baseValue * 100).toFixed(1)}%. 
            Features with positive contributions pushed the delay probability to {(shapData.finalProbability * 100).toFixed(1)}%.
          </p>
        </div>

        {/* BTS Delay Attribution (Observed Ground Truth) */}
        {flight.depDelay > 15 && (
          <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg mb-5">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              BTS Official Delay Cause Decomposition ({flight.depDelay} Total Minutes)
            </h4>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                <span className="text-slate-400 block text-[10px]">Late Aircraft</span>
                <span className="font-mono font-bold text-amber-400">{flight.lateAircraftDelay}m</span>
              </div>
              <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                <span className="text-slate-400 block text-[10px]">Air Carrier</span>
                <span className="font-mono font-bold text-indigo-400">{flight.carrierDelay}m</span>
              </div>
              <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                <span className="text-slate-400 block text-[10px]">NAS (Airspace)</span>
                <span className="font-mono font-bold text-sky-400">{flight.nasDelay}m</span>
              </div>
              <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                <span className="text-slate-400 block text-[10px]">Weather</span>
                <span className="font-mono font-bold text-rose-400">{flight.weatherDelay}m</span>
              </div>
              <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                <span className="text-slate-400 block text-[10px]">Security</span>
                <span className="font-mono font-bold text-slate-300">{flight.securityDelay}m</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
