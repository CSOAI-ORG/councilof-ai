// /api/footprint — a failed upstream is UNCHECKABLE with value null, never 0; sums are over what
// answered and say so; the registry walk stops at its page cap; a null one_number is UNCHECKABLE.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  REGISTRY_PAGE_CAP,
  TTL_SECONDS,
  _resetCache,
  buildFootprint,
  getFootprint,
  onRequestGet,
  type Deps,
} from "./footprint";
import packages from "../../public/interop/footprint-packages.json";

const ORIGIN = "https://councilof.ai";
const NOW = "2026-09-22T12:00:00.000Z";

type Route = (url: string) => Response | Promise<Response>;

/** A fetch that answers by URL substring; anything unmatched is a 404. */
function fakeFetch(routes: Record<string, Route>, calls: string[] = []): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    for (const [needle, route] of Object.entries(routes)) {
      if (url.includes(needle)) return route(url);
    }
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;
}

const registryPage = (names: string[], nextCursor?: string) =>
  Response.json({
    servers: names.map((name) => ({ server: { name, version: "1.0.0" } })),
    metadata: { count: names.length, ...(nextCursor ? { nextCursor } : {}) },
  });

const healthy = (): Record<string, Route> => ({
  "registry.modelcontextprotocol.io": (url) =>
    url.includes("cursor=")
      ? registryPage(["io.github.CSOAI-ORG/b", "io.github.CSOAI-ORG/c", "io.github.someone-else/x"])
      : registryPage(["io.github.CSOAI-ORG/a", "io.github.CSOAI-ORG/b"], "page-2"),
  "pypistats.org": () => Response.json({ data: { last_day: 1, last_month: 100, last_week: 10 } }),
  "api.npmjs.org": () => Response.json({ downloads: 50 }),
  "huggingface.co/api/datasets": () =>
    Response.json([
      { id: "csoai/one", downloads: 7 },
      { id: "csoai/two", downloads: 3 },
    ]),
  "/api/revenue": () => Response.json({ one_number: { status: "MEASURED", all_time: 2, last_30d: 1 } }),
  "/api/gspc": () => Response.json({ as_of: "2026-09-21T00:00:00Z", totals: { axes: 23, measured_axes: 23, unmeasured_axes: 0, public_count: "23 axis · 23 measured" } }),
  "/api/state": () => Response.json({ card_chain: { bodies_verified_valid: { value: 335, kind: "measured", as_of: "2026-09-05", as_of_field: "as_of" } } }),
  "api.github.com": () => Response.json({ stargazers_count: 4 }),
});

const deps = (routes: Record<string, Route>, calls: string[] = []): Deps => ({
  fetch: fakeFetch(routes, calls),
  now: () => NOW,
  origin: ORIGIN,
});

const PYPI_N = packages.pypi.length;
const NPM_N = packages.npm.length;

beforeEach(() => _resetCache());
afterEach(() => vi.clearAllMocks());

describe("/api/footprint — every upstream answered", () => {
  it("reads each stage from its own source and sums correctly", async () => {
    const fp = await buildFootprint(deps(healthy()));

    expect(fp.schema).toBe("csoai.footprint/0.1");
    expect(fp.as_of).toBe(NOW);
    expect(fp.honesty).toMatch(/downloads are not users and users are not customers/);

    // registry: distinct CSOAI-ORG names across two pages; the other org is not ours.
    expect(fp.registry_listings.state).toBe("READ");
    expect(fp.registry_listings.value).toBe(3);
    expect(fp.registry_listings.pages_read).toBe(2);
    expect(fp.registry_listings.page_cap_hit).toBe(false);

    // gross: pypi 100 × N packages, npm 50 × N packages, HF 7 + 3.
    const g = fp.gross_distribution;
    expect(g.sources.pypi).toMatchObject({ state: "READ", value: 100 * PYPI_N, covered: PYPI_N, attempted: PYPI_N });
    expect(g.sources.npm).toMatchObject({ state: "READ", value: 50 * NPM_N, covered: NPM_N, attempted: NPM_N });
    expect(g.sources.huggingface).toMatchObject({ state: "READ", value: 10, datasets: 2 });
    expect(g.sum).toMatchObject({ state: "READ", value: 100 * PYPI_N + 50 * NPM_N + 10 });
    expect(g.kind).toMatch(/third-party counter/);

    expect(fp.economic_use).toMatchObject({ state: "READ", value: 2, last_30d: 1 });
    expect(fp.board).toMatchObject({ state: "READ", value: "23 axis · 23 measured", axes: 23, measured_axes: 23, as_of: "2026-09-21T00:00:00Z", as_of_field: "as_of" });
    expect(fp.signed_cards).toMatchObject({ state: "READ", value: 335, kind: "measured" });
    expect(fp.github_stars).toMatchObject({ state: "READ", value: 4, population: "councilof-ai repository stars at T" });

    // stages with no source are UNMEASURED, never 0.
    expect(fp.qualified_distribution.state).toBe("UNMEASURED");
    expect(fp.qualified_distribution.value).toBeNull();
    expect(fp.qualified_distribution.sampled_note).toMatch(/a sample, not the fleet/);
    expect(fp.observed_execution).toMatchObject({ state: "UNMEASURED", value: null });
    expect(fp.repeat_payers).toMatchObject({ state: "UNMEASURED", value: null });
    expect(fp.institutional_use).toMatchObject({ state: "UNMEASURED", value: null });

    // every row carries an as_of key and a source or a reason.
    for (const key of fp.funnel.order) {
      const row = fp[key] as Record<string, unknown>;
      expect(row, key).toHaveProperty("as_of");
      expect(Boolean(row.source_url) || Boolean(row.reason), key).toBe(true);
    }
  });
});

