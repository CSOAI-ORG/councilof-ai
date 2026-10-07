// Runs scripts/crosswalk/test_emit_intoto.py inside the pr-gates "Unit tests" step.
//
// The Python suite existed but nothing invoked it, so the in-toto selection rule could change
// without a red check. The rule now has to hold a pick steady while the mill lands new cards
// (a moved pick renames a file the OTS-stamped regulatory inventory pins), and that property is
// only worth something if a gate runs it.
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");

describe("crosswalk in-toto producer", () => {
  it("test_emit_intoto.py passes: stable selection, digest binding, determinism", () => {
    const run = spawnSync("python3", ["scripts/crosswalk/test_emit_intoto.py"], { cwd: ROOT, encoding: "utf8" });
    if (run.status !== 0) console.error(run.stdout, run.stderr);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("ALL PASS");
    expect(run.stdout).toContain("a newly landed smaller MEASURED id does NOT move a pick that is still current");
  }, 120_000);
});
