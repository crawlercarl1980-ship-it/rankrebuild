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
${allImages.length > 0 ? `- Original images (use these as src): ${allImages.slice(0, 6).join(', ')}` : ''}

DESIGN STYLE — match this exact aesthetic:
- Deep dark navy background: #0a1628 for main bg, #0d3b6e for section accents
- Teal accent color: #00bcd4 (borders, highlights, CTA buttons, hover states)
- Gold accent: #f4a81d for special highlights and stars
- White text on dark backgrounds, dark text on light cards
- Font: 'Segoe UI', system-ui, sans-serif — clean and professional
- Fixed navbar: rgba(10,22,40,0.92) with backdrop-filter blur, teal bottom border, height 70px
- Hero: full viewport height, dark overlay on background image from Unsplash (use a relevant search term for the business), large bold white headline, teal subheadline, gold CTA button, scroll indicator
- Sections alternate: dark (#0a1628) and slightly lighter (#0d2645)
- Cards: dark bg with subtle teal border, hover lift effect (translateY(-6px) with box-shadow)
- Section headers: small teal uppercase label above large white bold title
- Buttons: teal background, white text, rounded, hover gold
- Footer: very dark (#060e1a), teal accent borders

REQUIRED SECTIONS (in order):
1. Fixed nav with logo text + nav links (Home, About, Services, [business-specific page], Contact) + mobile hamburger
2. Hero: full-height, background image from Unsplash (pick a great relevant photo URL), dark overlay, business name, tagline, CTA "Get Started" button, animated scroll arrow
3. "Why Choose Us" / Features: 3-4 cards with SVG icons, titles, descriptions based on real content
4. Services/Offerings: grid of service cards with real content from the scraped pages
5. About section: split layout — compelling copy left, stats/highlights right
6. Testimonials: 3 realistic testimonials with star ratings, names, realistic quotes based on business type
7. Call-to-action banner: full-width teal/navy gradient, strong headline, button
8. Contact: dark section, form (name, email, phone, message) + contact info sidebar
9. Footer: logo, nav links, social icons (Instagram, Facebook, Twitter placeholders), copyright

ANIMATIONS:
- Scroll reveal: elements start opacity:0 translateY(40px), animate to visible on scroll (use IntersectionObserver)
- Nav hides/shows on scroll (hide on scroll down, show on scroll up)
- Smooth hover transitions on all cards and buttons
- Hero text fade-in on load

TECHNICAL REQUIREMENTS:
- Pure HTML/CSS/vanilla JS — NO external JS frameworks or Tailwind CDN
- All CSS inline in <style> tag — write proper custom CSS (not Tailwind classes)
- Use CSS custom properties (--variables) for the color system
- Mobile responsive with hamburger menu
- Form shows inline "Thanks! We'll be in touch." success message on submit
- Small dismissible banner at very top: background #0d3b6e, teal border-bottom, text "✨ Preview of your new website — powered by RankRebuild" with ✕ close button

CONTENT RULES:
- Use ALL real scraped content — no lorem ipsum ever
- Write compelling marketing copy based on the real business
- Testimonials should sound authentic to the specific business type and location
- Service descriptions should expand on the scraped content intelligently

Return ONLY the complete HTML document. No markdown fences, no explanation, just the HTML starting with <!DOCTYPE html>.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
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
