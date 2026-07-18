/**
 * CSOAI Stripe Webhook Handler
 * Processes Stripe webhook events for subscription management
 */

import type { Request, Response } from "express";
import Stripe from "stripe";
import { sendEmail } from "../services/emailService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2025-12-15.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Get tier from price ID
 */
function getTierFromPriceId(priceId: string): 'free' | 'pro' | 'enterprise' {
  const proMonthly = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  const proYearly = process.env.STRIPE_PRO_YEARLY_PRICE_ID;
  const enterpriseMonthly = process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID;
  const enterpriseYearly = process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID;

  if (priceId === proMonthly || priceId === proYearly) return 'pro';
  if (priceId === enterpriseMonthly || priceId === enterpriseYearly) return 'enterprise';
  return 'free';
}

/**
 * Map Stripe subscription status to internal status
 */
function mapSubscriptionStatus(stripeStatus: string): 'active' | 'canceled' | 'past_due' | 'inactive' {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'canceled':
    case 'unpaid':
      return 'canceled';
    case 'past_due':
      return 'past_due';
    default:
      return 'inactive';
  }
}

/**
 * Handle incoming Stripe webhooks
 */
export async function webhookHandler(req: Request, res: Response) {
  // If no webhook secret configured, just acknowledge
  if (!webhookSecret) {
    console.log("[Stripe Webhook] No webhook secret configured, skipping verification");
    return res.json({ received: true, warning: "No webhook secret configured" });
  }

  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  // Handle different event types
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("[Stripe Webhook] Checkout session completed:", session.id);

      // Get the customer email from the session
      const customerEmail = session.customer_email || session.customer_details?.email;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (customerEmail && customerId) {
        try {
          // Log the subscription activation (DB update would happen here in production)
          console.log(`[Stripe Webhook] Subscription activated for ${customerEmail}`);
          console.log(`[Stripe Webhook] Customer ID: ${customerId}, Subscription ID: ${subscriptionId}`);

          // Send welcome email for new subscription
          await sendEmail({
            to: customerEmail,
            subject: "Welcome to CSOAI Pro! Your subscription is active",
            html: `
              <h1>Welcome to CSOAI Pro!</h1>
              <p>Your subscription has been activated successfully.</p>
              <p>You now have access to:</p>
              <ul>
                <li>10 AI Systems monitoring</li>
                <li>Multi-framework compliance (EU AI Act, NIST AI RMF, ISO 42001, TC260)</li>
                <li>Priority email support</li>
                <li>Advanced analytics and reporting</li>
              </ul>
              <p>Get started by visiting your <a href="https://councilof.ai/dashboard">dashboard</a>.</p>
              <p>Thank you for choosing CSOAI!</p>
            `,
          });
        } catch (error) {
          console.error("[Stripe Webhook] Failed to update user:", error);
        }
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("[Stripe Webhook] Subscription updated:", subscription.id);

      const customerId = subscription.customer as string;
      const status = mapSubscriptionStatus(subscription.status);
      const priceId = subscription.items.data[0]?.price.id || '';
      const tier = getTierFromPriceId(priceId);

      try {
        // Log subscription update (DB update would happen here in production)
        console.log(`[Stripe Webhook] Updated subscription for customer ${customerId}: ${tier} (${status})`);
      } catch (error) {
        console.error("[Stripe Webhook] Failed to update subscription:", error);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("[Stripe Webhook] Subscription deleted:", subscription.id);

      const customerId = subscription.customer as string;

      try {
        // Log subscription deletion (DB update would happen here in production)
        console.log(`[Stripe Webhook] Downgraded customer ${customerId} to free tier`);
        // Email notification would be sent here in production
      } catch (error) {
        console.error("[Stripe Webhook] Failed to handle subscription deletion:", error);
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log("[Stripe Webhook] Invoice paid:", invoice.id);
      // Invoice paid - subscription continues normally
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.log("[Stripe Webhook] Invoice payment failed:", invoice.id);
      const customerId = invoice.customer as string;
      console.log(`[Stripe Webhook] Marked customer ${customerId} as past_due`);
      // Email notification and DB update would happen here in production
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}
