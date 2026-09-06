/**
 * Fixed vectors for the signed-offer builder. The key below is a TEST key (seed 01..20) and is
 * published here on purpose: a reader must be able to recompute every byte in this file. The
 * production key is a Pages secret and appears nowhere in this repository.
 *
 * Every golden string was produced by signing with that seed, so a change to canonicalisation,
 * to the header, or to the field set breaks these tests loudly rather than silently re-signing
 * different bytes under the same name.
 */
import { describe, it, expect } from "vitest";
import { jcs, b64urlDecode, parseJws, signJws } from "./_x402_jws";
import {
  offerPayload,
  signOffer,
  verifyOffer,
  offersExtension,
  attachOffers,
  OFFERS_JWS_SCHEMA,
  OFFER_RECEIPT_EXTENSION,
  OFFER_RECEIPT_SPEC_SHA,
} from "./_x402_offer";

const TEST_PKCS8 = "MC4CAQAwBQYDK2VwBCIEIAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8g";
/** The raw 32-byte public key for TEST_PKCS8, in the same base64url form did.json uses for `x`. */
const TEST_PUB_X = "ebVWLo_mVPlAeLES6KmLp5AfhTrmlb7X4OORC60ElmQ";
const TEST_PUB = b64urlDecode(TEST_PUB_X);
const KID = "did:web:csoai.org#board-attestation-1";
const RESOURCE = "https://councilof.ai/api/free-door";

const GOLDEN_OFFER_JWS =
  "eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDp3ZWI6Y3NvYWkub3JnI2JvYXJkLWF0dGVzdGF0aW9uLTEifQ." +
  "eyJhbW91bnQiOiIwIiwiYXNzZXQiOiIweDgzMzU4OWZDRDZlRGI2RTA4ZjRjN0MzMkQ0ZjcxYjU0YmRBMDI5MTMiLCJuZXR3b3JrIjoiZWlwMTU1Ojg0NTMiLCJwYXlUbyI6IjB4MjEyNjg2NDA0QTdEMUUxZkQ4OEYzNWVENjIwMGMzYUY3QTc4YWUzMSIsInJlc291cmNlVXJsIjoiaHR0cHM6Ly9jb3VuY2lsb2YuYWkvYXBpL2ZyZWUtZG9vciIsInNjaGVtZSI6ImV4YWN0IiwidmFsaWRVbnRpbCI6MTc2NzIyNTYwMCwidmVyc2lvbiI6MX0." +
  "LQYY_V1sZ-wiTslOx16RSIdL_vUuRizGxbnrhJyKYLL2cOlFzEP91La4nBdtaEnlSX479Dgtni3J8DMHrjWsCA";

const FREE_ACCEPT = {
  scheme: "exact",
  network: "base",
  asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  payTo: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
  amount: "0",
  maxAmountRequired: "0",
};

const resolveTestKey = async () => TEST_PUB;
const resolveNothing = async () => null;

describe("JCS canonicalisation (spec §10)", () => {
  it("sorts keys and emits compact separators", () => {
    expect(jcs({ b: 1, a: "x" })).toBe('{"a":"x","b":1}');
  });
  it("is stable under key insertion order — the property the signature depends on", () => {
    expect(jcs({ version: 1, amount: "10" })).toBe(jcs({ amount: "10", version: 1 }));
  });
  it("drops undefined rather than emitting null, so an absent optional is absent", () => {
    expect(jcs({ a: 1, b: undefined })).toBe('{"a":1}');
  });
});

describe("offerPayload (spec §4.2)", () => {
  it("carries exactly the eight spec fields and nothing else", () => {
    const p = offerPayload(RESOURCE, FREE_ACCEPT, 1767224700)!;
    expect(Object.keys(p).sort()).toEqual(
      ["amount", "asset", "network", "payTo", "resourceUrl", "scheme", "validUntil", "version"],
    );
  });
  it("converts a v1 network slug to CAIP-2 (§4.2 note — MUST)", () => {
    expect(offerPayload(RESOURCE, FREE_ACCEPT, 0)!.network).toBe("eip155:8453");
    expect(offerPayload(RESOURCE, { ...FREE_ACCEPT, network: "base-sepolia" }, 0)!.network).toBe("eip155:84532");
  });
  it("copies maxAmountRequired to amount for a v1 accepts entry (§4.2 note)", () => {
    const { amount, ...noAmount } = FREE_ACCEPT;
    expect(offerPayload(RESOURCE, noAmount, 0)!.amount).toBe("0");
  });
  it("strips the query string — an offer commits to the resource, not to one call's arguments", () => {
    expect(offerPayload(`${RESOURCE}?subject=csoai`, FREE_ACCEPT, 0)!.resourceUrl).toBe(RESOURCE);
  });
  it("refuses to commit when payTo is null — no address means no terms to sign", () => {
    expect(offerPayload(RESOURCE, { ...FREE_ACCEPT, payTo: null }, 0)).toBeNull();
  });
  it("refuses a non-integer amount rather than signing a price nobody can pay", () => {
    expect(offerPayload(RESOURCE, { ...FREE_ACCEPT, amount: "0.02", maxAmountRequired: "0.02" }, 0)).toBeNull();
  });
});

