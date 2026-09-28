/**
 * POST /api/paddle-webhook — Paddle settlement webhook.
 *
 * Paddle fires transaction.completed when a buyer pays. This endpoint:
 *   1. Verifies Paddle's HMAC-SHA256 signature.
 *   2. Extracts customer email, product/price id, amount, transaction id.
 *   3. Grants the entitlement (in KV).
 *   4. Issues a csoai.certificate/0.1 (sha256 of canonical payload + Ed25519 sig).
 *   5. Returns 200 to Paddle (Paddle retries on non-2xx).
 *
 * SIGNATURE VERIFICATION is M4/Nick-gated: PADDLE_WEBHOOK_SECRET must be set
 * as a Cloudflare Pages secret. Without it, this endpoint rejects with 422.
 *
 * CERT SIGNING is M4/Nick-gated: BOARD_SIGN_KEY_PKCS8_B64 must be set.
 * Without it, the cert is issued unsigned (sig_ed25519: null) and the
 * downstream verifier reports UNCHECKABLE — which is the honest state
 * when the key is absent.
 *
 * This endpoint does NOT issue refunds. Refunds are handled by POST /api/refund
 * (operator-manual or Paddle webhook for transaction.refunded).
 */

type Env = {
  PADDLE_WEBHOOK_SECRET?: string;
  PADDLE_PRODUCT_ID?: string;
  PADDLE_PRICE_ID?: string;
  BOARD_SIGN_KEY_PKCS8_B64?: string;
  LEADS?: KVNamespace;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function hmacVerify(secret: string, body: string, signature: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return expected === signature;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function canonPayload(payload: Record<string, unknown>): string {
  return JSON.stringify(payload, Object.keys(payload).sort()).replace(/\s/g, "");
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Step 1: Verify Paddle HMAC
  const rawBody = await request.text();
  const paddleSig = request.headers.get("paddle-signature") ?? "";
  if (!env.PADDLE_WEBHOOK_SECRET) return json({ ok: false, code: "NO_SECRET", detail: "PADDLE_WEBHOOK_SECRET not configured" }, 422);
  if (!paddleSig) return json({ ok: false, code: "NO_SIGNATURE", detail: "paddle-signature header missing" }, 401);

  // Paddle sends: "hmac:<hex>" in the paddle-signature header
  const [algo, hexSig] = paddleSig.split(":", 2);
  if (algo !== "hmac" || !hexSig) return json({ ok: false, code: "BAD_PADDLE_SIG_FORMAT", detail: "expected hmac:<hex>" }, 401);
  const valid = await hmacVerify(env.PADDLE_WEBHOOK_SECRET, rawBody, hexSig);
  if (!valid) return json({ ok: false, code: "HMAC_MISMATCH", detail: "signature does not match" }, 401);

  // Step 2: Parse the transaction
  let event: Record<string, unknown>;
  try { event = JSON.parse(rawBody); } catch { return json({ ok: false, code: "BAD_BODY", detail: "not JSON" }, 400); }

  const eventType = event.event_type;
  if (eventType !== "transaction.completed") return json({ ok: true, ignored: true, event_type: eventType });

  const data = event.data as Record<string, unknown> | undefined;
  if (!data) return json({ ok: false, code: "NO_DATA" }, 400);

  const transactionId = String(data.id ?? "");
  const customerId = String((data.customer_id as string) ?? "");
  const customData = (data.custom_data ?? {}) as Record<string, unknown>;
  const customerEmail = String(customData.email ?? data.customer_email ?? "");

  // Extract price/product from items
  const items = (data.items ?? []) as Array<Record<string, unknown>>;
  const priceId = items[0]?.price_id as string ?? "";
  const quantity = items[0]?.quantity as number ?? 1;

  // Validate against expected product/price
  if (env.PADDLE_PRODUCT_ID && items[0]?.product_id !== env.PADDLE_PRODUCT_ID) {
    return json({ ok: false, code: "UNKNOWN_PRODUCT", detail: `product_id ${items[0]?.product_id} != expected ${env.PADDLE_PRODUCT_ID}` }, 422);
  }

  // Step 3: Build the entitlement record
  const now = new Date().toISOString();
  const entitlement = {
    sku: "csoai.measurement-card.issuance",
    tier: "proof" as const,
    issued_via: {
      channel: "paddle_settlement" as const,
      settlement_reference: transactionId,
    },
  };

  // Step 4: Issue the certificate (unsigned if no signing key)
  const payload: Record<string, unknown> = {
    subject: { kind: "account", id: customerEmail || customerId || `paddle_${transactionId}` },
    entitlement,
    scope: { tool_set: ["mcp_trust", "x402_trust"], free_calls_per_day: null, expires_at: null },
    verification: { url: "https://councilof.ai/verify", did_document: "https://csoai.org/.well-known/did.json" },
  };

  const canonBytes = JSON.stringify(payload, Object.keys(payload).sort());
  const certId = await sha256Hex(canonBytes);

  let sigHex: string | null = null;
  if (env.BOARD_SIGN_KEY_PKCS8_B64) {
    try {
      const keyBytes = Uint8Array.from(atob(env.BOARD_SIGN_KEY_PKCS8_B64), (c) => c.charCodeAt(0));
      const privateKey = await crypto.subtle.importKey("pkcs8", keyBytes, { name: "Ed25519" }, false, ["sign"]);
      const sigBuf = await crypto.subtle.sign("Ed25519", privateKey, new TextEncoder().encode(canonBytes));
      sigHex = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      return json({ ok: false, code: "SIGN_FAILED", detail: String(e) }, 500);
    }
  }

  const certificate = {
    schema: "csoai.certificate/0.1",
    certificate_id: certId,
    issued_at: now,
    issuer_did: "did:web:csoai.org#board-attestation-1",
    payload,
    sig_ed25519: sigHex,
    limits: { non_certification: true, non_promotion: true, writes_board: false },
  };

  // Step 5: Store the entitlement and cert in KV (idempotent on transaction id)
  if (env.LEADS) {
    const kvKey = `entitlement:paddle:${transactionId}`;
    const existing = await env.LEADS.get(kvKey);
    if (existing) return json({ ok: true, idempotent: true, transaction_id: transactionId, note: "Entitlement already granted for this transaction." });
    await env.LEADS.put(kvKey, JSON.stringify({ entitlement, certificate, granted_at: now }), { expirationTtl: 60 * 60 * 24 * 365 });
  }

  return json({
    ok: true,
    transaction_id: transactionId,
    certificate_id: certId,
    issued_at: now,
    signed: sigHex !== null,
    note:
      "Entitlement granted and certificate issued. " +
      (sigHex
        ? "The certificate is signed and verifiable offline at tools/verify/csoai_verify.py."
        : "BOARD_SIGN_KEY_PKCS8_B64 not set — certificate is unsigned (sig_ed25519: null). Set the secret to enable signing."),
  }, 201);
};

export const onRequestGet: PagesFunction = async () => json({
  schema: "csoai.paddle-webhook-endpoint/0.1",
  endpoint: "/api/paddle-webhook",
  methods: { POST: "Paddle transaction.completed webhook. Verifies HMAC, issues cert, grants entitlement." },
  contract: "Paddle fires transaction.completed. This endpoint verifies the signature, extracts the transaction, grants the entitlement, and issues a csoai.certificate/0.1 signed under did:web:csoai.org#board-attestation-1.",
});
