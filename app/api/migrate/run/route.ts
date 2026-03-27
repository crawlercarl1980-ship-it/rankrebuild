import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';
import { provisionWordPressSite, type ScrapedPage } from '@/lib/wp-provision';

export const maxDuration = 300; // Vercel max function duration in seconds

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

interface WPCredentials {
  site_url: string;
  wp_username: string;
  app_password: string;
  is_preview?: boolean;
}

// ─── Step 1: Scraper ──────────────────────────────────────────────────────────

async function scrapeWithFetch(pageUrl: string): Promise<ScrapedPage> {
  const res = await fetch(pageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RankRebuild/1.0)' },
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();
  return parseHtml(pageUrl, html);
}

function parseHtml(pageUrl: string, html: string): ScrapedPage {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Meta description
  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const meta_description = metaMatch ? metaMatch[1].trim() : '';

  // Headings
  const headings: string[] = [];
  const headingRe = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let m;
  while ((m = headingRe.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, '').trim();
    if (text) headings.push(text);
  }

  // Paragraphs
  const paragraphs: string[] = [];
  const paraRe = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  while ((m = paraRe.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, '').trim();
    if (text.length > 20) paragraphs.push(text);
  }

  // Images
  const images: string[] = [];
  const imgRe = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((m = imgRe.exec(html)) !== null) {
    const src = m[1];
    if (!src.startsWith('data:') && !src.includes('pixel') && !src.includes('tracking')) {
      images.push(src);
    }
  }

  // Discover internal links
  const links: string[] = [];
  const linkRe = /<a[^>]+href=["']([^"'#?]+)["']/gi;
  const base = new URL(pageUrl);
  while ((m = linkRe.exec(html)) !== null) {
    try {
      const href = new URL(m[1], pageUrl);
      if (href.hostname === base.hostname && !links.includes(href.href)) {
        links.push(href.href);
      }
    } catch {
      // ignore invalid URLs
    }
  }

  return {
    url: pageUrl,
    title,
    meta_description,
    headings,
    paragraphs: paragraphs.slice(0, 30),
    images: images.slice(0, 20),
    raw_html: html.substring(0, 50000),
  };
}

async function scrapePlaywright(startUrl: string): Promise<ScrapedPage[]> {
  // Dynamic import so the build doesn't break if playwright binary isn't available
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; RankRebuild/1.0)',
  });

  const visited = new Set<string>();
  const toVisit = [startUrl];
  const pages: ScrapedPage[] = [];
  const base = new URL(startUrl);

  while (toVisit.length > 0 && pages.length < 20) {
    const url = toVisit.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const html = await page.content();
      const scraped = parseHtml(url, html);
      pages.push(scraped);

      // Queue new internal links
      const links = await page.$$eval('a[href]', (as: HTMLAnchorElement[]) => as.map(a => a.href));
      for (const link of links) {
        try {
          const parsed = new URL(link);
          if (parsed.hostname === base.hostname && !visited.has(parsed.href) && !toVisit.includes(parsed.href)) {
            toVisit.push(parsed.href);
          }
        } catch {
          // ignore
        }
      }
      await page.close();
    } catch {
      // skip pages that fail to load
    }
  }

  await browser.close();
  return pages;
}

async function scrapeSite(startUrl: string): Promise<ScrapedPage[]> {
  try {
    return await scrapePlaywright(startUrl);
  } catch {
    // Playwright not available (e.g. Vercel) — fall back to fetch
    const page = await scrapeWithFetch(startUrl);
    return [page];
  }
}

// ─── Step 3: Rebuild content with Claude ─────────────────────────────────────

async function rebuildPageWithClaude(page: ScrapedPage): Promise<string> {
  const prompt = `Convert this scraped webpage content into clean WordPress Gutenberg HTML blocks. Return only the HTML content suitable for the WordPress content field. Use wp:paragraph, wp:heading, wp:image blocks. Keep all the original text and messaging but improve clarity and flow slightly.

Page title: ${page.title}
Headings: ${page.headings.join(' | ')}
Content paragraphs:
${page.paragraphs.slice(0, 10).join('\n\n')}
Images: ${page.images.slice(0, 5).join(', ')}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') return '';

  // Strip any markdown code fences if Claude wrapped the response
  return content.text.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '').trim();
}

// ─── Step 4: Create pages in WordPress via REST API ──────────────────────────

async function createWPPage(
  creds: WPCredentials,
  title: string,
  content: string,
  isHome: boolean
): Promise<number> {
  const authHeader = `Basic ${Buffer.from(`${creds.wp_username}:${creds.app_password}`).toString('base64')}`;

  const body: Record<string, unknown> = {
    title,
    content,
    status: 'publish',
  };
  if (isHome) body.template = '';

  const res = await fetch(`${creds.site_url}/wp-json/wp/v2/pages`, {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WP page creation failed: ${err.substring(0, 200)}`);
  }

  const data = await res.json();
  return data.id as number;
}

