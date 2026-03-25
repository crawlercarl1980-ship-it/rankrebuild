'use client';

import { useState, useRef, useEffect } from 'react';
import { Site } from '@/types';
import DiffPreview from './DiffPreview';
import BlogPreview from './BlogPreview';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolInvocations?: any[];
}

interface ChatInterfaceProps {
  site: Site;
}

export default function ChatInterface({ site }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm ready to help you update **${site.name}**.\n\nYou can ask me to:\n• Edit any page — "Change the homepage headline to..."\n• Write a blog post — "Write a post about..."\n• Check a page — "What does the About page say?"\n\nWhat would you like to update?`,
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '' };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsLoading(true);

    // Build conversation history for the API
    const allMessages = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortRef.current = new AbortController();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, siteId: site.id }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error('Request failed');
      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let toolInvocations: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // Parse SSE: "data: {...}\n\n"
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) {
              // Final signal — update state one last time with everything
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: fullText, toolInvocations: [...toolInvocations] }
                  : m
              ));
            } else if (data.text) {
              fullText = data.text; // full text sent at once
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: fullText } : m
              ));
            } else if (data.tool) {
              toolInvocations = [...toolInvocations, { ...data.tool, state: 'result' }];
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, toolInvocations: [...toolInvocations] } : m
              ));
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: 'Sorry, something went wrong. Please try again.' }
            : m
        ));
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => {
          const isUser = message.role === 'user';

          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
                {message.content && (
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-teal-500 text-slate-900 rounded-br-sm font-medium'
                      : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                  }`}>
                    {message.content}
                  </div>
                )}

                {message.toolInvocations?.map((tool) => {
                  if (!tool || !tool.result) return null;

                  if (
                    (tool.toolName === 'propose_change' || tool.toolName === 'replace_page_html' || tool.toolName === 'insert_image') &&
                    tool.result.status === 'awaiting_approval'
                  ) {
                    return (
                      <DiffPreview
                        key={tool.toolCallId || tool.id}
                        change={{
                          page_id: tool.result.page_id,
                          page_title: tool.result.page_title,
                          field: tool.result.field,
                          old_value: tool.result.old_value,
                          new_value: tool.result.new_value,
                        }}
                        siteId={site.id}
                        siteUrl={site.url}
                        onApprove={() => {
                          // Don't trigger another chat round after deploy - just show success
                        }}
                        onRevise={(fb) => sendMessage(fb)}
                      />
                    );
                  }

                  if (tool.toolName === 'create_blog_post' && tool.result.status === 'awaiting_approval') {
                    return (
                      <BlogPreview
                        key={tool.toolCallId || tool.id}
                        post={tool.result}
                        siteId={site.id}
                        onApprove={() => {
                          // Don't trigger another chat round after publish
                        }}
                        onRevise={(fb) => sendMessage(fb)}
                      />
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-700/50 px-4 py-4 bg-slate-900/50">
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to change... (Enter to send, Shift+Enter for new line)"
            rows={2}
            className="flex-1 bg-slate-800 border border-slate-600 focus:border-teal-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold px-5 py-3 rounded-xl transition-colors shrink-0">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
