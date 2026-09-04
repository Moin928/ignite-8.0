"use client";

import React, { useState, useRef, useMemo } from "react";
import India from "@svg-maps/india";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  X,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  BarChart2,
  ShieldCheck,
} from "lucide-react";

export type MapIssueSummary = {
  id: string;
  ticket_no: string;
  title: string;
  category: string;
  status: string;
  priority_score: number;
  report_count: number;
  created_at: string;
  lng: number;
  lat: number;
};

export type StateMetric = {
  name: string;
  code: string;
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  color?: string;
  lat: number;
  lng: number;
  zoom: number;
  issues?: MapIssueSummary[];
};

// Geocoordinates and default zoom levels for Indian States and UTs (ISO 3166-2:IN)
export const STATE_GEO_CONFIG: Record<
  string,
  { name: string; lat: number; lng: number; zoom: number; capital?: [number, number] }
> = {
  an: { name: "Andaman and Nicobar Islands", lat: 11.7401, lng: 92.6586, zoom: 7.0 },
  ap: { name: "Andhra Pradesh", lat: 15.9129, lng: 79.74, zoom: 7.5, capital: [315, 520] },
  ar: { name: "Arunachal Pradesh", lat: 28.218, lng: 94.7278, zoom: 7.5, capital: [580, 220] },
  as: { name: "Assam", lat: 26.2006, lng: 92.9376, zoom: 7.5, capital: [515, 275] },
  br: { name: "Bihar", lat: 25.0961, lng: 85.3131, zoom: 8.0, capital: [415, 285] },
  ch: { name: "Chandigarh", lat: 30.7333, lng: 76.7794, zoom: 11.0, capital: [180, 160] },
  ct: { name: "Chhattisgarh", lat: 21.2787, lng: 81.8661, zoom: 7.5, capital: [335, 410] },
  dn: { name: "Dadra and Nagar Haveli", lat: 20.1809, lng: 73.0169, zoom: 10.0, capital: [105, 407] },
  dd: { name: "Daman and Diu", lat: 20.4283, lng: 72.8397, zoom: 10.0, capital: [52, 392] },
  dl: { name: "Delhi", lat: 28.6139, lng: 77.209, zoom: 10.5, capital: [188, 205] },
  ga: { name: "Goa", lat: 15.2993, lng: 74.124, zoom: 9.5, capital: [115, 503] },
  gj: { name: "Gujarat", lat: 22.2587, lng: 71.1924, zoom: 7.5, capital: [95, 350] },
  hr: { name: "Haryana", lat: 29.0588, lng: 76.0856, zoom: 8.0, capital: [188, 205] },
  hp: { name: "Himachal Pradesh", lat: 31.1048, lng: 77.1734, zoom: 8.0, capital: [205, 135] },
  jk: { name: "Jammu and Kashmir", lat: 33.7782, lng: 76.5762, zoom: 7.5, capital: [185, 90] },
  jh: { name: "Jharkhand", lat: 23.6102, lng: 85.2799, zoom: 8.0, capital: [398, 345] },
  ka: { name: "Karnataka", lat: 15.3173, lng: 75.7139, zoom: 7.5, capital: [205, 535] },
  kl: { name: "Kerala", lat: 10.8505, lng: 76.2711, zoom: 8.0, capital: [188, 620] },
  ld: { name: "Lakshadweep", lat: 10.5667, lng: 72.6417, zoom: 9.0 },
  mp: { name: "Madhya Pradesh", lat: 22.9734, lng: 78.6569, zoom: 7.5, capital: [260, 360] },
  mh: { name: "Maharashtra", lat: 19.7515, lng: 75.7139, zoom: 7.5, capital: [142, 422] },
  mn: { name: "Manipur", lat: 24.6637, lng: 93.9063, zoom: 8.5, capital: [555, 335] },
  ml: { name: "Meghalaya", lat: 25.467, lng: 91.3662, zoom: 8.5, capital: [495, 290] },
  mz: { name: "Mizoram", lat: 23.1645, lng: 92.9376, zoom: 8.5, capital: [540, 375] },
  nl: { name: "Nagaland", lat: 26.1584, lng: 94.5624, zoom: 8.5, capital: [565, 280] },
  or: { name: "Odisha", lat: 20.9517, lng: 85.0985, zoom: 7.5, capital: [410, 410] },
  py: { name: "Puducherry", lat: 11.9416, lng: 79.8083, zoom: 11.0 },
  pb: { name: "Punjab", lat: 31.1471, lng: 75.3412, zoom: 8.0, capital: [175, 165] },
  rj: { name: "Rajasthan", lat: 27.0238, lng: 74.2179, zoom: 7.0, capital: [160, 260] },
  sk: { name: "Sikkim", lat: 27.533, lng: 88.5122, zoom: 9.0, capital: [450, 240] },
  tn: { name: "Tamil Nadu", lat: 11.1271, lng: 78.6569, zoom: 7.5, capital: [235, 620] },
  tg: { name: "Telangana", lat: 18.1124, lng: 79.0193, zoom: 7.5, capital: [280, 475] },
  tr: { name: "Tripura", lat: 23.9408, lng: 91.9882, zoom: 9.0, capital: [515, 350] },
  up: { name: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, zoom: 7.5, capital: [320, 265] },
  ut: { name: "Uttarakhand", lat: 30.0668, lng: 79.0193, zoom: 8.0, capital: [225, 175] },
  wb: { name: "West Bengal", lat: 22.9868, lng: 87.855, zoom: 7.5, capital: [455, 335] },
};

