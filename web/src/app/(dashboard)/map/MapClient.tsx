"use client";

import { useState } from "react";
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { AlertTriangle, Clock, CheckCircle2, X, MapPin, ExternalLink, ChevronRight } from "lucide-react";
import Link from "next/link";

type Issue = {
  id: string;
  title: string;
  category: string;
  status: string;
  priority_score: number;
  report_count: number;
  description: string;
  created_at: string;
  lng: number;
  lat: number;
};

const CAT_ICON: Record<string, string> = {
  pothole: "🕳️", garbage: "🗑️", streetlight: "💡",
  water_leakage: "💧", road_damage: "🚧", other: "⚠️",
};

const CAT_LABEL: Record<string, string> = {
  pothole: "Pothole", garbage: "Garbage & Debris",
  streetlight: "Streetlight", water_leakage: "Water & Drainage",
  road_damage: "Road Damage", other: "Other Hazard",
};

const STATUS_DOT: Record<string, string> = {
  reported: "bg-amber-500", assigned: "bg-blue-500",
  in_progress: "bg-orange-500", repaired: "bg-teal-500",
};

const STATUS_PILL: Record<string, string> = {
  reported:    "bg-amber-100 text-amber-800 border-amber-300",
  assigned:    "bg-blue-100 text-blue-800 border-blue-300",
  in_progress: "bg-orange-100 text-orange-800 border-orange-300",
  repaired:    "bg-teal-100 text-teal-800 border-teal-300",
};

// Demo data when DB is empty — placed around Bengaluru
const DEMO: Issue[] = [
  { id: "d1", title: "Large Pothole on MG Road", category: "pothole", status: "reported", priority_score: 87, report_count: 9, description: "Multiple vehicles damaged. Urgent repair needed on the primary arterial road.", created_at: new Date().toISOString(), lng: 77.5946, lat: 12.9716 },
  { id: "d2", title: "Streetlight Outage – Park St", category: "streetlight", status: "assigned", priority_score: 62, report_count: 3, description: "Three consecutive lights out causing safety hazard after dark.", created_at: new Date().toISOString(), lng: 77.5996, lat: 12.9756 },
  { id: "d3", title: "Garbage Overflow – Koramangala", category: "garbage", status: "in_progress", priority_score: 75, report_count: 5, description: "Bins overflowing at sector 7 market. Sanitation crew dispatched.", created_at: new Date().toISOString(), lng: 77.6101, lat: 12.9352 },
  { id: "d4", title: "Water Pipe Burst – HSR Layout", category: "water_leakage", status: "reported", priority_score: 92, report_count: 12, description: "Main transmission line burst causing road flooding and water disruption.", created_at: new Date().toISOString(), lng: 77.6494, lat: 12.9116 },
  { id: "d5", title: "Road Erosion – Whitefield Rd", category: "road_damage", status: "assigned", priority_score: 55, report_count: 2, description: "Severe erosion near highway bypass entry ramp after monsoon.", created_at: new Date().toISOString(), lng: 77.7480, lat: 12.9698 },
  { id: "d6", title: "Open Manhole – 5th Avenue", category: "other", status: "repaired", priority_score: 90, report_count: 7, description: "Open manhole near pedestrian crossing creating immediate hazard.", created_at: new Date().toISOString(), lng: 77.5750, lat: 12.9850 },
];

const ALL_CATS = ["All Categories", "pothole", "garbage", "streetlight", "water_leakage", "road_damage", "other"];

function getSLA(createdAt: string) {
  const diffH = Math.floor((Date.now() - new Date(createdAt).getTime()) / 3600000);
  const remaining = 72 - diffH;
  if (remaining <= 0) return { text: "SLA Breached", cls: "text-red-600" };
  if (remaining <= 24) return { text: `${remaining}h left`, cls: "text-orange-600" };
  return { text: `${Math.floor(remaining / 24)}d left`, cls: "text-slate-500" };
}

