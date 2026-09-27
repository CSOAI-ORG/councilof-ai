/**
 * Reach engine — the rules every entity page, list, sitemap and feed must keep.
 *
 * Real bytes, not invented shapes: the MCP and x402 pages read the committed /reach/v1 index
 * (scripts/reach/build-reach-index.mjs) through a mocked ASSETS binding that serves public/ from disk;
 * the A2A, stablecoin and daily-note pages read REAL signed Hugging Face records saved under
 * __fixtures__/ (their Ed25519 signatures verify under the pinned board key), through a mocked fetch.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const H = vi.hoisted(() => ({ exclusions: [] as unknown[], ledger: [] as unknown[] }));

vi.mock("../../../scripts/census/probe-exclusions.json", () => ({
  default: { schema: "csoai.probe-exclusions/0.1", get entries() { return H.exclusions; } },
}));
vi.mock("../../api/corrections", async (importOriginal) => {
  const o = (await importOriginal()) as { LEDGER: { corrections: unknown[] } };
  return { ...o, LEDGER: { ...o.LEDGER, get corrections() { return [...o.LEDGER.corrections, ...H.ledger]; } } };
});

import { type Ctx, serve } from "./core";
import { loadMcpHost, renderMcp, mcpJson } from "./mcp";
import { loadCardHost, renderCard, cardJson } from "./agentCards";
import { loadX402, renderX402, x402Json } from "./x402";
import { loadDeployment, renderDeployment, deploymentJson } from "./stablecoins";
import { diffIndexes, loadDailyNote, renderNote } from "./notes";
import { listType, urlset, SITEMAP_CAP } from "./lists";
import { atomFeed, jsonFeed, records } from "./records";
import { isPending, pendingForDeployment, pendingForHost } from "./corrections";
import { diffDivergences, newOutsidePayers } from "./harvest";
import { onRequest as mcpPage } from "../../mcp-servers/[host]/index";
import { onRequest as mcpTwin } from "../../mcp-servers/[host]/index.json";
import { onRequest as cardPage } from "../../agent-cards/[host]/index";
import { onRequest as xlPage } from "../../stablecoins/[asset]/[chain]/index";
import { onRequest as sitemap } from "../../sitemaps/[name]";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "../../..");
const FX = join(HERE, "__fixtures__");
const fx = (f: string) => new Uint8Array(readFileSync(join(FX, f)));
const HF = "https://huggingface.co";

type Route = () => Response | Promise<Response>;
let routes: Map<string, Route>;
let assetsFail = false;

const ok = (b: Uint8Array | string) => () => new Response(b as BodyInit, { status: 200 });
const tree = (items: { type: string; path: string }[]) => () => new Response(JSON.stringify(items), { status: 200 });

function hfRoutes() {
  const r = new Map<string, Route>();
  // A2A census: newest daily 2026-09-27
  r.set(`${HF}/api/datasets/csoai/a2a-card-census/tree/main`, tree([{ type: "file", path: "record.json" }, { type: "file", path: "record.2026-09-27.json" }, { type: "directory", path: "data" }]));
  r.set(`${HF}/datasets/csoai/a2a-card-census/resolve/main/record.2026-09-27.json`, ok(fx("a2a-record.2026-09-27.json")));
  r.set(`${HF}/datasets/csoai/a2a-card-census/resolve/main/record.2026-09-27.signed.json`, ok(fx("a2a-record.2026-09-27.signed.json")));
  r.set(`${HF}/datasets/csoai/a2a-card-census/resolve/main/data/cards.2026-09-27.jsonl.gz`, ok(fx("a2a-cards.2026-09-27.jsonl.gz")));
  // Cross-ledger: newest day 2026-09-26, re-derivation v2
  r.set(`${HF}/api/datasets/csoai/cross-ledger-supply/tree/main/xl-daily`, tree([{ type: "directory", path: "xl-daily/2026-09-26" }]));
  r.set(`${HF}/api/datasets/csoai/cross-ledger-supply/tree/main/xl-daily/2026-09-26`, tree([{ type: "directory", path: "xl-daily/2026-09-26/assets" }, { type: "directory", path: "xl-daily/2026-09-26/v2" }, { type: "file", path: "xl-daily/2026-09-26/xl-daily-2026-09-26.json" }]));
  r.set(`${HF}/datasets/csoai/cross-ledger-supply/resolve/main/xl-daily/2026-09-26/v2/xl-daily-2026-09-26.json`, ok(fx("xl-daily-2026-09-26.json")));
  r.set(`${HF}/datasets/csoai/cross-ledger-supply/resolve/main/xl-daily/2026-09-26/v2/xl-daily-2026-09-26.signed.json`, ok(fx("xl-daily-2026-09-26.signed.json")));
  // Evidence index: one signed day (the 26 Sep genesis)
  r.set(`${HF}/api/datasets/csoai/evidence-index/tree/main/measurement-index`, tree([{ type: "directory", path: "measurement-index/2026-09-26" }, { type: "file", path: "measurement-index/README.md" }]));
  r.set(`${HF}/datasets/csoai/evidence-index/resolve/main/measurement-index/2026-09-26/measurement-index-v0.2-2026-09-26.json`, ok(fx("mi-2026-09-26.json")));
  r.set(`${HF}/datasets/csoai/evidence-index/resolve/main/measurement-index/2026-09-26/measurement-index-v0.2-2026-09-26.signed.json`, ok(fx("mi-2026-09-26.signed.json")));
  return r;
}

const assets = {
  fetch: async (req: Request | string) => {
    if (assetsFail) return new Response("upstream error", { status: 500 });
    const path = new URL(typeof req === "string" ? req : req.url).pathname;
    const f = join(REPO, "public", decodeURIComponent(path));
    return existsSync(f) ? new Response(readFileSync(f), { status: 200 }) : new Response("<!doctype html><title>SPA</title>", { status: 200 });
  },
};

const ctx = (path: string, params: Record<string, string> = {}, headers: Record<string, string> = {}): Ctx & { next: () => Promise<Response> } => ({
  request: new Request(`https://councilof.ai${path}`, { headers }),
  env: { ASSETS: assets },
  params,
  waitUntil: () => undefined,
  next: async () => new Response("static", { status: 200 }),
});

beforeEach(() => {
  routes = hfRoutes();
  assetsFail = false;
  H.exclusions = [];
  H.ledger = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const h = routes.get(url);
    return h ? h() : new Response("not found", { status: 404 });
  }));
});
afterEach(() => vi.unstubAllGlobals());

const MCP_LIST = JSON.parse(readFileSync(join(REPO, "public/reach/v1/mcp/list.json"), "utf8")).rows as (string | number)[][];
const MANIFEST = JSON.parse(readFileSync(join(REPO, "public/reach/v1/manifest.json"), "utf8"));
const MCP_HOST = (MCP_LIST.find((r) => r[0] === "mcp.context7.com") || MCP_LIST.find((r) => Number(r[3]) > 0))![0] as string;
const A2A_ROWS = gunzipSync(readFileSync(join(FX, "a2a-cards.2026-09-27.jsonl.gz"))).toString("utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const A2A_HOST = A2A_ROWS.find((r) => r.state === "CARD_SERVED" && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(r.host)).host as string;
const A2A_ROBOTS = A2A_ROWS.find((r) => r.state === "ROBOTS_DISALLOWED").host as string;
const XL = JSON.parse(readFileSync(join(FX, "xl-daily-2026-09-26.json"), "utf8"));

/** The rules every rendered entity page keeps. */
function expectDoctrine(html: string) {
  expect(html).toMatch(/<title>[^<]{10,}<\/title>/);
  expect(html).toMatch(/<meta name="description" content="[^"]{40,}">/);
  expect(html).toMatch(/<link rel="canonical" href="https:\/\/councilof\.ai\/[^"]+\/">/);
  expect(html).toContain('type="application/json" title="Machine-readable twin"');
  expect(html).toContain("says nothing about the security, quality or safety of");
  expect(html).toContain("https://councilof.ai/census/");
  expect(html).toContain("The operator can add context there");
  expect(html).toMatch(/Evidence level:/);
  const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const ds = ld.find((x) => x["@type"] === "Dataset");
  expect(ds).toBeTruthy();
  expect(Array.isArray(ds.isBasedOn) && ds.isBasedOn.length > 0).toBe(true);
  const visible = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
  // No certify wording, scores, ranks, grades or ratings — except where the page negates them.
  for (const m of visible.matchAll(/\b(certif\w*|rank\w*|scor\w*|grade\w*|rating\w*)\b/gi)) {
    expect(visible.slice(Math.max(0, m.index! - 70), m.index!), `"${m[0]}" must be negated`).toMatch(/\b(not|never|no|nothing|nor)\b/i);
  }
}