describe("signOffer — the golden vector", () => {
  it("reproduces the byte-for-byte JWS for the zero-value free door", async () => {
    const p = offerPayload(RESOURCE, FREE_ACCEPT, 1767224700)!;
    expect(p.validUntil).toBe(1767225600);
    const offer = await signOffer(p, TEST_PKCS8, 0, KID);
    expect(offer).toEqual({ format: "jws", acceptIndex: 0, signature: GOLDEN_OFFER_JWS });
  });

  it("omits `payload` beside the JWS (§3.1.1 — MUST for format jws)", async () => {
    const offer = await signOffer(offerPayload(RESOURCE, FREE_ACCEPT, 0)!, TEST_PKCS8, 0, KID);
    expect(Object.keys(offer).sort()).toEqual(["acceptIndex", "format", "signature"]);
    expect((offer as Record<string, unknown>).payload).toBeUndefined();
  });

  it("puts alg and kid in the header (§3.3) and nothing else", async () => {
    const { header } = parseJws(GOLDEN_OFFER_JWS);
    expect(header).toEqual({ alg: "EdDSA", kid: KID });
  });

  it("never signs a payload containing the signature (§10 — no circularity)", () => {
    const { payload } = parseJws(GOLDEN_OFFER_JWS);
    expect(payload.signature).toBeUndefined();
    expect(payload.acceptIndex).toBeUndefined(); // §4.1.1: unsigned convenience field only
  });
});

describe("verifyOffer (spec §4.5, JWS branch)", () => {
  it("accepts the golden offer under the published key", async () => {
    const v = await verifyOffer(GOLDEN_OFFER_JWS, resolveTestKey, 1767224701);
    expect(v.ok).toBe(true);
    expect(v.kid).toBe(KID);
    expect(v.payload!.amount).toBe("0");
    expect(Object.values(v.checks).every((c) => c === true)).toBe(true);
  });

  it("ZERO-VALUE IS VALID — a free door's offer is a real signed commitment to a price of zero", async () => {
    const v = await verifyOffer(GOLDEN_OFFER_JWS, resolveTestKey, 1767224701);
    expect(v.ok).toBe(true);
    expect(v.payload!.amount).toBe("0");
  });

  it("TAMPER: one flipped character in the payload fails the signature, not the parse", async () => {
    const parts = GOLDEN_OFFER_JWS.split(".");
    // Re-encode the payload with amount "1" instead of "0" and keep the original signature.
    const p = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1]!)));
    p.amount = "1";
    const forged = `${parts[0]}.${await (async () => {
      const { b64url } = await import("./_x402_jws");
      return b64url(jcs(p));
    })()}.${parts[2]}`;
    const v = await verifyOffer(forged, resolveTestKey, 1767224701);
    expect(v.ok).toBe(false);
    expect(v.checks.parsed).toBe(true);
    expect(v.checks.signature).toBe(false);
    expect(v.reason).toMatch(/signature does not verify/);
  });

  it("TAMPER: a re-signed offer under an attacker key fails on authorization, not on the signature", async () => {
    // A valid key pair, a valid signature, a resourceUrl the key has no relationship to (§4.5.1).
    const attacker = "MC4CAQAwBQYDK2VwBCIEIP8AAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0e";
    const forged = await signJws(offerPayload(RESOURCE, FREE_ACCEPT, 0)!, attacker, "did:web:evil.example#k1");
    const v = await verifyOffer(forged, resolveNothing, 1767224701);
    expect(v.ok).toBe(false);
    expect(v.checks.kid_resolved).toBe(false);
    expect(v.reason).toMatch(/did not resolve to a key authorised/);
  });

  it("rejects a non-EdDSA alg rather than trying to interpret it", async () => {
    const v = await verifyOffer(
      `${await (async () => {
        const { b64url } = await import("./_x402_jws");
        return b64url(jcs({ alg: "none", kid: KID }));
      })()}.${GOLDEN_OFFER_JWS.split(".")[1]}.${GOLDEN_OFFER_JWS.split(".")[2]}`,
      resolveTestKey,
    );
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/alg none is not EdDSA/);
  });

  it("rejects an expired offer (§4.6) and says when it expired", async () => {
    const v = await verifyOffer(GOLDEN_OFFER_JWS, resolveTestKey, 1767225601);
    expect(v.ok).toBe(false);
    expect(v.checks.signature).toBe(true);
    expect(v.reason).toMatch(/offer expired at 1767225600/);
  });

  it("treats validUntil 0 as absence (§4.3 — MUST)", async () => {
    const jws = await signJws({ ...offerPayload(RESOURCE, FREE_ACCEPT, 0)!, validUntil: 0 }, TEST_PKCS8, KID);
    const v = await verifyOffer(jws, resolveTestKey, 9_999_999_999);
    expect(v.ok).toBe(true);
  });

  it("gives a parse reason a verifier can echo, for a string that is not a JWS at all", async () => {
    const v = await verifyOffer("not-a-jws", resolveTestKey);
    expect(v.ok).toBe(false);
    expect(v.reason).toBe("jws is not three dot-separated parts");
  });
});

