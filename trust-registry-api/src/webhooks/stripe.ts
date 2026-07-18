import express, { Router } from 'express';
import { pool } from '../db';

export const stripeWebhookRouter = Router();

stripeWebhookRouter.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const event = JSON.parse(req.body);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerEmail = session.customer_email;
        const amount = session.amount_total;
        const currency = session.currency;
        
        console.log(`Payment completed: ${customerEmail} — ${amount / 100} ${currency.toUpperCase()}`);
        
        // Auto-mint Enterprise Trust SBT for paid customers
        // (requires Solana integration)
        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object;
        console.log(`Subscription paid: ${invoice.subscription}`);
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`Payment failed: ${invoice.subscription}`);
        break;
      }
      
      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    res.status(400).json({ error: 'Webhook handling failed' });
  }
});
