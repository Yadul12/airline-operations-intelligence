/**
 * Interactive US National Airspace System (NAS) Geospatial Network Map
 * Renders FAA/DOT hub nodes, high-density flight corridors, live delay risk coloring,
 * and interactive hub selection for Network Operations Control (NOC).
 */

import React, { useState, useMemo } from 'react';
import { FlightRecord } from '../types/airline';
import { US_AIRPORTS } from '../data/btsData';
import { computeAirportPerformance, computeRoutePerformance } from '../analytics/kpiCalculator';
import { Navigation, MapPin, Plane, Activity, ShieldAlert, ArrowRight } from 'lucide-react';

interface USNetworkMapProps {
  flights: FlightRecord[];
  selectedAirport: string | null;
  onSelectAirport: (code: string | null) => void;
}

export const USNetworkMap: React.FC<USNetworkMapProps> = ({
  flights,
  selectedAirport,
  onSelectAirport,
}) => {
  const [hoveredHub, setHoveredHub] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'delay_risk' | 'otd_rate' | 'volume'>('delay_risk');

  const airportPerfMap = useMemo(() => {
    const perf = computeAirportPerformance(flights);
    const map = new Map<string, typeof perf[0]>();
    perf.forEach(p => map.set(p.code, p));
    return map;
  }, [flights]);

  const topRoutes = useMemo(() => {
    return computeRoutePerformance(flights).slice(0, 28);
  }, [flights]);

  // Convert lat/lon to SVG X/Y coordinates (Equirectangular US bounding box projection)
  // US bounds: Lon -126 to -66, Lat 24 to 50
  const project = (lat: number, lon: number) => {
    const x = ((lon - -127) / (-66 - -127)) * 820 + 40;
    const y = ((50 - lat) / (50 - 24)) * 410 + 35;
    return { x, y };
  };

  const activeHubCode = hoveredHub || selectedAirport;
  const activeHubPerf = activeHubCode ? airportPerfMap.get(activeHubCode) : null;
  const activeHubMeta = activeHubCode ? US_AIRPORTS[activeHubCode] : null;

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-white">
              National Airspace System (NAS) Geospatial Corridor Intelligence
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any FAA Large Hub node to isolate origin/destination corridors and inspect station queuing telemetry.
          </p>
        </div>

        {/* Map Layer Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setMapMode('delay_risk')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors whitespace-nowrap ${
              mapMode === 'delay_risk' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            ML Risk Overlay
          </button>
          <button
            onClick={() => setMapMode('otd_rate')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors whitespace-nowrap ${
              mapMode === 'otd_rate' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Punctuality (OTD%)
          </button>
          <button
            onClick={() => setMapMode('volume')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors whitespace-nowrap ${
              mapMode === 'volume' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            Corridor Volume
          </button>
          {selectedAirport && (
            <button
              onClick={() => onSelectAirport(null)}
              className="px-2 py-1 text-[11px] font-semibold text-rose-400 hover:bg-rose-950/50 rounded transition-colors whitespace-nowrap"
            >
              Reset Filter ({selectedAirport})
            </button>
          )}
        </div>
      </div>

      {/* Main Map Viewport & Side Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* SVG Map Canvas */}
        <div className="lg:col-span-9 bg-slate-950 border border-slate-800/90 rounded-lg relative overflow-hidden flex items-center justify-center min-h-[340px]">
          <svg
            viewBox="0 0 900 480"
            className="w-full h-full max-h-[380px] select-none"
          >
            <defs>
              <radialGradient id="hubGlowSky" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="hubGlowRose" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="hubGlowAmber" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Subtle Radar Coordinate Grid */}
            <g stroke="#1e293b" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.55">
              {[80, 160, 240, 320, 400].map(y => (
                <line key={`lat-${y}`} x1="30" y1={y} x2="870" y2={y} />
              ))}
              {[120, 260, 400, 540, 680, 820].map(x => (
                <line key={`lon-${x}`} x1={x} y1="20" x2={x} y2="460" />
              ))}
            </g>

            {/* Continental US Stylized Sector Boundary Outline */}
            <path
              d="M 105,65 L 240,65 L 410,68 L 560,82 L 660,115 L 775,85 L 820,125 L 795,185 L 755,245 L 735,320 L 710,415 L 675,430 L 645,365 L 555,375 L 475,435 L 410,425 L 355,355 L 235,345 L 135,305 L 85,220 L 75,125 Z"
              fill="#0f172a"
              fillOpacity="0.55"
              stroke="#1e293b"
              strokeWidth="1.5"
            />

            {/* Airspace ARTCC Sector Labels */}
            <g fill="#334155" fontSize="9" fontFamily="JetBrains Mono, monospace">
              <text x="140" y="52">ZSE / NORTHWEST</text>
              <text x="410" y="52">ZMP / CENTRAL</text>
              <text x="710" y="68">ZNY / NORTHEAST CORRIDOR</text>
              <text x="120" y="375">ZLA / SOUTHWEST</text>
              <text x="420" y="458">ZFW / SOUTH CENTRAL</text>
              <text x="695" y="455">ZJX / SOUTHEAST</text>
            </g>

            {/* Flight Route Arcs */}
            {topRoutes.map(r => {
              const orig = US_AIRPORTS[r.origin];
              const dest = US_AIRPORTS[r.dest];
              if (!orig || !dest) return null;

              const p1 = project(orig.lat, orig.lon);
              const p2 = project(dest.lat, dest.lon);

              const isHighlighted =
                !activeHubCode ||
                r.origin === activeHubCode ||
                r.dest === activeHubCode;

              // Quadratic Bezier control point for curved flight path
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2 - Math.hypot(p2.x - p1.x, p2.y - p1.y) * 0.12;

              let strokeColor = '#38bdf8';
              if (mapMode === 'delay_risk') {
                strokeColor = r.highRiskPct >= 25 ? '#f43f5e' : r.highRiskPct >= 15 ? '#f59e0b' : '#38bdf8';
              } else if (mapMode === 'otd_rate') {
                strokeColor = r.onTimeDepartureRate >= 80 ? '#10b981' : r.onTimeDepartureRate >= 72 ? '#f59e0b' : '#f43f5e';
              } else {
                strokeColor = '#6366f1';
              }

              return (
                <path
                  key={r.route}
                  d={`M ${p1.x},${p1.y} Q ${midX},${midY} ${p2.x},${p2.y}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isHighlighted ? Math.max(1.4, Math.min(3.2, r.flightCount / 6)) : 0.7}
                  strokeOpacity={isHighlighted ? 0.65 : 0.12}
                  className="transition-all duration-150"
                />
              );
            })}

            {/* Airport Hub Nodes */}
            {Object.values(US_AIRPORTS).map(ap => {
              const pos = project(ap.lat, ap.lon);
              const perf = airportPerfMap.get(ap.code);
              const otd = perf?.onTimeDepRate ?? 80;
              const avgDelay = perf?.avgDepDelay ?? 12;

              const isSelected = selectedAirport === ap.code;
              const isHovered = hoveredHub === ap.code;

              let nodeColor = '#38bdf8';
              let glowId = 'url(#hubGlowSky)';
              if (mapMode === 'delay_risk') {
                if (avgDelay >= 18) {
                  nodeColor = '#f43f5e';
                  glowId = 'url(#hubGlowRose)';
                } else if (avgDelay >= 14) {
                  nodeColor = '#f59e0b';
                  glowId = 'url(#hubGlowAmber)';
                }
              } else if (mapMode === 'otd_rate') {
                nodeColor = otd >= 80 ? '#10b981' : otd >= 73 ? '#f59e0b' : '#f43f5e';
              }

              return (
                <g
                  key={ap.code}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onMouseEnter={() => setHoveredHub(ap.code)}
                  onMouseLeave={() => setHoveredHub(null)}
                  onClick={() => onSelectAirport(isSelected ? null : ap.code)}
                  className="cursor-pointer"
                >
                  {/* Ambient Halo */}
                  <circle
                    r={isSelected || isHovered ? 22 : 14}
                    fill={glowId}
                  />

                  {/* Selection Ring */}
                  {(isSelected || isHovered) && (
                    <circle
                      r={10}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Core Hub Point */}
                  <circle
                    r={isSelected || isHovered ? 6 : 4.5}
                    fill={nodeColor}
                    stroke="#090d16"
                    strokeWidth="1.5"
                  />

                  {/* IATA Code Label */}
                  <text
                    y={-10}
                    textAnchor="middle"
                    fill={isSelected || isHovered ? '#ffffff' : '#cbd5e1'}
                    fontSize={isSelected || isHovered ? '11' : '9.5'}
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {ap.code}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Bottom Map Legend Overlay */}
          <div className="absolute bottom-2.5 left-3 right-3 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded text-[10px] text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                Nominal Flow (&lt;14m avg delay)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Moderate Bank Pressure (14–18m)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                Elevated Corridor Risk (&gt;18m)
              </span>
            </div>
            <span className="font-mono text-slate-500">14 FAA Core Hubs · {flights.length} Active Legs</span>
          </div>
        </div>

        {/* Right Station Telemetry Inspector */}
        <div className="lg:col-span-3 p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-between">
          {activeHubMeta && activeHubPerf ? (
            <div className="space-y-3">
              <div className="border-b border-slate-800 pb-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold font-mono text-sky-400">{activeHubMeta.code}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {activeHubMeta.city}, {activeHubMeta.state}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium truncate mt-0.5">
                  {activeHubMeta.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded">
                  <span className="text-[10px] text-slate-400 block">On-Time Dep</span>
                  <span className={`text-base font-bold font-mono ${
                    activeHubPerf.onTimeDepRate >= 80 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {activeHubPerf.onTimeDepRate}%
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded">
                  <span className="text-[10px] text-slate-400 block">Avg Dep Delay</span>
                  <span className="text-base font-bold font-mono text-white">
                    {activeHubPerf.avgDepDelay}m
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded">
                  <span className="text-[10px] text-slate-400 block">Avg Taxi-Out</span>
                  <span className="text-base font-bold font-mono text-amber-400">
                    {activeHubPerf.avgTaxiOut}m
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 border border-slate-800/80 rounded">
                  <span className="text-[10px] text-slate-400 block">Runway Cap</span>
                  <span className="text-base font-bold font-mono text-sky-400">
                    {activeHubMeta.hourlyCapacity}/hr
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Active Runways:</span>
                  <span className="font-mono text-slate-200">{activeHubMeta.runways} Active</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Scheduled Departures:</span>
                  <span className="font-mono text-slate-200">{activeHubPerf.departuresCount} flights</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>NAS Airspace Delay:</span>
                  <span className="font-mono text-rose-400">{activeHubPerf.nasDelayMinutes} min</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="my-auto text-center space-y-2 py-6">
              <MapPin className="w-7 h-7 text-slate-600 mx-auto" />
              <div className="text-xs font-semibold text-slate-300">
                Station Telemetry Standby
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed px-2">
                Hover or click any airport hub on the NAS airspace map to inspect runway capacity, taxi-out queuing, and corridor delay propagation.
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Filter Dashboard by Hub:</span>
            <span className="font-mono text-sky-400 font-semibold">
              {selectedAirport ? `Active: ${selectedAirport}` : 'All Hubs'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
