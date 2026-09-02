import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as ras } from "./request-attestation";
import { onRequestGet as bundle } from "./evidence-bundle";
import { onRequestGet as feed } from "./eunomia-data";
import { onRequestGet as catalog } from "./x402";
import { onRequestGet as wellKnown } from "../.well-known/x402.json";
import { ESTATE_PAY_TO } from "./_x402_config";

const ORIGIN = "https://councilof.ai";
const ctx = (path: string, env: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  ({ request: new Request(ORIGIN + path, { headers }), env, params: {} }) as never;

// Static-asset reads the Functions make. Anything else 404s so a missing stub is loud.
const STATIC: Record<string, unknown> = {
  "/signed/card-matrix.json": {
    as_of: "2026-08-19T09:24:39Z",
    cells: [
      { model: "qwen3:0.6b", axis: "care-refusal-protect", card: "00a5", card_url: "/signed/cards/00a5.json", signed: true },
      { model: "qwen3:0.6b", axis: "gov", card: "0b11", card_url: "/signed/cards/0b11.json", signed: true },
      { model: "other", axis: "gov", card: "ffff", card_url: "/signed/cards/ffff.json", signed: true },
    ],
  },
  "/cards-bundle.json": {
    as_of: "2026-09-02T07:13:27Z",
    merkle_root: "r".repeat(64),
    cards: {
      ["a".repeat(64)]: { card: { sha256: "a".repeat(64), sig_ed25519: "s", subject: "gpt-4o system-card behaviour", surface: "gspc.behavioural", tags: ["gpai"], as_of: "2026-09-01T00:00:00Z" }, proof: ["p"] },
      ["b".repeat(64)]: { card: { sha256: "b".repeat(64), sig_ed25519: null, subject: "gpt-4o", surface: "gspc.behavioural", tags: [] }, proof: [] },
    },
  },
  "/signals/_index.json": { schema: "csoai.signals-index/0.1", signals: [{ axis: "gov" }, { axis: "prv" }] },
  "/api/fines": { schema: "csoai.first-fine-watch/0.1", signature: "sig", kid: "did:web:csoai.org#board-attestation-1" },
  "/root.json": { as_of: "2026-09-02T07:13:27Z", card_count: 50, merkle_root: "r".repeat(64) },
  "/signed/card_index.json": { cards: [{}, {}, {}] },
};

function stubStatic(facilitator?: (u: string) => Response) {
  vi.stubGlobal("fetch", async (u: string | URL | Request) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    if (facilitator && (url.pathname.endsWith("/verify") || url.pathname.endsWith("/settle"))) return facilitator(url.pathname);
    const key = url.pathname;
    if (key in STATIC) return new Response(JSON.stringify(STATIC[key]), { status: 200 });
    return new Response("nope", { status: 404 });
  });
}
afterEach(() => vi.unstubAllGlobals());

