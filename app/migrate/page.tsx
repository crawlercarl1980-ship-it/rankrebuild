'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

type MigrationStatus = 'idle' | 'starting' | 'scraping' | 'building' | 'uploading' | 'ready' | 'error';

interface StatusResponse {
  status: MigrationStatus;
  preview_url?: string;
  progress_message?: string;
}

const STEPS: { key: MigrationStatus; label: string; description: string }[] = [
  { key: 'scraping', label: 'Scraping Your Site', description: 'Copying all pages, images, and content...' },
  { key: 'building', label: 'Rebuilding in WordPress', description: 'Converting content to Gutenberg blocks...' },
  { key: 'uploading', label: 'Uploading Assets', description: 'Transferring images and media...' },
  { key: 'ready', label: 'Your Site is Ready', description: 'Migration complete!' },
];

function getStepIndex(status: MigrationStatus): number {
  const map: Record<string, number> = { scraping: 0, building: 1, uploading: 2, ready: 3 };
  return map[status] ?? -1;
}

export default function MigratePage() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<MigrationStatus>('idle');
  const [progressMessage, setProgressMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [urlError, setUrlError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function copyApprovalLink() {
    if (!jobId) return;
    const link = `${window.location.origin}/preview/${jobId}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  }

  function validateUrl(value: string): boolean {
    try {
      const parsed = new URL(value.startsWith('http') ? value : `https://${value}`);
      return parsed.hostname.includes('.');
    } catch {
      return false;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setUrlError('');

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    if (!validateUrl(normalizedUrl)) {
      setUrlError('Please enter a valid website URL');
      return;
    }

    setStatus('starting');

    try {
      const res = await fetch('/api/migrate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl, name, business_name: businessName }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setError(data.error || 'Failed to start migration');
        return;
      }

      setJobId(data.job_id);
      setStatus('scraping');
    } catch {
      setStatus('error');
      setError('Network error — please try again');
    }
  }

  useEffect(() => {
    if (!jobId || status === 'ready' || status === 'error' || status === 'idle') return;

    function poll() {
      fetch(`/api/migrate/status/${jobId}`)
        .then(r => r.json())
        .then((data: StatusResponse) => {
          setStatus(data.status);
          if (data.progress_message) setProgressMessage(data.progress_message);
          if (data.preview_url) setPreviewUrl(data.preview_url);

          if (data.status !== 'ready' && data.status !== 'error') {
            pollRef.current = setTimeout(poll, 3000);
          }
        })
        .catch(() => {
          pollRef.current = setTimeout(poll, 5000);
        });
    }

    pollRef.current = setTimeout(poll, 2000);
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [jobId, status]);

  const activeStepIndex = getStepIndex(status);
  const isInProgress = ['starting', 'scraping', 'building', 'uploading'].includes(status);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-black text-xl">
            Rank<span className="text-teal-400">Rebuild</span>
          </Link>
        </div>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {status === 'idle' || status === 'starting' ? (
          <>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-teal-500/10 text-teal-400 text-sm font-medium px-4 py-1.5 rounded-full border border-teal-500/20 mb-5">
                Free Migration
              </div>
              <h1 className="text-4xl font-black mb-4">
                Move Your Site to WordPress
              </h1>
              <p className="text-slate-400 text-lg">
                We'll copy every page from your current site — Squarespace, Wix, Webflow, or static HTML — and rebuild it in WordPress automatically.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Your Current Website URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setUrlError(''); }}
                  placeholder="https://yoursite.com"
                  required
                  className={`w-full bg-slate-900 border ${urlError ? 'border-red-500' : 'border-slate-700'} rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors`}
                />
                {urlError && <p className="text-red-400 text-sm mt-1">{urlError}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Smith"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="Acme Co."
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'starting'}
                className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-black text-lg py-4 rounded-xl transition-colors"
              >
                {status === 'starting' ? 'Starting...' : 'Start My Free Migration'}
              </button>

              <p className="text-center text-slate-500 text-sm">
                No WordPress install needed — we create one for you.
              </p>
            </form>

            {/* What happens next */}
            <div className="mt-14 grid grid-cols-3 gap-4">
              {[
                { icon: '🔍', title: 'We scan your site', desc: 'Every page, image, and paragraph.' },
                { icon: '⚡', title: 'Claude rebuilds it', desc: 'AI converts content to clean WordPress blocks.' },
                { icon: '🎉', title: 'You get a preview', desc: 'Review it, then flip your DNS.' },
              ].map(item => (
                <div key={item.title} className="text-center p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-bold text-sm mb-1">{item.title}</div>
                  <div className="text-slate-400 text-xs">{item.desc}</div>
                </div>
              ))}
            </div>
          </>
        ) : status === 'error' ? (
          <div className="text-center">
            <div className="text-5xl mb-6">⚠️</div>
            <h2 className="text-2xl font-black mb-3">Migration Failed</h2>
            <p className="text-slate-400 mb-2">{progressMessage || 'Something went wrong during migration.'}</p>
            {error && <p className="text-red-400 text-sm mb-6">{error}</p>}
            <button
              onClick={() => { setStatus('idle'); setJobId(null); setError(''); setProgressMessage(''); }}
              className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold px-8 py-3 rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          /* Progress view */
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black mb-2">
                {status === 'ready' ? 'Your WordPress site is ready!' : 'Migration in progress...'}
              </h2>
              <p className="text-slate-400">
                {status === 'ready'
                  ? 'Review your new site below, then follow the DNS instructions to go live.'
                  : 'This usually takes 1–3 minutes. Grab a coffee ☕'}
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-3 mb-10">
              {STEPS.map((step, i) => {
                const isDone = activeStepIndex > i || status === 'ready';
                const isActive = activeStepIndex === i && status !== 'ready';
                return (
                  <div
                    key={step.key}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      isDone
                        ? 'bg-teal-900/20 border-teal-700/40'
                        : isActive
                        ? 'bg-slate-800/80 border-teal-500/50'
                        : 'bg-slate-900/30 border-slate-800/50 opacity-40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isDone ? 'bg-teal-500 text-slate-900' : isActive ? 'bg-teal-500/20 text-teal-400 border border-teal-500/50' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm">{step.label}</div>
                      <div className="text-slate-400 text-xs">
                        {isActive && progressMessage ? progressMessage : step.description}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {status === 'ready' && previewUrl && (
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
                <h3 className="font-black text-lg mb-4">Your New WordPress Site</h3>
                <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3 mb-5">
                  <span className="text-green-400 text-sm">🟢</span>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 text-sm font-mono hover:underline truncate"
                  >
                    {previewUrl}
                  </a>
                </div>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-teal-500 hover:bg-teal-400 text-slate-900 font-black py-3 rounded-xl transition-colors mb-3"
                >
                  Preview My New Site →
                </a>

                <button
                  onClick={copyApprovalLink}
                  className="block w-full text-center bg-green-700 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors mb-4"
                >
                  {copiedLink ? '✅ Copied!' : '📋 Copy Client Approval Link'}
                </button>

                <details className="group">
                  <summary className="cursor-pointer text-sm text-slate-400 hover:text-white transition-colors select-none">
                    DNS cutover instructions ▸
                  </summary>
                  <div className="mt-4 space-y-2 text-sm text-slate-300 bg-slate-800/50 rounded-xl p-4">
                    <p className="font-semibold text-white mb-3">When you're ready to go live:</p>
                    <ol className="list-decimal list-inside space-y-2 text-slate-400">
                      <li>Log into your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)</li>
                      <li>Find the DNS settings for your domain</li>
                      <li>Update the <code className="bg-slate-700 px-1 rounded text-xs">A record</code> to point to your new WordPress host's IP</li>
                      <li>Or update the <code className="bg-slate-700 px-1 rounded text-xs">CNAME</code> to point to the preview URL above</li>
                      <li>Wait 10–48 hours for DNS propagation</li>
                    </ol>
                    <p className="text-slate-500 text-xs mt-3">Your old site stays live until DNS propagates — no downtime.</p>
                  </div>
                </details>
              </div>
            )}

            {status === 'ready' && (
              <div className="mt-6 text-center">
                <Link
                  href="/dashboard"
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
