// /api/footprint — the funnel's states, and the two things that were lying on 2026-09-22.
//
//  1. gross_distribution fanned out to a five-name PyPI list inside the request, four names
//     answered `http 429`, and the endpoint published PARTIAL 69307 as this estate's
//     distribution. It now reads a measured artifact and cannot fan out at all: the tests below
//     assert the endpoint makes no package request, that it reports the artifact's own as_of,
//     that it says STALE when the artifact is older than the max age the artifact declares, and
//     that the 30-day and cumulative windows stay in separate rows.
//  2. registry_listings walked 14 pages inside a Cloudflare request; the 25 s budget made the
//     result a partial count and held a cold request open. It now reads the dated off-edge census,
//     preserves the measurement time, and labels an old or invalid census honestly.
//
// Everywhere: a failed upstream is UNCHECKABLE with value null, never 0; sums are over what
// answered and say so.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  DISTRIBUTION_PATH,
  REGISTRY_CENSUS_MAX_AGE_HOURS,
  REGISTRY_CENSUS_PATH,
  TTL_SECONDS,
  _resetCache,
  ageHours,
  artifactRow,
  buildFootprint,
  getFootprint,
  grossDistribution,
  onRequestGet,
  registryListings,
  type Deps,
} from "./footprint";
import packages from "../../public/interop/footprint-packages.json";
import distribution from "../../public/interop/distribution-latest.json";
import registryCensus from "../../public/interop/mcp-registry-2026-09-23/census.json";
import registryLatest from "../../public/interop/mcp-registry-latest.json";

const ORIGIN = "https://councilof.ai";
const NOW = "2026-09-23T10:00:00.000Z";

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

const revenueBody = (over: Record<string, unknown> = {}) => ({
  schema: "csoai.revenue/0.1",
  one_number: { id: "distinct_nonself_payers", status: "MEASURED", records_unreadable: 0, all_time: 2, last_30d: 1, ...over },
});
const healthy = (): Record<string, Route> => ({
  "/api/revenue": () => Response.json(revenueBody()),
  "/api/gspc": () =>
    Response.json({
      as_of: "2026-09-21T00:00:00Z",
      totals: { axes: 23, measured_axes: 23, unmeasured_axes: 0, public_count: "23 axis · 23 measured" },
    }),
  "/api/state": () =>
    Response.json({ card_chain: { bodies_verified_valid: { value: 335, kind: "measured", as_of: "2026-09-05", as_of_field: "as_of" } } }),
  "api.github.com": () => Response.json({ stargazers_count: 4 }),
});

const deps = (routes: Record<string, Route>, calls: string[] = []): Deps => ({
  fetch: fakeFetch(routes, calls),
  now: () => NOW,
  origin: ORIGIN,
});

beforeEach(() => _resetCache());
afterEach(() => vi.clearAllMocks());

// ── the artifact the endpoint reads out ──────────────────────────────────────
const artifact = (over: Record<string, unknown> = {}) => ({
  schema: "csoai.distribution/0.1",
  as_of: "2026-09-22T11:00:00Z",
  max_age_hours: 48,
  generator: "scripts/distribution-measure.py",
  window_rule: "30-day and cumulative are different windows and are never added to each other.",
  registries: {
    pypi: {
      downloads_30d: { state: "READ", value: 200, unit: "downloads", window: "2026-08-23..2026-09-21 (30 complete UTC days)", covered: 397, attempted: 397, as_of: "2026-09-22T11:00:00Z", source_url: "https://pepy.tech/api/v2/projects/<name>" },
      downloads_all_time: { state: "READ", value: 2000, unit: "downloads", window: "cumulative, all time", covered: 397, attempted: 397, as_of: "2026-09-22T11:00:00Z" },
    },
    npm: {
      downloads_30d: { state: "PARTIAL", value: 30, unit: "downloads", window: "last month", covered: 300, attempted: 324, as_of: "2026-09-22T11:00:00Z", reason: "npm 30-day: 300 of 324 counters answered" },
      downloads_all_time: { state: "UNCHECKABLE", value: null, unit: "downloads", window: "cumulative", covered: 0, attempted: 324, as_of: null, reason: "npm cumulative: none of 324 counters answered" },
    },
  },
  totals: {
    downloads_30d: { state: "PARTIAL", value: 230, unit: "downloads", window: "last 30 days", covered: 697, attempted: 721, as_of: "2026-09-22T11:00:00Z", reason: "lower bound over 697 of 721 packages", registries_covered: ["pypi", "npm"], registries_partial: ["npm"] },
    downloads_all_time: { state: "PARTIAL", value: 2000, unit: "downloads", window: "cumulative, all time", covered: 397, attempted: 721, as_of: "2026-09-22T11:00:00Z", registries_covered: ["pypi"], registries_missing: ["npm"] },
  },
  by_entity: { downloads_30d: { csoai: { state: "READ", value: 100, covered: 24, attempted: 24 } } },
  requests: { made: 730, retried_after_429_or_5xx: 3 },
  package_list: { totals: { pypi: 397, npm: 324, huggingface: 111 } },
  ...over,
});

