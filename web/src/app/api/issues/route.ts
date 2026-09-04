import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

// The URL where your FastAPI service is running
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageUrl, description, lat, lng, citizenId } = body;

    if (!imageUrl || !lat || !lng) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Call the Local Python AI Service (Hugging Face CLIP + ViT)
    const aiResponse = await fetch(`${AI_SERVICE_URL}/process-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        description: description || ''
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI Service failed: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    
    // AI gives us a 512-dimensional CLIP embedding, category, and severity
    const embedding = aiData.embedding;
    const category = aiData.category;
    const severity = aiData.severity;

    // 2. Call Supabase RPC to find nearby duplicate issues (PostGIS + pgvector)
    // NOTE: Make sure Supabase RPC and table are updated to accept vector(512) for CLIP!
    const { data: matches, error: matchError } = await supabaseAdmin.rpc('match_nearby_issues', {
      query_embedding: embedding,
      match_threshold: 0.85, // 85% cosine similarity required
      report_lat: lat,
      report_lng: lng,
      radius_meters: 100 // Spatial index filter
    });

    if (matchError) throw matchError;

    let targetIssueId;
    let isClustered = false;

    if (matches && matches.length > 0 && matches[0].similarity > 0.85) {
      // 3A. DUPLICATE DETECTED - Cluster it!
      const matchedIssue = matches[0];
      targetIssueId = matchedIssue.id;
      isClustered = true;

      const newReportCount = matchedIssue.report_count + 1;
      const newPriorityScore = Math.min(100, severity * 5 + (newReportCount * 10));

      await supabaseAdmin
        .from('issues')
        .update({ 
          report_count: newReportCount,
          priority_score: newPriorityScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetIssueId);

    } else {
      // 3B. NEW ISSUE - Create a new cluster
      const initialPriorityScore = severity * 5 + 10;
      
      const { data: newIssue, error: insertError } = await supabaseAdmin
        .from('issues')
        .insert({
          title: `Reported ${category} at Location`,
          description: description,
          category: category,
          priority_score: initialPriorityScore,
          location: `POINT(${lng} ${lat})`,
          status: 'reported'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      targetIssueId = newIssue.id;
    }

    // 4. ALWAYS save the raw citizen report
    await supabaseAdmin
      .from('reports')
      .insert({
        issue_id: targetIssueId,
        citizen_id: citizenId || null,
        image_url: imageUrl,
        description: description,
        location: `POINT(${lng} ${lat})`,
        image_embedding: embedding,
        ai_confidence: matches?.[0]?.similarity || 1.0
      });

    return NextResponse.json({ 
      success: true, 
      issue_id: targetIssueId, 
      clustered: isClustered,
      ai_category: category,
      ai_severity: severity
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
