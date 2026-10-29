import { afterEach, describe, expect, it, vi } from "vitest";
import { offlineEvmFetch } from "./__fixtures__/offline-evm-fetch";
import { onRequestGet as catalogueGet } from "./x402";
import { onRequestGet as manifestGet } from "../.well-known/x402.json";
import { onRequest as fanOutGet } from "../.well-known/x402";

/**
 * THE UNPAID-POST PROBE — EVERY CATALOGUED DOOR MUST ANSWER 402 BEFORE IT VALIDATES.
 *
 * x402 directories do not browse: they send `POST {}` with no payment header and read the status.
 * x402scan's discovery spec (github.com/Merit-Systems/x402scan, docs/DISCOVERY.md) lists the
 * failure verbatim — "Expected 402, got 400 from request validation running before payment
 * challenge", "Expected 402, got 404/405/429" — and Coinbase's Bazaar validator disqualifies a
 * resource for the same reason (a free tier that answered 200 read as "not payable"). Measured
 * 2026-10-09 01:54–02:30 UTC against production, four doors failed that probe:
 *
 *   POST /api/art50/marking-evidence            400  input parsed before the challenge
 *   POST /api/wrapper/changes?id=<pair>         404  the file exported no POST handler
 *   POST /api/wrapper?id=<off-roster pair>       404  pair lookup before the challenge
 *   POST /api/signed-data-feed                   200  bare path served the free preview
 *   POST /api/feeds/provider-diff                200  bare path served the free preview
 *
 * This test is the ratchet. It takes the door list FROM THE LISTING HANDLER (the same one
 * /.well-known/x402.json and /api/x402 are asserted against), calls each door's OWN onRequestPost
 * with an unpaid `POST {}`, and fails if anything answers other than 402 with a non-empty
 * accepts[] and the extensions.bazaar block a Bazaar indexer reads. Nothing is stubbed but the
 * network, so a door is judged on its challenge, not on the internet.
 *
 * WHAT IT DELIBERATELY DOES NOT REQUIRE: GET is untouched by the fix — the published free
 * previews (bare /api/signed-data-feed, bare /api/feeds/provider-diff, ?preview=1 doors) still
 * answer 200, and the catalogue's free_forever surfaces (/api/gspc, /api/fines, /api/commissions,
 * /api/verify, /api/x402/index …) are not doors and are not in this list. The second half of the
 * file pins the other side of the contract: a request that DOES carry a payment header takes
 * exactly the path it took before this fix.
 */

const ORIGIN = "https://councilof.ai";
const ENV = { X402_PROMO_NOW: "2026-09-26T00:00:00Z" };
/** What a paying client presents. Pairs with hasPaymentHeader() in functions/api/_x402.ts. */
const PAYMENT = { "x-payment": btoa(JSON.stringify({ x402Version: 2, scheme: "exact", network: "eip155:8453", payload: {} })) };

type Handler = {
  onRequestGet?: (c: unknown) => Promise<Response>;
  onRequestPost?: (c: unknown) => Promise<Response>;
};

const ctx = (request: Request) => ({ request, env: ENV, params: {} });

/** Same mapping functions/.well-known/x402-listing-parity.test.ts uses, rooted at functions/api. */
const moduleFor = (pathname: string) => `.${pathname.replace(/^\/api/, "")}`;

async function door(pathname: string): Promise<Handler> {
  return (await import(/* @vite-ignore */ moduleFor(pathname))) as Handler;
}

async function listedResources(): Promise<{ url: string }[]> {
  const r = (await manifestGet(ctx(new Request(`${ORIGIN}/.well-known/x402.json`)) as never)) as Response;
  return ((await r.json()) as { resources: { url: string }[] }).resources;
}

type Probe = { status: number; body: Record<string, unknown> };

async function post(url: string, headers: Record<string, string> = {}): Promise<Probe> {
  const u = new URL(url);
  const mod = await door(u.pathname);
  if (typeof mod.onRequestPost !== "function")
    return { status: -1, body: { __error: `no onRequestPost exported by ${moduleFor(u.pathname)}` } };
  const res = await mod.onRequestPost(
    ctx(
      new Request(u.toString(), {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: "{}",
      }),
    ),
  );
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    body = { __unparsable: text.slice(0, 200) };
  }
  return { status: res.status, body };
}

const accepts = (b: Record<string, unknown>) => (Array.isArray(b.accepts) ? (b.accepts as unknown[]) : []);
const extensions = (b: Record<string, unknown>) => (b.extensions && typeof b.extensions === "object" ? (b.extensions as Record<string, unknown>) : {});

afterEach(() => vi.unstubAllGlobals());

