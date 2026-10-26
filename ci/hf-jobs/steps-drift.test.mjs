/**
 * ci/hf-jobs guard. Both HF Jobs runners are RETIRED (owner ruling, 6 Oct 2026, SINGLE WRITER:
 * GitHub master is the only production writer and changes only through a gated pull request).
 *
 * deploy.sh was a second route to the Cloudflare Pages project; public-root.sh was a second route
 * to master (it signed with an HF-held copy of the board key and pushed master with a PAT). Their
 * workflow-mirror checks are gone with them. What is pinned now is that each stays retired: no
 * wrangler, no build, no signing, no git, no push, and a non-zero exit.
 *
 * Also pins the Dockerfile's Playwright tag against package-lock.json and that every runner
 * script still parses and never echoes a secret. public-root.yml's own invariants live in
 * scripts/public_root_workflow.test.mjs.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

// The stubs' comments explain what they used to do, so judge the commands, not the prose.
const codeOnly = (sh) => sh.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");

function exitCode(script, args) {
  try {
    execFileSync("bash", [join(HERE, script), ...args], { stdio: "pipe", env: { PATH: process.env.PATH } });
    return 0;
  } catch (e) {
    return e.status;
  }
}

describe("retired HF Jobs runners stay retired", () => {
  it("deploy.sh is retired: it deploys nothing, builds nothing and refuses to run", () => {
    const sh = read("ci/hf-jobs/deploy.sh");
    expect(sh).toMatch(/RETIRED 2026-10-06/);
    expect(sh).toMatch(/single-writer ruling, 6 Oct 2026/);
    expect(codeOnly(sh)).not.toMatch(/wrangler|npm run build|prerender-run|lib\.sh|curl|git /);
    expect(exitCode("deploy.sh", ["https://github.com/CSOAI-ORG/councilof-ai.git", "master"])).toBe(3);
  });

  it("public-root.sh is retired: it signs nothing, pushes nothing and refuses to run", () => {
    const sh = read("ci/hf-jobs/public-root.sh");
    expect(sh).toMatch(/RETIRED 2026-10-06/);
    expect(sh).toMatch(/single-writer ruling, 6 Oct 2026/);
    const code = codeOnly(sh);
    expect(code).not.toMatch(/publish_public_root|witness_public_root|eas_attest_root|board-sign|BOARD_SIGN|GIT_PUSH_TOKEN|lib\.sh|curl|python|node |npm |git /);
    // Even with every secret it used to read present, it exits 3 and writes nothing.
    let code3 = 0;
    let stderr = "";
    try {
      execFileSync("bash", [join(HERE, "public-root.sh"), "https://github.com/CSOAI-ORG/councilof-ai.git", "master"], {
        stdio: "pipe",
        env: { PATH: process.env.PATH, BOARD_SIGN_KEY_PKCS8_B64: "x", GIT_PUSH_TOKEN: "x", DRY_RUN: "0" },
      });
    } catch (e) {
      code3 = e.status;
      stderr = String(e.stderr);
    }
    expect(code3).toBe(3);
    expect(stderr).toContain(".github/workflows/public-root.yml");
  });

  it("the README no longer offers an HF command that runs either retired runner", () => {
    const readme = read("ci/hf-jobs/README.md");
    expect(readme).not.toMatch(/bash ci\/hf-jobs\/(public-root|deploy)\.sh/);
    expect(readme).not.toMatch(/hf jobs scheduled run/);
    expect(readme).toMatch(/`public-root\.sh`[^\n]*RETIRED 2026-10-06/);
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
