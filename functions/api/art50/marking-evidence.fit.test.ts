/**
 * A PAID ART50 REQUEST IS NEVER CHARGED AND HANDED NOTHING (7 Oct 2026).
 *
 * The independent check of the paid-route lane measured, through the real handler, a signed leaf of
 * 3,254 bytes for a re-saved AI JPEG (IPTC DETECTED, a broken C2PA hard binding, C2PA notes at the
 * handler's 120-character slice). signPayload refuses anything over 3,072 bytes, and it ran AFTER
 * verifyX402Payment had settled: the buyer's USDC moved and the door answered a bare 500.
 *
 * These tests drive the real handler with a C2PA inspection shaped like that worst case (long
 * generator, long binding and signature reasons, a long IPTC value), a stub facilitator and a
 * throwaway key, and pin the three repairs:
 *   1. the leaf is fitted to the cap (free text shortened, nothing dropped) and the pack is signed;
 *   2. a leaf that cannot fit at any level is refused BEFORE settlement (422, no /settle call);
 *   3. a signing failure after settlement answers with the evidence, the payment, a recorded
 *      failure and the refund path — never a bare 500.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ctl = vi.hoisted(() => ({ cap: null as number | null, throwSign: false, worst: true }));

vi.mock("../../_lib/cardSign", async (orig) => {
  const o = (await orig()) as typeof import("../../_lib/cardSign");
  return {
    ...o,
    get PAYLOAD_CAP_BYTES() {
      return ctl.cap ?? o.PAYLOAD_CAP_BYTES;
    },
    signPayload: async (...a: Parameters<typeof o.signPayload>) => {
      if (ctl.throwSign) throw new Error("payload 3254 bytes exceeds 3072 cap");
      return o.signPayload(...a);
    },
  };
});

const LONG = (s: string, n: number) => (s + " ").repeat(Math.ceil(n / (s.length + 1))).slice(0, n);

vi.mock("../../_lib/c2pa", async (orig) => {
  const o = (await orig()) as typeof import("../../_lib/c2pa");
  return {
    ...o,
    inspectC2pa: async (...a: Parameters<typeof o.inspectC2pa>) => {
      const real = await o.inspectC2pa(...a);
      if (!ctl.worst) return real;
      // The worst case the checker measured, made longer: every note the handler writes is past its slice.
      return {
        ...real,
        manifest_store_present: true,
        manifest_count: 3,
        active_manifest_label: `urn:uuid:${"f".repeat(36)}`,
        claim: { ...(real.claim ?? { version: "v2", title: null, format: "image/jpeg", instance_id: null, alg: "sha256", assertion_count: 9, assertion_labels: [] }), claim_generator: LONG("Adobe_Photoshop/26.0 adobe_c2pa/0.12.2 c2pa-rs/0.36.1 Firefly-Image-Model/4", 240) },
        assertion_hashes: { status: "VALID", checked: 9, failed: [], reason: null },
        data_hash: { status: "INVALID", binding: "c2pa.hash.data", alg: "sha256", exclusions: 1, exclusions_cover_manifest: true, reason: LONG("hard binding mismatch: the asset bytes were re-encoded after signing (the JPEG was re-saved), so the c2pa.hash.data digest no longer reproduces", 260) },
        signature: { status: "VALID", cose_alg: "ES256", leaf_cn: LONG("Adobe Content Authenticity Signing Certificate", 120), leaf_not_before: null, leaf_not_after: null, chain_length: 3, timestamp: "PRESENT_UNVERIFIED", reason: null },
      };
    },
    xmpDigitalSourceType: () => (ctl.worst ? "http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia" : null),
  };
});

import { onRequestGet as get, fitLeafPayload, PAYMENT_BLOCK_WORST_CASE, type Measurement } from "./marking-evidence";
import { canonicalBytes } from "../../_lib/cardSign";
import { verifyCardV0 } from "../../_lib/cardV0Verify";
import { ART50_SCOPE_SIGNED } from "../../_lib/art50Scope";

const FIX = resolve(__dirname, "../../../fixtures/c2pa");
const C_JPG = new Uint8Array(readFileSync(resolve(FIX, "c2pa-rs-C.jpg")));
const ORIGIN = "https://councilof.ai";
const EP = "/api/art50/marking-evidence";
const SELF = "0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7";
const TX = `0x${"ab".repeat(32)}`; // 66 characters, as a real Base transaction hash
const ctx = (path: string, env: Record<string, unknown> = {}, init: RequestInit = {}) => ({ request: new Request(ORIGIN + path, init), env, params: {} }) as never;
const kv = () => {
  const store = new Map<string, string>();
  return { store, get: async (k: string) => store.get(k) ?? null, put: async (k: string, v: string) => void store.set(k, v) };
};
const hdr = btoa(JSON.stringify({ x402Version: 1, scheme: "exact", network: "base", payload: {} }));

let calls: { verify: number; settle: number };
beforeEach(() => {
  ctl.cap = null;
  ctl.throwSign = false;
  ctl.worst = true;
  calls = { verify: 0, settle: 0 };
  vi.stubGlobal("fetch", async (u: string | URL | Request) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    if (url.pathname.endsWith("/verify")) {
      calls.verify += 1;
      return new Response(JSON.stringify({ isValid: true }));
    }
    if (url.pathname.endsWith("/settle")) {
      calls.settle += 1;
      return new Response(JSON.stringify({ success: true, transaction: TX, network: "eip155:8453", payer: SELF }));
    }
    if (url.hostname === "cdn.example" && url.pathname === "/resaved-ai.jpg") return new Response(C_JPG, { status: 200, headers: { "content-type": "image/jpeg" } });
    return new Response("nope", { status: 404 });
  });
});
afterEach(() => vi.unstubAllGlobals());

async function testKey(): Promise<{ pkcs8b64: string; pubHex: string }> {
  const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey));
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  return { pkcs8b64: btoa(String.fromCharCode(...pkcs8)), pubHex: [...raw].map((b) => b.toString(16).padStart(2, "0")).join("") };
}

async function worstMeasurement(): Promise<Measurement> {
  const r = await get(ctx(`${EP}?preview=1&url=https://cdn.example/resaved-ai.jpg`));
  return (await r.json()).measurement as Measurement;
}

describe("the signed leaf fits the 3,072-byte cap before any money moves", () => {
  it("the fixture reproduces the defect: at the historical shape (level 0) this leaf is over the cap", async () => {
    const m = await worstMeasurement();
    expect(m.checked.find((c) => c.method === "iptc.digitalSourceType")?.result).toBe("DETECTED");
    expect(m.checked.find((c) => c.method === "c2pa.hard-binding")?.result).toBe("INVALID");
    const level0 = await fitLeafPayload(m, "2026-10-07T00:00:00.000Z", { mode: "x402", network: "eip155:8453", transaction: TX, payer: SELF }, Infinity);
    expect(level0?.level).toBe(0);
    expect(level0!.bytes).toBeGreaterThan(3072);
  });

  it("fitted with the widest payment block a settle can add, it fits, keeping every method, result, statement, gap code and the scope", async () => {
    const m = await worstMeasurement();
    const fit = await fitLeafPayload(m, "2026-10-07T00:00:00.000Z", PAYMENT_BLOCK_WORST_CASE);
    expect(fit).not.toBeNull();
    expect(fit!.bytes).toBeLessThanOrEqual(3072);
    expect(fit!.bytes).toBe(canonicalBytes(fit!.payload).byteLength);
    expect(fit!.level).toBeGreaterThan(0);
    const p = fit!.payload as { checked: { method: string; result: string }[]; statements: string[]; gaps: Record<string, string>; scope: unknown; trim_level: number };
    expect(p.checked.map((c) => [c.method, c.result])).toEqual(m.checked.map((c) => [c.method, c.result]));
    expect(p.statements).toHaveLength(Math.min(4, m.statements.length));
    expect(Object.keys(p.gaps)).toEqual(Object.keys(m.gaps));
    expect(p.scope).toEqual(ART50_SCOPE_SIGNED);
    expect(p.trim_level).toBe(fit!.level);
    // a cap no level can meet gives null, so the handler can refuse before settling
    expect(await fitLeafPayload(m, "2026-10-07T00:00:00.000Z", PAYMENT_BLOCK_WORST_CASE, 0)).toBeNull();
  });

  it("paid end to end on the worst case: settled once, a signed pack at most 3,072 bytes, the full text in measurement, and it verifies", async () => {
    const { pkcs8b64, pubHex } = await testKey();
    const store = kv();
    const env = { X402_FACILITATOR_URL: "https://f.example", X402_SELF_WALLETS: SELF, BOARD_SIGN_KEY_PKCS8_B64: pkcs8b64, REVENUE_KV: store };
    const r = await get(ctx(`${EP}?url=https://cdn.example/resaved-ai.jpg`, env, { headers: { "x-payment": hdr } }));
    expect(r.status).toBe(200);
    expect(calls.settle).toBe(1);
    const b = await r.json();
    expect(b.signed).toBe(true);
    expect(b.bytes).toBeLessThanOrEqual(3072);
    expect(b.card.payload.trim_level).toBeGreaterThan(0);
    expect(b.card.payload.payment).toMatchObject({ transaction: TX, payer: SELF });
    expect(b.leaf_trim).toMatch(/full text is in measurement/);
    expect(b.measurement.checked.find((c: { method: string }) => c.method === "c2pa.hard-binding").note.length).toBeGreaterThan(120);
    const v = await verifyCardV0(b.card, JSON.stringify(b.card), [{ id: "did:web:csoai.org#board-attestation-1", hex: pubHex }]);
    expect(v.state).toBe("VALID");
  });

  it("an ordinary leaf keeps the historical shape: no trim_level, no leaf_trim", async () => {
    ctl.worst = false;
    const r = await get(ctx(`${EP}?url=https://cdn.example/resaved-ai.jpg`, { X402_FACILITATOR_URL: "https://f.example" }, { headers: { "x-payment": hdr } }));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.card.payload.trim_level).toBeUndefined();
    expect(b.leaf_trim).toBeUndefined();
  });

  it("a leaf that cannot fit at any level is refused BEFORE settlement: 422, the facilitator never asked to settle", async () => {
    ctl.cap = 600;
    const store = kv();
    const r = await get(ctx(`${EP}?url=https://cdn.example/resaved-ai.jpg`, { X402_FACILITATOR_URL: "https://f.example", REVENUE_KV: store }, { headers: { "x-payment": hdr } }));
    expect(r.status).toBe(422);
    const b = await r.json();
    expect(b).toMatchObject({ error: "undeliverable", payment_taken: false });
    expect(calls.settle).toBe(0);
    expect(calls.verify).toBe(0);
    expect([...store.store.keys()].some((k) => k.startsWith("settled:"))).toBe(false);
  });
});

describe("paid and then not signed is never a bare 500", () => {
  it("answers with the measurement, the settled payment, a recorded failure and the refund path", async () => {
    ctl.throwSign = true;
    const store = kv();
    const env = { X402_FACILITATOR_URL: "https://f.example", X402_SELF_WALLETS: SELF, REVENUE_KV: store };
    const r = await get(ctx(`${EP}?url=https://cdn.example/resaved-ai.jpg`, env, { headers: { "x-payment": hdr } }));
    expect(calls.settle).toBe(1);
    expect(r.status).toBe(500);
    expect(r.headers.get("x-payment-response")).toBeTruthy();
    const b = await r.json();
    expect(b.error).toBe("paid_not_delivered");
    expect(b.payment_settled).toBe(true);
    expect(b.payment).toMatchObject({ mode: "x402", transaction: TX, payer: SELF });
    expect(b.measurement.checked.length).toBeGreaterThan(0);
    expect(b.scope.detects).toMatch(/^C2PA and IPTC metadata only/);
    expect(b.refund.contact).toBe("nicholas@csoai.org");
    expect(b.refund.reference).toBe(TX);
    expect(b.refund.how).toMatch(/refunds the payment or re-issues the signed pack/);
    expect(b.refund.mailto).toMatch(/^mailto:nicholas@csoai\.org\?subject=/);
    expect(b.note).toMatch(/may have settled/);
    expect(b.failure_recorded).toBe(true);
    const rec = JSON.parse(store.store.get(`art50-undelivered:${TX}`) ?? "null");
    expect(rec).toMatchObject({ payment: { transaction: TX }, reason: "payload 3254 bytes exceeds 3072 cap" });
  });

  it("without a store bound it still answers with the evidence and the refund path, and says nothing was recorded", async () => {
    ctl.throwSign = true;
    const r = await get(ctx(`${EP}?url=https://cdn.example/resaved-ai.jpg`, { X402_FACILITATOR_URL: "https://f.example" }, { headers: { "x-payment": hdr } }));
    expect(r.status).toBe(500);
    const b = await r.json();
    expect(b).toMatchObject({ error: "paid_not_delivered", failure_recorded: false, failure_record: null });
    expect(b.refund.contact).toBe("nicholas@csoai.org");
  });
});