describe("unpaid POST {} — the directory-validator probe, for every listed resource", () => {
  it("answers 402 with accepts[] ≥ 1 and extensions.bazaar, door by door", async () => {
    vi.stubGlobal("fetch", offlineEvmFetch);
    const failures: string[] = [];
    let checked = 0;
    for (const r of await listedResources()) {
      const { status, body } = await post(r.url);
      if (status !== 402) {
        failures.push(`${r.url}: answered ${status}, expected 402`);
        continue;
      }
      if (accepts(body).length < 1) failures.push(`${r.url}: 402 carries no accepts[]`);
      if (!("bazaar" in extensions(body))) failures.push(`${r.url}: 402 carries no extensions.bazaar`);
      checked++;
    }
    expect(failures, `\n  ${failures.join("\n  ")}\n`).toEqual([]);
    // The listing is the door list; if it ever collapses, this must not pass vacuously.
    expect(checked).toBeGreaterThanOrEqual(30);
    // 31 doors, each imported and called: the default 5s is a CPU-contention coin flip, not a verdict.
    }, 60_000);

  it("takes the challenge before input validation, even when the input is unusable", async () => {
    vi.stubGlobal("fetch", offlineEvmFetch);
    const cases: [string, string][] = [
      // the five measured failures, with the input that used to decide the status
      [`${ORIGIN}/api/art50/marking-evidence?url=https://councilof.ai/og-image.png`, "query url present, body empty"],
      [`${ORIGIN}/api/art50/marking-evidence`, "no input at all"],
      [`${ORIGIN}/api/wrapper/changes?id=usdc.e:arbitrum`, "pair the roster carries"],
      [`${ORIGIN}/api/wrapper/changes`, "no id at all"],
      [`${ORIGIN}/api/wrapper?id=usdc:ethereum`, "off-roster pair (was 404)"],
      [`${ORIGIN}/api/wrapper?id=usdc.e:arbitrum%3C`, "malformed pair id (was 400)"],
      [`${ORIGIN}/api/signed-data-feed`, "bare path (was 200 preview)"],
      [`${ORIGIN}/api/feeds/provider-diff`, "bare path (was 200 preview)"],
    ];
    const failures: string[] = [];
    for (const [url, why] of cases) {
      const { status, body } = await post(url);
      if (status !== 402) failures.push(`${url} (${why}): answered ${status}, expected 402`);
      else if (accepts(body).length < 1) failures.push(`${url} (${why}): 402 carries no accepts[]`);
    }
    expect(failures, `\n  ${failures.join("\n  ")}\n`).toEqual([]);
  }, 60_000);
});

describe("GET free surfaces are untouched by the 402-first fix", () => {
  it("bare GET /api/signed-data-feed still serves the published free preview", async () => {
    vi.stubGlobal("fetch", offlineEvmFetch);
    const mod = await door("/api/signed-data-feed");
    const res = await mod.onRequestGet!(ctx(new Request(`${ORIGIN}/api/signed-data-feed`)));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { kind?: string }).kind).toBe("preview");
  });

  it("bare GET /api/feeds/provider-diff still serves the published free preview", async () => {
    vi.stubGlobal("fetch", offlineEvmFetch);
    const mod = await door("/api/feeds/provider-diff");
    const res = await mod.onRequestGet!(ctx(new Request(`${ORIGIN}/api/feeds/provider-diff`)));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { kind?: string }).kind).toBe("recent");
  });

  it("an unknown pair on GET is still the 404 that names known_ids", async () => {
    vi.stubGlobal("fetch", offlineEvmFetch);
    const mod = await door("/api/wrapper");
    const res = await mod.onRequestGet!(ctx(new Request(`${ORIGIN}/api/wrapper?id=usdc:ethereum`)));
    expect(res.status).toBe(404);
    expect(((await res.json()) as { known_ids?: string[] }).known_ids?.length).toBeGreaterThan(0);
  });
});

