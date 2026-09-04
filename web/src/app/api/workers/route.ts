import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, phone, department, trust_score, created_at')
      .eq('role', 'worker' as any)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, phone, department } = body;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        full_name,
        phone,
        department: department || 'Civil Infrastructure Unit',
        role: 'worker' as any,
        trust_score: 1.0,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
