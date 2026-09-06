/**
 * _x402_offer — server-signed OFFERS per the x402 Offer & Receipt extension
 * (specs/extensions/extension-offer-and-receipt.md, x402-foundation/x402
 * @ 69652a69798f0b08f95bef33318896e36e210f7e, spec v0.6 + 23 Jul 2026 authorization text).
 *
 * An offer is the resource server's cryptographic commitment to the terms in one `accepts[]`
 * entry. Placement (§4.1): `extensions["offer-receipt"].info.offers[]`, one per accepts entry,
 * same order, plus the UNSIGNED convenience field `acceptIndex`. Format here is always `jws`
 * (§3.1.1): the payload travels inside the compact JWS and MUST NOT be repeated beside it.
 *
 * Signed payload (§4.2) — exactly these fields and nothing else, because §2 tells verifiers to
 * treat unknown fields as unsupported. Anything CSOAI wants to say about a door lives in the
 * top-level `csoai` sidecar of the 402, never inside the signed offer:
 *   version(1) resourceUrl scheme network(CAIP-2) asset payTo amount validUntil
 *
 * What is NOT here: any price in prose, any key. The signer is the Pages secret
 * BOARD_SIGN_KEY_PKCS8_B64 (kid did:web:csoai.org#board-attestation-1); absent key ⇒ no offer
 * and the 402 says so in `csoai.offer_receipt`. A fabricated offer would be worse than none.
 *
 * Pure functions; unit-tested with fixed vectors in _x402_offer.test.ts.
 */
import { BOARD_ATTESTATION_DID } from "../_lib/cardSign";
import { toCaip2Network } from "./_x402_config";
import { parseJws, signJws, verifyJwsSignature, JWS_ALG } from "./_x402_jws";

export const OFFER_RECEIPT_EXTENSION = "offer-receipt";
export const OFFER_RECEIPT_SPEC_SHA = "69652a69798f0b08f95bef33318896e36e210f7e";
export const OFFER_RECEIPT_SPEC_URL =
  `https://github.com/x402-foundation/x402/blob/${OFFER_RECEIPT_SPEC_SHA}/specs/extensions/extension-offer-and-receipt.md`;
/** The one key the edge holds; its kid is in did.json (verificationMethod[2]). */
export const X402_SIGNER_KID = BOARD_ATTESTATION_DID;
/** How long a signed offer commits to its terms. Advisory (§4.6 says the server MAY reject after it). */
export const OFFER_VALID_SECONDS = 900;

export type OfferPayload = {
  version: 1;
  resourceUrl: string;
  scheme: string;
  network: string; // CAIP-2
  asset: string;
  payTo: string;
  amount: string; // atomic units, decimal string
  validUntil: number; // unix seconds
};

export type SignedOffer = { format: "jws"; acceptIndex: number; signature: string };

/** The subset of an accepts[] entry an offer commits to. */
export type OfferTerms = {
  scheme: string;
  network: string;
  asset: string;
  payTo: string | null;
  amount?: string;
  maxAmountRequired?: string;
};

/** Build the canonical offer payload for one accepts entry. Returns null when the terms cannot be committed to (no payTo). */
export function offerPayload(resourceUrl: string, accept: OfferTerms, nowSeconds: number, validSeconds = OFFER_VALID_SECONDS): OfferPayload | null {
  const amount = accept.amount ?? accept.maxAmountRequired;
  if (!accept.payTo || typeof amount !== "string" || !/^\d+$/.test(amount)) return null;
  return {
    version: 1,
    resourceUrl: resourceUrl.split("?")[0]!,
    scheme: accept.scheme,
    network: toCaip2Network(accept.network),
    asset: accept.asset,
    payTo: accept.payTo,
    amount,
    validUntil: Math.floor(nowSeconds) + validSeconds,
  };
}

export async function signOffer(payload: OfferPayload, pkcs8b64: string, acceptIndex: number, kid = X402_SIGNER_KID): Promise<SignedOffer> {
  return { format: "jws", acceptIndex, signature: await signJws(payload, pkcs8b64, kid) };
}

