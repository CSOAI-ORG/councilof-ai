// functions/api/_x402_negotiate.ts — decide which x402 dialect to speak to the FACILITATOR.
//
// WHY THIS EXISTS (found by probing live facilitators, 2026-09-03):
//   https://facilitator.payai.network/supported → x402Version 1 ONLY, network slug "base"
//   https://x402.org/facilitator/supported      → x402Version 2, eip155:84532 (Base SEPOLIA only)
//   https://api.cdp.coinbase.com/platform/v2/x402 → 401 without a per-request CDP JWT
//
// The bug this closes: verifyX402Payment used to pick the dialect from the CLIENT payload —
//   const v = payload.x402Version === 2 ? 2 : 1;
// — and never asked the facilitator what it speaks. Our own /.well-known/x402.json advertises
// x402Version 2 with network "eip155:8453", so a stock client pays in v2. Sent to PayAI (the only
// keyless mainnet facilitator, v1-only), that yields exactly the response a probe returns:
//   {"isValid":false,"invalidReason":"invalid_payment_requirements"}
// i.e. every real payment would have failed AFTER the buyer signed, with the failure looking like
// the buyer's fault. Mirroring the client is wrong; the facilitator is the party we must satisfy.
//
// SAFETY: rewriting the wrapper's `x402Version`/`network` fields cannot invalidate the buyer's
// signature. The EIP-3009 authorization is signed under the TOKEN's EIP-712 domain over
// (from, to, value, validAfter, validBefore, nonce) — the x402 envelope around it is transport,
// not signed material. `payTo` (the `to`) is inside the signed tuple and is never touched here.
//
// FAIL-SOFT: if /supported is missing, slow, or unparseable we fall back to the client's dialect,
// which is exactly the previous behaviour. A negotiation failure must never turn a good payment
// into a 500.

import { toCaip2Network, toLegacyNetwork } from "./_x402_config";

export type SupportedKind = { x402Version?: number; scheme?: string; network?: string };

/** One facilitator's advertised capabilities, cached briefly so a burst of paid calls asks once. */
type CacheEntry = { kinds: SupportedKind[]; at: number };
const SUPPORTED_TTL_MS = 5 * 60_000;
const supportedCache = new Map<string, CacheEntry>();

/** Exposed for tests — a stale cache must never make a test pass for the wrong reason. */
export function _clearSupportedCache(): void {
  supportedCache.clear();
}

/**
 * Two facilitators may name the same chain "base" or "eip155:8453". Compare on both spellings so
 * a v1-slug facilitator is not mistaken for one that cannot serve our network at all.
 */
export function sameNetwork(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  return toCaip2Network(a) === toCaip2Network(b) || toLegacyNetwork(a) === toLegacyNetwork(b);
}

/**
 * dialectCandidates — every x402 version the facilitator advertises for `exact` on OUR network,
 * in the order we should ATTEMPT them. `/verify` moves no money, so attempting is free and a
 * rejected shape costs nothing but a round trip.
 *
 * ORDER IS EVIDENCE, NOT PREFERENCE FOR THE NEWER NUMBER (probed 2026-09-04). PayAI now
 * advertises BOTH dialects for Base:
 *   {"x402Version":1,"scheme":"exact","network":"base"}
 *   {"x402Version":2,"scheme":"exact","network":"eip155:8453"}
 * The previous rule here — "the highest version the facilitator advertises" — therefore started
 * selecting v2 the moment PayAI added that second kind, and v2 against PayAI returns:
 *   HTTP 400 {"invalidReason":"invalid_payload",
 *             "invalidMessage":"accepted: Invalid input: expected object, received undefined"}
 * i.e. its v2 wants the requirements under a field named `accepted`, and every shape probed for
 * that field was also rejected (`invalid_payment_requirements`). The identical authorization sent
 * in v1 reaches the real balance check (`invalid_exact_evm_insufficient_balance`, payer recovered)
 * — so v1 is the only dialect PROVEN to settle on Base mainnet, and it goes first. v2 is still
 * attempted after it, so a v2-only facilitator keeps working and this cannot become a new
 * assumption of the same kind.
 *
 * Empty means the facilitator answered but serves nothing usable for this chain: a
 * misconfiguration worth reporting honestly rather than papering over with a guess.
 */
export function dialectCandidates(kinds: SupportedKind[], network: string): (1 | 2)[] {
  const usable = kinds.filter(
    (k) => (k.scheme || "exact") === "exact" && sameNetwork(k.network || "", network),
  );
  if (usable.length === 0) return [];
  const out: (1 | 2)[] = [];
  // A kind with no x402Version is v1 — that is what the field's absence meant before v2 existed.
  if (usable.some((k) => (k.x402Version ?? 1) === 1)) out.push(1);
  if (usable.some((k) => k.x402Version === 2)) out.push(2);
  return out;
}

