'use client';

import { useState } from 'react';
import { ProposedChange } from '@/types';

interface DiffPreviewProps {
  change: ProposedChange;
  siteId: string;
  onApprove: (deployUrl: string) => void;
  onRevise: (feedback: string) => void;
}

export default function DiffPreview({ change, siteId, onApprove, onRevise }: DiffPreviewProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [reviseMode, setReviseMode] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [deployed, setDeployed] = useState(false);
  const [deployedUrl, setDeployedUrl] = useState('');
  const [error, setError] = useState('');

  async function handleApprove(e?: React.MouseEvent) {
    e?.preventDefault();
    setIsDeploying(true);
    setError('');
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          changeType: 'page_edit',
          pageId: change.page_id,
          field: change.field,
          newValue: change.new_value,
          oldValue: change.old_value,
          pageTitle: change.page_title,
        }),
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
          <span>✅</span> Change deployed successfully!
        </div>
        <a href={deployedUrl} target="_blank" rel="noopener noreferrer"
          className="text-sm text-teal-300 underline underline-offset-2 hover:text-teal-200">
          View live page →
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden my-2 w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
        <div>
          <span className="text-xs text-slate-400 uppercase tracking-wider">Proposed Change</span>
          <div className="text-sm font-semibold text-white mt-0.5">{change.page_title} → {change.field}</div>
        </div>
        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full font-medium">Pending Approval</span>
      </div>

      {/* Diff */}
      <div className="grid grid-cols-2 divide-x divide-slate-700">
        <div className="p-4">
          <div className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
            <span>−</span> Before
          </div>
          <div className="text-sm text-slate-300 leading-relaxed bg-red-950/20 border border-red-900/30 rounded-lg p-3 min-h-[80px] whitespace-pre-wrap">
            {change.old_value || <span className="text-slate-500 italic">empty</span>}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
            <span>+</span> After
          </div>
          <div className="text-sm text-slate-300 leading-relaxed bg-green-950/20 border border-green-900/30 rounded-lg p-3 min-h-[80px] whitespace-pre-wrap">
            {change.new_value}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-3 text-sm text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg px-3 py-2">
          ⚠️ {error}
        </div>
      )}

      {/* Revise Input */}
      {reviseMode && (
        <div className="px-4 pb-3 flex gap-2">
          <input
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            placeholder="What should be different?"
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
              <><span className="animate-spin">⟳</span> Deploying...</>
            ) : (
              <>🚀 Approve &amp; Go Live</>
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
