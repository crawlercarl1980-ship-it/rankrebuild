'use client';

import { useState } from 'react';

interface ConnectSiteModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConnectSiteModal({ onClose, onSuccess }: ConnectSiteModalProps) {
  const [form, setForm] = useState({ name: '', url: '', wp_username: '', app_password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function addDemoSite() {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Demo Dive Shop', url: 'https://demo.rankrebuild.com', wp_username: 'demo', app_password: 'demo' }),
      });
      if (res.ok) { onSuccess(); }
      else { const d = await res.json(); setError(d.error || 'Failed'); }
    } catch { setError('Failed to add demo site'); }
    finally { setIsLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect site');
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">Connect WordPress Site</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">✕</button>
        </div>

        {/* Demo shortcut */}
        <div className="px-6 pt-5">
          <button
            type="button"
            onClick={addDemoSite}
            disabled={isLoading}
            className="w-full bg-teal-900/40 border border-teal-700/50 hover:bg-teal-900/70 text-teal-300 font-medium text-sm px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
            🎯 Add Demo Site (test without a real WordPress site)
          </button>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500">or connect a real site</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Site Name</label>
            <input
              type="text"
              required
              placeholder="My Business Website"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 focus:border-teal-500 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">WordPress URL</label>
            <input
              type="url"
              required
              placeholder="https://yoursite.com"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 focus:border-teal-500 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">WordPress Username</label>
            <input
              type="text"
              required
              placeholder="admin"
              value={form.wp_username}
              onChange={e => setForm(f => ({ ...f, wp_username: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 focus:border-teal-500 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Application Password
              <a href="https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/"
                target="_blank" rel="noopener noreferrer"
                className="ml-2 text-teal-400 hover:text-teal-300 text-xs font-normal">
                How to get this →
              </a>
            </label>
            <input
              type="password"
              required
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              value={form.app_password}
              onChange={e => setForm(f => ({ ...f, app_password: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-600 focus:border-teal-500 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors font-mono"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              In WordPress: Users → Your Profile → Application Passwords → Add New
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/30 rounded-lg px-3 py-2.5">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
              {isLoading ? <><span className="animate-spin">⟳</span> Testing connection...</> : 'Connect Site'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
