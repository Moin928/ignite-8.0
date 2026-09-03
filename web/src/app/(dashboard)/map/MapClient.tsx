"use client";

import { useState, useRef, useMemo } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  Source,
  Layer,
  MapRef,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  AlertTriangle,
  MapPin,
  Search,
  Compass,
  Layers,
  Flame,
  X,
  ArrowRight,
  Maximize2,
  Minimize2,
  Eye,
  CheckCircle2,
  Clock,
  Radio,
  Share2,
  ThumbsUp,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";

export type MapIssueItem = {
  id: string;
  ticket_no: string;
  title: string;
  category: string;
  status: string;
  priority_score: number;
  report_count: number;
  description: string;
  created_at: string;
  lng: number;
  lat: number;
  image_url: string;
};

const CAT_ICON: Record<string, string> = {
  pothole: "🕳️",
  garbage: "🗑️",
  streetlight: "💡",
  water_leakage: "💧",
  road_damage: "🚧",
  other: "⚠️",
};

const CAT_LABEL: Record<string, string> = {
  pothole: "Potholes",
  water_leakage: "Water & Drainage",
  streetlight: "Streetlights",
  garbage: "Garbage",
  road_damage: "Road Damage",
  other: "Other",
};

const INDIAN_CITIES = [
  { label: "📍 Bengaluru, KA", lat: 12.9716, lng: 77.5946, zoom: 12.5 },
  { label: "📍 Mumbai, MH", lat: 19.0760, lng: 72.8777, zoom: 12.5 },
  { label: "📍 Delhi NCR", lat: 28.6139, lng: 77.2090, zoom: 12.5 },
  { label: "📍 Hyderabad, TS", lat: 17.3850, lng: 78.4867, zoom: 12.5 },
  { label: "📍 Pune, MH", lat: 18.5204, lng: 73.8567, zoom: 12.5 },
  { label: "📍 Chennai, TN", lat: 13.0827, lng: 80.2707, zoom: 12.5 },
  { label: "🇮🇳 All India (Overview)", lat: 21.5, lng: 78.9, zoom: 4.5 },
];

