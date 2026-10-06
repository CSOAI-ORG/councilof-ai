/**
 * Drift guard between the HF Jobs runner and the GitHub workflow it mirrors.
 *
 * public-root.sh must announce every NAMED step of public-root.yml, in the same order,
 * with the same text. Also pins the Dockerfile's Playwright tag against package-lock.json.
 *
 * deploy.sh is RETIRED (owner ruling, 6 Oct 2026: GitHub master via deploy.yml is the only
 * production writer). Its deploy.yml mirror checks are gone with it; what is pinned now is
 * that it stays retired: it runs no wrangler deploy, no build and no gate, and it exits
 * non-zero.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

// Named steps of a workflow, in file order. `- name:` only appears on steps here
// (the workflow's own `name:` is not list-prefixed). Quoted names are unquoted.
function workflowSteps(yml) {
  return [...yml.matchAll(/^\s*- name:\s*(.+?)\s*$/gm)].map((m) => {
    const raw = m[1];
    const q = raw.match(/^(["'])(.*)\1$/);
    return q ? q[2] : raw;
  });
}
// step '<name>' announcements in a runner script, in file order.
const scriptSteps = (sh) => [...sh.matchAll(/^\s*step '([^']+)'/gm)].map((m) => m[1]);

const pairs = [
  [".github/workflows/public-root.yml", "ci/hf-jobs/public-root.sh"],
];

describe("HF Jobs runner mirrors the GitHub workflow step list", () => {
  for (const [yml, sh] of pairs) {
    it(`${sh} announces exactly the named steps of ${yml}, in order`, () => {
      const expected = workflowSteps(read(yml));
      const actual = scriptSteps(read(sh));
      expect(expected.length).toBeGreaterThan(3);
      expect(actual).toEqual(expected);
    });
  }

  it("deploy.sh is retired: it deploys nothing, builds nothing and refuses to run", () => {
    const sh = read("ci/hf-jobs/deploy.sh");
    expect(sh).toMatch(/RETIRED 2026-10-06/);
    expect(sh).toMatch(/single-writer ruling, 6 Oct 2026/);
    // The stub's comment explains what it used to do, so judge the commands, not the prose.
    const code_only = sh.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
    expect(code_only).not.toMatch(/wrangler|npm run build|prerender-run|lib\.sh|curl|git /);
    let code = 0;
    try {
      execFileSync("bash", [join(HERE, "deploy.sh"), "https://github.com/CSOAI-ORG/councilof-ai.git", "master"], { stdio: "pipe" });
    } catch (e) {
      code = e.status;
    }
    expect(code).toBe(3);
  });

  it("uses the candidate witness gate before publication in both public-root runners", () => {
    for (const source of [read(".github/workflows/public-root.yml"), read("ci/hf-jobs/public-root.sh")]) {
      expect(source).toMatch(/root-witness-release-gate\.py --phase candidate/);
    }
  });

  it("stages the mutable exact-root witness pointer in both public-root runners", () => {
    for (const source of [
      read(".github/workflows/public-root.yml"),
      read("ci/hf-jobs/public-root.sh"),
    ]) {
      expect(source).toContain("git add -- public/interop/root-witness-pointer.json");
    }
  });

  it("Dockerfile base tag matches the playwright version in package-lock.json", () => {
    const lock = JSON.parse(read("package-lock.json"));
    const pw = lock.packages["node_modules/playwright"].version;
    const from = read("ci/hf-jobs/Dockerfile").match(/^FROM\s+mcr\.microsoft\.com\/playwright:v([\d.]+)-/m);
    expect(from).not.toBeNull();
    expect(from[1]).toBe(pw);
  });

  it("every runner script parses (bash -n) and never echoes a secret value", () => {
    for (const f of ["lib.sh", "deploy.sh", "public-root.sh", "bootstrap.sh", "mirror-refresh.sh"]) {
      execFileSync("bash", ["-n", join(HERE, f)]);
      const src = read(`ci/hf-jobs/${f}`);
      // Any expansion of a secret name into stdout/argv is forbidden; the credential
      // helper (password=$GIT_PUSH_TOKEN) is the single allowed use and lives in lib.sh.
      const bad = src.match(/echo[^\n]*\$\{?(BOARD_SIGN_KEY_PKCS8_B64|CLOUDFLARE_API_TOKEN|HF_TOKEN|EAS_ATTESTER_PRIVATE_KEY)\b/);
      expect(bad, `${f}: ${bad?.[0]}`).toBeNull();
    }
  });
});
