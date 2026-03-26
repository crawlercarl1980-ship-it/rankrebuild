import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// One-shot setup endpoint — creates missing tables/columns
// Protected by a secret token so only we can call it
export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({}));
  if (token !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdmin();

  // We'll use individual inserts/selects to bootstrap since we can't run raw SQL
  // via the JS client. Instead, use the Supabase management API via fetch.
  const pat = process.env.SUPABASE_PAT;
  const projectRef = 'quidjhmupbampaaevmvl';

  if (!pat) {
    return NextResponse.json({ error: 'SUPABASE_PAT not set' }, { status: 500 });
  }

  const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      source_url TEXT NOT NULL,
      business_name TEXT,
      status TEXT DEFAULT 'scraping',
      progress_message TEXT,
      scraped_pages JSONB,
      wp_site_url TEXT,
      preview_url TEXT,
      client_approval TEXT,
      client_feedback TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE migrations ADD COLUMN IF NOT EXISTS client_approval TEXT;
    ALTER TABLE migrations ADD COLUMN IF NOT EXISTS client_feedback TEXT;
    ALTER TABLE migrations ENABLE ROW LEVEL SECURITY;
  `;

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json({ error: data.message || 'SQL failed', detail: data }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result: data });
}
