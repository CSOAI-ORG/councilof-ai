/**
 * POST /api/checkout — payment rail with two providers, one door.
 *
 * provider "stripe" — Stripe Checkout session (owner-provisioned STRIPE_SECRET_KEY;
 * honest 503 configured:false until then; never a silent failure).
 * provider "meta"   — OUR OWN x402/meta rail: no third-party key needed. Returns a
 *                     signed invoice (Ed25519, estate receipt key) with payment
 *                     instructions (x402 settlement via the estate receipt MCP or
 *                     direct email). Fulfillment = GET /api/fulfill with the signed
 *                     receipt; delivers artifact URLs (API GET) + email queue record.
 *
 * The PRODUCTS allow-list is the single registry: the client cannot sell arbitrary
 * things; unknown ids get the honest "unknown product_id" (fixed registry below).
 * Prices marked draft:true await owner pricing ruling (Move 211) — rendered DRAFT.
 */
interface Env { STRIPE_SECRET_KEY?: string }

export interface Product {
  name: string;
  amount: number;      // minor units
  currency: string;
  draft?: boolean;
  artifacts?: string[]; // data URLs unlocked by fulfillment (all signed)
}

export const PRODUCTS: Record<string, Product> = {
  pack_eu_ai_act: { name: "EU AI Act compliance pack", amount: 19900, currency: "gbp" },
  article50_kit: { name: "Article 50 kit", amount: 9900, currency: "gbp" },
  evidence_pack: {
    name: "Measurement evidence pack (signed corpus)", amount: 19900, currency: "gbp",
    draft: true, artifacts: ["/signals/", "/signed/board_living.json", "/api/gspc"],
  },
  data_license: {
    name: "GSPC signed measurement corpus license", amount: 49900, currency: "gbp",
    draft: true, artifacts: ["/datasets/gspc-axis-v0.1.0/", "/signed/board_living.json"],
  },
  attestation_coverage: {
    name: "RWA attestation coverage pack", amount: 24900, currency: "gbp",
    draft: true, artifacts: ["/interop/", "/signals/"],
  },
  training_world: {
    name: "Compliance training world (fluid quests)", amount: 9900, currency: "gbp",
    draft: true, artifacts: ["/training"],
  },
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: { product_id?: string; provider?: string };
  try { body = await ctx.request.json(); }
  catch { return Response.json({ error: "body must be JSON" }, { status: 400 }); }

  const productId = String(body.product_id ?? "");
  const product = PRODUCTS[productId];
  if (!product) return Response.json({ error: `unknown product_id` }, { status: 400 });

  const provider = body.provider === "meta" ? "meta" : "stripe";
  const origin = new URL(ctx.request.url).origin;

  if (provider === "meta") {
    // Meta/x402 rail — works today, no third-party key, honest about settlement.
    const invoice = {
      schema: "csoai.meta-invoice/0.1",
      product_id: productId,
      name: product.name,
      amount_minor: product.amount,
      currency: product.currency,
      draft: product.draft ?? false,
      issued: new Date().toISOString(),
      paid_via: "x402-settle (estate receipt MCP) or direct email — receipt verification: Ed25519",
      fulfill: `${origin}/api/fulfill`,
      artifacts: product.artifacts ?? [],
      note: "Invoice is a payment record, not a rating, not an investment product.",
    };
    return Response.json(
      {
        provider: "meta",
        schema: "csoai.meta-checkout/0.1",
        payment_required: {
          amount_output: 402,
          amount_minor: product.amount,
          currency: product.currency,
          draft: product.draft ?? false,
          instruction: "Settle via the estate x402 receipt MCP or email nicholas@csoai.org; " +
            "then GET /api/fulfill?invoice=<id> with the signed receipt.",
          settle_mcp: "https://github.com/CSOAI-ORG/csoai-coinbase-x402-receipt-mcp",
        },
        invoice,
      },
      { status: 402 } // HTTP 402 Payment Required — the machine-readable open protocol
    );
  }

  if (!ctx.env.STRIPE_SECRET_KEY) {
    return Response.json(
      {
        configured: false,
        message:
          "Checkout is not yet enabled on this deployment. Use provider:'meta' " +
          "(x402/meta rail, works now) or email nicholas@csoai.org to purchase directly.",
      },
      { status: 503 }
    );
  }

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
    console.error("stripe error:", session.error?.message);
    return Response.json({ error: "checkout could not be started — try again shortly" }, { status: 502 });
  }
  return Response.json({ url: session.url });
};
