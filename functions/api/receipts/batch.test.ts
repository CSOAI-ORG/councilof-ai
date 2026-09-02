import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as batch, assembleBatch, BATCH_CAP, parseIso } from "./batch";
import { onRequestGet as latest } from "./latest";
import { onRequestGet as ras } from "../request-attestation";
import { onRequestGet as bundleRoute } from "../evidence-bundle";
import { onRequestGet as feed } from "../eunomia-data";
import { onRequestGet as proof } from "../proof";
import { ESTATE_PAY_TO } from "../_x402_config";
import { SKUS } from "../_skus";
import { canonicalBytes, sha256Hex } from "../../_lib/cardSign";

const ORIGIN = "https://councilof.ai";
const ctx = (path: string, env: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  ({ request: new Request(ORIGIN + path, { headers }), env, params: {} }) as never;

const H = (c: string) => c.repeat(64);
const ROOT_A = H("a"); // 2026-08-31 root — carried leaf 1
const ROOT_B = H("b"); // 2026-09-01 root — carried leaves 1 + 2
const ROOT_C = H("c"); // current — carries leaf 2 + 3
const leaf = (sha: string, as_of: string, surface = "public.notice", signed = true) => ({
  card: { schema: "https://councilof.ai/schema/card-v0.json", sha256: sha, as_of, surface, subject: `s-${sha.slice(0, 4)}`, sig_ed25519: signed ? "sig" : null, payload: { k: 1 }, unmeasured: [] },
  proof: [H("9")],
});
const STATIC: Record<string, unknown> = {
  "/cards-bundle.json": {
    as_of: "2026-09-02T07:13:27Z",
    merkle_root: ROOT_C,
    cards: {
      [H("1")]: leaf(H("1"), "2026-08-31T08:00:00Z", "xrpl.asset.state"),
      [H("2")]: leaf(H("2"), "2026-09-01T04:00:14.952Z"),
      [H("3")]: leaf(H("3"), "2026-09-02T07:13:04Z", "public.notice", false),
      [H("4")]: { card: { sha256: H("4"), surface: "broken" }, proof: [] }, // no as_of → never in a batch
    },
  },
  "/receipts/root-history.json": {
    schema: "csoai.root-history/0.1",
    roots: [
      { as_of: "2026-08-31T10:00:00Z", merkle_root: ROOT_A, card_count: 1, card_sha256: [H("1")], sig_ed25519: "ra", did_intended: "did:web:csoai.org#board-attestation-1", commit: "aaaaaaa" },
      { as_of: "2026-09-01T09:00:00Z", merkle_root: ROOT_B, card_count: 2, card_sha256: [H("1"), H("2")], sig_ed25519: "rb", did_intended: "did:web:csoai.org#board-attestation-1", commit: "bbbbbbb" },
      { as_of: "2026-09-02T07:13:27Z", merkle_root: ROOT_C, card_count: 2, card_sha256: [H("2"), H("3")], sig_ed25519: "rc", did_intended: "did:web:csoai.org#board-attestation-1", commit: null },
    ],
  },
  "/root.json": { as_of: "2026-09-02T07:13:27Z", card_count: 2, merkle_root: ROOT_C, card_sha256: [H("2"), H("3")] },
  "/signed/card-matrix.json": { as_of: "2026-08-19T09:24:39Z", cells: [] },
  "/signals/_index.json": { signals: [] },
  "/api/fines": { signature: "sig" },
  "/signed/card_index.json": { cards: [] },
};

function stubStatic(facilitator?: (p: string) => Response) {
  vi.stubGlobal("fetch", async (u: string | URL | Request) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    if (facilitator && (url.pathname.endsWith("/verify") || url.pathname.endsWith("/settle"))) return facilitator(url.pathname);
    if (url.pathname in STATIC) return new Response(JSON.stringify(STATIC[url.pathname]), { status: 200 });
    return new Response("nope", { status: 404 });
  });
}
afterEach(() => vi.unstubAllGlobals());

const WINDOW = "from=2026-08-31T00:00:00Z&to=2026-09-01T23:59:59Z";
const paidReceipt = () => btoa(JSON.stringify({ x402Version: 2, scheme: "exact", network: "eip155:8453", payload: { signature: "0x", authorization: {} } }));
const settles = (p: string) => new Response(JSON.stringify(p.endsWith("/verify") ? { isValid: true } : { success: true, transaction: "0xtx", network: "base", payer: "0xp" }));

