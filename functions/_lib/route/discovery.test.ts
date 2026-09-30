/**
 * GSPC Route x ARD/ADS discovery source (discovery.ts). The fixture is RECORDED LIVE from the AGNTCY Directory
 * gateway (functions/_lib/route/__fixtures__/ard-agntcy-gateway.json: verbatim records, source page sha256s),
 * never an invented upstream shape.
 *
 * FAIL-FIRST (lead rule, 30 Sep 2026: listing state != measurement state): the "directory claims are inert" test
 * was run first against a planted defect in which a directory record marked trusted+verified set the candidate's
 * census to CONSISTENT; it failed there (receipt in the land commit), and passes on the real source.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { route } from "./route";
import { normaliseEndpointUrl } from "./census";
import { cedarEntity } from "./policy";
import { ARD_LISTINGS, ardListingSource, entryToCandidate, parseListPage } from "./discovery";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const FX = JSON.parse(readFileSync(join(HERE, "__fixtures__", "ard-agntcy-gateway.json"), "utf8"));
const INDEX = JSON.parse(readFileSync(join(ROOT, "public", "interop", "effect-binding-census-index.json"), "utf8"));
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const fixed = { now: () => new Date("2026-09-30T12:00:00.000Z"), uuid: () => "00000000-0000-4000-8000-00000000a4d5" };
const noBoard = async () => ({ axes: [] });

/** Serves the recorded pages by page token, exactly as the gateway paginates. */
function gateway(pages = FX.pages, calls: string[] = []) {
  return async (url: string) => {
    calls.push(url);
    const tok = new URL(url).searchParams.get("page_token") ?? "";
    if (!(tok in pages)) throw new Error(`no recorded page for token ${tok}`);
    return JSON.parse(JSON.stringify(pages[tok]));
  };
}
const agntcy = (pages = FX.pages, calls: string[] = []) => ({ agntcy: ardListingSource(ARD_LISTINGS.agntcy, gateway(pages, calls)) });

describe("ARD list shapes", () => {
  it("reads the AGNTCY gateway envelope and the ARD v0.91 envelope", () => {
    const g = parseListPage(FX.pages[""]);
    expect(g?.entries.length).toBe(2);
    expect(g?.next).toBe("2");
    expect(g?.total).toBe(3087);
    const a = parseListPage({ items: [{ identifier: "urn:air:x.org:mcp:a" }], pageToken: "p2", total: 9 });
    expect(a).toEqual({ entries: [{ identifier: "urn:air:x.org:mcp:a" }], next: "p2", total: 9 });
    expect(parseListPage({ nothing: true })).toBeNull();
  });
});

describe("ardListingSource over the recorded gateway pages", () => {
  it("paginates, keeps only routable kinds, takes only declared endpoints", async () => {
    const calls: string[] = [];
    const r = await agntcy(FX.pages, calls).agntcy.discover(8);
    expect(calls.length).toBe(2);
    expect(r.read).toMatchObject({ state: "LIVE", pages_read: 2, entries_read: 3, candidates: 2, skipped_not_routable: 1, total_declared: 3087, truncated: true });
    const [sentry, hello] = r.candidates;
    expect(sentry.kind).toBe("mcp_tool");
    expect(sentry.endpoint).toBe("https://mcp.sentry.dev/mcp");
    expect(sentry.provider).toBe("mcp.sentry.dev");
    expect(sentry.source).toBe("directory");
    expect(sentry.uncheckable).toEqual([]);
    expect(sentry.directory?.listing_state).toBe("LISTED");
    expect(sentry.directory?.declared_by).toBe("directory");
    // an a2a card that declares http://localhost is kept in the record but can never be permitted
    expect(hello.kind).toBe("a2a_agent");
    expect(hello.endpoint).toBeNull();
    expect(hello.uncheckable.join(" ")).toMatch(/declared endpoint refused/);
  });

  it("an unreachable listing yields no candidates and says so", async () => {
    const src = ardListingSource(ARD_LISTINGS.agntcy, async () => { throw new Error("down"); });
    const r = await src.discover(4);
    expect(r.read.state).toBe("UNREACHABLE");
    expect(r.candidates).toEqual([]);
  });
});