// ─── Step 5: Upload images to WP media library ───────────────────────────────

async function uploadImage(creds: WPCredentials, imageUrl: string): Promise<string | null> {
  try {
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    if (!imgRes.ok) return null;

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const filename = imageUrl.split('/').pop()?.split('?')[0] || 'image.jpg';

    const authHeader = `Basic ${Buffer.from(`${creds.wp_username}:${creds.app_password}`).toString('base64')}`;

    const uploadRes = await fetch(`${creds.site_url}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
      body: buffer,
    });

    if (!uploadRes.ok) return null;
    const data = await uploadRes.json();
    return (data.source_url as string) || null;
  } catch {
    return null;
  }
}

// ─── Progress updater ─────────────────────────────────────────────────────────

async function updateJob(
  admin: ReturnType<typeof createSupabaseAdmin>,
  jobId: string,
  updates: Record<string, unknown>
) {
  await admin.from('migrations').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', jobId);
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { job_id } = await req.json();
  if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 });

  const admin = createSupabaseAdmin();

  // Fetch job
  const { data: job, error: jobErr } = await admin
    .from('migrations')
    .select('*')
    .eq('id', job_id)
    .single();

  if (jobErr || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  try {
    // ── Step 1: Scrape ──────────────────────────────────────────────────────
    await updateJob(admin, job_id, {
      status: 'scraping',
      progress_message: 'Scanning your website for pages and content...',
    });

    const scrapedPages = await scrapeSite(job.source_url);

    await updateJob(admin, job_id, {
      scraped_pages: scrapedPages,
      progress_message: `Found ${scrapedPages.length} page${scrapedPages.length !== 1 ? 's' : ''}. Generating your preview site...`,
    });

    // ── Step 2: Provision WordPress (or generate static preview) ───────────
    const businessName = job.business_name || 'my-site';

    await updateJob(admin, job_id, {
      status: 'building',
      progress_message: 'Building your new website with AI...',
    });

    const wpSite = await provisionWordPressSite(businessName, scrapedPages, job_id);

    await updateJob(admin, job_id, {
      wp_site_url: wpSite.site_url,
      progress_message: wpSite.is_preview
        ? 'Preview site generated! Adding finishing touches...'
        : 'WordPress is ready! Rebuilding your content with AI...',
    });

    // ── Step 3 + 4: Rebuild and publish each page (only for real WP sites) ──
    if (!wpSite.is_preview) {
      const creds: WPCredentials = {
        site_url: wpSite.site_url,
        wp_username: wpSite.wp_username,
        app_password: wpSite.app_password,
      };

      for (let i = 0; i < scrapedPages.length; i++) {
        const page = scrapedPages[i];
        await updateJob(admin, job_id, {
          progress_message: `Rebuilding page ${i + 1} of ${scrapedPages.length}: "${page.title || page.url}"`,
        });

        const rebuiltHtml = await rebuildPageWithClaude(page);
        const isHome = i === 0;

        try {
          await createWPPage(creds, page.title || `Page ${i + 1}`, rebuiltHtml, isHome);
        } catch {
          // If WP REST fails, log and continue
          console.warn(`[migration] page creation failed for ${page.url}`);
        }
      }

      // ── Step 5: Upload images ────────────────────────────────────────────
      await updateJob(admin, job_id, {
        status: 'uploading',
        progress_message: 'Uploading images to WordPress...',
      });

      const allImages = scrapedPages.flatMap(p => p.images).slice(0, 30);
      for (const imgUrl of allImages) {
        await uploadImage(creds, imgUrl);
      }
    }

    // ── Step 6: Done ───────────────────────────────────────────────────────
    const doneMessage = wpSite.is_preview
      ? '✨ Your preview site is ready! Review it and we\'ll migrate to WordPress next.'
      : 'Migration complete!';

    await updateJob(admin, job_id, {
      status: 'ready',
      preview_url: wpSite.site_url,
      progress_message: doneMessage,
    });

    return NextResponse.json({ ok: true, is_preview: wpSite.is_preview ?? false });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await updateJob(admin, job_id, {
      status: 'error',
      progress_message: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
