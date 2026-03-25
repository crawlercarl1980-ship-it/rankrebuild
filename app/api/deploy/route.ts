import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import { updatePage, createPost } from '@/lib/wordpress';
import { BlogPost } from '@/types';

export async function POST(req: Request) {
  console.log('[deploy] POST called');
  try {
    const body = await req.json();
    const { siteId, changeType, pageId, field, newValue, oldValue, pageTitle, blogPost } = body;

    if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 });

    const admin = createSupabaseAdmin();
    const { data: site } = await admin.from('sites').select('*').eq('id', siteId).single();
    if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 });

    let deployedUrl = '';
    let wpPostId: number | undefined;

    if (changeType === 'page_edit') {
      const updates: { title?: string; content?: string } = {};
      if (field === 'title') updates.title = newValue;
      if (field === 'content') updates.content = newValue;
      // Retry once on connection reset (LocalWP quirk)
      let updated;
      try {
        updated = await updatePage(site.url, site.wp_username, site.app_password, pageId, updates);
      } catch (fetchErr) {
        const msg = fetchErr instanceof Error ? fetchErr.message : '';
        if (msg.includes('ECONNRESET') || msg.includes('ECONNREFUSED') || msg.includes('fetch')) {
          await new Promise(r => setTimeout(r, 1000));
          updated = await updatePage(site.url, site.wp_username, site.app_password, pageId, updates);
        } else {
          throw fetchErr;
        }
      }
      deployedUrl = updated.link;

    } else if (changeType === 'blog_post') {
      const post: BlogPost = blogPost;
      const result = await createPost(site.url, site.wp_username, site.app_password, post);
      deployedUrl = result.link;
      wpPostId = result.id;
    } else {
      return NextResponse.json({ error: 'Invalid changeType' }, { status: 400 });
    }

    // Log the change (best effort — don't fail if logging fails)
    try {
      await admin.from('changes').insert({
        site_id: siteId,
        user_id: '00000000-0000-0000-0000-000000000001',
        type: changeType === 'page_edit' ? 'page_edit' : 'blog_post',
        page_id: pageId,
        field,
        old_value: oldValue,
        new_value: newValue || blogPost?.content,
        title: pageTitle || blogPost?.title,
        status: 'deployed',
        deployed_at: new Date().toISOString(),
        wp_post_id: wpPostId,
      });
    } catch { /* ignore logging errors */ }

    console.log('[deploy] Success, url:', deployedUrl);
    return NextResponse.json({ ok: true, url: deployedUrl, changeType });

  } catch (e) {
    console.error('[deploy] Error caught:', e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Deploy failed' },
      { status: 500 }
    );
  }
}
