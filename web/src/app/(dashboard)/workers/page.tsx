import { supabaseAdmin } from "@/lib/db";
import WorkersClient, { WorkerData } from "./WorkersClient";

export const dynamic = "force-dynamic";

export default async function WorkersPage() {
  const [profilesRes, issuesRes] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, role, created_at")
      .eq("role", "worker" as any)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("issues")
      .select("assigned_worker_id, status")
      .in("status", ["assigned", "in_progress"]),
  ]);

  const profiles = profilesRes.data || [];
  const assignedIssues = issuesRes.data || [];

  // Count active issues per worker
  const countMap: Record<string, number> = {};
  assignedIssues.forEach((issue) => {
    if (issue.assigned_worker_id) {
      countMap[issue.assigned_worker_id] = (countMap[issue.assigned_worker_id] || 0) + 1;
    }
  });

  const workers: WorkerData[] = profiles.map((p) => ({
    id: p.id,
    name: p.full_name || "Field Officer",
    phone: p.phone || "+91 98765 00000",
    dept: "Municipal Field Operations",
    zone: "Ward 14 Central",
    status: (countMap[p.id] || 0) > 0 ? "on-site" : "active",
    activeIssuesCount: countMap[p.id] || 0,
  }));

  return <WorkersClient initialWorkers={workers} />;
}
