"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Clock,
  Phone,
  Plus,
  X,
  CheckCircle2,
  ShieldCheck,
  BellRing,
  Edit2,
  Trash2,
  Eye,
  ExternalLink,
  Search,
  AlertCircle,
  Building,
  MapPin,
  Sparkles,
} from "lucide-react";

export type AssignedTask = {
  id: string;
  ticket_no: string;
  title: string;
  category: string;
  status: string;
  priority_score: number;
  created_at: string;
};

export type WorkerData = {
  id: string;
  name: string;
  phone: string;
  dept: string;
  zone: string;
  status: "active" | "on-site" | "standby" | string;
  activeIssuesCount: number;
  trustScore?: number;
  joinedAt?: string;
  assignedTasks?: AssignedTask[];
};

type Props = {
  initialWorkers: WorkerData[];
};

const CAT_ICON: Record<string, string> = {
  pothole: "🕳️",
  garbage: "🗑️",
  streetlight: "💡",
  water_leakage: "💧",
  road_damage: "🚧",
  other: "⚠️",
};

export default function WorkersClient({ initialWorkers }: Props) {
  const [workers, setWorkers] = useState<WorkerData[]>(initialWorkers);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "on-site">("all");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingWorker, setViewingWorker] = useState<WorkerData | null>(null);
  const [editingWorker, setEditingWorker] = useState<WorkerData | null>(null);

  // Form Fields for Add / Edit
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dept, setDept] = useState("Roads & Pothole Repair");
  const [zone, setZone] = useState("Ward 14 – Central Metro");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Action feedback
  const [nudgingId, setNudgingId] = useState<string | null>(null);
  const [nudgedTimestamps, setNudgedTimestamps] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const router = useRouter();

  // Filtered workers
  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.phone.includes(searchQuery) ||
      w.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.zone.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "active") return w.status === "active";
    if (statusFilter === "on-site") return w.status === "on-site";
    return true;
  });

  const activeCount = workers.filter((w) => w.status === "active" || w.status === "on-site").length;
  const totalAssigned = workers.reduce((acc, w) => acc + w.activeIssuesCount, 0);

  // ── Action: Create Worker ──
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

      const newWorker: WorkerData = {
        id: newProfile.id,
        name: newProfile.full_name,
        phone: newProfile.phone || "+91 98765 00000",
        dept: dept,
        zone: zone,
        status: "active",
        activeIssuesCount: 0,
        trustScore: 1.0,
        joinedAt: new Date().toISOString(),
        assignedTasks: [],
      };

      setWorkers((prev) => [newWorker, ...prev]);
      setToastMsg(`✅ Registered Field Worker: ${newProfile.full_name}`);
      setIsAddModalOpen(false);
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

  // ── Action: Update Worker ──
  const handleUpdateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/workers/${editingWorker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: editingWorker.name,
          phone: editingWorker.phone,
        }),
      });

      if (!res.ok) throw new Error("Failed to update worker");

      setWorkers((prev) =>
        prev.map((w) => (w.id === editingWorker.id ? { ...editingWorker } : w))
      );

      setToastMsg(`✅ Updated details for ${editingWorker.name}`);
      setEditingWorker(null);
      router.refresh();
    } catch (err: any) {
      setToastMsg(`❌ ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // ── Action: Delete Worker ──
  const handleDeleteWorker = async (workerId: string, workerName: string) => {
    if (!confirm(`Are you sure you want to remove worker "${workerName}" from the roster?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/workers/${workerId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete worker profile");

      setWorkers((prev) => prev.filter((w) => w.id !== workerId));
      setToastMsg(`🗑️ Removed worker: ${workerName}`);
      if (viewingWorker?.id === workerId) setViewingWorker(null);
      if (editingWorker?.id === workerId) setEditingWorker(null);
      router.refresh();
    } catch (err: any) {
      setToastMsg(`❌ ${err.message}`);
    } finally {
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // ── Action: Nudge Worker (🚨 Priority Dispatch Notification) ──
  const handleNudgeWorker = async (w: WorkerData) => {
    setNudgingId(w.id);
    try {
      const res = await fetch(`/api/workers/${w.id}/nudge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `🚨 Municipal Control Room dispatched an urgent priority status check on your ${w.activeIssuesCount} assigned repair ticket(s).`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch nudge");

      setNudgedTimestamps((prev) => ({
        ...prev,
        [w.id]: "Just now",
      }));

      setToastMsg(`⚡ Priority Nudge dispatched to ${w.name}'s mobile app!`);
    } catch (err: any) {
      setToastMsg(`❌ Nudge failed: ${err.message}`);
    } finally {
      setNudgingId(null);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  return (
    <div className="p-7 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="p-3.5 bg-slate-900 text-amber-400 rounded-sm text-xs font-bold shadow-md border border-amber-500/30 animate-fade-in flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Municipal Field Workers
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Registered repair contractors, zonal crews &amp; on-site staff · Live Supabase profiles
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-sm text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} /> Add Field Worker
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 border-t-4 border-t-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Active Staff On-Site
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

      {/* Controls Bar: Search & Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-sm shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search workers by name, phone, department, or ward..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              statusFilter === "all"
                ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All ({workers.length})
          </button>
          <button
            onClick={() => setStatusFilter("on-site")}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              statusFilter === "on-site"
                ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            On-Site ({workers.filter((w) => w.status === "on-site").length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1 rounded text-xs font-semibold transition ${
              statusFilter === "active"
                ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Available ({workers.filter((w) => w.status === "active").length})
          </button>
        </div>
      </div>

      {/* Workers Directory Table */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-800 flex items-center justify-between">
          <span>Field Staff Directory ({filteredWorkers.length} matching)</span>
          <span className="text-[10px] font-mono text-slate-400">role: 'worker' in Supabase</span>
        </div>

        {filteredWorkers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No field workers found matching your search.
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
              {filteredWorkers.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Name & ID */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-900 text-amber-400 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        {w.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{w.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          #{w.id.substring(0, 6)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Dept */}
                  <td className="px-5 py-3.5 text-slate-700 font-medium">{w.dept}</td>

                  {/* Zone */}
                  <td className="px-5 py-3.5 text-slate-500">{w.zone}</td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                        w.status === "on-site"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {w.status === "on-site" ? "⚡ On-Site" : "🟢 Available"}
                    </span>
                  </td>

                  {/* Active Dockets */}
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setViewingWorker(w)}
                      className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded border border-slate-200 cursor-pointer flex items-center gap-1 transition"
                    >
                      <span>{w.activeIssuesCount} active</span>
                      <Eye size={11} className="text-slate-500" />
                    </button>
                  </td>

                  {/* Contact */}
                  <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">{w.phone}</td>

                  {/* Actions Column: View / Edit / Nudge / Delete */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Nudge Button */}
                      <button
                        type="button"
                        onClick={() => handleNudgeWorker(w)}
                        disabled={nudgingId === w.id}
                        className="p-1.5 text-amber-700 hover:bg-amber-50 rounded border border-amber-200 hover:border-amber-300 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                        title="Send priority reminder nudge to worker mobile app"
                      >
                        <BellRing size={12} className={nudgingId === w.id ? "animate-spin" : ""} />
                        <span>{nudgedTimestamps[w.id] || "Nudge"}</span>
                      </button>

                      {/* View Button */}
                      <button
                        type="button"
                        onClick={() => setViewingWorker(w)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition cursor-pointer"
                        title="View worker details & assigned tasks"
                      >
                        <Eye size={14} />
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => setEditingWorker(w)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition cursor-pointer"
                        title="Edit worker profile"
                      >
                        <Edit2 size={13} />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteWorker(w.id, w.name)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Remove worker"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── 1. View Worker Modal / Drawer ── */}
      {viewingWorker && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setViewingWorker(null)}
        >
          <div
            className="bg-white rounded-sm border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 text-amber-400 rounded-full flex items-center justify-center font-bold text-sm shadow-xs">
                  {viewingWorker.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{viewingWorker.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    ID: #{viewingWorker.id} · Verified Municipal Staff
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingWorker(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-sm border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Department
                </span>
                <span className="font-bold text-slate-800">{viewingWorker.dept}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Assigned Ward / Zone
                </span>
                <span className="font-bold text-slate-800">{viewingWorker.zone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Contact Number
                </span>
                <span className="font-mono text-slate-800">{viewingWorker.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                <span className="font-bold text-emerald-800">{viewingWorker.status}</span>
              </div>
            </div>

            {/* Assigned Active Tasks List */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Assigned Dockets ({viewingWorker.assignedTasks?.length || 0})</span>
                <button
                  type="button"
                  onClick={() => handleNudgeWorker(viewingWorker)}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
                >
                  <BellRing size={12} /> Dispatch Priority Nudge
                </button>
              </div>

              {!viewingWorker.assignedTasks || viewingWorker.assignedTasks.length === 0 ? (
                <div className="p-6 bg-slate-50 text-slate-400 text-xs text-center rounded border border-slate-200">
                  No active work orders currently assigned to this worker.
                </div>
              ) : (
                <div className="space-y-2">
                  {viewingWorker.assignedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-white border border-slate-200 rounded-sm hover:border-amber-400 transition flex items-center justify-between text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{CAT_ICON[task.category] || "⚠️"}</span>
                        <div>
                          <div className="font-bold text-slate-900">{task.title}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {task.ticket_no} · Status: {task.status}
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/issues/${task.id}`}
                        className="text-amber-700 hover:text-amber-800 font-bold text-xs flex items-center gap-1 underline"
                      >
                        Inspect <ExternalLink size={11} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setEditingWorker(viewingWorker);
                  setViewingWorker(null);
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-sm text-xs font-semibold flex items-center gap-1 transition"
              >
                <Edit2 size={12} /> Edit Worker Profile
              </button>
              <button
                type="button"
                onClick={() => setViewingWorker(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Edit Worker Modal ── */}
      {editingWorker && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setEditingWorker(null)}
        >
          <div
            className="bg-white rounded-sm border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Edit Worker Profile</h3>
              <button
                onClick={() => setEditingWorker(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateWorker} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingWorker.name}
                  onChange={(e) =>
                    setEditingWorker({ ...editingWorker, name: e.target.value })
                  }
                  className="w-full text-xs border border-slate-300 rounded-sm p-2 bg-white text-slate-800 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Contact Number
                </label>
                <input
                  type="text"
                  value={editingWorker.phone}
                  onChange={(e) =>
                    setEditingWorker({ ...editingWorker, phone: e.target.value })
                  }
                  className="w-full text-xs border border-slate-300 rounded-sm p-2 bg-white text-slate-800 font-mono focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department Division
                </label>
                <select
                  value={editingWorker.dept}
                  onChange={(e) =>
                    setEditingWorker({ ...editingWorker, dept: e.target.value })
                  }
                  className="w-full text-xs border border-slate-300 rounded-sm p-2 bg-white text-slate-800 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  <option>Roads &amp; Pothole Repair</option>
                  <option>Water Supply &amp; Drainage (BWSSB)</option>
                  <option>Solid Waste Management (SWM)</option>
                  <option>Electrical &amp; Streetlighting Wing</option>
                  <option>Civil Infrastructure Unit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Ward / Zone
                </label>
                <select
                  value={editingWorker.zone}
                  onChange={(e) =>
                    setEditingWorker({ ...editingWorker, zone: e.target.value })
                  }
                  className="w-full text-xs border border-slate-300 rounded-sm p-2 bg-white text-slate-800 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  <option>Ward 14 – Central Metro</option>
                  <option>Ward 08 – Indiranagar</option>
                  <option>Ward 22 – Whitefield</option>
                  <option>Ward 04 – Bandra West</option>
                  <option>Ward 11 – Connaught Place</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingWorker(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-sm text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-sm text-xs font-bold transition shadow-sm"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 3. Add Worker Modal ── */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-sm border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Register New Field Worker</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Ward / Zone
                </label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-sm p-2 bg-white text-slate-800 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                >
                  <option>Ward 14 – Central Metro</option>
                  <option>Ward 08 – Indiranagar</option>
                  <option>Ward 22 – Whitefield</option>
                  <option>Ward 04 – Bandra West</option>
                  <option>Ward 11 – Connaught Place</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
