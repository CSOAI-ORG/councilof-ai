/**
 * Fixed vectors for the signed-receipt builder, the CSOAI storage envelope, and the KV reader.
 * Same published TEST key as _x402_offer.test.ts (seed 01..20) — production signs with a Pages
 * secret that appears nowhere in this repository.
 */
import { describe, it, expect } from "vitest";
import { b64url, b64urlDecode, jcs, parseJws, signJws } from "./_x402_jws";
import {
  receiptPayload,
  signReceipt,
  verifyReceipt,
  receiptExtension,
  buildReceiptRecord,
  storeReceipt,
  readReceiptsByPayer,
  readRecentReceipts,
  receiptTxKey,
  receiptPayerKey,
  RECEIPT_JWS_SCHEMA,
  RECEIPT_RECORD_SCHEMA,
} from "./_x402_receipt";
import { OFFER_RECEIPT_EXTENSION } from "./_x402_offer";

const TEST_PKCS8 = "MC4CAQAwBQYDK2VwBCIEIAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8g";
const TEST_PUB = b64urlDecode("ebVWLo_mVPlAeLES6KmLp5AfhTrmlb7X4OORC60ElmQ");
const KID = "did:web:csoai.org#board-attestation-1";
const RESOURCE = "https://councilof.ai/api/request-attestation";
const PAYER = "0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7";
/** The estate's first real settlement — docs/product/SETTLED-DOORS-2026-09-06.md, tx on Base mainnet. */
const TX = "0xac49241b1e65ab5942e5a84ff48daf52b8de2dd99d3ac23103d18578821b1c91";
const ISSUED = 1757145575;

const GOLDEN_RECEIPT_JWS =
  "eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDp3ZWI6Y3NvYWkub3JnI2JvYXJkLWF0dGVzdGF0aW9uLTEifQ." +
  "eyJpc3N1ZWRBdCI6MTc1NzE0NTU3NSwibmV0d29yayI6ImVpcDE1NTo4NDUzIiwicGF5ZXIiOiIweDRkQjdBQUZiZTc5N2EzOUNkNkNjNEU3YWE2NGQ5NzBGN0Y2RTAyQjciLCJyZXNvdXJjZVVybCI6Imh0dHBzOi8vY291bmNpbG9mLmFpL2FwaS9yZXF1ZXN0LWF0dGVzdGF0aW9uIiwidHJhbnNhY3Rpb24iOiIweGFjNDkyNDFiMWU2NWFiNTk0MmU1YTg0ZmY0OGRhZjUyYjhkZTJkZDk5ZDNhYzIzMTAzZDE4NTc4ODIxYjFjOTEiLCJ2ZXJzaW9uIjoxfQ." +
  "zZCv-ELt4I6qFnQ8CIKop_Bnn9zUHUN54tFiFfyATtsLGclNN-znIlIIp30oQBcVPtw13eFHrutJYPpYkt58Dw";

const resolveTestKey = async () => TEST_PUB;

/** An in-memory stand-in with KV's list/get/put surface. Not a mock of a shape KV never returns. */
function fakeKv() {
  const m = new Map<string, string>();
  return {
    map: m,
    get: async (k: string) => (m.has(k) ? m.get(k)! : null),
    put: async (k: string, v: string) => void m.set(k, v),
    list: async ({ prefix, limit = 1000 }: { prefix: string; cursor?: string; limit?: number }) => {
      const keys = [...m.keys()].filter((k) => k.startsWith(prefix)).sort().slice(0, limit).map((name) => ({ name }));
      return { keys, list_complete: true };
    },
  };
}

const record = (over: Partial<Parameters<typeof buildReceiptRecord>[0]> = {}) =>
  buildReceiptRecord({
    receipt: { format: "jws" as const, signature: GOLDEN_RECEIPT_JWS },
    payload: receiptPayload({ network: "base", resourceUrl: RESOURCE, payer: PAYER, issuedAt: ISSUED, transaction: TX }),
    resource: `${RESOURCE}?subject=csoai&axis=honesty`,
    amount_atomic: "20000",
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    self: true,
    settlement_recorded: true,
    ...over,
  });

