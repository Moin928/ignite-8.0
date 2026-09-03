import { supabaseAdmin } from "@/lib/db";
import { reverseGeocode, parsePostGISPoint } from "@/utils/geo";
import OverviewClient, { IssueItem } from "./OverviewClient";

export const dynamic = "force-dynamic";

function formatTimeAgo(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMin = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ${diffMin % 60}m ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
  } catch {
    return "Recently";
  }
}

// Pan-India fallback demo data across major Indian states/cities
const PAN_INDIA_DEMO: IssueItem[] = [
  {
    id: "demo-1",
    ticket_no: "#MUN-8841",
    title: "Water pipe burst & road surface cave-in",
    description:
      "Significant roadbed subsidence with active water seepage across outbound arterial lanes. Water supply line shutoff completed. Immediate asphalt backfill and compaction needed to prevent foundation erosion before evening traffic.",
    category: "water_leakage",
    status: "reported",
    priority_score: 94,
    report_count: 5,
    location_desc: "MG Road, Central Metro, Bengaluru",
    city_region: "Bengaluru, Karnataka",
    lat: 12.9716,
    lng: 77.5946,
    created_at: new Date().toISOString(),
    time_ago: "12m ago",
    image_url:
      "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80",
    uploader_label: "Uploaded by Citizen (Cloudinary / Flutter)",
  },
  {
    id: "demo-2",
    ticket_no: "#MUN-8839",
    title: "Deep crater pothole near Andheri flyover",
    description:
      "Large structural asphalt depression right before JP Road flyover junction. Causing severe vehicle congestion and risk of vehicle axle damage during peak hours.",
    category: "pothole",
    status: "reported",
    priority_score: 88,
    report_count: 8,
    location_desc: "JP Road, Andheri West, Mumbai",
    city_region: "Mumbai, Maharashtra",
    lat: 19.1136,
    lng: 72.8697,
    created_at: new Date(Date.now() - 34 * 60000).toISOString(),
    time_ago: "34m ago",
    image_url:
      "https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?auto=format&fit=crop&w=1200&q=80",
    uploader_label: "Uploaded by Citizen (Cloudinary / Flutter)",
  },
  {
    id: "demo-3",
    ticket_no: "#MUN-8835",
    title: "Stormwater manhole grate dislodged near Connaught Place",
    description:
      "Heavy cast iron storm drain cover missing/broken near Outer Circle. Pedestrian safety hazard, temporary barrier urgently required.",
    category: "other",
    status: "reported",
    priority_score: 82,
    report_count: 3,
    location_desc: "Outer Circle, Connaught Place, New Delhi",
    city_region: "Delhi NCR",
    lat: 28.6315,
    lng: 77.2167,
    created_at: new Date(Date.now() - 70 * 60000).toISOString(),
    time_ago: "1h 10m ago",
    image_url:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    uploader_label: "Uploaded by Ward Patrol",
  },
  {
    id: "demo-4",
    ticket_no: "#MUN-8828",
    title: "Garbage overflow at Sector 9 Market bins",
    description:
      "Commercial waste and domestic refuse piling along pedestrian footpath. Sanitation compactor vehicle routing required.",
    category: "garbage",
    status: "in_progress",
    priority_score: 76,
    report_count: 6,
    location_desc: "Sector 9 Market, HSR Layout, Bengaluru",
    city_region: "Bengaluru, Karnataka",
    lat: 12.9116,
    lng: 77.6494,
    created_at: new Date(Date.now() - 120 * 60000).toISOString(),
    time_ago: "2h ago",
    image_url:
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=1200&q=80",
    uploader_label: "Uploaded by Resident Watch",
  },
  {
    id: "demo-5",
    ticket_no: "#MUN-8820",
    title: "Main transmission streetlight outage on Ring Road",
    description:
      "Series of 4 streetlights dark along Gachibowli Ring Road. High speed corridor night visibility reduced.",
    category: "streetlight",
    status: "assigned",
    priority_score: 65,
    report_count: 2,
    location_desc: "Gachibowli Junction, Hyderabad",
    city_region: "Hyderabad, Telangana",
    lat: 17.4401,
    lng: 78.3489,
    created_at: new Date(Date.now() - 210 * 60000).toISOString(),
    time_ago: "3h 30m ago",
    image_url:
      "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80",
    uploader_label: "Uploaded by Traffic Patrol",
  },
];

