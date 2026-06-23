import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { provisionCertification } from "@/lib/provision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Faithful port of the legacy apex `api/webhook.js` (Stripe → provision → Discord),
// with the security hole fixed: the apex handler trusted `req.body` directly; this
// one verifies the Stripe signature against the raw body before acting.
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: "2025-02-24.acacia" as any })
  : null;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripe || !endpointSecret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET)" },
      { status: 503 },
    );
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // Raw body is required for signature verification — App Router exposes it via .text().
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new NextResponse(`Webhook Error: ${msg}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const tierId = session.metadata?.tierId ?? "unknown";
      const customerEmail =
        session.customer_details?.email ?? session.customer_email ?? "";

      const provision = await provisionCertification(tierId, customerEmail);
      if (!provision.ok) console.error("[provisioning failed]", provision.error);

      const discord = process.env.DISCORD_WEBHOOK_URL;
      if (discord) {
        const did = provision.ok
          ? ((provision.certificate as { did_id?: string }).did_id ?? "?")
          : "Failed";
        await fetch(discord, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `💰 **New CSOAI Sale!**\n**Tier:** ${tierId}\n**Customer:** ${customerEmail}\n**Amount:** £${((session.amount_total ?? 0) / 100).toFixed(2)}\n**DID:** ${did}`,
          }),
        }).catch(() => {});
      }

      // Welcome email (preserved from the legacy stripe-webhook route).
      if (customerEmail && process.env.RESEND_API_KEY) {
        const label =
          tierId === "enterprise" ? "Enterprise" : tierId === "pro" ? "Pro" : tierId;
        await fetch("https://api.resend.com/v1/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "CouncilOf.AI <welcome@councilof.ai>",
            to: [customerEmail],
            subject: `Welcome to CouncilOf.AI ${label}`,
            html: `<h2>Welcome to CouncilOf.AI!</h2><p>Thank you for your ${label} purchase. Your access is now active — visit <a href="https://councilof.ai">councilof.ai</a> to get started.</p>`,
          }),
        }).catch((e) => console.error("[welcome email]", e));
      }
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhook handler error]", msg);
    return new NextResponse(`Webhook handler error: ${msg}`, { status: 500 });
  }
}
