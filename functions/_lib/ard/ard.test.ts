/**
 * ARD registry (functions/_lib/ard). Real bytes: the MCP inventory is the committed /reach/v1 index served from public/
 * through a mocked ASSETS binding; the A2A inventory is the REAL signed HF record saved under ../reach/__fixtures__
 * (signature verifies under the pinned board key), through a mocked fetch; our own entries are the committed
 * /.well-known/ai-catalog.json.
 *
 * FAIL-FIRST (B), lead rule 30 Sep 2026 (listing != measurement): "an UNMEASURED entry carries no evidence or trust
 * field" was run first against a planted defect in which mcpEntries attached the signed contract-parity evidence to
 * every host whether or not a comparison was made; it failed there (receipt in the land commit). It passes here.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Ctx } from "../reach/core";
import { EVIDENCE_KEY, checkEntries, decodeToken, encodeToken, inventory, parseFilterString, textScore, type ArdEntry } from "./registry";
import { onRequest as listRoute } from "../../ard/v1/agents/index";
import { onRequest as detailRoute } from "../../ard/v1/agents/[id]";
import { onRequest as searchRoute } from "../../ard/v1/search";
import { onRequest as exploreRoute } from "../../ard/v1/explore";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "../../..");
const FX = join(HERE, "../reach/__fixtures__");
const HF = "https://huggingface.co";
const fx = (f: string) => new Uint8Array(readFileSync(join(FX, f)));
const ok = (b: Uint8Array | string) => () => new Response(b as BodyInit, { status: 200 });

const routes = new Map<string, () => Response>([
  [`${HF}/api/datasets/csoai/a2a-card-census/tree/main`, () => new Response(JSON.stringify([{ type: "file", path: "record.json" }, { type: "file", path: "record.2026-09-27.json" }, { type: "directory", path: "data" }]), { status: 200 })],
  [`${HF}/datasets/csoai/a2a-card-census/resolve/main/record.2026-09-27.json`, ok(fx("a2a-record.2026-09-27.json"))],
  [`${HF}/datasets/csoai/a2a-card-census/resolve/main/record.2026-09-27.signed.json`, ok(fx("a2a-record.2026-09-27.signed.json"))],
  [`${HF}/datasets/csoai/a2a-card-census/resolve/main/data/cards.2026-09-27.jsonl.gz`, ok(fx("a2a-cards.2026-09-27.jsonl.gz"))],
]);

const assets = {
  fetch: async (req: Request | string) => {
    const path = new URL(typeof req === "string" ? req : req.url).pathname;
    const f = join(REPO, "public", decodeURIComponent(path));
    return existsSync(f) ? new Response(readFileSync(f), { status: 200 }) : new Response("<!doctype html><title>SPA</title>", { status: 200 });
  },
};

function ctx(path: string, init: RequestInit = {}, params: Record<string, string> = {}): Ctx {
  return { request: new Request(`https://councilof.ai${path}`, init), env: { ASSETS: assets }, params, waitUntil: () => undefined };
}
const post = (path: string, b: unknown) => ctx(path, { method: "POST", body: JSON.stringify(b), headers: { "content-type": "application/json" } });

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
    const u = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const r = routes.get(u.split("?")[0]);
    return r ? r() : new Response("not found", { status: 404 });
  });
});
afterEach(() => vi.restoreAllMocks());

const noEvidence = (e: ArdEntry) => !e.trustManifest && Object.keys(e.metadata).every((k) => !EVIDENCE_KEY.test(k));

describe("inventory", () => {
  it("is one list of own + MCP census + A2A census entries, all LISTED, sorted, each stating its measurement", async () => {
    const { entries, sources } = await inventory(ctx("/ard/v1/agents"));
    expect(sources.own).toMatch(/^LIVE/);
    expect(sources.mcp_census).toMatch(/^LIVE/);
    expect(sources.a2a_census).toMatch(/^LIVE/);
    const origins = new Set(entries.map((e) => e.metadata.origin));
    expect(origins).toEqual(new Set(["own", "census"]));
    expect(entries.filter((e) => e.identifier.includes(":mcp-server:")).length).toBeGreaterThan(1000);
    expect(entries.filter((e) => e.identifier.includes(":a2a-agent:")).length).toBeGreaterThan(100);
    const ids = entries.map((e) => e.identifier);
    expect(ids).toEqual([...ids].sort());
    expect(new Set(ids).size).toBe(ids.length);
    expect(() => checkEntries(entries)).not.toThrow();
    for (const e of entries) expect(e.identifier).toMatch(/^urn:air:[a-zA-Z0-9.-]+(:[a-zA-Z0-9._-]+)+$/);
  });

  it("FAIL-FIRST: an UNMEASURED entry carries no evidence or trust field; only MEASURED entries cite signed records", async () => {
    const { entries } = await inventory(ctx("/ard/v1/agents"));
    const un = entries.filter((e) => e.metadata.measurement !== "MEASURED");
    const me = entries.filter((e) => e.metadata.measurement === "MEASURED");
    expect(un.length).toBeGreaterThan(0);
    expect(me.length).toBeGreaterThan(0);
    for (const e of un) expect(noEvidence(e)).toBe(true);
    for (const e of me.filter((x) => x.metadata.origin === "census")) {
      expect(e.metadata["evidence.signed"]).toMatch(/^https:\/\/huggingface\.co\//);
      expect(e.metadata["evidence.signature"]).toBe("VERIFIES");
    }
    // the gate refuses a planted mix
    const planted = { ...un[0], metadata: { ...un[0].metadata, "evidence.signed": "https://example.org/x.json" } };
    expect(() => checkEntries([planted])).toThrow(/carries evidence or trust/);
    const trust = { ...un[0], trustManifest: { identity: "https://councilof.ai", attestations: [{ type: "signed-measurement" }] } };
    expect(() => checkEntries([trust])).toThrow(/carries evidence or trust/);
  });
});

describe("GET /ard/v1/agents", () => {
  it("answers the ARD list shape with the gateway spellings, paginates without gaps or repeats", async () => {
    const r1 = await listRoute(ctx("/ard/v1/agents?pageSize=100"));
    expect(r1.status).toBe(200);
    expect(r1.headers.get("cache-control")).toMatch(/max-age=900/);
    const b1 = await r1.json();
    expect(b1.items.length).toBe(100);
    expect(b1.totalCount).toBe(b1.total);
    expect(b1.nextPageToken).toBe(b1.pageToken);
    const b2 = await (await listRoute(ctx(`/ard/v1/agents?pageSize=100&pageToken=${b1.pageToken}`))).json();
    expect(b2.items[0].identifier > b1.items[99].identifier).toBe(true);
    const lastOffset = Math.floor((b1.total - 1) / 100) * 100;
    const bl = await (await listRoute(ctx(`/ard/v1/agents?page_size=100&page_token=${encodeToken(lastOffset)}`))).json();
    expect(bl.items.length).toBe(b1.total - lastOffset);
    expect(bl.pageToken).toBeUndefined();
    expect(bl.nextPageToken).toBe("");
    expect(JSON.stringify(b1).length).toBeLessThan(250_000);
  });

  it("filters by measurement and type; refuses unknown filters, rankings and forged tokens", async () => {
    const b = await (await listRoute(ctx(`/ard/v1/agents?pageSize=100&filter=${encodeURIComponent('measurement = "UNMEASURED"')}`))).json();
    expect(b.items.length).toBeGreaterThan(0);
    expect(b.items.every((e: ArdEntry) => e.metadata.measurement === "UNMEASURED" && noEvidence(e))).toBe(true);
    const t = await (await listRoute(ctx(`/ard/v1/agents?filter=${encodeURIComponent('tags : "a2a-agent" AND measurement = "MEASURED"')}`))).json();
    expect(t.items.every((e: ArdEntry) => e.tags?.includes("a2a-agent") && e.metadata.measurement === "MEASURED")).toBe(true);
    expect((await listRoute(ctx(`/ard/v1/agents?filter=${encodeURIComponent('score = "1"')}`))).status).toBe(400);
    expect((await listRoute(ctx("/ard/v1/agents?orderBy=score"))).status).toBe(400);
    expect((await listRoute(ctx("/ard/v1/agents?pageToken=forged"))).status).toBe(400);
    expect((await listRoute(ctx("/ard/v1/agents", { method: "DELETE" }))).status).toBe(405);
  });
});

describe("GET /ard/v1/agents/<identifier>", () => {
  it("returns one entry; a census MCP host carries its native endpoints; unknown is 404", async () => {
    const { entries } = await inventory(ctx("/ard/v1/agents"));
    const m = entries.find((e) => e.identifier.includes(":mcp-server:") && e.metadata.measurement === "MEASURED")!;
    const r = await detailRoute(ctx(`/ard/v1/agents/${m.identifier}`, {}, { id: m.identifier }));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.entry.identifier).toBe(m.identifier);
    expect(String(b.entry.metadata["native.endpoints"])).toMatch(/^https?:\/\//);
    const nf = await detailRoute(ctx("/ard/v1/agents/urn:air:councilof.ai:mcp-server:nope.invalid", {}, { id: "urn:air:councilof.ai:mcp-server:nope.invalid" }));
    expect(nf.status).toBe(404);
  });
});

describe("POST /ard/v1/search and /ard/v1/explore", () => {
  it("search returns ARD SearchResultItems with an integer lexical score and a source; never a quality score", async () => {
    const r = await searchRoute(post("/ard/v1/search", { query: { text: "measurement agent a2a", filter: { type: ["application/a2a-agent-card+json"] } }, federation: "none", pageSize: 5 }));
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.results.length).toBeGreaterThan(0);
    for (const x of b.results) {
      expect(Number.isInteger(x.score) && x.score >= 0 && x.score <= 100).toBe(true);
      expect(x.source).toBe("councilof.ai");
      expect(x.type).toBe("application/a2a-agent-card+json");
    }
    expect(b.referrals).toEqual([]);
    expect(b.scoreBasis).toMatch(/not a quality, safety, trust or popularity score/);
    expect((await searchRoute(ctx("/ard/v1/search"))).status).toBe(405);
    expect((await searchRoute(post("/ard/v1/search", { query: { text: "x", filter: { rating: ["A"] } } }))).status).toBe(400);
  });

  it("explore counts facets over listed entries", async () => {
    const b = await (await exploreRoute(post("/ard/v1/explore", { query: { text: "" }, resultType: { facets: [{ field: "measurement" }, { field: "type" }] } }))).json();
    expect(b.resultType).toBe("facets");
    const sum = Object.values(b.facets.measurement as Record<string, number>).reduce((a, c) => a + c, 0);
    expect(sum).toBe(b.total);
    expect(Object.keys(b.facets.measurement).every((k) => ["MEASURED", "UNMEASURED", "WITHHELD_PENDING_CORRECTION"].includes(k))).toBe(true);
  });
});

describe("helpers", () => {
  it("tokens round-trip and forged ones are refused; filters parse; score is lexical", () => {
    expect(decodeToken(encodeToken(300))).toBe(300);
    expect(decodeToken("bm9wZQ")).toBeNull();
    expect(parseFilterString('type = "application/json" AND tags : "census"').filter).toEqual({ type: ["application/json"], tags: ["census"] });
    expect(parseFilterString("type ~ x").error).toMatch(/unsupported/);
    const e = { identifier: "urn:air:x.org:a:b", displayName: "Weather tool", type: "t", metadata: { listing: "LISTED", measurement: "UNMEASURED" } } as ArdEntry;
    expect(textScore(e, "weather forecast")).toBe(50);
  });
});
