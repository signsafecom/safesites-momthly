import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { prisma } from '../models/prisma';
import { logger } from '../utils/logger';
import { stripe, webhookSecret } from '../lib/stripe';
import { Notifier } from '../notify/slack';

export const webhookRouter = Router();

const notifier = new Notifier();
const processedEvents = new Set<string>();
const MAX_PROCESSED_EVENTS = 10_000;

/**
 * @openapi
 * /api/v1/webhooks/stripe:
 *   post:
 *     summary: Stripe webhook handler
 *     tags: [Webhooks]
 */
webhookRouter.post('/stripe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, webhookSecret!);
    } catch (err) {
      await notifier.error('Webhook signature failed', err);
      res.status(400).json({ error: 'Webhook signature verification failed' });
      return;
    }

    if (event.id && processedEvents.has(event.id)) {
      res.json({ received: true, duplicate: true });
      return;
    }
    if (event.id) {
      if (processedEvents.size >= MAX_PROCESSED_EVENTS) {
        processedEvents.delete(processedEvents.values().next().value as string);
      }
      processedEvents.add(event.id);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.userId) {
          await prisma.user.update({
            where: { id: session.metadata.userId },
            data: {
              subscriptionId: session.subscription as string,
              subscriptionStatus: 'ACTIVE',
              stripeCustomerId: session.customer as string,
              billingCycleStart: new Date(),
              documentsThisMonth: 0,
            },
          });
        }
        await notifier.send(`🎉 Subscription activated: ${session.customer_email ?? session.customer}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
        if (user) {
          await prisma.payment.create({
            data: {
              userId: user.id,
              stripePaymentId: invoice.payment_intent as string,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: 'SUCCEEDED',
              description: `Subscription payment - ${new Date().toISOString().slice(0, 7)}`,
            },
          });
          // Reset monthly document counter
          await prisma.user.update({
            where: { id: user.id },
            data: { documentsThisMonth: 0, billingCycleStart: new Date() },
          });
        }
        await notifier.paymentReceived(invoice.amount_paid, invoice.currency, invoice.customer);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: 'PAST_DUE' },
        });
        await notifier.error('Invoice payment failed', { customer: invoice.customer });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.user.updateMany({
          where: { subscriptionId: subscription.id },
          data: { subscriptionStatus: 'CANCELED' },
        });
        await notifier.send(`🚫 Subscription cancelled: ${subscription.id}`);
        break;
      }

      default:
        logger.info(`Unhandled Stripe event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});