describe("a request that carries a payment header takes the path it always took", () => {
  it("art50 still validates the body first (400) when payment is presented", async () => {
    vi.stubGlobal("fetch", offlineEvmFetch);
    const { status, body } = await post(`${ORIGIN}/api/art50/marking-evidence`, PAYMENT);
    expect(status).toBe(400);
    expect(String(body.error)).toBe("uncheckable");
  });

  it("signed-data-feed still answers the free preview on a paid bare POST", async () => {
    vi.stubGlobal("fetch", offlineEvmFetch);
    const { status, body } = await post(`${ORIGIN}/api/signed-data-feed`, PAYMENT);
    expect(status).toBe(200);
    expect(String(body.kind)).toBe("preview");
  });

  it("provider-diff still answers the free preview on a paid bare POST", async () => {
    vi.stubGlobal("fetch", offlineEvmFetch);
    const { status, body } = await post(`${ORIGIN}/api/feeds/provider-diff`, PAYMENT);
    expect(status).toBe(200);
    expect(String(body.kind)).toBe("recent");
  });

  it("wrapper/changes still 404s a POST — it has never served one", async () => {
    vi.stubGlobal("fetch", offlineEvmFetch);
    const { status, body } = await post(`${ORIGIN}/api/wrapper/changes?id=usdc.e:arbitrum`, PAYMENT);
    expect(status).toBe(404);
    expect(String(body.error)).toBe("not_found");
    expect(String(body.path)).toBe("/api/wrapper/changes");
  });

  it("wrapper still 404s an off-roster pair when payment is presented", async () => {
    vi.stubGlobal("fetch", offlineEvmFetch);
    const { status, body } = await post(`${ORIGIN}/api/wrapper?id=usdc:ethereum`, PAYMENT);
    expect(status).toBe(404);
    expect(String(body.error)).toBe("not_found");
  });
});

describe("GET /.well-known/x402 — the discovery fan-out x402scan reads", () => {
  const FREE_SURFACES = [
    "/gspc-verify",
    "/api/gspc",
    "/root.json",
    "/api/fines",
    "/api/commissions",
    "/methodology",
    "/api/verify",
    "/api/x402/index",
    "/receipts/root-history.json",
  ];

  it("is a 200 JSON body {version:1, resources[]} — not a 308 to somewhere else", async () => {
    const res = (await fanOutGet(ctx(new Request(`${ORIGIN}/.well-known/x402`))) as unknown) as Response;
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    const body = (await res.json()) as { version: number; resources: string[] };
    expect(body.version).toBe(1);
    expect(Array.isArray(body.resources)).toBe(true);
    expect(body.resources.length).toBeGreaterThanOrEqual(30);
    for (const u of body.resources) {
      expect(u, `fan-out entry must be an absolute https URL: ${u}`).toMatch(/^https:\/\/councilof\.ai\//);
      expect(u, `fan-out entry carries a placeholder: ${u}`).not.toContain("<");
      expect(u, `fan-out advertises a free preview: ${u}`).not.toContain("preview=1");
    }
    const paths = body.resources.map((u) => new URL(u).pathname);
    for (const free of FREE_SURFACES)
      expect(paths, `fan-out advertises the free surface ${free}`).not.toContain(free);
  });

  it("is a superset of every /api/x402 resource row — the two cannot drift", async () => {
    const res = (await fanOutGet(ctx(new Request(`${ORIGIN}/.well-known/x402`))) as unknown) as Response;
    const fanOut = ((await res.json()) as { resources: string[] }).resources;
    const paths = fanOut.map((u) => new URL(u).pathname);
    const cat = (await (catalogueGet(ctx(new Request(`${ORIGIN}/api/x402`))) as Promise<Response>).then((r) => r.json())) as {
      resources: { id: string; resource: string }[];
      free_forever: string[];
    };
    expect(cat.resources.length).toBeGreaterThanOrEqual(6);
    for (const r of cat.resources) {
      // `/api/discover/<chainlink|ondo|ondo-ousg>` collapses to its prefix; every other row is exact.
      // decodeURIComponent first: URL encodes `<` and `|` in the pathname.
      const raw = decodeURIComponent(new URL(r.resource).pathname);
      const prefix = raw.split("<")[0];
      const covered = prefix.endsWith("/")
        ? paths.some((p) => p.startsWith(prefix))
        : paths.some((p) => p === prefix || p.startsWith(`${prefix}/`));
      expect(covered, `fan-out is missing catalogue row ${r.id} (${r.resource})`).toBe(true);
    }
    // free_forever is a promise that these are NOT sold. A path that is ALSO a paid door
    // (/api/proof?bundle=1 sells, /api/proof?sha=… is free) is skipped: only surfaces with no
    // door of their own may be absent here.
    const doorPaths = new Set(
      cat.resources.map((r) => decodeURIComponent(new URL(r.resource).pathname).split("<")[0].replace(/\/$/, "")),
    );
    for (const free of cat.free_forever) {
      const p = new URL(free).pathname;
      if (doorPaths.has(p)) continue;
      expect(paths, `fan-out advertises the free surface ${free}`).not.toContain(p);
    }
  });

  it("HEAD keeps the headers and drops the body", async () => {
    const get = (await fanOutGet(ctx(new Request(`${ORIGIN}/.well-known/x402`))) as unknown) as Response;
    const head = (await fanOutGet(ctx(new Request(`${ORIGIN}/.well-known/x402`, { method: "HEAD" }))) as unknown) as Response;
    expect(head.status).toBe(200);
    expect([...head.headers]).toEqual([...get.headers]);
    expect(await head.text()).toBe("");
  });
});
