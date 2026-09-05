import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * public/interop/mcp-directories.json publishes where the fleet is listed. On 2026-09-05 six of
 * its seven rows derived their state from a scan of OUR OWN slug files — which answers "do we
 * hold a note saying we are listed", not "are we listed". Two were wrong in the direction that
 * matters: glama and docker-mcp were published NOT_LISTED while we were listed on both.
 */
const doc = JSON.parse(
  readFileSync(new URL("../../public/interop/mcp-directories.json", import.meta.url), "utf8"),
) as { principle: string; directories: { id: string; state: string; evidence: string; probe: string }[] };

describe("mcp-directories states come from probing the directory, not our own files", () => {
  it("never publishes a state whose probe is a scan of our own slugs", () => {
    // Only the PROBE field — the method actually used. An evidence line may legitimately say
    // "the previous NOT_LISTED was a slug scan", and matching that would flag the row for
    // describing the very defect it records. My first version did exactly that.
    const offenders = doc.directories.filter((r) => /slug scan|estate slug/i.test(r.probe));
    expect(offenders.map((o) => o.id), "a slug scan cannot see a third-party directory").toEqual([]);
  });

  it("gives every row a runnable probe naming the directory", () => {
    for (const r of doc.directories) {
      expect(r.probe.length, `${r.id} probe`).toBeGreaterThan(20);
      expect(r.probe, `${r.id} probe must invoke something`).toMatch(/curl|playwright|gh api/i);
    }
  });

  it("allows UNKNOWN, and never lets a dead probe be published as absence", () => {
    const states = new Set(doc.directories.map((r) => r.state));
    for (const s of states) expect(["LISTED", "NOT_LISTED", "UNKNOWN"]).toContain(s);
    // The FIRST version of this case pinned pulsemcp to UNKNOWN. That froze a transient state as
    // an invariant: UNKNOWN meant "their API answers 410 and we have not checked another way",
    // and the moment their sitemap answered it (213 csoai server URLs) the row became LISTED and
    // this test failed for being right. The rule is about the SHAPE of a claim, not a row's value.
    for (const r of doc.directories) {
      if (r.state !== "NOT_LISTED") continue;
      expect(
        /410|Gone|no longer exists|unreachable/i.test(r.evidence),
        `${r.id}: NOT_LISTED must not rest on a dead endpoint — that is UNKNOWN`,
      ).toBe(false);
    }
  });

  it("records the two rows that were published wrong", () => {
    expect(JSON.stringify(doc)).toMatch(/glama and docker-mcp were published as NOT_LISTED/i);
  });
});

describe("every directory row names the surface its state came from", () => {
  const doc2 = JSON.parse(
    readFileSync(new URL("../../public/interop/mcp-directories.json", import.meta.url), "utf8"),
  ) as { directories: { id: string; state: string; surface?: string }[] };

  it("gives every row a surface", () => {
    for (const r of doc2.directories) {
      expect(["api", "sitemap", "rendered", "ours"], `${r.id}`).toContain(r.surface);
    }
  });

  it("never lets `ours` be evidence about a third party", () => {
    // Six of these seven rows once carried the probe "slug scan" — they reported OUR filesystem
    // and published LISTED/NOT_LISTED about someone else's directory. Two were flatly wrong.
    const bad = doc2.directories.filter((r) => r.surface === "ours");
    expect(bad.map((b) => b.id), "a scan of our own files says nothing about a directory").toEqual([]);
  });

  it("does not rest a state on `rendered` alone where an authoritative surface was available", () => {
    // A rendered search echoes the query. On 2026-09-05 that produced a false LISTED (glama's
    // link count) and a false NOT_LISTED (smithery) on the same day.
    const rendered = doc2.directories.filter((r) => r.surface === "rendered");
    for (const r of rendered) {
      expect(["UNKNOWN", "NOT_LISTED"], `${r.id}: rendered may not assert LISTED`).toContain(r.state);
    }
  });
});

