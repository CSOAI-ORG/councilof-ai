/**
 * GSPC Route floor x effect-binding census. The floor rule floor:effect-binding-divergent existed since the
 * route MVP but every candidate carried UNMEASURED, so it could not fire. These tests were run FIRST against
 * the unwired router (route.ts not calling applyCensus) and failed there (lane live-backlog-20260930; the red
 * run is in the land commit message), then against a planted mapping defect (DOES_NOT_BIND -> UNMEASURED).
 *
 * The live-data test reads the COMMITTED index and the COMMITTED signed run: a real DOES_NOT_BIND endpoint
 * from that run must be forbidden by the floor, and a real BINDS/PARTIAL one must not.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { route } from "./route";
import { applyCensus, CENSUS_SCHEMA, normaliseEndpointUrl } from "./census";
import { normaliseCandidate } from "./candidates";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const INDEX_PATH = join(ROOT, "public", "interop", "effect-binding-census-index.json");
const INDEX = JSON.parse(readFileSync(INDEX_PATH, "utf8"));
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

const fixed = { now: () => new Date("2026-09-30T12:00:00.000Z"), uuid: () => "00000000-0000-4000-8000-000000000002" };
const noBoard = async () => ({ axes: [] });

function indexOf(entries: Record<string, string>) {
  const e: Record<string, { outcome: string }> = {};
  for (const [url, outcome] of Object.entries(entries)) e[sha(normaliseEndpointUrl(url) as string)] = { outcome };
  return { ...INDEX, entries: e };
}

const mcp = (id: string, endpoint: string) => ({ id, kind: "mcp_tool", provider: "third-party", endpoint, read_only: true });

describe("normaliseEndpointUrl (same vectors as scripts/effect-binding/test_eb_census_index.py)", () => {
  const vectors: Array<[string, string | null]> = [
    ["https://Example.COM/mcp/", "https://example.com/mcp"],
    ["https://example.com:443/mcp?key=secret#x", "https://example.com/mcp"],
    ["https://example.com:8443/a//", "https://example.com:8443/a"],
    ["https://user:pw@example.com/mcp", "https://example.com/mcp"],
    ["https://example.com", "https://example.com"],
    ["local:ollama/mistral:7b", null],
    ["not a url", null],
  ];
  for (const [inp, want] of vectors) it(JSON.stringify(inp), () => expect(normaliseEndpointUrl(inp)).toBe(want));
});

describe("floor:effect-binding-divergent fires on census data", () => {
  const args = (endpoint: string) => ({ task: "Read one public record.", candidates: [mcp("mcp:third-party", endpoint), mcp("mcp:other", "https://other.example/mcp")] });

  it("a DOES_NOT_BIND endpoint is DIVERGENT and forbidden by the floor", async () => {
    const idx = indexOf({ "https://divergent.example/mcp": "DOES_NOT_BIND" });
    const r = await route(args("https://divergent.example/mcp/"), { fetchBoard: noBoard, fetchCensus: async () => idx, ...fixed });
    const f = (r.forbidden as Array<{ id: string; forbid_policy: string }>).find((x) => x.id === "mcp:third-party");
    expect(f?.forbid_policy).toBe("floor:effect-binding-divergent");
    expect((r.chosen as { id: string }).id).toBe("mcp:other");
    const c = (r.record as any).observed.considered.find((x: any) => x.id === "mcp:third-party");
    expect(c.census).toEqual({ effect_binding: "DIVERGENT", outcome: "DOES_NOT_BIND", basis: "census" });
    expect((r.record as any).observed.census).toMatchObject({ state: "LIVE", looked_up: 2, matched: 1 });
  });

  it("BINDS is CONSISTENT and PARTIAL is UNMEASURED: neither is forbidden by the floor", async () => {
    const idx = indexOf({ "https://binds.example/mcp": "BINDS", "https://partial.example/mcp": "PARTIAL" });
    for (const [u, state] of [["https://binds.example/mcp", "CONSISTENT"], ["https://partial.example/mcp", "UNMEASURED"]]) {
      const r = await route(args(u), { fetchBoard: noBoard, fetchCensus: async () => idx, ...fixed });
      const c = (r.record as any).observed.considered.find((x: any) => x.id === "mcp:third-party");
      expect(c.census.effect_binding).toBe(state);
      expect(c.forbids_matched).not.toContain("floor:effect-binding-divergent");
    }
  });

  it("an unreadable or malformed census leaves every candidate UNMEASURED and forbids nothing on it", async () => {
    for (const [fetchCensus, state] of [
      [async () => { throw new Error("HTTP 503"); }, "UNREACHABLE"],
      [async () => ({ schema: "something-else", entries: {} }), "INVALID"],
    ] as const) {
      const r = await route(args("https://divergent.example/mcp"), { fetchBoard: noBoard, fetchCensus, ...fixed });
      expect((r.record as any).observed.census.state).toBe(state);
      for (const c of (r.record as any).observed.considered) expect(c.census.effect_binding).toBe("UNMEASURED");
      expect(r.forbidden).toEqual([]);
    }
  });

  it("a candidate with no public endpoint is never looked up", async () => {
    const c = normaliseCandidate({ id: "local:x", kind: "local_gpu", endpoint: "local:ollama/x" }, 0);
    const read = await applyCensus([c], async () => INDEX);
    expect(read).toMatchObject({ state: "LIVE", looked_up: 0 });
    expect(c.census).toEqual({ effect_binding: "UNMEASURED", outcome: null, basis: "no_public_endpoint" });
  });
});

describe("live data: the committed index is built from the committed signed run", () => {
  const signed = JSON.parse(readFileSync(join(ROOT, "public", "interop", INDEX.source.signed_companion.replace(/^\/interop\//, "")), "utf8"));
  const artBytes = readFileSync(join(ROOT, "public", "interop", INDEX.source.artifact.replace(/^\/interop\//, "")));
  const art = JSON.parse(artBytes.toString("utf8"));

  it("the index pins the signed artifact", () => {
    expect(INDEX.schema).toBe(CENSUS_SCHEMA);
    expect(INDEX.source.artifact_sha256).toBe(createHash("sha256").update(artBytes).digest("hex"));
    expect(signed.payload.artifact.sha256).toBe(INDEX.source.artifact_sha256);
    expect(signed.signature.payload_sha256).toBe(INDEX.source.signed_payload_sha256);
    expect(INDEX.counts.DOES_NOT_BIND).toBeGreaterThan(0);
  });

  it("a real DOES_NOT_BIND endpoint from the signed run is forbidden; a real PARTIAL one is not", async () => {
    const servers = art.third_party.servers as Array<{ url: string; outcome: string }>;
    const bad = servers.find((s) => s.outcome === "DOES_NOT_BIND" && INDEX.entries[sha(normaliseEndpointUrl(s.url) ?? "")]?.outcome === "DOES_NOT_BIND");
    const partial = servers.find((s) => s.outcome === "PARTIAL" && INDEX.entries[sha(normaliseEndpointUrl(s.url) ?? "")]?.outcome === "PARTIAL");
    expect(bad).toBeDefined();
    expect(partial).toBeDefined();
    const r = await route(
      { task: "Read one public record.", candidates: [mcp("mcp:live-divergent", bad!.url), mcp("mcp:live-partial", partial!.url)] },
      { fetchBoard: noBoard, fetchCensus: async () => INDEX, ...fixed },
    );
    const byId = Object.fromEntries((r.record as any).observed.considered.map((x: any) => [x.id, x]));
    expect(byId["mcp:live-divergent"].forbid_policy).toBe("floor:effect-binding-divergent");
    expect(byId["mcp:live-partial"].permit).toBe(true);
    expect((r.chosen as { id: string }).id).toBe("mcp:live-partial");
  });
});
