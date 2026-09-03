import { AlertTriangle, CheckCircle2, Clock, MapPin, Search } from "lucide-react";
import { supabase } from "@/lib/db";

// Make this a dynamic server component
export const dynamic = 'force-dynamic';

export default async function IssuesPage() {
  // Fetch real data from Supabase
  const { data: issues, error } = await supabase
    .from('issues')
    .select('*')
    .order('priority_score', { ascending: false });

  if (error) {
    console.error("Error fetching issues:", error);
  }

  const displayIssues = issues || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Issues</h1>
          <p className="text-slate-500 mt-1">Review and assign civic complaints prioritized by impact.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by ID or title..." 
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-64"
            />
          </div>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-slate-800 transition">
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-3">Priority</th>
              <th className="px-6 py-3">Issue Title & Category</th>
              <th className="px-6 py-3">Reports</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {displayIssues.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No active issues found in the database.
                </td>
              </tr>
            ) : (
              displayIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {issue.priority_score > 80 ? (
                        <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {issue.priority_score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {issue.priority_score.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{issue.title}</div>
                    <div className="text-xs text-slate-500 uppercase mt-0.5 tracking-wider">{issue.category.replace('_', ' ')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-1 rounded">
                      {issue.report_count} clustered
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {issue.status === 'reported' && <AlertTriangle size={14} className="text-amber-500" />}
                      {issue.status === 'assigned' && <Clock size={14} className="text-blue-500" />}
                      {issue.status === 'in_progress' && <CheckCircle2 size={14} className="text-emerald-500" />}
                      <span className="capitalize font-medium">{issue.status.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-amber-600 font-medium hover:text-amber-700 text-sm">
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
