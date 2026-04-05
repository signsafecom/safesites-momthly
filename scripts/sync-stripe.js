#!/usr/bin/env node
/**
 * Sync Stripe Products and Prices
 *
 * Ensures the required Stripe product and monthly subscription price exist
 * for the SignSafe subscription plan. Idempotent: re-running this script
 * will not create duplicate products or prices.
 *
 * Required environment variables:
 *   STRIPE_SECRET_KEY – Stripe secret key (sk_live_... or sk_test_...)
 */

'use strict';

const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY environment variable is required.');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

const PRODUCT_NAME = 'SignSafe Subscription';
const PRICE_NICKNAME = 'SignSafe Monthly';
const PRICE_AMOUNT = 2900; // $29.00 in cents
const PRICE_CURRENCY = 'usd';

async function findOrCreateProduct() {
  const products = await stripe.products.list({ limit: 100, active: true });
  const existing = products.data.find((p) => p.name === PRODUCT_NAME);
  if (existing) {
    console.log(`Product already exists: ${existing.id} (${existing.name})`);
    return existing;
  }

  const product = await stripe.products.create({
    name: PRODUCT_NAME,
    description: 'AI-powered document review and compliance platform',
  });
  console.log(`Created product: ${product.id} (${product.name})`);
  return product;
}

async function findOrCreatePrice(productId) {
  const prices = await stripe.prices.list({ product: productId, limit: 100, active: true });
  const existing = prices.data.find(
    (p) =>
      p.recurring &&
      p.recurring.interval === 'month' &&
      p.unit_amount === PRICE_AMOUNT &&
      p.currency === PRICE_CURRENCY
  );

  if (existing) {
    console.log(`Price already exists: ${existing.id} (${existing.nickname || existing.id})`);
    return existing;
  }

  const price = await stripe.prices.create({
    product: productId,
    nickname: PRICE_NICKNAME,
    unit_amount: PRICE_AMOUNT,
    currency: PRICE_CURRENCY,
    recurring: { interval: 'month' },
  });
  console.log(`Created price: ${price.id} (${price.nickname})`);
  return price;
}

async function main() {
  console.log('Syncing Stripe products and prices...');
  const product = await findOrCreateProduct();
  const price = await findOrCreatePrice(product.id);
  console.log(`Stripe sync complete. Product: ${product.id}, Price: ${price.id}`);
}

main().catch((err) => {
  console.error('Stripe sync failed:', err.message);
  process.exit(1);
});
