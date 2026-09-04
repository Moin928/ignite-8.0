// Run: node seed.mjs
// Seeds 6 demo issues into Supabase for the hackathon demo

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://ymrsjxxegcqhcaeeizip.supabase.co",
  // service role key to bypass RLS
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltcnNqeHhlZ2NxaGNhZWVpemlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQyODQyOSwiZXhwIjoyMTA0MDA0NDI5fQ.xwf2VlINq0OUwJt1Y0DkkU524U_AN3TNf7RXMu8G3sM"
);

const ISSUES = [
  {
    title: "Large Pothole on MG Road",
    description: "Multiple vehicles damaged. Deep crater spanning entire left lane near flyover. Urgent repair needed.",
    category: "pothole",
    status: "reported",
    priority_score: 87.0,
    location: "POINT(77.5946 12.9716)",
    report_count: 9,
  },
  {
    title: "Streetlight Outage – Park Street",
    description: "Three consecutive streetlights out causing safety hazard after dark near residential zone.",
    category: "streetlight",
    status: "assigned",
    priority_score: 62.0,
    location: "POINT(77.5996 12.9756)",
    report_count: 3,
  },
  {
    title: "Garbage Overflow – Koramangala Market",
    description: "Bins overflowing at sector 7 market. Sanitation crew dispatched but clearing pending.",
    category: "garbage",
    status: "in_progress",
    priority_score: 75.0,
    location: "POINT(77.6101 12.9352)",
    report_count: 5,
  },
  {
    title: "Water Pipe Burst – HSR Layout",
    description: "Main transmission line burst causing road flooding and 12-hour water disruption to residents.",
    category: "water_leakage",
    status: "reported",
    priority_score: 92.0,
    location: "POINT(77.6494 12.9116)",
    report_count: 12,
  },
  {
    title: "Road Erosion – Whitefield Bypass",
    description: "Severe erosion near highway bypass entry ramp after monsoon. Risk of collapse.",
    category: "road_damage",
    status: "assigned",
    priority_score: 55.0,
    location: "POINT(77.7480 12.9698)",
    report_count: 2,
  },
  {
    title: "Open Manhole – Indiranagar 5th Ave",
    description: "Open manhole near pedestrian crossing creating immediate hazard. No barrier placed.",
    category: "other",
    status: "resolved",
    priority_score: 90.0,
    location: "POINT(77.5750 12.9850)",
    report_count: 7,
  },
];

async function seed() {
  console.log("🌱 Seeding demo issues into Supabase...");

  for (const issue of ISSUES) {
    const { data, error } = await supabase.from("issues").insert(issue).select().single();
    if (error) {
      console.error(`❌ Failed: ${issue.title}`, error.message);
    } else {
      console.log(`✅ Seeded: ${issue.title} (id: ${data.id})`);
    }
  }

  console.log("\n✅ Done! Refresh your dashboard at http://localhost:3000");
}

seed();