describe("/api/receipts/batch — input", () => {
  it("parses ISO instants and rejects garbage", () => {
    expect(parseIso("2026-09-01T00:00:00Z")?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(parseIso("yesterday")).toBeNull();
    expect(parseIso(null)).toBeNull();
  });

  it("400 without from, on an unparseable to, and when to precedes from", async () => {
    stubStatic();
    expect((await batch(ctx("/api/receipts/batch"))).status).toBe(400);
    expect((await batch(ctx("/api/receipts/batch?from=2026-09-01T00:00:00Z&to=nope"))).status).toBe(400);
    expect((await batch(ctx("/api/receipts/batch?from=2026-09-02T00:00:00Z&to=2026-09-01T00:00:00Z"))).status).toBe(400);
  });
});

describe("/api/receipts/batch — free preview", () => {
  it("returns count, span, roots and the batch sha256 — and no leaves", async () => {
    stubStatic();
    const r = await batch(ctx(`/api/receipts/batch?${WINDOW}&preview=1`));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.kind).toBe("preview");
    expect(b.count).toBe(2);
    expect(b.matched).toBe(2);
    expect(b.span).toEqual({ first_as_of: "2026-08-31T08:00:00Z", last_as_of: "2026-09-01T04:00:14.952Z" });
    expect(b.roots_in_window).toBe(2);
    expect(b.roots_indexed_total).toBe(3);
    expect(b.batch_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(b.items).toBeUndefined();
    expect(JSON.stringify(b)).not.toMatch(/"proof"/);
    // Honest about what a receipt is on this estate.
    expect(b.sources.settlement_receipts).toMatch(/NONE published/);
    expect(JSON.stringify(b)).not.toMatch(/[£$€]\s?\d|"amount"/);
  });

  it("the preview is free even when the root index is unreadable — roots_carrying declared empty", async () => {
    stubStatic();
    const saved = STATIC["/receipts/root-history.json"];
    delete STATIC["/receipts/root-history.json"];
    try {
      const b = await (await batch(ctx(`/api/receipts/batch?${WINDOW}&preview=1`))).json();
      expect(b.count).toBe(2);
      expect(b.roots_indexed_total).toBe(0);
      expect(b.sources.roots).toMatch(/unreadable/);
    } finally {
      STATIC["/receipts/root-history.json"] = saved;
    }
  });
});

describe("/api/receipts/batch — 402 shape", () => {
  it("carries a complete v2 challenge, the bazaar block, the same preview, and no leaves", async () => {
    stubStatic();
    const r = await batch(ctx(`/api/receipts/batch?${WINDOW}`));
    expect(r.status).toBe(402);
    expect(r.headers.get("PAYMENT-REQUIRED")).toBeTruthy();
    const b = await r.json();
    expect(b.x402Version).toBe(2);
    expect(b.accepts[0]).toMatchObject({ scheme: "exact", network: "eip155:8453", payTo: ESTATE_PAY_TO, extra: { name: "USD Coin", version: "2" } });
    expect(b.accepts[0].amount).toMatch(/^\d+$/);
    expect(b.extensions.bazaar.info.input).toMatchObject({ type: "http", method: "GET" });
    expect(b.extensions.bazaar.schema.properties.input.properties.queryParams.required).toEqual(["from"]);
    expect(b.csoai.preview.batch_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(b.csoai.rail.mode).toBe("challenge-only");
    expect(b.csoai.never.join(" ")).toMatch(/settlement or payment receipts — none are published/);
    expect(JSON.stringify(b)).not.toMatch(/"proof":\s*\[/);
    expect(JSON.stringify(b)).not.toMatch(/\bsafe\b|certified/i);
  });

  it("header presence is not payment: an X-PAYMENT header with no facilitator is still 402", async () => {
    stubStatic();
    const r = await batch(ctx(`/api/receipts/batch?${WINDOW}`, {}, { "x-payment": paidReceipt() }));
    expect(r.status).toBe(402);
    expect((await r.json()).csoai.not_paid_reason).toMatch(/not provisioned/);
  });
});

describe("/api/receipts/batch — paid path (stubbed facilitator)", () => {
  it("delivers the batch whose bytes hash to the preview sha256, with carrying roots and a manifest card", async () => {
    stubStatic();
    const previewSha = (await (await batch(ctx(`/api/receipts/batch?${WINDOW}&preview=1`))).json()).batch_sha256;

    stubStatic(settles);
    const r = await batch(ctx(`/api/receipts/batch?${WINDOW}`, { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": paidReceipt() }));
    expect(r.status).toBe(200);
    expect(r.headers.get("x-payment-response")).toBeTruthy();
    const b = await r.json();
    expect(b.kind).toBe("batch");
    expect(b.batch_sha256).toBe(previewSha);
    expect(await sha256Hex(canonicalBytes(b.batch))).toBe(previewSha);
    expect(b.batch.items.map((i: { sha256: string }) => i.sha256)).toEqual([H("1"), H("2")]);
    expect(b.batch.items[0]).toMatchObject({ roots_carrying: [ROOT_A, ROOT_B], on_current_root: false, free_now: null, signed: true });
    expect(b.batch.items[1]).toMatchObject({ roots_carrying: [ROOT_B, ROOT_C], on_current_root: true, free_now: `/api/proof?sha=${H("2")}` });
    expect(b.batch.items[0].proof).toEqual([H("9")]);
    expect(b.batch.roots.map((x: { merkle_root: string }) => x.merkle_root)).toEqual([ROOT_A, ROOT_B]);
    // The manifest is the only thing signed here; the leaves keep their published signatures.
    expect(b.manifest_card.surface).toBe("receipts.batch");
    expect(b.manifest_card.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(b.manifest_card.sig_ed25519).toBeNull();
    expect(b.manifest_card.unmeasured).toEqual(expect.arrayContaining(["root_inclusion", "sig_ed25519"]));
    expect(b.manifest_card.payload).toMatchObject({ batch_sha256: previewSha, count: 2, settle_tx: "0xtx", leaves_signed: 2 });
    expect(b.manifest_card.source_urls).toContain("https://basescan.org/tx/0xtx");
    expect(b.manifest_bytes).toBeLessThanOrEqual(3072);
    expect(b.settle).toMatchObject({ transaction: "0xtx" });
  });

  it("refuses when the facilitator rejects, and when settle fails after verify", async () => {
    stubStatic((p) => new Response(JSON.stringify(p.endsWith("/verify") ? { isValid: false, invalidReason: "bad sig" } : { success: true })));
    expect((await batch(ctx(`/api/receipts/batch?${WINDOW}`, { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": paidReceipt() }))).status).toBe(402);
    stubStatic((p) => new Response(JSON.stringify(p.endsWith("/verify") ? { isValid: true } : { success: false, errorReason: "insufficient" })));
    expect((await batch(ctx(`/api/receipts/batch?${WINDOW}`, { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": paidReceipt() }))).status).toBe(402);
  });
});

describe("/api/receipts/batch — assembly is deterministic and capped", () => {
  const bundleOf = (n: number) => {
    const cards: Record<string, unknown> = {};
    for (let i = 0; i < n; i++) {
      const sha = i.toString(16).padStart(64, "0");
      cards[sha] = leaf(sha, new Date(Date.UTC(2026, 8, 1, 0, 0, i)).toISOString());
    }
    return { cards } as never;
  };
  const from = new Date("2026-09-01T00:00:00Z");
  const to = new Date("2026-09-01T23:00:00Z");

  it("caps at BATCH_CAP, orders by as_of, and names next_from", () => {
    const b = assembleBatch({ from, to, bundle: bundleOf(BATCH_CAP + 5), history: null, currentRoot: null });
    expect(b.count).toBe(BATCH_CAP);
    expect(b.matched).toBe(BATCH_CAP + 5);
    expect(b.truncated).toBe(true);
    expect(b.next_from).toBe(new Date(Date.UTC(2026, 8, 1, 0, 0, BATCH_CAP)).toISOString());
    expect(b.items[0].as_of < b.items[1].as_of).toBe(true);
  });

  it("identical inputs → identical canonical bytes (the preview hash is the paid hash)", async () => {
    const a = assembleBatch({ from, to, bundle: bundleOf(3), history: null, currentRoot: null });
    const b = assembleBatch({ from, to, bundle: bundleOf(3), history: null, currentRoot: null });
    expect(await sha256Hex(canonicalBytes(a))).toBe(await sha256Hex(canonicalBytes(b)));
    expect(JSON.stringify(a)).not.toMatch(/generated|fetched_at|"now"/);
  });

  it("the SKU sells assembly, is x402-or-invoice, and its band sits inside the brief's range", () => {
    const s = SKUS.receipts_batch;
    expect(s.sells).toBe("assembly");
    expect(s.rail).toBe("x402-or-invoice");
    expect(s.prices.per_batch.range_usd).toEqual([0.05, 0.25]);
    expect(s.prices.per_batch.label).toBe("ESTIMATE");
  });
});

describe("/api/receipts/latest stays free and unchanged", () => {
  it("still answers 200 UNPUBLISHED with zero items and no payment header", async () => {
    const r = await latest(ctx("/api/receipts/latest"));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b).toMatchObject({ schema: "csoai.receipts.latest/0.1", status: "UNPUBLISHED", count: 0, items: [] });
    expect(r.headers.get("PAYMENT-REQUIRED")).toBeNull();
  });
});

describe("bazaar readiness — every 402 route on master emits the same extensions.bazaar shape", () => {
  it("info.input {type:http, method} + schema with properties.input on each paid route", async () => {
    stubStatic();
    const routes: [string, (c: never) => Promise<Response>][] = [
      ["/api/request-attestation?subject=qwen3", ras],
      ["/api/evidence-bundle?obligation=article-53&subject=gpt-4o&bundle=1", bundleRoute],
      ["/api/eunomia-data?feed=1", feed],
      ["/api/proof?bundle=1", proof],
      [`/api/receipts/batch?${WINDOW}`, batch],
    ];
    for (const [path, fn] of routes) {
      const r = await fn(ctx(path));
      expect(r.status, path).toBe(402);
      expect(r.headers.get("PAYMENT-REQUIRED"), path).toBeTruthy();
      const b = await r.json();
      expect(b.x402Version, path).toBe(2);
      expect(b.extensions?.bazaar?.info?.input, path).toMatchObject({ type: "http", method: "GET" });
      expect(b.extensions?.bazaar?.schema?.properties?.input?.required, path).toEqual(["type", "method"]);
      expect(b.extensions.bazaar, path).not.toHaveProperty("discoverable");
      expect(b.accepts[0].payTo, path).toBe(ESTATE_PAY_TO);
    }
  });
});