describe("entity pages render from published data", () => {
  it("MCP host: declared vs observed per dimension, dates, sources", async () => {
    const h = await loadMcpHost(ctx(`/mcp-servers/${MCP_HOST}/`), MCP_HOST);
    const r = renderMcp(h);
    expect(r.status).toBe(200);
    expectDoctrine(r.body);
    expect(r.body).toContain(`<link rel="canonical" href="https://councilof.ai/mcp-servers/${MCP_HOST}/">`);
    for (const d of ["AUTH", "PAYMENT", "PROTOCOL", "TOOLS", "VERSION"]) expect(r.body).toContain(`>${d}<`);
    expect(r.body).toContain("First and last seen");
    expect(r.body).toContain("/verify-server/?url=");
    expect(r.body).toMatch(/signature <span class="st"[^>]*>VERIFIES<\/span>/);
    const j = mcpJson(h);
    expect(j.findings_state).toBe("PUBLISHED");
    expect((j.endpoints as unknown[]).length).toBe(MCP_LIST.find((x) => x[0] === MCP_HOST)![1]);
  });

  it("A2A card host: listed vs served, from the verified daily record", async () => {
    const h = await loadCardHost(ctx(`/agent-cards/${A2A_HOST}/`), A2A_HOST);
    const r = renderCard(h);
    expect(r.status).toBe(200);
    expectDoctrine(r.body);
    expect(r.body).toContain("CARD_SERVED");
    expect(r.body).toContain("UNMEASURED"); // first seen is shown as UNMEASURED, not guessed
    expect(cardJson(h).sources).toMatchObject({ signature: "VERIFIES" });
  });

  it("x402 door: declared from the catalog, observed UNMEASURED by design", async () => {
    const e = await loadX402(ctx("/x402/free_door/"), "free_door");
    const r = renderX402(e);
    expect(r.status).toBe(200);
    expectDoctrine(r.body);
    expect(r.body).toContain("UNMEASURED");
    expect((x402Json(e).observed as { state: string }).state).toBe("UNMEASURED");
    expect(r.body).not.toMatch(/\$\s?\d|USDC\s*\d/); // no public prices
  });

  it("x402 census host: series UNMEASURED below the ladder's n", async () => {
    const idx = JSON.parse(readFileSync(join(REPO, "public/reach/v1/x402-census.json"), "utf8"));
    const host = Object.keys(idx.hosts).sort()[0];
    const e = await loadX402(ctx(`/x402/${host}/`), host);
    const r = renderX402(e);
    expectDoctrine(r.body);
    expect(r.body).toContain("Series state");
    expect(x402Json(e).series_state).toBe("UNMEASURED");
  });

  it("stablecoin deployment: issuer list vs ledger read, totalSupply wording", async () => {
    const p = await loadDeployment(ctx("/stablecoins/usdc/ethereum/"), "usdc", "ethereum");
    const r = renderDeployment(p);
    expect(r.status).toBe(200);
    expectDoctrine(r.body);
    expect(r.body).toContain("not issued or outstanding supply");
    expect(r.body).toMatch(/STATE_PROOF_VERIFIED|STATE_PROOF_RECORDED|OPERATOR_API/);
    expect(deploymentJson(p).findings_state).toBe("PUBLISHED");
  });

  it("daily note: rendered only from a verifying index; counts, no judgement", async () => {
    const n = await loadDailyNote(ctx("/notes/daily/2026-09-26/"), "2026-09-26");
    expect(n.index.signature.state).toBe("VERIFIES");
    const r = renderNote(n);
    expectDoctrine(r.body);
    expect(r.body).toContain("baseline");
    expect(r.body).not.toMatch(/\b(notable|concerning|worrying|impressive|alarming)\b/i);
  });

  it("the page routes set ETag and Last-Modified and answer 304 to a matching If-None-Match", async () => {
    const first = await mcpPage(ctx(`/mcp-servers/${MCP_HOST}/`, { host: MCP_HOST }));
    expect(first.status).toBe(200);
    const etag = first.headers.get("etag")!;
    expect(etag).toMatch(/^W\/"[0-9a-f]{32}"$/);
    expect(first.headers.get("last-modified")).toBeTruthy();
    const again = await mcpPage(ctx(`/mcp-servers/${MCP_HOST}/`, { host: MCP_HOST }, { "if-none-match": etag }));
    expect(again.status).toBe(304);
    const bare = await mcpPage(ctx(`/mcp-servers/${MCP_HOST}`, { host: MCP_HOST }));
    expect(bare.status).toBe(308);
    expect(bare.headers.get("location")).toBe(`/mcp-servers/${MCP_HOST}/`);
    const twin = await mcpTwin(ctx(`/mcp-servers/${MCP_HOST}/index.json`, { host: MCP_HOST }));
    expect(twin.headers.get("content-type")).toContain("application/json");
    expect((await twin.json()).schema).toBe("csoai.reach-entity/0.1");
  });
});