describe("/api/footprint — a failed upstream is UNCHECKABLE, not 0", () => {
  it("pypistats 429 → pypi row UNCHECKABLE with null, sum becomes a labelled lower bound", async () => {
    const routes = healthy();
    routes["pypistats.org"] = () => new Response("429 RATE LIMIT EXCEEDED", { status: 429 });
    const fp = await buildFootprint(deps(routes));
    const g = fp.gross_distribution;

    expect(g.sources.pypi.state).toBe("UNCHECKABLE");
    expect(g.sources.pypi.value).toBeNull();
    expect(g.sources.pypi.reason).toMatch(/none of \d+ counters answered/);
    expect(g.sources.pypi.covered).toBe(0);
    expect(g.sources.pypi.attempted).toBe(PYPI_N);

    expect(g.sum.state).toBe("PARTIAL");
    expect(g.sum.value).toBe(50 * NPM_N + 10);
    expect(g.sum.missing_sources).toEqual(["pypi"]);
    expect(g.sum.reason).toMatch(/lower bound/);
  });

  it("one package of a fan-out failing makes that source PARTIAL over the rest, never 0 for the missing one", async () => {
    const first = packages.pypi[0].name;
    const routes = healthy();
    routes["pypistats.org"] = (url) =>
      url.includes(`/${first}/`) ? new Response("", { status: 500 }) : Response.json({ data: { last_month: 100 } });
    const fp = await buildFootprint(deps(routes));
    const p = fp.gross_distribution.sources.pypi;

    expect(p.state).toBe("PARTIAL");
    expect(p.value).toBe(100 * (PYPI_N - 1));
    expect(p.covered).toBe(PYPI_N - 1);
    const missing = (p.packages as { name: string; value: number | null }[]).find((x) => x.name === first);
    expect(missing?.value).toBeNull();
  });

  it("every counter down → gross sum UNCHECKABLE with null", async () => {
    const routes = healthy();
    routes["pypistats.org"] = () => new Response("", { status: 503 });
    routes["api.npmjs.org"] = () => new Response("", { status: 503 });
    routes["huggingface.co/api/datasets"] = () => new Response("", { status: 503 });
    const fp = await buildFootprint(deps(routes));
    expect(fp.gross_distribution.sum).toMatchObject({ state: "UNCHECKABLE", value: null });
    expect(fp.gross_distribution.value).toBeNull();
  });

  it("a thrown fetch (network) is UNCHECKABLE with the reason, and does not take the other rows down", async () => {
    const routes = healthy();
    routes["api.github.com"] = () => {
      throw new TypeError("network down");
    };
    const fp = await buildFootprint(deps(routes));
    expect(fp.github_stars).toMatchObject({ state: "UNCHECKABLE", value: null });
    expect(fp.github_stars.reason).toMatch(/network down/);
    expect(fp.economic_use.state).toBe("READ");
  });

  it("github 404 (the account flag) → UNCHECKABLE carrying the code, never a bare number", async () => {
    const routes = healthy();
    routes["api.github.com"] = () => Response.json({ message: "Not Found" }, { status: 404 });
    const fp = await buildFootprint(deps(routes));
    expect(fp.github_stars).toMatchObject({ state: "UNCHECKABLE", value: null, http_status: 404 });
    expect(fp.github_stars.reason).toMatch(/http 404/);
  });

  it("a registry page failing midway is an unread listing, not a smaller one", async () => {
    const routes = healthy();
    routes["registry.modelcontextprotocol.io"] = (url) =>
      url.includes("cursor=") ? new Response("", { status: 502 }) : registryPage(["io.github.CSOAI-ORG/a"], "page-2");
    const fp = await buildFootprint(deps(routes));
    expect(fp.registry_listings).toMatchObject({ state: "UNCHECKABLE", value: null, pages_read: 1 });
    expect(fp.registry_listings.reason).toMatch(/registry page 2: http 502/);
  });

  it("a 200 that is not JSON is UNCHECKABLE", async () => {
    const routes = healthy();
    routes["/api/gspc"] = () => new Response("<!doctype html>", { status: 200 });
    const fp = await buildFootprint(deps(routes));
    expect(fp.board).toMatchObject({ state: "UNCHECKABLE", value: null });
    expect(fp.board.reason).toMatch(/not json/);
  });
});

