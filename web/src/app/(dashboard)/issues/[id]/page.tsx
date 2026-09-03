import { supabaseAdmin } from "@/lib/db";
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  Users,
  Image as ImageIcon,
  ShieldCheck,
  AlertOctagon,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<string, { label: string; pill: string }> = {
  reported:    { label: "Pending",     pill: "bg-amber-100 text-amber-800 border-amber-300" },
  assigned:    { label: "Assigned",    pill: "bg-blue-100 text-blue-800 border-blue-300" },
  in_progress: { label: "In Progress", pill: "bg-orange-100 text-orange-800 border-orange-300" },
  repaired:    { label: "Repaired",    pill: "bg-teal-100 text-teal-800 border-teal-300" },
  resolved:    { label: "Resolved",    pill: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  rejected:    { label: "Rejected",    pill: "bg-red-100 text-red-700 border-red-300" },
};

const CAT_ICON: Record<string, string> = {
  pothole: "🕳️", garbage: "🗑️", streetlight: "💡",
  water_leakage: "💧", road_damage: "🚧", other: "⚠️",
};

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [issueRes, reportsRes, repairRes] = await Promise.all([
    supabaseAdmin.from("issues").select("*").eq("id", id).single(),
    supabaseAdmin.from("reports").select("*").eq("issue_id", id).order("created_at", { ascending: true }),
    supabaseAdmin.from("repairs").select("*").eq("issue_id", id).order("created_at", { ascending: false }).limit(1),
  ]);

  const issue = issueRes.data;
  const reports = reportsRes.data || [];
  const repair = repairRes.data?.[0] || null;

  if (!issue) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto text-amber-400 mb-3" size={32} />
        <p className="text-slate-600 font-medium">Issue not found.</p>
        <Link href="/issues" className="text-amber-600 text-sm mt-2 block hover:underline">← Back to Issues</Link>
      </div>
    );
  }

  const sc = STATUS_CONFIG[issue.status as string] || STATUS_CONFIG["reported"];
  const score = issue.priority_score as number || 0;
  const isCritical = score > 80;

  const WORKFLOW = [
    { key: "reported",    label: "Reported" },
    { key: "assigned",    label: "Assigned" },
    { key: "in_progress", label: "In Progress" },
    { key: "repaired",    label: "Repaired" },
    { key: "resolved",    label: "Resolved" },
  ];
  const currentStep = WORKFLOW.findIndex((w) => w.key === issue.status);

  return (
    <div className="p-7 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/issues" className="flex items-center gap-1 hover:text-amber-600 transition-colors">
          <ChevronLeft size={14} /> Issues
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-xs">{issue.title as string}</span>
      </div>

      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{CAT_ICON[issue.category as string] || "⚠️"}</span>
              <span className="text-xs text-slate-500 uppercase font-semibold tracking-wide">
                {(issue.category as string || "").replace("_", " ")}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-sm border font-semibold ml-1 ${sc.pill}`}>
                {sc.label}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-1">{issue.title as string}</h1>
            {issue.description && (
              <p className="text-sm text-slate-600 leading-relaxed">
                {issue.description as string}
              </p>
            )}
          </div>

          {/* Score badge */}
          <div className="text-center shrink-0">
            <div className={`text-3xl font-black ${isCritical ? "text-red-600" : "text-amber-500"}`}>
              {score.toFixed(0)}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide mt-0.5">
              Priority
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Reported</span>
            <span className="text-slate-800 font-medium">
              {new Date(issue.created_at as string).toLocaleString("en-IN", {
                day: "numeric", month: "short", year: "numeric"
              })}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Clustered Reports</span>
            <span className="text-slate-800 font-medium flex items-center gap-1.5">
              <Users size={14} className="text-amber-500" />
              {issue.report_count as number || 1} citizens
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">Assigned Worker</span>
            <span className="text-slate-800 font-medium">
              {issue.assigned_worker_id ? "Field Worker" : "Unassigned"}
            </span>
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="bg-white border border-slate-200 rounded shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Issue Lifecycle</h2>
        <div className="flex items-center">
          {WORKFLOW.map((step, idx) => {
            const done = idx <= currentStep;
            const active = idx === currentStep;
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    active ? "bg-amber-500 border-amber-500 text-white" :
                    done   ? "bg-emerald-500 border-emerald-500 text-white" :
                             "bg-white border-slate-300 text-slate-400"
                  }`}>
                    {done && !active ? <CheckCircle2 size={14} /> : idx + 1}
                  </div>
                  <span className={`text-[11px] mt-1.5 font-medium ${active ? "text-amber-600" : done ? "text-emerald-600" : "text-slate-400"}`}>
                    {step.label}
                  </span>
                </div>
                {idx < WORKFLOW.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 -mt-4 ${idx < currentStep ? "bg-emerald-400" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Evidence ledger */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <ImageIcon size={14} className="text-amber-500" />
                Citizen Evidence ({reports.length} report{reports.length !== 1 ? "s" : ""})
              </h2>
              <span className="text-[11px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">
                Preserved Ledger
              </span>
            </div>

            {reports.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No reports attached to this cluster yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.map((report, idx) => (
                  <div key={report.id as string} className="p-4 flex gap-4">
                    {/* Photo */}
                    <div className="w-24 h-20 bg-slate-100 border border-slate-200 rounded overflow-hidden shrink-0">
                      {report.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={report.image_url as string}
                          alt={`Evidence ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700">
                          Report #{idx + 1}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(report.created_at as string).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {report.description && (
                        <p className="text-xs text-slate-600 leading-relaxed mb-2 line-clamp-2">
                          "{report.description as string}"
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[11px]">
                        {report.is_spam ? (
                          <span className="flex items-center gap-1 text-red-600 font-semibold">
                            <AlertOctagon size={11} /> Flagged Spam
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                            <ShieldCheck size={11} /> Verified
                          </span>
                        )}
                        {report.ai_confidence && (
                          <span className="text-slate-400">
                            AI Confidence: {((report.ai_confidence as number) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Repair verification */}
          {repair && (
            <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Repair Evidence
                </h2>
              </div>
              <div className="p-4 flex gap-4">
                <div className="w-32 h-24 bg-slate-100 border border-slate-200 rounded overflow-hidden shrink-0">
                  {repair.after_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={repair.after_image_url as string}
                      alt="After repair"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${
                      repair.ai_verification_status === "approved"
                        ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                        : repair.ai_verification_status === "rejected"
                        ? "bg-red-100 text-red-700 border-red-300"
                        : "bg-amber-100 text-amber-700 border-amber-300"
                    }`}>
                      AI: {(repair.ai_verification_status as string || "pending").toUpperCase()}
                    </span>
                    {repair.ai_confidence && (
                      <span className="text-xs text-slate-500">
                        {((repair.ai_confidence as number) * 100).toFixed(0)}% match
                      </span>
                    )}
                  </div>
                  {repair.notes && (
                    <p className="text-xs text-slate-600">{repair.notes as string}</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2">
                    Uploaded: {new Date(repair.created_at as string).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action panel */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="bg-white border border-slate-200 rounded shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 text-sm mb-4">Authority Actions</h2>
            <div className="space-y-2.5">
              <button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2.5 rounded text-sm transition">
                Assign Field Worker
              </button>
              <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded text-sm transition">
                Mark In Progress
              </button>
              <button className="w-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2.5 rounded text-sm transition">
                Request More Evidence
              </button>
              <button className="w-full border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded text-sm transition">
                Reject Issue
              </button>
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-slate-900 text-white rounded p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-amber-500 rounded flex items-center justify-center">
                <ShieldCheck size={12} className="text-slate-900" />
              </div>
              <span className="font-semibold text-sm">AI Assessment</span>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Cluster Confidence</span>
                <span className="font-semibold text-white">
                  {reports.length > 0 && reports[0].ai_confidence
                    ? `${((reports[0].ai_confidence as number) * 100).toFixed(0)}%`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duplicate Signals</span>
                <span className="font-semibold text-white">{issue.report_count as number || 1} matched</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verification</span>
                <span className="font-semibold text-white">
                  {repair ? (repair.ai_verification_status as string || "pending") : "Awaiting repair"}
                </span>
              </div>
            </div>
            {!repair && (
              <div className="mt-4 bg-slate-800 text-slate-400 text-[11px] px-3 py-2 rounded border border-slate-700 text-center">
                Awaiting repair photo upload
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