/**
 * Dynamic choropleth color scale strictly based on ticket volume / complaints raised.
 * Zero hardcoded state conditions!
 */
export function getChoroplethColor(total: number, isHovered: boolean) {
  if (total === 0) {
    return {
      fill: isHovered ? "#CBD5E1" : "#E2E8F0", // Slate-200
      stroke: isHovered ? "#94A3B8" : "#CBD5E1",
      label: "0 Tickets",
      tier: "zero",
    };
  }
  if (total >= 20) {
    // Critical tier: Red
    return {
      fill: isHovered ? "#DC2626" : "#EF4444",
      stroke: "#B91C1C",
      label: "20+ (Critical)",
      tier: "critical",
    };
  }
  if (total >= 10) {
    // High tier: Orange
    return {
      fill: isHovered ? "#EA580C" : "#F97316",
      stroke: "#C2410C",
      label: "10-19 (High)",
      tier: "high",
    };
  }
  if (total >= 5) {
    // Moderate tier: Amber
    return {
      fill: isHovered ? "#D97706" : "#F59E0B",
      stroke: "#B45309",
      label: "5-9 (Moderate)",
      tier: "moderate",
    };
  }
  if (total >= 2) {
    // Active tier: Vibrant Blue
    return {
      fill: isHovered ? "#2563EB" : "#3B82F6",
      stroke: "#1D4ED8",
      label: "2-4 (Active)",
      tier: "active",
    };
  }
  // Low tier: Sky Blue (1 ticket)
  return {
    fill: isHovered ? "#60A5FA" : "#93C5FD",
    stroke: "#3B82F6",
    label: "1 (Low)",
    tier: "low",
  };
}

const CAT_ICON: Record<string, string> = {
  pothole: "🕳️",
  garbage: "🗑️",
  streetlight: "💡",
  water_leakage: "💧",
  road_damage: "🚧",
  other: "⚠️",
};

type Props = {
  stateMetrics: Record<string, StateMetric>;
  onSelectState: (state: StateMetric) => void;
};

