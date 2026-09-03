import { supabaseAdmin } from "@/lib/db";
import MapClient from "./MapClient";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const { data: rawIssues } = await supabaseAdmin
    .from("issues")
    .select("id, title, category, status, priority_score, report_count, description, location, created_at")
    .in("status", ["reported", "assigned", "in_progress", "repaired"]);

  const issues = (rawIssues || [])
    .map((issue) => {
      let lng: number | null = null;
      let lat: number | null = null;
      if (issue.location) {
        if (typeof issue.location === "object" && issue.location.type === "Point") {
          lng = issue.location.coordinates[0];
          lat = issue.location.coordinates[1];
        } else if (typeof issue.location === "string" && issue.location.startsWith("POINT(")) {
          const c = issue.location.replace("POINT(", "").replace(")", "").split(" ");
          lng = parseFloat(c[0]);
          lat = parseFloat(c[1]);
        }
      }
      return {
        id: issue.id as string,
        title: issue.title as string,
        category: (issue.category as string) || "other",
        status: (issue.status as string) || "reported",
        priority_score: (issue.priority_score as number) || 0,
        report_count: (issue.report_count as number) || 1,
        description: (issue.description as string) || "",
        created_at: issue.created_at as string,
        lng,
        lat,
      };
    })
    .filter((i) => i.lng !== null && i.lat !== null) as {
    id: string;
    title: string;
    category: string;
    status: string;
    priority_score: number;
    report_count: number;
    description: string;
    created_at: string;
    lng: number;
    lat: number;
  }[];

  // Counts for top bar
  const { count: openCount } = await supabaseAdmin
    .from("issues")
    .select("id", { count: "exact", head: true })
    .in("status", ["reported", "assigned", "in_progress"]);

  const { count: atRiskCount } = await supabaseAdmin
    .from("issues")
    .select("id", { count: "exact", head: true })
    .gt("priority_score", 80)
    .in("status", ["reported", "assigned", "in_progress"]);

  const { count: resolvedCount } = await supabaseAdmin
    .from("issues")
    .select("id", { count: "exact", head: true })
    .eq("status", "resolved");

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  return (
    <MapClient
      issues={issues}
      mapboxToken={mapboxToken}
      stats={{
        open: openCount || 0,
        atRisk: atRiskCount || 0,
        resolved: resolvedCount || 0,
      }}
    />
  );
}
