import Link from 'next/link';
import { Site, Change } from '@/types';

interface SiteCardProps {
  site: Site;
  recentChanges?: Change[];
}

export default function SiteCard({ site, recentChanges = [] }: SiteCardProps) {
  const lastChange = recentChanges[0];
  const deployedCount = recentChanges.filter(c => c.status === 'deployed').length;

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 hover:border-teal-500/50 rounded-2xl p-5 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 text-lg font-bold">
            {site.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{site.name}</h3>
            <a href={site.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-teal-400 transition-colors truncate max-w-[160px] block">
              {site.url.replace('https://', '').replace('http://', '')}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-slate-400">Connected</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-slate-900/50 rounded-lg p-2.5 text-center">
          <div className="text-lg font-bold text-white">{deployedCount}</div>
          <div className="text-xs text-slate-500">Changes</div>
        </div>
        <div className="flex-1 bg-slate-900/50 rounded-lg p-2.5 text-center">
          <div className="text-xs font-medium text-teal-400 mt-1">
            {site.seo_plugin === 'yoast' ? 'Yoast' : site.seo_plugin === 'rankmath' ? 'RankMath' : 'No SEO'}
          </div>
          <div className="text-xs text-slate-500">Plugin</div>
        </div>
        <div className="flex-1 bg-slate-900/50 rounded-lg p-2.5 text-center">
          <div className="text-xs font-medium text-slate-300 mt-1">
            {lastChange ? timeAgo(lastChange.created_at) : 'Never'}
          </div>
          <div className="text-xs text-slate-500">Last Edit</div>
        </div>
      </div>

      {/* Last change */}
      {lastChange && (
        <div className="text-xs text-slate-400 bg-slate-900/30 rounded-lg px-3 py-2 mb-4 truncate">
          Last: {lastChange.title || lastChange.field || 'Change'} — {lastChange.status}
        </div>
      )}

      {/* Action */}
      <Link
        href={`/chat/${site.id}`}
        className="w-full block text-center bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-sm py-2.5 rounded-xl transition-colors">
        Open Chat →
      </Link>
    </div>
  );
}
