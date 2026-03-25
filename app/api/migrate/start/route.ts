import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  // Auth
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url, name, business_name } = await req.json();
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

  const admin = createSupabaseAdmin();

  // Create migration job record
  const { data: migration, error } = await admin
    .from('migrations')
    .insert({
      user_id: user.id,
      source_url: url,
      business_name: business_name || name || null,
      status: 'scraping',
      progress_message: 'Starting migration...',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget: kick off the pipeline without awaiting
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

  fetch(`${baseUrl}/api/migrate/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: migration.id }),
  }).catch(() => {
    // Best-effort — if the background call fails, the status will remain stuck
    // and the user will eventually see an error state via polling
  });

  return NextResponse.json({ job_id: migration.id });
}
