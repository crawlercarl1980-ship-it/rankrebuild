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
3. ALWAYS use propose_change before any page edit — never skip this step
4. Use create_blog_post when the user wants a new blog article
5. NEVER call deploy_change unless the user explicitly says "approve", "looks good", "do it", or similar
6. Ask a clarifying question if the request is vague
7. Keep language friendly and non-technical

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
          const plainContent = page.content.rendered
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 2000);
          return { id: page.id, title: page.title.rendered, content: plainContent, url: page.link };
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
  };
}
