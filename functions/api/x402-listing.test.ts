import { describe, expect, it, vi } from "vitest";
import { isOurs, onRequestGet, readListing, routeKey, rowFrom } from "./x402-listing";

/**
 * The index reader, fed pages by hand. What it must never do: report a short read as absence,
 * report a thrown fetch as an empty index, or call a row ours because its description mentions
 * us. Presence is observed per row; absence is a finding only over the whole declared population.
 */

const ours = (path: string, lastUpdated = "2026-09-09T08:26:19.435Z") => ({
  resource: `https://councilof.ai${path}`,
  lastUpdated,
  x402Version: 2,
  serviceName: null,
  accepts: [{ amount: "0", maxTimeoutSeconds: 300, network: "eip155:8453" }],
  description: "CSOAI free door",
});
const theirs = (n: number) => ({
  resource: `https://example.test/r/${n}`,
  lastUpdated: "2026-09-01T00:00:00Z",
  x402Version: 2,
  accepts: [{ amount: "1", maxTimeoutSeconds: 60 }],
  description: "mentions councilof.ai in prose only",
});

function indexOf(items: unknown[], opts: { pageSize: number; totalOverride?: (offset: number) => number }) {
  const calls: string[] = [];
  const fetchImpl = vi.fn(async (url: string | URL | Request) => {
    const u = new URL(String(url));
    calls.push(u.search);
    const offset = Number(u.searchParams.get("offset"));
    const limit = Number(u.searchParams.get("limit"));
    expect(limit).toBe(opts.pageSize);
    const page = items.slice(offset, offset + limit);
    const total = opts.totalOverride ? opts.totalOverride(offset) : items.length;
    return new Response(JSON.stringify({ items: page, pagination: { limit, offset, total } }), { status: 200 });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe("/api/x402-listing reads the PayAI index for our doors", () => {
  it("walks every page, keeps only rows whose resource host is ours, and calls absence determinate", async () => {
    const items = [theirs(1), ours("/api/free-door"), ...Array.from({ length: 5 }, (_, i) => theirs(i + 2)), ours("/api/proof?bundle=1", "2026-09-07T04:58:52.174Z")];
    const { fetchImpl, calls } = indexOf(items, { pageSize: 3 });
    const r = await readListing(fetchImpl, { pageSize: 3 });
    expect(calls).toEqual(["?limit=3&offset=0", "?limit=3&offset=3", "?limit=3&offset=6"]);
    expect(r.kind).toBe("MEASURED");
    expect(r.declared_total).toBe(items.length);
    expect(r.scanned).toBe(items.length);
    expect(r.absence_determinate).toBe(true);
    expect(r.rows.map((x) => x.route_key)).toEqual(["https://councilof.ai/api/free-door", "https://councilof.ai/api/proof"]);
    expect(r.rows[1]).toMatchObject({ last_updated: "2026-09-07T04:58:52.174Z", amount: "0", max_timeout_seconds: 300, x402_version: 2 });
  });

  it("is UNCHECKABLE, never an empty finding, when the index answers an error mid-walk", async () => {
    let n = 0;
    const fetchImpl = vi.fn(async () => {
      n += 1;
      if (n === 1) return new Response(JSON.stringify({ items: [ours("/api/free-door"), theirs(1)], pagination: { total: 4 } }), { status: 200 });
      return new Response("upstream", { status: 502 });
    }) as unknown as typeof fetch;
    const r = await readListing(fetchImpl, { pageSize: 2 });
    expect(r.kind).toBe("UNCHECKABLE");
    expect(r.absence_determinate).toBe(false);
    expect(r.reason).toMatch(/HTTP 502 at offset 2/);
    // the row already seen is still reported — presence was observed
    expect(r.rows).toHaveLength(1);
  });

  it("is UNCHECKABLE when fetch throws, when the total moves, or when the index outgrows the page budget", async () => {
    const thrown = await readListing(vi.fn(async () => { throw new Error("socket hang up"); }) as unknown as typeof fetch);
    expect(thrown.kind).toBe("UNCHECKABLE");
    expect(thrown.reason).toMatch(/socket hang up/);

    const moving = indexOf([theirs(1), theirs(2), theirs(3), theirs(4)], { pageSize: 2, totalOverride: (offset) => (offset === 0 ? 4 : 5) });
    const r2 = await readListing(moving.fetchImpl, { pageSize: 2, maxPages: 2 });
    expect(r2.kind).toBe("UNCHECKABLE");
    expect(r2.reason).toMatch(/pages of 2|changed during the walk/);

    const big = indexOf(Array.from({ length: 10 }, (_, i) => theirs(i)), { pageSize: 2 });
    const r3 = await readListing(big.fetchImpl, { pageSize: 2, maxPages: 3 });
    expect(r3.kind).toBe("UNCHECKABLE");
    expect(r3.reason).toMatch(/larger than this reader walks \(3 pages of 2\)/);
    expect(r3.absence_determinate).toBe(false);
  });

  it("judges ours by the resource host, never by prose or by a resource object without a url", () => {
    expect(isOurs(theirs(1))).toBe(false);
    expect(isOurs(ours("/api/free-door"))).toBe(true);
    expect(isOurs({ resource: { url: "https://csoai.org/api/x" } })).toBe(true);
    expect(isOurs({ resource: { description: "councilof.ai" } })).toBe(false);
    expect(isOurs({ resource: "https://councilof.ai.evil.test/api/free-door" })).toBe(false);
    expect(routeKey("https://councilof.ai/api/proof/?bundle=1")).toBe("https://councilof.ai/api/proof");
    expect(rowFrom({ resource: "https://councilof.ai/api/x" })).toMatchObject({ last_updated: null, amount: null, max_timeout_seconds: null });
  });

  it("serves JSON with a short public cache only when the read was complete", async () => {
    const good = indexOf([ours("/api/free-door")], { pageSize: 500 });
    vi.stubGlobal("fetch", good.fetchImpl);
    try {
      const res = await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({ request: new Request("https://councilof.ai/api/x402-listing"), env: {} });
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe("public, max-age=300");
      const j = (await res.json()) as { schema: string; kind: string; index: { name: string } };
      expect(j.schema).toBe("csoai.x402-listing/0.1");
      expect(j.kind).toBe("MEASURED");
      expect(j.index.name).toBe("PayAI");
    } finally {
      vi.unstubAllGlobals();
    }
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 429 })));
    try {
      const res = await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({ request: new Request("https://councilof.ai/api/x402-listing"), env: {} });
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(((await res.json()) as { kind: string }).kind).toBe("UNCHECKABLE");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
