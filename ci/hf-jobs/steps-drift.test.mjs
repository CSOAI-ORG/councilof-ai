/**
 * Drift guard between the two runners.
 *
 * deploy.sh / public-root.sh must announce every NAMED step of the GitHub workflow
 * they mirror, in the same order, with the same text. If someone adds a gate to
 * deploy.yml and forgets the HF Jobs runner (or vice versa) this test goes red.
 * Also pins: the exact prerender command, the three wrangler alias deploys, and
 * the Dockerfile's Playwright tag against package-lock.json.
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
  [".github/workflows/deploy.yml", "ci/hf-jobs/deploy.sh"],
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

  it("deploy.sh runs the prerender with the exact deploy.yml invocation", () => {
    const m = read(".github/workflows/deploy.yml").match(/bash scripts\/prerender-run\.sh[^\n]*/);
    expect(m).not.toBeNull();
    expect(read("ci/hf-jobs/deploy.sh")).toContain(m[0].trim());
  });

  it("deploy.sh writes the same three Pages aliases with the same wrangler flags", () => {
    const yml = read(".github/workflows/deploy.yml");
    const sh = read("ci/hf-jobs/deploy.sh");
    const lines = (s) => new Set([...s.matchAll(/npx wrangler pages deploy [^\n]+/g)].map((m) => m[0].trim()));
    expect([...lines(yml)].sort()).toEqual([...lines(sh)].sort());
    expect(lines(sh).size).toBe(3);
  });

  it("deploy.sh runs the same gate scripts deploy.yml runs", () => {
    const yml = read(".github/workflows/deploy.yml");
    const sh = read("ci/hf-jobs/deploy.sh");
    const gates = (s) => new Set([...s.matchAll(/node scripts\/([a-z0-9-]+\.mjs)/g)].map((m) => m[1]));
    expect([...gates(sh)].sort()).toEqual([...gates(yml)].sort());
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
