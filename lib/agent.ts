import { tool, zodSchema } from 'ai';
import { z } from 'zod';
import { WPPage, BlogPost } from '@/types';

export interface SiteContext {
  siteName: string;
  siteUrl: string;
  pages: WPPage[];
}

export function buildSystemPrompt(ctx: SiteContext): string {
  const pageList = ctx.pages
    .map(p => `  - ID ${p.id}: "${p.title.rendered}" (${p.slug})`)
    .join('\n');

  return `You are SitePilot, a friendly AI that helps business owners update their WordPress website through natural conversation. You are managing the website for ${ctx.siteName}.

Site URL: ${ctx.siteUrl}
Available pages:
${pageList || '  (no pages found)'}

Your job:
1. Help the user make changes to their website in plain English
2. Use get_page to fetch current page content when needed
3. ALWAYS propose changes before deploying — never skip this step
4. Use create_blog_post when the user wants a new blog article
5. NEVER call deploy_change unless the user explicitly says "approve", "looks good", "do it", or similar
6. Ask a clarifying question if the request is vague
7. Keep language friendly and non-technical

Choosing the right edit tool:
- propose_change: for simple field edits — changing a title or rewriting a short text block
- replace_page_html: for layout/structural rewrites — redesigning a section, replacing the full page body, or major HTML changes. When the page uses Gutenberg blocks (you'll see a note about this in get_page results), inform the user that the new HTML will be wrapped in a Classic block.
- insert_image: when the user wants to add an image to a page. Always confirm the image URL with the user before calling this tool. If the page is a Gutenberg page, the image will be inserted as a WordPress image block.

Gutenberg awareness: if get_page shows the page contains Gutenberg block markers, mention it to the user and explain that replace_page_html will wrap their content in a Classic block, which is compatible with Gutenberg but sits outside the block editor.

After deploying, confirm it's live and mention they can undo anytime.`;
}

