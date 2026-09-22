/**
 * The producer gate. A claim lives in the artifact AND in the thing that generates it, so both
 * derived surfaces are checked against their producers here rather than trusted:
 *
 *   · the specification HTML / spec.json / version index vs the Markdown document of record;
 *   · the register vs the registry files actually on disk under public/claims/.
 *
 * If this goes red after another lane lands a registry revision, that is the gate working:
 * run `node scripts/claim-maintenance-register.mjs` and commit what it writes. The register is
 * generated from what exists (spec §7.5); a stale committed copy is a register that reports a
 * population nobody holds.
 */
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const run = (script) =>
  spawnSync(process.execPath, [join(ROOT, "scripts", script), "--check"], {
    cwd: ROOT,
    encoding: "utf8",
  });

describe("claim-maintenance producers", () => {
  it("the specification's derived files match its Markdown document of record", () => {
    const r = run("claim-maintenance-spec.mjs");
    expect(`${r.stdout}${r.stderr}`).not.toMatch(/DRIFT|MISSING/);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
  });

  it("the committed register matches the registries on disk", () => {
    const r = run("claim-maintenance-register.mjs");
    expect(`${r.stdout}${r.stderr}`).not.toMatch(/DRIFT|MISSING/);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
  });
});
