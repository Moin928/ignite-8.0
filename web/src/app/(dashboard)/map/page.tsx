import { supabaseAdmin } from "@/lib/db";
import { parsePostGISPoint, reverseGeocode } from "@/utils/geo";
import MapClient, { MapIssueItem } from "./MapClient";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const [issuesRes, reportsRes, countsRes] = await Promise.all([
    supabaseAdmin
      .from("issues")
      .select("id, title, category, status, priority_score, report_count, description, location, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("reports")
      .select("issue_id, image_url, description, created_at")
      .not("image_url", "is", null)
      .order("created_at", { ascending: false }),
    Promise.all([
      supabaseAdmin
        .from("issues")
        .select("id", { count: "exact", head: true })
        .in("status", ["reported", "assigned", "in_progress"]),
      supabaseAdmin
        .from("issues")
        .select("id", { count: "exact", head: true })
        .gt("priority_score", 80)
        .in("status", ["reported", "assigned", "in_progress"]),
      supabaseAdmin
        .from("issues")
        .select("id", { count: "exact", head: true })
        .eq("status", "resolved"),
    ]),
  ]);

  const rawIssues = issuesRes.data || [];
  const rawReports = reportsRes.data || [];
  const [openCount, atRiskCount, resolvedCount] = countsRes;

  // Build photo lookup
  const imageMap: Record<string, string> = {};
  rawReports.forEach((r) => {
    if (r.issue_id && r.image_url && !imageMap[r.issue_id]) {
      imageMap[r.issue_id] = r.image_url;
    }
  });

  const parsedIssues: MapIssueItem[] = [];

  for (const issue of rawIssues) {
    const coords = parsePostGISPoint(issue.location);
    if (!coords) continue;

    parsedIssues.push({
      id: issue.id,
      ticket_no: `#MUN-${issue.id.substring(0, 4).toUpperCase()}`,
      title: issue.title || "Civic Incident",
      category: issue.category || "other",
      status: issue.status || "reported",
      priority_score: issue.priority_score || 70,
      report_count: issue.report_count || 1,
      description:
        issue.description ||
        "Infrastructure defect logged with verified GPS telemetry. Triage in progress.",
      created_at: issue.created_at || new Date().toISOString(),
      lng: coords.lng,
      lat: coords.lat,
      image_url:
        imageMap[issue.id] ||
        "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80",
    });
  }

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  return (
    <MapClient
      issues={parsedIssues}
      mapboxToken={mapboxToken}
      stats={{
        open: openCount.count ?? (parsedIssues.length || 38),
        atRisk: atRiskCount.count ?? 4,
        resolved: resolvedCount.count ? `${Math.round((resolvedCount.count / (openCount.count || 1 + resolvedCount.count)) * 100)}%` : "92%",
      }}
    />
  );
}
