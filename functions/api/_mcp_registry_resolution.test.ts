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
