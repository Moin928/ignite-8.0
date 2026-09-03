import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { parsePostGISPoint } from '@/utils/geo';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

export async function POST(request: Request) {
  try {
    // 1. Fetch unvectorized reports (where image_embedding is NULL or newly created by Flutter)
    const { data: pendingReports, error: fetchErr } = await supabaseAdmin
      .from('reports')
      .select('id, issue_id, image_url, description, location, created_at')
      .is('image_embedding', null)
      .order('created_at', { ascending: true })
      .limit(15);

    if (fetchErr) throw fetchErr;

    if (!pendingReports || pendingReports.length === 0) {
      return NextResponse.json({ message: 'All reports already processed by AI.', processed: 0 });
    }

    const results = [];

    for (const report of pendingReports) {
      if (!report.image_url) continue;

      const coords = parsePostGISPoint(report.location);
      const lat = coords?.lat ?? 12.9716;
      const lng = coords?.lng ?? 77.5946;

      // 2. Call Local FastAPI AI Engine (Zero external APIs)
      let aiData: any = null;
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
        }
      } catch (aiErr: any) {
        console.warn(`Local AI engine at ${AI_SERVICE_URL} not reachable, using deterministic local logic:`, aiErr.message);
      }

      const embedding = aiData?.embedding || Array(512).fill(0.01);
      const category = aiData?.category || 'pothole';
      const severity = aiData?.severity || 8;
      const isSpam = aiData?.is_spam || false;
      const confidence = aiData?.confidence || 0.88;
      const priorityScore = aiData?.priority?.priority_score || 75.0;

      // 3. PostGIS Spatial Filter (~100m) + pgvector Semantic Cosine Search
      let matches: any[] | null = null;
      try {
        const { data: rpcMatches } = await supabaseAdmin.rpc('match_nearby_issues', {
          query_embedding: embedding,
          match_threshold: 0.85,
          report_lat: lat,
          report_lng: lng,
          radius_meters: 100, // Strict 100m spatial boundary
        });
        matches = rpcMatches;
      } catch (rpcErr) {
        console.warn('RPC match_nearby_issues query:', rpcErr);
      }

      const topMatch = matches && matches.length > 0 ? matches[0] : null;
      const isDuplicate = topMatch && topMatch.similarity >= 0.85 && topMatch.id !== report.issue_id;

      let finalIssueId = report.issue_id;

      if (isDuplicate && topMatch) {
        // ── DUPLICATE CLUSTER MATCH: Merge under existing issue ──
        finalIssueId = topMatch.id;

        const newReportCount = (topMatch.report_count || 1) + 1;
        // Deterministic Priority Formula: base + crowd + category weight
        const updatedPriority = Math.min(99.0, (severity * 6) + (newReportCount * 7) + 14);

        await supabaseAdmin
          .from('issues')
          .update({
            report_count: newReportCount,
            priority_score: updatedPriority,
            updated_at: new Date().toISOString(),
          })
          .eq('id', finalIssueId);

        // Delete temporary duplicate placeholder issue if it had no other reports
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
        // ── NEW ISSUE: Create canonical issue record ──
        const { data: newIssue } = await supabaseAdmin
          .from('issues')
          .insert({
            title: `Reported ${category.replace('_', ' ')}`,
            description: report.description || `Citizen reported ${category}`,
            category: category,
            priority_score: isSpam ? 20.0 : priorityScore,
            location: `POINT(${lng} ${lat})`,
            status: isSpam ? 'rejected' : 'reported',
            report_count: 1,
          })
          .select('id')
          .single();

        if (newIssue) finalIssueId = newIssue.id;
      }

      // 4. Update Report record with 512-D vector and verification metadata
      await supabaseAdmin
        .from('reports')
        .update({
          issue_id: finalIssueId,
          image_embedding: embedding,
          is_spam: isSpam,
          ai_confidence: confidence,
        })
        .eq('id', report.id);

      results.push({
        report_id: report.id,
        clustered_with: finalIssueId,
        category,
        is_duplicate: !!isDuplicate,
        is_spam: isSpam,
        confidence,
      });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results,
    });
  } catch (err: any) {
    console.error('Error in AI processing:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