describe("a failing source is a 503 with a retry, never a fabricated page", () => {
  it("MCP: index unreadable -> 503 + Retry-After, no entity data", async () => {
    assetsFail = true;
    const r = await mcpPage(ctx(`/mcp-servers/${MCP_HOST}/`, { host: MCP_HOST }));
    expect(r.status).toBe(503);
    expect(r.headers.get("retry-after")).toBe("120");
    const body = await r.text();
    expect(body).toMatch(/retry/i);
    expect(body).not.toContain("Contract parity for");
    expect(body).toContain('name="robots" content="noindex"');
  });

  it("A2A: cards file unreachable -> 503", async () => {
    routes.set(`${HF}/datasets/csoai/a2a-card-census/resolve/main/data/cards.2026-09-27.jsonl.gz`, () => new Response("bad gateway", { status: 502 }));
    const r = await cardPage(ctx(`/agent-cards/${A2A_HOST}/`, { host: A2A_HOST }));
    expect(r.status).toBe(503);
    expect(await r.text()).not.toContain("Declared vs observed");
  });

  it("stablecoins: record bytes that the signature does not pin -> 503, not a page", async () => {
    const tampered = new TextEncoder().encode(new TextDecoder().decode(fx("xl-daily-2026-09-26.json")).replace("88304342264", "88304342265"));
    routes.set(`${HF}/datasets/csoai/cross-ledger-supply/resolve/main/xl-daily/2026-09-26/v2/xl-daily-2026-09-26.json`, ok(tampered));
    const r = await xlPage(ctx("/stablecoins/usdc/ethereum/", { asset: "usdc", chain: "ethereum" }));
    expect(r.status).toBe(503);
    expect(await r.text()).not.toContain("88304342265");
  });

  it("network throws -> 503", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("connect ECONNRESET"); }));
    const r = await xlPage(ctx("/stablecoins/usdc/ethereum/", { asset: "usdc", chain: "ethereum" }));
    expect(r.status).toBe(503);
    expect(r.headers.get("retry-after")).toBeTruthy();
  });

  it("a daily index whose signature fails is not published (404 with the reason)", async () => {
    const t = new TextDecoder().decode(fx("mi-2026-09-26.json")).replace('"n_capsules_total": 13184', '"n_capsules_total": 13185');
    routes.set(`${HF}/datasets/csoai/evidence-index/resolve/main/measurement-index/2026-09-26/measurement-index-v0.2-2026-09-26.json`, ok(t));
    await expect(loadDailyNote(ctx("/notes/daily/2026-09-26/"), "2026-09-26")).rejects.toMatchObject({ what: expect.stringContaining("2026-09-26") });
    expect((await records(ctx("/feeds/records.xml"))).some((r) => r.kind === "daily-note")).toBe(false);
  });
});

