import { supabaseAdmin } from "@/lib/db";
import {
  Clock,
  ArrowUpRight,
  Layers,
  ClipboardList,
  Map,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

/* ── helpers ── */
const STATUS_PILL: Record<string, string> = {
  reported: "bg-amber-100 text-amber-800 border-amber-200",
  assigned: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-orange-100 text-orange-800 border-orange-200",
  repaired: "bg-teal-100 text-teal-800 border-teal-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const CAT_ICON: Record<string, string> = {
  pothole: "🕳️",
  garbage: "🗑️",
  streetlight: "💡",
  water_leakage: "💧",
  road_damage: "🚧",
  other: "⚠️",
};

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div
      className={`bg-white rounded border border-slate-200 shadow-sm p-5 border-t-4 ${accent}`}
    >
      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-black text-slate-900 mt-2 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-2">{sub}</p>}
    </div>
  );
}

export default async function OverviewPage() {
  const [critRes, resolvedRes, pendingRes, topRes] = await Promise.all([
    supabaseAdmin
      .from("issues")
      .select("id", { count: "exact", head: true })
      .in("status", ["reported", "assigned", "in_progress"])
      .gt("priority_score", 80),
    supabaseAdmin
      .from("issues")
      .select("id", { count: "exact", head: true })
      .eq("status", "resolved"),
    supabaseAdmin
      .from("issues")
      .select("id", { count: "exact", head: true })
      .eq("status", "reported"),
    supabaseAdmin
      .from("issues")
      .select(
        "id, title, category, status, priority_score, report_count, created_at"
      )
      .in("status", ["reported", "assigned", "in_progress"])
      .order("priority_score", { ascending: false })
      .limit(8),
  ]);

  const critical = critRes.count ?? 0;
  const resolved = resolvedRes.count ?? 0;
  const pending = pendingRes.count ?? 0;
  const topIssues = topRes.data || [];

  /* Recent activity mock – replace with real query in prod */
  const ACTIVITY = [
    { text: "Issue #082 assigned to Field Worker Ramesh K.", time: "2 min ago", color: "bg-blue-500" },
    { text: "Repair verified – Pothole at MG Road (AI: 94% match).", time: "18 min ago", color: "bg-emerald-500" },
    { text: "New critical issue flagged – Water Leakage, HSR Layout.", time: "34 min ago", color: "bg-red-500" },
    { text: "3 reports clustered → existing Issue #071 (Koramangala).", time: "1 hr ago", color: "bg-amber-500" },
  ];

  return (
    <div className="p-7 space-y-6 max-w-6xl mx-auto">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Authority Overview</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Real-time operational dashboard · Ward 14 Central Metro
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Critical Active" value={critical} sub="Priority score > 80" accent="border-t-red-500" />
        <StatCard label="Pending Review" value={pending} sub="Awaiting assignment" accent="border-t-amber-500" />
        <StatCard label="Resolved (All Time)" value={resolved} sub="Confirmed closures" accent="border-t-emerald-500" />
        <StatCard label="Avg Resolution" value="48h" sub="Estimated SLA target" accent="border-t-slate-400" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top priority issues table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
              <Layers size={15} className="text-amber-500" />
              Top Priority Issues
            </div>
            <Link
              href="/issues"
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
            >
              View all <ArrowUpRight size={12} />
            </Link>
          </div>

          <table className="w-full text-sm">
            <thead className="text-[11px] text-slate-400 uppercase tracking-wide border-b border-slate-100">
              <tr>
                <th className="px-5 py-2 text-left">Score</th>
                <th className="px-5 py-2 text-left">Issue</th>
                <th className="px-5 py-2 text-left">Reports</th>
                <th className="px-5 py-2 text-left">Status</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topIssues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">
                    No active issues. Submit a report to begin.
                  </td>
                </tr>
              ) : (
                topIssues.map((issue) => (
                  <tr key={issue.id as string} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <span
                        className={`font-black text-sm ${
                          (issue.priority_score as number) > 80
                            ? "text-red-600"
                            : "text-amber-600"
                        }`}
                      >
                        {(issue.priority_score as number || 0).toFixed(0)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900 truncate max-w-[220px]">
                        <span className="mr-1.5">
                          {CAT_ICON[issue.category as string] || "⚠️"}
                        </span>
                        {issue.title as string}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {issue.report_count as number || 1}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-sm font-semibold border ${
                          STATUS_PILL[issue.status as string] ||
                          "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {(issue.status as string || "").replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/issues/${issue.id}`}
                        className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Activity feed */}
        <div className="bg-white border border-slate-200 shadow-sm rounded overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50 font-semibold text-slate-800 text-sm">
            <Clock size={15} className="text-amber-500" />
            Recent Activity
          </div>
          <div className="p-4 space-y-3">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${a.color}`} />
                <div>
                  <p className="text-xs text-slate-700 leading-relaxed">{a.text}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="border-t border-slate-100 p-4 grid grid-cols-2 gap-2">
            <Link
              href="/issues"
              className="flex flex-col items-center justify-center gap-1 p-3 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition text-center"
            >
              <ClipboardList size={16} className="text-amber-400" />
              Manage Issues
            </Link>
            <Link
              href="/map"
              className="flex flex-col items-center justify-center gap-1 p-3 border border-slate-200 text-slate-700 rounded text-xs font-semibold hover:bg-slate-50 transition text-center"
            >
              <Map size={16} className="text-amber-500" />
              City Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


