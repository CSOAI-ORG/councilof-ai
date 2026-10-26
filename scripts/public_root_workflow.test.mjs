/**
 * public-root.yml invariants under the single-writer ruling (owner, 6 Oct 2026): GitHub master
 * changes only through a gated pull request.
 *
 * Every public-root run of 5-6 Oct 2026 (37376012173, 37403227482, 37447955940) signed a fresh
 * root through the OIDC relay, witnessed it on Rekor and stamped it, then:
 *   - the release gate blocked it on "public .ots digest mismatch" for eas-root-attestations.json,
 *     which the EAS step had just rewritten under a proof of its 30 Sep bytes; and
 *   - "commit halt health" ran `git push origin HEAD:master` and branch protection refused it
 *     (GH006 "Changes must be made through a pull request").
 * These tests pin the producer-side fixes: the workflow never pushes master, a changed
 * publisher-owned ledger is re-stamped before the gate, halt health stays with the run, and the
 * signer allow-list still admits this workflow.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const WF = read(".github/workflows/public-root.yml");
const code = (text) => text.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");

// The publish job's steps, in order, as raw text blocks (no YAML dependency in this repo).
function publishSteps() {
  const start = WF.indexOf("\n  publish:\n");
  expect(start).toBeGreaterThan(0);
  const rest = WF.slice(start + 1);
  const nextJob = rest.slice(1).search(/\n  [a-z][a-z0-9_-]*:\n/);
  const job = nextJob === -1 ? rest : rest.slice(0, nextJob + 1);
  return job
    .split(/\n(?=      - )/)
    .slice(1)
    .map((block) => ({ name: (block.match(/^      - name:\s*(.+)$/m) || [])[1] || "", block }));
}
const steps = publishSteps();
const indexOf = (re) => steps.findIndex((s) => re.test(s.name));

describe("public-root.yml never writes master", () => {
  it("has no push to master anywhere in the workflow", () => {
    expect(code(WF)).not.toMatch(/HEAD:master|push\s+origin\s+master|refs\/heads\/master/);
  });

  it("pushes only the one rolling candidate branch", () => {
    const pushes = [...code(WF).matchAll(/git push[^\n]*/g)].map((m) => m[0]);
    expect(pushes.length).toBeGreaterThan(0);
    for (const p of pushes) expect(p).toMatch(/refs\/heads\/\$\{branch\}/);
    expect(WF).toContain('branch="public-root/pending"');
  });

  it("never merges itself: promotion belongs to the candidate maintainer after Bitcoin confirmation", () => {
    expect(code(WF)).not.toMatch(/gh pr merge(?![^\n]*--disable-auto)/);
  });

  // master requires a pull request but no status check (repo settings, 6 Oct 2026), so
  // `gh pr merge --auto` merged without waiting for pr-gates. The maintainer must wait for a
  // pr-gates pass on the exact head and merge only that commit.
  it("the candidate maintainer merges only the exact head commit pr-gates passed on", () => {
    const up = code(read(".github/workflows/public-root-candidate-upgrade.yml"));
    expect(up).not.toMatch(/gh pr merge[^\n]*--auto/);
    expect(up).toMatch(/gh run watch "\$run_id" --repo "\$REPO" --exit-status/);
    expect(up).toMatch(/gh pr merge "\$URL" --repo "\$REPO" --squash --match-head-commit "\$head"/);
    const watch = up.indexOf("gh run watch");
    const merge = up.indexOf("gh pr merge");
    expect(watch).toBeGreaterThan(0);
    expect(merge).toBeGreaterThan(watch);
    // a failed gate stops the merge (the watch sits in an `if !` that exits 1 before the merge)
    expect(up.slice(watch - 10, merge)).toMatch(/if ! gh run watch[\s\S]*exit 1[\s\S]*fi/);
  });

  it("keeps halt health with the run (summary + artifact) and never commits or pushes it", () => {
    const halt = steps.filter((s) => /if: failure\(\)/.test(s.block));
    expect(halt.length).toBeGreaterThanOrEqual(2);
    for (const s of halt) expect(code(s.block)).not.toMatch(/git (commit|push|add)/);
    expect(halt.some((s) => /GITHUB_STEP_SUMMARY/.test(s.block))).toBe(true);
    expect(halt.some((s) => /actions\/upload-artifact@v4/.test(s.block) && /public\/publisher-health\.json/.test(s.block))).toBe(true);
  });
});

describe("public-root.yml keeps its own release gate green", () => {
  it("re-stamps a changed publisher-owned ledger after the EAS step and before the release gate", () => {
    const eas = indexOf(/^EAS on Base/);
    const restamp = indexOf(/^Re-stamp a publisher-owned ledger/);
    const gate = indexOf(/^release integrity/);
    const commit = indexOf(/^commit published tree$/);
    expect(eas).toBeGreaterThan(0);
    expect(restamp).toBeGreaterThan(eas);
    expect(gate).toBeGreaterThan(restamp);
    expect(commit).toBeGreaterThan(gate);
    const block = steps[restamp].block;
    expect(block).toMatch(/scripts\/ots_restamp_ledger\.py --event "root-\$\{short\}" --list-out "\$RUNNER_TEMP\/restamped\.txt"/);
    expect(block).toMatch(/scripts\/ots_manifest_rebuild\.py --apply/);
    // llms.txt quotes the manifest; rebuilding one without the other turns pr-gates red
    expect(block.indexOf("node scripts/llms-txt.mjs")).toBeGreaterThan(block.indexOf("ots_manifest_rebuild.py --apply"));
    expect(block).toMatch(/public\/interop\/ots\/manifest\.json public\/llms\.txt public\/llms-full\.txt >> "\$RUNNER_TEMP\/restamped\.txt"/);
    // what the re-stamp touched is what the commit stages
    expect(steps[commit].block).toMatch(/git add --pathspec-from-file="\$RUNNER_TEMP\/restamped\.txt"/);
  });

  it("runs the candidate release gate before banking, and stages the exact-root witness pointer", () => {
    expect(steps[indexOf(/^release integrity/)].block).toMatch(/root-witness-release-gate\.py --phase candidate/);
    expect(steps[indexOf(/^commit published tree$/)].block).toContain("git add -- public/interop/root-witness-pointer.json");
  });

  it("ships the ledger the re-stamp script guards from the EAS step that writes it", () => {
    expect(read("scripts/ots_restamp_ledger.py")).toContain('MUTABLE_LEDGERS = ("public/interop/eas-root-attestations.json",)');
    expect(read("scripts/eas_attest_root.mjs")).toContain('const OUT = "public/interop/eas-root-attestations.json";');
  });
});

describe("public-root.yml can still sign", () => {
  it("asks for an OIDC token and signs through /api/board-sign, whose allow-list admits this workflow", () => {
    expect(WF).toMatch(/^\s*id-token: write/m);
    expect(steps[indexOf(/^publish public root$/)].block).toContain("BOARD_SIGN_URL: https://councilof.ai/api/board-sign");
    const signer = read("functions/api/board-sign.ts");
    const allowed = signer.match(/const allowedWf = \[([^\]]*)\]/);
    expect(allowed).not.toBeNull();
    expect(allowed[1]).toMatch(/"public-root"/);
  });
});
