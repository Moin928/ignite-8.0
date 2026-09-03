import { AlertOctagon, CheckCircle2, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Authority Overview</h1>
        <p className="text-slate-500 mt-1">Real-time civic issue metrics and operational status.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Active Critical Issues</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">12</p>
            </div>
            <div className="p-2 bg-amber-50 rounded text-amber-600">
              <AlertOctagon size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Resolved This Week</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">148</p>
            </div>
            <div className="p-2 bg-emerald-50 rounded text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Field Workers Active</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">34</p>
            </div>
            <div className="p-2 bg-blue-50 rounded text-blue-600">
              <Users size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-slate-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500 font-medium">Avg Resolution Time</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">48h</p>
            </div>
            <div className="p-2 bg-slate-50 rounded text-slate-600">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link href="/issues" className="bg-slate-900 text-white px-6 py-3 rounded-sm font-medium hover:bg-slate-800 transition">
          Go to Issue Management
        </Link>
      </div>
    </div>
  );
}