describe("gross_distribution — read out of the measured artifact, never fanned out", () => {
  it("makes no package request: the counters were measured on the pod, not in the request", async () => {
    const calls: string[] = [];
    await buildFootprint(deps(healthy(), calls));
    for (const bad of ["pypistats.org", "pepy.tech", "api.npmjs.org", "huggingface.co/api/"]) {
      expect(calls.filter((c) => c.includes(bad))).toHaveLength(0);
    }
  });

  it("carries the artifact's as_of, not the request's, and names the evidence artifact", () => {
    const row = grossDistribution(NOW, artifact());
    expect(row.as_of).toBe("2026-09-22T11:00:00Z");
    expect(row.as_of).not.toBe(NOW);
    expect(row.evidence_url).toBe(DISTRIBUTION_PATH);
    expect(row.measured_by).toContain("distribution-measure.py");
  });

  it("keeps 30-day and cumulative in separate rows and never adds them", () => {
    const row = grossDistribution(NOW, artifact());
    expect(row.downloads_30d).toMatchObject({ value: 230, window: "last 30 days" });
    expect(row.downloads_all_time).toMatchObject({ value: 2000, window: "cumulative, all time" });
    // The headline is the 30-day figure, not a sum of the two windows.
    expect(row.value).toBe(230);
    expect(row.value).not.toBe(230 + 2000);
    expect(String(row.windows_rule)).toContain("never added");
  });

  it("carries covered/attempted on the face of every fan-out row", () => {
    const row = grossDistribution(NOW, artifact());
    expect(row).toMatchObject({ covered: 697, attempted: 721 });
    const npm30 = (row.by_registry as Record<string, Record<string, Record<string, unknown>>>).npm.downloads_30d;
    expect(npm30).toMatchObject({ state: "PARTIAL", value: 30, covered: 300, attempted: 324 });
  });

  it("a PARTIAL registry stays PARTIAL in by_registry; the roll-up does not hide it", () => {
    const by = grossDistribution(NOW, artifact()).by_registry as Record<string, Record<string, Record<string, unknown>>>;
    expect(by.pypi.downloads_30d.state).toBe("READ");
    expect(by.npm.downloads_30d.state).toBe("PARTIAL");
    expect(by.npm.downloads_all_time).toMatchObject({ state: "UNCHECKABLE", value: null });
  });

  it("an UNCHECKABLE artifact row stays null — never 0", () => {
    const row = artifactRow(artifact(), (a) => a.registries?.npm?.downloads_all_time, "npm cumulative", NOW);
    expect(row.state).toBe("UNCHECKABLE");
    expect(row.value).toBeNull();
    expect(row.value).not.toBe(0);
  });

  it("a row the artifact does not carry is UNCHECKABLE, not a silent zero", () => {
    const row = artifactRow(artifact({ totals: {} }), (a) => a.totals?.downloads_30d, "30-day", NOW);
    expect(row).toMatchObject({ state: "UNCHECKABLE", value: null });
    expect(String(row.reason)).toContain("no row for this window");
  });

  it("a state this endpoint does not know is UNCHECKABLE, never trusted through", () => {
    const bad = artifact({ totals: { downloads_30d: { state: "MEASURED", value: 9_999_999 } } });
    const row = artifactRow(bad, (a) => a.totals?.downloads_30d, "30-day", NOW);
    expect(row.state).toBe("UNCHECKABLE");
    expect(row.value).toBeNull();
  });

  it("an UNMEASURED artifact row stays UNMEASURED, with its own reason", () => {
    const a = artifact({ totals: { downloads_30d: { state: "UNMEASURED", value: null, reason: "no counter exists" } } });
    const row = artifactRow(a, (x) => x.totals?.downloads_30d, "30-day", NOW);
    expect(row).toMatchObject({ state: "UNMEASURED", value: null, reason: "no counter exists" });
  });
});