describe("offersExtension — the wire block (spec §6.3)", () => {
  it("matches the schema the spec transmits, field for field", () => {
    const block = offersExtension([{ format: "jws", acceptIndex: 0, signature: GOLDEN_OFFER_JWS }]);
    expect(block.schema).toEqual(OFFERS_JWS_SCHEMA);
    expect(block.schema.required).toEqual(["offers"]);
    expect(block.schema.properties.offers.items.required).toEqual(["format", "signature"]);
    expect(block.info.offers[0]!.format).toBe("jws");
  });
});

describe("attachOffers — the one call every door makes", () => {
  const pr = {
    x402Version: 2,
    resource: { url: RESOURCE, description: "d", mimeType: "application/json" },
    accepts: [FREE_ACCEPT],
    extensions: { bazaar: { info: {}, schema: {} } },
  };

  it("adds the offer-receipt extension beside bazaar without disturbing it", async () => {
    const out = await attachOffers(pr, TEST_PKCS8, 1767224700, KID);
    const ext = out.extensions as Record<string, { info: { offers: unknown[] } }>;
    expect(ext.bazaar).toEqual({ info: {}, schema: {} });
    expect(ext[OFFER_RECEIPT_EXTENSION]!.info.offers).toHaveLength(1);
    expect((ext[OFFER_RECEIPT_EXTENSION]!.info.offers[0] as { signature: string }).signature).toBe(GOLDEN_OFFER_JWS);
  });

  it("does not mutate the object it was given", async () => {
    const before = JSON.stringify(pr);
    await attachOffers(pr, TEST_PKCS8, 1767224700, KID);
    expect(JSON.stringify(pr)).toBe(before);
  });

  it("says so on the sidecar, and emits NO offers block, when the edge holds no key", async () => {
    const out = await attachOffers(pr, undefined, 1767224700, KID);
    expect((out.extensions as Record<string, unknown>)[OFFER_RECEIPT_EXTENSION]).toBeUndefined();
    const side = (out.csoai as { offer_receipt: { signed: boolean; reason: string; spec_commit: string } }).offer_receipt;
    expect(side.signed).toBe(false);
    expect(side.reason).toMatch(/BOARD_SIGN_KEY_PKCS8_B64 absent/);
    expect(side.spec_commit).toBe(OFFER_RECEIPT_SPEC_SHA);
  });

  it("emits no offers block when payTo is unprovisioned — never an empty offers array", async () => {
    const out = await attachOffers(
      { ...pr, accepts: [{ ...FREE_ACCEPT, payTo: null }] },
      TEST_PKCS8,
      1767224700,
      KID,
    );
    expect((out.extensions as Record<string, unknown>)[OFFER_RECEIPT_EXTENSION]).toBeUndefined();
    expect((out.csoai as { offer_receipt: { signed: boolean } }).offer_receipt.signed).toBe(false);
  });

  it("keeps acceptIndex aligned with accepts[] while remaining unsigned (§4.1.1)", async () => {
    const two = { ...pr, accepts: [FREE_ACCEPT, { ...FREE_ACCEPT, amount: "20000", maxAmountRequired: "20000" }] };
    const out = await attachOffers(two, TEST_PKCS8, 1767224700, KID);
    const offers = (out.extensions as Record<string, { info: { offers: { acceptIndex: number }[] } }>)[OFFER_RECEIPT_EXTENSION]!.info.offers;
    expect(offers.map((o) => o.acceptIndex)).toEqual([0, 1]);
    const second = await verifyOffer(
      (offers[1] as unknown as { signature: string }).signature,
      resolveTestKey,
      1767224701,
    );
    expect(second.payload!.amount).toBe("20000");
  });
});