describe("opt-out is respected", () => {
  it("a host on the census exclusion list has no page and leaves every list", async () => {
    H.exclusions = [{ id: "t1", match: "host", value: MCP_HOST, received_utc: "2026-09-27T00:00:00Z", via: "email" }];
    const r = await mcpPage(ctx(`/mcp-servers/${MCP_HOST}/`, { host: MCP_HOST }));
    expect(r.status).toBe(404);
    const items = await listType(ctx("/sitemaps/mcp-servers-1.xml"), "mcp-servers");
    expect(items.some((i) => i.key === MCP_HOST)).toBe(false);
    expect(items.length).toBe(MCP_LIST.length - 1);
  });

  it("an endpoint entry excludes that endpoint only", async () => {
    const h0 = await loadMcpHost(ctx("/"), MCP_HOST);
    H.exclusions = [{ id: "t2", match: "endpoint", value: h0.endpoints[0].u }];
    if (h0.endpoints.length === 1) await expect(loadMcpHost(ctx("/"), MCP_HOST)).rejects.toBeTruthy();
    else expect((await loadMcpHost(ctx("/"), MCP_HOST)).endpoints.length).toBe(h0.endpoints.length - 1);
  });

  it("a robots.txt refusal in the A2A census has no page and is not listed", async () => {
    const r = await cardPage(ctx(`/agent-cards/${A2A_ROBOTS}/`, { host: A2A_ROBOTS }));
    const rows = A2A_ROWS.filter((x) => x.host === A2A_ROBOTS);
    if (rows.every((x) => x.state === "ROBOTS_DISALLOWED")) expect(r.status).toBe(404);
    const items = await listType(ctx("/"), "agent-cards");
    expect(items.some((i) => i.key === A2A_ROBOTS && rows.every((x) => x.state === "ROBOTS_DISALLOWED"))).toBe(false);
  });

  it("the committed index holds no robots-refused or excluded endpoint (producer gate)", async () => {
    const mod = await import("../../../scripts/reach/build-reach-index.mjs");
    expect(mod.verifyIndex(REPO)).toEqual([]);
    expect(MANIFEST.types["mcp-servers"].excluded).toHaveProperty("robots_endpoints");
  });
});

