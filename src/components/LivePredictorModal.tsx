/**
 * Flight Dispatcher ML Delay Predictor & Scenario Simulator
 * Allows testing hypothetical operational adjustments (e.g. turnaround buffers, departure hours)
 */

import React, { useState } from 'react';
import { predictFlightDelayProbability } from '../ml/models';
import { US_AIRPORTS, US_AIRLINES } from '../data/btsData';
import { PlotlyChart } from './PlotlyChart';
import { X, Sliders, Zap, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface LivePredictorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LivePredictorModal: React.FC<LivePredictorModalProps> = ({ isOpen, onClose }) => {
  const [carrierCode, setCarrierCode] = useState('DL');
  const [origin, setOrigin] = useState('ATL');
  const [dest, setDest] = useState('ORD');
  const [crsDepHour, setCrsDepHour] = useState(17);
  const [originCongestionIndex, setOriginCongestionIndex] = useState(0.65);
  const [destCongestionIndex, setDestCongestionIndex] = useState(0.40);
  const [inboundLegDelayRisk, setInboundLegDelayRisk] = useState(0.55);
  const [weatherSeverityIndex, setWeatherSeverityIndex] = useState(0.30);
  const [scheduledTurnaroundBuffer, setScheduledTurnaroundBuffer] = useState(45);
  const [historicalRouteDelayRate, setHistoricalRouteDelayRate] = useState(0.22);

  if (!isOpen) return null;

  // Run live inference
  const prediction = predictFlightDelayProbability({
    crsDepHour,
    originCongestionIndex,
    destCongestionIndex,
    inboundLegDelayRisk,
    weatherSeverityIndex,
    scheduledTurnaroundBuffer,
    historicalRouteDelayRate,
    carrierCode,
  });

  const barTrace = {
    type: 'bar' as const,
    orientation: 'h' as const,
    y: prediction.shapContributions.map(c => c.label),
    x: prediction.shapContributions.map(c => c.shap),
    text: prediction.shapContributions.map(c => `${c.shap >= 0 ? '+' : ''}${(c.shap * 100).toFixed(1)}% (${c.value})`),
    textposition: 'outside' as const,
    marker: {
      color: prediction.shapContributions.map(c => (c.shap >= 0 ? '#ef4444' : '#10b981')),
    },
    hoverinfo: 'text' as const,
  };

  const layout = {
    margin: { t: 10, r: 80, l: 200, b: 35 },
    xaxis: {
      title: 'SHAP Contribution to Delay Probability',
      zeroline: true,
      zerolinecolor: '#475569',
      gridcolor: '#1e293b',
    },
    yaxis: {
      autorange: 'reversed' as const,
      tickfont: { size: 10, color: '#cbd5e1' },
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-400" />
              <h3 className="text-lg font-bold text-white">NOC Live Flight Delay Simulator</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Test pre-departure operational scenarios using calibrated XGBoost inference and real-time SHAP decomposition.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-5">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Operational Input Parameters
            </h4>

            {/* Carrier & Route */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Carrier</label>
                <select
                  value={carrierCode}
                  onChange={e => setCarrierCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                >
                  {Object.keys(US_AIRLINES).map(c => (
                    <option key={c} value={c}>{c} ({US_AIRLINES[c].name.split(' ')[0]})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Origin Hub</label>
                <select
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                >
                  {Object.keys(US_AIRPORTS).map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Destination</label>
                <select
                  value={dest}
                  onChange={e => setDest(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                >
                  {Object.keys(US_AIRPORTS).filter(a => a !== origin).map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Departure Hour Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Scheduled Departure Hour</span>
                <span className="font-mono text-white font-semibold">{String(crsDepHour).padStart(2, '0')}:00</span>
              </div>
              <input
                type="range"
                min="6"
                max="22"
                value={crsDepHour}
                onChange={e => setCrsDepHour(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>06:00 (Early Morning)</span>
                <span>17:00 (Peak Evening)</span>
                <span>22:00</span>
              </div>
            </div>

            {/* Turnaround Buffer */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Turnaround Buffer</span>
                <span className="font-mono text-amber-400 font-semibold">{scheduledTurnaroundBuffer} min</span>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                step="5"
                value={scheduledTurnaroundBuffer}
                onChange={e => setScheduledTurnaroundBuffer(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>30m (Tight Turn)</span>
                <span>50m (Standard)</span>
                <span>90m (Generous)</span>
              </div>
            </div>

            {/* Inbound Rotation Risk */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Inbound Aircraft Rotation Risk</span>
                <span className="font-mono text-rose-400 font-semibold">{(inboundLegDelayRisk * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.05"
                value={inboundLegDelayRisk}
                onChange={e => setInboundLegDelayRisk(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            {/* Weather Severity */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Weather Severity Index</span>
                <span className="font-mono text-sky-400 font-semibold">{(weatherSeverityIndex * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.95"
                step="0.05"
                value={weatherSeverityIndex}
                onChange={e => setWeatherSeverityIndex(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
            </div>

            {/* Origin Congestion */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Origin Bank Congestion</span>
                <span className="font-mono text-indigo-400 font-semibold">{(originCongestionIndex * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.95"
                step="0.05"
                value={originCongestionIndex}
                onChange={e => setOriginCongestionIndex(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          {/* Model Inference & SHAP Output Column */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              XGBoost Predictive Scorecard
            </h4>

            {/* Score Banner */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Predicted Delay Probability (&gt; 15 min)</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-bold font-mono text-white">
                    {(prediction.probability * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-500">
                    Threshold: 45.0%
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block mb-1">Operational Risk Tier</span>
                <span className={`px-3 py-1 text-xs font-bold rounded-md ${
                  prediction.riskLevel === 'High Risk'
                    ? 'text-rose-400 bg-rose-950/70 border border-rose-800'
                    : prediction.riskLevel === 'Medium Risk'
                    ? 'text-amber-400 bg-amber-950/70 border border-amber-800'
                    : 'text-emerald-400 bg-emerald-950/70 border border-emerald-800'
                }`}>
                  {prediction.riskLevel}
                </span>
              </div>
            </div>

            {/* Real-time SHAP Waterfall */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200">
                  {"SHAP Attributions: ΔP relative to 20.5% base prior"}
                </span>
              </div>
              <PlotlyChart
                data={[barTrace]}
                layout={layout}
                className="w-full h-56"
              />
            </div>

            {/* Dispatcher Guidance */}
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg text-xs">
              <span className="font-semibold text-sky-400 block mb-1">
                Station Ops Tactical Guidance:
              </span>
              <p className="text-slate-300 leading-relaxed">
                {prediction.riskLevel === 'High Risk'
                  ? 'High probability of departure delay exceeding 15 min. Recommend pre-staging ramp baggage crew, pre-positioning pushback tug, and monitoring passenger connections.'
                  : prediction.riskLevel === 'Medium Risk'
                  ? 'Moderate risk profile driven by network congestion. Maintain standard dispatch countdown with gate hold monitoring.'
                  : 'Flight operating within nominal punctuality envelope. Standard dispatch parameters apply.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