// Rich Pan-India Fallback Points if DB is freshly created
const PAN_INDIA_DEMO: MapIssueItem[] = [
  {
    id: "m1",
    ticket_no: "#ISSUE-8821",
    title: "Severe Asphalt Cave-In & Water Seepage",
    category: "water_leakage",
    status: "reported",
    priority_score: 94,
    report_count: 5,
    description:
      "Underlying stormwater line leak caused rapid subsurface subsidence. Deep crater spans 1.8 meters across active traffic lane near municipal junction. High vehicle hazard.",
    created_at: new Date().toISOString(),
    lng: 72.8461,
    lat: 19.1176,
    image_url:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "m2",
    ticket_no: "#ISSUE-8819",
    title: "Drain Overflow & Silt Blockage",
    category: "water_leakage",
    status: "in_progress",
    priority_score: 68,
    report_count: 3,
    description:
      "JP Road Flyover ramp lane 2. Maintenance team assigned for silt extraction before evening downpour.",
    created_at: new Date(Date.now() - 40 * 60000).toISOString(),
    lng: 72.8485,
    lat: 19.1152,
    image_url:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "m3",
    ticket_no: "#ISSUE-8801",
    title: "Flyover Approach Pothole Grid",
    category: "pothole",
    status: "reported",
    priority_score: 86,
    report_count: 7,
    description:
      "Cluster of 3 sharp asphalt depressions near western ascent ramp. Tyre puncture hazard during peak transit.",
    created_at: new Date(Date.now() - 80 * 60000).toISOString(),
    lng: 72.8420,
    lat: 19.1190,
    image_url:
      "https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "m4",
    ticket_no: "#ISSUE-8812",
    title: "Solid Waste Overflow at Market Culvert",
    category: "garbage",
    status: "reported",
    priority_score: 72,
    report_count: 4,
    description:
      "Unattended commercial refuse and construction bags blocking sidewalk corridor.",
    created_at: new Date(Date.now() - 130 * 60000).toISOString(),
    lng: 72.8510,
    lat: 19.1210,
    image_url:
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "m5",
    ticket_no: "#ISSUE-8809",
    title: "Streetlight Pole Outage – Sector 14",
    category: "streetlight",
    status: "assigned",
    priority_score: 58,
    report_count: 2,
    description:
      "Series of 2 sodium-vapor lamps flickering and dark near residential curve.",
    created_at: new Date(Date.now() - 200 * 60000).toISOString(),
    lng: 72.8530,
    lat: 19.1140,
    image_url:
      "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "m6",
    ticket_no: "#ISSUE-8788",
    title: "Storm Grate Replaced & Concrete Leveled",
    category: "other",
    status: "resolved",
    priority_score: 90,
    report_count: 6,
    description:
      "Cast iron manhole cover successfully installed and asphalt edge sealed by PWD team.",
    created_at: new Date(Date.now() - 400 * 60000).toISOString(),
    lng: 72.8470,
    lat: 19.1120,
    image_url:
      "https://images.unsplash.com/photo-1584463699039-4d6cb6ebffea?auto=format&fit=crop&w=1200&q=80",
  },
  // Bengaluru
  {
    id: "m7",
    ticket_no: "#ISSUE-7740",
    title: "Water Transmission Burst – MG Road",
    category: "water_leakage",
    status: "reported",
    priority_score: 92,
    report_count: 9,
    description: "Main line leak causing roadbed seepage near MG Road metro pillar.",
    created_at: new Date().toISOString(),
    lng: 77.5946,
    lat: 12.9716,
    image_url:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80",
  },
  // Delhi
  {
    id: "m8",
    ticket_no: "#ISSUE-6620",
    title: "Open Storm Drain – Connaught Place",
    category: "other",
    status: "reported",
    priority_score: 84,
    report_count: 4,
    description: "Heavy iron grating broken near Outer Circle.",
    created_at: new Date().toISOString(),
    lng: 77.2167,
    lat: 28.6315,
    image_url:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
  },
];

