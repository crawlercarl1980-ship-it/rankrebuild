CREATE TABLE IF NOT EXISTS sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  app_password TEXT NOT NULL,
  wp_username TEXT NOT NULL DEFAULT 'admin',
  seo_plugin TEXT CHECK (seo_plugin IN ('yoast', 'rankmath', 'none')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS changes (
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sites' AND policyname = 'Users can only see their own sites') THEN
    CREATE POLICY "Users can only see their own sites" ON sites FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'changes' AND policyname = 'Users can only see their own changes') THEN
    CREATE POLICY "Users can only see their own changes" ON changes FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;
