import { logger } from '../utils/logger';

export class Notifier {
  private readonly webhookUrl: string | undefined;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
  }

  async send(message: string): Promise<void> {
    if (!this.webhookUrl) return;
    try {
      const res = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
      if (!res.ok) {
        logger.warn(`Slack notification failed: ${res.status} ${res.statusText}`);
      }
    } catch (err) {
      logger.error('Failed to send Slack notification', err);
    }
  }

  async error(title: string, details?: unknown): Promise<void> {
    const detailStr =
      details instanceof Error
        ? details.message
        : JSON.stringify(details, null, 2);
    await this.send(`❌ *${title}*\n\`\`\`${detailStr}\`\`\``);
  }

  async paymentReceived(
    amount: number,
    currency: string,
    customer: unknown,
  ): Promise<void> {
    await this.send(
      `💰 Payment received: $${(amount / 100).toFixed(2)} ${currency.toUpperCase()} from ${customer}`,
    );
  }
}
