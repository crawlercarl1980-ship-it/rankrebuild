/*
-- Run this SQL in the Supabase SQL editor to set up the database schema

CREATE TABLE sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  app_password TEXT NOT NULL,
  wp_username TEXT NOT NULL DEFAULT 'admin',
  seo_plugin TEXT CHECK (seo_plugin IN ('yoast', 'rankmath', 'none')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('page_edit', 'blog_post')) NOT NULL,
  page_id INTEGER,
  field TEXT,
  old_value TEXT,
  new_value TEXT NOT NULL,
  title TEXT,
  status TEXT CHECK (status IN ('pending', 'deployed', 'rolled_back')) DEFAULT 'pending',
  deployed_at TIMESTAMPTZ,
  wp_post_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own sites" ON sites FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only see their own changes" ON changes FOR ALL USING (auth.uid() = user_id);
*/

import { createClient } from '@supabase/supabase-js';
import { Site, Change } from '@/types';

export function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getSiteById(siteId: string, userId: string): Promise<Site | null> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('id', siteId)
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data as Site;
}

export async function getSitesForUser(userId: string): Promise<Site[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data as Site[]) || [];
}

export async function getRecentChanges(userId: string, limit = 10): Promise<Change[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('changes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data as Change[]) || [];
}

export async function logChange(change: Omit<Change, 'id' | 'created_at'>): Promise<Change | null> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('changes')
    .insert(change)
    .select()
    .single();
  if (error) return null;
  return data as Change;
}

export async function rollbackChange(changeId: string): Promise<boolean> {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from('changes')
    .update({ status: 'rolled_back' })
    .eq('id', changeId);
  return !error;
}