describe("receiptPayload (spec §5.2)", () => {
  it("carries the five required fields plus transaction, and nothing else", () => {
    const p = receiptPayload({ network: "base", resourceUrl: RESOURCE, payer: PAYER, issuedAt: ISSUED, transaction: TX });
    expect(Object.keys(p).sort()).toEqual(["issuedAt", "network", "payer", "resourceUrl", "transaction", "version"]);
  });
  it("omits transaction entirely when there is none — never an empty string in a JWS payload", () => {
    const p = receiptPayload({ network: "base", resourceUrl: RESOURCE, payer: PAYER, issuedAt: ISSUED, transaction: null });
    expect("transaction" in p).toBe(false);
    expect(Object.keys(p).sort()).toEqual(["issuedAt", "network", "payer", "resourceUrl", "version"]);
  });
  it("converts the v1 slug to CAIP-2 (§5.2 note — MUST)", () => {
    expect(receiptPayload({ network: "base", resourceUrl: RESOURCE, payer: PAYER, issuedAt: 0 }).network).toBe("eip155:8453");
  });
  it("strips the query string from resourceUrl", () => {
    expect(receiptPayload({ network: "base", resourceUrl: `${RESOURCE}?a=1`, payer: PAYER, issuedAt: 0 }).resourceUrl).toBe(RESOURCE);
  });
});

describe("signReceipt — the golden vector", () => {
  it("reproduces the byte-for-byte JWS for the estate's first settled door", async () => {
    const p = receiptPayload({ network: "base", resourceUrl: RESOURCE, payer: PAYER, issuedAt: ISSUED, transaction: TX });
    expect(await signReceipt(p, TEST_PKCS8, KID)).toEqual({ format: "jws", signature: GOLDEN_RECEIPT_JWS });
  });
  it("omits `payload` beside the JWS (§3.1.1) and carries no acceptIndex (receipts have none)", async () => {
    const r = await signReceipt(receiptPayload({ network: "base", resourceUrl: RESOURCE, payer: PAYER, issuedAt: ISSUED }), TEST_PKCS8, KID);
    expect(Object.keys(r).sort()).toEqual(["format", "signature"]);
  });
  it("header is exactly alg + kid (§3.3)", () => {
    expect(parseJws(GOLDEN_RECEIPT_JWS).header).toEqual({ alg: "EdDSA", kid: KID });
  });
});

describe("verifyReceipt (spec §5.5, JWS branch)", () => {
  it("accepts the golden receipt under the published key", async () => {
    const v = await verifyReceipt(GOLDEN_RECEIPT_JWS, resolveTestKey, ISSUED + 10);
    expect(v.ok).toBe(true);
    expect(v.payload!.transaction).toBe(TX);
    expect(Object.values(v.checks).every((c) => c === true)).toBe(true);
  });

  it("accepts a receipt for a ZERO-VALUE free-door delivery — the spec receipt carries no amount", async () => {
    const jws = await signJws(
      receiptPayload({ network: "base", resourceUrl: "https://councilof.ai/api/free-door", payer: PAYER, issuedAt: ISSUED }),
      TEST_PKCS8,
      KID,
    );
    const v = await verifyReceipt(jws, resolveTestKey, ISSUED + 10);
    expect(v.ok).toBe(true);
    expect(v.payload!.transaction).toBeUndefined();
  });

  it("TAMPER: swapping the payer keeps the parse and breaks the signature", async () => {
    const parts = GOLDEN_RECEIPT_JWS.split(".");
    const p = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1]!)));
    p.payer = "0x0000000000000000000000000000000000000001";
    const v = await verifyReceipt(`${parts[0]}.${b64url(jcs(p))}.${parts[2]}`, resolveTestKey, ISSUED + 10);
    expect(v.ok).toBe(false);
    expect(v.checks.parsed).toBe(true);
    expect(v.checks.signature).toBe(false);
  });

  it("TAMPER: a receipt validly signed by an unauthorised key fails on §4.5.1, not on crypto", async () => {
    const attacker = "MC4CAQAwBQYDK2VwBCIEIP8AAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0e";
    const jws = await signJws(receiptPayload({ network: "base", resourceUrl: RESOURCE, payer: PAYER, issuedAt: ISSUED }), attacker, "did:web:evil.example#k1");
    const v = await verifyReceipt(jws, async () => null, ISSUED + 10);
    expect(v.ok).toBe(false);
    expect(v.checks.kid_resolved).toBe(false);
  });

  it("refuses a receipt issued in the future beyond verifier skew (§5.5 step 7)", async () => {
    const v = await verifyReceipt(GOLDEN_RECEIPT_JWS, resolveTestKey, ISSUED - 3600);
    expect(v.ok).toBe(false);
    expect(v.reason).toMatch(/is in the future/);
  });

  it("accepts an OLD receipt — age is the reader's policy, never a validity fault", async () => {
    const v = await verifyReceipt(GOLDEN_RECEIPT_JWS, resolveTestKey, ISSUED + 10 * 365 * 86400);
    expect(v.ok).toBe(true);
  });
});