describe("/api/footprint — economic use reads the one number", () => {
  it("null one_number → UNCHECKABLE with the revenue surface's own reason", async () => {
    const routes = healthy();
    routes["/api/revenue"] = () =>
      Response.json({ one_number: { status: "UNMEASURED", all_time: null, source: "no REVENUE_KV bound — nothing is recorded, so nothing is counted" } });
    const fp = await buildFootprint(deps(routes));
    expect(fp.economic_use.state).toBe("UNCHECKABLE");
    expect(fp.economic_use.value).toBeNull();
    expect(fp.economic_use.reason).toMatch(/UNMEASURED: no REVENUE_KV bound/);
  });

  it("a gated /api/revenue (401) is UNCHECKABLE, not 0", async () => {
    const routes = healthy();
    routes["/api/revenue"] = () => new Response("", { status: 401 });
    const fp = await buildFootprint(deps(routes));
    expect(fp.economic_use).toMatchObject({ state: "UNCHECKABLE", value: null });
    expect(fp.economic_use.reason).toMatch(/http 401/);
  });

  it("a measured zero is a real zero only when the store answered", async () => {
    const routes = healthy();
    routes["/api/revenue"] = () => Response.json({ one_number: { status: "MEASURED", all_time: 0, last_30d: 0 } });
    const fp = await buildFootprint(deps(routes));
    expect(fp.economic_use).toMatchObject({ state: "READ", value: 0 });
  });
});

describe("/api/footprint — registry pagination cap", () => {
  it("stops at the page cap and labels the count a lower bound", async () => {
    const calls: string[] = [];
    const routes = healthy();
    let page = 0;
    routes["registry.modelcontextprotocol.io"] = () => {
      page += 1;
      return registryPage([`io.github.CSOAI-ORG/s${page}`], `cursor-${page}`);
    };
    const fp = await buildFootprint(deps(routes, calls));

    const registryCalls = calls.filter((u) => u.includes("registry.modelcontextprotocol.io"));
    expect(registryCalls).toHaveLength(REGISTRY_PAGE_CAP);
    expect(fp.registry_listings).toMatchObject({ state: "PARTIAL", value: REGISTRY_PAGE_CAP, pages_read: REGISTRY_PAGE_CAP, page_cap_hit: true });
    expect(fp.registry_listings.reason).toMatch(/lower bound/);
  });

  it("stops when the cursor stops advancing", async () => {
    const calls: string[] = [];
    const routes = healthy();
    routes["registry.modelcontextprotocol.io"] = () => registryPage(["io.github.CSOAI-ORG/a"], "same");
    await buildFootprint(deps(routes, calls));
    expect(calls.filter((u) => u.includes("registry.modelcontextprotocol.io"))).toHaveLength(2);
  });
});

describe("/api/footprint — cache and handler", () => {
  it("serves from memory within the TTL and refetches after it", async () => {
    const calls: string[] = [];
    const d = deps(healthy(), calls);
    const t0 = 1_000_000;
    const a = await getFootprint(d, t0);
    const n = calls.length;
    const b = await getFootprint(d, t0 + (TTL_SECONDS - 1) * 1000);
    expect(a.cache).toBe("MISS");
    expect(b.cache).toBe("HIT");
    expect(calls.length).toBe(n);
    const c = await getFootprint(d, t0 + TTL_SECONDS * 1000 + 1);
    expect(c.cache).toBe("MISS");
    expect(calls.length).toBeGreaterThan(n);
  });

  it("the handler answers JSON with a one-hour public cache-control", async () => {
    vi.stubGlobal("fetch", fakeFetch(healthy()));
    try {
      const res = await onRequestGet({ request: new Request("https://councilof.ai/api/footprint") } as never);
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe(`public, max-age=${TTL_SECONDS}`);
      const body = (await res.json()) as { schema: string; economic_use: { value: unknown } };
      expect(body.schema).toBe("csoai.footprint/0.1");
      expect(body.economic_use.value).toBe(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("never carries a certification word or a price", async () => {
    const text = JSON.stringify(await buildFootprint(deps(healthy())));
    expect(text).not.toMatch(/certif|sovereign|\bBFT\b|byzantine/i);
    expect(text).not.toMatch(/[$£€]\s?\d/);
  });
});