describe("a pending correction withholds the finding and shows the correction", () => {
  it("MCP host named in a pending correction", async () => {
    H.ledger = [{ id: "C-TEST-0927-01", date: "2026-09-27", status: "OPEN - correction pending review", what_was_wrong: `The contract-parity rows for ${MCP_HOST} were read against the wrong registry entry.` }];
    const h = await loadMcpHost(ctx("/"), MCP_HOST);
    expect(h.pending.map((c) => c.id)).toEqual(["C-TEST-0927-01"]);
    const r = renderMcp(h);
    expect(r.body).toContain("A correction is pending");
    expect(r.body).toContain("C-TEST-0927-01");
    expect(r.body).not.toContain("Contract parity for");
    const j = mcpJson(h);
    expect(j.findings_state).toBe("WITHHELD_PENDING_CORRECTION");
    expect((j.endpoints as { contract_parity: unknown }[]).every((e) => e.contract_parity === "WITHHELD")).toBe(true);
  });

  it("the hub lists withhold the same findings the pages withhold", async () => {
    H.ledger = [{ id: "C-TEST-0927-02", date: "2026-09-27", status: "OPEN - correction pending", what_was_wrong: `A row for ${MCP_HOST}.` }];
    const mcp = await listType(ctx("/"), "mcp-servers");
    const it0 = mcp.find((i) => i.key === MCP_HOST)!;
    expect(it0.facets.withheld).toBe(true);
    expect(it0.facets.INCONSISTENT).toBeNull();
    expect(mcp.filter((i) => i.facets.withheld).map((i) => i.key)).toEqual([MCP_HOST]);
    const xl = await listType(ctx("/"), "stablecoins");
    expect(xl.find((i) => i.key === "usdt/ethereum")!.facets.parity).toBe("WITHHELD");
    expect(xl.find((i) => i.key === "usdc/ethereum")!.facets.parity).not.toBe("WITHHELD");
  });

  it("a published (CORRECTED) entry is history, not a hold", () => {
    expect(isPending({ id: "x", status: "CORRECTED - superseded by record 0.1.2" })).toBe(false);
    expect(isPending({ id: "x", status: "RECORDED; THE LIVE LEDGER IS AUTHORITATIVE AT ITS READ TIME" })).toBe(false);
    expect(isPending({ id: "x" })).toBe(false);
    expect(isPending({ id: "x", status: "PENDING VERIFICATION — card withheld" })).toBe(true);
    expect(isPending({ id: "x", status: "CORRECTED AT PRODUCER - v2 signed and staged; dataset publication pending owner approval" })).toBe(true);
    expect(pendingForHost("example.com", [{ id: "y", status: "OPEN", what_was_wrong: "row for notexample.com" }])).toEqual([]);
  });

  it("the real ledger's pending Tether correction withholds USDT on Ethereum, not USDC on Ethereum", async () => {
    const usdt = await loadDeployment(ctx("/"), "usdt", "ethereum");
    expect(usdt.pending.length).toBeGreaterThan(0);
    const r = renderDeployment(usdt);
    expect(r.body).toContain("A correction is pending");
    expect(r.body).not.toContain("88304342264"); // the USDT totalSupply read is withheld
    expect(deploymentJson(usdt).observed).toBe("WITHHELD");
    const usdc = await loadDeployment(ctx("/"), "usdc", "ethereum");
    expect(pendingForDeployment(["USDC"], "ethereum")).toEqual(usdc.pending);
    expect(usdc.pending.length).toBe(0);
  });
});

