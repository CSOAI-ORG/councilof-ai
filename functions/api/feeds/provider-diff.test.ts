import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as feed } from "./provider-diff";
import { SKUS } from "../_skus";
import { ESTATE_PAY_TO } from "../_x402_config";

const ORIGIN = "https://councilof.ai";
const ctx = (path: string, env: Record<string, unknown> = {}, headers: Record<string, string> = {}) =>
  ({ request: new Request(ORIGIN + path, { headers }), env, params: {} }) as never;

const INDEX = {
  schema: "csoai.provider-diff.index/0.1",
  as_of: "2026-09-05T05:20:00Z",
  normaliser: "csoai-norm-v1",
  n_targets: 3,
  n_runs: 3,
  counts: { OK: 2, UNCHECKABLE: 1, UNKNOWN: 0 },
  last_run: { run_at: "2026-09-05T05:20:00Z", n_targets: 3, ok: 2, changed: 1, uncheckable: 1, unknown: 0 },
  targets: [
    { id: "openai/terms", provider: "openai", surface: "terms", url: "https://openai.com/policies/terms-of-use/", state: "OK", http_status: 200, robots: "allow", norm_sha256: "a".repeat(64), n_changes: 1 },
    { id: "openai/pricing", provider: "openai", surface: "pricing", url: "https://openai.com/api/pricing/", state: "UNCHECKABLE", http_status: 403, robots: "allow", reason: "anti-bot challenge (HTTP 403); not bypassed", n_changes: 0 },
    { id: "anthropic/aup", provider: "anthropic", surface: "usage_policy", url: "https://www.anthropic.com/legal/aup", state: "OK", http_status: 200, robots: "allow", norm_sha256: "b".repeat(64), n_changes: 0 },
  ],
  recent_diffs: [
    { id: "openai/terms", provider: "openai", surface: "terms", url: "https://openai.com/policies/terms-of-use/", prev_sha256: "c".repeat(64), new_sha256: "a".repeat(64), prev_fetched_at: "2026-09-04T05:20:00Z", fetched_at: "2026-09-05T05:20:00Z", leaf: "/feeds/provider-diff/leaves/card-openai-terms-20260905T052000Z-unsigned.json" },
  ],
  n_diffs_total: 1,
};
const LEAF = { schema: "https://councilof.ai/schema/card-v0.json", surface: "public.notice", sha256: "d".repeat(64), sig_ed25519: null, payload: { kind: "csoai.diff.provider-terms/0.1" } };

const STATIC: Record<string, unknown> = {
  "/feeds/provider-diff/index.json": INDEX,
  "/feeds/provider-diff/state.json": { schema: "csoai.provider-diff.state/0.1", runs: [{}, {}, {}], targets: {} },
  "/feeds/provider-diff/leaves/card-openai-terms-20260905T052000Z-unsigned.json": LEAF,
  "/root.json": { as_of: "2026-09-05T07:07:00Z", card_count: 60, merkle_root: "r".repeat(64) },
};

function stubStatic(facilitator?: (path: string) => Response) {
  vi.stubGlobal("fetch", async (u: string | URL | Request) => {
    const url = new URL(String(u instanceof Request ? u.url : u));
    if (facilitator && (url.pathname.endsWith("/verify") || url.pathname.endsWith("/settle"))) return facilitator(url.pathname);
    if (url.pathname in STATIC) return new Response(JSON.stringify(STATIC[url.pathname]), { status: 200 });
    return new Response("nope", { status: 404 });
  });
}
afterEach(() => vi.unstubAllGlobals());

// Assertion-shaped verdict words. "not certification" / "not a certificate" is the estate's own
// negated doctrine line and is allowed (facts-gate carries the same negation rule).
const VERDICT = /\bnon-?compliant\b|\bcompliant\b|\bviolat|\bcertified\b|\bwe certify\b|\bapproved\b|\bunsafe\b|\babsent\b/i;
const MONEY = /(?:£|\$|€)\s?\d|\bGBP\s?\d|\d+\s?(?:USD|GBP|EUR)\b/;

