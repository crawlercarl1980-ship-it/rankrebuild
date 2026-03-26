import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

interface ApproveRequest {
  job_id: string;
  action: 'approved' | 'changes_requested';
  feedback?: string;
}

export async function POST(req: NextRequest) {
  let body: ApproveRequest;
  try {
    body = await req.json() as ApproveRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { job_id, action, feedback } = body;

  if (!job_id || !action) {
    return NextResponse.json({ error: 'job_id and action are required' }, { status: 400 });
  }

  if (action !== 'approved' && action !== 'changes_requested') {
    return NextResponse.json({ error: 'action must be "approved" or "changes_requested"' }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const updateData: {
    client_approval: string;
    updated_at: string;
    client_feedback?: string;
  } = {
    client_approval: action,
    updated_at: new Date().toISOString(),
  };

  if (feedback) {
    updateData.client_feedback = feedback;
  }

  const { error } = await supabase
    .from('migrations')
    .update(updateData)
    .eq('id', job_id);

  if (error) {
    console.error('Supabase update error:', error);
    return NextResponse.json({ error: 'Failed to update approval status' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
