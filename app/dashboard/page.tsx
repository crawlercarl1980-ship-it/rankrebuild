'use client';

import { useState, useEffect } from 'react';
import { Site, Change } from '@/types';
import SiteCard from '@/components/SiteCard';
import ConnectSiteModal from '@/components/ConnectSiteModal';

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [recentChanges, setRecentChanges] = useState<Change[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function loadSites() {
    try {
      const res = await fetch('/api/sites');
      if (res.ok) {
        const data = await res.json();
        setSites(data);
      }
    } catch (e) {
      console.error('Failed to load sites', e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadSites(); }, []);

  function handleSiteAdded() {
    setShowModal(false);
    loadSites();
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top nav */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="font-black text-xl">Rank<span className="text-teal-400">Rebuild</span></div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <span>+</span> Connect Site
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Sites Grid */}
        <section className="mb-12">
          <h1 className="text-2xl font-black mb-6">Your Sites</h1>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 animate-pulse h-52" />
              ))}
            </div>
          ) : sites.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="font-bold text-lg mb-2">No sites yet</h3>
              <p className="text-slate-400 text-sm mb-6">Connect your first WordPress site to get started</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-sm px-6 py-2.5 rounded-lg transition-colors">
                Connect a Site
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sites.map(site => (
                <SiteCard
                  key={site.id}
                  site={site}
                  recentChanges={recentChanges.filter(c => c.site_id === site.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent Changes */}
        {recentChanges.length > 0 && (
          <section>
            <h2 className="text-xl font-black mb-4">Recent Changes</h2>
            <div className="space-y-2">
              {recentChanges.slice(0, 10).map(change => (
                <div key={change.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{change.type === 'blog_post' ? '📝' : '✏️'}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{change.title || change.field || 'Change'}</p>
                      <p className="text-xs text-slate-500">{sites.find(s => s.id === change.site_id)?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      change.status === 'deployed' ? 'bg-green-900/50 text-green-400' :
                      change.status === 'rolled_back' ? 'bg-red-900/50 text-red-400' :
                      'bg-amber-900/50 text-amber-400'
                    }`}>{change.status}</span>
                    <span className="text-xs text-slate-500">{timeAgo(change.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {showModal && (
        <ConnectSiteModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSiteAdded}
        />
      )}
    </div>
  );
}
