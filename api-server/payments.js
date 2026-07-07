// CSOAI Payments — Paddle (Merchant of Record) checkout + webhook, with Ed25519-SIGNED
// certificate provisioning via the SAME shared spine as a2a.js/assess.js (no duplicate crypto,
// no Stripe — Stripe banned the account). Env-guarded: returns 503 until PADDLE_* are set.
//
// GET  /api/checkout?product=<id>   -> { url } hosted Paddle checkout for that product
// POST /api/paddle/webhook          -> verifies HMAC, provisions a signed cert on transaction.completed
// GET  /api/paddle/key              -> the public key any /verify surface uses to check a cert
//
// Mount in server.js:  import payments from "./payments.js"; app.use(payments);

import express from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { canon, signBytes, KID, pubB64 } from "./a2a.js";

const router = express.Router();

const CERT_STORE = process.env.CERT_STORE || path.join(process.cwd(), "certs.jsonl");
const WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || "";
const DISCORD = process.env.DISCORD_WEBHOOK_URL || "";

// Product catalog — Paddle price IDs come from env so no secrets in source.
// PADDLE_PRICE_<KEY> maps our product ids to Paddle price ids.
const PRODUCTS = {
  pack_eu_ai_act: { label: "EU AI Act Assessment Pack", gbp: 999, priceEnv: "PADDLE_PRICE_PACK_EU_AI_ACT" },
  pack_finance:   { label: "Finance / COBOL Bridge Pack", gbp: 1499, priceEnv: "PADDLE_PRICE_PACK_FINANCE" },
  pack_growth:    { label: "Growth Pack", gbp: 499, priceEnv: "PADDLE_PRICE_PACK_GROWTH" },
  article_50_kit: { label: "Article 50 Transparency Kit", gbp: 999, priceEnv: "PADDLE_PRICE_ARTICLE_50_KIT" },
};

function configured() { return Boolean(WEBHOOK_SECRET && process.env.PADDLE_API_KEY); }

// ---- Paddle HMAC-SHA256 verify: header `ts=...;h1=...`, signed over `${ts}:${rawBody}` ----
function verifyPaddle(raw, header, secret) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(";").map((p) => p.split("=")));
  const ts = parts["ts"], h1 = parts["h1"];
  if (!ts || !h1) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${ts}:${raw}`).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(h1), Buffer.from(expected)); }
  catch { return false; }
}

// ---- sign a certificate with the shared Ed25519 spine ----
function provisionCertificate(productId, email, amountGbp) {
  const cert = {
    did_id: `did:csoai:cert-${crypto.randomBytes(12).toString("hex")}`,
    product_id: productId,
    product_label: (PRODUCTS[productId] || {}).label || productId,
    customer_email: email || "",
    amount_gbp: amountGbp,
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 365 * 864e5).toISOString(),
    kid: KID, alg: "Ed25519",
  };
  const signed_payload = canon(cert);
  const sig = signBytes(Buffer.from(signed_payload));
  const record = { ...cert, signed_payload, sig, pub: pubB64 };
  try { fs.appendFileSync(CERT_STORE, JSON.stringify(record) + "\n"); } catch (e) { /* non-fatal */ }
  return record;
}

// ---- GET /api/checkout?product=<id> ----
router.get("/api/checkout", (req, res) => {
  if (!configured()) return res.status(503).json({ error: "Payments not configured (PADDLE_* env)" });
  const product = String(req.query.product || "");
  const p = PRODUCTS[product];
  if (!p) return res.status(400).json({ error: "unknown product", valid_products: Object.keys(PRODUCTS) });
  const priceId = process.env[p.priceEnv];
  if (!priceId) return res.status(503).json({ error: `price not configured (${p.priceEnv})` });
  // Paddle hosted checkout: front-end opens Paddle.js with this price id; we return the descriptor.
  res.json({ product, label: p.label, gbp: p.gbp, paddle_price_id: priceId, mode: "paddle_hosted" });
});

router.get("/api/paddle/key", (_req, res) => res.json({ kid: KID, alg: "Ed25519", publicKey: pubB64 }));

// ---- POST /api/paddle/webhook (raw body needed for HMAC) ----
router.post("/api/paddle/webhook", express.raw({ type: "*/*", limit: "256kb" }), async (req, res) => {
  if (!WEBHOOK_SECRET) return res.status(503).json({ error: "PADDLE_WEBHOOK_SECRET not set" });
  const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body || "");
  if (!verifyPaddle(raw, req.headers["paddle-signature"], WEBHOOK_SECRET))
    return res.status(400).send("Invalid Paddle signature");

  let event;
  try { event = JSON.parse(raw); } catch { return res.status(400).send("Bad JSON"); }

  try {
    if (event?.event_type === "transaction.completed") {
      const d = event.data || {};
      const productId = d?.custom_data?.product_id || "unknown";
      const email = d?.customer?.email || d?.billing_details?.email || d?.customer_email || "";
      const amount = Number(d?.details?.totals?.grand_total ?? 0) / 100;
      const cert = provisionCertificate(productId, email, amount);
      if (DISCORD) {
        fetch(DISCORD, { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: `New CSOAI sale (Paddle): ${productId} / £${amount.toFixed(2)} / ${cert.did_id}` }) })
          .catch(() => {});
      }
      return res.json({ received: true, did_id: cert.did_id });
    }
    return res.json({ received: true });
  } catch (err) {
    return res.status(500).send("Webhook handler error");
  }
});

export { provisionCertificate, verifyPaddle, PRODUCTS };
export default router;