/** The JSON Schema the spec transmits beside JWS offers (§6.3), verbatim in shape. */
export const OFFERS_JWS_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    offers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          format: { type: "string", const: "jws" },
          acceptIndex: { type: "integer" },
          signature: { type: "string", description: "JWS compact serialization containing the offer payload" },
        },
        required: ["format", "signature"],
      },
    },
  },
  required: ["offers"],
} as const;

/** extensions["offer-receipt"] block for a PaymentRequired (§4.1 / §6.3). */
export function offersExtension(offers: SignedOffer[]): { info: { offers: SignedOffer[] }; schema: typeof OFFERS_JWS_SCHEMA } {
  return { info: { offers }, schema: OFFERS_JWS_SCHEMA };
}

export type OfferVerdict = {
  ok: boolean;
  reason: string;
  kid: string | null;
  payload: OfferPayload | null;
  checks: Record<string, boolean | null>;
};

const REQUIRED: (keyof OfferPayload)[] = ["version", "resourceUrl", "scheme", "network", "asset", "payTo", "amount"];

/**
 * verifyOffer — §4.5 (JWS): parse, alg, version, required fields, signature under the resolved
 * key, expiry. Signer AUTHORIZATION (§4.5.1) is the caller's job — `resolveKey` receives the kid
 * and the payload's resourceUrl and returns the key only if that kid is authorised for that
 * resource; returning null here means "unresolved or unauthorised" and the verdict says so.
 */
