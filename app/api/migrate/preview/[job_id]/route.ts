import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ job_id: string }> }
) {
  const { job_id } = await params;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from('migrations')
    .select('id, business_name, status, preview_url, client_approval, client_feedback')
    .eq('id', job_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Migration not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
