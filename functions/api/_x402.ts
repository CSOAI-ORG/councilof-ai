// functions/api/_x402.ts — FAIL-CLOSED x402 receipt verification, shared by every metered
// endpoint (currently /api/proof?bundle=1 and /api/eunomia-data).
//
// WHY THIS EXISTS: both metered endpoints shipped the same money-integrity bug —
//   const paid = request.headers.get("x-payment") != null;
// which treated the mere PRESENCE of an x-payment header (even "x-payment: test") as proof of
// payment and handed over the paid artefact for free. Header presence is not settlement. This
// module is the one place that decides "is this request actually paid?", so the two endpoints
// cannot drift apart and neither can regress to header-presence.
//
// WHAT "verified" MEANS: the X-PAYMENT header must decode to a structured x402 payment payload
// AND a configured x402 facilitator must return isValid over that payload against the payment
// requirements for the resource. If no facilitator is provisioned (the estate's x402 rail is
// still `mode: "mock"` per /.well-known/x402.json — there is no live settle path yet), the
// receipt cannot be confirmed settled, so verification FAILS CLOSED: the caller returns 402 and
// never grants on header presence.
//
// TODO(x402 live): provision the X402_* bindings below (Cloudflare secrets) and confirm the
//   facilitator implements the standard x402 `POST {facilitator}/verify` (and `/settle`) contract
//   — see https://github.com/CSOAI-ORG/csoai-coinbase-x402-receipt-mcp. Until then verification
//   returns { ok:false } by design; that is the honest state, not a regression.

export type X402Env = {
  // The x402 facilitator that verifies (and settles) a receipt. Absent → metered endpoints
  // stay 402: an unverified receipt is never accepted.
  X402_FACILITATOR_URL?: string;
  X402_ASSET?: string; // ERC-20 asset contract the receipt must pay (e.g. USDC on base)
  X402_NETWORK?: string; // e.g. "base"
  X402_PAY_TO?: string; // the address the receipt must pay
  X402_AMOUNT?: string; // atomic units required (string, as x402 encodes it)
};

export type X402Result = { ok: boolean; reason: string };

/**
 * verifyX402Payment — returns { ok:true } ONLY for a facilitator-verified receipt. Never grants
 * on header presence or structure alone.
 */
export async function verifyX402Payment(
  request: Request,
  env: X402Env,
  resourceUrl: string,
): Promise<X402Result> {
  const header = request.headers.get("x-payment");
  if (!header) return { ok: false, reason: "no x-payment header" };

  // Decode the X-PAYMENT header (x402 sends it base64-encoded JSON). A header that does not
  // decode to a structured payload is not a receipt — reject it rather than trust its presence.
  let payload: unknown;
  try {
    let text = header.trim();
    if (!text.startsWith("{")) text = atob(text);
    payload = JSON.parse(text);
  } catch {
    return { ok: false, reason: "x-payment header is not a decodable x402 payload" };
  }
  if (!payload || typeof payload !== "object") {
    return { ok: false, reason: "x-payment payload is not an object" };
  }

  // Real settlement verification requires a facilitator. None provisioned ⇒ we cannot confirm
  // the receipt settled ⇒ fail closed. NEVER grant on structure alone.
  const facilitator = (env.X402_FACILITATOR_URL || "").replace(/\/$/, "");
  if (!facilitator) {
    return {
      ok: false,
      reason:
        "x402 verification is not provisioned (no X402_FACILITATOR_URL). The receipt cannot be " +
        "confirmed settled, so the paid resource is not granted. This is fail-closed by design.",
    };
  }

  const paymentRequirements = {
    scheme: "exact",
    network: env.X402_NETWORK || "base",
    asset: env.X402_ASSET || null,
    payTo: env.X402_PAY_TO || null,
    maxAmountRequired: env.X402_AMOUNT || null,
    resource: resourceUrl,
    mimeType: "application/json",
  };

  try {
    const vr = await fetch(`${facilitator}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ x402Version: 1, paymentPayload: payload, paymentRequirements }),
    });
    if (!vr.ok) return { ok: false, reason: `facilitator /verify HTTP ${vr.status}` };
    const out = (await vr.json()) as { isValid?: boolean; invalidReason?: string };
    if (out && out.isValid === true) return { ok: true, reason: "facilitator verified receipt" };
    return { ok: false, reason: `facilitator rejected receipt: ${out?.invalidReason || "not valid"}` };
  } catch (e) {
    return { ok: false, reason: `facilitator /verify error: ${(e as Error).message}` };
  }
}
