"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Users,
  Search,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  X,
} from "lucide-react";

export type IssueItem = {
  id: string;
  ticket_no: string;
  title: string;
  category: string;
  status: string;
  priority_score: number;
  report_count: number;
  description: string;
  created_at: string;
  address: string;
  lat: number;
  lng: number;
  image_url?: string;
};

const CAT_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  pothole: { label: "Pothole", icon: "🕳️", color: "text-amber-600 bg-amber-50 border-amber-200" },
  water_leakage: { label: "Water Leak", icon: "💧", color: "text-sky-600 bg-sky-50 border-sky-200" },
  garbage: { label: "Garbage", icon: "🗑️", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  streetlight: { label: "Streetlight", icon: "💡", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  road_damage: { label: "Road Damage", icon: "🚧", color: "text-rose-600 bg-rose-50 border-rose-200" },
  other: { label: "Civic Issue", icon: "⚠️", color: "text-slate-600 bg-slate-50 border-slate-200" },
};

const STATUS_CONFIG: Record<string, { label: string; pill: string }> = {
  reported: { label: "Pending", pill: "bg-amber-50 text-amber-800 border-amber-200" },
  assigned: { label: "Assigned", pill: "bg-blue-50 text-blue-800 border-blue-200" },
  in_progress: { label: "In Progress", pill: "bg-orange-50 text-orange-800 border-orange-200" },
  repaired: { label: "Repaired", pill: "bg-teal-50 text-teal-800 border-teal-200" },
  resolved: { label: "Resolved", pill: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  rejected: { label: "Rejected", pill: "bg-red-50 text-red-800 border-red-200" },
};

function getSeverityBadge(score: number) {
  if (score >= 80) return { label: "Critical", cls: "bg-red-50 text-red-700 border-red-200 font-bold" };
  if (score >= 50) return { label: "Medium", cls: "bg-amber-50 text-amber-700 border-amber-200 font-semibold" };
  return { label: "Low", cls: "bg-slate-100 text-slate-600 border-slate-200 font-medium" };
}

interface IssuesClientProps {
  initialIssues: IssueItem[];
  countMap: Record<string, number>;
  initialStatus?: string;
}

export default function IssuesClient({
  initialIssues,
  countMap,
  initialStatus = "all",
}: IssuesClientProps) {
  const [activeTab, setActiveTab] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "priority" | "reports">("priority");
  const [viewLayout, setViewLayout] = useState<"grid" | "list">("grid");

  const activeTotalCount = useMemo(() => {
    return Object.entries(countMap)
      .filter(([status]) => status !== "resolved" && status !== "rejected")
      .reduce((a, [, b]) => a + b, 0);
  }, [countMap]);

  const TABS = [
    { key: "all", label: "Active Grievances", count: activeTotalCount },
    { key: "reported", label: "Pending", count: countMap["reported"] || 0 },
    { key: "assigned", label: "Assigned", count: countMap["assigned"] || 0 },
    { key: "in_progress", label: "In Progress", count: countMap["in_progress"] || 0 },
    { key: "repaired", label: "Repaired", count: countMap["repaired"] || 0 },
    { key: "resolved", label: "Resolved", count: countMap["resolved"] || 0 },
  ];

  // Filter and sort issues dynamically
  const filteredIssues = useMemo(() => {
    return initialIssues
      .filter((item) => {
        // Tab filter
        if (activeTab === "all") {
          if (item.status === "resolved") return false;
        } else {
          if (item.status !== activeTab) return false;
        }

        // Category filter
        if (selectedCategory !== "all" && item.category !== selectedCategory) {
          return false;
        }

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchTicket = item.ticket_no.toLowerCase().includes(q);
          const matchAddress = (item.address || "").toLowerCase().includes(q);
          const matchDesc = (item.description || "").toLowerCase().includes(q);
          if (!matchTitle && !matchTicket && !matchAddress && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          return (b.priority_score || 0) - (a.priority_score || 0);
        }
        if (sortBy === "reports") {
          return (b.report_count || 0) - (a.report_count || 0);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [initialIssues, activeTab, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* ── 1. Page Header & Executive KPI Metric Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Issues &amp; Grievances
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Municipal triage console · Live citizen telemetry &amp; automated dispatch
          </p>
        </div>

        {/* Quick KPI Stats Summary Cards */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 text-center shadow-2xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active Total
            </div>
            <div className="text-lg font-black text-slate-900">{activeTotalCount}</div>
          </div>
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl px-4 py-2 text-center shadow-2xs">
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Pending
            </div>
            <div className="text-lg font-black text-amber-900">{countMap["reported"] || 0}</div>
          </div>
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl px-4 py-2 text-center shadow-2xs">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              In Progress
            </div>
            <div className="text-lg font-black text-blue-900">{countMap["in_progress"] || 0}</div>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl px-4 py-2 text-center shadow-2xs">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Resolved
            </div>
            <div className="text-lg font-black text-emerald-900">{countMap["resolved"] || 0}</div>
          </div>
        </div>
      </div>

      {/* ── 2. Filter Tabs & Category Bar ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Status Tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100 text-xs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-slate-700 text-amber-400" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search + Category Chips + Sort + Layout Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, ticket #, or street location..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
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

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 focus:outline-none cursor-pointer transition"
              >
                <option value="all">All Categories</option>
                <option value="pothole">🕳️ Potholes</option>
                <option value="water_leakage">💧 Water Leakage</option>
                <option value="garbage">🗑️ Garbage</option>
                <option value="streetlight">💡 Streetlights</option>
                <option value="road_damage">🚧 Road Damage</option>
                <option value="other">⚠️ Other</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-3 pr-8 py-2 text-xs font-bold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 focus:outline-none cursor-pointer transition"
              >
                <option value="priority">Sort: Highest Priority</option>
                <option value="newest">Sort: Newest First</option>
                <option value="reports">Sort: Most Reports</option>
              </select>
            </div>

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewLayout("grid")}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewLayout === "grid"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout("list")}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewLayout === "list"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="List View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Content Display: Grid vs High-Density List ── */}
      {filteredIssues.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
          <ShieldCheck size={36} className="mx-auto text-emerald-500 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No issues found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {activeTab === "resolved"
              ? "Resolved complaints will appear in this archive once field squads complete repairs."
              : "No complaints match your current search and filter criteria."}
          </p>
        </div>
      ) : viewLayout === "grid" ? (
        /* ── GRID CARD VIEW ── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredIssues.map((issue) => {
            const sc = STATUS_CONFIG[issue.status] || STATUS_CONFIG.reported;
            const cat = CAT_CONFIG[issue.category] || CAT_CONFIG.other;
            const sev = getSeverityBadge(issue.priority_score);

            return (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="group bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Category + Ticket + Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{cat.icon}</span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {issue.ticket_no}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${sev.cls}`}>
                        {sev.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${sc.pill}`}>
                        {sc.label}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-amber-700 transition-colors line-clamp-2 mb-2">
                    {issue.title}
                  </h3>

                  {/* Address Location */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 truncate">
                    <MapPin size={13} className="text-amber-600 shrink-0" />
                    <span className="truncate font-medium">{issue.address || "Location recorded"}</span>
                  </div>
                </div>

                {/* Bottom Footer Metadata */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-2">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Clock size={12} className="text-slate-400" />
                    <span>
                      {new Date(issue.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md">
                      <Users size={11} className="text-amber-600" />
                      {issue.report_count} {issue.report_count === 1 ? "report" : "reports"}
                    </span>
                    <span className="text-slate-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5">
                      <ChevronRight size={15} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* ── HIGH-DENSITY TABLE / LIST VIEW ── */
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
          {filteredIssues.map((issue) => {
            const sc = STATUS_CONFIG[issue.status] || STATUS_CONFIG.reported;
            const cat = CAT_CONFIG[issue.category] || CAT_CONFIG.other;
            const sev = getSeverityBadge(issue.priority_score);

            return (
              <Link
                key={issue.id}
                href={`/issues/${issue.id}`}
                className="p-4 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-3 group"
              >
                {/* Left Side: Ticket + Title + Location */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="text-xl p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                    {cat.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {issue.ticket_no}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 capitalize">
                        {cat.label}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-amber-700 transition-colors truncate">
                      {issue.title}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 truncate">
                      <MapPin size={12} className="text-amber-600 shrink-0" />
                      <span className="truncate">{issue.address || "Location recorded"}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Badges + Timestamp + Action */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${sev.cls}`}>
                    {sev.label}
                  </span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${sc.pill}`}>
                    {sc.label}
                  </span>
                  <div className="text-xs text-slate-500 flex items-center gap-1 min-w-[75px]">
                    <Clock size={12} className="text-slate-400" />
                    <span>
                      {new Date(issue.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded-md text-xs">
                    <Users size={12} className="text-amber-600" />
                    <span>{issue.report_count}</span>
                  </div>
                  <span className="text-slate-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-1 pl-1">
                    <ChevronRight size={16} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
