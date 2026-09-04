"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Folder,
  Users,
  CheckCircle2,
  Search,
  ChevronDown,
  ArrowRight,
  Maximize2,
  Minimize2,
  Eye,
  X,
  MapPin,
  Clock,
  ExternalLink,
  Flame,
  ShieldCheck,
  Navigation,
} from "lucide-react";

export type DocketIssue = {
  id: string;
  ticket_no: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority_score: number;
  report_count: number;
  location_address: string;
  lat: number;
  lng: number;
  created_at: string;
  time_ago: string;
  image_url: string;
  lead_department: string;
  case_officer: string;
};

type Props = {
  initialIssues: DocketIssue[];
  stats: {
    totalActive: number;
    criticalCount: number;
    dispatchedCount: number;
    resolvedToday: number;
  };
};

const CAT_CONFIG: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  pothole: {
    label: "Pothole",
    icon: "🕳️",
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  water_leakage: {
    label: "Water Leak",
    icon: "💧",
    color: "text-sky-600 bg-sky-50 border-sky-200",
  },
  garbage: {
    label: "Garbage",
    icon: "🗑️",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  streetlight: {
    label: "Streetlight",
    icon: "💡",
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
  },
  road_damage: {
    label: "Road Damage",
    icon: "🚧",
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
  other: {
    label: "Civic Issue",
    icon: "⚠️",
    color: "text-slate-600 bg-slate-50 border-slate-200",
  },
};

const STATUS_CONFIG: Record<string, { label: string; pill: string }> = {
  reported: {
    label: "Pending",
    pill: "bg-amber-50 text-amber-800 border-amber-200",
  },
  assigned: {
    label: "Assigned",
    pill: "bg-blue-50 text-blue-800 border-blue-200",
  },
  in_progress: {
    label: "In Progress",
    pill: "bg-orange-50 text-orange-800 border-orange-200",
  },
  repaired: {
    label: "Repaired",
    pill: "bg-teal-50 text-teal-800 border-teal-200",
  },
  resolved: {
    label: "Resolved",
    pill: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    pill: "bg-red-50 text-red-800 border-red-200",
  },
};

export default function OverviewClient({ initialIssues, stats }: Props) {
  const [issues] = useState<DocketIssue[]>(initialIssues);
  const [selectedId, setSelectedId] = useState<string>(
    initialIssues[0]?.id || "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "critical" | "pending"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [imageFitMode, setImageFitMode] = useState<"cover" | "contain">(
    "cover",
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const router = useRouter();

  // Auto-refresh the feed every 1 minute in the background
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 60000);
    return () => clearInterval(interval);
  }, [router]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location_address
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        item.ticket_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (priorityFilter === "critical" && item.priority_score < 80)
        return false;
      if (priorityFilter === "pending" && item.status !== "reported")
        return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter)
        return false;
      return true;
    });
  }, [issues, searchQuery, priorityFilter, categoryFilter]);

  const selectedIssue =
    filteredIssues.find((i) => i.id === selectedId) ||
    filteredIssues[0] ||
    issues[0] ||
    null;

  return (
    <div className="p-6 md:p-4 max-w-7xl mx-auto space-y-6 font-sans">
      {/* ── 1. Top Header: Title & Subtitle ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Issue Overview
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Active incident queue · Consolidated citizen reports · Fast dispatch
          </p>
        </div>
      </div>

      {/* ── 2. KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
        {/* Total Active Issues */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Active
            </span>
            <span className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
              <Folder size={14} />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {stats.totalActive.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 font-medium">
            Across all municipal sectors
          </div>
        </div>

        {/* Critical Hazards */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Critical Hazards
            </span>
            <span className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
              <Flame size={14} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {stats.criticalCount}
            </span>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
              Priority &gt; 80
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5 font-medium">
            Requires immediate response
          </div>
        </div>

        {/* Dispatched Crews */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Dispatched Crews
            </span>
            <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
              <Users size={14} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {stats.dispatchedCount}
            </span>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
              Field Active
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5 font-medium">
            Squads currently on-site
          </div>
        </div>

        {/* Resolved Closures */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Resolved
            </span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={14} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {stats.resolvedToday}
            </span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
              Verified
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5 font-medium">
            Certified repairs completed
          </div>
        </div>
      </div>

      {/* ── 3. Main Workspace: Split Queue + Summary Inspector ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN (5 cols): Incident Queue ── */}
        <div className="lg:col-span-5 space-y-3">
          {/* Queue Search & Filter Bar */}
          <div className="bg-white p-3 border border-slate-200/90 rounded-2xl shadow-2xs space-y-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search queue, street, or ticket..."
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="w-full appearance-none pl-2.5 pr-7 py-1.5 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 focus:outline-none cursor-pointer transition"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical (80+)</option>
                  <option value="pending">Pending Triage</option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>

              <div className="relative flex-1">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full appearance-none pl-2.5 pr-7 py-1.5 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 focus:outline-none cursor-pointer transition"
                >
                  <option value="all">All Categories</option>
                  <option value="pothole">🕳️ Potholes</option>
                  <option value="water_leakage">💧 Water Leakage</option>
                  <option value="garbage">🗑️ Garbage</option>
                  <option value="streetlight">💡 Streetlights</option>
                  <option value="road_damage">🚧 Road Damage</option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* ── PRIORITY INCIDENT CARDS ── */}
          <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {filteredIssues.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs shadow-2xs">
                <ShieldCheck
                  size={28}
                  className="mx-auto text-emerald-500 mb-2"
                />
                <p className="font-bold text-slate-700">
                  No active grievance records found
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Try clearing filters or search terms.
                </p>
              </div>
            ) : (
              filteredIssues.map((item) => {
                const isSelected = selectedIssue?.id === item.id;
                const isCritical = item.priority_score >= 80;
                const cat = CAT_CONFIG[item.category] || CAT_CONFIG.other;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`bg-white rounded-2xl p-3.5 transition-all cursor-pointer shadow-2xs relative ${
                      isSelected
                        ? "border-2 border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/15"
                        : "border border-slate-200/90 hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    {/* Line 1: Ticket ID + Score Badge + Category Badge + Time Ago */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {item.ticket_no}
                      </span>

                      {/* Score Pill */}
                      {isCritical ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                          Critical · {item.priority_score.toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          Score {item.priority_score.toFixed(0)}
                        </span>
                      )}

                      {/* Category Badge */}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {cat.label}
                      </span>

                      {/* Time Ago */}
                      <span className="text-[11px] text-slate-400 font-medium ml-auto">
                        {item.time_ago}
                      </span>
                    </div>

                    {/* Line 2: Category Icon + Bold Title */}
                    <h3 className="font-bold text-slate-900 text-xs leading-snug flex items-center gap-1.5 my-1">
                      <span className="text-sm leading-none">{cat.icon}</span>
                      <span className="truncate">{item.title}</span>
                    </h3>

                    {/* Line 3: Location on Left + Report Count on Right */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                        <MapPin size={11} className="text-amber-600 shrink-0" />
                        <span className="truncate font-medium text-slate-600 text-[11px]">
                          {item.location_address || "Location recorded"}
                        </span>
                      </div>

                      <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                        {item.report_count}{" "}
                        {item.report_count === 1 ? "report" : "reports"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (7 cols): Summary & Docket Inspector ── */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl shadow-sm p-5 md:p-6 space-y-4">
          {selectedIssue ? (
            <>
              {/* Header: Active Docket + Hazard Pill + Timestamp */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    {selectedIssue.ticket_no}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      selectedIssue.priority_score >= 80
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {selectedIssue.priority_score >= 80
                      ? "Critical Hazard"
                      : "Routine Defect"}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Clock size={12} />
                  <span>Reported {selectedIssue.time_ago}</span>
                </div>
              </div>

              {/* Photo Preview (aspect-video) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 relative group aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedIssue.image_url}
                  alt={selectedIssue.title}
                  className={`w-full h-full transition-all duration-300 ${
                    imageFitMode === "contain"
                      ? "object-contain"
                      : "object-cover"
                  }`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80";
                  }}
                />

                {/* Corner Controls */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() =>
                      setImageFitMode((prev) =>
                        prev === "cover" ? "contain" : "cover",
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-900/85 hover:bg-slate-900 text-white rounded-full text-[11px] font-semibold backdrop-blur-sm border border-white/20 shadow transition cursor-pointer"
                    title="Fit entire photo"
                  >
                    {imageFitMode === "cover" ? (
                      <>
                        <Minimize2 size={11} className="text-amber-400" />
                        <span>Fit Photo</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 size={11} className="text-amber-400" />
                        <span>Fill View</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-1.5 bg-slate-900/85 hover:bg-slate-900 text-white rounded-full backdrop-blur-sm border border-white/20 shadow transition cursor-pointer"
                    title="Open Fullscreen HD Modal"
                  >
                    <Eye size={13} className="text-amber-400" />
                  </button>
                </div>

                {/* Photo Bottom Caption */}
                <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 bg-slate-900/85 rounded-xl backdrop-blur-md border border-white/10 flex items-center justify-between text-xs text-slate-200 font-medium">
                  <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                    <MapPin size={12} className="text-amber-400 shrink-0" />
                    <span className="truncate">
                      {selectedIssue.location_address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      GPS Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-snug mb-1.5">
                  {selectedIssue.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  {selectedIssue.description}
                </p>
              </div>

              {/* Summary Metadata Table */}
              <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Citizen Clustering
                  </span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <Users size={12} className="text-amber-600" />
                    <span>
                      {selectedIssue.report_count} citizen reports consolidated
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Priority Score
                  </span>
                  <span className="font-black text-slate-900 mt-0.5 block">
                    {selectedIssue.priority_score.toFixed(0)} / 100
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Designated Lead
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                    {selectedIssue.lead_department}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Case Officer
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                    {selectedIssue.case_officer}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedIssue.lat},${selectedIssue.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <Navigation size={13} />
                  <span>Google Maps</span>
                  <ExternalLink size={11} />
                </a>

                <Link
                  href={`/issues/${selectedIssue.id}`}
                  className="w-full sm:w-auto flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <span>Review Evidence Ledger</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select an incident docket from the left queue to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Fullscreen HD Lightbox Modal ── */}
      {isLightboxOpen && selectedIssue && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 text-white">
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
                className="p-1.5 text-slate-400 hover:text-white rounded-full transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[400px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedIssue.image_url}
                alt={selectedIssue.title}
                className="max-h-[72vh] max-w-full object-contain rounded-xl"
              />
            </div>

            <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <MapPin size={11} className="text-amber-400" />
                {selectedIssue.location_address}
              </span>
              <span className="font-mono text-[10px]">
                GPS: {selectedIssue.lat.toFixed(5)}° N,{" "}
                {selectedIssue.lng.toFixed(5)}° E
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
