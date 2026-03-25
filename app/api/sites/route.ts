import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { testConnection, getSEOPlugin } from '@/lib/wordpress';

async function getUserId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from('sites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, url, wp_username, app_password } = await req.json();
  if (!name || !url || !wp_username || !app_password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  // Test connection before saving
  const test = await testConnection(url, wp_username, app_password);
  if (!test.ok) {
    return NextResponse.json({ error: `Connection failed: ${test.error}` }, { status: 400 });
  }

  // Detect SEO plugin
  const seo_plugin = await getSEOPlugin(url, wp_username, app_password);

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from('sites')
    .insert({ name, url, wp_username, app_password, seo_plugin, user_id: userId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from('sites')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
