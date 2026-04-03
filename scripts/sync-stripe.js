#!/usr/bin/env node
// scripts/sync-stripe.js
// Syncs SignSafe products and prices to Stripe.
// Usage: STRIPE_SECRET_KEY=sk_... node scripts/sync-stripe.js

'use strict';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('Error: STRIPE_SECRET_KEY environment variable is required.');
  process.exit(1);
}

const stripe = require('stripe')(secretKey);

const PAY_PER_USE = [
  { name: 'Quick Scan (≤15 pages)', price: 500 },
  { name: 'Deep Scan (16-50 pages)', price: 1000 },
  { name: 'Full Review (50+ pages)', price: 1500 },
  { name: 'Disclosure Check', price: 500 },
  { name: 'Contract Risk Analysis', price: 1000 },
];

const SUBSCRIPTIONS = [
  { name: 'SignSafe Pro', monthly: 2900, annual: 29000 },
  { name: 'SignSafe Firm', monthly: 4900, annual: 49000 },
];

async function sync() {
  console.log('Syncing SignSafe products to Stripe...\n');

  console.log('--- Pay-per-use products ---');
  for (const product of PAY_PER_USE) {
    try {
      const created = await stripe.products.create({
        name: product.name,
        description: 'One-time analysis',
        metadata: { type: 'pay_per_use', platform: 'signsafe' },
        default_price_data: { currency: 'cad', unit_amount: product.price },
      });
      console.log(`✅  ${product.name} — $${(product.price / 100).toFixed(2)} CAD  (product: ${created.id})`);
    } catch (err) {
      console.error(`❌  ${product.name}:`, err.message);
    }
  }

  console.log('\n--- Subscription tiers ---');
  for (const tier of SUBSCRIPTIONS) {
    try {
      const product = await stripe.products.create({
        name: tier.name,
        description: 'Recurring subscription',
        metadata: { type: 'subscription', platform: 'signsafe' },
      });
      const monthly = await stripe.prices.create({
        product: product.id,
        currency: 'cad',
        unit_amount: tier.monthly,
        recurring: { interval: 'month' },
      });
      const annual = await stripe.prices.create({
        product: product.id,
        currency: 'cad',
        unit_amount: tier.annual,
        recurring: { interval: 'year' },
      });
      console.log(
        `✅  ${tier.name} — monthly: ${monthly.id} ($${(tier.monthly / 100).toFixed(2)}/mo)` +
          ` | annual: ${annual.id} ($${(tier.annual / 100).toFixed(2)}/yr)`,
      );
    } catch (err) {
      console.error(`❌  ${tier.name}:`, err.message);
    }
  }

  console.log('\nDone!');
}

sync().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
