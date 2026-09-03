import { Users, UserCheck, Clock, Phone } from "lucide-react";

const WORKERS = [
  { name: "Ramesh Kumar", id: "W-001", dept: "Roads & Pothole", zone: "Ward 14 Central", status: "active", issues: 3, phone: "+91 98765 43210" },
  { name: "Priya Nair", id: "W-002", dept: "Water & Drainage", zone: "Ward 14 North", status: "active", issues: 1, phone: "+91 99887 12345" },
  { name: "Suresh Babu", id: "W-003", dept: "Sanitation", zone: "Ward 14 East", status: "on-site", issues: 2, phone: "+91 97654 32109" },
  { name: "Anita Singh", id: "W-004", dept: "Electrical", zone: "Ward 14 South", status: "inactive", issues: 0, phone: "+91 91234 56789" },
  { name: "Mohan Das", id: "W-005", dept: "Roads & Pothole", zone: "Ward 14 West", status: "active", issues: 5, phone: "+91 95678 12345" },
];

const STATUS_PILL: Record<string, string> = {
  active:   "bg-emerald-100 text-emerald-700 border-emerald-300",
  "on-site": "bg-blue-100 text-blue-700 border-blue-300",
  inactive: "bg-slate-100 text-slate-500 border-slate-300",
};

export default function WorkersPage() {
  return (
    <div className="p-7 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Field Workers</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage and track municipal field staff · Ward 14</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded text-sm transition">
          + Add Worker
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Workers", value: WORKERS.filter(w => w.status === "active" || w.status === "on-site").length, icon: <UserCheck size={18} />, color: "border-t-emerald-500" },
          { label: "Total Issues Assigned", value: WORKERS.reduce((a, w) => a + w.issues, 0), icon: <Clock size={18} />, color: "border-t-amber-500" },
          { label: "Total Staff", value: WORKERS.length, icon: <Users size={18} />, color: "border-t-slate-400" },
        ].map((s) => (
          <div key={s.label} className={`bg-white border border-slate-200 rounded shadow-sm p-5 border-t-4 ${s.color}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{s.label}</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{s.value}</p>
              </div>
              <div className="text-amber-500 mt-1">{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Workers table */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 text-sm font-semibold text-slate-800">
          All Field Workers
        </div>
        <table className="w-full text-sm">
          <thead className="text-[11px] text-slate-400 uppercase tracking-wide border-b border-slate-100">
            <tr>
              <th className="px-5 py-2.5 text-left">Worker</th>
              <th className="px-5 py-2.5 text-left">Department</th>
              <th className="px-5 py-2.5 text-left">Zone</th>
              <th className="px-5 py-2.5 text-left">Status</th>
              <th className="px-5 py-2.5 text-left">Active Issues</th>
              <th className="px-5 py-2.5 text-left">Contact</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {WORKERS.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 text-amber-400 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      {w.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{w.name}</div>
                      <div className="text-xs text-slate-400">{w.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{w.dept}</td>
                <td className="px-5 py-3.5 text-slate-600">{w.zone}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${STATUS_PILL[w.status]}`}>
                    {w.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {w.issues}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-500 text-xs">{w.phone}</td>
                <td className="px-5 py-3.5 text-right">
                  <button className="text-amber-600 text-xs font-semibold hover:text-amber-700">Assign</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
