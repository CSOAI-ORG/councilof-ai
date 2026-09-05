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
