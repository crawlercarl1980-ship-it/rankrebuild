import { NextResponse } from 'next/server';
import { createSupabaseClient, createSupabaseAdmin } from '@/lib/supabase';
import { testConnection, getSEOPlugin } from '@/lib/wordpress';

// DEV MODE: auth bypassed for local testing
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function GET() {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from('sites')
    .select('*')
    .eq('user_id', DEV_USER_ID)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const session = { user: { id: DEV_USER_ID } };

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
    .insert({ name, url, wp_username, app_password, seo_plugin, user_id: DEV_USER_ID })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from('sites')
    .delete()
    .eq('id', id)
    .eq('user_id', DEV_USER_ID);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
