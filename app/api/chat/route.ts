import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { buildSystemPrompt, buildTools } from '@/lib/agent';
import { getPage, getPages } from '@/lib/wordpress';
import { createSupabaseAdmin } from '@/lib/supabase';
import { WPPage, BlogPost } from '@/types';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
const anthropicDirect = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function generateBlogPost(siteName: string, siteUrl: string, topic: string, keyPoints: string[], targetKeyword?: string): Promise<BlogPost> {
  const keyword = targetKeyword || `${topic} ${siteName}`;
  const response = await anthropicDirect.messages.create({
    model: 'claude-sonnet-4-5', max_tokens: 3000,
    messages: [{ role: 'user', content: `Write SEO blog post for "${siteName}" about: ${topic}. Points: ${keyPoints.join(', ')}. Keyword: ${keyword}. Return ONLY JSON: {"title":"...","meta_description":"...","content":"...HTML...","faq":[{"question":"...","answer":"..."}],"cta":"...","tags":["..."],"target_keyword":"${keyword}","slug":"..."}` }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()) as BlogPost;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages: rawMessages, siteId } = body;

    let site = null;
    let pages: WPPage[] = [];
    if (siteId) {
      try {
        console.log('[chat] Loading site:', siteId);
        const admin = createSupabaseAdmin();
        const { data } = await admin.from('sites').select('*').eq('id', siteId).single();
        site = data;
        console.log('[chat] Site found:', site?.name, 'url:', site?.url);
        if (site) {
          console.log('[chat] Fetching pages...');
          pages = await getPages(site.url, site.wp_username, site.app_password);
          console.log('[chat] Pages fetched:', pages.length);
        }
      } catch (e) {
        console.log('[chat] Site load error (continuing without):', e instanceof Error ? e.message : e);
      }
    }

    const ctx = { siteName: site?.name || 'your website', siteUrl: site?.url || '', pages };
    const toolDefs = buildTools(
      async (pageId: number) => { if (!site) throw new Error('No site'); return getPage(site.url, site.wp_username, site.app_password, pageId); },
      async (topic: string, keyPoints: string[], keyword?: string) => generateBlogPost(ctx.siteName, ctx.siteUrl, topic, keyPoints, keyword)
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let messages: any[] = (rawMessages || []).map((m: any) => ({ role: m.role, content: typeof m.content === 'string' ? m.content : '' }));
    const systemPrompt = buildSystemPrompt(ctx);
    let fullText = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allToolResults: any[] = [];

    // Agentic loop up to 5 steps
    for (let step = 0; step < 5; step++) {
      console.log('[chat] Step', step, 'messages:', messages.length);
      const result = await generateText({
        model: anthropic('claude-sonnet-4-5'),
        system: systemPrompt,
        messages,
        tools: toolDefs,
      });

      console.log('[chat] Step', step, 'result text len:', result.text?.length, 'finish:', (result as any).finishReason);
      if (result.text) fullText += result.text;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolCalls = (result as any).toolCalls || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolResults = (result as any).toolResults || [];

      for (const tr of toolResults) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = tr as any;
        allToolResults.push({ toolName: r.toolName, toolCallId: r.toolCallId, result: r.output ?? r.result ?? {} });
      }

      if (toolCalls.length === 0) break;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseMessages = (result as any).response?.messages ?? [];
      if (responseMessages.length === 0) break;
      messages = [...messages, ...responseMessages];
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        if (fullText) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: fullText })}\n\n`));
        for (const tool of allToolResults) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tool })}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      }
    });

    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });

  } catch (e) {
    console.error('Chat route error:', e);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: 'Sorry, something went wrong. Please try again.' })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      }
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }
}