export default function MapClient({
  issues,
  mapboxToken,
  stats,
}: {
  issues: Issue[];
  mapboxToken: string;
  stats: { open: number; atRisk: number; resolved: number };
}) {
  const [selected, setSelected] = useState<Issue | null>(null);
  const [catFilter, setCatFilter] = useState("All Categories");

  const display = issues.length > 0 ? issues : DEMO;
  const isDemo = issues.length === 0;

  const filtered = catFilter === "All Categories"
    ? display
    : display.filter((i) => i.category === catFilter);

  const center = display[0] ?? { lng: 77.5946, lat: 12.9716 };

  // Stats for top bar (use DB values or demo counts)
  const dispStats = isDemo
    ? { open: 38, atRisk: 4, resolved: "92%" }
    : { open: stats.open, atRisk: stats.atRisk, resolved: stats.resolved };

  return (
    <div className="flex flex-col h-full" style={{ height: "calc(100vh - 48px)" }}>
      {/* ── Stats bar ── */}
      <div className="flex items-center gap-0 border-b border-slate-200 bg-white shrink-0">
        <div className="px-6 py-3 border-r border-slate-100 text-center">
          <div className="text-xl font-black text-slate-900">{dispStats.open}</div>
          <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Open Incidents</div>
        </div>
        <div className="px-6 py-3 border-r border-slate-100 text-center">
          <div className="text-xl font-black text-red-600">{dispStats.atRisk}</div>
          <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">SLA at Risk</div>
        </div>
        <div className="px-6 py-3 border-r border-slate-200 text-center">
          <div className="text-xl font-black text-emerald-600">{dispStats.resolved}</div>
          <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">7-Day Resolved</div>
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1.5 px-4 flex-1 overflow-x-auto py-2">
          {ALL_CATS.map((cat) => {
            const count = cat === "All Categories"
              ? filtered.length
              : display.filter((i) => i.category === cat).length;
            const active = catFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => { setCatFilter(cat); setSelected(null); }}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-sm text-xs font-semibold border transition ${
                  active
                    ? "bg-amber-500 text-slate-900 border-amber-500"
                    : "bg-white text-slate-600 border-slate-300 hover:border-amber-400 hover:text-amber-700"
                }`}
              >
                {cat === "All Categories" ? `All (${count})` : `${CAT_ICON[cat]} ${CAT_LABEL[cat]} (${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Map + Sidebar ── */}
      <div className="flex flex-1 min-h-0">
        {/* Map */}
        <div className="flex-1 relative">
          {!mapboxToken ? (
            <div className="flex items-center justify-center h-full bg-slate-100">
              <div className="text-center">
                <AlertTriangle className="mx-auto text-amber-500 mb-3" size={36} />
                <h2 className="font-semibold text-slate-800">Mapbox Token Missing</h2>
                <p className="text-sm text-slate-500 mt-1">Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local</p>
              </div>
            </div>
          ) : (
            <Map
              mapboxAccessToken={mapboxToken}
              initialViewState={{ longitude: center.lng, latitude: center.lat, zoom: 12 }}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/light-v11"
            >
              <NavigationControl position="top-right" />
              <FullscreenControl position="top-right" />

              {filtered.map((issue) => {
                const crit = issue.priority_score > 80;
                const isSelected = selected?.id === issue.id;
                return (
                  <Marker
                    key={issue.id}
                    longitude={issue.lng}
                    latitude={issue.lat}
                    anchor="bottom"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      setSelected(isSelected ? null : issue);
                    }}
                  >
                    <div className="flex flex-col items-center cursor-pointer group">
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold shadow-md border-2 transition-transform group-hover:scale-110 ${
                          isSelected ? "scale-110 ring-2 ring-amber-400 ring-offset-1" : ""
                        } ${
                          crit
                            ? "bg-red-500 border-white text-white"
                            : STATUS_DOT[issue.status]
                            ? `${STATUS_DOT[issue.status]} border-white text-white`
                            : "bg-amber-500 border-white text-slate-900"
                        }`}
                      >
                        <span>{CAT_ICON[issue.category] || "⚠️"}</span>
                        <span>{issue.report_count > 9 ? "9+" : issue.report_count}</span>
                      </div>
                      <div className={`w-0.5 h-2 ${crit ? "bg-red-500" : "bg-slate-400"}`} />
                    </div>
                  </Marker>
                );
              })}
            </Map>
          )}

          {/* Demo badge */}
          {isDemo && (
            <div className="absolute bottom-4 left-4 bg-amber-500 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded shadow-md">
              Demo Mode – Seed real data via /api/issues
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white border border-slate-200 rounded shadow-sm px-3 py-2 text-[11px] space-y-1">
            <div className="font-semibold text-slate-600 mb-1.5 uppercase tracking-wide text-[10px]">Legend</div>
            {[
              { color: "bg-red-500", label: "Critical (Priority > 80)" },
              { color: "bg-amber-500", label: "Reported" },
              { color: "bg-blue-500", label: "Assigned" },
              { color: "bg-orange-500", label: "In Progress" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Detail sidebar ── */}
        <div
          className={`bg-white border-l border-slate-200 overflow-y-auto transition-all duration-200 shrink-0 ${
            selected ? "w-80" : "w-0"
          }`}
        >
          {selected && (
            <div className="p-4 min-w-[320px]">
              {/* Sidebar header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${STATUS_PILL[selected.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {selected.status.replace("_", " ").toUpperCase()}
                    </span>
                    {selected.priority_score > 80 && (
                      <span className="text-[11px] px-2 py-0.5 rounded border font-semibold bg-red-100 text-red-700 border-red-300">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wide">
                    {CAT_LABEL[selected.category] || "Issue"} · Ward 14
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-slate-400 hover:text-slate-700 transition mt-0.5"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Title */}
              <h2 className="text-base font-bold text-slate-900 mb-3 leading-snug">
                {selected.title}
              </h2>

              {/* Photo placeholder */}
              <div className="w-full h-36 bg-slate-100 border border-slate-200 rounded mb-4 flex items-center justify-center text-slate-300">
                <div className="text-center">
                  <div className="text-3xl mb-1">{CAT_ICON[selected.category]}</div>
                  <div className="text-xs text-slate-400">Evidence photo</div>
                </div>
              </div>

              {/* Description */}
              {selected.description && (
                <p className="text-xs text-slate-600 leading-relaxed mb-4 border-l-2 border-amber-400 pl-3">
                  {selected.description}
                </p>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-50 border border-slate-100 rounded p-2.5">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Priority</div>
                  <div className={`text-lg font-black ${selected.priority_score > 80 ? "text-red-600" : "text-amber-500"}`}>
                    {selected.priority_score.toFixed(0)}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded p-2.5">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">Reports</div>
                  <div className="text-lg font-black text-slate-900">{selected.report_count}</div>
                </div>
              </div>

              {/* SLA */}
              <div className="flex items-center gap-2 mb-4 text-xs">
                <Clock size={12} className={getSLA(selected.created_at).cls} />
                <span className={`font-semibold ${getSLA(selected.created_at).cls}`}>
                  SLA: {getSLA(selected.created_at).text}
                </span>
                <span className="text-slate-400 ml-auto">
                  {new Date(selected.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>

              {/* CTA */}
              <Link
                href={`/issues/${selected.id}`}
                className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 rounded text-sm transition"
              >
                View Full Details <ChevronRight size={14} />
              </Link>

              {/* Adjacent stub */}
              {filtered.length > 1 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold mb-2">
                    Next Adjacent Issue
                  </div>
                  {(() => {
                    const next = filtered.find((i) => i.id !== selected.id);
                    if (!next) return null;
                    const dist = Math.round(
                      Math.sqrt(
                        Math.pow((next.lng - selected.lng) * 111000, 2) +
                          Math.pow((next.lat - selected.lat) * 111000, 2)
                      )
                    );
                    return (
                      <button
                        onClick={() => setSelected(next)}
                        className="w-full text-left p-2.5 bg-slate-50 border border-slate-200 rounded hover:border-amber-300 transition"
                      >
                        <div className="font-semibold text-xs text-slate-800 truncate">{next.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {dist}m away · Priority {next.priority_score.toFixed(0)}
                        </div>
                      </button>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
