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
 * chooseDialect — the highest x402 version the facilitator advertises for `exact` on OUR network.
 * Returns null when the facilitator answers but lists nothing usable for this chain: that is a
 * misconfiguration worth reporting honestly rather than papering over with a guess.
 */
export function chooseDialect(kinds: SupportedKind[], network: string): 1 | 2 | null {
  const usable = kinds.filter(
    (k) => (k.scheme || "exact") === "exact" && sameNetwork(k.network || "", network),
  );
  if (usable.length === 0) return null;
  return usable.some((k) => k.x402Version === 2) ? 2 : 1;
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
): Promise<{ version: 1 | 2 | null; reason: string }> {
  const cached = supportedCache.get(facilitator);
  const fresh = cached && Date.now() - cached.at < SUPPORTED_TTL_MS;
  if (fresh) {
    const v = chooseDialect(cached.kinds, network);
    return { version: v, reason: v ? "cached /supported" : "cached /supported lists no exact scheme for this network" };
  }
  try {
    const r = await fetchImpl(`${facilitator}/supported`, { method: "GET", headers });
    if (!r.ok) return { version: null, reason: `/supported HTTP ${r.status}` };
    const j = (await r.json()) as { kinds?: SupportedKind[] };
    const kinds = Array.isArray(j?.kinds) ? j.kinds : [];
    if (kinds.length === 0) return { version: null, reason: "/supported returned no kinds" };
    supportedCache.set(facilitator, { kinds, at: Date.now() });
    const v = chooseDialect(kinds, network);
    return {
      version: v,
      reason: v ? "negotiated from /supported" : "/supported lists no exact scheme for this network",
    };
  } catch (e) {
    return { version: null, reason: `/supported unreachable: ${(e as Error).message}` };
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
): Record<string, unknown> {
  const net = typeof payload.network === "string" ? payload.network : "";
  return {
    ...payload,
    x402Version: version,
    ...(net ? { network: version === 2 ? toCaip2Network(net) : toLegacyNetwork(net) } : {}),
  };
}
