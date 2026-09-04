import { supabaseAdmin } from "@/lib/db";
import { parsePostGISPoint, reverseGeocode } from "@/utils/geo";
import { runAutoDeduplication } from "@/utils/autoDedup";
import IssuesClient, { IssueItem } from "./IssuesClient";

export const dynamic = "force-dynamic";

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Automatically merge duplicates in real-time
  await runAutoDeduplication();

  const { status: statusFilter } = await searchParams;

  // Fetch issues, photos, and counts in parallel
  const [issuesRes, reportsRes, countsRes] = await Promise.all([
    supabaseAdmin
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("reports")
      .select("issue_id, image_url")
      .not("image_url", "is", null)
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("issues").select("status"),
  ]);

  const rawIssues = issuesRes.data || [];
  const rawReports = reportsRes.data || [];
  const counts = countsRes.data || [];

  // Build photo lookup
  const imageMap: Record<string, string> = {};
  rawReports.forEach((r) => {
    if (r.issue_id && r.image_url && !imageMap[r.issue_id]) {
      imageMap[r.issue_id] = r.image_url;
    }
  });

  // Decode PostGIS EWKB locations and perform real reverse geocoding
  const displayIssues: IssueItem[] = await Promise.all(
    rawIssues.map(async (issue) => {
      const coords = parsePostGISPoint(issue.location);
      const lat = coords?.lat ?? 12.9716;
      const lng = coords?.lng ?? 77.5946;
      const address = await reverseGeocode(lng, lat);

      return {
        id: issue.id,
        ticket_no: `#MUN-${issue.id.substring(0, 4).toUpperCase()}`,
        title: issue.title || "Civic Grievance",
        category: issue.category || "other",
        status: issue.status || "reported",
        priority_score: issue.priority_score || 60,
        report_count: issue.report_count || 1,
        description: issue.description || "Incident logged with GPS telemetry.",
        created_at: issue.created_at || new Date().toISOString(),
        address: address || "Location recorded",
        lat,
        lng,
        image_url: imageMap[issue.id],
      };
    })
  );

  // Count by status
  const countMap: Record<string, number> = {};
  counts.forEach((r) => {
    countMap[r.status as string] = (countMap[r.status as string] || 0) + 1;
  });

  return (
    <IssuesClient
      initialIssues={displayIssues}
      countMap={countMap}
      initialStatus={statusFilter || "all"}
    />
  );
}
