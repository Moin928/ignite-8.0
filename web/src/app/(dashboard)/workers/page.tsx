import { supabaseAdmin } from "@/lib/db";
import WorkersClient, { WorkerData } from "./WorkersClient";

export const dynamic = "force-dynamic";

export default async function WorkersPage() {
  const [profilesRes, issuesRes] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, role, trust_score, created_at")
      .eq("role", "worker" as any)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("issues")
      .select("id, title, category, status, priority_score, assigned_worker_id, created_at")
      .in("status", ["assigned", "in_progress", "repaired"]),
  ]);

  const profiles = profilesRes.data || [];
  const assignedIssues = issuesRes.data || [];

  // Group issues by worker
  const issuesByWorker: Record<string, typeof assignedIssues> = {};
  assignedIssues.forEach((issue) => {
    if (issue.assigned_worker_id) {
      if (!issuesByWorker[issue.assigned_worker_id]) {
        issuesByWorker[issue.assigned_worker_id] = [];
      }
      issuesByWorker[issue.assigned_worker_id].push(issue);
    }
  });

  const DEPT_POOL = [
    "Roads & Pothole Repair",
    "Water Supply & Drainage (BWSSB)",
    "Solid Waste Management (SWM)",
    "Electrical & Streetlighting Wing",
    "Civil Infrastructure Unit",
  ];

  const ZONE_POOL = [
    "Ward 14 – Central Metro",
    "Ward 08 – Indiranagar",
    "Ward 22 – Whitefield",
    "Ward 04 – Bandra West",
    "Ward 11 – Connaught Place",
  ];

  const workers: WorkerData[] = profiles.map((p, idx) => {
    const workerIssues = issuesByWorker[p.id] || [];
    const activeTasks = workerIssues.filter(
      (i) => i.status === "assigned" || i.status === "in_progress"
    );

    return {
      id: p.id,
      name: p.full_name || "Field Officer",
      phone: p.phone || "+91 98765 00000",
      dept: DEPT_POOL[idx % DEPT_POOL.length],
      zone: ZONE_POOL[idx % ZONE_POOL.length],
      status: activeTasks.length > 0 ? "on-site" : "active",
      activeIssuesCount: activeTasks.length,
      trustScore: p.trust_score || 1.0,
      joinedAt: p.created_at || new Date().toISOString(),
      assignedTasks: workerIssues.map((i) => ({
        id: i.id,
        ticket_no: `#MUN-${(i.id || "").substring(0, 4).toUpperCase()}`,
        title: i.title || "Civic Incident",
        category: (i.category as string) || "other",
        status: (i.status as string) || "assigned",
        priority_score: (i.priority_score as number) || 50,
        created_at: i.created_at || new Date().toISOString(),
      })),
    };
  });

  return <WorkersClient initialWorkers={workers} />;
}
