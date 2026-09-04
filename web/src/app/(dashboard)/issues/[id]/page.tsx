import { supabaseAdmin } from "@/lib/db";
import { parsePostGISPoint, reverseGeocode } from "@/utils/geo";
import IssueDetailClient from "./IssueDetailClient";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

const DEFAULT_WORKERS = [
  { id: "w1", name: "Ramesh Kumar", dept: "Roads & Highways Division II", phone: "+91 98765 43210" },
  { id: "w2", name: "Priya Nair", dept: "Water Supply (BWSSB)", phone: "+91 99887 12345" },
  { id: "w3", name: "Suresh Babu", dept: "Solid Waste Management (SWM)", phone: "+91 97654 32109" },
  { id: "w4", name: "Anita Singh", dept: "Electrical Distribution Wing", phone: "+91 91234 56789" },
  { id: "w5", name: "Mohan Das", dept: "Civil Maintenance Unit", phone: "+91 95678 12345" },
];

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [issueRes, reportsRes, repairRes, profilesRes] = await Promise.all([
    supabaseAdmin.from("issues").select("*").eq("id", id).single(),
    supabaseAdmin.from("reports").select("*").eq("issue_id", id).order("created_at", { ascending: true }),
    supabaseAdmin.from("repairs").select("*").eq("issue_id", id).order("created_at", { ascending: false }).limit(1),
    supabaseAdmin.from("profiles").select("id, full_name, role, phone, department").eq("role", "worker" as any),
  ]);

  const issue = issueRes.data;
  const reports = reportsRes.data || [];
  const repair = repairRes.data?.[0] || null;
  const profiles = profilesRes.data || [];

  if (!issue) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto">
        <AlertTriangle className="mx-auto text-amber-500 mb-3" size={36} />
        <h2 className="text-lg font-bold text-slate-800">Issue Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested ticket ID does not exist in the municipal registry.
        </p>
        <Link
          href="/issues"
          className="inline-block mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-sm transition"
        >
          ← Return to Issues
        </Link>
      </div>
    );
  }

  // Parse real coordinates from EWKB PostGIS location
  const coords = parsePostGISPoint(issue.location);
  const lat = coords?.lat ?? 12.9716;
  const lng = coords?.lng ?? 77.5946;

  // Real Mapbox Reverse Geocoding
  const location_address = await reverseGeocode(lng, lat);

  const DEPT_POOL = [
    "Roads & Highways Division II",
    "Water Supply & Drainage (BWSSB)",
    "Solid Waste Management (SWM)",
    "Electrical & Streetlighting Wing",
    "Civil Infrastructure Unit",
  ];

  const workers = profiles.length > 0
    ? profiles.map((p, idx) => ({
        id: p.id,
        name: p.full_name || "Field Officer",
        dept: (p as any).department || DEPT_POOL[idx % DEPT_POOL.length] || "Civil Infrastructure Unit",
        phone: p.phone,
      }))
    : DEFAULT_WORKERS;

  const shortId = issue.id.substring(0, 4).toUpperCase();
  const ticket_no = `#MUN-${shortId}`;

  const formattedIssue = {
    id: issue.id,
    ticket_no,
    title: issue.title || "Civic Incident Report",
    description: issue.description || "",
    category: (issue.category as string) || "other",
    status: (issue.status as string) || "reported",
    priority_score: (issue.priority_score as number) || 70,
    report_count: (issue.report_count as number) || 1,
    location_address,
    lat,
    lng,
    assigned_worker_id: issue.assigned_worker_id,
    created_at: issue.created_at || new Date().toISOString(),
    updated_at: issue.updated_at || new Date().toISOString(),
  };

  const formattedReports = reports.map((r) => ({
    id: r.id,
    image_url: r.image_url || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80",
    description: r.description || "",
    created_at: r.created_at || new Date().toISOString(),
    is_spam: r.is_spam || false,
    ai_confidence: r.ai_confidence || 0.92,
  }));

  const formattedRepair = repair
    ? {
        id: repair.id,
        after_image_url: repair.after_image_url,
        notes: repair.notes,
        ai_verification_status: repair.ai_verification_status || "pending",
        ai_confidence: repair.ai_confidence || 0.94,
        created_at: repair.created_at || new Date().toISOString(),
      }
    : null;

  return (
    <IssueDetailClient
      issue={formattedIssue}
      reports={formattedReports}
      repair={formattedRepair}
      workers={workers}
    />
  );
}
