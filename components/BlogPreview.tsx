'use client';

import { useState } from 'react';
import { BlogPost } from '@/types';

interface BlogPreviewProps {
  post: BlogPost;
  siteId: string;
  onApprove: (deployUrl: string) => void;
  onRevise: (feedback: string) => void;
}

export default function BlogPreview({ post, siteId, onApprove, onRevise }: BlogPreviewProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [reviseMode, setReviseMode] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [deployed, setDeployed] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState('');
  const [error, setError] = useState('');

  async function handleApprove() {
    setIsDeploying(true);
    setError('');
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, changeType: 'blog_post', blogPost: post }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deploy failed');
      setDeployed(true);
      setDeployedUrl(data.url);
      onApprove(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deploy failed');
    } finally {
      setIsDeploying(false);
    }
  }

  function handleRevise() {
    if (!feedback.trim()) return;
    onRevise(feedback);
    setReviseMode(false);
    setFeedback('');
  }

  if (deployed) {
    return (
      <div className="rounded-xl border border-teal-500/30 bg-teal-950/30 p-4 my-2">
        <div className="flex items-center gap-2 text-teal-400 font-semibold mb-1">
          <span>✅</span> Blog post published!
        </div>
        <a href={deployedUrl} target="_blank" rel="noopener noreferrer"
          className="text-sm text-teal-300 underline underline-offset-2 hover:text-teal-200">
          View live post →
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden my-2 w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <div>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Blog Post Preview</span>
          <div className="text-sm font-semibold text-white mt-0.5 line-clamp-1">{post.title}</div>
        </div>
        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full font-medium shrink-0 ml-2">
          Pending Approval
        </span>
      </div>

      {/* SEO Fields */}
      <div className="px-4 py-3 border-b border-slate-700/50 space-y-2">
        <div>
          <span className="text-xs text-slate-500 uppercase tracking-wider">SEO Title</span>
          <p className="text-sm text-blue-300 font-medium mt-0.5">{post.title}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500 uppercase tracking-wider">Meta Description</span>
          <p className="text-sm text-slate-300 mt-0.5">{post.meta_description}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Target Keyword:</span>
          <span className="text-xs bg-teal-900/50 text-teal-300 px-2 py-0.5 rounded-full">{post.target_keyword}</span>
        </div>
      </div>

      {/* Content Preview */}
      <div className="px-4 py-3 border-b border-slate-700/50 max-h-64 overflow-y-auto">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Content Preview</span>
        <div
          className="text-sm text-slate-300 mt-2 leading-relaxed prose prose-invert prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content.substring(0, 800) + (post.content.length > 800 ? '...' : '') }}
        />
      </div>

      {/* FAQ Preview */}
      {post.faq.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-700/50">
          <span className="text-xs text-slate-500 uppercase tracking-wider">FAQ Section ({post.faq.length} questions)</span>
          <div className="mt-2 space-y-2">
            {post.faq.slice(0, 2).map((f, i) => (
              <div key={i} className="text-xs">
                <p className="text-slate-300 font-medium">{f.question}</p>
                <p className="text-slate-500 mt-0.5 line-clamp-2">{f.answer}</p>
              </div>
            ))}
            {post.faq.length > 2 && (
              <p className="text-xs text-slate-500">+ {post.faq.length - 2} more questions</p>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500">Tags:</span>
        {post.tags.map(tag => (
          <span key={tag} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">{tag}</span>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 my-2 text-sm text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg px-3 py-2">
          ⚠️ {error}
        </div>
      )}

      {/* Revise Input */}
      {reviseMode && (
        <div className="px-4 pb-3 flex gap-2">
          <input
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            placeholder="What should be different? (e.g. 'make it shorter', 'add a section about X')"
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRevise()}
            autoFocus
          />
          <button onClick={handleRevise}
            className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors">
            Send
          </button>
          <button onClick={() => setReviseMode(false)}
            className="text-sm text-slate-400 hover:text-white px-2 transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* Actions */}
      {!reviseMode && (
        <div className="flex gap-3 px-4 py-3 border-t border-slate-700 bg-slate-800/30">
          <button
            onClick={handleApprove}
            disabled={isDeploying}
            className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold text-sm py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
            {isDeploying ? (
              <><span className="animate-spin">⟳</span> Publishing...</>
            ) : (
              <>📝 Approve &amp; Publish</>
            )}
          </button>
          <button
            onClick={() => setReviseMode(true)}
            disabled={isDeploying}
            className="text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 px-4 py-2.5 rounded-lg transition-colors">
            Request Changes
          </button>
        </div>
      )}
    </div>
  );
}
