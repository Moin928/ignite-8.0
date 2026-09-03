import { supabaseAdmin } from "@/lib/db";
import { AlertTriangle, Clock, CheckCircle2, XCircle, MapPin, Users, Search } from "lucide-react";
import Link from "next/link";
import AutoTriageButton from "./AutoTriageButton";
import { parsePostGISPoint, reverseGeocode } from "@/utils/geo";

export const dynamic = "force-dynamic";

const CAT_ICON: Record<string, string> = {
  pothole: "🕳️",
  garbage: "🗑️",
  streetlight: "💡",
  water_leakage: "💧",
  road_damage: "🚧",
  other: "⚠️",
};

const STATUS_CONFIG: Record<string, { label: string; pill: string; dot: string }> = {
  reported:    { label: "Pending",     pill: "bg-amber-100 text-amber-900 border-amber-300",   dot: "bg-amber-500" },
  assigned:    { label: "Assigned",    pill: "bg-blue-100 text-blue-900 border-blue-300",       dot: "bg-blue-500" },
  in_progress: { label: "In Progress", pill: "bg-orange-100 text-orange-900 border-orange-300", dot: "bg-orange-500" },
  repaired:    { label: "Repaired",    pill: "bg-teal-100 text-teal-900 border-teal-300",       dot: "bg-teal-500" },
  resolved:    { label: "Resolved",    pill: "bg-emerald-100 text-emerald-900 border-emerald-300", dot: "bg-emerald-500" },
  rejected:    { label: "Rejected",    pill: "bg-red-100 text-red-800 border-red-300",          dot: "bg-red-500" },
};

const SEV_CONFIG: Record<number, { label: string; cls: string }> = {
  0: { label: "Low",      cls: "bg-slate-100 text-slate-600" },
  1: { label: "Low",      cls: "bg-slate-100 text-slate-600" },
  2: { label: "Medium",   cls: "bg-amber-100 text-amber-800" },
  3: { label: "High",     cls: "bg-red-100 text-red-700" },
};

function getSeverityBand(score: number) {
  if (score >= 80) return SEV_CONFIG[3];
  if (score >= 50) return SEV_CONFIG[2];
  return SEV_CONFIG[0];
}

function getSLA(createdAt: string) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - created.getTime()) / 3600000);
  const slaH = 72;
  const remaining = slaH - diffH;
  if (remaining <= 0) return { label: "SLA Breached", cls: "text-red-600 font-bold" };
  if (remaining <= 24) return { label: `${remaining}h left`, cls: "text-orange-600 font-bold" };
  return { label: `${Math.floor(remaining / 24)}d ${remaining % 24}h left`, cls: "text-slate-500" };
}

import { runAutoDeduplication } from "@/utils/autoDedup";

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Automatically merge duplicates in real-time
  await runAutoDeduplication();

  const { status: statusFilter } = await searchParams;

  let query = supabaseAdmin
    .from("issues")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: rawIssues, error } = await query;
  if (error) console.error(error.message);

  // Decode PostGIS EWKB locations and perform real reverse geocoding
  const displayIssues = await Promise.all(
    (rawIssues || []).map(async (issue) => {
      const coords = parsePostGISPoint(issue.location);
      const lat = coords?.lat ?? 12.9716;
      const lng = coords?.lng ?? 77.5946;
      const address = await reverseGeocode(lng, lat);

      return {
        ...issue,
        address,
        lat,
        lng,
      };
    })
  );

  // Count by status
  const { data: counts } = await supabaseAdmin
    .from("issues")
    .select("status");

  const countMap: Record<string, number> = {};
  (counts || []).forEach((r) => {
    countMap[r.status as string] = (countMap[r.status as string] || 0) + 1;
  });

  const TABS = [
    { key: "all",        label: "All",         count: Object.values(countMap).reduce((a, b) => a + b, 0) },
    { key: "reported",   label: "Pending",      count: countMap["reported"] || 0 },
    { key: "assigned",   label: "Assigned",     count: countMap["assigned"] || 0 },
    { key: "in_progress",label: "In Progress",  count: countMap["in_progress"] || 0 },
    { key: "repaired",   label: "Repaired",     count: countMap["repaired"] || 0 },
    { key: "resolved",   label: "Resolved",     count: countMap["resolved"] || 0 },
  ];

  const activeTab = statusFilter || "all";

  return (
    <div className="p-7 space-y-5 max-w-6xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manage Issues &amp; Grievances</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Municipal complaints registry · Live geotagged feed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-sm border border-emerald-200 font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Auto-Deduplication Active
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-0">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/issues" : `/issues?status=${tab.key}`}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === tab.key
                ? "border-amber-500 text-amber-800 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                activeTab === tab.key
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Cards Grid */}
      {displayIssues.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-sm p-12 text-center">
          <MapPin className="mx-auto text-slate-300 mb-3" size={32} />
          <p className="text-slate-600 font-bold text-sm">No issues match the selected filter.</p>
          <p className="text-slate-400 text-xs mt-1">Issues will appear here live once citizen reports are received.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayIssues.map((issue) => {
            const sc = STATUS_CONFIG[issue.status as string] || STATUS_CONFIG["reported"];
            const sev = getSeverityBand(issue.priority_score as number || 0);
            const sla = getSLA(issue.created_at as string);

            return (
              <Link
                key={issue.id as string}
                href={`/issues/${issue.id}`}
                className="block bg-white border border-slate-200 rounded-sm shadow-sm hover:shadow-md hover:border-amber-300 transition-all group"
              >
                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none">
                        {CAT_ICON[issue.category as string] || "⚠️"}
                      </span>
                      <span className="text-xs text-slate-500 capitalize font-bold">
                        {(issue.category as string || "").replace("_", " ")}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-sm border font-bold ${sc.pill}`}
                    >
                      {sc.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1.5 group-hover:text-amber-700 transition-colors line-clamp-2">
                    {issue.title as string}
                  </h3>

                  {/* Real Location */}
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-3 truncate">
                    <MapPin size={12} className="text-amber-600 shrink-0" />
                    <span className="truncate font-medium">
                      {issue.address || "Location recorded"}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold capitalize border border-slate-200">
                      {(issue.category as string || "other").replace("_", " ")}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${sev.cls}`}>
                      {sev.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                      #{issue.id.substring(0, 4).toUpperCase()}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-xs">
                      <Clock size={11} className={sla.cls} />
                      <span className={`text-[11px] ${sla.cls}`}>
                        SLA: {sla.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>
                        {new Date(issue.created_at as string).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <Users size={11} />
                        {issue.report_count as number || 1}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Priority Score Bar */}
                <div className="h-1 rounded-b overflow-hidden bg-slate-100">
                  <div
                    className={`h-full ${
                      (issue.priority_score as number) >= 80
                        ? "bg-red-500"
                        : (issue.priority_score as number) >= 50
                        ? "bg-amber-500"
                        : "bg-slate-300"
                    }`}
                    style={{ width: `${Math.min(100, (issue.priority_score as number) || 0)}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