describe("listing state is kept apart from measurement state (fail-first)", () => {
  it("directory claims (trusted, verified, safe scans, usage) reach no rule and set no measurement", async () => {
    const rec = JSON.parse(JSON.stringify(FX.pages[""].results[0]));
    rec.metadata = { ...(rec.metadata || {}), "agntcy.dir.trust.v1.Status": { trusted: true, verified: true }, "agntcy.dir.security.v1.ScanResult": { isSafe: true } };
    const plain = await entryToCandidate(FX.pages[""].results[0], ARD_LISTINGS.agntcy);
    const claimed = await entryToCandidate(rec, ARD_LISTINGS.agntcy);
    expect(claimed.candidate.census.effect_binding).toBe("UNMEASURED");
    expect(cedarEntity(claimed.candidate, { measured_on_axis: false })).toEqual(cedarEntity(plain.candidate, { measured_on_axis: false }));
    expect(claimed.candidate.directory?.directory_claims).toMatchObject({ "agntcy.dir.trust.v1.Status": { trusted: true, verified: true } });

    const pages = JSON.parse(JSON.stringify(FX.pages));
    pages[""].results[0] = rec;
    const out = await route({ task: "summarise an error", discover: { listing: "agntcy", max: 8 } }, { fetchBoard: noBoard, discovery: agntcy(pages), ...fixed });
    const considered = (out.record as any).observed.considered;
    expect(considered.every((c: any) => c.census.effect_binding === "UNMEASURED")).toBe(true);
    expect(JSON.stringify(out.record)).not.toMatch(/"trusted":true|"verified":true|isSafe/);
    expect((out.record as any).limits.join(" ")).toMatch(/LISTED by a directory/);
  });

  it("only OUR signed census measures a discovered endpoint: DOES_NOT_BIND is forbidden by the floor", async () => {
    const e: Record<string, { outcome: string }> = { [sha(normaliseEndpointUrl("https://mcp.sentry.dev/mcp") as string)]: { outcome: "DOES_NOT_BIND" } };
    const out = await route(
      { task: "summarise an error", discover: { listing: "agntcy", max: 8 } },
      { fetchBoard: noBoard, fetchCensus: async () => ({ ...INDEX, entries: e }), discovery: agntcy(), ...fixed },
    );
    const byId = Object.fromEntries((out.record as any).observed.considered.map((c: any) => [c.id, c]));
    const s = Object.values(byId).find((c: any) => c.directory?.identifier?.includes("baeareidglm5")) as any;
    expect(s.census.effect_binding).toBe("DIVERGENT");
    expect(s.permit).toBe(false);
    expect(s.forbid_policy).toMatch(/effect-binding/);
    expect(out.state).toBe("NO_PERMITTED_CANDIDATE");
    expect((out.record as any).observed.discovery).toMatchObject({ state: "LIVE", listing: ARD_LISTINGS.agntcy, candidates: 2 });
  });
});

describe("arguments", () => {
  it("refuses discover where no source is wired, and unknown listings", async () => {
    const a = await route({ task: "x", discover: { listing: "agntcy" } }, { fetchBoard: noBoard, ...fixed });
    expect(a.state).toBe("BAD_ARGUMENTS");
    expect((a.errors as string[]).join()).toMatch(/not wired/);
    const b = await route({ task: "x", discover: { listing: "https://evil.example/v1/agents" } }, { fetchBoard: noBoard, discovery: agntcy(), ...fixed });
    expect(b.state).toBe("BAD_ARGUMENTS");
    const c = await route({ task: "x", discover: { listing: "agntcy", max: 500 } }, { fetchBoard: noBoard, discovery: agntcy(), ...fixed });
    expect(c.state).toBe("BAD_ARGUMENTS");
  });

  it("a route without discover is unchanged (no discovery block, no directory limit)", async () => {
    const out = await route({ task: "x" }, { fetchBoard: noBoard, ...fixed });
    expect((out.record as any).observed.discovery).toBeUndefined();
    expect((out.record as any).limits.join(" ")).not.toMatch(/LISTED by a directory/);
  });
});
