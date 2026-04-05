import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error('Missing STRIPE_SECRET_KEY');

export const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });

export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');