describe("sitemaps list exactly the entities with data", () => {
  it("counts match the data for every type", async () => {
    const mcp = await listType(ctx("/"), "mcp-servers");
    expect(mcp.length).toBe(MCP_LIST.length);
    expect(mcp.length).toBe(MANIFEST.types["mcp-servers"].hosts);
    const cards = await listType(ctx("/"), "agent-cards");
    const hosts = new Set(A2A_ROWS.filter((r) => r.state !== "ROBOTS_DISALLOWED" && /^[a-z0-9.-]+$/.test(r.host) && r.host.includes(".")).map((r) => r.host));
    expect(cards.length).toBe(hosts.size);
    const xl = await listType(ctx("/"), "stablecoins");
    const pairs = new Set([...XL.deployments.map((d: { asset_key: string; ledger: string }) => `${d.asset_key}/${d.ledger}`), ...XL.parity.findings_inconsistent.map((f: { asset: string; ledger: string }) => `${f.asset}/${f.ledger}`), ...XL.parity.not_a_supply_claim.map((f: { asset: string; ledger: string }) => `${f.asset}/${f.ledger}`)]);
    expect(xl.length).toBe(pairs.size);
    const x = await listType(ctx("/"), "x402");
    const census = JSON.parse(readFileSync(join(REPO, "public/reach/v1/x402-census.json"), "utf8"));
    expect(x.filter((i) => i.facets.kind === "census host").length).toBe(Object.keys(census.hosts).length);
    expect(x.filter((i) => i.facets.kind === "our door").length).toBeGreaterThanOrEqual(20);
    const notes = await listType(ctx("/"), "notes-daily");
    expect(notes.map((n) => n.key)).toEqual(["2026-09-26"]);
  });

  it("every URL is the canonical slash form, unique, under the 50k cap", async () => {
    for (const t of ["mcp-servers", "agent-cards", "x402", "stablecoins", "notes-daily"] as const) {
      const items = await listType(ctx("/"), t);
      const xml = urlset(items);
      const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      expect(locs.length).toBe(Math.min(items.length, SITEMAP_CAP));
      expect(new Set(locs).size).toBe(locs.length);
      for (const l of locs) expect(l).toMatch(/^https:\/\/councilof\.ai\/[a-z0-9./_-]+\/$/);
    }
  });

  it("the sitemap index names /sitemap.xml and one chunk per type; a chunk with a dead source is 503", async () => {
    const r = await sitemap(ctx("/sitemaps/index.xml", { name: "index.xml" }));
    const x = await r.text();
    expect(x).toContain("<sitemapindex");
    expect(x).toContain("<loc>https://councilof.ai/sitemap.xml</loc>");
    for (const t of ["mcp-servers", "agent-cards", "x402", "stablecoins", "notes-daily"]) expect(x).toContain(`/sitemaps/${t}-1.xml`);
    routes.set(`${HF}/api/datasets/csoai/a2a-card-census/tree/main`, () => new Response("down", { status: 503 }));
    const dead = await sitemap(ctx("/sitemaps/agent-cards-1.xml", { name: "agent-cards-1.xml" }));
    expect(dead.status).toBe(503);
  });
});