// Distance helper (Haversine formula in meters)
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function MapClient({
  issues,
  mapboxToken,
  stats,
}: {
  issues: MapIssueItem[];
  mapboxToken: string;
  stats: { open: number; atRisk: number; resolved: string | number };
}) {
  const mapRef = useRef<MapRef>(null);

  const displayList = issues.length > 0 ? issues : PAN_INDIA_DEMO;
  const [selectedId, setSelectedId] = useState<string>(displayList[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("all");
  const [viewMode, setViewMode] = useState<"pins" | "heatmap">("pins");
  const [imageFitMode, setImageFitMode] = useState<"cover" | "contain">("cover");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedCityIdx, setSelectedCityIdx] = useState(0);

  // Filtered issues for map markers
  const filteredIssues = useMemo(() => {
    return displayList.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ticket_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (catFilter !== "all" && item.category !== catFilter) return false;
      if (statusFilter === "active" && item.status === "resolved") return false;
      if (statusFilter === "resolved" && item.status !== "resolved") return false;
      return true;
    });
  }, [displayList, searchQuery, catFilter, statusFilter]);

  const selectedIssue =
    displayList.find((i) => i.id === selectedId) || filteredIssues[0] || displayList[0] || null;

  // Find nearest adjacent incident
  const adjacentIssue = useMemo(() => {
    if (!selectedIssue) return null;
    const others = displayList.filter((i) => i.id !== selectedIssue.id);
    if (others.length === 0) return null;

    let nearest = others[0];
    let minDist = getDistanceMeters(
      selectedIssue.lat,
      selectedIssue.lng,
      nearest.lat,
      nearest.lng
    );

    for (let i = 1; i < others.length; i++) {
      const d = getDistanceMeters(
        selectedIssue.lat,
        selectedIssue.lng,
        others[i].lat,
        others[i].lng
      );
      if (d < minDist) {
        minDist = d;
        nearest = others[i];
      }
    }
    return { item: nearest, distanceMeters: minDist };
  }, [selectedIssue, displayList]);

  // Center on marker
  const focusOnIssue = (item: MapIssueItem) => {
    setSelectedId(item.id);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [item.lng, item.lat],
        zoom: 14.5,
        duration: 1200,
        essential: true,
      });
    }
  };

  // Jump to city
  const handleCityChange = (idx: number) => {
    setSelectedCityIdx(idx);
    const city = INDIAN_CITIES[idx];
    if (mapRef.current && city) {
      mapRef.current.flyTo({
        center: [city.lng, city.lat],
        zoom: city.zoom,
        duration: 1400,
        essential: true,
      });
    }
  };

  // GeoJSON for heatmap
  const geojsonHeatmapData: GeoJSON.FeatureCollection<GeoJSON.Point> = {
    type: "FeatureCollection",
    features: filteredIssues.map((i) => ({
      type: "Feature",
      properties: {
        id: i.id,
        weight: i.priority_score / 100,
      },
      geometry: {
        type: "Point",
        coordinates: [i.lng, i.lat],
      },
    })),
  };

  return (
    <div className="flex flex-col h-full font-sans bg-slate-50" style={{ height: "calc(100vh - 48px)" }}>
      {/* ── 1. Header & KPI Boxes (Matches User's Exact Layout) ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Title & Description */}
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Civic Issue Map
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
              Live geospatial view of reported issues across Ward sectors. Track ongoing repair work orders, inspect geotagged evidence, and locate neighborhood resolution hotspots.
            </p>
          </div>

          {/* KPI Boxes */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-sm px-4 py-2 text-center min-w-[100px]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                OPEN INCIDENTS
              </div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {stats.open}
              </div>
            </div>

            <div className="bg-red-50/60 border border-red-200 rounded-sm px-4 py-2 text-center min-w-[100px]">
              <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                SLA AT RISK
              </div>
              <div className="text-2xl font-black text-red-600 mt-0.5">
                {stats.atRisk}
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-sm px-4 py-2 text-center min-w-[100px]">
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                7-DAY RESOLVED
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-0.5">
                {stats.resolved}
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Filter Toolbar (Categories + Status + Search + City Switcher) ── */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 mt-2 border-t border-slate-100 text-xs">
          {/* Search Box */}
          <div className="relative w-64">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location, landmark or ward..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-sm bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {[
              { key: "all", label: `All Categories (${displayList.length})` },
              { key: "pothole", label: `Potholes (${displayList.filter((i) => i.category === "pothole").length})` },
              { key: "water_leakage", label: `Water & Drainage (${displayList.filter((i) => i.category === "water_leakage").length})` },
              { key: "streetlight", label: `Streetlights (${displayList.filter((i) => i.category === "streetlight").length})` },
              { key: "garbage", label: `Garbage (${displayList.filter((i) => i.category === "garbage").length})` },
            ].map((c) => {
              const active = catFilter === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCatFilter(c.key)}
                  className={`px-3 py-1 rounded-sm text-[11px] font-semibold transition border whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-amber-500 text-slate-900 border-amber-500 font-bold"
                      : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Status Filters & Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-sm border border-slate-200 text-[11px]">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2 py-0.5 rounded-sm font-semibold transition ${
                  statusFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-2 py-0.5 rounded-sm font-semibold transition ${
                  statusFilter === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("resolved")}
                className={`px-2 py-0.5 rounded-sm font-semibold transition ${
                  statusFilter === "resolved" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                }`}
              >
                Resolved
              </button>
            </div>

            {/* City Preset */}
            <div className="relative">
              <select
                value={selectedCityIdx}
                onChange={(e) => handleCityChange(Number(e.target.value))}
                className="appearance-none pl-2.5 pr-6 py-1 text-[11px] font-bold border border-slate-300 rounded-sm bg-slate-50 text-slate-800 hover:border-slate-400 focus:outline-none cursor-pointer"
              >
                {INDIAN_CITIES.map((city, idx) => (
                  <option key={city.label} value={idx}>
                    {city.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode: Pins vs Heatmap */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-sm border border-slate-200 text-[11px]">
              <button
                onClick={() => setViewMode("pins")}
                className={`px-2 py-0.5 rounded-sm font-semibold transition flex items-center gap-1 ${
                  viewMode === "pins" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600"
                }`}
                title="Pins Marker View"
              >
                <Layers size={11} /> Pins
              </button>
              <button
                onClick={() => setViewMode("heatmap")}
                className={`px-2 py-0.5 rounded-sm font-semibold transition flex items-center gap-1 ${
                  viewMode === "heatmap" ? "bg-red-600 text-white shadow-sm" : "text-slate-600"
                }`}
                title="State Density Heatmap"
              >
                <Flame size={11} /> Heatmap
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Main Workspace (Map Canvas on Left + Inspector Sidebar on Right) ── */}
      <div className="flex flex-1 min-h-0 relative">
        {/* ── MAP CONTAINER (Canvas with HUD Overlays) ── */}
        <div className="flex-1 relative bg-slate-100 overflow-hidden">
          {/* Top HUD Telemetry Banner */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
            <div className="bg-slate-900/90 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-sm shadow-md backdrop-blur-sm border border-slate-800 flex items-center gap-2 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              LIVE GIS TELEMETRY • WARD SECTORS
            </div>
            <div className="bg-slate-900/90 text-slate-300 text-[10px] font-mono px-3 py-1 rounded-sm shadow-md backdrop-blur-sm border border-slate-800 pointer-events-auto hidden md:block">
              GRID: {selectedIssue ? `${selectedIssue.lat.toFixed(4)}° N / ${selectedIssue.lng.toFixed(4)}° E` : "19.1176° N / 72.8461° E"} · EPSG:4326
            </div>
          </div>

          {!mapboxToken ? (
            <div className="flex items-center justify-center h-full bg-slate-100">
              <div className="text-center p-6">
                <AlertTriangle className="mx-auto text-amber-500 mb-2" size={32} />
                <h3 className="font-bold text-slate-800 text-sm">Mapbox Token Missing</h3>
                <p className="text-xs text-slate-500 mt-1">Please set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local</p>
              </div>
            </div>
          ) : (
            <Map
              ref={mapRef}
              mapboxAccessToken={mapboxToken}
              initialViewState={{
                longitude: displayList[0]?.lng ?? 72.8461,
                latitude: displayList[0]?.lat ?? 19.1176,
                zoom: 13,
              }}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/light-v11"
            >
              <NavigationControl position="top-right" style={{ marginTop: 45 }} />
              <FullscreenControl position="top-right" />

              {/* Heatmap Layer */}
              {viewMode === "heatmap" && (
                <Source type="geojson" data={geojsonHeatmapData}>
                  <Layer
                    id="issues-heat"
                    type="heatmap"
                    paint={{
                      "heatmap-weight": ["get", "weight"],
                      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
                      "heatmap-color": [
                        "interpolate",
                        ["linear"],
                        ["heatmap-density"],
                        0, "rgba(33,102,172,0)",
                        0.2, "rgb(103,169,207)",
                        0.4, "rgb(209,229,240)",
                        0.6, "rgb(253,219,199)",
                        0.8, "rgb(239,138,98)",
                        1, "rgb(178,24,43)",
                      ],
                      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 4, 9, 35],
                      "heatmap-opacity": 0.85,
                    }}
                  />
                </Source>
              )}

              {/* Pin Markers */}
              {viewMode === "pins" &&
                filteredIssues.map((issue) => {
                  const isSelected = selectedIssue?.id === issue.id;
                  const isCritical = issue.priority_score >= 80;
                  const isResolved = issue.status === "resolved";

                  return (
                    <Marker
                      key={issue.id}
                      longitude={issue.lng}
                      latitude={issue.lat}
                      anchor="bottom"
                      onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        focusOnIssue(issue);
                      }}
                    >
                      <div className="flex flex-col items-center cursor-pointer group">
                        {/* Interactive Tooltip Bubble on Selected Marker (Matches User's Rough UI) */}
                        {isSelected && (
                          <div className="mb-1.5 px-2.5 py-1 bg-slate-900 text-white rounded shadow-xl border border-slate-700 text-left min-w-[160px] animate-fade-in pointer-events-none">
                            <div className="flex items-center justify-between gap-1 text-[9px] font-mono font-bold text-amber-400">
                              <span>{issue.ticket_no}</span>
                              <span className={isCritical ? "text-red-400" : "text-slate-300"}>
                                {isCritical ? "CRITICAL" : "ACTIVE"}
                              </span>
                            </div>
                            <div className="text-[11px] font-bold text-white leading-tight truncate mt-0.5">
                              {issue.title}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                              Sector 14 · {issue.report_count} reports
                            </div>
                          </div>
                        )}

                        {/* Pin Button */}
                        <div
                          className={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold shadow-md border-2 transition-transform group-hover:scale-110 ${
                            isSelected
                              ? "scale-110 ring-2 ring-amber-500 ring-offset-2 ring-offset-white"
                              : ""
                          } ${
                            isResolved
                              ? "bg-emerald-600 border-white text-white"
                              : isCritical
                              ? "bg-amber-600 border-white text-white"
                              : "bg-amber-500 border-white text-slate-900"
                          }`}
                        >
                          {isResolved ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <span>{CAT_ICON[issue.category] || "⚠️"}</span>
                          )}
                        </div>

                        {/* Marker Stem */}
                        <div
                          className={`w-0.5 h-2 ${
                            isResolved
                              ? "bg-emerald-600"
                              : isCritical
                              ? "bg-amber-600"
                              : "bg-slate-500"
                          }`}
                        />
                      </div>
                    </Marker>
                  );
                })}
            </Map>
          )}

          {/* Bottom HUD Bar & Legend */}
          <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Status Legend */}
            <div className="bg-slate-900/90 text-white text-[11px] px-3.5 py-1.5 rounded-sm shadow-md backdrop-blur-sm border border-slate-800 flex items-center gap-4 pointer-events-auto">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold">
                SHOWING: {filteredIssues.length} PINS
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Active Issue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Completed SLA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                <span>Escalated / Critical</span>
              </div>
            </div>

            {/* Crew Status Pill */}
            <div className="bg-slate-900/90 text-amber-400 text-[10px] font-mono font-bold px-3 py-1.5 rounded-sm shadow-md backdrop-blur-sm border border-slate-800 flex items-center gap-1.5 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              PUBLIC WORKS CREW 04 EN ROUTE
            </div>
          </div>
        </div>

        {/* ── RIGHT INSPECTOR SIDEBAR (Matches User's Exact Layout) ── */}
        <div className="w-96 bg-white border-l border-slate-200 overflow-y-auto shrink-0 shadow-lg flex flex-col justify-between">
          {selectedIssue ? (
            <div className="p-5 space-y-4">
              {/* Top Row: Ticket ID + Status Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-sm border border-slate-200">
                    {selectedIssue.ticket_no} · Ward 14
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border capitalize ${
                      selectedIssue.status === "resolved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedIssue.priority_score >= 80
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {selectedIssue.status === "reported" ? "Pending" : selectedIssue.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedIssue.title}
                </h2>
              </div>

              {/* Big Geotagged Photo Container with Corner Bubble */}
              <div className="border border-slate-200 rounded-sm overflow-hidden bg-slate-950 relative group">
                <div className="relative w-full h-48 flex items-center justify-center bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedIssue.image_url}
                    alt={selectedIssue.title}
                    className={`w-full h-full transition-all duration-300 ${
                      imageFitMode === "contain" ? "object-contain" : "object-cover"
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80";
                    }}
                  />
                </div>

                {/* Corner Fit / Lightbox Bubble */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10">
                  <button
                    type="button"
                    onClick={() =>
                      setImageFitMode((prev) => (prev === "cover" ? "contain" : "cover"))
                    }
                    className="p-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full text-[10px] backdrop-blur-sm border border-white/20 shadow transition cursor-pointer"
                    title="Fit to size (uncropped)"
                  >
                    {imageFitMode === "cover" ? (
                      <Minimize2 size={11} className="text-amber-400" />
                    ) : (
                      <Maximize2 size={11} className="text-amber-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full backdrop-blur-sm border border-white/20 shadow transition cursor-pointer"
                    title="Open Fullscreen Modal"
                  >
                    <Eye size={11} className="text-amber-400" />
                  </button>
                </div>

                {/* Geotag Overlay Pill on Photo */}
                <div className="absolute bottom-2 left-2 bg-slate-900/85 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded-sm backdrop-blur-sm border border-white/10 flex items-center gap-1">
                  <MapPin size={9} className="text-amber-400" />
                  <span>
                    GEOTAG VERIFIED • {selectedIssue.lat.toFixed(4)}, {selectedIssue.lng.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Description Paragraph */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedIssue.description}
              </p>

              {/* Metadata Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                  {CAT_LABEL[selectedIssue.category] || "Roads & Drainage"}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm border ${
                    selectedIssue.priority_score >= 80
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {selectedIssue.priority_score >= 80 ? "Critical Severity" : "Routine Priority"}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600 border border-slate-200">
                  Zone 4
                </span>
              </div>

              {/* Location & Reporter Info */}
              <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-amber-600 shrink-0" />
                  <span className="font-medium text-slate-800">
                    MG Road, Junction 4, Sector 14
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span>
                    Reported by Citizen Ward Watch · {new Date(selectedIssue.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <Link
                href={`/issues/${selectedIssue.id}`}
                className="flex items-center justify-center gap-1.5 w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 rounded-sm text-xs transition shadow-sm"
              >
                View Full Issue Details <ArrowRight size={14} />
              </Link>

              {/* ── NEXT ADJACENT INCIDENT CARD (Matches User's Rough UI) ── */}
              {adjacentIssue && (
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    <span>NEXT ADJACENT INCIDENT</span>
                    <span className="text-emerald-600 font-mono font-bold">
                      {adjacentIssue.distanceMeters}m AWAY
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-sm p-3 hover:border-amber-300 transition">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {adjacentIssue.item.title}
                      </h4>
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 shrink-0">
                        {adjacentIssue.item.priority_score >= 80 ? "High" : "Low"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                      {adjacentIssue.item.description}
                    </p>

                    <button
                      type="button"
                      onClick={() => focusOnIssue(adjacentIssue.item)}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                    >
                      Focus on Map →
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Click any pin on the map to inspect incident details.
            </div>
          )}
        </div>
      </div>

      {/* ── 4. FULLSCREEN HD LIGHTBOX MODAL ── */}
      {isLightboxOpen && selectedIssue && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full flex flex-col bg-slate-900 rounded-sm border border-slate-800 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400">
                  {selectedIssue.ticket_no}
                </span>
                <span className="text-sm font-bold truncate max-w-md">
                  {selectedIssue.title}
                </span>
              </div>
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center p-3 min-h-[400px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedIssue.image_url}
                alt={selectedIssue.title}
                className="max-h-[72vh] max-w-full object-contain rounded-sm"
              />
            </div>

            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                📍 GPS Coordinates: {selectedIssue.lat.toFixed(6)}° N, {selectedIssue.lng.toFixed(6)}° E
              </span>
              <span>Ward 14 Dispatch Telemetry</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