describe("gross_distribution — STALE when the artifact is older than the age it declares", () => {
  it("inside the declared max age it keeps the measured state", () => {
    const row = grossDistribution("2026-09-23T10:00:00Z", artifact()); // 23 h < 48 h
    expect(row.state).toBe("PARTIAL");
    expect(row.age_hours).toBeCloseTo(23, 1);
  });

  it("past it the row is STALE, keeps the real number, and says how old it is", () => {
    const row = grossDistribution("2026-09-25T11:00:00Z", artifact()); // 72 h > 48 h
    expect(row.state).toBe("STALE");
    expect(row.value).toBe(230); // the number is what was measured, not a null and not a guess
    expect(row.age_hours).toBeCloseTo(72, 1);
    expect(String(row.reason)).toContain("48 h");
    expect(row.measured_state).toBe("PARTIAL"); // what it was before it went stale is not lost
  });

  it("STALE outranks PARTIAL — out of date is the first thing a reader must be told", () => {
    const row = grossDistribution("2026-09-25T11:00:00Z", artifact());
    expect(row.state).not.toBe("PARTIAL");
    expect(row.state).toBe("STALE");
  });

  it("an artifact that declares no max age is never called stale on a guess", () => {
    const row = grossDistribution("2030-01-01T00:00:00Z", artifact({ max_age_hours: undefined }));
    expect(row.state).toBe("PARTIAL");
    expect(row.max_age_hours).toBeNull();
  });

  it("ageHours refuses to invent an age from an unparseable as_of", () => {
    expect(ageHours(undefined, NOW)).toBeNull();
    expect(ageHours("not a date", NOW)).toBeNull();
    expect(ageHours("2026-09-22T11:00:00Z", "2026-09-22T12:00:00Z")).toBeCloseTo(1, 6);
  });
});

describe("the committed artifact on disk", () => {
  const art = distribution as Record<string, unknown>;

  it("is the shape the endpoint reads, with a max age it declares for itself", () => {
    expect(art.schema).toBe("csoai.distribution/0.1");
    expect(typeof art.as_of).toBe("string");
    expect(typeof art.max_age_hours).toBe("number");
  });

  it("carries covered/attempted and a window on every total, and never one sum over two windows", () => {
    const totals = art.totals as Record<string, Record<string, unknown>>;
    for (const key of ["downloads_30d", "downloads_all_time"]) {
      const row = totals[key];
      expect(typeof row.state).toBe("string");
      expect(typeof row.window).toBe("string");
      expect(typeof row.covered).toBe("number");
      expect(typeof row.attempted).toBe("number");
      expect(row.covered as number).toBeLessThanOrEqual(row.attempted as number);
    }
    expect(totals.downloads_30d.window).not.toBe(totals.downloads_all_time.window);
  });

  it("measured more packages than the five-name grep the endpoint used to sum", () => {
    // The defect this lane closed: `attempted` was 5 on PyPI. The confirmed list is the estate.
    expect((art.totals as Record<string, Record<string, number>>).downloads_30d.attempted).toBeGreaterThan(700);
    expect(packages.totals.pypi).toBeGreaterThan(300);
  });

  it("every package row carries a state-bearing pair of windows, never a bare number", () => {
    for (const p of (art.packages as Record<string, unknown>[]).slice(0, 50)) {
      expect(p).toHaveProperty("downloads_30d");
      expect(p).toHaveProperty("downloads_all_time");
      expect(typeof p.source_url).toBe("string");
    }
  });
});

