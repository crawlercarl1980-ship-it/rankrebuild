'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Site } from '@/types';
import ChatInterface from '@/components/ChatInterface';

export default function ChatPage() {
  const { siteId } = useParams();
  const [site, setSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSite() {
      try {
        const res = await fetch('/api/sites');
        if (!res.ok) throw new Error('Failed to load sites');
        const sites: Site[] = await res.json();
        const found = sites.find(s => s.id === siteId);
        if (!found) throw new Error('Site not found');
        setSite(found);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load site');
      } finally {
        setIsLoading(false);
      }
    }
    if (siteId) loadSite();
  }, [siteId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 flex items-center gap-3">
          <span className="animate-spin text-teal-400">⟳</span> Loading...
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-center">
        <div>
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-400 mb-4">{error || 'Site not found'}</p>
          <Link href="/dashboard" className="text-teal-400 hover:text-teal-300">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Dashboard
          </Link>
          <div className="w-px h-4 bg-slate-700" />
          <div>
            <span className="font-bold text-white">{site.name}</span>
            <a href={site.url} target="_blank" rel="noopener noreferrer"
              className="ml-2 text-xs text-slate-400 hover:text-teal-400 transition-colors">
              {site.url.replace('https://', '')} ↗
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Connected
        </div>
      </header>

      {/* Chat — fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface site={site} />
      </div>
    </div>
  );
}
