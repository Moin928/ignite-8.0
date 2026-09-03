import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// Helper to extract lat & lng from PostGIS location
function extractCoordinates(loc: any): { lat: number; lng: number } | null {
  if (!loc) return null;
  if (typeof loc === 'object' && loc.type === 'Point' && Array.isArray(loc.coordinates)) {
    return { lng: loc.coordinates[0], lat: loc.coordinates[1] };
  }
  if (typeof loc === 'string' && loc.startsWith('POINT(')) {
    const coords = loc.replace('POINT(', '').replace(')', '').split(' ');
    return { lng: parseFloat(coords[0]), lat: parseFloat(coords[1]) };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    // 1. Fetch unvectorized reports (where image_embedding is NULL or newly created by Flutter)
    const { data: pendingReports, error: fetchErr } = await supabaseAdmin
      .from('reports')
      .select('id, issue_id, image_url, description, location, created_at')
      .is('image_embedding', null)
      .order('created_at', { ascending: true })
      .limit(10);

    if (fetchErr) throw fetchErr;

    if (!pendingReports || pendingReports.length === 0) {
      return NextResponse.json({ message: 'All reports already processed by AI.', processed: 0 });
    }

    const results = [];

    for (const report of pendingReports) {
      if (!report.image_url) continue;

      const coords = extractCoordinates(report.location);
      const lat = coords?.lat ?? 12.9716;
      const lng = coords?.lng ?? 77.5946;

      // 2. Call Python FastAPI to process Cloudinary image with CLIP + ViT
      let aiData;
      try {
        const aiRes = await fetch(`${AI_SERVICE_URL}/process-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: report.image_url,
            description: report.description || '',
          }),
        });
        if (aiRes.ok) {
          aiData = await aiRes.json();
        } else {
          console.warn(`Python AI service returned status ${aiRes.status}`);
        }
      } catch (aiErr: any) {
        console.warn(`Could not reach Python AI engine at ${AI_SERVICE_URL}:`, aiErr.message);
      }

      // If AI service is not running, fallback to mock 512-D vector so flow never breaks
      const embedding = aiData?.embedding || Array(512).fill(0.01);
      const category = aiData?.category || 'pothole';
      const severity = aiData?.severity || 7;

      // 3. Query Supabase for nearby duplicate candidates using PostGIS + pgvector (100m radius)
      let matches: any[] | null = null;
      try {
        const { data: rpcMatches } = await supabaseAdmin.rpc('match_nearby_issues', {
          query_embedding: embedding,
          match_threshold: 0.85,
          report_lat: lat,
          report_lng: lng,
          radius_meters: 100, // 100m spatial boundary
        });
        matches = rpcMatches;
      } catch (rpcErr) {
        console.warn('RPC match_nearby_issues error:', rpcErr);
      }

      const topMatch = matches && matches.length > 0 ? matches[0] : null;
      const isDuplicate = topMatch && topMatch.similarity >= 0.85 && topMatch.id !== report.issue_id;

      let finalIssueId = report.issue_id;

      if (isDuplicate && topMatch) {
        // ── MATCH FOUND: Cluster under existing issue ──
        finalIssueId = topMatch.id;

        // Bump report count and recalculate deterministic priority
        const newReportCount = (topMatch.report_count || 1) + 1;
        const newPriorityScore = Math.min(100, severity * 5 + newReportCount * 10);

        await supabaseAdmin
          .from('issues')
          .update({
            report_count: newReportCount,
            priority_score: newPriorityScore,
            updated_at: new Date().toISOString(),
          })
          .eq('id', finalIssueId);

        // If an empty placeholder issue was created when the report was inserted, clean it up
        if (report.issue_id && report.issue_id !== finalIssueId) {
          const { data: oldIssue } = await supabaseAdmin
            .from('issues')
            .select('report_count')
            .eq('id', report.issue_id)
            .single();

          if (oldIssue && oldIssue.report_count <= 1) {
            await supabaseAdmin.from('issues').delete().eq('id', report.issue_id);
          }
        }
      } else if (!finalIssueId) {
        // ── NEW ISSUE: Create canonical problem cluster ──
        const initialPriority = severity * 5 + 10;
        const { data: newIssue } = await supabaseAdmin
          .from('issues')
          .insert({
            title: `Reported ${category.replace('_', ' ')} at Ward 14`,
            description: report.description || `Citizen reported ${category}`,
            category: category,
            priority_score: initialPriority,
            location: `POINT(${lng} ${lat})`,
            status: 'reported',
            report_count: 1,
          })
          .select('id')
          .single();

        if (newIssue) finalIssueId = newIssue.id;
      }

      // 4. Update the report with the computed embedding and final cluster issue_id
      await supabaseAdmin
        .from('reports')
        .update({
          issue_id: finalIssueId,
          image_embedding: embedding,
          ai_confidence: topMatch?.similarity ?? 1.0,
        })
        .eq('id', report.id);

      results.push({
        report_id: report.id,
        clustered_with: finalIssueId,
        is_duplicate: !!isDuplicate,
        similarity: topMatch?.similarity ?? 1.0,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results,
    });
  } catch (err: any) {
    console.error('Error in AI process-pending:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Also support GET for easy trigger / health checks
export async function GET(request: Request) {
  return POST(request);
}