describe("registry_listings — read a dated, complete off-edge census", () => {
  it("reads the pointer's distinct names and version rows with the source measurement's timestamp", () => {
    const row = registryListings(NOW);
    expect(row).toMatchObject({
      state: "READ",
      value: registryLatest.servers,
      versions: registryLatest.version_rows,
      as_of: registryLatest.completed_utc,
      source_url: registryLatest.source_artifact,
      latest_url: REGISTRY_CENSUS_PATH,
      upstream_url: expect.stringContaining("registry.modelcontextprotocol.io"),
    });
    expect(row.value).toBe(354);
    expect(row.versions).toBe(1342);
    expect(row.as_of).not.toBe(NOW);
  });

  it("committed latest pointer matches the immutable source's exact bytes and measured fields", () => {
    const raw = readFileSync(resolve(__dirname, "../../public", registryLatest.source_artifact.slice(1)));
    expect(createHash("sha256").update(raw).digest("hex")).toBe(registryLatest.source_sha256);
    expect(raw.byteLength).toBe(registryLatest.source_bytes);
    expect(JSON.parse(raw.toString("utf8"))).toMatchObject({
      servers: registryLatest.servers,
      version_rows: registryLatest.version_rows,
      measured_utc: registryLatest.measured_utc,
      completed_utc: registryLatest.completed_utc,
    });
    expect(registryCensus.servers).toBe(registryLatest.servers);
  });

  it("makes no registry request when the whole footprint is built", async () => {
    const calls: string[] = [];
    await buildFootprint(deps(healthy(), calls));
    expect(calls.some((url) => url.includes("registry.modelcontextprotocol.io"))).toBe(false);
  });

  it("shows an old census as STALE without discarding its measured count", () => {
    const staleAt = new Date(Date.parse(registryLatest.completed_utc) + (REGISTRY_CENSUS_MAX_AGE_HOURS + 1) * 3_600_000).toISOString();
    const row = registryListings(staleAt);
    expect(row).toMatchObject({ state: "STALE", value: 354, versions: 1342, as_of: registryLatest.completed_utc });
    expect(String(row.reason)).toContain("freshness policy");
  });

  it("does not label a census stale exactly at the policy boundary", () => {
    const boundary = new Date(Date.parse(registryLatest.completed_utc) + REGISTRY_CENSUS_MAX_AGE_HOURS * 3_600_000).toISOString();
    expect(registryListings(boundary).state).toBe("READ");
  });

  it("rejects a wrong schema, namespace, count or timestamp as UNCHECKABLE, never zero", () => {
    for (const bad of [
      { ...registryLatest, schema: "other" },
      { ...registryLatest, namespace: "io.github.someone-else" },
      { ...registryLatest, source_artifact: "/interop/../secret.json" },
      { ...registryLatest, source_sha256: "bad" },
      { ...registryLatest, servers: -1 },
      { ...registryLatest, servers: "354" },
      { ...registryLatest, completed_utc: "not-a-date" },
      null,
    ]) {
      expect(registryListings(NOW, bad)).toMatchObject({ state: "UNCHECKABLE", value: null, source_url: REGISTRY_CENSUS_PATH });
    }
  });

  it("keeps a complete server count but withholds incomplete version totals", () => {
    const row = registryListings(NOW, { ...registryLatest, version_rows: null, version_read_failures: ["one-server"] });
    expect(row).toMatchObject({ state: "READ", value: 354, versions: null, versions_state: "UNCHECKABLE" });
  });
});

