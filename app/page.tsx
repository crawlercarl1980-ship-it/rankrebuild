import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'RankRebuild — AI Website Management for WordPress',
  description: 'Update your WordPress website using AI chat. Describe changes in plain English, preview before publishing, and deploy in one click. No developers needed.',
  keywords: 'WordPress AI, website management, AI content, WordPress automation, website editor AI',
  openGraph: {
    title: 'RankRebuild — Update Your Website With AI',
    description: 'Chat with AI to update your WordPress site. No developers. No waiting. Preview changes before they go live.',
    url: 'https://rankrebuild.com',
    siteName: 'RankRebuild',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RankRebuild — AI Website Management',
    description: 'Update your WordPress site by chatting with AI. Preview changes. Deploy instantly.',
  },
  alternates: {
    canonical: 'https://rankrebuild.com',
  },
}

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #14b8a6 0%, #5eead4 40%, #14b8a6 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3.5s linear infinite;
        }
        .card-lift {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .card-lift:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.45);
          border-color: rgba(20, 184, 166, 0.25);
        }
        .pro-glow {
          box-shadow: 0 0 0 1px rgba(20,184,166,0.35), 0 0 60px rgba(20,184,166,0.1), 0 20px 40px rgba(0,0,0,0.35);
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        .pro-glow:hover {
          box-shadow: 0 0 0 1px rgba(20,184,166,0.55), 0 0 80px rgba(20,184,166,0.18), 0 28px 52px rgba(0,0,0,0.45);
          transform: translateY(-3px);
        }
        details summary::-webkit-details-marker { display: none; }
        details summary { list-style: none; }
        details[open] .faq-icon { transform: rotate(45deg); }
        .faq-icon { transition: transform 0.2s ease; display: inline-block; }
        .cta-btn {
          transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }
        .cta-btn:hover {
          transform: translateY(-2px);
        }
      `}</style>

      <div className="min-h-screen bg-slate-950 text-white">

        {/* ── Nav ─────────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-50 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
            <div className="font-black text-xl tracking-tight select-none">
              Rank<span className="text-teal-400">Rebuild</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
              <a href="#features"     className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
              <a href="#pricing"      className="hover:text-white transition-colors">Pricing</a>
              <Link href="/auth"      className="hover:text-white transition-colors">Sign In</Link>
            </div>
            <Link
              href="/auth"
              className="cta-btn bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-sm px-4 py-2 rounded-lg shadow-md shadow-teal-500/20"
            >
              Start Free Trial
            </Link>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse 90% 65% at 50% -5%, rgba(20,184,166,0.13) 0%, transparent 65%)',
          }}
        >
          {/* Grid texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative max-w-4xl mx-auto text-center px-6 pt-28 pb-28">
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2.5 border border-teal-500/30 bg-teal-500/5 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
              <span className="text-xs font-semibold tracking-widest uppercase shimmer-text">
                AI-Powered WordPress Management
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
              Stop waiting on<br />
              <span className="text-teal-400">developers.</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              Describe any change to your WordPress site in plain English.
              Preview it. Approve it. Done — in under a minute.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap mb-6">
              <Link
                href="/auth"
                className="cta-btn bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-base px-8 py-3.5 rounded-xl shadow-xl shadow-teal-500/25 hover:shadow-teal-400/35"
              >
                Start Free Trial
              </Link>
              <a
                href="#how-it-works"
                className="cta-btn text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 text-base px-8 py-3.5 rounded-xl"
              >
                See How It Works →
              </a>
            </div>

            <p className="text-xs text-slate-500 tracking-wide">
              14-day free trial · No credit card required · Cancel anytime
            </p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />
        </section>

        {/* ── Social Proof Bar ─────────────────────────────────────── */}
        <section className="border-y border-slate-800/40 bg-slate-900/20 py-5">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-slate-500 text-sm">
              <span className="text-slate-400 font-medium">Trusted by 500+ WordPress site owners</span>
              <span className="hidden md:block w-px h-4 bg-slate-700" />
              <span>⭐⭐⭐⭐⭐&nbsp; 4.9 average rating</span>
              <span className="hidden md:block w-px h-4 bg-slate-700" />
              <span>🔒&nbsp; SOC 2 compliant infrastructure</span>
              <span className="hidden md:block w-px h-4 bg-slate-700" />
              <span>⚡&nbsp; 2,000+ sites managed</span>
            </div>
          </div>
        </section>

        {/* ── Problem / Solution ──────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-28">
          <div className="grid md:grid-cols-2 gap-10 items-stretch">
            {/* Pain */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col">
              <div className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-3">The old way</div>
              <h2 className="text-2xl font-bold mb-6 text-slate-200 leading-snug">
                Why is updating a website<br />still this painful?
              </h2>
              <ul className="space-y-4 text-slate-400 flex-1">
                {([
                  ['💸', 'Developers charge $150/hr for a 5-minute text change'],
                  ['⏳', 'Wait days — or weeks — for simple updates to ship'],
                  ['😵', 'Navigate Gutenberg, Elementor, or whatever theme you\'re stuck with'],
                  ['🔁', 'Back-and-forth revisions that drain time, energy, and money'],
                ] as [string, string][]).map(([icon, text]) => (
                  <li key={text} className="flex items-start gap-3 text-sm leading-relaxed">
                    <span className="text-base mt-0.5 shrink-0">{icon}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 30%, rgba(20,184,166,0.07) 0%, transparent 70%)',
                }}
              />
              <div className="relative bg-slate-900/50 border border-teal-500/20 rounded-2xl p-8 flex flex-col h-full">
                <div className="text-xs font-bold tracking-widest uppercase text-teal-400 mb-3">The RankRebuild way</div>
                <h2 className="text-2xl font-bold mb-6 text-white leading-snug">
                  Just describe<br />what you want.
                </h2>
                <ul className="space-y-4 text-slate-300 flex-1">
                  {([
                    '"Update the homepage headline to say…"',
                    '"Write a 600-word SEO blog post about…"',
                    '"Change the contact email to…"',
                    'Preview it. Approve it. Done.',
                  ] as string[]).map((text) => (
                    <li key={text} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span className="text-teal-400 font-bold mt-0.5 shrink-0">✓</span>
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features Grid ───────────────────────────────────────── */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <div className="text-xs font-bold tracking-widest uppercase text-teal-400 mb-3">Features</div>
            <h2 className="text-4xl font-black tracking-tight">Everything you need. Nothing you don't.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {([
              {
                icon: '💬',
                title: 'Chat to Edit',
                desc: 'Type what you want changed in plain English. No learning curve, no menus to navigate — the AI interprets your intent and handles the rest.',
              },
              {
                icon: '👁️',
                title: 'Preview Before Publishing',
                desc: 'See a full before/after of every change before a single byte touches your live site. Tweak the wording, adjust the tone — until it\'s exactly right.',
              },
              {
                icon: '🚀',
                title: 'One-Click Deploy',
                desc: 'Approve and your site updates in seconds. Every change is versioned — roll back anything instantly, no backup plugins needed.',
              },
            ] as { icon: string; title: string; desc: string }[]).map((f) => (
              <div
                key={f.title}
                className="card-lift bg-slate-900 border border-slate-800 rounded-2xl p-7"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-2xl mb-5">
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-3 text-white">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="py-28"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(20,184,166,0.04) 0%, transparent 70%)',
          }}
        >
          <div className="max-w-2xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="text-xs font-bold tracking-widest uppercase text-teal-400 mb-3">How It Works</div>
              <h2 className="text-4xl font-black tracking-tight">Up and running in under a minute.</h2>
            </div>

            <div className="relative">
              {/* Connecting line */}
              <div
                className="absolute left-5 top-10 bottom-10 w-px"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(20,184,166,0.7) 0%, rgba(20,184,166,0.2) 60%, transparent 100%)',
                }}
              />

              <div className="space-y-10">
                {([
                  {
                    num: '1',
                    title: 'Connect your WordPress site',
                    desc: 'Paste your site URL and create a WordPress application password. We verify the connection instantly — you\'re ready in 30 seconds.',
                  },
                  {
                    num: '2',
                    title: 'Describe the change you want',
                    desc: 'Type naturally. "Rewrite my About page to be more concise" or "Write a blog post about our summer sale."',
                  },
                  {
                    num: '3',
                    title: 'Preview it before publishing',
                    desc: 'Review a full preview of the change. Not happy? Just type what you\'d like adjusted — iterate until it\'s perfect.',
                  },
                  {
                    num: '4',
                    title: 'Approve and go live',
                    desc: 'One click. Your site is updated instantly. Every change is saved with a full undo history.',
                  },
                ] as { num: string; title: string; desc: string }[]).map((step) => (
                  <div key={step.num} className="flex gap-6 items-start relative">
                    <div className="relative z-10 w-10 h-10 rounded-full bg-teal-500 text-slate-900 font-black flex items-center justify-center shrink-0 text-sm shadow-lg shadow-teal-500/30">
                      {step.num}
                    </div>
                    <div className="pb-2 pt-1">
                      <h3 className="font-bold text-white text-lg mb-1.5">{step.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Use Cases ───────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <div className="text-xs font-bold tracking-widest uppercase text-teal-400 mb-3">Use Cases</div>
            <h2 className="text-4xl font-black tracking-tight">Built for how real people work.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {([
              {
                icon: '🏪',
                who: 'Small Business Owner',
                scenario:
                  'Update homepage copy, swap a photo, change opening hours — without calling your nephew who "does websites".',
              },
              {
                icon: '✍️',
                who: 'Content Creator & Blogger',
                scenario:
                  'Dictate your ideas, get polished SEO-ready posts drafted and published to WordPress in minutes, not hours.',
              },
              {
                icon: '🏢',
                who: 'Agency Managing Client Sites',
                scenario:
                  'Handle quick-turn client requests across multiple sites from one dashboard. No dev tickets, no context-switching.',
              },
            ] as { icon: string; who: string; scenario: string }[]).map((uc) => (
              <div
                key={uc.who}
                className="card-lift bg-slate-900/50 border border-slate-800 rounded-2xl p-7"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-2xl mb-5">
                  {uc.icon}
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest text-teal-400 mb-2.5">
                  {uc.who}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{uc.scenario}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────── */}
        <section
          id="pricing"
          className="py-28"
          style={{
            background:
              'linear-gradient(to bottom, transparent, rgba(2,6,23,0.6) 30%, rgba(2,6,23,0.6) 70%, transparent)',
          }}
        >
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="text-xs font-bold tracking-widest uppercase text-teal-400 mb-3">Pricing</div>
              <h2 className="text-4xl font-black tracking-tight">Simple, transparent pricing.</h2>
              <p className="text-slate-400 mt-3">14-day free trial on every plan. No credit card required.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* Basic */}
              <div className="card-lift bg-slate-900 border border-slate-700/50 rounded-2xl p-8">
                <div className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-2">Basic</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black">$49</span>
                  <span className="text-slate-400 text-lg mb-2">/month</span>
                </div>
                <p className="text-slate-500 text-sm mb-8">Per site, billed monthly. Cancel anytime.</p>
                <ul className="space-y-3.5 mb-8">
                  {([
                    '1 WordPress site',
                    '4 AI blog posts per month',
                    'Unlimited page edits',
                    'Change history & rollback',
                    'Email support',
                  ] as string[]).map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 text-xs shrink-0">
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth"
                  className="cta-btn block text-center border border-teal-500/40 text-teal-400 hover:bg-teal-500/10 font-bold py-3.5 rounded-xl text-sm"
                >
                  Start 14-Day Free Trial
                </Link>
              </div>

              {/* Pro */}
              <div className="pro-glow bg-slate-900 border border-teal-500/30 rounded-2xl p-8 relative md:-mt-4 md:mb-4">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-500 text-slate-900 text-xs font-black px-4 py-1 rounded-full tracking-wider uppercase whitespace-nowrap">
                  Most Popular
                </div>
                <div className="text-xs font-bold tracking-widest uppercase text-teal-400 mb-2">Pro</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black">$99</span>
                  <span className="text-slate-400 text-lg mb-2">/month</span>
                </div>
                <p className="text-slate-500 text-sm mb-8">Up to 3 sites, billed monthly. Cancel anytime.</p>
                <ul className="space-y-3.5 mb-8">
                  {([
                    '3 WordPress sites',
                    'Unlimited AI blog posts',
                    'Unlimited page edits',
                    'Change history & rollback',
                    'Priority support',
                    'SEO performance reports',
                  ] as string[]).map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 text-xs shrink-0">
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth"
                  className="cta-btn block text-center bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3.5 rounded-xl text-sm shadow-lg shadow-teal-500/20"
                >
                  Start 14-Day Free Trial
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <section id="faq" className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <div className="text-xs font-bold tracking-widest uppercase text-teal-400 mb-3">FAQ</div>
            <h2 className="text-4xl font-black tracking-tight">Frequently asked questions.</h2>
          </div>

          <div className="space-y-3">
            {([
              {
                q: 'Do I need to know how to code?',
                a: 'Not at all. RankRebuild is designed for non-technical users. If you can write a text message, you can update your website.',
              },
              {
                q: 'Which WordPress sites does it work with?',
                a: "Any self-hosted WordPress site (wordpress.org). You'll need admin access and the ability to generate an application password — that's it.",
              },
              {
                q: 'Is my site content safe?',
                a: 'Yes. Every change is logged, versioned, and fully reversible. You review a preview before anything goes live, and you can roll back any change with one click.',
              },
              {
                q: 'How is this different from the WordPress editor?',
                a: 'The WordPress editor requires you to navigate menus, understand blocks, and know where to find things. With RankRebuild you just describe the change in plain English — no interface to learn.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel with one click from your account settings. No phone calls, no forms, no hard feelings.',
              },
            ] as { q: string; a: string }[]).map((item) => (
              <details
                key={item.q}
                className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden"
              >
                <summary className="cursor-pointer flex items-center justify-between px-6 py-5 font-semibold text-white hover:text-teal-400 transition-colors">
                  {item.q}
                  <span className="faq-icon text-slate-500 text-2xl leading-none ml-4 shrink-0 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-5 text-slate-400 text-sm leading-relaxed border-t border-slate-800/60 pt-4">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────── */}
        <section
          className="py-28 relative overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse 65% 70% at 50% 50%, rgba(20,184,166,0.08) 0%, transparent 70%)',
          }}
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />
          </div>
          <div className="relative max-w-2xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-5 leading-tight">
              Ready to update your site<br />in seconds?
            </h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              Join hundreds of WordPress site owners who stopped waiting on developers
              and started shipping changes themselves.
            </p>
            <Link
              href="/auth"
              className="cta-btn inline-block bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-base px-10 py-4 rounded-xl shadow-xl shadow-teal-500/25 hover:shadow-teal-400/35"
            >
              Start Free Trial — No Credit Card
            </Link>
            <p className="text-xs text-slate-600 mt-4 tracking-wide">
              14-day free trial · Cancel anytime
            </p>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="border-t border-slate-800/50 py-10">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="font-black text-lg text-white mb-1">
                Rank<span className="text-teal-400">Rebuild</span>
              </div>
              <p className="text-slate-500 text-xs">AI-powered website management for WordPress</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms"   className="hover:text-white transition-colors">Terms</Link>
              <a href="mailto:hello@rankrebuild.com" className="hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-slate-600 text-xs">© 2026 RankRebuild. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </>
  )
}
