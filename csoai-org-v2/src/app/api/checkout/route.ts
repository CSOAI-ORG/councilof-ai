import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * Provider-agnostic checkout.
 * PAYMENT_PROVIDER = "paddle" (default) | "stripe".
 *
 * Paddle is a Merchant of Record: it becomes the legal seller, handles EU VAT,
 * chargebacks and fraud — the right rail for a UK solo founder selling AI-compliance
 * products, and far more tolerant of this category than Stripe's aggregator model.
 * Stripe path is retained in case the account ban is reversed on appeal.
 *
 * No new npm dependency: Paddle is called over its REST API with fetch.
 */

const PROVIDER = (process.env.PAYMENT_PROVIDER || "paddle").toLowerCase();

// product slug → { Paddle price id env, Stripe price id env, GBP pence fallback }
const PRODUCTS: Record<string, { paddleEnv: string; stripeEnv: string; fallback: number; name: string }> = {
  pack_eu_ai_act: { paddleEnv: "PADDLE_PRICE_PACK_EU_AI_ACT", stripeEnv: "STRIPE_PRICE_PACK_EU_AI_ACT", fallback: 99900,  name: "CSOAI EU AI Act Emergency Pack" },
  pack_growth:    { paddleEnv: "PADDLE_PRICE_PACK_GROWTH",    stripeEnv: "STRIPE_PRICE_PACK_GROWTH",    fallback: 49900,  name: "CSOAI Brand & Distribution Pack" },
  pack_finance:   { paddleEnv: "PADDLE_PRICE_PACK_FINANCE",   stripeEnv: "STRIPE_PRICE_PACK_FINANCE",   fallback: 149900, name: "CSOAI Agentic Finance Pack" },
  article_50_kit: { paddleEnv: "PADDLE_PRICE_ARTICLE_50_KIT", stripeEnv: "STRIPE_PRICE_ARTICLE_50_KIT", fallback: 99900,  name: "CSOAI Article 50 Kit" },
};

function unconfigured(what: string) {
  return NextResponse.json(
    { error: "payments_unavailable", message: `Payments not configured: ${what}` },
    { status: 503 },
  );
}

async function paddleCheckout(productId: string) {
  const cfg = PRODUCTS[productId];
  const apiKey = process.env.PADDLE_API_KEY;
  const priceId = process.env[cfg.paddleEnv];
  if (!apiKey) return unconfigured("set PADDLE_API_KEY");
  if (!priceId) return unconfigured(`set ${cfg.paddleEnv} to a Paddle price id`);

  const base = (process.env.PADDLE_API_BASE || "https://api.paddle.com").replace(/\/$/, "");
  // Create a transaction; Paddle returns a hosted checkout URL when a default
  // payment link is set in Paddle > Checkout settings.
  const res = await fetch(`${base}/transactions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ price_id: priceId, quantity: 1 }],
      custom_data: { product_id: productId },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: "paddle_error", message: data?.error?.detail || "Paddle transaction failed" },
      { status: 502 },
    );
  }
  const url = data?.data?.checkout?.url;
  if (!url) {
    return NextResponse.json(
      { error: "paddle_no_checkout_url",
        message: "Transaction created but no checkout URL — set a default payment link in Paddle > Checkout settings.",
        transaction_id: data?.data?.id },
      { status: 502 },
    );
  }
  return NextResponse.json({ url, id: data?.data?.id, provider: "paddle" });
}

async function stripeCheckout(productId: string) {
  const cfg = PRODUCTS[productId];
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return unconfigured("set STRIPE_SECRET_KEY");
  const stripe = new Stripe(secret, { apiVersion: "2026-05-27.dahlia" });
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://csoai.org";
  const priceId = process.env[cfg.stripeEnv];
  const line_item = priceId
    ? { price: priceId, quantity: 1 }
    : { quantity: 1, price_data: { currency: "gbp", unit_amount: cfg.fallback,
        product_data: { name: cfg.name, description: `MCP server pack — ${productId}` } } };
  const session = await stripe.checkout.sessions.create({
    mode: productId === "pack_finance" ? "subscription" : "payment",
    line_items: [line_item],
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
    metadata: { product_id: productId },
    payment_method_types: ["card"],
    allow_promotion_codes: true,
  });
  return NextResponse.json({ url: session.url, id: session.id, provider: "stripe" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productId: string = body?.product_id;
    if (!productId || !PRODUCTS[productId]) {
      return NextResponse.json(
        { error: "unknown_product", message: `Unknown product_id: ${productId}` },
        { status: 400 },
      );
    }
    return PROVIDER === "stripe" ? await stripeCheckout(productId) : await paddleCheckout(productId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: "checkout_creation_failed", message }, { status: 500 });
  }
}
