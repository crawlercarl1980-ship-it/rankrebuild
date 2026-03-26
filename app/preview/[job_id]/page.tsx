'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

type ApprovalAction = 'approved' | 'changes_requested';

interface MigrationJob {
  id: string;
  business_name: string;
  status: string;
  preview_url: string | null;
  client_approval: string | null;
  client_feedback: string | null;
}

export default function PreviewPage() {
  const params = useParams();
  const jobId = params.job_id as string;

  const [job, setJob] = useState<MigrationJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<ApprovalAction | null>(null);

  useEffect(() => {
    if (!jobId) return;
    fetch(`/api/migrate/preview/${jobId}`)
      .then(r => r.json())
      .then((data: MigrationJob & { error?: string }) => {
        if (data.error) {
          setError('Migration job not found.');
        } else {
          setJob(data);
          if (data.client_approval) {
            setSubmitted(data.client_approval as ApprovalAction);
          }
        }
      })
      .catch(() => setError('Failed to load migration details.'))
      .finally(() => setLoading(false));
  }, [jobId]);

  async function handleAction(action: ApprovalAction) {
    if (action === 'changes_requested' && !showFeedback) {
      setShowFeedback(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/migrate/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId, action, feedback: feedback || undefined }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(action);
      setShowFeedback(false);
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-black mb-2">Job Not Found</h1>
          <p className="text-slate-400">{error || 'This preview link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  if (job.status !== 'ready') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-6">⏳</div>
          <h1 className="text-3xl font-black mb-3">Site Is Still Being Prepared</h1>
          <p className="text-slate-400 text-lg">
            Your new WordPress site is being built. Check back in a few minutes — this page will
            show your preview as soon as it's ready.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="font-black text-xl">
            Rank<span className="text-teal-400">Rebuild</span>
          </div>
          <div className="text-slate-400 text-sm">Client Preview</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg">{job.business_name}</div>
          <div className="text-slate-400 text-sm">New WordPress Site</div>
        </div>
      </header>

      {/* Preview iframe */}
      <div className="flex-1 flex flex-col px-4 py-4 gap-4" style={{ minHeight: 0 }}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black">{job.business_name} — Preview</h1>
          <a
            href={job.preview_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-400 text-sm hover:underline flex items-center gap-1"
          >
            Open in new tab ↗
          </a>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-700 flex-1" style={{ minHeight: '70vh' }}>
          <iframe
            src={job.preview_url!}
            className="w-full h-full"
            style={{ minHeight: '70vh' }}
            title={`Preview of ${job.business_name}`}
            allow="fullscreen"
          />
        </div>
      </div>

      {/* Approval section */}
      <div className="border-t border-slate-800 px-4 py-6 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          {submitted ? (
            <div className={`rounded-2xl p-6 text-center border ${
              submitted === 'approved'
                ? 'bg-green-900/20 border-green-700/40'
                : 'bg-amber-900/20 border-amber-700/40'
            }`}>
              {submitted === 'approved' ? (
                <>
                  <div className="text-4xl mb-3">✅</div>
                  <h2 className="text-xl font-black text-green-400 mb-2">Site Approved!</h2>
                  <p className="text-slate-400">
                    Your approval has been recorded. The team will reach out with next steps.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">💬</div>
                  <h2 className="text-xl font-black text-amber-400 mb-2">Changes Requested</h2>
                  <p className="text-slate-400">
                    Your feedback has been sent. The team will review and follow up with you.
                  </p>
                  {job.client_feedback && (
                    <div className="mt-3 text-left bg-slate-800/50 rounded-xl p-4 text-sm text-slate-300">
                      <span className="text-slate-500">Your feedback: </span>
                      {job.client_feedback}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-center mb-4">
                How does the site look?
              </h2>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleAction('approved')}
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-lg"
                >
                  ✅ Approve This Site
                </button>
                <button
                  onClick={() => handleAction('changes_requested')}
                  disabled={submitting}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-lg"
                >
                  💬 Request Changes
                </button>
              </div>

              {showFeedback && (
                <div className="space-y-3 bg-slate-900 border border-slate-700 rounded-2xl p-5">
                  <label className="block text-sm font-semibold text-slate-300">
                    What would you like changed?
                  </label>
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Describe the changes you'd like — colors, content, layout, etc."
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction('changes_requested')}
                      disabled={submitting || !feedback.trim()}
                      className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-bold py-3 rounded-xl transition-colors"
                    >
                      {submitting ? 'Sending...' : 'Send Feedback'}
                    </button>
                    <button
                      onClick={() => { setShowFeedback(false); setFeedback(''); }}
                      className="px-5 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
