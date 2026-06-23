import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Server-side Stripe secret key. Set in Vercel env (NEVER prefix with NEXT_PUBLIC_).
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2025-02-24.acacia" as any }) : null;

// Map product slug → Stripe Price ID. Set these in Vercel env to match your
// Stripe dashboard. The fallback (no env) returns a 503 so the UI can show
// "Payments temporarily unavailable" instead of a hard error.
const PRICE_MAP: Record<string, { envVar: string; fallback: number }> = {
  pack_eu_ai_act:   { envVar: "STRIPE_PRICE_PACK_EU_AI_ACT",   fallback: 99900 }, // £999
  pack_growth:      { envVar: "STRIPE_PRICE_PACK_GROWTH",      fallback: 49900 }, // £499
  pack_finance:     { envVar: "STRIPE_PRICE_PACK_FINANCE",     fallback: 149900 }, // £1,499
  article_50_kit:   { envVar: "STRIPE_PRICE_ARTICLE_50_KIT",   fallback: 99900 }, // £999
};

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        {
          error: "payments_unavailable",
          message:
            "Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_* env vars in Vercel.",
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const productId: string = body?.product_id;
    if (!productId || !PRICE_MAP[productId]) {
      return NextResponse.json(
        { error: "unknown_product", message: `Unknown product_id: ${productId}` },
        { status: 400 },
      );
    }

    const config = PRICE_MAP[productId];
    const priceId = process.env[config.envVar];

    const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://csoai.org";

    // If we have a Stripe Price ID, use it directly. Otherwise fall back to
    // inline price_data so dev/sandbox flows work without dashboard setup.
    const line_item = priceId
      ? { price: priceId, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: config.fallback,
            product_data: {
              name:
                productId === "pack_eu_ai_act"
                  ? "CSOAI EU AI Act Emergency Pack"
                  : productId === "pack_growth"
                    ? "CSOAI Brand & Distribution Pack"
                    : productId === "pack_finance"
                      ? "CSOAI Agentic Finance Pack"
                      : "CSOAI Article 50 Kit",
              description: `MCP server pack — ${productId}`,
            },
          },
        };

    const session = await stripe.checkout.sessions.create({
      mode: productId === "pack_finance" ? "subscription" : "payment",
      line_items: [line_item],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: { product_id: productId, tierId: productId },
      payment_method_types: ["card"],
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url, id: session.id });
  } catch (err: unknown) {
    console.error("[/api/checkout] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "checkout_creation_failed", message },
      { status: 500 },
    );
  }
}
