/**
 * c76 — a verified settlement followed by failed output is labelled PAID_NOT_DELIVERED on the
 * three paid handlers (evidence-bundle, rwa/evidence, receipts/batch), with the settlement echo
 * preserved and no successful delivery row written. Offline: every fetch is stubbed; signing is
 * forced to fail through a module mock. Success paths are covered by the existing route tests.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const fail = vi.hoisted(() => ({ sign: false }));
vi.mock("../_lib/cardSign", async (orig) => {
  const real = await orig<typeof import("../_lib/cardSign")>();
  return {
    ...real,
    signPayload: async (...a: Parameters<typeof real.signPayload>) => {
      if (fail.sign) throw new Error("offline failure marker");
      return real.signPayload(...a);
    },
  };
});

import { onRequestGet as bundle } from "./evidence-bundle";
import { onRequestGet as rwa } from "./rwa/evidence";
import { onRequestGet as batch } from "./receipts/batch";
import { deliveryTxKey } from "./_x402_delivery_record";

const ORIGIN = "https://councilof.ai";
const ADDR = "rH5CJsqvNqZGxrMyGaqLEoMWRYcVTAPZMt";
const H = (c: string) => c.repeat(64);
const NOW = "2026-09-01T04:00:00Z";
const card = { schema: "https://councilof.ai/schema/card-v0.json", sha256: H("1"), as_of: NOW, surface: "synthetic.marking", subject: "watermark", tags: ["watermark", "article 50"], sig_ed25519: "sig", payload: { k: 1 }, unmeasured: [] };
const STATIC: Record<string, unknown> = {
  "/cards-bundle.json": { as_of: NOW, merkle_root: H("b"), cards: { [H("1")]: { card, proof: [] } } },
  "/receipts/root-history.json": { roots: [{ as_of: NOW, merkle_root: H("b"), card_count: 1, card_sha256: [H("1")], sig_ed25519: null, did_intended: null, commit: null }] },
  "/root.json": { as_of: NOW, merkle_root: H("b"), card_sha256: [H("1")] },
  "/api/xrpl": { as_of: NOW, assets: [{ symbol: "BBRL", issuer: "Braza Bank", issuer_address: ADDR, holders: 40, supply: 1, verified_via: null, unmeasured: [], sig_ed25519: null }] },
};

function stub(tx: boolean) {
  vi.stubGlobal("fetch", async (u: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    if (url.host === "f.example") return new Response(JSON.stringify(url.pathname.endsWith("/verify") ? { isValid: true } : { success: true, network: "base", ...(tx ? { transaction: "0xtx" } : {}) }));
    if (url.host === "xrplcluster.com") {
      const m = JSON.parse(String(init?.body)).method;
      if (m === "account_info") return new Response(JSON.stringify({ result: { status: "success", ledger_index: 1, account_data: { Flags: 0, Domain: "", Sequence: 1 } } }));
      return new Response(JSON.stringify({ result: { status: "success", ledger_index: 1, obligations: { "4242524C00000000000000000000000000000000": "1" } } }));
    }
    if (url.host === "api.xrpscan.com") return new Response("[]", { headers: { "content-type": "application/json" } });
    if (url.host === "councilof.ai" && url.pathname in STATIC) return new Response(JSON.stringify(STATIC[url.pathname]));
    return new Response("nope", { status: 404 });
  });
}
class Kv { rows = new Map<string, string>(); async get(k: string) { return this.rows.get(k) ?? null; } async put(k: string, v: string) { this.rows.set(k, v); } }
afterEach(() => { vi.unstubAllGlobals(); fail.sign = false; });

const hdr = () => btoa(JSON.stringify({ x402Version: 2, scheme: "exact", network: "eip155:8453", payload: { signature: "0x", authorization: {} } }));
const ROUTES: [string, (c: never) => Promise<Response>, string][] = [
  ["evidence-bundle", bundle as never, "/api/evidence-bundle?obligation=article-50&bundle=1"],
  ["rwa/evidence", rwa as never, `/api/rwa/evidence?asset=BBRL`],
  ["receipts/batch", batch as never, "/api/receipts/batch?from=2026-08-31T00:00:00Z&to=2026-09-02T00:00:00Z"],
];
const call = (h: (c: never) => Promise<Response>, path: string, kv: Kv, payment = true) =>
  h({ request: new Request(ORIGIN + path, { headers: payment ? { "x-payment": hdr() } : {} }), env: { X402_FACILITATOR_URL: "https://f.example", REVENUE_KV: kv }, params: {} } as never);

describe("paid failure after settlement — three routes", () => {
  for (const [name, h, path] of ROUTES) {
    it(`${name}: sign failure after settlement is PAID_NOT_DELIVERED, settlement preserved, no delivery row`, async () => {
      stub(true); fail.sign = true;
      const kv = new Kv();
      const r = await call(h, path, kv);
      const body = await r.json();
      expect(r.status).toBe(500);
      expect(body.error).toBe("uncheckable");
      expect(body.state).toBe("PAID_NOT_DELIVERED");
      expect(body.reason).toMatch(/offline failure marker/);
      expect(body.settle?.transaction).toBe("0xtx");
      expect(body.note).toMatch(/do not automatically retry or pay again/);
      expect(r.headers.get("x-csoai-delivery-state")).toBe("PAID_NOT_DELIVERED");
      expect(r.headers.get("x-csoai-delivery-record-state")).toBe("NOT_DELIVERED");
      expect(r.headers.get("x-payment-response")).toBeTruthy();
      expect(kv.rows.has(deliveryTxKey("0xtx"))).toBe(false);
    });

    it(`${name}: settlement without a transaction id is still labelled, with no invented tx`, async () => {
      stub(false); fail.sign = true;
      const r = await call(h, path, new Kv());
      const body = await r.json();
      expect(r.status).toBe(500);
      expect(body.state).toBe("PAID_NOT_DELIVERED");
      expect(body.settle?.transaction || null).toBeNull();
    });
  }

  it("rwa/evidence: an unpaid preview is never labelled as a paid failure", async () => {
    stub(true); fail.sign = true;
    const r = await call(rwa as never, "/api/rwa/evidence?asset=BBRL&preview=1", new Kv(), false);
    expect(r.headers.get("x-csoai-delivery-state")).toBeNull();
  });
});
