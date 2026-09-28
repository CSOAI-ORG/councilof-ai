import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  FOUR02_SCHEMA,
  isOurService,
  onRequestGet,
  readIndex402,
  rowFromService,
  type Index402Row,
} from "./x402-listing-402index";

/**
 * The 402 Index reader, fed the REAL pages. fixtures/402index/ holds two responses of
 * https://402index.io/api/v1/services?q=councilof.ai&limit=100&offset={0,100}, saved unedited on
 * 2026-09-22 (fetch time in the .meta.json beside them). Nothing about the shape is invented:
 * `total`, `limit`, `offset`, `services[].url`, `services[].health_status` are read as the index
 * wrote them. Counts asserted below are DERIVED from the fixture at test time, never typed.
 */

const FIX = resolve(__dirname, "../../fixtures/402index");
const page0 = JSON.parse(readFileSync(resolve(FIX, "services-q-councilof.ai-2026-09-22-offset-0.json"), "utf8")) as {
  services: Record<string, unknown>[];
  total: number;
  limit: number;
  offset: number;
};
const page100 = JSON.parse(readFileSync(resolve(FIX, "services-q-councilof.ai-2026-09-22-offset-100.json"), "utf8")) as typeof page0;
const meta = JSON.parse(readFileSync(resolve(FIX, "services-q-councilof.ai-2026-09-22.meta.json"), "utf8")) as { fetched_at: string; declared_total_at_fetch: number };