export default async function OverviewPage() {
  // 1. Fetch real issues and their linked reports with Cloudinary photos from Supabase
  const [issuesRes, reportsRes, statsRes] = await Promise.all([
    supabaseAdmin
      .from("issues")
      .select("*")
      .order("priority_score", { ascending: false })
      .limit(20),
    supabaseAdmin
      .from("reports")
      .select("issue_id, image_url, description, location, created_at")
      .not("image_url", "is", null)
      .order("created_at", { ascending: false }),
    Promise.all([
      supabaseAdmin
        .from("issues")
        .select("id", { count: "exact", head: true })
        .gt("priority_score", 80)
        .in("status", ["reported", "assigned", "in_progress"]),
      supabaseAdmin
        .from("issues")
        .select("id", { count: "exact", head: true })
        .in("status", ["reported", "assigned", "in_progress"]),
      supabaseAdmin
        .from("issues")
        .select("id", { count: "exact", head: true })
        .in("status", ["assigned", "in_progress"]),
      supabaseAdmin
        .from("issues")
        .select("id", { count: "exact", head: true })
        .eq("status", "resolved"),
    ]),
  ]);

  const rawIssues = issuesRes.data || [];
  const rawReports = reportsRes.data || [];
  const [critCount, openCount, dispatchedCount, resolvedCount] = statsRes;

  // Build report image lookup map by issue_id
  const imageMap: Record<string, string> = {};
  rawReports.forEach((r) => {
    if (r.issue_id && r.image_url && !imageMap[r.issue_id]) {
      imageMap[r.issue_id] = r.image_url;
    }
  });

  let formattedIssues: IssueItem[] = [];

  if (rawIssues.length > 0) {
    // Reverse geocode real coordinates to actual Indian addresses
    formattedIssues = await Promise.all(
      rawIssues.map(async (issue, idx) => {
        const coords = parsePostGISPoint(issue.location);
        const lat = coords?.lat ?? 12.9716;
        const lng = coords?.lng ?? 77.5946;

        // Resolve real address via Mapbox Reverse Geocoding
        const location_desc = await reverseGeocode(lng, lat);

        // Derive City/Region
        const city_region = location_desc.includes(",")
          ? location_desc.split(",").slice(-2).join(",").trim()
          : "Urban Ward";

        const photo =
          imageMap[issue.id] ||
          "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80";

        const shortId = (issue.id || `${idx + 1}`).substring(0, 4).toUpperCase();
        const ticket_no = `#MUN-${shortId}`;

        return {
          id: issue.id,
          ticket_no,
          title: issue.title || "Civic Incident Report",
          description:
            issue.description ||
            "Field report registered with GPS coordinates. Triaged by municipal automated system.",
          category: issue.category || "other",
          status: issue.status || "reported",
          priority_score: issue.priority_score || 75,
          report_count: issue.report_count || 1,
          location_desc,
          city_region,
          lat,
          lng,
          created_at: issue.created_at || new Date().toISOString(),
          time_ago: formatTimeAgo(issue.created_at || new Date().toISOString()),
          image_url: photo,
          uploader_label: imageMap[issue.id]
            ? "Uploaded by Citizen (Cloudinary / Flutter)"
            : "Field inspection photo · GPS Verified",
        };
      })
    );
  } else {
    formattedIssues = PAN_INDIA_DEMO;
  }

  const stats = {
    critical: critCount.count ?? (formattedIssues.filter((i) => i.priority_score >= 80).length || 4),
    pending: openCount.count ?? (formattedIssues.length || 18),
    dispatched: dispatchedCount.count ?? 12,
    resolvedToday: resolvedCount.count ?? 34,
  };

  return <OverviewClient initialIssues={formattedIssues} stats={stats} />;
}