describe("receiptExtension — the wire block (spec §6.7)", () => {
  it("matches the schema the spec transmits", () => {
    const ext = receiptExtension({ format: "jws", signature: GOLDEN_RECEIPT_JWS });
    expect(ext[OFFER_RECEIPT_EXTENSION]!.schema).toEqual(RECEIPT_JWS_SCHEMA);
    expect(ext[OFFER_RECEIPT_EXTENSION]!.schema.required).toEqual(["receipt"]);
    expect(ext[OFFER_RECEIPT_EXTENSION]!.info.receipt.format).toBe("jws");
  });
});

describe("the CSOAI record envelope — ours, versioned, never the spec artefact", () => {
  it("is schema-tagged so a reader can tell it from the spec receipt it wraps", () => {
    expect(record().schema).toBe(RECEIPT_RECORD_SCHEMA);
    expect(RECEIPT_RECORD_SCHEMA).toBe("csoai.x402.receipt-record/0.1");
  });
  it("keeps the full requested URL beside the spec payload's bare one", () => {
    const r = record();
    expect(r.resource).toBe(`${RESOURCE}?subject=csoai&axis=honesty`);
    expect(r.payload.resourceUrl).toBe(RESOURCE);
  });
  it("carries what the spec deliberately omits: amount, asset, self, zero_value", () => {
    const r = record();
    expect(r.amount_atomic).toBe("20000");
    expect(r.zero_value).toBe(false);
    expect(r.self).toBe(true);
  });
  it("calls a zero amount zero_value — the test that holds for an ephemeral wallet no list can name", () => {
    expect(record({ amount_atomic: "0" }).zero_value).toBe(true);
    expect(record({ amount_atomic: null }).zero_value).toBe(true);
  });
  it("points at the settlement record it belongs beside", () => {
    expect(record().settled_tx_key).toBe(`settled:tx:${TX}`);
  });
  it("never places a signature over its own envelope — only the wrapped receipt is signed", () => {
    expect(Object.keys(record())).not.toContain("sig_ed25519");
  });
});

describe("storage and the reader", () => {
  it("writes two keys per receipt and is idempotent on replay", async () => {
    const kv = fakeKv();
    expect(await storeReceipt(kv, record())).toEqual({ stored: true, reason: "written" });
    expect(kv.map.size).toBe(2);
    await storeReceipt(kv, record());
    expect(kv.map.size).toBe(2);
    expect([...kv.map.keys()].sort()).toEqual([receiptPayerKey(PAYER, ISSUED, TX), receiptTxKey(TX, ISSUED)].sort());
  });

  it("reports the gap rather than throwing when no store is bound", async () => {
    expect(await storeReceipt(undefined, record())).toEqual({ stored: false, reason: "no REVENUE_KV bound" });
  });

  it("payer lookup is case-insensitive — a wallet typed in lower case is the same wallet", async () => {
    const kv = fakeKv();
    await storeReceipt(kv, record());
    expect((await readReceiptsByPayer(kv, PAYER.toLowerCase()))!).toHaveLength(1);
    expect((await readReceiptsByPayer(kv, PAYER))!).toHaveLength(1);
  });

  it("returns null for an unbound store (UNRECORDED) and [] for a bound empty one (none)", async () => {
    expect(await readReceiptsByPayer(undefined, PAYER)).toBeNull();
    expect(await readReceiptsByPayer(fakeKv(), PAYER)).toEqual([]);
  });

  it("does not hand one payer another payer's receipts", async () => {
    const kv = fakeKv();
    await storeReceipt(kv, record());
    expect(await readReceiptsByPayer(kv, "0x0000000000000000000000000000000000000009")).toEqual([]);
  });

  it("orders the recent feed newest-first", async () => {
    const kv = fakeKv();
    await storeReceipt(kv, record());
    await storeReceipt(kv, record({
      payload: receiptPayload({ network: "base", resourceUrl: RESOURCE, payer: PAYER, issuedAt: ISSUED + 60, transaction: "0xbb" }),
    }));
    const rows = (await readRecentReceipts(kv))!;
    expect(rows.map((r) => r.payload.issuedAt)).toEqual([ISSUED + 60, ISSUED]);
  });

  it("skips an unreadable row rather than inventing one", async () => {
    const kv = fakeKv();
    await storeReceipt(kv, record());
    await kv.put(`${receiptTxKey("0xdeadbeef", 0)}`, "{not json");
    expect((await readRecentReceipts(kv))!).toHaveLength(1);
  });
});