export default function IndiaStateMap({ stateMetrics, onSelectState }: Props) {
  const [zoomScale, setZoomScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredState, setHoveredState] = useState<{
    id: string;
    name: string;
    metric: StateMetric;
    x: number;
    y: number;
  } | null>(null);

  // Statistic Opening / Drawer state
  const [statsDrawerState, setStatsDrawerState] = useState<StateMetric | null>(null);

  const allIndiaTotal = useMemo(() => {
    return Object.values(stateMetrics).reduce((acc, m) => acc + (m.total || 0), 0);
  }, [stateMetrics]);

  const allIndiaResolved = useMemo(() => {
    return Object.values(stateMetrics).reduce((acc, m) => acc + (m.resolved || 0), 0);
  }, [stateMetrics]);

  const allIndiaPending = useMemo(() => {
    return Object.values(stateMetrics).reduce((acc, m) => acc + (m.pending || 0), 0);
  }, [stateMetrics]);

  const allIndiaInProgress = useMemo(() => {
    return Object.values(stateMetrics).reduce((acc, m) => acc + (m.inProgress || 0), 0);
  }, [stateMetrics]);

  // Find the state with highest ticket volume to position hotspot
  const highestStateInfo = useMemo(() => {
    let max = 0;
    let maxCode = "";
    Object.entries(stateMetrics).forEach(([code, m]) => {
      if (m.total > max) {
        max = m.total;
        maxCode = code.toLowerCase();
      }
    });
    if (max > 0 && maxCode && STATE_GEO_CONFIG[maxCode]?.capital) {
      return {
        code: maxCode,
        total: max,
        pos: STATE_GEO_CONFIG[maxCode].capital!,
      };
    }
    return null;
  }, [stateMetrics]);

  // Helper to retrieve metrics for state ID/code or by name
  const getMetricForState = (locId: string, locName: string): StateMetric => {
    const upperId = locId.toUpperCase();
    const geo = STATE_GEO_CONFIG[locId.toLowerCase()] || {
      name: locName,
      lat: 20.5937,
      lng: 78.9629,
      zoom: 7.5,
    };

    let found =
      stateMetrics[upperId] ||
      stateMetrics[locId] ||
      stateMetrics[locId.toLowerCase()];

    if (!found) {
      if (locId === "tg" && stateMetrics["TS"]) found = stateMetrics["TS"];
      if (locId === "or" && stateMetrics["OD"]) found = stateMetrics["OD"];
      if (locId === "ct" && stateMetrics["CG"]) found = stateMetrics["CG"];
      if (locId === "ut" && stateMetrics["UK"]) found = stateMetrics["UK"];
      if (locId === "dl" && stateMetrics["HR"]) found = stateMetrics["HR"];
    }

    if (found) {
      return {
        ...found,
        name: found.name || locName,
        code: upperId,
        lat: found.lat || geo.lat,
        lng: found.lng || geo.lng,
        zoom: found.zoom || geo.zoom,
      };
    }

    return {
      name: locName,
      code: upperId,
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      lat: geo.lat,
      lng: geo.lng,
      zoom: geo.zoom,
      issues: [],
    };
  };

  const handleMouseMove = (
    e: React.MouseEvent<SVGPathElement>,
    locId: string,
    locName: string
  ) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const metric = getMetricForState(locId, locName);

    setHoveredState({
      id: locId,
      name: locName,
      metric,
      x,
      y,
    });
  };

  // Open the statistics opening for a specific state or All India
  const handleOpenStats = (metric: StateMetric) => {
    setStatsDrawerState(metric);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col items-center justify-between bg-white rounded-lg border border-slate-200 p-6 select-none shadow-xs overflow-hidden"
    >
      {/* ── Top Header Controls & Choropleth Legend ── */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 z-10">
        {/* Dynamic Color Scale Legend */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
          <span className="text-slate-400 uppercase font-mono mr-1">TICKETS:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300 inline-block" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1 ml-1.5">
            <span className="w-3 h-3 rounded bg-blue-300 border border-blue-400 inline-block" />
            <span>1</span>
          </div>
          <div className="flex items-center gap-1 ml-1.5">
            <span className="w-3 h-3 rounded bg-blue-500 border border-blue-600 inline-block" />
            <span>2-4</span>
          </div>
          <div className="flex items-center gap-1 ml-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 border border-amber-600 inline-block" />
            <span>5-9</span>
          </div>
          <div className="flex items-center gap-1 ml-1.5">
            <span className="w-3 h-3 rounded bg-orange-500 border border-orange-600 inline-block" />
            <span>10-19</span>
          </div>
          <div className="flex items-center gap-1 ml-1.5">
            <span className="w-3 h-3 rounded bg-red-500 border border-red-600 inline-block" />
            <span>20+</span>
          </div>
        </div>

        {/* Quick Statistics Trigger Button */}
        <button
          type="button"
          onClick={() =>
            handleOpenStats({
              name: "All India",
              code: "IN",
              total: allIndiaTotal,
              pending: allIndiaPending,
              inProgress: allIndiaInProgress,
              resolved: allIndiaResolved,
              lat: 21.5,
              lng: 78.9,
              zoom: 4.5,
              issues: Object.values(stateMetrics).flatMap((m) => m.issues || []),
            })
          }
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-xs cursor-pointer"
        >
          <BarChart2 size={14} className="text-amber-400" />
          <span>National Statistics ({allIndiaTotal})</span>
        </button>
      </div>

      {/* ── Top Right Floating Zoom Controls ── */}
      <div className="absolute top-20 right-6 z-20 flex flex-col bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden divide-y divide-slate-100">
        <button
          type="button"
          onClick={() => setZoomScale((z) => Math.min(1.8, z + 0.15))}
          className="p-2 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          type="button"
          onClick={() => setZoomScale((z) => Math.max(0.75, z - 0.15))}
          className="p-2 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            setZoomScale(1);
            setStatsDrawerState(null);
          }}
          className="p-2 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
          title="Reset View"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {/* ── Central Dynamic SVG Canvas ── */}
      <div className="relative w-full max-w-2xl flex-1 flex items-center justify-center min-h-[460px]">
        <div
          className="transition-transform duration-300 w-full h-full flex items-center justify-center"
          style={{ transform: `scale(${zoomScale})` }}
        >
          <svg
            viewBox={India.viewBox || "0 0 612 696"}
            className="w-full h-full max-h-[520px] filter drop-shadow-xs"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Map over accurate state paths provided by @svg-maps/india */}
            {India.locations.map((loc: { id: string; name: string; path: string }) => {
              const metric = getMetricForState(loc.id, loc.name);
              const isHovered = hoveredState?.id === loc.id;
              const isSelected = statsDrawerState?.code.toLowerCase() === loc.id.toLowerCase();

              // DYNAMIC CHOROPLETH COLOR ASSIGNMENT BASED STRICTLY ON TICKET VOLUME
              const colorInfo = getChoroplethColor(metric.total, isHovered || isSelected);

              return (
                <path
                  key={loc.id}
                  id={loc.id}
                  d={loc.path}
                  fill={colorInfo.fill}
                  stroke={isSelected ? "#0F172A" : colorInfo.stroke}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 1.8 : 0.8}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseMove={(e) => handleMouseMove(e, loc.id, loc.name)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => handleOpenStats(metric)}
                />
              );
            })}

            {/* Dynamic Hotspot Target Ring on State with Most Issues */}
            {highestStateInfo && (
              <g className="pointer-events-none">
                <circle
                  cx={highestStateInfo.pos[0]}
                  cy={highestStateInfo.pos[1]}
                  r={8}
                  fill="#F59E0B"
                  opacity={0.35}
                  className="animate-ping"
                />
                <circle
                  cx={highestStateInfo.pos[0]}
                  cy={highestStateInfo.pos[1]}
                  r={4.5}
                  fill="#F59E0B"
                  stroke="#FFFFFF"
                  strokeWidth={1.8}
                />
              </g>
            )}
          </svg>
        </div>

        {/* ── Interactive Hover Tooltip ── */}
        {hoveredState && !statsDrawerState && (
          <div
            className="absolute z-30 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-4 min-w-[200px] pointer-events-none animate-fade-in backdrop-blur-md"
            style={{
              left: `${hoveredState.x}px`,
              top: `${hoveredState.y}px`,
              transform: "translate(-50%, -115%)",
            }}
          >
            {/* Header: State Name + Issue Count Capsule */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 mb-2.5">
              <span className="font-bold text-sm text-slate-900 truncate">
                {hoveredState.name}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  hoveredState.metric.total >= 20
                    ? "bg-red-100 text-red-700"
                    : hoveredState.metric.total >= 10
                    ? "bg-orange-100 text-orange-700"
                    : hoveredState.metric.total >= 5
                    ? "bg-amber-100 text-amber-700"
                    : hoveredState.metric.total > 0
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {hoveredState.metric.total} {hoveredState.metric.total === 1 ? "ticket" : "tickets"}
              </span>
            </div>

            {/* Three-Color Metric Rows */}
            <div className="space-y-1.5 text-xs font-medium">
              <div className="flex items-center justify-between">
                <span className="text-amber-600 font-semibold">Pending:</span>
                <span className="font-bold text-amber-600">
                  {hoveredState.metric.pending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-semibold">In Progress:</span>
                <span className="font-bold text-blue-600">
                  {hoveredState.metric.inProgress}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-600 font-semibold">Resolved:</span>
                <span className="font-bold text-emerald-600">
                  {hoveredState.metric.resolved}
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Click for full stats &amp; tickets</span>
              <ArrowRight size={11} className="text-slate-400" />
            </div>
          </div>
        )}

        {/* ── 📊 STATISTIC OPENING (IN-PAGE STATE ANALYTICS DRAWER) ── */}
        {statsDrawerState && (
          <div className="absolute inset-y-0 right-0 z-40 w-full sm:w-[380px] bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-slide-left backdrop-blur-md">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-base">
                    {statsDrawerState.name}
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                    {statsDrawerState.code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jurisdiction Incident &amp; Resolution Analytics
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatsDrawerState(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition cursor-pointer"
                title="Close statistics"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Primary KPI Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-center">
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                    Pending
                  </div>
                  <div className="text-xl font-black text-amber-900 mt-0.5">
                    {statsDrawerState.pending}
                  </div>
                </div>
                <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-2.5 text-center">
                  <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                    In Progress
                  </div>
                  <div className="text-xl font-black text-blue-900 mt-0.5">
                    {statsDrawerState.inProgress}
                  </div>
                </div>
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-2.5 text-center">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Resolved
                  </div>
                  <div className="text-xl font-black text-emerald-900 mt-0.5">
                    {statsDrawerState.resolved}
                  </div>
                </div>
              </div>

              {/* Resolution Efficiency Progress Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <TrendingUp size={13} className="text-emerald-600" />
                    Resolution Efficiency
                  </span>
                  <span className="text-emerald-700 font-mono">
                    {statsDrawerState.total > 0
                      ? `${Math.round((statsDrawerState.resolved / statsDrawerState.total) * 100)}%`
                      : "100% (Clean)"}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{
                      width: `${
                        statsDrawerState.total > 0
                          ? (statsDrawerState.resolved / statsDrawerState.total) * 100
                          : 100
                      }%`,
                    }}
                    title="Resolved"
                  />
                  <div
                    className="bg-blue-500 h-full transition-all duration-500"
                    style={{
                      width: `${
                        statsDrawerState.total > 0
                          ? (statsDrawerState.inProgress / statsDrawerState.total) * 100
                          : 0
                      }%`,
                    }}
                    title="In Progress"
                  />
                  <div
                    className="bg-amber-500 h-full transition-all duration-500"
                    style={{
                      width: `${
                        statsDrawerState.total > 0
                          ? (statsDrawerState.pending / statsDrawerState.total) * 100
                          : 0
                      }%`,
                    }}
                    title="Pending"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 pt-1">
                  <span>Total Raised: {statsDrawerState.total}</span>
                  <span className="text-slate-400">Target SLA: 24h</span>
                </div>
              </div>

              {/* Ticket Registry for this Jurisdiction */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Recent Tickets ({statsDrawerState.issues?.length || statsDrawerState.total})
                  </h4>
                  <span className="text-[10px] text-slate-400">Live Telemetry</span>
                </div>

                {statsDrawerState.issues && statsDrawerState.issues.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {statsDrawerState.issues.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-slate-200 rounded-lg p-2.5 hover:border-slate-300 transition shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">
                              {CAT_ICON[item.category] || "⚠️"}
                            </span>
                            <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.ticket_no}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              item.status === "resolved"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2">
                          {item.title}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>Reports: {item.report_count}</span>
                          <span className="font-mono text-amber-600 font-bold">
                            Priority: {item.priority_score}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-5 text-center text-xs text-slate-500">
                    <ShieldCheck size={24} className="mx-auto text-emerald-500 mb-1.5" />
                    <p className="font-bold text-slate-700">No active incidents reported</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      This jurisdiction is currently operating within green municipal thresholds.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectState(statsDrawerState);
                  setStatsDrawerState(null);
                }}
                className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <MapPin size={14} />
                <span>Zoom to Pins on Street Map</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Information Footer ── */}
      <div className="w-full flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200 mt-2">
        <div className="flex items-center gap-1.5">
          <Info size={14} className="text-slate-400" />
          <span>Click any state on the map to open its complete statistics drawer.</span>
        </div>
        <div className="font-bold text-slate-900">
          All India: {allIndiaTotal} complaints ({allIndiaResolved} resolved, {allIndiaPending} pending)
        </div>
      </div>
    </div>
  );
}
