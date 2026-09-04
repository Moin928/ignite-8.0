"use client";

import { useState, useRef, useMemo } from "react";
import Map, {
  Marker,
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
  Flame,
  X,
  ArrowRight,
  Maximize2,
  Minimize2,
  Eye,
  Navigation,
  Globe2,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Users,
} from "lucide-react";
import Link from "next/link";
import CustomMapPin from "./CustomMapPin";
import IndiaStateMap, { StateMetric, STATE_GEO_CONFIG } from "./IndiaStateMap";

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

const INDIAN_CITIES = [
  { label: "Bengaluru, KA", lat: 12.9716, lng: 77.5946, zoom: 12.5 },
  { label: "Mumbai, MH", lat: 19.076, lng: 72.8777, zoom: 12.5 },
  { label: "Delhi NCR", lat: 28.6139, lng: 77.209, zoom: 12.5 },
  { label: "Hyderabad, TS", lat: 17.385, lng: 78.4867, zoom: 12.5 },
  { label: "Pune, MH", lat: 18.5204, lng: 73.8567, zoom: 12.5 },
  { label: "Chennai, TN", lat: 13.0827, lng: 80.2707, zoom: 12.5 },
  { label: "All India", lat: 21.5, lng: 78.9, zoom: 4.5 },
];

function findNearestStateCode(lat: number, lng: number): string {
  let closestCode = "MH";
  let minD = Infinity;
  for (const [code, info] of Object.entries(STATE_GEO_CONFIG)) {
    const d = (lat - info.lat) ** 2 + (lng - info.lng) ** 2;
    if (d < minD) {
      minD = d;
      closestCode = code.toUpperCase();
    }
  }
  return closestCode;
}

