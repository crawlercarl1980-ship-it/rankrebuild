'use client';

import { useState, useEffect } from 'react';
import { Site, Change } from '@/types';
import SiteCard from '@/components/SiteCard';
import ConnectSiteModal from '@/components/ConnectSiteModal';
import SignOutButton from '@/components/SignOutButton';
import Link from 'next/link';
import { getEffectivePlan, getPlanLimits } from '@/lib/subscription';

interface Subscription {
  id: string;
  plan: 'basic' | 'pro' | 'trial';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end?: string;
  trial_ends_at?: string;
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [recentChanges, setRecentChanges] = useState<Change[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);

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

  async function loadSubscription() {
    try {
      const res = await fetch('/api/subscription');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (e) {
      console.error('Failed to load subscription', e);
      setSubscription(null);
    }
  }

  useEffect(() => {
    loadSites();
    loadSubscription();
  }, []);

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

  function getDaysLeft(dateStr?: string): number {
    if (!dateStr) return 0;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // Compute plan info
  const effectivePlan = subscription !== undefined ? getEffectivePlan(subscription ?? null) : null;
  const limits = effectivePlan ? getPlanLimits(effectivePlan) : null;
  const isActive = subscription && (subscription.status === 'active' || subscription.status === 'trialing');
  const isTrialing = subscription?.status === 'trialing';
  const isBad = !subscription || subscription.status === 'canceled' || subscription.status === 'past_due';
  const daysLeft = isTrialing ? getDaysLeft(subscription?.trial_ends_at) : 0;
  const trialExpiringSoon = isTrialing && daysLeft <= 3;

  // Plan badge
  function getPlanBadge() {
    if (!subscription || effectivePlan === null) return null;
    if (effectivePlan === 'pro') {
      return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-900/50 text-green-400">✓ Pro Plan</span>;
    }
    if (effectivePlan === 'basic') {
      return <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-900/50 text-green-400">✓ Basic Plan</span>;
    }
    if (effectivePlan === 'trial') {
      const color = daysLeft <= 3 ? 'bg-amber-900/50 text-amber-400' : 'bg-teal-900/50 text-teal-400';
      return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color}`}>Trial — {daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>;
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top nav */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="font-black text-xl">Rank<span className="text-teal-400">Rebuild</span></div>
          {getPlanBadge()}
        </div>
        <div className="flex items-center gap-3">
          {limits && (
            <span className="text-xs text-slate-400 hidden sm:inline">
              {sites.length} / {limits.maxSites === Infinity ? '∞' : limits.maxSites} site{limits.maxSites !== 1 ? 's' : ''} used
            </span>
          )}
          <SignOutButton />
          <button
            onClick={() => setShowModal(true)}
            className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
            <span>+</span> Connect Site
          </button>
        </div>
      </header>

      {/* Upgrade Required banner — show only when no active sub or trial expiring soon */}
      {(isBad && subscription !== undefined) && (
        <div className="bg-red-900/30 border-b border-red-700/50 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-300 text-sm">
            <span>🔒</span>
            <span>Upgrade Required — your access is limited. Subscribe to unlock all features.</span>
          </div>
          <Link
            href="/pricing"
            className="bg-red-500 hover:bg-red-400 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            Upgrade Now
          </Link>
        </div>
      )}

      {/* Trial expiring soon banner */}
      {trialExpiringSoon && isActive && (
        <div className="bg-amber-900/30 border-b border-amber-700/50 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300 text-sm">
            <span>⚡</span>
            <span>Your trial expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Upgrade to keep access.</span>
          </div>
          <Link
            href="/pricing"
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            Upgrade Now
          </Link>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Sites Grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black">Your Sites</h1>
            {limits && (
              <span className="text-sm text-slate-400 sm:hidden">
                {sites.length} / {limits.maxSites === Infinity ? '∞' : limits.maxSites} sites used
              </span>
            )}
          </div>

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
