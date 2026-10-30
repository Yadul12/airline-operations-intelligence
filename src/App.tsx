/**
 * Airline Operations Intelligence - Main Application Shell
 * Predictive Performance Analytics & Operational Decision Support
 */

import React, { useState } from 'react';
import { BTS_MASTER_FLIGHTS } from './data/btsData';
import { FlightRecord } from './types/airline';
import { Page1ExecutiveOverview } from './pages/Page1ExecutiveOverview';
import { Page2FlightIntelligence } from './pages/Page2FlightIntelligence';
import { Page3OperationalPerformance } from './pages/Page3OperationalPerformance';
import { Page4MachineLearningInsights } from './pages/Page4MachineLearningInsights';
import { Page5BusinessIntelligence } from './pages/Page5BusinessIntelligence';
import { Page6ModelMonitoring } from './pages/Page6ModelMonitoring';
import { Page7ExecutiveReport } from './pages/Page7ExecutiveReport';
import { Page8DataArchitectureSQL } from './pages/Page8DataArchitectureSQL';
import { FlightInspectorModal } from './components/FlightInspectorModal';
import { LivePredictorModal } from './components/LivePredictorModal';
import {
  Plane,
  LayoutDashboard,
  Compass,
  BarChart3,
  BrainCircuit,
  Lightbulb,
  ShieldCheck,
  FileSpreadsheet,
  Database,
  SlidersHorizontal,
} from 'lucide-react';

export type NavPage =
  | 'overview'
  | 'flights'
  | 'performance'
  | 'ml_insights'
  | 'business_intel'
  | 'monitoring'
  | 'sql_architecture'
  | 'report';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('overview');
  const [selectedFlight, setSelectedFlight] = useState<FlightRecord | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  const flights = BTS_MASTER_FLIGHTS;

  // Primary Top Bar Links (5 core operational workspaces)
  const topBarLinks: { id: NavPage; label: string }[] = [
    { id: 'overview', label: 'Executive Overview' },
    { id: 'flights', label: 'Flight Intelligence' },
    { id: 'performance', label: 'Operational Analytics' },
    { id: 'ml_insights', label: 'ML & SHAP' },
    { id: 'business_intel', label: 'Decision Support' },
  ];

  // Full 8-Module Navigation Strip for rapid NOC switching
  const moduleItems: { id: NavPage; label: string; moduleTag: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Executive Overview', moduleTag: 'NOC View', icon: LayoutDashboard },
    { id: 'flights', label: 'Flight Intelligence', moduleTag: '1,200 Legs', icon: Compass },
    { id: 'performance', label: 'Operational Performance', moduleTag: '10 KPIs', icon: BarChart3 },
    { id: 'ml_insights', label: 'ML & SHAP Insights', moduleTag: '5 Models', icon: BrainCircuit },
    { id: 'business_intel', label: 'Decision Support', moduleTag: 'SOC Queue', icon: Lightbulb },
    { id: 'monitoring', label: 'Model Monitoring', moduleTag: 'PSI & Brier', icon: ShieldCheck },
    { id: 'sql_architecture', label: 'SQL & Schema Workbench', moduleTag: 'PostgreSQL', icon: Database },
    { id: 'report', label: 'Executive Report', moduleTag: 'Dossier', icon: FileSpreadsheet },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Navigation (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between gap-8 print:hidden">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#overview"
          onClick={e => {
            e.preventDefault();
            setCurrentPage('overview');
          }}
          className="text-base font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          AIRLINE OPERATIONS INTELLIGENCE
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
          {topBarLinks.map(link => {
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setCurrentPage(link.id)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
                  isActive
                    ? 'text-white border-sky-400 font-semibold'
                    : 'border-transparent hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Delay Simulator
          </button>
        </div>
      </header>

      {/* Secondary Workspace Module Selector Bar (All 8 Modules Accessible) */}
      <div className="bg-slate-900/70 border-b border-slate-800/80 px-4 sm:px-6 py-2 overflow-x-auto print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            {moduleItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-800 text-sky-400 font-semibold shadow-2xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden xl:flex items-center gap-2 text-[11px] text-slate-400 font-mono shrink-0">
            <span>BTS Form 41</span>
            <span>·</span>
            <span className="text-emerald-400">Zero Target Leakage</span>
          </div>
        </div>
      </div>

      {/* Main Viewport Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentPage === 'overview' && (
          <Page1ExecutiveOverview
            flights={flights}
            onSelectFlight={flight => setSelectedFlight(flight)}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
          />
        )}

        {currentPage === 'flights' && (
          <Page2FlightIntelligence
            flights={flights}
            onSelectFlight={flight => setSelectedFlight(flight)}
          />
        )}

        {currentPage === 'performance' && (
          <Page3OperationalPerformance
            flights={flights}
          />
        )}

        {currentPage === 'ml_insights' && (
          <Page4MachineLearningInsights />
        )}

        {currentPage === 'business_intel' && (
          <Page5BusinessIntelligence
            flights={flights}
            onSelectFlight={flight => setSelectedFlight(flight)}
          />
        )}

        {currentPage === 'monitoring' && (
          <Page6ModelMonitoring
            flights={flights}
          />
        )}

        {currentPage === 'sql_architecture' && (
          <Page8DataArchitectureSQL
            flights={flights}
          />
        )}

        {currentPage === 'report' && (
          <Page7ExecutiveReport
            flights={flights}
          />
        )}
      </main>

      {/* Flight Detail SHAP Waterfall Modal */}
      <FlightInspectorModal
        flight={selectedFlight}
        onClose={() => setSelectedFlight(null)}
      />

      {/* Live Predictor Simulator Modal */}
      <LivePredictorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      {/* Quiet Enterprise Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <span>AIRLINE OPERATIONS INTELLIGENCE</span>
          <span>·</span>
          <span>US DOT Bureau of Transportation Statistics (BTS)</span>
          <span>·</span>
          <span>FAA A14 Punctuality Standard</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>XGBoost Champion (ROC-AUC 0.896)</span>
          <span>·</span>
          <span>TreeSHAP Calibrated</span>
          <span>·</span>
          <span>PostgreSQL DDL</span>
        </div>
      </footer>
    </div>
  );
}