const PAN_INDIA_DEMO: MapIssueItem[] = [
  // Maharashtra (Mumbai & Pune)
  {
    id: "m1",
    ticket_no: "#MUN-8821",
    title: "Severe Asphalt Cave-In & Water Seepage",
    category: "water_leakage",
    status: "reported",
    priority_score: 94,
    report_count: 5,
    description:
      "Underlying stormwater line leak caused rapid subsurface subsidence. Deep crater spans 1.8 meters across active traffic lane near municipal junction.",
    created_at: new Date().toISOString(),
    lng: 72.8461,
    lat: 19.1176,
    image_url:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "m2",
    ticket_no: "#MUN-8819",
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
    ticket_no: "#MUN-8801",
    title: "Flyover Approach Pothole Grid",
    category: "pothole",
    status: "reported",
    priority_score: 86,
    report_count: 7,
    description:
      "Cluster of 3 sharp asphalt depressions near western ascent ramp. Tyre puncture hazard during peak transit.",
    created_at: new Date(Date.now() - 80 * 60000).toISOString(),
    lng: 72.842,
    lat: 19.119,
    image_url:
      "https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "m4",
    ticket_no: "#MUN-8812",
    title: "Solid Waste Overflow at Market Culvert",
    category: "garbage",
    status: "reported",
    priority_score: 72,
    report_count: 4,
    description:
      "Unattended commercial refuse and construction bags blocking sidewalk corridor.",
    created_at: new Date(Date.now() - 130 * 60000).toISOString(),
    lng: 72.851,
    lat: 19.121,
    image_url:
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "m5",
    ticket_no: "#MUN-8809",
    title: "Streetlight Pole Outage – Sector 14",
    category: "streetlight",
    status: "assigned",
    priority_score: 58,
    report_count: 2,
    description:
      "Series of 2 sodium-vapor lamps flickering and dark near residential curve.",
    created_at: new Date(Date.now() - 200 * 60000).toISOString(),
    lng: 72.853,
    lat: 19.114,
    image_url:
      "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "m6",
    ticket_no: "#MUN-8788",
    title: "Storm Grate Replaced & Concrete Leveled",
    category: "other",
    status: "resolved",
    priority_score: 90,
    report_count: 6,
    description:
      "Cast iron manhole cover successfully installed and asphalt edge sealed by PWD team.",
    created_at: new Date(Date.now() - 400 * 60000).toISOString(),
    lng: 72.847,
    lat: 19.112,
    image_url:
      "https://images.unsplash.com/photo-1584463699039-4d6cb6ebffea?auto=format&fit=crop&w=1200&q=80",
  },

  // Karnataka (Bengaluru)
  {
    id: "m7",
    ticket_no: "#MUN-7740",
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
  {
    id: "m8",
    ticket_no: "#MUN-7738",
    title: "Deep Crater on Outer Ring Road",
    category: "pothole",
    status: "in_progress",
    priority_score: 85,
    report_count: 6,
    description: "Heavy vehicular impact damaged flyover descent lane.",
    created_at: new Date(Date.now() - 100 * 60000).toISOString(),
    lng: 77.6101,
    lat: 12.9352,
    image_url:
      "https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "m9",
    ticket_no: "#MUN-7720",
    title: "Indiranagar 100ft Road Streetlamp Fixed",
    category: "streetlight",
    status: "resolved",
    priority_score: 75,
    report_count: 4,
    description: "LED array rewired and tested functional.",
    created_at: new Date(Date.now() - 500 * 60000).toISOString(),
    lng: 77.6412,
    lat: 12.9784,
    image_url:
      "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80",
  },

  // Delhi NCR
  {
    id: "m10",
    ticket_no: "#MUN-6620",
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
  {
    id: "m11",
    ticket_no: "#MUN-6615",
    title: "Waste Accumulation at Lajpat Nagar Market",
    category: "garbage",
    status: "in_progress",
    priority_score: 70,
    report_count: 5,
    description: "MCD sanitation truck dispatched for clearing bulk trash.",
    created_at: new Date(Date.now() - 150 * 60000).toISOString(),
    lng: 77.241,
    lat: 28.568,
    image_url:
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80",
  },

  // Odisha (Bhubaneswar & Cuttack)
  {
    id: "m12",
    ticket_no: "#MUN-5510",
    title: "Janpath Drainage Overflow & Waterlogging",
    category: "water_leakage",
    status: "reported",
    priority_score: 88,
    report_count: 6,
    description: "Culvert blocked with plastic silt near Master Canteen square.",
    created_at: new Date().toISOString(),
    lng: 85.834,
    lat: 20.274,
    image_url:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "m13",
    ticket_no: "#MUN-5508",
    title: "Khandagiri Approach Pothole Repair Complete",
    category: "road_damage",
    status: "resolved",
    priority_score: 80,
    report_count: 5,
    description: "Patching completed with hot mix asphalt.",
    created_at: new Date(Date.now() - 300 * 60000).toISOString(),
    lng: 85.787,
    lat: 20.258,
    image_url:
      "https://images.unsplash.com/photo-1584463699039-4d6cb6ebffea?auto=format&fit=crop&w=1200&q=80",
  },

  // Tamil Nadu (Chennai)
  {
    id: "m14",
    ticket_no: "#MUN-4410",
    title: "Anna Salai Metro Corridor Pothole",
    category: "pothole",
    status: "in_progress",
    priority_score: 78,
    report_count: 3,
    description: "Asphalt subsidence near Teynampet signal.",
    created_at: new Date(Date.now() - 90 * 60000).toISOString(),
    lng: 80.245,
    lat: 13.042,
    image_url:
      "https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?auto=format&fit=crop&w=1200&q=80",
  },

  // Telangana (Hyderabad)
  {
    id: "m15",
    ticket_no: "#MUN-3310",
    title: "Hitec City Road Subsurface Leakage",
    category: "water_leakage",
    status: "reported",
    priority_score: 82,
    report_count: 4,
    description: "Underground pipeline rupture near Cyber Towers.",
    created_at: new Date().toISOString(),
    lng: 78.382,
    lat: 17.45,
    image_url:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80",
  },

  // Gujarat (Ahmedabad)
  {
    id: "m16",
    ticket_no: "#MUN-2210",
    title: "SG Highway Streetlight Feeder Fault",
    category: "streetlight",
    status: "assigned",
    priority_score: 62,
    report_count: 2,
    description: "Transformer trip caused blacked out junction.",
    created_at: new Date(Date.now() - 110 * 60000).toISOString(),
    lng: 72.507,
    lat: 23.033,
    image_url:
      "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80",
  },

  // West Bengal (Kolkata)
  {
    id: "m17",
    ticket_no: "#MUN-1110",
    title: "Park Street Sidewalk Garbage Heap Cleared",
    category: "garbage",
    status: "resolved",
    priority_score: 74,
    report_count: 8,
    description: "KMC conservancy unit cleared commercial waste bins.",
    created_at: new Date(Date.now() - 600 * 60000).toISOString(),
    lng: 88.353,
    lat: 22.551,
    image_url:
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80",
  },
];

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
  const [viewMode, setViewMode] = useState<"pins" | "india_states" | "density">("pins");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"inspector" | "queue">("inspector");
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
      return true;
    });
  }, [displayList, searchQuery, catFilter]);

  const selectedIssue =
    displayList.find((i) => i.id === selectedId) || filteredIssues[0] || displayList[0] || null;

  // Center on marker
  const focusOnIssue = (item: MapIssueItem) => {
    setSelectedId(item.id);
    setIsSidebarOpen(true);
    setSidebarTab("inspector");
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [item.lng, item.lat],
        zoom: 14.5,
        duration: 1000,
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
        duration: 1200,
        essential: true,
      });
    }
  };

  // Heatmap GeoJSON
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

  // Dynamic State metrics calculation for IndiaStateMap based strictly on actual tickets
  const stateMetrics: Record<string, StateMetric> = useMemo(() => {
    const metrics: Record<string, StateMetric> = {};

    for (const [code, info] of Object.entries(STATE_GEO_CONFIG)) {
      const upper = code.toUpperCase();
      metrics[upper] = {
        name: info.name,
        code: upper,
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        lat: info.lat,
        lng: info.lng,
        zoom: info.zoom,
        issues: [],
      };
    }

    displayList.forEach((issue) => {
      const stateCode = findNearestStateCode(issue.lat, issue.lng);
      const m = metrics[stateCode];
      if (m) {
        m.total += 1;
        if (issue.status === "resolved") {
          m.resolved += 1;
        } else if (issue.status === "in_progress") {
          m.inProgress += 1;
        } else {
          m.pending += 1;
        }
        m.issues?.push({
          id: issue.id,
          ticket_no: issue.ticket_no,
          title: issue.title,
          category: issue.category,
          status: issue.status,
          priority_score: issue.priority_score,
          report_count: issue.report_count,
          created_at: issue.created_at,
          lng: issue.lng,
          lat: issue.lat,
        });
      }
    });

    return metrics;
  }, [displayList]);

  return (
    <div className="relative w-full h-full font-sans bg-slate-100 overflow-hidden" style={{ height: "calc(100vh - 48px)" }}>
      {/* ── 1. Floating Top Glass Control Bar (Clean Industry-Standard UI) ── */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Island: Search & Category Filter */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-1.5 shadow-lg pointer-events-auto">
          {/* Search Box */}
          <div className="relative w-56 sm:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incidents or tickets..."
              className="w-full pl-8.5 pr-7 py-1.5 text-xs rounded-lg bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category Dropdown Filter */}
          <div className="relative">
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 focus:outline-none cursor-pointer transition"
            >
              <option value="all">All Categories ({displayList.length})</option>
              <option value="pothole">Potholes ({displayList.filter((i) => i.category === "pothole").length})</option>
              <option value="water_leakage">Water Leakage ({displayList.filter((i) => i.category === "water_leakage").length})</option>
              <option value="garbage">Garbage ({displayList.filter((i) => i.category === "garbage").length})</option>
              <option value="streetlight">Streetlights ({displayList.filter((i) => i.category === "streetlight").length})</option>
              <option value="road_damage">Road Damage ({displayList.filter((i) => i.category === "road_damage").length})</option>
            </select>
          </div>

          {/* Quick City Jumper */}
          {viewMode !== "india_states" && (
            <div className="relative">
              <select
                value={selectedCityIdx}
                onChange={(e) => handleCityChange(Number(e.target.value))}
                className="appearance-none pl-3 pr-7 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 focus:outline-none cursor-pointer transition"
              >
                {INDIAN_CITIES.map((city, idx) => (
                  <option key={city.label} value={idx}>
                    {city.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Center Island: Modern Segmented View Switcher */}
        <div className="flex items-center bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-1 shadow-lg pointer-events-auto">
          <button
            onClick={() => setViewMode("pins")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "pins"
                ? "bg-slate-900 text-amber-400 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <MapPin size={13} />
            <span>Street Pins</span>
          </button>
          <button
            onClick={() => setViewMode("india_states")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "india_states"
                ? "bg-slate-900 text-amber-400 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Globe2 size={13} />
            <span>State Heatmap</span>
          </button>
          <button
            onClick={() => setViewMode("density")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "density"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Flame size={13} />
            <span>Density</span>
          </button>
        </div>

        {/* Right Island: Compact Live Counter & Drawer Toggle */}
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-1.5 shadow-lg pointer-events-auto">
          {/* Live Summary Chips */}
          <div className="hidden md:flex items-center gap-2 px-2 text-xs font-bold">
            <span className="text-slate-900">{stats.open} Open</span>
            <span className="text-slate-300">·</span>
            <span className="text-amber-600">{stats.atRisk} Critical</span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-600">{stats.resolved} Resolved</span>
          </div>

          {/* Drawer Toggle */}
          {viewMode !== "india_states" && (
            <button
              onClick={() => setIsSidebarOpen((v) => !v)}
              className={`p-1.5 rounded-lg transition border text-xs font-bold flex items-center gap-1 cursor-pointer ${
                isSidebarOpen
                  ? "bg-slate-100 border-slate-300 text-slate-800"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
              }`}
              title={isSidebarOpen ? "Collapse Inspector" : "Open Inspector"}
            >
              <Layers size={14} />
              <span className="hidden sm:inline">{isSidebarOpen ? "Hide" : "Details"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Full-Bleed Map Canvas ── */}
      <div className="w-full h-full relative">
        {viewMode === "india_states" ? (
          /* Pan-India State Choropleth Heatmap */
          <div className="h-full w-full bg-slate-50 p-6 flex items-center justify-center pt-20">
            <IndiaStateMap
              stateMetrics={stateMetrics}
              onSelectState={(state) => {
                setViewMode("pins");
                if (mapRef.current) {
                  mapRef.current.flyTo({
                    center: [state.lng, state.lat],
                    zoom: state.zoom,
                    duration: 1200,
                  });
                }
              }}
            />
          </div>
        ) : (
          /* Street Mapbox View */
          <>
            {!mapboxToken ? (
              <div className="flex items-center justify-center h-full bg-slate-100">
                <div className="text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm">
                  <AlertTriangle className="mx-auto text-amber-500 mb-2" size={32} />
                  <h3 className="font-bold text-slate-800 text-sm">Mapbox Token Required</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment.
                  </p>
                </div>
              </div>
            ) : (
              <Map
                ref={mapRef}
                mapboxAccessToken={mapboxToken}
                initialViewState={{
                  longitude: displayList[0]?.lng ?? 77.5946,
                  latitude: displayList[0]?.lat ?? 12.9716,
                  zoom: 13,
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/light-v11"
              >
                <NavigationControl position="bottom-right" style={{ marginBottom: 20, marginRight: 20 }} />
                <FullscreenControl position="bottom-right" style={{ marginBottom: 95, marginRight: 20 }} />

                {/* Density Heatmap Layer */}
                {viewMode === "density" && (
                  <Source type="geojson" data={geojsonHeatmapData}>
                    <Layer
                      id="issues-heat"
                      type="heatmap"
                      paint={{
                        "heatmap-weight": ["get", "weight"],
                        "heatmap-intensity": [
                          "interpolate",
                          ["linear"],
                          ["zoom"],
                          0,
                          1,
                          9,
                          3,
                        ],
                        "heatmap-color": [
                          "interpolate",
                          ["linear"],
                          ["heatmap-density"],
                          0,
                          "rgba(33,102,172,0)",
                          0.2,
                          "rgb(103,169,207)",
                          0.4,
                          "rgb(209,229,240)",
                          0.6,
                          "rgb(253,219,199)",
                          0.8,
                          "rgb(239,138,98)",
                          1,
                          "rgb(178,24,43)",
                        ],
                        "heatmap-radius": [
                          "interpolate",
                          ["linear"],
                          ["zoom"],
                          0,
                          4,
                          9,
                          35,
                        ],
                        "heatmap-opacity": 0.85,
                      }}
                    />
                  </Source>
                )}

                {/* Custom Minimalist Map Pins */}
                {viewMode === "pins" &&
                  filteredIssues.map((issue) => {
                    const isSelected = selectedIssue?.id === issue.id;

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
                        <div className="relative group">
                          {/* Hover Tooltip */}
                          {isSelected && (
                            <div className="absolute bottom-full mb-3.5 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900/95 text-white rounded-lg shadow-2xl border border-slate-700/80 text-left min-w-[170px] animate-fade-in pointer-events-none z-50 backdrop-blur-sm">
                              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-400">
                                <span>{issue.ticket_no}</span>
                                <span className="text-slate-400 font-sans text-[9px]">{issue.report_count} reports</span>
                              </div>
                              <div className="text-xs font-bold text-white leading-snug truncate mt-0.5">
                                {issue.title}
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-slate-900/95" />
                            </div>
                          )}

                          <CustomMapPin
                            category={issue.category}
                            status={issue.status}
                            priorityScore={issue.priority_score}
                            isSelected={isSelected}
                          />
                        </div>
                      </Marker>
                    );
                  })}
              </Map>
            )}

            {/* Bottom Left Minimal Legend */}
            <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-md text-xs font-medium text-slate-600">
              <span className="text-[10px] uppercase font-bold text-slate-400">Legend</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Pothole</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                <span>Water Leak</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Garbage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
                <span>Light</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Road</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 3. Clean Slide-Over Inspector / Queue Drawer ── */}
      {viewMode !== "india_states" && isSidebarOpen && (
        <div className="absolute top-20 right-4 bottom-4 w-96 max-w-[calc(100vw-32px)] bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl z-30 flex flex-col justify-between overflow-hidden animate-slide-left">
          {/* Drawer Header & Tabs */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-bold">
              <button
                onClick={() => setSidebarTab("inspector")}
                className={`px-3 py-1 rounded-md transition ${
                  sidebarTab === "inspector"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Docket
              </button>
              <button
                onClick={() => setSidebarTab("queue")}
                className={`px-3 py-1 rounded-md transition ${
                  sidebarTab === "queue"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                List ({filteredIssues.length})
              </button>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title="Close Panel"
            >
              <X size={16} />
            </button>
          </div>

          {/* TAB 1: DOCKET INSPECTOR */}
          {sidebarTab === "inspector" && selectedIssue && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {/* Ticket No + Status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                  {selectedIssue.ticket_no}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                    selectedIssue.status === "resolved"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedIssue.priority_score >= 80
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {selectedIssue.status.replace("_", " ")}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-sm font-bold text-slate-900 leading-snug">
                {selectedIssue.title}
              </h2>

              {/* Photo Preview Container */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 relative group aspect-video">
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
                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                  <button
                    type="button"
                    onClick={() =>
                      setImageFitMode((prev) => (prev === "cover" ? "contain" : "cover"))
                    }
                    className="p-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-md text-[10px] backdrop-blur-sm border border-white/20 shadow transition cursor-pointer"
                  >
                    {imageFitMode === "cover" ? (
                      <Minimize2 size={12} className="text-amber-400" />
                    ) : (
                      <Maximize2 size={12} className="text-amber-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-md backdrop-blur-sm border border-white/20 shadow transition cursor-pointer"
                  >
                    <Eye size={12} className="text-amber-400" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                {selectedIssue.description}
              </p>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Category
                  </span>
                  <span className="font-bold text-slate-800 capitalize flex items-center gap-1 mt-0.5">
                    <span>{CAT_ICON[selectedIssue.category] || "⚠️"}</span>
                    <span>{selectedIssue.category.replace("_", " ")}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Reports
                  </span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Users size={12} className="text-amber-600" />
                    <span>{selectedIssue.report_count} citizen reports</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Priority Score
                  </span>
                  <span className="font-black text-slate-900 mt-0.5 block">
                    {selectedIssue.priority_score} / 100
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Logged On
                  </span>
                  <span className="font-medium text-slate-600 mt-0.5 block">
                    {new Date(selectedIssue.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INCIDENT QUEUE LIST */}
          {sidebarTab === "queue" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredIssues.map((item) => (
                <div
                  key={item.id}
                  onClick={() => focusOnIssue(item)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    selectedIssue?.id === item.id
                      ? "bg-amber-50/70 border-amber-400 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span className="font-mono font-bold text-slate-700">{item.ticket_no}</span>
                    <span className="font-bold text-amber-800">
                      {item.priority_score >= 80 ? "CRITICAL" : "ACTIVE"}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs leading-snug truncate">
                    {item.title}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                    <span className="capitalize">{item.category.replace("_", " ")}</span>
                    <span>{item.report_count} reports</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Drawer Actions Footer */}
          {sidebarTab === "inspector" && selectedIssue && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedIssue.lat},${selectedIssue.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Navigation size={12} />
                <span>Navigate on Google Maps</span>
                <ExternalLink size={11} />
              </a>

              <Link
                href={`/issues/${selectedIssue.id}`}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <span>Open Issue Ledger</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── 4. Fullscreen Image Lightbox Modal ── */}
      {isLightboxOpen && selectedIssue && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[85vh] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-3 right-3 z-10 p-2 bg-slate-900/80 text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedIssue.image_url}
              alt={selectedIssue.title}
              className="w-full h-full max-h-[80vh] object-contain"
            />
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs">
              <span className="font-bold">{selectedIssue.title}</span>
              <span className="font-mono text-amber-400">{selectedIssue.ticket_no}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