export async function verifyOffer(
  compact: string,
  resolveKey: (kid: string, resourceUrl: string) => Promise<Uint8Array | null>,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<OfferVerdict> {
  const checks: Record<string, boolean | null> = { parsed: null, alg: null, version: null, fields: null, kid_resolved: null, signature: null, not_expired: null };
  let parsed;
  try {
    parsed = parseJws(compact);
    checks.parsed = true;
  } catch (e) {
    checks.parsed = false;
    return { ok: false, reason: (e as Error).message, kid: null, payload: null, checks };
  }
  const kid = parsed.header.kid;
  checks.alg = parsed.header.alg === JWS_ALG;
  if (!checks.alg) return { ok: false, reason: `alg ${parsed.header.alg} is not ${JWS_ALG}`, kid, payload: null, checks };
  const p = parsed.payload as Partial<OfferPayload>;
  checks.version = p.version === 1;
  if (!checks.version) return { ok: false, reason: `offer payload version ${String(p.version)} is not 1`, kid, payload: null, checks };
  const missing = REQUIRED.filter((k) => p[k] === undefined || p[k] === null || p[k] === "");
  checks.fields = missing.length === 0 && typeof p.amount === "string" && /^\d+$/.test(p.amount);
  if (!checks.fields) return { ok: false, reason: `offer payload missing/invalid: ${missing.join(",") || "amount"}`, kid, payload: null, checks };
  const key = await resolveKey(kid, String(p.resourceUrl));
  checks.kid_resolved = !!key;
  if (!key) return { ok: false, reason: `kid ${kid} did not resolve to a key authorised for ${p.resourceUrl}`, kid, payload: p as OfferPayload, checks };
  checks.signature = await verifyJwsSignature(parsed, key);
  if (!checks.signature) return { ok: false, reason: "signature does not verify under the resolved key", kid, payload: p as OfferPayload, checks };
  const vu = typeof p.validUntil === "number" ? p.validUntil : 0;
  checks.not_expired = vu === 0 || nowSeconds <= vu; // §4.3: zero means absent
  if (!checks.not_expired) return { ok: false, reason: `offer expired at ${vu} (now ${nowSeconds})`, kid, payload: p as OfferPayload, checks };
  return { ok: true, reason: "offer verifies under the resolved key and is within validUntil", kid, payload: p as OfferPayload, checks };
}

// ─── wiring helpers ─────────────────────────────────────────────────────────
// These live here (not in _x402.ts) so the module graph stays acyclic:
//   _x402.ts → _x402_receipt.ts → _x402_offer.ts → {_x402_jws, _x402_config, _lib/cardSign}
// Nothing in this file imports _x402.ts.

/** The `csoai.offer_receipt` sidecar — our own words about the extension, never inside a signed payload. */
export type OfferReceiptSidecar = {
  extension: typeof OFFER_RECEIPT_EXTENSION;
  spec: string;
  spec_commit: string;
  format: "jws";
  alg: "EdDSA";
  kid: string;
  signed: boolean;
  reason: string;
  verify: string;
};

/**
 * attachOffers — take a PaymentRequired object as `buildPaymentRequiredV2` produced it and return
 * a NEW object carrying one signed offer per accepts[] entry, plus the honest `csoai.offer_receipt`
 * sidecar. Never mutates the input; never throws — a signing failure yields `signed:false` with the
 * reason on the sidecar, because a 402 that still challenges correctly is better than a 500, and an
 * invented offer would be worse than both.
 *
 * The offers array is OMITTED entirely when nothing could be signed. An empty `offers: []` under a
 * `required: ["offers"]` schema would be a conformance lie: it says "here are the server's signed
 * terms, and there are none", which no verifier can distinguish from a server that signs nothing.
 */
export async function attachOffers(
  paymentRequired: Record<string, unknown>,
  pkcs8b64: string | undefined,
  nowSeconds: number = Math.floor(Date.now() / 1000),
  kid: string = X402_SIGNER_KID,
): Promise<Record<string, unknown>> {
  const resourceUrl =
    (paymentRequired.resource as { url?: string } | undefined)?.url ||
    ((paymentRequired.accepts as OfferTerms[] | undefined)?.[0] as { resource?: string } | undefined)?.resource ||
    "";
  const accepts = Array.isArray(paymentRequired.accepts) ? (paymentRequired.accepts as OfferTerms[]) : [];

  const sidecar = (signed: boolean, reason: string): OfferReceiptSidecar => ({
    extension: OFFER_RECEIPT_EXTENSION,
    spec: OFFER_RECEIPT_SPEC_URL,
    spec_commit: OFFER_RECEIPT_SPEC_SHA,
    format: "jws",
    alg: "EdDSA",
    kid,
    signed,
    reason,
    verify:
      "base64url-decode the JWS payload part, fetch https://csoai.org/.well-known/did.json, take the " +
      "publicKeyJwk.x of the verificationMethod whose id equals the header kid, and verify Ed25519 over " +
      "`header.payload`. POST the compact string to /api/receipts/verify to have us do it, or run " +
      "scripts/verify_receipt.py to do it without us.",
  });

  const withSidecar = (offers: SignedOffer[] | null, note: OfferReceiptSidecar) => ({
    ...paymentRequired,
    extensions: {
      ...((paymentRequired.extensions as Record<string, unknown>) || {}),
      ...(offers && offers.length ? { [OFFER_RECEIPT_EXTENSION]: offersExtension(offers) } : {}),
    },
    csoai: { ...((paymentRequired.csoai as Record<string, unknown>) || {}), offer_receipt: note },
  });

  if (!pkcs8b64) {
    return withSidecar(null, sidecar(false, "no BOARD_SIGN_KEY_PKCS8_B64 is set in the Pages environment, so this 402 carries no signed offer"));
  }
  if (!resourceUrl) {
    return withSidecar(null, sidecar(false, "the PaymentRequired carries no resource.url, and an offer must name the resource it commits to"));
  }
  try {
    const offers: SignedOffer[] = [];
    const skipped: number[] = [];
    for (let i = 0; i < accepts.length; i++) {
      const payload = offerPayload(resourceUrl, accepts[i]!, nowSeconds);
      if (!payload) {
        skipped.push(i);
        continue;
      }
      offers.push(await signOffer(payload, pkcs8b64, i, kid));
    }
    if (!offers.length) {
      return withSidecar(null, sidecar(false, `no accepts entry could be committed to (payTo or amount missing): indices ${skipped.join(",") || "none present"}`));
    }
    const reason =
      skipped.length === 0
        ? `${offers.length} of ${accepts.length} accepts entries signed`
        : `${offers.length} of ${accepts.length} accepts entries signed; ${skipped.join(",")} skipped (no payTo or non-integer amount)`;
    return withSidecar(offers, sidecar(true, reason));
  } catch (e) {
    return withSidecar(null, sidecar(false, `signing failed: ${(e as Error).message}`));
  }
}