describe("free surface — GET /api/feeds/provider-diff", () => {
  it("returns recent diffs + latest state per target, read from the index, with no amount and no verdict", async () => {
    stubStatic();
    const r = await feed(ctx("/api/feeds/provider-diff"));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.kind).toBe("recent");
    expect(b.index_readable).toBe(true);
    expect(b.n_targets).toBe(3);
    expect(b.targets).toHaveLength(3);
    expect(b.recent_diffs).toHaveLength(1);
    expect(b.recent_diffs[0]).toMatchObject({ id: "openai/terms", prev_sha256: "c".repeat(64), new_sha256: "a".repeat(64) });
    expect(b.attests).toMatch(/nothing about what changed or why/);
    expect(b.states.UNKNOWN).toMatch(/never reported as unchanged/);
    expect(b.paid.rail).toBe("x402-or-invoice");
    expect(b.paid.how.invoice_gbp).toContain("invoice=gbp&commissioned_by=");
    const text = JSON.stringify(b);
    expect(text).not.toMatch(MONEY);
    expect(text).not.toMatch(VERDICT);
    expect(r.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("filters by provider and surface", async () => {
    stubStatic();
    const b = await (await feed(ctx("/api/feeds/provider-diff?provider=openai"))).json();
    expect(b.targets.map((t: { id: string }) => t.id)).toEqual(["openai/terms", "openai/pricing"]);
    const s = await (await feed(ctx("/api/feeds/provider-diff?provider=openai&surface=pricing"))).json();
    expect(s.targets).toHaveLength(1);
    expect(s.targets[0].state).toBe("UNCHECKABLE");
    expect(s.recent_diffs).toHaveLength(0);
  });

  it("reports an unreadable index honestly instead of typing a state", async () => {
    vi.stubGlobal("fetch", async () => new Response("nope", { status: 404 }));
    const b = await (await feed(ctx("/api/feeds/provider-diff"))).json();
    expect(b.index_readable).toBe(false);
    expect(b.index_unreadable).toBe("HTTP 404");
    expect(b.targets).toEqual([]);
    expect(b.n_targets).toBeNull();
    expect(b.counts).toBeNull();
  });
});

describe("paid doors", () => {
  it("?history=1 is a 402 with a complete x402 challenge; the amount lives only in accepts[]", async () => {
    stubStatic();
    const r = await feed(ctx("/api/feeds/provider-diff?history=1"));
    expect(r.status).toBe(402);
    expect(r.headers.get("PAYMENT-REQUIRED")).toBeTruthy();
    const b = await r.json();
    expect(b.x402Version).toBe(2);
    expect(b.accepts[0]).toMatchObject({ scheme: "exact", payTo: ESTATE_PAY_TO, network: "eip155:8453" });
    expect(Number(b.accepts[0].amount)).toBeGreaterThan(0);
    expect(b.csoai.preview).toMatchObject({ n_targets: 3, n_diffs_total: 1 });
    expect(b.csoai.invoice_alternative).toContain("invoice=gbp");
    expect(b.csoai.rail.mode).toBe("challenge-only");
    // strip accepts (where the amount is allowed) — nothing else carries a number with a currency
    const { accepts: _a, ...rest } = b;
    expect(JSON.stringify(rest)).not.toMatch(MONEY);
    expect(JSON.stringify(b)).not.toMatch(VERDICT);
  });

  it("does not grant on header presence (fail-closed rail)", async () => {
    stubStatic();
    const r = await feed(ctx("/api/feeds/provider-diff?history=1", {}, { "x-payment": "test" }));
    expect(r.status).toBe(402);
    const b = await r.json();
    expect(b.csoai.not_paid_reason).toMatch(/not a decodable|not provisioned/);
  });

  it("?invoice=gbp&commissioned_by= is a 402 invoice reference with issuer + contact and no amount", async () => {
    stubStatic();
    const r = await feed(ctx("/api/feeds/provider-diff?invoice=gbp&commissioned_by=Acme%20Insurance%20Ltd"));
    expect(r.status).toBe(402);
    const b = await r.json();
    expect(b.kind).toBe("invoice-required");
    expect(b.currency).toBe("GBP");
    expect(b.issuer).toContain("16939677");
    expect(b.contact).toBe("nicholas@csoai.org");
    expect(b.commissioned_by).toBe("Acme-Insurance-Ltd");
    expect(b.reference).toBe("provider-diff/Acme-Insurance-Ltd/2026-09-05");
    expect(b.amount).toMatch(/stated on the invoice/);
    expect(b.options).toHaveLength(2);
    expect(r.headers.get("PAYMENT-REQUIRED")).toBeNull(); // an invoice is not an x402 challenge
    const text = JSON.stringify(b);
    expect(text).not.toMatch(MONEY);
    expect(text).not.toMatch(VERDICT);
  });

  it("?invoice=gbp without commissioned_by still answers, names the gap", async () => {
    stubStatic();
    const b = await (await feed(ctx("/api/feeds/provider-diff?invoice=gbp"))).json();
    expect(b.commissioned_by).toBeNull();
    expect(b.reference).toBe("provider-diff/unnamed/2026-09-05");
    expect(b.note_commissioned_by).toBeTruthy();
  });

  it("a settled receipt returns the assembled history from published bytes only", async () => {
    stubStatic((path) =>
      new Response(JSON.stringify(path.endsWith("/verify") ? { isValid: true } : { success: true, transaction: "0xabc", network: "eip155:8453", payer: "0xpayer" })),
    );
    const payment = btoa(JSON.stringify({ x402Version: 2, scheme: "exact", network: "eip155:8453", payload: {} }));
    const r = await feed(ctx("/api/feeds/provider-diff?history=1", { X402_FACILITATOR_URL: "https://f.example" }, { "x-payment": payment }));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.kind).toBe("history");
    expect(b.index.n_diffs_total).toBe(1);
    expect(b.leaves["/feeds/provider-diff/leaves/card-openai-terms-20260905T052000Z-unsigned.json"]).toMatchObject({ surface: "public.notice" });
    expect(b.root.merkle_root).toBe("r".repeat(64));
    expect(b.state.schema).toBe("csoai.provider-diff.state/0.1");
    expect(JSON.stringify(b)).not.toMatch(VERDICT);
  });
});

describe("SKU", () => {
  it("provider_diff_feed sells assembly on x402-or-invoice, never a grade", () => {
    const sku = SKUS.provider_diff_feed;
    expect(sku).toBeTruthy();
    expect(sku.rail).toBe("x402-or-invoice");
    expect(["assembly", "independent-signature", "throughput-and-cadence", "issuance"]).toContain(sku.sells);
    expect(sku.prices.history_batch.label).toBe("ESTIMATE");
    expect(sku.prices.partner_feed_yr.label).toBe("ESTIMATE");
    expect(sku.artifact).not.toMatch(VERDICT);
  });
});