/**
 * chooseDialect — the dialect to try FIRST for `exact` on OUR network (see dialectCandidates for
 * why "first" is not "highest"). Null when the facilitator serves nothing usable for this chain.
 */
export function chooseDialect(kinds: SupportedKind[], network: string): 1 | 2 | null {
  const c = dialectCandidates(kinds, network);
  return c.length > 0 ? c[0] : null;
}

/**
 * facilitatorDialect — ask /supported, cached. `null` means "could not determine" (network error,
 * non-JSON, no /supported endpoint) and the caller should keep its previous behaviour.
 */
export async function facilitatorDialect(
  facilitator: string,
  network: string,
  headers: Record<string, string> = {},
  fetchImpl: typeof fetch = fetch,
): Promise<{ version: 1 | 2 | null; candidates: (1 | 2)[]; reason: string }> {
  const decide = (kinds: SupportedKind[], why: string) => {
    const candidates = dialectCandidates(kinds, network);
    return {
      version: candidates.length > 0 ? candidates[0] : null,
      candidates,
      reason: candidates.length > 0 ? why : `${why}: no exact scheme for this network`,
    };
  };
  const cached = supportedCache.get(facilitator);
  if (cached && Date.now() - cached.at < SUPPORTED_TTL_MS) return decide(cached.kinds, "cached /supported");
  try {
    const r = await fetchImpl(`${facilitator}/supported`, { method: "GET", headers });
    if (!r.ok) return { version: null, candidates: [], reason: `/supported HTTP ${r.status}` };
    const j = (await r.json()) as { kinds?: SupportedKind[] };
    const kinds = Array.isArray(j?.kinds) ? j.kinds : [];
    if (kinds.length === 0) return { version: null, candidates: [], reason: "/supported returned no kinds" };
    supportedCache.set(facilitator, { kinds, at: Date.now() });
    return decide(kinds, "negotiated from /supported");
  } catch (e) {
    return { version: null, candidates: [], reason: `/supported unreachable: ${(e as Error).message}` };
  }
}

/**
 * toDialectPayload — restate the buyer's envelope in the dialect the facilitator speaks. Only the
 * transport fields (`x402Version`, `network`) are rewritten; `payload` (signature + authorization)
 * is passed through byte-identical, because that is the part the buyer actually signed.
 */
export function toDialectPayload(
  payload: Record<string, unknown>,
  version: 1 | 2,
  v2ctx?: { accepted?: Record<string, unknown>; resource?: { url: string; description?: string; mimeType?: string } },
): Record<string, unknown> {
  const net = typeof payload.network === "string" ? payload.network : "";
  if (version === 1) {
    return { ...payload, x402Version: 1, ...(net ? { network: toLegacyNetwork(net) } : {}) };
  }
  // V2 IS A DIFFERENT ENVELOPE, NOT A RELABELLED V1 — and getting that wrong is what made v2
  // look broken. Per specs/x402-specification-v2.md §7.1, the v2 paymentPayload carries
  // `resource` and `accepted` ALONGSIDE `payload`; the top-level `paymentRequirements` is a
  // separate field. Restating a v1 envelope with x402Version:2 omits both, and PayAI answers
  // exactly that:
  //     HTTP 400 {"invalidReason":"invalid_payload",
  //               "invalidMessage":"accepted: Invalid input: expected object, received undefined"}
  // which reads as "the facilitator's v2 is unusable" and is really "we sent it a v1 body".
  // Probed 2026-09-04 with the shape below: HTTP 200,
  // invalid_exact_evm_insufficient_balance with the payer recovered — the same terminal state
  // v1 reaches, i.e. correct in every respect but funding.
  //
  // Why this matters beyond correctness: facilitator extensions ride on v2. PayAI advertises
  // extensions ["bazaar", ...], and Bazaar is the discovery layer agents search to find paid
  // resources at all. A rail stuck on v1 settles fine and stays invisible.
  //
  // `payload` — the buyer's signature and authorization — is passed through untouched. Only the
  // envelope around it is restated, and the recipient is inside the signed tuple regardless.
  const out: Record<string, unknown> = {
    x402Version: 2,
    ...(v2ctx?.resource ? { resource: v2ctx.resource } : {}),
    ...(v2ctx?.accepted ? { accepted: v2ctx.accepted } : {}),
    payload: payload.payload,
  };
  if (net) out.network = toCaip2Network(net);
  if (typeof payload.scheme === "string") out.scheme = payload.scheme;
  return out;
}