describe("/api/footprint — the same-origin rows", () => {
  it("reads each stage from its own source and never derives one from another", async () => {
    const p = await buildFootprint(deps(healthy()));
    expect(p.registry_listings).toMatchObject({ state: "READ", value: 354 });
    expect(p.economic_use).toMatchObject({ state: "READ", value: 2 });
    expect(p.board).toMatchObject({ state: "READ", value: "23 axis · 23 measured" });
    expect(p.signed_cards).toMatchObject({ state: "READ", value: 335 });
    expect(p.github_stars).toMatchObject({ state: "READ", value: 4 });
    expect(p.qualified_distribution.state).toBe("UNMEASURED");
    expect(p.observed_execution.state).toBe("UNMEASURED");
    expect(p.repeat_payers.state).toBe("UNMEASURED");
    expect(p.institutional_use.state).toBe("UNMEASURED");
  });

  it("null one_number → UNCHECKABLE with the revenue surface's own reason", async () => {
    const p = await buildFootprint(
      deps({ ...healthy(), "/api/revenue": () => Response.json(revenueBody({ status: "UNCHECKABLE", all_time: null, source: "kv unavailable" })) }),
    );
    expect(p.economic_use).toMatchObject({ state: "UNCHECKABLE", value: null });
    expect(String(p.economic_use.reason)).toContain("kv unavailable");
  });

  it("a gated /api/revenue (401) is UNCHECKABLE, not 0", async () => {
    const p = await buildFootprint(deps({ ...healthy(), "/api/revenue": () => new Response("no", { status: 401 }) }));
    expect(p.economic_use).toMatchObject({ state: "UNCHECKABLE", value: null });
    expect(p.economic_use.value).not.toBe(0);
  });

  it("a measured zero is a real zero only when the store answered", async () => {
    const p = await buildFootprint(deps({ ...healthy(), "/api/revenue": () => Response.json(revenueBody({ all_time: 0, last_30d: 0 })) }));
    expect(p.economic_use).toMatchObject({ state: "READ", value: 0 });
  });

  it("github 404 (the account flag) → UNCHECKABLE carrying the code, never a bare number", async () => {
    const p = await buildFootprint(deps({ ...healthy(), "api.github.com": () => new Response("nf", { status: 404 }) }));
    expect(p.github_stars).toMatchObject({ state: "UNCHECKABLE", value: null, http_status: 404 });
  });

  it("a thrown fetch does not take the other rows down", async () => {
    const p = await buildFootprint(
      deps({
        ...healthy(),
        "api.github.com": () => {
          throw new TypeError("network");
        },
      }),
    );
    expect(p.github_stars.state).toBe("UNCHECKABLE");
    expect(p.economic_use.state).toBe("READ");
  });
});

describe("/api/footprint — cache and handler", () => {
  it("serves from memory within the TTL and refetches after it", async () => {
    const calls: string[] = [];
    const d = deps(healthy(), calls);
    await getFootprint(d, 0);
    const n = calls.length;
    const hit = await getFootprint(d, TTL_SECONDS * 1000 - 1);
    expect(hit.cache).toBe("HIT");
    expect(calls.length).toBe(n);
    const miss = await getFootprint(d, TTL_SECONDS * 1000 + 1);
    expect(miss.cache).toBe("MISS");
    expect(calls.length).toBeGreaterThan(n);
  });

  it("the handler answers JSON with a one-hour public cache-control", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = fakeFetch(healthy());
    try {
      const res = await (onRequestGet as (c: { request: Request }) => Promise<Response>)({ request: new Request(`${ORIGIN}/api/footprint`) });
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe(`public, max-age=${TTL_SECONDS}`);
      const body = (await res.json()) as Record<string, Record<string, unknown>>;
      expect(body.gross_distribution.evidence_url).toBe(DISTRIBUTION_PATH);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("never carries a certification word or a price", async () => {
    const p = await buildFootprint(deps(healthy()));
    const text = JSON.stringify(p);
    expect(text).not.toMatch(/certif/i);
    expect(text).not.toMatch(/[$£€]\s?\d/);
    // "downloads are not users and users are not customers" is the doctrine and must stay. What
    // must never happen is a row whose UNIT is people: a download count is not a headcount.
    for (const row of Object.values(p as Record<string, { unit?: unknown }>)) {
      if (row && typeof row === "object" && typeof row.unit === "string") {
        expect(row.unit).not.toMatch(/\busers?\b|\bpeople\b|\bhumans?\b/i);
      }
    }
    expect(String(p.gross_distribution.note)).toContain("not a count of people");
  });
});
