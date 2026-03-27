import Anthropic from '@anthropic-ai/sdk';
import { put } from '@vercel/blob';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScrapedPage {
  url: string;
  title: string;
  meta_description: string;
  headings: string[];
  paragraphs: string[];
  images: string[];
  raw_html: string;
}

export interface WPSite {
  site_url: string;
  wp_username: string;
  app_password: string;
  admin_url: string;
  is_preview?: boolean;
}

// ─── InstaWP Provider ────────────────────────────────────────────────────────

async function tryInstaWP(businessName: string): Promise<WPSite | null> {
  const token = process.env.INSTAWP_API_KEY || 'qzzwIB0jH2bfVdL9rVqT5PMwnMo2COeNb1LlpDB2';

  try {
    const res = await fetch('https://app.instawp.io/api/v2/sites', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30),
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      console.warn(`[wp-provision] InstaWP failed with status ${res.status}`);
      return null;
    }

    const data = (await res.json()) as {
      data?: {
        url?: string;
        wp_url?: string;
        wp_username?: string;
        wp_password?: string;
      };
    };

    const site = data?.data;
    if (!site?.url && !site?.wp_url) return null;

    const siteUrl = (site.wp_url || site.url || '').replace(/\/$/, '');
    return {
      site_url: siteUrl,
      wp_username: site.wp_username || 'admin',
      app_password: site.wp_password || '',
      admin_url: `${siteUrl}/wp-admin`,
    };
  } catch (err) {
    console.warn('[wp-provision] InstaWP error:', err);
    return null;
  }
}

// ─── HTML Preview Generator (Claude + Vercel Blob) ───────────────────────────

export async function generatePreviewSite(
  businessName: string,
  scrapedPages: ScrapedPage[],
  jobId: string
): Promise<string> {
  const primaryPage = scrapedPages[0] || {
    title: businessName,
    meta_description: '',
    headings: [],
    paragraphs: [],
    images: [],
  };

  // Collect content from all pages
  const allHeadings = scrapedPages.flatMap(p => p.headings).slice(0, 20);
  const allParagraphs = scrapedPages.flatMap(p => p.paragraphs).slice(0, 30);
  const allImages = scrapedPages.flatMap(p => p.images).filter(Boolean).slice(0, 10);
  const pageList = scrapedPages.map(p => p.title || p.url).filter(Boolean).slice(0, 10);

  const prompt = `You are a world-class web designer. Create a complete, stunning, mobile-responsive single-page HTML website for "${businessName}".

SCRAPED CONTENT TO USE:
- Main title: ${primaryPage.title || businessName}
- Meta description: ${primaryPage.meta_description || ''}
- Page sections found: ${pageList.join(', ')}
- Key headings from site: ${allHeadings.slice(0, 12).join(' | ')}
- Content excerpts:
${allParagraphs.slice(0, 15).map((p, i) => `${i + 1}. ${p.substring(0, 200)}`).join('\n')}
${allImages.length > 0 ? `- Original images (use these): ${allImages.slice(0, 5).join(', ')}` : ''}

DESIGN REQUIREMENTS:
- Use Tailwind CSS via CDN (https://cdn.tailwindcss.com)
- Use Google Fonts (Inter or similar professional font)
- Include a sticky navbar with the business name and nav links
- Beautiful hero section with a gradient background, large headline, subheadline, and CTA button
- Services/Features section with icon cards (use SVG icons or emoji)
- About section with compelling copy
- Testimonials section (fabricate 3 realistic ones based on the business type)
- Contact section with a clean form layout (name, email, message, send button) — no backend needed, just show a "Thanks!" on submit
- Professional footer with links and copyright
- Subtle scroll animations using CSS (no JS libraries needed)
- Color scheme: derive a professional palette from the business type (e.g. blue for tech, green for health, etc.)
- NO placeholder content like "Lorem ipsum" — use the real scraped content and reasonable inferred copy
- The site should look like it cost $5,000 to build
- Include a banner at the very top (small, dismissible): "✨ Preview — Your New Website" with a close button

TECHNICAL:
- Single HTML file, complete and self-contained
- All CSS via Tailwind + inline <style> for custom animations
- Minimal vanilla JS only (mobile menu toggle, form submit handler, banner dismiss)
- Return ONLY the complete HTML — no markdown, no explanation, no code fences

Generate the complete HTML now:`;

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Claude did not return text');

  let html = content.text.trim();
  // Strip markdown fences if present
  html = html.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '').trim();

  // Upload to Vercel Blob
  const filename = `preview/${jobId}.html`;
  const blob = await put(filename, html, {
    access: 'public',
    contentType: 'text/html; charset=utf-8',
    addRandomSuffix: false,
  });

  return blob.url;
}

// ─── Main provisioner (tries InstaWP, falls back to static preview) ──────────

export async function provisionWordPressSite(
  businessName: string,
  scrapedPages: ScrapedPage[],
  jobId: string
): Promise<WPSite> {
  // Try InstaWP first
  const instaWP = await tryInstaWP(businessName);
  if (instaWP) {
    console.log('[wp-provision] InstaWP succeeded:', instaWP.site_url);
    return instaWP;
  }

  // Fall back to beautiful static HTML preview
  console.log('[wp-provision] InstaWP unavailable — generating static HTML preview via Claude');
  const previewUrl = await generatePreviewSite(businessName, scrapedPages, jobId);

  console.log('[wp-provision] Preview site generated:', previewUrl);
  return {
    site_url: previewUrl,
    wp_username: '',
    app_password: '',
    admin_url: previewUrl,
    is_preview: true,
  };
}
