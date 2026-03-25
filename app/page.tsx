import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800/50 max-w-6xl mx-auto">
        <div className="font-black text-xl tracking-tight">
          Rank<span className="text-teal-400">Rebuild</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth" className="text-sm text-slate-400 hover:text-white transition-colors">Sign In</Link>
          <Link href="/auth"
            className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-sm px-4 py-2 rounded-lg transition-colors">
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center px-6 pt-24 pb-20">
        <div className="inline-block bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
          No developers. No waiting.
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
          Update your website<br />
          <span className="text-teal-400">with AI.</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Chat with AI to make changes to your WordPress site. Preview before it goes live.
          Deploy with one click. No technical knowledge required.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/auth"
            className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-lg px-8 py-4 rounded-xl transition-colors shadow-lg shadow-teal-500/20">
            Start Free Trial
          </Link>
          <Link href="#how-it-works"
            className="text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 text-lg px-8 py-4 rounded-xl transition-colors">
            See How It Works
          </Link>
        </div>
        <p className="text-xs text-slate-500 mt-4">14-day free trial · No credit card required</p>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '💬', title: 'Chat to Edit', desc: 'Describe what you want in plain English. "Change the headline to..." or "Write a blog post about..." — the AI understands.' },
            { icon: '👁️', title: 'Preview First', desc: 'See exactly what will change before anything goes live. Side-by-side before/after for edits, full preview for blog posts.' },
            { icon: '🚀', title: 'One-Click Deploy', desc: 'Approve the change and it\'s live on your site in seconds. Every change is logged and reversible with one click.' },
          ].map(f => (
            <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-center mb-12">How It Works</h2>
        <div className="space-y-6">
          {[
            { num: '1', title: 'Connect your WordPress site', desc: 'Paste your site URL and WordPress application password. We test the connection instantly.' },
            { num: '2', title: 'Chat about what you want to change', desc: 'Type your request in plain English. No code, no techspeak.' },
            { num: '3', title: 'Review the preview', desc: 'See exactly what will change before anything goes live. Request tweaks if needed.' },
            { num: '4', title: 'Approve and go live', desc: 'One click and your site is updated. Takes seconds. Undo anytime.' },
          ].map(step => (
            <div key={step.num} className="flex gap-5 items-start">
              <div className="w-10 h-10 rounded-full bg-teal-500 text-slate-900 font-black flex items-center justify-center shrink-0 text-lg">
                {step.num}
              </div>
              <div>
                <h3 className="font-bold text-white mb-1">{step.title}</h3>
                <p className="text-slate-400 text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-center mb-4">Simple Pricing</h2>
        <p className="text-slate-400 text-center mb-12">Start free. Cancel anytime.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
            <h3 className="font-bold text-lg mb-1">Basic</h3>
            <div className="text-4xl font-black mb-1">$49<span className="text-lg font-normal text-slate-400">/mo</span></div>
            <p className="text-slate-500 text-sm mb-6">Per site, billed monthly</p>
            <ul className="space-y-3 mb-8 text-sm text-slate-300">
              {['1 WordPress site', '4 AI blog posts per month', 'Unlimited page edits', 'Change history + rollback', 'Email support'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-teal-400">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/auth"
              className="block text-center border border-teal-500 text-teal-400 hover:bg-teal-500/10 font-bold py-3 rounded-xl transition-colors">
              Start Free Trial
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-teal-500/10 border-2 border-teal-500 rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">
              MOST POPULAR
            </div>
            <h3 className="font-bold text-lg mb-1">Pro</h3>
            <div className="text-4xl font-black mb-1">$99<span className="text-lg font-normal text-slate-400">/mo</span></div>
            <p className="text-slate-500 text-sm mb-6">Up to 3 sites, billed monthly</p>
            <ul className="space-y-3 mb-8 text-sm text-slate-300">
              {['3 WordPress sites', 'Unlimited AI blog posts', 'Unlimited page edits', 'Change history + rollback', 'Priority support', 'SEO performance reports'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-teal-400">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/auth"
              className="block text-center bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 rounded-xl transition-colors">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-8 py-8 text-center text-sm text-slate-500">
        <div className="font-black text-white text-lg mb-2">Rank<span className="text-teal-400">Rebuild</span></div>
        <p>© 2026 RankRebuild · AI-powered website management</p>
      </footer>
    </div>
  );
}
