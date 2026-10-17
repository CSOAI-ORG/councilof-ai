/**
 * The csoai.org upload holds no root index.html, so a /.well-known/ path with no file is 404.
 *
 * What was wrong (read live, 13 Oct 2026 07:30Z to 07:50Z). https://csoai.org/.well-known/<anything>
 * answered 200 text/html, 1,740 bytes: the index.html of CSOAI-ORG/csoai-static-deploy2, byte for
 * byte (sha256 a873ee8a…65795). Cloudflare Pages answers a path that has no file with the
 * upload's /index.html and status 200 when the upload holds one and no top-level 404.html, and
 * the csoai-site middleware passes every /.well-known/* path to the asset server.
 *
 * Four deployments of the Pages project csoai-site, same paths, same day:
 *   4371cb20 (28 Sep) and 2451e6fc (1 Oct): no index.html in the upload -> 404, empty body
 *   8c45f262 (what csoai.org serves) and main.csoai-site.pages.dev (this workflow's upload):
 *   index.html in the upload -> 200 with the page
 * Each of them serves /.well-known/did.json as before. So the fix is to leave the page out.
 *
 * Pages itself cannot run in this test. What can: the exact lines the workflow runs, on a small
 * site, and the order of the steps around them. The answer Pages gives is read live by the
 * workflow after every upload (last test).
 */
import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const WORKFLOW = readFileSync(join(ROOT, ".github/workflows/csoai-site-deploy.yml"), "utf8");

const code = (text) => text.split("\n").filter((l) => !/^\s*#/.test(l)).join("\n");
// The deploy job's steps, in order, as raw text blocks (no YAML dependency in this repo).
const steps = WORKFLOW.slice(WORKFLOW.indexOf("\n    steps:\n"))
  .split(/\n(?=      - )/)
  .slice(1)
  .map((block) => ({ name: (block.match(/^      - name:\s*(.+)$/m) || [])[1] || "", block }));
// The shell a step runs: the lines under `run: |`, with the YAML indent removed.
const script = (step) => {
  const at = step.block.indexOf("        run: |\n");
  if (at === -1) return "";
  return step.block
    .slice(at + "        run: |\n".length)
    .split("\n")
    .map((l) => l.replace(/^ {10}/, ""))
    .join("\n");
};

const removal = steps.findIndex((s) => /rm -f _site\/index\.html/.test(code(s.block)));
const build = steps.findIndex((s) => /^Build allowlisted _site/.test(s.name));
const uploads = steps.map((s, i) => (/wrangler pages deploy _site/.test(code(s.block)) ? i : -1)).filter((i) => i !== -1);

const made = [];
function site(files) {
  const dir = mkdtempSync(join(tmpdir(), "apex-upload-"));
  made.push(dir);
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});
// GitHub runs a step's script with `bash --noprofile --norc -eo pipefail`.
const runStep = (cwd) => spawnSync("bash", ["--noprofile", "--norc", "-eo", "pipefail", "-c", script(steps[removal])], { cwd, encoding: "utf8" });

const DID = '{"id":"did:web:csoai.org"}';
const FILES = {
  "_site/index.html": "<title>the page Pages would hand back for a missing file</title>",
  "_site/root.json": "{}",
  "_site/portal/index.html": "<p>a page in a folder is not the fallback</p>",
  "_site/.well-known/did.json": DID,
  "_site/.well-known/agent-card.json": '{"name":"card"}',
  "_site/.well-known/agent.json": '{"name":"card"}',
  "_site/.well-known/mcp/server-card.json": '{"name":"server"}',
};

describe("csoai-site-deploy.yml leaves the fallback page out of the upload", () => {
  it("has the step, after the build and before every upload, in the directory they run in", () => {
    expect(removal).toBeGreaterThan(-1);
    expect(build).toBeGreaterThan(-1);
    expect(removal).toBeGreaterThan(build);
    expect(uploads.length).toBeGreaterThan(0);
    for (const u of uploads) {
      expect(u).toBeGreaterThan(removal);
      expect(steps[u].block).toMatch(/working-directory:\s*src/);
    }
    expect(steps[removal].block).toMatch(/working-directory:\s*src/);
    expect(steps[removal].block).not.toMatch(/continue-on-error|\|\| true/);
  });

  it("no step from there to the last upload puts an index.html back", () => {
    expect(removal).toBeGreaterThan(-1);
    for (let i = removal + 1; i <= Math.max(...uploads); i += 1) {
      expect([steps[i].name, /index\.html/.test(code(steps[i].block))]).toEqual([steps[i].name, false]);
    }
  });

  it("the lines it runs remove the root index.html and nothing else", () => {
    const dir = site(FILES);
    const r = runStep(dir);
    expect([r.status, r.stderr]).toEqual([0, ""]);
    expect(existsSync(join(dir, "_site/index.html"))).toBe(false);
    for (const rel of Object.keys(FILES).filter((f) => f !== "_site/index.html")) {
      expect([rel, readFileSync(join(dir, rel), "utf8")]).toEqual([rel, FILES[rel]]);
    }
    expect(readdirSync(join(dir, "_site")).sort()).toEqual([".well-known", "portal", "root.json"]);
  });

  it("passes when the source ships no index.html at all", () => {
    const { ["_site/index.html"]: _dropped, ...rest } = FILES;
    const r = runStep(site(rest));
    expect(r.status).toBe(0);
  });

  it("stops the job when the build holds no did.json", () => {
    const { ["_site/.well-known/did.json"]: _dropped, ...rest } = FILES;
    const r = runStep(site(rest));
    expect(r.status).not.toBe(0);
  });

  it("reads an unknown /.well-known/ path on the live apex after the upload and requires 404", () => {
    const verify = steps.findIndex((s) => /^Verify trust root live on the apex/.test(s.name));
    expect(verify).toBeGreaterThan(Math.max(...uploads));
    const run = code(steps[verify].block);
    expect(run).toMatch(/https:\/\/csoai\.org\/\.well-known\/no-such-file-\$\{GITHUB_RUN_ID\}/);
    expect(run).toMatch(/\[ "\$code" = "404" \] \|\| \{ echo "FAIL: [^\n]*expected 404"; exit 1; \}/);
  });
});
