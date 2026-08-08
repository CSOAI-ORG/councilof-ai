/**
 * POST /api/checkout — Stripe Checkout session creation, or the honest absence of it.
 *
 * CREDENTIAL BOUNDARY
 * The STRIPE_SECRET_KEY is never handled by automation: the owner provisions it with
 *   npx wrangler pages secret put STRIPE_SECRET_KEY --project-name=councilof-ai
 * Until then this endpoint returns 503 with `configured: false` — a dead-honest state the
 * front can render ("checkout not yet enabled") instead of a silent failure. When the key
 * exists, we call Stripe's REST API directly (no SDK needed on Workers).
 *
 * Price IDs are allow-listed here so the client cannot ask to sell arbitrary things.
 */
interface Env { STRIPE_SECRET_KEY?: string }

const PRODUCTS: Record<string, { name: string; amount: number; currency: string }> = {
  // amounts in minor units; extend the allow-list as real products are decided
  pack_eu_ai_act: { name: "EU AI Act compliance pack", amount: 19900, currency: "gbp" },
  article50_kit: { name: "Article 50 kit", amount: 9900, currency: "gbp" },
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Record<string, unknown>;
  try { body = await ctx.request.json(); }
  catch { return Response.json({ error: "body must be JSON" }, { status: 400 }); }

  const productId = String(body.product_id ?? "");
  const product = PRODUCTS[productId];
  if (!product) return Response.json({ error: `unknown product_id` }, { status: 400 });

  if (!ctx.env.STRIPE_SECRET_KEY) {
    return Response.json(
      {
        configured: false,
        message:
          "Checkout is not yet enabled on this deployment. Email nicholas@csoai.org to purchase directly.",
      },
      { status: 503 }
    );
  }

  const origin = new URL(ctx.request.url).origin;
  const form = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": product.currency,
    "line_items[0][price_data][unit_amount]": String(product.amount),
    "line_items[0][price_data][product_data][name]": product.name,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
  });

  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  const session = (await r.json()) as { url?: string; error?: { message?: string } };
  if (!r.ok || !session.url) {
    // Stripe's error goes to the log, not the customer; the customer gets a usable message.
    console.error("stripe error:", session.error?.message);
    return Response.json({ error: "checkout could not be started — try again shortly" }, { status: 502 });
  }
  return Response.json({ url: session.url });
};
