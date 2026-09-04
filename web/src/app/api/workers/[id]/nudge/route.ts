import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const customMessage =
      body.message ||
      '🚨 PRIORITY DISPATCH NUDGE: Municipal Authority requests an urgent on-site status update on your active repair assignments.';

    // Fetch worker profile
    const { data: worker, error: workerErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', id)
      .single();

    if (workerErr || !worker) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Fetch worker's active assigned issues
    const { data: assignedIssues } = await supabaseAdmin
      .from('issues')
      .select('id, title, category')
      .eq('assigned_worker_id', id)
      .in('status', ['assigned', 'in_progress']);

    const issueCount = assignedIssues?.length || 0;

    // Dispatch notification to worker in Supabase
    const { data: notif, error: notifErr } = await supabaseAdmin
      .from('notifications' as any)
      .insert({
        citizen_id: id, // worker id in profiles
        issue_id: assignedIssues?.[0]?.id || null,
        type: 'worker_nudge',
        title: '🚨 Urgent Municipal Nudge',
        message: `${customMessage} (${issueCount} active task${issueCount !== 1 ? 's' : ''})`,
        is_read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (notifErr) {
      console.warn('Notification insert note:', notifErr.message);
    }

    return NextResponse.json({
      success: true,
      message: `Priority nudge dispatched to ${worker.full_name} (${worker.phone || 'mobile app'})!`,
      worker_id: id,
      active_dockets: issueCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
