import { supabaseAdmin } from "@/lib/db";
import { parsePostGISPoint } from "@/utils/geo";

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let lastAutoDedupRun = 0;

/**
 * Automatically clusters and merges duplicate issues in the database in real-time.
 * Runs seamlessly on server requests throttled to once every 5 seconds to stay blazing fast.
 */
export async function runAutoDeduplication() {
  const now = Date.now();
  if (now - lastAutoDedupRun < 5000) {
    return; // Throttled for performance (<5ms)
  }
  lastAutoDedupRun = now;

  try {
    const { data: issues } = await supabaseAdmin
      .from("issues")
      .select("id, title, category, status, location, report_count, created_at")
      .in("status", ["reported", "assigned", "in_progress"])
      .order("created_at", { ascending: true });

    if (!issues || issues.length === 0) return;

    const clustered = new Set<string>();

    for (let i = 0; i < issues.length; i++) {
      const primary = issues[i];
      if (clustered.has(primary.id)) continue;

      const pCoords = parsePostGISPoint(primary.location);
      if (!pCoords) continue;

      const duplicates: any[] = [];

      for (let j = i + 1; j < issues.length; j++) {
        const candidate = issues[j];
        if (clustered.has(candidate.id)) continue;
        if (candidate.category !== primary.category) continue;

        const cCoords = parsePostGISPoint(candidate.location);
        if (!cCoords) continue;

        const dist = distanceMeters(pCoords.lat, pCoords.lng, cCoords.lat, cCoords.lng);
        // If within 200m and same category, merge as duplicate cluster
        if (dist <= 200) {
          duplicates.push(candidate);
          clustered.add(candidate.id);
        }
      }

      if (duplicates.length > 0) {
        // Re-link reports from duplicate issues to the primary canonical issue
        for (const dup of duplicates) {
          await supabaseAdmin
            .from("reports")
            .update({ issue_id: primary.id })
            .eq("issue_id", dup.id);

          await supabaseAdmin.from("issues").delete().eq("id", dup.id);
        }

        // Count total reports now under primary
        const { count } = await supabaseAdmin
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("issue_id", primary.id);

        const totalReports = count || 1 + duplicates.length;

        await supabaseAdmin
          .from("issues")
          .update({
            report_count: totalReports,
            priority_score: Math.min(99, 50 + totalReports * 8),
            updated_at: new Date().toISOString(),
          })
          .eq("id", primary.id);
      }
    }
  } catch (err) {
    console.warn("Auto deduplication routine error:", err);
  }
}