export function buildTools(
  fetchPageFn: (pageId: number) => Promise<WPPage>,
  generateBlogFn: (topic: string, keyPoints: string[], keyword?: string) => Promise<BlogPost>
) {
  return {
    get_page: tool({
      description: 'Fetch the current content of a WordPress page by its ID.',
      inputSchema: zodSchema(z.object({
        page_id: z.number().describe('The WordPress page ID'),
      })),
      execute: async ({ page_id }: { page_id: number }) => {
        try {
          const page = await fetchPageFn(page_id);
          const isGutenberg = page.content.rendered.includes('<!-- wp:');
          const plainContent = page.content.rendered
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 2000);
          return {
            id: page.id,
            title: page.title.rendered,
            content: plainContent,
            url: page.link,
            is_gutenberg: isGutenberg,
            ...(isGutenberg ? { gutenberg_note: 'This page uses Gutenberg blocks. A full HTML rewrite will wrap your content in a Classic block.' } : {}),
          };
        } catch (e) {
          return { error: e instanceof Error ? e.message : 'Failed to fetch page' };
        }
      },
    }),

    propose_change: tool({
      description: 'Propose a change to a WordPress page, showing a before/after preview. MUST be used before any deployment.',
      inputSchema: zodSchema(z.object({
        page_id: z.number(),
        page_title: z.string(),
        field: z.enum(['title', 'content']),
        old_value: z.string(),
        new_value: z.string(),
      })),
      execute: async (args: { page_id: number; page_title: string; field: string; old_value: string; new_value: string }) => {
        return { ...args, status: 'awaiting_approval' };
      },
    }),

    create_blog_post: tool({
      description: 'Create a full SEO-optimized blog post. Returns a complete post for user review before publishing.',
      inputSchema: zodSchema(z.object({
        topic: z.string(),
        key_points: z.array(z.string()),
        target_keyword: z.string().optional(),
      })),
      execute: async (args: { topic: string; key_points: string[]; target_keyword?: string }) => {
        try {
          const post = await generateBlogFn(args.topic, args.key_points, args.target_keyword);
          return { ...post, status: 'awaiting_approval' };
        } catch (e) {
          return { error: e instanceof Error ? e.message : 'Failed to generate blog post' };
        }
      },
    }),

    deploy_change: tool({
      description: 'Deploy an approved change to WordPress. ONLY call after explicit user approval.',
      inputSchema: zodSchema(z.object({
        page_id: z.number(),
        field: z.enum(['title', 'content']),
        new_value: z.string(),
        old_value: z.string(),
        page_title: z.string(),
      })),
      execute: async (args: { page_id: number; field: string; new_value: string; old_value: string; page_title: string }) => {
        return { ...args, action: 'deploy_requested' };
      },
    }),

    replace_page_html: tool({
      description: 'Replace the full HTML content of a WordPress page. Use for layout/structural rewrites. For simple text edits, use propose_change instead.',
      inputSchema: zodSchema(z.object({
        page_id: z.number().describe('The WordPress page ID to rewrite'),
        new_html: z.string().describe('The full new HTML content for the page body'),
        reason: z.string().optional().describe('Brief reason for the rewrite'),
      })),
      execute: async ({ page_id, new_html, reason }: { page_id: number; new_html: string; reason?: string }) => {
        try {
          const page = await fetchPageFn(page_id);
          const isGutenberg = page.content.rendered.includes('<!-- wp:');
          const wrappedHtml = isGutenberg
            ? `<!-- wp:html --><div class="rr-custom">${new_html}</div><!-- /wp:html -->`
            : new_html;
          return {
            page_id,
            page_title: page.title.rendered,
            field: 'content',
            old_value: page.content.rendered,
            new_value: wrappedHtml,
            is_gutenberg: isGutenberg,
            reason,
            status: 'awaiting_approval',
          };
        } catch (e) {
          return { error: e instanceof Error ? e.message : 'Failed to fetch page' };
        }
      },
    }),

    insert_image: tool({
      description: 'Insert an image into a WordPress page at a specified position. Use when the user wants to add an image to a page.',
      inputSchema: zodSchema(z.object({
        page_id: z.number().describe('The WordPress page ID'),
        image_url: z.string().describe('The URL of the image to insert'),
        alt_text: z.string().optional().describe('Alt text for the image (accessibility)'),
        position: z.enum(['top', 'bottom', 'after_intro']).optional().describe('Where to insert the image. Defaults to after_intro (after first paragraph)'),
        caption: z.string().optional().describe('Optional image caption'),
      })),
      execute: async ({ page_id, image_url, alt_text, position = 'after_intro', caption }: { page_id: number; image_url: string; alt_text?: string; position?: 'top' | 'bottom' | 'after_intro'; caption?: string }) => {
        try {
          const page = await fetchPageFn(page_id);
          const isGutenberg = page.content.rendered.includes('<!-- wp:');
          const currentContent = page.content.rendered;

          const figcaption = caption ? `<figcaption class="wp-element-caption">${caption}</figcaption>` : '';
          const imgHtml = `<figure class="wp-block-image"><img src="${image_url}" alt="${alt_text || ''}" />${figcaption}</figure>`;
          const imageBlock = isGutenberg ? `<!-- wp:image -->${imgHtml}<!-- /wp:image -->` : imgHtml;

          let newContent: string;
          if (position === 'top') {
            newContent = imageBlock + '\n' + currentContent;
          } else if (position === 'bottom') {
            newContent = currentContent + '\n' + imageBlock;
          } else {
            // after_intro: insert after the first closing </p>
            const firstParaEnd = currentContent.indexOf('</p>');
            if (firstParaEnd === -1) {
              newContent = imageBlock + '\n' + currentContent;
            } else {
              const insertAt = firstParaEnd + 4;
              newContent = currentContent.slice(0, insertAt) + '\n' + imageBlock + currentContent.slice(insertAt);
            }
          }

          return {
            page_id,
            page_title: page.title.rendered,
            field: 'content',
            old_value: currentContent,
            new_value: newContent,
            is_gutenberg: isGutenberg,
            image_url,
            status: 'awaiting_approval',
          };
        } catch (e) {
          return { error: e instanceof Error ? e.message : 'Failed to fetch page' };
        }
      },
    }),
  };
}
