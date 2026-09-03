"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserCheck, Clock, Phone, Plus, X, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export type WorkerData = {
  id: string;
  name: string;
  phone: string;
  dept: string;
  zone: string;
  status: string;
  activeIssuesCount: number;
};

type Props = {
  initialWorkers: WorkerData[];
};

export default function WorkersClient({ initialWorkers }: Props) {
  const [workers, setWorkers] = useState<WorkerData[]>(initialWorkers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dept, setDept] = useState("Roads & Pothole Repair");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const router = useRouter();

  const activeCount = workers.filter((w) => w.status === "active" || w.status === "on-site").length;
  const totalAssigned = workers.reduce((acc, w) => acc + w.activeIssuesCount, 0);

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim() || "+91 98765 00000",
        }),
      });

      if (!res.ok) throw new Error("Failed to register worker profile");
      const newProfile = await res.json();

      setWorkers((prev) => [
        {
          id: newProfile.id,
          name: newProfile.full_name,
          phone: newProfile.phone || "+91 98765 00000",
          dept: dept,
          zone: "Ward 14 Central",
          status: "active",
          activeIssuesCount: 0,
        },
        ...prev,
      ]);

      setToastMsg(`✅ Registered Field Worker: ${newProfile.full_name}`);
      setIsModalOpen(false);
      setFullName("");
      setPhone("");
      router.refresh();
    } catch (err: any) {
      setToastMsg(`❌ Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  return (
    <div className="p-7 max-w-5xl mx-auto space-y-6 font-sans">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="p-3 bg-slate-900 text-amber-400 rounded-sm text-xs font-bold shadow-md border border-amber-500/30 animate-fade-in">
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Municipal Field Workers</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Registered repair contractors &amp; municipal field crews · Live Supabase profiles
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-4 py-2 rounded-sm text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} /> Add Field Worker
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 border-t-4 border-t-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Active Workers
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">{activeCount}</p>
            </div>
            <div className="text-emerald-500 p-2 bg-emerald-50 rounded">
              <UserCheck size={18} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 border-t-4 border-t-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Assigned Work Orders
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">{totalAssigned}</p>
            </div>
            <div className="text-amber-500 p-2 bg-amber-50 rounded">
              <Clock size={18} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 border-t-4 border-t-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Total Registered Crew
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">{workers.length}</p>
            </div>
            <div className="text-blue-500 p-2 bg-blue-50 rounded">
              <Users size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-800 flex items-center justify-between">
          <span>Field Staff Directory ({workers.length} registered)</span>
          <span className="text-[10px] font-mono text-slate-400">role: 'worker' in Supabase</span>
        </div>

        {workers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No field workers registered yet. Click &quot;Add Field Worker&quot; to register worker profiles into Supabase.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="px-5 py-2.5 text-left">Worker Profile</th>
                <th className="px-5 py-2.5 text-left">Department</th>
                <th className="px-5 py-2.5 text-left">Zone / Sector</th>
                <th className="px-5 py-2.5 text-left">Status</th>
                <th className="px-5 py-2.5 text-left">Active Dockets</th>
                <th className="px-5 py-2.5 text-left">Contact</th>
                <th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workers.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-900 text-amber-400 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                        {w.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{w.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          #{w.id.substring(0, 6)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 font-medium">{w.dept}</td>
                  <td className="px-5 py-3 text-slate-500">{w.zone}</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {w.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {w.activeIssuesCount} active
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs font-mono">{w.phone}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href="/issues"
                      className="text-amber-700 hover:text-amber-800 font-bold text-xs"
                    >
                      Assign Issue →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Add Worker Modal ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-sm border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Register New Field Worker</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full text-xs border border-slate-300 rounded-sm p-2 bg-white text-slate-800 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Contact Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs border border-slate-300 rounded-sm p-2 bg-white text-slate-800 focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department Division
                </label>
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-sm p-2 bg-white text-slate-800 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  <option>Roads &amp; Pothole Repair</option>
                  <option>Water Supply &amp; Drainage (BWSSB)</option>
                  <option>Solid Waste Management (SWM)</option>
                  <option>Electrical &amp; Streetlighting Wing</option>
                  <option>Civil Infrastructure Unit</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-sm text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-sm text-xs font-bold transition shadow-sm"
                >
                  {isSubmitting ? "Registering..." : "Save Worker Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
