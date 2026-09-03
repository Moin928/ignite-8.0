import { supabase } from "@/lib/db";
import { AlertTriangle, Clock, MapPin, CheckCircle2, AlertOctagon, User } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch parent issue
  const { data: issue, error: issueError } = await supabase
    .from('issues')
    .select('*')
    .eq('id', id)
    .single();

  // Fetch clustered reports belonging to this issue
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('*')
    .eq('issue_id', id)
    .order('created_at', { ascending: true });

  if (issueError || !issue) {
    return (
      <div className="p-8 text-center text-slate-500">
        Issue not found or error loading issue details.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="uppercase text-xs font-bold tracking-wider text-slate-500">
              {issue.category?.replace('_', ' ') || 'Issue'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${
              issue.status === 'reported' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              issue.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {(issue.status || 'reported').replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{issue.title}</h1>
          <div className="flex items-center gap-2 text-slate-500 mt-2 text-sm">
            <MapPin size={16} />
            <span>PostGIS Location Data Included</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500 uppercase font-semibold tracking-wide mb-1">Priority Score</div>
          <div className={`text-3xl font-black ${issue.priority_score > 80 ? 'text-red-600' : 'text-amber-500'}`}>
            {(issue.priority_score || 0).toFixed(1)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              AI Cluster Analysis
            </h2>
            <p className="text-slate-700 mb-4 text-sm leading-relaxed">
              {issue.description || "The AI system has clustered multiple reports into this single canonical issue. Review the original citizen evidence below."}
            </p>

            <div className="flex items-center gap-8 text-sm">
              <div>
                <span className="block text-slate-500 mb-1">Total Reports</span>
                <span className="font-semibold text-slate-900">{issue.report_count || 1}</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">First Reported</span>
                <span className="font-semibold text-slate-900">
                  {new Date(issue.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">Original Citizen Evidence</h2>
              <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-1 rounded">
                Preserved Ledger
              </span>
            </div>
            <div className="p-6">
              {reports && reports.length > 0 ? (
                <div className="space-y-6">
                  {reports.map((report, idx) => (
                    <div key={report.id} className="flex gap-4 p-4 border border-slate-100 rounded bg-slate-50/50">
                      <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center text-slate-500 shrink-0">
                        <User size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-slate-900 text-sm">Citizen Report #{idx + 1}</div>
                          <div className="text-xs text-slate-500">{new Date(report.created_at).toLocaleString()}</div>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">"{report.description}"</p>
                        {report.image_url && (
                          <div className="mt-2 relative h-48 bg-slate-200 rounded overflow-hidden border border-slate-300">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={report.image_url} alt="Evidence" className="object-cover w-full h-full" />
                          </div>
                        )}
                        <div className="mt-3 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          AI Match Confidence: {((report.ai_confidence || 1.0) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 text-sm text-center py-4">No reports found in this cluster.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Authority Actions</h2>
            <div className="space-y-3">
              <button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2.5 rounded-sm transition text-sm">
                Assign Field Worker
              </button>
              <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-sm transition text-sm">
                Mark In Progress
              </button>
              <button className="w-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2.5 rounded-sm transition text-sm">
                Reject / Mark Invalid
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertOctagon className="text-amber-500" size={20} />
              <h2 className="font-semibold">AI Verification</h2>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              When a repair photo is uploaded by a worker, the AI engine will compare it against the original evidence to verify the resolution before closing the issue.
            </p>
            <div className="bg-slate-800 text-slate-300 px-3 py-2 rounded text-xs text-center border border-slate-700">
              Awaiting Repair Evidence
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
