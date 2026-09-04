import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';
import { parsePostGISPoint } from '@/utils/geo';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// ─────────────────────────────────────────────────────────────
// Tier 1: Location + Category deduplication (always works, no AI needed)
// Groups reports that are within 200m of each other AND same category
// ─────────────────────────────────────────────────────────────
async function spatialDeduplicate(
  issueId: string,
  lat: number,
  lng: number,
  category: string,
): Promise<string | null> {
  // Find the oldest active issue of the same category within 200m
  // Uses pure PostGIS — no vectors needed, works 100% of the time
  const { data, error } = await supabaseAdmin.rpc('find_nearby_same_category_issue', {
    p_issue_id: issueId,
    p_lat: lat,
    p_lng: lng,
    p_category: category,
    p_radius_meters: 200,
  });

  if (error) {
    console.warn('spatial dedup RPC error:', error.message);
    return null;
  }

  return data && data.length > 0 ? (data[0] as any).id : null;
}

// ─────────────────────────────────────────────────────────────
// Tier 2: CLIP embedding deduplication (best quality, needs AI)
// ─────────────────────────────────────────────────────────────
async function getAIEmbedding(imageUrl: string, description: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${AI_SERVICE_URL}/process-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, description }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (
      data.embedding &&
      Array.isArray(data.embedding) &&
      data.embedding.length === 512 &&
      !data.embedding.every((v: number) => v === 0.01)
    ) {
      return data;
    }
    return { ...data, embedding: null };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Priority calculation
// ─────────────────────────────────────────────────────────────
function calcPriority(category: string, reportCount: number): number {
  const w: Record<string, number> = {
    water_leakage: 15, pothole: 14, road_damage: 12,
    streetlight: 10, garbage: 8, other: 6,
  };
  return Math.min(99, 50 + reportCount * 7 + (w[category] ?? 6));
}

export async function POST() {
  try {
    // Fetch all reports needing processing (embedding IS NULL)
    const { data: pending, error: fetchErr } = await supabaseAdmin
      .from('reports')
      .select('id, issue_id, image_url, description, location, created_at')
      .is('image_embedding', null)
      .order('created_at', { ascending: true })
      .limit(30);

    if (fetchErr) throw fetchErr;
    if (!pending || pending.length === 0) {
      return NextResponse.json({ message: 'No pending reports.', processed: 0 });
    }

    const results = [];

    for (const report of pending) {
      if (!report.image_url) continue;

      const coords = parsePostGISPoint(report.location);
      const lat = coords?.lat ?? 12.9716;
      const lng = coords?.lng ?? 77.5946;

      // --- Get issue category ---
      const { data: issueData } = await supabaseAdmin
        .from('issues')
        .select('category, title')
        .eq('id', report.issue_id)
        .single();
      const category: string = (issueData?.category as string) || 'other';

      // --- TIER 1: Spatial + Category deduplication (always runs) ---
      const spatialMatch = await spatialDeduplicate(report.issue_id, lat, lng, category);

      // --- TIER 2: AI embedding (runs if AI is available) ---
      const aiData = await getAIEmbedding(report.image_url, report.description || '');
      const embedding: number[] | null = aiData?.embedding || null;
      const isSpam: boolean = aiData?.is_spam || false;
      const confidence: number = aiData?.confidence || 0.5;

      let finalIssueId: string = report.issue_id;
      let mergedWith: string | null = null;
      let tier = 'none';

      if (spatialMatch && spatialMatch !== report.issue_id) {
        // Merge into the existing nearby same-category issue
        finalIssueId = spatialMatch;
        mergedWith = spatialMatch;
        tier = 'spatial';
      }

      // If we merged, update the parent issue
      if (mergedWith) {
        const { data: parent } = await supabaseAdmin
          .from('issues')
          .select('report_count, category')
          .eq('id', finalIssueId)
          .single();

        const newCount = ((parent?.report_count as number) || 1) + 1;

        await supabaseAdmin
          .from('issues')
          .update({
            report_count: newCount,
            priority_score: calcPriority((parent?.category as string) || category, newCount),
            updated_at: new Date().toISOString(),
          })
          .eq('id', finalIssueId);

        // Delete orphan issue (the duplicate placeholder that Flutter created)
        if (report.issue_id !== finalIssueId) {
          const { data: orphan } = await supabaseAdmin
            .from('issues')
            .select('report_count')
            .eq('id', report.issue_id)
            .single();

          if (orphan && (orphan.report_count as number) <= 1) {
            await supabaseAdmin.from('reports').update({ issue_id: finalIssueId }).eq('id', report.id);
            await supabaseAdmin.from('issues').delete().eq('id', report.issue_id);
          }
        }
      }

      // Update report row
      await supabaseAdmin
        .from('reports')
        .update({
          issue_id: finalIssueId,
          image_embedding: embedding, // null if AI unreachable — never stores fake
          is_spam: isSpam,
          ai_confidence: confidence !== 0.5 ? confidence : null,
        })
        .eq('id', report.id);

      const action = mergedWith ? `MERGED → ${mergedWith.slice(0, 8)}` : isSpam ? 'SPAM_FLAGGED' : 'UNIQUE';
      console.log(`[${tier.toUpperCase()}] ${report.id.slice(0, 8)} → ${action} | cat=${category} | embed=${embedding ? 'REAL' : 'NULL'}`);

      results.push({
        report_id: report.id,
        final_issue_id: finalIssueId,
        merged_with: mergedWith,
        tier,
        category,
        is_spam: isSpam,
        has_embedding: embedding !== null,
      });
    }

    const merged = results.filter(r => r.merged_with).length;
    const unique = results.filter(r => !r.merged_with && !r.is_spam).length;

    return NextResponse.json({
      success: true,
      processed: results.length,
      merged,
      unique,
      details: results,
    });
  } catch (err: any) {
    console.error('process-pending error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