const REAL = [...page0.services, ...page100.services];
const OURS = REAL.filter((s) => typeof s.url === "string" && /^https:\/\/councilof\.ai\//.test(s.url));

/** Serve the saved pages exactly as the index did: offset → page, total as written. */
function realIndex(opts: { pageSize?: number; totalOverride?: (offset: number) => number; failAt?: number } = {}) {
  const calls: string[] = [];
  const fetchImpl = vi.fn(async (url: string | URL | Request) => {
    const u = new URL(String(url));
    calls.push(u.search);
    const offset = Number(u.searchParams.get("offset"));
    const limit = Number(u.searchParams.get("limit"));
    if (opts.failAt !== undefined && offset >= opts.failAt) return new Response("upstream", { status: 503 });
    const page = REAL.slice(offset, offset + limit);
    const total = opts.totalOverride ? opts.totalOverride(offset) : page0.total;
    return new Response(JSON.stringify({ services: page, total, limit, offset }), { status: 200 });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe("the saved 402 Index pages are the real shape", () => {
  it("carry total/limit/offset and services[] with url + health_status, and the sidecar records the fetch", () => {
    expect(page0).toMatchObject({ limit: 100, offset: 0 });
    expect(page100).toMatchObject({ limit: 100, offset: 100 });
    expect(page0.total).toBe(page100.total);
    expect(page0.services.length + page100.services.length).toBe(page0.total);
    expect(meta.declared_total_at_fetch).toBe(page0.total);
    expect(meta.fetched_at).toMatch(/^2026-09-22T\d\d:\d\d:\d\dZ$/);
    for (const s of REAL) {
      expect(typeof s.url).toBe("string");
      expect(typeof s.health_status).toBe("string");
    }
    // the search matched third parties too — their presence is what makes host-filtering necessary
    expect(OURS.length).toBeGreaterThan(0);
    expect(OURS.length).toBeLessThan(REAL.length);
  });
});

describe("/api/x402-listing-402index reads the 402 Index for our doors", () => {
  it("walks both real pages with q=councilof.ai, keeps only our host, and calls absence determinate", async () => {
    const { fetchImpl, calls } = realIndex();
    const r = await readIndex402(fetchImpl);
    expect(calls).toEqual(["?q=councilof.ai&limit=100&offset=0", "?q=councilof.ai&limit=100&offset=100"]);
    expect(r.schema).toBe(FOUR02_SCHEMA);
    expect(r.kind).toBe("MEASURED");
    expect(r.index).toEqual({ name: "402 Index", url: "https://402index.io/api/v1/services", query: "councilof.ai" });
    expect(r.declared_total).toBe(page0.total);
    expect(r.scanned).toBe(page0.total);
    expect(r.pages).toBe(2);
    expect(r.absence_determinate).toBe(true);
    expect(r.rows).toHaveLength(OURS.length);
    expect(new Set(r.rows.map((x) => x.url))).toEqual(new Set(OURS.map((s) => s.url)));
    // the free door is in the real response; its row is read field by field from the index's bytes
    const free = r.rows.find((x) => x.url === "https://councilof.ai/api/free-door") as Index402Row;
    const realFree = OURS.find((s) => s.url === "https://councilof.ai/api/free-door")!;
    expect(free).toBeTruthy();
    expect(free.health_status).toBe(realFree.health_status);
    expect(free.last_checked).toBe(realFree.last_checked);
    expect(free.route_key).toBe("https://councilof.ai/api/free-door");
    expect(free.domain_verified).toBe(realFree.domain_verified === 1);
    // a door with a query keeps its full url and a bare route key
    const proof = r.rows.find((x) => x.url === "https://councilof.ai/api/proof?bundle=1")!;
    expect(proof.route_key).toBe("https://councilof.ai/api/proof");
    // sorted by url, so the reading is byte-stable for the same index state
    expect(r.rows.map((x) => x.url)).toEqual([...r.rows.map((x) => x.url)].sort((a, b) => a.localeCompare(b)));
  });

  it("is UNCHECKABLE, never an empty finding, when the second page fails — rows already seen stay", async () => {
    const { fetchImpl } = realIndex({ failAt: 100 });
    const r = await readIndex402(fetchImpl);
    expect(r.kind).toBe("UNCHECKABLE");
    expect(r.absence_determinate).toBe(false);
    expect(r.reason).toMatch(/HTTP 503 at offset 100/);
    expect(r.scanned).toBe(100);
    expect(r.rows.length).toBe(OURS.filter((s) => page0.services.includes(s)).length);
  });

  it("is UNCHECKABLE when fetch throws, when total moves, when the shape is wrong, or when the walk exceeds its page budget", async () => {
    const thrown = await readIndex402(vi.fn(async () => { throw new Error("socket hang up"); }) as unknown as typeof fetch);
    expect(thrown.kind).toBe("UNCHECKABLE");
    expect(thrown.reason).toMatch(/socket hang up/);
    expect(thrown.rows).toEqual([]);

    const moving = realIndex({ totalOverride: (offset) => (offset === 0 ? page0.total : page0.total + 1) });
    const r2 = await readIndex402(moving.fetchImpl, { maxPages: 3 });
    expect(r2.kind).toBe("UNCHECKABLE");
    expect(r2.reason).toMatch(/total changed during the walk|larger than this reader walks|empty page at offset \d+ before the declared total/);
    expect(r2.absence_determinate).toBe(false);

    const wrong = vi.fn(async () => new Response(JSON.stringify({ items: [], pagination: { total: 0 } }), { status: 200 })) as unknown as typeof fetch;
    const r3 = await readIndex402(wrong);
    expect(r3.kind).toBe("UNCHECKABLE");
    expect(r3.reason).toMatch(/lacked services\[\] or an integer total/);

    const budget = await readIndex402(realIndex().fetchImpl, { maxPages: 1 });
    expect(budget.kind).toBe("UNCHECKABLE");
    expect(budget.reason).toMatch(/larger than this reader walks \(1 pages of 100\)/);
    expect(budget.rows.length).toBeGreaterThan(0);

    const empty = vi.fn(async () => new Response(JSON.stringify({ services: [], total: 5, limit: 100, offset: 0 }), { status: 200 })) as unknown as typeof fetch;
    const r4 = await readIndex402(empty);
    expect(r4.kind).toBe("UNCHECKABLE");
    expect(r4.reason).toMatch(/empty page at offset 0 before the declared total 5/);
  });

  it("an empty search read in full is a determinate absence, not an error", async () => {
    const none = vi.fn(async () => new Response(JSON.stringify({ services: [], total: 0, limit: 100, offset: 0 }), { status: 200 })) as unknown as typeof fetch;
    const r = await readIndex402(none);
    expect(r.kind).toBe("MEASURED");
    expect(r.absence_determinate).toBe(true);
    expect(r.rows).toEqual([]);
    expect(r.declared_total).toBe(0);
  });

  it("judges ours by the url host only, and reads a row's fields without inventing any", () => {
    expect(isOurService({ url: "https://councilof.ai/api/free-door" })).toBe(true);
    expect(isOurService({ url: "https://csoai.org/api/x" })).toBe(true);
    expect(isOurService({ url: "https://councilof.ai.evil.test/api/free-door" })).toBe(false);
    expect(isOurService({ name: "councilof.ai", description: "mentions councilof.ai", url: "https://example.test/x" })).toBe(false);
    expect(isOurService({ url: 42 })).toBe(false);
    expect(isOurService(null)).toBe(false);
    expect(rowFromService({ url: "https://councilof.ai/api/x" })).toEqual({
      url: "https://councilof.ai/api/x",
      route_key: "https://councilof.ai/api/x",
      health_status: null,
      probe_status: null,
      last_checked: null,
      registered_at: null,
      domain_verified: null,
      id: null,
      name: null,
    });
    expect(rowFromService({ url: "https://councilof.ai/api/x", domain_verified: 0 }).domain_verified).toBe(false);
    expect(rowFromService({ url: "https://councilof.ai/api/x", domain_verified: 1 }).domain_verified).toBe(true);
  });

  it("serves JSON with a ten-minute public cache only when the read was complete", async () => {
    vi.stubGlobal("fetch", realIndex().fetchImpl);
    try {
      const res = await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({ request: new Request("https://councilof.ai/api/x402-listing-402index"), env: {} });
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe("public, max-age=600");
      const j = (await res.json()) as { schema: string; kind: string; index: { name: string }; rows: unknown[] };
      expect(j.schema).toBe(FOUR02_SCHEMA);
      expect(j.kind).toBe("MEASURED");
      expect(j.index.name).toBe("402 Index");
      expect(j.rows).toHaveLength(OURS.length);
    } finally {
      vi.unstubAllGlobals();
    }
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 429 })));
    try {
      const res = await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({ request: new Request("https://councilof.ai/api/x402-listing-402index"), env: {} });
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(((await res.json()) as { kind: string }).kind).toBe("UNCHECKABLE");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
