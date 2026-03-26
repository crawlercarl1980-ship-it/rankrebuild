const https = require('https');

const sql = `create table if not exists migrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  source_url text not null,
  business_name text,
  status text default 'pending',
  progress_message text,
  preview_url text,
  wp_site_id text,
  wp_site_url text,
  scraped_pages jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table migrations enable row level security;`;

const data = JSON.stringify({ query: sql });

const options = {
  hostname: 'api.supabase.com',
  path: '/v1/projects/quidjhmupbampaaevmvl/database/query',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sbp_e3c7a56812a2f7cbbcff14870d6b08149a8ded34',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', body);
  });
});
req.on('error', e => console.error('Error:', e));
req.write(data);
req.end();
