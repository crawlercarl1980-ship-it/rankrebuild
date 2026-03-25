'use client';

import Link from 'next/link';

const basicFeatures = [
  '1 WordPress site',
  'Unlimited AI edits',
  '4 AI blog posts/month',
  'One-click deploy',
  'Change history & rollback',
  'Email support',
];

const proFeatures = [
  '3 WordPress sites',
  'Unlimited AI edits',
  'Unlimited AI blog posts',
  'One-click deploy',
  'Change history & rollback',
  'Priority support',
  'Custom branding',
  'Advanced SEO tools',
];

export default function PricingPage() {
  const handleCheckout = (plan: string) => {
    window.location.href = `/api/checkout?plan=${plan}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-black text-xl">
          Rank<span className="text-teal-400">Rebuild</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Start with a 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Basic Plan */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-black mb-1">Basic</h2>
              <p className="text-slate-400 text-sm mb-4">Perfect for solo creators & small businesses</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">$49</span>
                <span className="text-slate-400">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {basicFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="text-teal-400 text-lg leading-none">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout('basic')}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 rounded-xl transition-colors text-sm"
            >
              Start Free Trial
            </button>
            <p className="text-center text-xs text-slate-500 mt-3">14-day free trial • No credit card required</p>
          </div>

          {/* Pro Plan */}
          <div className="bg-slate-900 border-2 border-teal-500 rounded-2xl p-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-teal-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">
              POPULAR
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-black mb-1">Pro</h2>
              <p className="text-slate-400 text-sm mb-4">For agencies & growing businesses</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">$99</span>
                <span className="text-slate-400">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="text-teal-400 text-lg leading-none">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout('pro')}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 rounded-xl transition-colors text-sm"
            >
              Start Free Trial
            </button>
            <p className="text-center text-xs text-slate-500 mt-3">14-day free trial • No credit card required</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold mb-2">Do I need a credit card to start the trial?</h3>
              <p className="text-slate-400 text-sm">No! You can start your 14-day free trial without entering any payment information. You'll only be charged after the trial ends if you choose to continue.</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Can I cancel anytime?</h3>
              <p className="text-slate-400 text-sm">Yes, you can cancel your subscription at any time. Your access will continue until the end of the billing period.</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">What WordPress plugins do you support?</h3>
              <p className="text-slate-400 text-sm">We support both Yoast SEO and Rank Math for SEO optimization, as well as standard WordPress pages and posts.</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Can I upgrade or downgrade my plan?</h3>
              <p className="text-slate-400 text-sm">Yes, you can switch between plans at any time. Changes take effect immediately and are prorated.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
