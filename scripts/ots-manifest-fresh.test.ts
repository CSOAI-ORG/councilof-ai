/**
 * A proof and its manifest row land in the same commit.
 *
 * public/interop/ots/manifest.json is DERIVED from every .ots under public/interop by
 * scripts/ots_manifest_rebuild.py; deploy-prod's root-ots-source gate
 * (scripts/pod-loops/root_ots_manifest_gate.py) refuses a release whose manifest differs from the
 * proof bytes. On 2026-09-26 two directory re-stamps (a2a-directories, mcp-directories) were
 * committed without the rebuild, and the gate held master 630960388 at deploy time — after the
 * build, after review. This runs the same gate in the test suite, so the miss surfaces in the commit
 * that causes it. Fix: python3 scripts/ots_manifest_rebuild.py --apply && node scripts/llms-txt.mjs
 * (or stamp through scripts/ots-restamp-invalid.py stamp_and_rebuild(), which does the first).
 */
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");

describe("OTS manifest is fresh against the proof bytes", () => {
  it("root_ots_manifest_gate.py passes on public/ (the deploy-prod root-ots-source gate)", () => {
    const r = spawnSync("python3", ["scripts/pod-loops/root_ots_manifest_gate.py", "--public-dir", "public"], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: 120_000,
    });
    const out = (r.stdout || "").trim();
    expect(out, `gate said: ${out} ${r.stderr ?? ""}`).not.toContain("FAILED_CLOSED");
    expect(r.status, `gate said: ${out}`).toBe(0);
    expect(JSON.parse(out.split("\n").pop()!).state).toBe("VALID_PREIMAGE_ONLY");
  }, 150_000);
});
