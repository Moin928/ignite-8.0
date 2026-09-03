"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Search,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  Users,
  CheckCircle2,
  AlertOctagon,
  Maximize2,
  Minimize2,
  Eye,
  X,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";

export type IssueItem = {
  id: string;
  ticket_no: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority_score: number;
  report_count: number;
  location_desc: string;
  city_region: string;
  lat: number;
  lng: number;
  created_at: string;
  time_ago: string;
  image_url: string;
  uploader_label: string;
};

type Props = {
  initialIssues: IssueItem[];
  stats: {
    critical: number;
    pending: number;
    dispatched: number;
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

export default function OverviewClient({ initialIssues, stats }: Props) {
  const [issues] = useState<IssueItem[]>(initialIssues);
  const [selectedId, setSelectedId] = useState<string>(
    initialIssues[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [imageFitMode, setImageFitMode] = useState<"cover" | "contain">("cover");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Extract unique regions/cities for filter
  const regions = Array.from(
    new Set(issues.map((i) => i.city_region).filter(Boolean))
  );

  // Filter list
  const filteredIssues = issues.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location_desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ticket_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (catFilter !== "all" && item.category !== catFilter) return false;
    if (regionFilter !== "all" && item.city_region !== regionFilter) return false;
    return true;
  });

  const selectedIssue =
    issues.find((i) => i.id === selectedId) || issues[0] || null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Also trigger AI process-pending on refresh so any new mobile reports are clustered
      await fetch("/api/ai/process-pending", { method: "POST" });
    } catch {}
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 font-sans">
      {/* ── 1. Top KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical Active */}
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-4 border-t-4 border-t-red-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Critical Active
            </span>
            <span className="p-1.5 bg-red-50 text-red-600 rounded">
              <AlertOctagon size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black text-slate-900 leading-none">
              {stats.critical}
            </span>
            <span className="text-xs font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
              Priority &gt; 80
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Requires immediate inspection
          </p>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-4 border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Review
            </span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded">
              <Layers size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black text-slate-900 leading-none">
              {stats.pending}
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              In Registry
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Awaiting engineering review
          </p>
        </div>

        {/* Dispatched */}
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-4 border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Dispatched Crews
            </span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded">
              <Users size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black text-slate-900 leading-none">
              {stats.dispatched}
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              On-Site
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Active repair teams deployed
          </p>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm p-4 border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Resolved Today
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-3xl font-black text-slate-900 leading-none">
              {stats.resolvedToday}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Verified
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Photo verified closures
          </p>
        </div>
      </div>

      {/* ── 2. Split Workspace (Triage Feed + Minimalist Live Summary) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT COLUMN (5 cols): Triage List ── */}
        <div className="lg:col-span-5 space-y-2.5">
          {/* Controls Bar: Search + Region Dropdown + Refresh Button */}
          <div className="bg-white p-3 border border-slate-200 rounded-sm shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ticket, street, or issue..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-sm bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* State/City Region Dropdown */}
              <div className="relative">
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="appearance-none pl-2.5 pr-6 py-1.5 text-[11px] font-semibold border border-slate-300 rounded-sm bg-white text-slate-700 hover:border-slate-400 focus:outline-none cursor-pointer"
                >
                  <option value="all">🇮🇳 All India</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={11}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>

              {/* Refresh Feed Button */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1.5 border border-slate-300 rounded-sm hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition shrink-0"
                title="Refresh Feed from Supabase"
              >
                <RefreshCw
                  size={13}
                  className={isRefreshing ? "animate-spin text-amber-600" : ""}
                />
              </button>
            </div>

            {/* Category Quick Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
              {[
                { key: "all", label: "All" },
                { key: "pothole", label: "🕳️ Potholes" },
                { key: "water_leakage", label: "💧 Water" },
                { key: "garbage", label: "🗑️ Garbage" },
                { key: "streetlight", label: "💡 Lights" },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCatFilter(c.key)}
                  className={`px-2.5 py-1 rounded-sm text-[11px] font-semibold whitespace-nowrap transition border ${
                    catFilter === c.key
                      ? "bg-slate-900 text-amber-400 border-slate-900"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Issue Cards Stack */}
          <div className="space-y-2 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
            {filteredIssues.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-sm p-8 text-center text-slate-400 text-xs">
                No civic complaints found for this region/category.
              </div>
            ) : (
              filteredIssues.map((item) => {
                const isSelected = selectedIssue?.id === item.id;
                const isCritical = item.priority_score >= 80;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`bg-white rounded-sm p-3.5 transition-all cursor-pointer shadow-sm relative ${
                      isSelected
                        ? "border-2 border-amber-500 ring-1 ring-amber-400/40 bg-amber-50/15"
                        : "border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    {/* Top Row: Ticket ID + Score Badge + Time */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {item.ticket_no}
                        </span>
                        {isCritical ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                            Critical · {item.priority_score.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Score {item.priority_score.toFixed(0)}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-medium capitalize bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.category.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.time_ago}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 text-xs leading-snug mb-1">
                      <span className="mr-1">{CAT_ICON[item.category] || "⚠️"}</span>
                      {item.title}
                    </h3>

                    {/* Real Location (from Mapbox / Supabase) */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100 mt-2">
                      <span className="flex items-center gap-1 truncate max-w-[240px]">
                        <MapPin size={11} className="text-amber-600 shrink-0" />
                        <span className="truncate">{item.location_desc}</span>
                      </span>
                      <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                        {item.report_count} report{item.report_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (7 cols): Minimalist Live Summary (Quick View) ── */}
        <div className="lg:col-span-7">
          {selectedIssue ? (
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 space-y-4">
              {/* Header: Ticket ID + Priority Badge + City */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded-sm">
                    {selectedIssue.ticket_no}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-sm border ${
                      selectedIssue.priority_score >= 80
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {selectedIssue.priority_score >= 80
                      ? "CRITICAL HAZARD"
                      : "STANDARD GRIEVANCE"}
                  </span>
                  <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-sm border border-slate-200 font-medium">
                    {selectedIssue.city_region || "Municipal Ward"}
                  </span>
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  Reported {selectedIssue.time_ago}
                </div>
              </div>

              {/* Title & Real Location */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {selectedIssue.title}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                  <MapPin size={12} className="text-amber-500 shrink-0" />
                  <span>
                    {selectedIssue.location_desc} ·{" "}
                    <strong>{selectedIssue.report_count}</strong> merged citizen report
                    {selectedIssue.report_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* ── BIG PHOTO WITH CORNER FIT BUBBLE & LIGHTBOX ── */}
              <div className="border border-slate-200 rounded-sm overflow-hidden bg-slate-950 relative group">
                {/* Photo Display */}
                <div className="relative w-full h-80 flex items-center justify-center overflow-hidden bg-slate-950">
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

                {/* 🌟 FLOATING CORNER BUBBLE (Fit to size / Zoom fully visible) 🌟 */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                  {/* Toggle Fit to Size (Uncropped) */}
                  <button
                    type="button"
                    onClick={() =>
                      setImageFitMode((prev) =>
                        prev === "cover" ? "contain" : "cover"
                      )
                    }
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-white rounded-full text-[11px] font-semibold backdrop-blur-sm border border-white/20 shadow-lg transition cursor-pointer"
                    title={
                      imageFitMode === "cover"
                        ? "Fit entire photo (Full view uncropped)"
                        : "Fill view"
                    }
                  >
                    {imageFitMode === "cover" ? (
                      <>
                        <Minimize2 size={12} className="text-amber-400" />
                        <span>Fit Entire Photo</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 size={12} className="text-amber-400" />
                        <span>Fill View</span>
                      </>
                    )}
                  </button>

                  {/* Open HD Fullscreen Modal */}
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-1.5 bg-slate-900/90 hover:bg-slate-900 text-white rounded-full backdrop-blur-sm border border-white/20 shadow-lg transition cursor-pointer"
                    title="Open Fullscreen HD Lightbox"
                  >
                    <Eye size={13} className="text-amber-400" />
                  </button>
                </div>

                {/* Photo GPS & Source Caption */}
                <div className="px-3.5 py-2 bg-slate-900 text-slate-300 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    GPS: {selectedIssue.lat.toFixed(5)}° N, {selectedIssue.lng.toFixed(5)}° E
                  </span>
                  <span className="text-slate-400">{selectedIssue.uploader_label}</span>
                </div>
              </div>

              {/* Short Summary & Field Notes */}
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  INCIDENT SUMMARY & FIELD NOTES
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-sm p-3.5 text-xs text-slate-700 leading-relaxed">
                  {selectedIssue.description ||
                    "Citizen report logged with verified GPS coordinates and photo evidence. Triaged by municipal automated system."}
                </div>
              </div>

              {/* ── MINIMALIST ACTION FOOTER: ONLY REVIEW FULL ISSUE BUTTON ── */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Status: <strong className="uppercase text-slate-800">{selectedIssue.status.replace("_", " ")}</strong>
                </div>

                {/* Clean Button: Review Full Issue */}
                <Link
                  href={`/issues/${selectedIssue.id}`}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-sm text-xs shadow-sm transition"
                >
                  Review Full Issue & Evidence <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-sm p-12 text-center text-slate-400 text-xs">
              Select an issue from the left list to view its quick summary.
            </div>
          )}
        </div>
      </div>

      {/* ── 3. FULLSCREEN HD IMAGE LIGHTBOX MODAL ── */}
      {isLightboxOpen && selectedIssue && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full flex flex-col bg-slate-900 rounded-sm border border-slate-800 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
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

            {/* Uncropped Full Image */}
            <div className="flex-1 bg-black flex items-center justify-center p-3 min-h-[400px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedIssue.image_url}
                alt={selectedIssue.title}
                className="max-h-[72vh] max-w-full object-contain rounded-sm"
              />
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                📍 {selectedIssue.location_desc} ({selectedIssue.lat.toFixed(6)}° N, {selectedIssue.lng.toFixed(6)}° E)
              </span>
              <span>{selectedIssue.uploader_label}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
