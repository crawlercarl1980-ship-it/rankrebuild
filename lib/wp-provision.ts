import Anthropic from '@anthropic-ai/sdk';
import { put } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Load the reference template once at module level
function loadTemplate(): string {
  try {
    const templatePath = path.join(process.cwd(), 'lib', 'site-template.html');
    return fs.readFileSync(templatePath, 'utf-8');
  } catch {
    return '';
  }
}

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
    raw_html: '',
  };

  const allHeadings = scrapedPages.flatMap(p => p.headings).slice(0, 20);
  const allParagraphs = scrapedPages.flatMap(p => p.paragraphs).slice(0, 30);
  const allImages = scrapedPages.flatMap(p => p.images).filter(Boolean).slice(0, 15);
  const pageList = scrapedPages.map(p => p.title || p.url).filter(Boolean).slice(0, 10);

  // Extract structured data from raw HTML
  const rawHtmlSample = scrapedPages
    .slice(0, 2)
    .map(p => p.raw_html?.substring(0, 10000) || '')
    .join('\n\n--- NEXT PAGE ---\n\n')
    .substring(0, 18000);

  let extractedData = '';
  if (rawHtmlSample.length > 100) {
    const extractMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Extract ALL key business info from this HTML. Return ONLY a JSON object:
{
  "phone": string,
  "email": string,
  "address": string,
  "hours": string,
  "tagline": string,
  "deal": {"name": string, "price": string, "includes": string},
  "prices": [{"name": string, "price": string, "description": string}],
  "services": [{"name": string, "description": string, "image": string}],
  "images": ["url1", "url2"],
  "team": [{"name": string, "role": string}],
  "social": {"instagram": string, "facebook": string},
  "certifications": [string],
  "trips": [{"name": string, "destination": string}]
}

HTML:
${rawHtmlSample.substring(0, 15000)}`
      }]
    });
    const extractContent = extractMsg.content[0];
    if (extractContent.type === 'text') {
      extractedData = extractContent.text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    }
  }

  // Load the reference template
  const templateHtml = loadTemplate();

  const useTemplate = templateHtml.length > 1000;

  const prompt = useTemplate
    ? `You are adapting a premium website template for a new business. The template below was built for "3D Scuba" — a scuba diving center in Charlotte, NC. Your job is to adapt it for "${businessName}" by replacing ALL 3D Scuba-specific content with the new business's content while keeping the EXACT same design, CSS, layout, animations, and structure.

NEW BUSINESS DATA:
- Business name: ${businessName}
- Title/tagline: ${primaryPage.title || businessName}
- Description: ${primaryPage.meta_description || ''}
- Pages: ${pageList.join(', ')}
- Key headings: ${allHeadings.slice(0, 10).join(' | ')}
- Content: ${allParagraphs.slice(0, 10).map(p => p.substring(0, 150)).join(' | ')}
- Images to use: ${allImages.slice(0, 8).join(', ')}
${extractedData ? `- Extracted data: ${extractedData}` : ''}

ADAPTATION RULES:
1. Keep ALL CSS exactly as-is — same colors, fonts, animations, layout
2. Replace ALL text content (business name, tagline, services, courses, prices, contact info, testimonials, about text)
3. Replace ALL images with the new business's images or relevant Unsplash photos
4. Replace ALL links/hrefs with # or the new business's real links
5. Update the page title, meta description
6. Replace "3D Scuba", "scuba", "diving", "Charlotte, NC" with the new business's equivalents
7. Adapt section names to fit the new business type (e.g. "Courses" → "Services" if not a diving business)
8. Keep the preview banner: "✨ This is a preview of your new website — powered by RankRebuild"
9. Remove the base64 logo — replace with the business name in Bebas Neue text
10. Keep ALL JavaScript and animations exactly as-is

TEMPLATE HTML TO ADAPT:
${templateHtml}

Return ONLY the complete adapted HTML. Start with <!DOCTYPE html>. No markdown fences, no explanation.`

    : `You are a world-class web designer. Create a complete, stunning website for "${businessName}".

BUSINESS DATA:
- Business name: ${businessName}
- Title: ${primaryPage.title || businessName}
- Description: ${primaryPage.meta_description || ''}
- Pages: ${pageList.join(', ')}
- Headings: ${allHeadings.slice(0, 10).join(' | ')}
- Content: ${allParagraphs.slice(0, 8).map(p => p.substring(0, 120)).join(' | ')}
- Images: ${allImages.slice(0, 8).join(', ')}
${extractedData ? `- Data: ${extractedData}` : ''}

DESIGN: Dark navy (#051923), cyan (#00c8e0) accents, coral (#ff5c3a) CTAs. Bebas Neue headlines, Outfit body font. Glassmorphism cards, scroll animations, full responsive layout.

EXACT DESIGN SYSTEM TO IMPLEMENT:
CSS variables:
  --ocean-deep: #051923;
  --ocean-mid: #0a2d42;
  --ocean-blue: #0a6aad;
  --cyan: #00c8e0;
  --aqua: #00f0e0;
  --sand: #e8dfc9;
  --coral: #ff5c3a;
  --white: #f7f9fc;
  --text: #e2eaf0;
  --muted: #7a98ad;
  --card-bg: rgba(10,45,66,0.72);
  --border: rgba(0,200,224,0.18);

Typography:
- Import from Google Fonts: Bebas Neue (display headlines), Outfit (body 300/400/500/600/700), DM Serif Display (italic accents)
- Body font: 'Outfit', sans-serif
- Hero headline: 'Bebas Neue' — very large (clamp(3rem, 10vw, 7rem)), letter-spacing 0.04em
- Section titles: 'Bebas Neue' or 'Outfit' 700, white
- Subheadings: 'DM Serif Display' italic for pull quotes or taglines

Background:
- body background: var(--ocean-deep) 
- body::before: animated multi-layer radial gradient (position:fixed, inset:0, pointer-events:none, z-index:0):
  radial-gradient(ellipse 80% 60% at 20% 80%, rgba(0,100,160,0.22) 0%, transparent 70%),
  radial-gradient(ellipse 60% 40% at 80% 20%, rgba(0,200,224,0.12) 0%, transparent 60%),
  radial-gradient(ellipse 100% 80% at 50% 110%, rgba(0,240,224,0.08) 0%, transparent 50%)

Top bar (above nav):
- background: rgba(5,25,35,0.95), border-bottom: 1px solid var(--border), padding: 8px 40px
- Show phone/email links in cyan, "Book Now" pill button (cyan border, rounded-full)
- Hide on mobile

Sticky Nav (position:sticky, top:0, z-index:200):
- background: rgba(5,25,35,0.96), backdrop-filter: blur(18px)
- border-bottom: 1px solid var(--border), height: 70px, padding: 0 40px
- Logo: business name in Bebas Neue, cyan color, 28px
- Nav links: 14px Outfit 500, hover color var(--cyan) + background rgba(0,200,224,0.08), rounded-lg
- CTA button: gradient(135deg, var(--ocean-blue), var(--cyan)), border-radius:25px, box-shadow:0 0 20px rgba(0,200,224,0.3)
- Mobile: hamburger (3 lines), full-screen overlay menu

Hero (min-height:90vh):
- Full-screen background image (pick a gorgeous relevant Unsplash URL for the business type)
- Dark overlay: linear-gradient(to bottom, rgba(5,25,35,0.7) 0%, rgba(5,25,35,0.5) 50%, rgba(5,25,35,0.85) 100%)
- Centered content, text-align:center
- Small tag above headline: border 1px cyan, cyan text, uppercase, 12px, rounded-full, padding 4px 16px
- Main headline: Bebas Neue, massive, white, with key word in cyan
- Subheading: Outfit 300, 20px, var(--muted), max-width 600px, margin auto
- Two buttons: primary (coral gradient, bold) + secondary (transparent cyan border)
- Scroll indicator: animated bouncing arrow at bottom

Trust bar (below hero):
- background: rgba(10,45,66,0.6), backdrop-filter: blur, border-top + border-bottom var(--border)
- Row of 4-5 stats/trust items: big cyan number, small muted label (e.g. "500+ Students", "15+ Years", "5-Star Rating")
- Dividers between items

Sections (alternate background colors):
- Section 1 bg: transparent (shows animated bg gradient)
- Section 2 bg: rgba(10,45,66,0.4)
- Section 3 bg: transparent
- etc.
- All sections: padding 100px 40px, max-width 1200px container, centered

Section headers (each section):
- Small label: cyan color, uppercase, 12px, letter-spacing 0.2em, with cyan line decorators ——
- Main title: Bebas Neue or Outfit 700, 48px, white
- Subtitle: Outfit 300, 18px, var(--muted)

Cards (glassmorphism):
- background: var(--card-bg), backdrop-filter: blur(12px)
- border: 1px solid var(--border), border-radius: 20px, padding: 36px
- hover: translateY(-8px), box-shadow: 0 20px 60px rgba(0,0,0,0.4), border-color: var(--cyan)
- transition: all 0.35s ease

REQUIRED SECTIONS:
1. Top bar + sticky nav with CTA
2. Hero: full-height, real Unsplash background, Bebas Neue headline, coral CTA + cyan secondary button
3. Trust bar: 4-5 stats derived from business content
4. Services/Courses: 3-column card grid with glassmorphism cards, real service content, coral "Learn More" links
5. Featured highlight: full-width section with background image + overlay, big quote or headline
6. About section: two-column — compelling copy left (with DM Serif italic pullquote), image/stats right
7. Testimonials: 3 cards, star ratings (coral ★), realistic first-person quotes, name + role
8. Call-to-action: full-width, coral gradient background, large Bebas Neue headline, white CTA button
9. Contact: two-column — form left (name, email, phone, message, submit) + info right (address, phone, email, hours)
10. Footer: dark (#020d14), logo, 3-column links, social icons row, copyright

ANIMATIONS:
- IntersectionObserver scroll reveal: .reveal class → opacity:0 translateY(30px) → opacity:1 translateY(0), 0.6s ease
- Staggered reveals on card grids (delay each card by 0.1s)
- Hero content: keyframe fade-in-up on load
- Nav: hide on scroll down (translateY(-100%)), show on scroll up
- Stats counter animation: count up from 0 to value on scroll

TECHNICAL:
- Pure HTML/CSS/vanilla JS — NO frameworks, NO CDN JS libraries
- Google Fonts via <link> in <head>
- All CSS in <style> block with CSS custom properties
- Mobile responsive: hamburger menu, single-column on mobile
- Contact form: inline success message "Thanks! We'll be in touch within 24 hours. 🎉"
- Preview banner at very top (before topbar): #051923 bg, cyan left-border, "✨ This is a preview of your new website — powered by RankRebuild" text with ✕ dismiss button
- All elements have z-index > 0 to appear above the body::before gradient layer (which is z-index:0)

CONTENT RULES:
- Use ALL real scraped content — no lorem ipsum ever
- Infer realistic stats from context (years in business, students trained, trips offered, etc.)
- Testimonials must sound authentic, specific to the business location and type
- Marketing copy should be compelling and conversion-focused

IMPORTANT: You have a token budget. Be complete but efficient — don't repeat yourself. The site MUST have a closing </body></html>. If you're running low on space, skip extra testimonials/cards rather than leaving the HTML unclosed.

Return ONLY the complete HTML. No markdown fences. No explanation. Start with <!DOCTYPE html>.`;

  let html = '';
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 128000,
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      html += event.delta.text;
    }
  }

  html = html.trim();
  // Strip markdown fences if present
  html = html.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '').trim();
  
  // Safety: if HTML was truncated (no closing tags), append them
  if (!html.includes('</body>')) {
    html += '\n</body>\n</html>';
  } else if (!html.includes('</html>')) {
    html += '\n</html>';
  }

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
