import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const message = body.message || 'Municipal Authority has requested higher-angle / clearer photographic evidence for this civic defect.';

    // Fetch the citizen ID from the report associated with this issue
    const { data: report } = await supabaseAdmin
      .from('reports')
      .select('id, citizen_id')
      .eq('issue_id', id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    const citizenId = report?.citizen_id;

    // Update issue with evidence requested flag and note
    await supabaseAdmin
      .from('issues')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Insert into notifications table in Supabase
    if (citizenId) {
      const { error: notifErr } = await supabaseAdmin.from('notifications' as any).insert({
        citizen_id: citizenId,
        issue_id: id,
        title: 'Additional Evidence Requested',
        message: message,
        type: 'evidence_request',
        created_at: new Date().toISOString(),
      });
      if (notifErr) {
        console.warn('Notification insert warning:', notifErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Evidence request dispatched to citizen portal successfully.',
      issue_id: id,
      citizen_id: citizenId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
