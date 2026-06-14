import { NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' as any });
}

export async function POST(request: Request) {
  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in Vercel env vars.' },
      { status: 503 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = (session.customer_details as Stripe.Checkout.Session.CustomerDetails)?.email;
        const tier = session.metadata?.tier || 'pro';

        if (customerEmail && process.env.RESEND_API_KEY) {
          try {
            const resendResponse = await fetch('https://api.resend.com/v1/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'CouncilOf.AI <welcome@councilof.ai>',
                to: [customerEmail],
                subject: `Welcome to CouncilOf.AI ${tier === 'enterprise' ? 'Enterprise' : 'Pro'}`,
                html: `
                  <h2>Welcome to CouncilOf.AI!</h2>
                  <p>Thank you for subscribing to our ${tier} plan.</p>
                  <p>Your access is now active. Visit <a href="https://councilof.ai">councilof.ai</a> to get started.</p>
                  <p>If you have any questions, reply to this email.</p>
                `,
              }),
            });
            if (!resendResponse.ok) {
              console.error('Failed to send welcome email:', await resendResponse.text());
            }
          } catch (emailError) {
            console.error('Email send error:', emailError);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded':
        break;

      case 'invoice.payment_failed':
        break;

      case 'customer.subscription.deleted':
        break;

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
