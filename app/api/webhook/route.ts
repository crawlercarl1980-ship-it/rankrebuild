import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const adminClient = getAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.mode !== 'subscription') break;

      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      // Get the subscription details
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = stripeSubscription.items.data[0]?.price.id;

      // Determine plan from price ID
      const basicPriceId = process.env.STRIPE_BASIC_PRICE_ID || 'price_1TEq1o3Y7rHgDRwZwX1eBdIX';
      const proPriceId = process.env.STRIPE_PRO_PRICE_ID || 'price_1TEq1o3Y7rHgDRwZfREYyslx';
      const plan = priceId === basicPriceId ? 'basic' : priceId === proPriceId ? 'pro' : 'basic';

      // Get user_id from customer metadata
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      const userId = customer.metadata?.user_id;

      if (!userId) {
        console.error('No user_id in customer metadata for customer:', customerId);
        break;
      }

      const status = stripeSubscription.status === 'trialing' ? 'trialing' : 'active';
      const trialEnd = stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000).toISOString()
        : null;
      const anchorDate = new Date(stripeSubscription.billing_cycle_anchor * 1000);
      // Add 1 month to billing anchor to approximate period end
      anchorDate.setMonth(anchorDate.getMonth() + 1);
      const periodEnd = anchorDate.toISOString();

      await adminClient.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        plan,
        status,
        trial_ends_at: trialEnd,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const status = subscription.status === 'trialing' ? 'trialing'
        : subscription.status === 'active' ? 'active'
        : subscription.status === 'past_due' ? 'past_due'
        : subscription.status === 'canceled' ? 'canceled'
        : 'active';

      const anchor = new Date(subscription.billing_cycle_anchor * 1000);
      anchor.setMonth(anchor.getMonth() + 1);
      const periodEnd = anchor.toISOString();

      await adminClient.from('subscriptions')
        .update({
          status,
          current_period_end: periodEnd,
          stripe_subscription_id: subscription.id,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await adminClient.from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);

      break;
    }
  }

  return NextResponse.json({ received: true });
}
