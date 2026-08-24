/**
 * POST /api/checkout — fire the revenue cannon: a Stripe Checkout Session for the
 * estate's buyer-side products.
 *
 * Stripe is the live rail (sk_live account nicholas@csoai.org, MEOK Sovereign Pro
 * prices live). A Checkout Session redirects the buyer to Stripe-hosted checkout
 * so the pricing/product pages convert. Measurement-not-certification: the buyer
 * pays for the signed evidence product (a measurement card / assessment run),
 * never to influence a score.
 *
 * Products (live Stripe price or GBP-pence fallback):
 *   meok_pro          → MEOK Sovereign Pro (monthly £1,299 / yearly £12,900)
 *   pack_eu_ai_act    → CSOAI EU AI Act Emergency Pack (£999)
 *   pack_growth       → CSOAI Brand & Distribution Pack (£499)
 *   pack_finance      → CSOAI Agentic Finance Pack (£1,499)
 *   article_50_kit    → CSOAI Article 50 Kit (£999)
 */
import Stripe from "stripe";

interface Body {
  product: string;
  mode?: "payment" | "subscription";
  success_url?: string;
  cancel_url?: string;
}

const PRODUCTS: Record<string, { priceId: string; fallback: number; name: string }> = {
  meok_pro: { priceId: "price_1TzH19QvIueK5XpbFQz2MiIN", fallback: 129900, name: "MEOK Sovereign Pro — monthly" },
  meok_pro_yearly: { priceId: "price_1TzH1AQvIueK5XpbOtNqNoA6", fallback: 1290000, name: "MEOK Sovereign Pro — yearly" },
  pack_eu_ai_act: { priceId: "", fallback: 99900, name: "CSOAI EU AI Act Emergency Pack" },
  pack_growth: { priceId: "", fallback: 49900, name: "CSOAI Brand & Distribution Pack" },
  pack_finance: { priceId: "", fallback: 149900, name: "CSOAI Agentic Finance Pack" },
  article_50_kit: { priceId: "", fallback: 99900, name: "CSOAI Article 50 Kit" },
};

export const onRequestPost: PagesFunction = async (ctx) => {
  const key = ctx.env?.STRIPE_SECRET_KEY;
  if (!key) {
    return Response.json({ error: "payments_unavailable", message: "STRIPE_SECRET_KEY not set on this deployment" }, { status: 503 });
  }
  let body: Body;
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const cfg = PRODUCTS[body.product];
  if (!cfg) {
    return Response.json({ error: "unknown_product", available: Object.keys(PRODUCTS) }, { status: 400 });
  }
  const origin = new URL(ctx.request.url).origin;
  const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

  try {
    const mode = body.mode === "subscription" ? "subscription" : "payment";
    const session = await stripe.checkout.sessions.create({
      mode,
      ...(cfg.priceId
        ? { line_items: [{ price: cfg.priceId, quantity: 1 }] }
        : { line_items: [{ quantity: 1, price_data: { currency: "gbp", unit_amount: cfg.fallback, product_data: { name: cfg.name } } }] }),
      success_url: body.success_url || `${origin}/checkout/success`,
      cancel_url: body.cancel_url || `${origin}/pricing/`,
      ...(mode === "subscription" ? {} : {}),
    });
    return Response.json({ url: session.url, session_id: session.id, product: body.product });
  } catch (e) {
    return Response.json({ error: "stripe_error", message: String(e).slice(0, 120) }, { status: 500 });
  }
};
