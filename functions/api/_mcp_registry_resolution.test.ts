import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * public/interop/mcp-registry-resolution.json answers the second clause of the directory
 * mandate — does the listing RESOLVE — for all 330 CSOAI-ORG entries in the official MCP
 * registry, on both surfaces they advertise.
 *
 * These assertions are offline and structural on purpose. They cannot re-run the network
 * probe, so they guard the thing a stale measurement file actually gets wrong: totals that
 * no longer add up, a failure with no reason, and — the one that matters — a verdict that
 * has drifted away from the rows underneath it. A file claiming NONE USABLE while carrying
 * a usable remote is worse than no file.
 */
const doc = JSON.parse(
  readFileSync(new URL("../../public/interop/mcp-registry-resolution.json", import.meta.url), "utf8"),
);

describe("the resolution measurement is internally consistent", () => {
  it("the package totals add up and nothing is claimed beyond what was checked", () => {
    const p = doc.packages;
    expect(p.resolved).toBeLessThanOrEqual(p.checked);
    expect(p.exact_version_present).toBeLessThanOrEqual(p.resolved);
    expect(Object.values(p.by_registry).reduce((a: number, b) => a + Number(b), 0)).toBe(p.checked);
  });

  it("ALL RESOLVE is only claimed when every package resolved at its named version", () => {
    if (doc.packages.verdict === "ALL RESOLVE") {
      expect(doc.packages.resolved).toBe(doc.packages.checked);
      expect(doc.packages.exact_version_present).toBe(doc.packages.checked);
    }
  });

  it("the remote host tally equals the remote rows", () => {
    const byHost = Object.values(doc.remotes.by_host).reduce((a: number, b) => a + Number(b), 0);
    expect(byHost).toBe(doc.remotes.remote_rows);
  });

  it("NONE USABLE is only claimed when the failures account for every remote row", () => {
    if (doc.remotes.verdict === "NONE USABLE") {
      expect(doc.remotes.usable).toBe(0);
      const accounted = doc.remotes.failures.reduce((a: number, f: { rows: number }) => a + f.rows, 0);
      expect(accounted, "a remote row is unaccounted for: it is neither usable nor a named failure")
        .toBe(doc.remotes.remote_rows);
    }
  });

  it("every failure names a host, a count, a reason and a probe", () => {
    for (const f of doc.remotes.failures) {
      expect(f.host).toBeTruthy();
      expect(f.rows).toBeGreaterThan(0);
      expect(f.reason, `${f.host} has no reason`).toBeTruthy();
      expect(f.probe, `${f.host} has no probe command`).toBeTruthy();
    }
  });

  it("keeps the two surfaces separate — a sound package is not evidence of a sound remote", () => {
    // The whole point of the file: 330/330 packages resolve AND 0/40 remotes work. A future
    // edit that lets the good number stand in for the bad one erases the finding.
    expect(doc.packages.verdict).not.toBe(doc.remotes.verdict);
    expect(doc.what_this_does_not_establish.join(" ")).toMatch(/not a working server|was not installed/i);
  });
});

describe("the coverage measurement keeps its weak number quarantined", () => {
  const c = doc.coverage;

  it("the unpublished split adds up and the arithmetic to 'available' holds", () => {
    const u = c.unpublished;
    expect(u.registry_today + u.total).toBe(u.available_if_published);
    expect(u.total).toBeLessThanOrEqual(u.repos_declaring_an_mcp_sdk);
    expect(c.published_in_registry).toBeLessThanOrEqual(c.mcp_named);
  });

  it("says out loud that a declared dependency is not a running server", () => {
    expect(c.method).toMatch(/no repo was cloned, installed or run/i);
  });

  it("keeps the superseded 64 next to the reason it was wrong", () => {
    // It was published in this same file and understated the answer by more than half, because it
    // filtered on the repo NAME. If a later edit deletes the record, the next reader inherits the
    // same name-based instinct with nothing to warn them.
    expect(c.superseded_figure.value).toBe(64);
    expect(c.superseded_figure.why_wrong).toMatch(/name is not a detector/i);
    // and the second wrong answer keeps its own reason too
    expect(c.superseded_figure.then).toBe(142);
    expect(c.superseded_figure.overcounted).toBe(153);
    expect(c.superseded_figure.why_wrong).toMatch(/UNDERCOUNTED/);
    expect(c.superseded_figure.why_wrong).toMatch(/OVERCOUNTED/);
    expect(c.what_a_sample_caught.false_positives).toBeGreaterThan(0);
    expect(c.superseded_figure.why_wrong).toMatch(/mcp>=1\.0\.0/);
    // the net was published as if it were the disagreement; both numbers must stay
    expect(c.instrument_disagreement.actual_disagreement).toBe(
      c.instrument_disagreement.file_shape_only + c.instrument_disagreement.dependency_only,
    );
    expect(c.instrument_disagreement.net).not.toBe(c.instrument_disagreement.actual_disagreement);
  });

  it("the 51 stays quarantined and never becomes a top-level claim", () => {
    // It overcounts for two independent reasons and the authoritative answer (25) already exists.
    // If a later edit promotes it out of this box it stops carrying its own refutation.
    const q = c.a_number_deliberately_not_published;
    expect(q.value).toBe(51);
    expect(q.why_not).toMatch(/must not be quoted/i);
    expect(q.why_not).toMatch(/\b25\b/);
    const top = JSON.stringify({ ...c, a_number_deliberately_not_published: undefined });
    expect(top).not.toMatch(/\b51\b/);
  });
});
