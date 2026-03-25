import { WPPage, BlogPost } from '@/types';
import { wpRequest } from './wordpress-request';
import { isDemoSite, getDemoPages, getDemoPage } from './demo-data';

// Set globally for local dev - allows self-signed certs from LocalWP
// This is safe because we only connect to local/trusted WordPress sites
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

function authHeader(username: string, appPassword: string): string {
  return 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64');
}

function apiUrl(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/$/, '');
  return `${base}/wp-json/wp/v2/${path}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fetchOptions(_siteUrl: string, extra: Record<string, any> = {}): Record<string, any> {
  return extra;
}



export async function testConnection(
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<{ ok: boolean; error?: string }> {
  if (isDemoSite(siteUrl)) return { ok: true };
  try {
    const response = await wpRequest(apiUrl(siteUrl, 'users/me'), {
      headers: { Authorization: authHeader(username, appPassword) },
    });
    if (response.status < 200 || response.status >= 300) {
      const body = JSON.parse(response.body || '{}');
      return { ok: false, error: body?.message || `HTTP ${response.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Connection failed' };
  }
}

export async function getPages(
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<WPPage[]> {
  if (isDemoSite(siteUrl)) return getDemoPages();
  const response = await wpRequest(apiUrl(siteUrl, 'pages?per_page=50&status=publish'), {
    headers: { Authorization: authHeader(username, appPassword) },
  });
  if (response.status < 200 || response.status >= 300) throw new Error(`Failed to fetch pages: ${response.status}`);
  return JSON.parse(response.body) as WPPage[];
}

export async function getPage(
  siteUrl: string,
  username: string,
  appPassword: string,
  pageId: number
): Promise<WPPage> {
  if (isDemoSite(siteUrl)) {
    const page = getDemoPage(pageId);
    if (!page) throw new Error(`Demo page ${pageId} not found`);
    return page;
  }
  const response = await wpRequest(apiUrl(siteUrl, `pages/${pageId}`), {
    headers: { Authorization: authHeader(username, appPassword) },
  });
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Failed to fetch page ${pageId}: ${response.status}`);
  }
  return JSON.parse(response.body) as WPPage;
}

export async function updatePage(
  siteUrl: string,
  username: string,
  appPassword: string,
  pageId: number,
  updates: { title?: string; content?: string }
): Promise<WPPage> {
  if (isDemoSite(siteUrl)) {
    // Simulate a successful update in demo mode
    const page = getDemoPage(pageId);
    if (!page) throw new Error(`Demo page ${pageId} not found`);
    return { ...page, ...updates, title: { rendered: updates.title || page.title.rendered }, content: { rendered: updates.content || page.content.rendered } };
  }
  // Use node http module directly to avoid ECONNRESET crashing the server
  const response = await wpRequest(apiUrl(siteUrl, `pages/${pageId}`), {
    method: 'POST',
    headers: {
      Authorization: authHeader(username, appPassword),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (response.status < 200 || response.status >= 300) {
    const body = JSON.parse(response.body || '{}');
    throw new Error(body?.message || `Failed to update page: ${response.status}`);
  }
  return JSON.parse(response.body) as WPPage;
}

export async function createPost(
  siteUrl: string,
  username: string,
  appPassword: string,
  post: BlogPost
): Promise<{ id: number; link: string }> {
  // Build FAQ schema markup
  const faqSchema = post.faq.length > 0 ? `
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": post.faq.map(f => ({
    "@type": "Question",
    "name": f.question,
    "acceptedAnswer": { "@type": "Answer", "text": f.answer }
  }))
})}
</script>` : '';

  const faqHtml = post.faq.length > 0 ? `
<h2>Frequently Asked Questions</h2>
${post.faq.map(f => `<h3>${f.question}</h3><p>${f.answer}</p>`).join('\n')}` : '';

  const fullContent = `${post.content}${faqHtml}\n<p><strong>${post.cta}</strong></p>${faqSchema}`;

  const body: Record<string, unknown> = {
    title: post.title,
    content: fullContent,
    status: 'publish',
    slug: post.slug,
    tags: post.tags,
  };

  const postResponse = await wpRequest(apiUrl(siteUrl, 'posts'), {
    method: 'POST',
    headers: {
      Authorization: authHeader(username, appPassword),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (postResponse.status < 200 || postResponse.status >= 300) {
    const err = JSON.parse(postResponse.body || '{}');
    throw new Error(err?.message || `Failed to create post: ${postResponse.status}`);
  }

  const data = JSON.parse(postResponse.body);
  return { id: data.id, link: data.link };
}

export async function getSEOPlugin(
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<'yoast' | 'rankmath' | 'none'> {
  if (isDemoSite(siteUrl)) return 'yoast';
  try {
    const res = await wpRequest(apiUrl(siteUrl, 'plugins?per_page=100'), {
      headers: { Authorization: authHeader(username, appPassword) },
    });
    if (res.status < 200 || res.status >= 300) return 'none';
    const plugins: Array<{ plugin: string }> = JSON.parse(res.body);
    const slugs = plugins.map(p => p.plugin.toLowerCase());
    if (slugs.some(s => s.includes('wordpress-seo'))) return 'yoast';
    if (slugs.some(s => s.includes('seo-by-rank-math'))) return 'rankmath';
    return 'none';
  } catch {
    return 'none';
  }
}
