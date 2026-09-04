"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Folder,
  Users,
  CheckCircle2,
  Search,
  ChevronDown,
  RefreshCw,
  ArrowRight,
  Maximize2,
  Minimize2,
  Eye,
  X,
  Send,
  MapPin,
  Clock,
  ExternalLink,
  Layers,
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

const CAT_ICON: Record<string, string> = {
  pothole: "🕳️",
  garbage: "🗑️",
  streetlight: "💡",
  water_leakage: "💧",
  road_damage: "🚧",
  other: "⚠️",
};

const CAT_LABEL: Record<string, string> = {
  pothole: "Pothole",
  water_leakage: "Water Leakage",
  streetlight: "Streetlight",
  garbage: "Garbage",
  road_damage: "Road Damage",
  other: "Other",
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

  // Filter issues
  const filteredIssues = issues.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ticket_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;
    if (priorityFilter === "critical") return item.priority_score >= 80;
    if (priorityFilter === "pending") return item.status === "reported";
    return true;
  });

  const selectedIssue =
    filteredIssues.find((i) => i.id === selectedId) || filteredIssues[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 font-sans bg-slate-50/50">
      {/* ── 1. Top Header: Title & Auto-sync Live Status ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Live Incident Dispatch &amp; Triage
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Public works resolution console · Real-time civic queue
          </p>
        </div>
      </div>

      {/* ── 2. KPI Metric Cards (4 Cards across) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Issues */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm relative">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Active Issues</span>
            <Folder size={16} className="text-slate-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 my-1">
            {stats.totalActive.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">Across Ward sectors</div>
        </div>

        {/* Critical (SLA < 4h) */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm border-t-2 border-t-amber-500 relative">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">
              Critical (SLA &lt; 4h)
            </span>
            <span className="text-amber-500 font-bold text-sm">✴</span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black text-slate-900">
              {stats.criticalCount}
            </span>
            <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              High Priority
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Requires immediate dispatch
          </div>
        </div>

        {/* Dispatched Crews */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm relative">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Dispatched Crews</span>
            <Users size={16} className="text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black text-slate-900">
              {stats.dispatchedCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Active
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Field teams on site</div>
        </div>

        {/* Resolved Today */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm relative">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Resolved Today</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black text-slate-900">
              {stats.resolvedToday}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              +8% vs avg
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Certified closures</div>
        </div>
      </div>

      {/* ── 3. Split Main Workspace (Left Priority List Cards + Right Active Docket Inspector) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT COLUMN (5 cols): Priority Grievance Queue ── */}
        <div className="lg:col-span-5 space-y-3">
          {/* Queue Search & Filters Bar */}
          <div className="bg-white p-3 border border-slate-200 rounded-sm shadow-sm flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search queue, street, or issue..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-sm bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="appearance-none pl-2.5 pr-6 py-1.5 text-xs font-semibold border border-slate-300 rounded-sm bg-white text-slate-700 hover:border-slate-400 focus:outline-none cursor-pointer"
              >
                <option value="all">All Issues</option>
                <option value="critical">Critical Only</option>
                <option value="pending">Pending</option>
              </select>
              <ChevronDown
                size={11}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* 🌟 PRIORITY LIST CARDS (Matches User's Exact Shared Design) 🌟 */}
          <div className="space-y-3 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
            {filteredIssues.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-sm p-8 text-center text-slate-400 text-xs">
                No active grievance records found.
              </div>
            ) : (
              filteredIssues.map((item) => {
                const isSelected = selectedIssue?.id === item.id;
                const isCritical = item.priority_score >= 80;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`bg-white rounded-sm p-4 transition-all cursor-pointer shadow-sm relative ${
                      isSelected
                        ? "border-2 border-amber-500 ring-1 ring-amber-400/40 bg-amber-50/15"
                        : "border border-slate-200 hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    {/* Line 1: Ticket ID + Score Badge + Category Tag + Time Ago */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {item.ticket_no}
                      </span>

                      {/* Score Pill */}
                      {isCritical ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                          Critical · {item.priority_score.toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Score {item.priority_score.toFixed(0)}
                        </span>
                      )}

                      {/* Category Badge */}
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {CAT_LABEL[item.category] || "Other"}
                      </span>

                      {/* Time Ago on Right */}
                      <span className="text-[11px] text-slate-400 font-medium ml-auto">
                        {item.time_ago}
                      </span>
                    </div>

                    {/* Line 2: Category Icon + Bold Title */}
                    <h3 className="font-bold text-slate-900 text-sm leading-snug flex items-center gap-1.5 my-2">
                      <span className="text-base leading-none">
                        {CAT_ICON[item.category] || "⚠️"}
                      </span>
                      <span className="truncate">{item.title}</span>
                    </h3>

                    {/* Line 3: Location on Left + Report Count Pill on Right */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                        <MapPin size={12} className="text-amber-600 shrink-0" />
                        <span className="truncate font-medium text-slate-600">
                          {item.location_address}
                        </span>
                      </div>

                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                        {item.report_count} reports
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (7 cols): Active Docket Inspector ── */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-sm shadow-sm p-5 space-y-4">
          {selectedIssue ? (
            <>
              {/* Header: Active Docket + Hazard Pill + SLA */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    Active Docket: {selectedIssue.ticket_no}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      selectedIssue.priority_score >= 80
                        ? "bg-amber-400 text-slate-950"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {selectedIssue.priority_score >= 80
                      ? "CRITICAL HAZARD"
                      : "ROUTINE DEFECT"}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Reported {selectedIssue.time_ago}
                </div>
              </div>

              {/* ── BIG PHOTO WITH CORNER FIT BUBBLE & LIGHTBOX ── */}
              <div className="border border-slate-200 rounded-sm overflow-hidden bg-slate-950 relative group">
                <div className="relative w-full h-64 flex items-center justify-center bg-slate-950">
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
                </div>

                {/* Corner Fit / Lightbox Bubble */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                  <button
                    type="button"
                    onClick={() =>
                      setImageFitMode((prev) =>
                        prev === "cover" ? "contain" : "cover",
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-900/85 hover:bg-slate-900 text-white rounded-full text-[11px] font-semibold backdrop-blur-sm border border-white/20 shadow transition cursor-pointer"
                    title="Fit to size (show full photo uncropped)"
                  >
                    {imageFitMode === "cover" ? (
                      <>
                        <Minimize2 size={11} className="text-amber-400" />
                        <span>Fit Entire Photo</span>
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
                    <Eye size={12} className="text-amber-400" />
                  </button>
                </div>

                {/* Photo Bottom Caption Bar with Google Maps Directions link */}
                <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                    <MapPin size={12} className="text-amber-600 shrink-0" />
                    <span className="truncate">
                      {selectedIssue.location_address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedIssue.lat},${selectedIssue.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-amber-700 rounded border border-slate-200 text-[10px] font-semibold transition"
                      title="Open Navigation in Google Maps"
                    >
                      <span>Google Maps</span>
                      <ExternalLink size={10} className="text-amber-600" />
                    </a>
                    <span className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-snug mb-1">
                  {selectedIssue.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedIssue.description}
                </p>
              </div>

              {/* Detail Grid / Municipal Case Metadata */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-sm p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">
                    Duplicate Clustering:
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedIssue.report_count} citizen report
                    {selectedIssue.report_count !== 1 ? "s" : ""} consolidated
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">
                    Designated Lead:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedIssue.lead_department}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">
                    Case Officer:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedIssue.case_officer}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {/* Review Full Issue Link Button */}
                <Link
                  href={`/issues/${selectedIssue.id}`}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-sm flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <span>Review Full Issue &amp; Evidence Ledger</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a docket from the left queue to view details.
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Fullscreen HD Lightbox Modal ── */}
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

            <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>📍 {selectedIssue.location_address}</span>
              <span>
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