describe("Tier 1 — /api/request-attestation", () => {
  it("402 carries a complete challenge, a free preview of signed cards on file, and no invented score", async () => {
    stubStatic();
    const r = await ras(ctx("/api/request-attestation?subject=qwen3&axis=gov"));
    expect(r.status).toBe(402);
    expect(r.headers.get("PAYMENT-REQUIRED")).toBeTruthy();
    const b = await r.json();
    expect(b.accepts[0]).toMatchObject({ payTo: ESTATE_PAY_TO, network: "eip155:8453", extra: { name: "USD Coin", version: "2" } });
    expect(b.csoai.preview).toMatchObject({ subject: "qwen3", axis: "gov", axis_known: true, signed_cards_on_file: 1 });
    expect(b.csoai.rail.mode).toBe("challenge-only");
    expect(JSON.stringify(b)).not.toMatch(/accuracy|score:/);
  });

  it("rejects a malformed subject before doing anything", async () => {
    stubStatic();
    expect((await ras(ctx("/api/request-attestation?subject=%3Cscript%3E"))).status).toBe(400);
  });

  it("paid: issues ONE card-v0 (ras.commission) citing the settle tx, re-serving existing cards, unsigned-declared without a key", async () => {
    stubStatic((p) =>
      new Response(JSON.stringify(p.endsWith("/verify") ? { isValid: true } : { success: true, transaction: "0xtx", network: "base", payer: "0xp" })),
    );
    const hdr = btoa(JSON.stringify({ x402Version: 1, scheme: "exact", network: "base", payload: {} }));
    const r = await ras(ctx("/api/request-attestation?subject=qwen3", { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": hdr }));
    expect(r.status).toBe(200);
    expect(r.headers.get("x-payment-response")).toBeTruthy();
    const b = await r.json();
    expect(b.card.surface).toBe("ras.commission");
    expect(b.card.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(b.card.sig_ed25519).toBeNull();
    expect(b.card.unmeasured).toEqual(expect.arrayContaining(["root_inclusion", "sig_ed25519", "fresh_run_schedule"]));
    expect(b.card.source_urls).toContain("https://basescan.org/tx/0xtx");
    expect(b.card.payload).toMatchObject({ status: "COMMISSIONED", reserve_count: 2, fresh_run: "UNMEASURED" });
    expect(b.bytes).toBeLessThanOrEqual(3072);
    expect(JSON.stringify(b.card)).not.toMatch(/accuracy/);
  });
});

describe("Tier 2 — /api/evidence-bundle", () => {
  it("lists obligations on a missing id (400) and an unknown one (404)", async () => {
    stubStatic();
    expect((await bundle(ctx("/api/evidence-bundle"))).status).toBe(400);
    const r = await bundle(ctx("/api/evidence-bundle?obligation=sox"));
    expect(r.status).toBe(404);
    expect((await r.json()).obligations.map((o: { id: string }) => o.id)).toContain("article-53");
  });

  it("free preview counts only SIGNED relevant cards and says relevant-to", async () => {
    stubStatic();
    const r = await bundle(ctx("/api/evidence-bundle?obligation=gpai&subject=gpt-4o"));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.kind).toBe("preview");
    expect(b.relevant_signed_cards).toBe(1); // the unsigned one is excluded
    expect(b.obligation.id).toBe("article-53");
    expect(b.relation).toMatch(/relevant-to/);
  });

  it("402 for &bundle=1; paid returns OSCAL observations, no findings, and a manifest card", async () => {
    stubStatic();
    const r402 = await bundle(ctx("/api/evidence-bundle?obligation=article-53&subject=gpt-4o&bundle=1"));
    expect(r402.status).toBe(402);
    expect((await r402.json()).accepts[0].payTo).toBe(ESTATE_PAY_TO);

    stubStatic((p) => new Response(JSON.stringify(p.endsWith("/verify") ? { isValid: true } : { success: true, transaction: "0xtx" })));
    const hdr = btoa(JSON.stringify({ x402Version: 2, scheme: "exact", network: "eip155:8453", payload: {} }));
    const r = await bundle(ctx("/api/evidence-bundle?obligation=article-53&subject=gpt-4o&bundle=1", { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": hdr }));
    expect(r.status).toBe(200);
    const b = await r.json();
    const ar = b.oscal["assessment-results"];
    expect(ar.results[0].observations).toHaveLength(1);
    expect(ar.results[0].findings).toEqual([]);
    expect(ar.results[0].observations[0].props).toContainEqual({ name: "relation", value: "relevant-to" });
    expect(b.manifest_card.surface).toBe("evidence.bundle");
    expect(b.manifest_card.payload).toMatchObject({ card_count: 1, determination: "NONE", counsel_confirmed: false });
    expect(b.manifest_card.unmeasured).toContain("counsel_confirmation");
    expect(Object.keys(b.cards)).toEqual(["a".repeat(64)]);
  });
});

describe("Tier 3 — /api/eunomia-data", () => {
  it("free preview reads stream inventory from the signed files; ?feed=1 is a 402", async () => {
    stubStatic();
    const p = await (await feed(ctx("/api/eunomia-data"))).json();
    expect(p.kind).toBe("preview");
    expect(p.streams.signals.rows).toBe(2);
    expect(p.streams.first_fine_watch.signed).toBe(true);
    expect(p.streams.root.card_count).toBe(50);
    const r = await feed(ctx("/api/eunomia-data?feed=1"));
    expect(r.status).toBe(402);
    expect(JSON.stringify(await r.json())).not.toMatch(/price_usd|amount_usd/);
  });
});

describe("catalog + discovery", () => {
  it("/api/x402 and /.well-known/x402.json name no amounts and report the honest mode", async () => {
    const c = await (await catalog(ctx("/api/x402"))).json();
    expect(c.tiers.map((t: { id: string }) => t.id)).toEqual(["issuance", "evidence_bundle", "data_feed"]);
    expect(c.rail).toMatchObject({ mode: "challenge-only", pay_to: ESTATE_PAY_TO });
    expect(JSON.stringify(c)).not.toMatch(/[£$€]\s?\d|"amount":\s*"\d/);
    const w = await (await wellKnown(ctx("/.well-known/x402.json"))).json();
    expect(w).toMatchObject({ schema: "csoai.x402/0.2", mode: "challenge-only", payTo: ESTATE_PAY_TO, network: "eip155:8453" });
    expect(w.resources.every((r: { url: string }) => r.url.startsWith(ORIGIN))).toBe(true);
    expect(JSON.stringify(w)).not.toMatch(/mock|pack\.councilof\.ai/);
    const live = await (await catalog(ctx("/api/x402", { X402_FACILITATOR_URL: "https://f.example" }))).json();
    expect(live.rail.mode).toBe("live");
  });
});
