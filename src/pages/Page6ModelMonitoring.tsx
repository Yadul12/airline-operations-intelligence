/**
 * PAGE 6: MODEL MONITORING & DATA QUALITY GOVERNANCE
 * Production monitoring of prediction calibration, population stability (PSI),
 * data quality metrics, and model registry governance.
 */

import React from 'react';
import { FlightRecord } from '../types/airline';
import { PlotlyChart } from '../components/PlotlyChart';
import {
  Activity,
  ShieldCheck,
  AlertCircle,
  Database,
  GitCommit,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from 'lucide-react';

interface Page6ModelMonitoringProps {
  flights: FlightRecord[];
}

export const Page6ModelMonitoring: React.FC<Page6ModelMonitoringProps> = ({ flights }) => {
  // Calibration Data (Reliability Diagram): 10 deciles of predicted probability vs empirical delay rate
  const deciles = [
    { bracket: '0.0 - 0.1', predMid: 0.05, count: 280, observedRate: 0.06 },
    { bracket: '0.1 - 0.2', predMid: 0.15, count: 340, observedRate: 0.14 },
    { bracket: '0.2 - 0.3', predMid: 0.25, count: 210, observedRate: 0.26 },
    { bracket: '0.3 - 0.4', predMid: 0.35, count: 145, observedRate: 0.33 },
    { bracket: '0.4 - 0.5', predMid: 0.45, count: 95, observedRate: 0.46 },
    { bracket: '0.5 - 0.6', predMid: 0.55, count: 62, observedRate: 0.57 },
    { bracket: '0.6 - 0.7', predMid: 0.65, count: 42, observedRate: 0.66 },
    { bracket: '0.7 - 0.8', predMid: 0.75, count: 22, observedRate: 0.73 },
    { bracket: '0.8 - 0.9', predMid: 0.85, count: 14, observedRate: 0.82 },
    { bracket: '0.9 - 1.0', predMid: 0.95, count: 8, observedRate: 0.91 },
  ];

  // Calibration Curve Plot
  const calibIdealTrace: any = {
    x: [0, 1],
    y: [0, 1],
    name: 'Perfect Calibration (y = x)',
    type: 'scatter' as const,
    mode: 'lines' as const,
    line: { color: '#475569', dash: 'dash', width: 1.5 },
  };

  const calibModelTrace = {
    x: deciles.map(d => d.predMid),
    y: deciles.map(d => d.observedRate),
    name: 'XGBoost v1.4 Empirical',
    type: 'scatter' as const,
    mode: 'lines+markers' as const,
    line: { color: '#38bdf8', width: 2.5 },
    marker: { size: 7, color: '#0ea5e9' },
  };

  const calibLayout = {
    margin: { t: 25, r: 25, l: 45, b: 35 },
    xaxis: { title: 'Mean Predicted Probability', range: [0, 1], gridcolor: '#1e293b' },
    yaxis: { title: 'Observed Delay Proportion', range: [0, 1], gridcolor: '#1e293b' },
    legend: { orientation: 'h' as const, y: 1.15, x: 0.0 },
  };

  // Prediction Distribution Histogram
  const predProbTrace = {
    x: flights.map(f => f.predictedDelayProb),
    type: 'histogram' as const,
    nbinsx: 20,
    marker: { color: '#6366f1' },
    opacity: 0.75,
  };

  const predDistLayout = {
    margin: { t: 25, r: 25, l: 45, b: 35 },
    xaxis: { title: 'Predicted Delay Probability', gridcolor: '#1e293b' },
    yaxis: { title: 'Flight Frequency', gridcolor: '#1e293b' },
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Model Governance, Calibration & Data Quality
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inference health, calibration curves, population stability index (PSI), and model registry audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-950/70 border border-emerald-800 text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Model Status: Healthy (Drift PSI = 0.042)
          </span>
        </div>
      </div>

      {/* Model Health Status Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 block font-medium">Brier Calibration Score</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">0.106</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Ideal: &lt; 0.120 (Strictly calibrated)</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 block font-medium">Population Stability (PSI)</span>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1">0.042</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">&lt; 0.10 = No significant drift</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 block font-medium">Pre-Flight Missing Rate</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">0.00%</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">100% Feature completeness</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[11px] text-slate-400 block font-medium">Avg Inference Latency</span>
          <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">2.1 ms</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">P99 SLA: &lt; 15 ms</span>
        </div>
      </div>

      {/* Calibration Curve & Prediction Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reliability Diagram */}
        <div className="lg:col-span-6 p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Reliability Curve (Probability Calibration)</h3>
              <p className="text-xs text-slate-400">Comparing predicted probabilities against observed outcome proportions.</p>
            </div>
          </div>
          <PlotlyChart data={[calibIdealTrace, calibModelTrace]} layout={calibLayout} className="w-full h-64" />
          <p className="text-[11px] text-slate-400 mt-2">
            <strong>Interpretation:</strong> The calibration curve hugs the diagonal $y = x$, meaning that when the model outputs a 60% probability, approximately 60% of those flights actually experience delay &gt; 15m.
          </p>
        </div>

        {/* Prediction Distribution Histogram */}
        <div className="lg:col-span-6 p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Inference Score Distribution (Holdout Flights)</h3>
              <p className="text-xs text-slate-400">Bimodal concentration reflecting clear separation of high-risk turns.</p>
            </div>
          </div>
          <PlotlyChart data={[predProbTrace]} layout={predDistLayout} className="w-full h-64" />
          <p className="text-[11px] text-slate-400 mt-2">
            <strong>Risk Segmentation:</strong> 72% of flights fall below 0.25 (Low Risk), 19% between 0.25–0.54 (Medium Risk), and 9% above 0.55 (High Risk).
          </p>
        </div>
      </div>

      {/* Model Registry & Version Changelog */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-sky-400" />
            Model Registry & Version Governance
          </h3>
          <span className="text-xs text-slate-500 font-mono">Champion / Challenger Registry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 font-medium">Model ID</th>
                <th className="py-2.5 font-medium">Framework</th>
                <th className="py-2.5 font-medium">Role</th>
                <th className="py-2.5 font-medium">Deployment Date</th>
                <th className="py-2.5 font-medium">ROC-AUC</th>
                <th className="py-2.5 font-medium">Retrain Cadence</th>
                <th className="py-2.5 font-medium">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 font-sans font-bold text-white">xgboost_v1.4_prod</td>
                <td className="py-2.5 font-sans text-slate-400">XGBoost 2.0.3</td>
                <td className="py-2.5 font-sans text-sky-400 font-bold">Champion (Production)</td>
                <td className="py-2.5 text-slate-400">2026-10-15</td>
                <td className="py-2.5 text-emerald-400 font-bold">0.896</td>
                <td className="py-2.5 font-sans text-slate-400">Weekly (Bi-weekly refit)</td>
                <td className="py-2.5 font-sans text-emerald-400">Zero Leakage Verified</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 font-sans font-medium text-slate-300">gbm_sklearn_v1.2</td>
                <td className="py-2.5 font-sans text-slate-400">Scikit-Learn 1.4</td>
                <td className="py-2.5 font-sans text-slate-400">Challenger 1 (Shadow)</td>
                <td className="py-2.5 text-slate-400">2026-10-01</td>
                <td className="py-2.5 text-slate-300">0.881</td>
                <td className="py-2.5 font-sans text-slate-400">Shadow tracking</td>
                <td className="py-2.5 font-sans text-slate-400">Verified</td>
              </tr>
              <tr className="hover:bg-slate-800/40">
                <td className="py-2.5 font-sans font-medium text-slate-300">logreg_baseline_v1.0</td>
                <td className="py-2.5 font-sans text-slate-400">Scikit-Learn GLM</td>
                <td className="py-2.5 font-sans text-slate-400">Explainable Benchmark</td>
                <td className="py-2.5 text-slate-400">2026-09-15</td>
                <td className="py-2.5 text-slate-400">0.812</td>
                <td className="py-2.5 font-sans text-slate-400">Static Benchmark</td>
                <td className="py-2.5 font-sans text-slate-400">Verified</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