// ---------------------------------------------------------------------------
// WHY THIS EXISTS. The mandate on directory listings is "we are listed, the
// listing resolves, and the tool count is TRUE". The third clause is the one
// that rots silently: nothing on Smithery re-reads our tool definitions, so a
// tool added or dropped here stays as it was there until someone republishes.
// csoai/gspc still advertises `measure` and `jail-probe`, which this door
// answers with -32601 "mill-tool dropped". These assertions re-derive the
// served set from the two canonical files the door actually reads, so the
// census cannot quietly disagree with the code it describes.
// ---------------------------------------------------------------------------
describe("the recorded tool counts are derived from the door, not typed", () => {
  const J = (rel: string) => JSON.parse(readFileSync(new URL(rel, import.meta.url), "utf8"));
  const free: string[] = J("../mcp/gspc-tools.json").tools.map((t: { name: string }) => t.name);
  const paid: string[] = J("../mcp/paid-tools.json").tools.map((t: { name: string }) => t.name);
  const row = J("../../public/interop/mcp-directories.json").directories.find(
    (r: { id: string }) => r.id === "smithery",
  );

  it("served counts match the canonical tool-definition files", () => {
    expect(row.tool_counts.served_by_the_door.free).toBe(free.length);
    expect(row.tool_counts.served_by_the_door.paid).toBe(paid.length);
    expect(row.tool_counts.served_by_the_door.total).toBe(free.length + paid.length);
    expect(row.tool_counts.served_by_the_door.names).toEqual([...free, ...paid]);
  });

  it("nothing recorded as declared-not-served is in fact served", () => {
    const servedNames = new Set([...free, ...paid]);
    for (const l of row.tool_counts.listings as Array<Record<string, any>>) {
      for (const n of l.declared_not_served ?? []) {
        expect(servedNames.has(n), `${n} is recorded as not served but the door serves it`).toBe(false);
      }
    }
  });

  it("nothing recorded as served-not-declared has been dropped from the door", () => {
    const servedNames = new Set([...free, ...paid]);
    for (const l of row.tool_counts.listings as Array<Record<string, any>>) {
      for (const n of l.served_not_declared ?? []) {
        expect(servedNames.has(n), `${n} is recorded as served but the door no longer serves it`).toBe(true);
      }
    }
  });

  it("a listing whose declared names are all real is not marked FALSE", () => {
    const servedNames = new Set([...free, ...paid]);
    for (const l of row.tool_counts.listings as Array<Record<string, any>>) {
      const unreal = (l.declared_not_served ?? []).filter((n: string) => !servedNames.has(n));
      if (l.verdict === "FALSE") {
        expect(unreal.length, `${l.qualifiedName} is marked FALSE with no unserved tool named`).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Glama is the only directory whose tool count is exactly right, and the only
// one advertising the four x402-metered tools. That correctness is a fact about
// TODAY that nothing keeps true: Glama re-inspects on its own schedule and this
// repo can add or drop a tool at any time. Derive the comparison from the
// canonical files so the claim cannot outlive the code it describes.
// ---------------------------------------------------------------------------
describe("Glama's recorded tool truth is derived, not asserted", () => {
  const J = (rel: string) => JSON.parse(readFileSync(new URL(rel, import.meta.url), "utf8"));
  const free: string[] = J("../mcp/gspc-tools.json").tools.map((t: { name: string }) => t.name);
  const paid: string[] = J("../mcp/paid-tools.json").tools.map((t: { name: string }) => t.name);
  const served = [...free, ...paid].sort();
  const row = J("../../public/interop/mcp-directories.json").directories.find(
    (r: { id: string }) => r.id === "glama",
  );

  it("the names recorded as Glama's are exactly the names the door serves", () => {
    expect(row.tool_counts.names).toEqual(served);
    expect(row.tool_counts.served_by_the_door).toBe(served.length);
  });

  it("TRUE is only claimed when declared equals served", () => {
    if (row.tool_counts.verdict === "TRUE") {
      expect(row.tool_counts.declared).toBe(row.tool_counts.served_by_the_door);
    }
  });

  it("the paid tools are part of what makes Glama's listing complete", () => {
    // The distinguishing claim in the row's own text. If the paid tools ever stop being
    // part of the served set, that sentence stops being true and must be rewritten.
    for (const p of paid) {
      expect(row.tool_counts.names, `${p} is cited as advertised by Glama but is no longer served`)
        .toContain(p);
    }
  });

  it("the health verdict accounts for every connector page it counted", () => {
    const h = row.health;
    expect(h.unhealthy + h.healthy).toBe(h.showing_a_status);
    expect(h.showing_a_status).toBeLessThanOrEqual(h.connector_pages);
    if (h.verdict.startsWith("EVERY")) expect(h.healthy).toBe(0);
  });
});

describe("the Glama tool-count audit reports what it measured", () => {
  const J = (rel: string) => JSON.parse(readFileSync(new URL(rel, import.meta.url), "utf8"));
  const a = J("../../public/interop/mcp-directories.json").directories.find(
    (r: { id: string }) => r.id === "glama",
  ).tool_count_audit;

  it("match + mismatch accounts for everything checked", () => {
    expect(a.match + a.mismatch).toBe(a.checked);
    expect(a.mismatches.length).toBe(a.mismatch);
  });

  it("every mismatch names both numbers and the tools actually registered", () => {
    for (const m of a.mismatches) {
      expect(m.declared).not.toBe(m.registered);
      expect(m.tools.length, `${m.package}: registered ${m.registered} but lists ${m.tools.length} names`)
        .toBe(m.registered);
    }
  });

  it("keeps saying what the method could NOT establish", () => {
    // Declared-vs-registered is not declared-vs-tools/list. No server was started.
    expect(a.method).toMatch(/not declared-vs-tools\/list|no tool was called/i);
  });
});