describe("feeds", () => {
  it("Atom and JSON Feed carry the same derived entries, dated by the records themselves", async () => {
    const recs = await records(ctx("/feeds/records.xml"));
    expect(recs.some((r) => r.kind === "correction")).toBe(true);
    expect(recs.some((r) => r.kind === "daily-note" && r.url.endsWith("/notes/daily/2026-09-26/"))).toBe(true);
    const atom = atomFeed(recs);
    expect(atom).toMatch(/^<\?xml version="1.0" encoding="utf-8"\?>\n<feed xmlns="http:\/\/www.w3.org\/2005\/Atom">/);
    for (const tag of ["<id>", "<title>", "<updated>", "<author>"]) expect(atom).toContain(tag);
    expect(wellFormed(atom)).toBe(true);
    expect((atom.match(/<entry>/g) || []).length).toBe(recs.length);
    const jf = JSON.parse(jsonFeed(recs));
    expect(jf.version).toBe("https://jsonfeed.org/version/1.1");
    expect(jf.items.length).toBe(recs.length);
    for (const i of jf.items) { expect(i.id).toBeTruthy(); expect(i.url).toMatch(/^https:\/\//); expect(i.date_published).toMatch(/^\d{4}-\d{2}-\d{2}T/); }
    const ids = recs.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("daily diff", () => {
  it("counts ADDED / DROPPED / CARRIED / REBUILT by Merkle root, with state deltas", () => {
    const prev = { n_capsules_total: 10, batches: [{ adapter: "a", merkle_root: "r1", n_capsules: 5, states: { CONSISTENT: 5 } }, { adapter: "b", merkle_root: "r2", n_capsules: 5, states: { X: 5 } }, { adapter: "gone", merkle_root: "r9", n_capsules: 1 }] };
    const cur = { n_capsules_total: 12, batches: [{ adapter: "a", merkle_root: "r1", n_capsules: 5, states: { CONSISTENT: 5 } }, { adapter: "b", merkle_root: "r3", n_capsules: 6, states: { X: 4, Y: 2 } }, { adapter: "new", merkle_root: "r4", n_capsules: 1 }] };
    const d = diffIndexes("2026-09-28", cur, prev, "2026-09-27");
    expect(d.counts).toEqual({ ADDED: 1, DROPPED: 1, CARRIED: 1, REBUILT: 1 });
    expect(d.changes.find((c) => c.key === "b")!.states_delta).toEqual({ X: -1, Y: 2 });
  });
});

describe("daily HARVEST digest", () => {
  it("the 26 Sep note carries every harvest section, each linked to its signed record", async () => {
    const n = await loadDailyNote(ctx("/notes/daily/2026-09-26/"), "2026-09-26");
    const h = n.harvest;
    expect(h.divergences.state).toBe("BASELINE");
    expect(h.divergences.record!.url).toContain("xl-daily/2026-09-26/v2/xl-daily-2026-09-26.json");
    expect(h.divergences.items.map((x) => `${x.change} ${x.asset}/${x.ledger}`)).toEqual(["NEW usd1/tempo"]);
    expect(h.corrections.items.map((c) => c.id)).toContain("C-2026-0926-06");
    expect(h.corrections.items.every((c) => c.url.startsWith("https://councilof.ai/corrections/#"))).toBe(true);
    expect(h.payers.state).toBe("UNMEASURED"); // no settlement store bound in this test
    expect(h.reproductions.state).toBe("UNMEASURED");
    expect(h.chain.days_unbroken).toBe(1);
    expect(h.chain.stop).toMatch(/genesis/);
    const r = renderNote(n);
    for (const id of ["divergences", "corrections", "payers", "reproductions", "chain"]) expect(r.body).toContain(`id="${id}"`);
    expect(r.body).toContain("/stablecoins/usd1/tempo/");
  });

  it("divergences: NEW, CHANGED and RESOLVED against the previous record; non-divergences ignored", () => {
    const f = (asset: string, ledger: string, state: string, supply = "1") => ({ asset, ledger, deployment_id: "0xA", kind: "K", state, supply_decimal: supply });
    const prev = [f("a", "eth", "INCONSISTENT"), f("b", "eth", "INCONSISTENT"), f("c", "eth", "NOT_A_SUPPLY_CLAIM")];
    const cur = [f("a", "eth", "INCONSISTENT", "2"), f("c", "eth", "INCONSISTENT"), f("d", "eth", "INCONSISTENT"), f("e", "eth", "NOT_A_SUPPLY_CLAIM")];
    const d = diffDivergences(cur, prev).map((x) => `${x.change}:${x.asset}`);
    expect(d).toEqual(["CHANGED:a", "CHANGED:c", "NEW:d", "RESOLVED:b"]);
  });

  it("outside payers: distinct non-self, non-zero, first seen that day", () => {
    const r = (name: string, o: object) => ({ name: `settled:tx:${name}`, rec: { settled_at: "2026-09-26T10:00:00Z", amount_atomic: "10000", ...o } });
    const recs = [
      r("t1", { payer: "0xSELF", self: true }),
      r("t2", { payer: "0xZERO", zero_value: true, amount_atomic: "0" }),
      r("t3", { payer: "0xOLD", settled_at: "2026-09-20T10:00:00Z" }),
      r("t4", { payer: "0xOLD" }),
      r("t5", { payer: "0xNEW" }),
      r("t6", { payer: "0xnew", settled_at: "2026-09-26T11:00:00Z" }),
    ];
    const out = newOutsidePayers(recs, "2026-09-26");
    expect(out.map((x) => x.tx)).toEqual(["t5"]);
    expect(out[0].tx_url).toBe("https://basescan.org/tx/t5");
  });

  it("with a settlement store bound, payers are MEASURED from it", async () => {
    const kv = new Map([["settled:tx:0xabc", JSON.stringify({ payer: "0xP", settled_at: "2026-09-26T12:00:00Z", amount_atomic: "20000", tx: "0xabc" })]]);
    const c = ctx("/notes/daily/2026-09-26/");
    (c.env as Record<string, unknown>).REVENUE_KV = { list: async () => ({ keys: [...kv.keys()].map((name) => ({ name })), list_complete: true }), get: async (k: string) => kv.get(k) ?? null };
    const n = await loadDailyNote(c, "2026-09-26");
    expect(n.harvest.payers.state).toBe("MEASURED");
    expect(n.harvest.payers.items.map((x) => x.tx)).toEqual(["0xabc"]);
  });

  it("an unreadable harvest source makes the note a 503, never half a digest", async () => {
    routes.set(`${HF}/datasets/csoai/cross-ledger-supply/resolve/main/xl-daily/2026-09-26/v2/xl-daily-2026-09-26.json`, () => new Response("down", { status: 502 }));
    const { onRequest } = await import("../../notes/daily/[date]/index");
    const r = await onRequest(ctx("/notes/daily/2026-09-26/", { date: "2026-09-26" }));
    expect(r.status).toBe(503);
  });
});

describe("serve()", () => {
  it("answers HEAD without a body and refuses other methods", async () => {
    const head = await serve({ request: new Request("https://councilof.ai/x/", { method: "HEAD" }), env: {} }, "html", async () => ({ status: 200, body: "<p>x</p>", contentType: "text/html" }));
    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");
    const post = await serve({ request: new Request("https://councilof.ai/x/", { method: "POST" }), env: {} }, "html", async () => ({ status: 200, body: "x", contentType: "text/html" }));
    expect(post.status).toBe(405);
  });
});

/** Minimal XML well-formedness: balanced, properly nested elements; no stray '<' or '&'. */
function wellFormed(xml: string): boolean {
  const body = xml.replace(/^<\?xml[^>]*\?>/, "");
  if (/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(body)) return false;
  const stack: string[] = [];
  for (const m of body.matchAll(/<(\/?)([A-Za-z][\w:.-]*)([^>]*?)(\/?)>/g)) {
    if (m[1]) { if (stack.pop() !== m[2]) return false; }
    else if (!m[4]) stack.push(m[2]);
  }
  return stack.length === 0 && !/<(?![A-Za-z/?!])/.test(body);
}
