# RankRebuild

AI-powered WordPress website management. Chat to make changes, preview before deploying, publish with one click.

## What It Does

RankRebuild lets small business owners update their WordPress website through a chat interface — no technical knowledge required. Connect your WordPress site, describe what you want to change, review a before/after preview, and deploy with one click.

**Features:**
- 💬 Chat-based page editing ("change my headline to...")
- 📝 AI blog post generation with full SEO optimization
- 👁️ Before/after diff preview before anything goes live
- 🚀 One-click deploy via WordPress REST API
- ↩️ Full change history with rollback

## Prerequisites

- Node.js 18+
- A Supabase account (free at supabase.com)
- An Anthropic API key (console.anthropic.com)
- A Stripe account (stripe.com)
- A WordPress site with REST API enabled (default in WP 5.6+)

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your keys:
- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings (keep secret!)
- `ANTHROPIC_API_KEY` — from console.anthropic.com
- `STRIPE_SECRET_KEY` — from Stripe dashboard
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` — from Stripe webhook settings

### 3. Set up Supabase database
1. Go to your Supabase project → SQL Editor
2. Copy the SQL schema from the top of `lib/supabase.ts`
3. Run it to create the tables and row-level security policies

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Connecting a WordPress Test Site

1. Install WordPress locally using [LocalWP](https://localwp.com) (free, 5 min setup)
2. In your WordPress admin: **Users → Your Profile → Application Passwords**
3. Enter a name like "SitePilot" and click **Add New Application Password**
4. Copy the generated password (you won't see it again)
5. In SitePilot: Dashboard → Connect Site → enter your LocalWP URL + credentials

**LocalWP URL format:** Usually `http://sitename.local` — check the LocalWP app for your exact URL.

## Project Structure

```
app/
  page.tsx              # Landing page
  layout.tsx            # Root layout
  dashboard/page.tsx    # Dashboard (connected sites)
  chat/[siteId]/        # Chat interface per site
  api/
    chat/route.ts       # Streaming AI chat endpoint
    sites/route.ts      # CRUD for connected sites
    deploy/route.ts     # Deploy changes to WordPress

components/
  ChatInterface.tsx     # Main chat UI
  DiffPreview.tsx       # Before/after diff for page edits
  BlogPreview.tsx       # Blog post preview before publishing
  SiteCard.tsx          # Dashboard site card
  ConnectSiteModal.tsx  # Add new site form

lib/
  wordpress.ts          # WordPress REST API client
  agent.ts              # Claude agent tools + system prompt
  supabase.ts           # Supabase helpers + SQL schema

types/
  index.ts              # TypeScript types
```

## Deploying to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add all environment variables in Vercel project settings
4. Deploy

The app is fully compatible with Vercel's free hobby tier for development and small-scale use.

## Adding Stripe Subscriptions

Stripe integration hooks are set up but subscription enforcement is not yet wired in. To add billing:

1. Create products in Stripe Dashboard (Basic $49/mo, Pro $99/mo)
2. Add a `/api/stripe/webhook` route to handle subscription events
3. Store `stripe_subscription_status` in the Supabase users table
4. Add middleware to check subscription before allowing chat/deploy

## Tech Stack

- [Next.js 14](https://nextjs.org) — App Router
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [Supabase](https://supabase.com) — Auth + Database
- [Vercel AI SDK](https://sdk.vercel.ai) — Streaming chat
- [Anthropic Claude](https://anthropic.com) — AI engine
- [Stripe](https://stripe.com) — Payments
