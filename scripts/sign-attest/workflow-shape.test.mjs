/**
 * .github/workflows/hf-fin-shells-attest.yml - the shape that makes it safe to hold an OIDC grant.
 *
 * The job can ask the board signer for a signature, so what it can reach matters more than what
 * it does. These tests read the workflow as text (this repo carries no YAML parser) and pin:
 * one OIDC grant and no write grant, no stored credential, no install step, master's code only,
 * actions named by commit, no block that could change how the script is run, and the two inputs
 * reaching the script as environment variables and never inside a shell line.
 */
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const FILE = ".github/workflows/hf-fin-shells-attest.yml";
const WF = read(FILE);
const lines = WF.split("\n");
const code = lines.filter((l) => !/^\s*#/.test(l)).join("\n");
const count = (text, needle) => text.split(needle).length - 1;

// The steps of the one job, in order, as raw text blocks.
const steps = WF.slice(WF.indexOf("\n    steps:\n")).split(/\n(?=      - )/).slice(1);
/** The dedented body of a step's `run: |` block, or its one-line `run:` value. */
function runOf(step) {
  const ls = step.split("\n");
  const i = ls.findIndex((l) => /^\s+run:/.test(l));
  if (i < 0) return null;
  const inline = ls[i].replace(/^\s+run:\s*/, "");
  if (inline !== "|") return inline;
  const indent = ls[i].match(/^\s*/)[0].length;
  const body = [];
  for (const l of ls.slice(i + 1)) {
    if (l.trim() !== "" && l.match(/^\s*/)[0].length <= indent) break;
    body.push(l.slice(indent + 2));
  }
  return body.join("\n");
}

describe("hf-fin-shells-attest.yml - name and trigger", () => {
  it("is named so that today's signer rule admits it, and its first comment line says why", () => {
    expect(lines[0]).toMatch(/^# .*hf-fin-shells.*board signer/);
    expect(WF).toMatch(/^name: hf-fin-shells-attest$/m);
    // The signer's rule today: job_workflow_ref must contain one of these substrings.
    const signer = read("functions/api/board-sign.ts");
    const m = signer.match(/const allowedWf = \[([^\]]*)\];/);
    expect(m, "functions/api/board-sign.ts no longer has an allowedWf list; this workflow's name was chosen to match it").not.toBe(null);
    const allowed = [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    const jobWorkflowRef = `CSOAI-ORG/councilof-ai/${FILE}@refs/heads/master`;
    expect(allowed.some((w) => jobWorkflowRef.includes(w)), `none of ${allowed.join(", ")} is in ${jobWorkflowRef}`).toBe(true);
  });

  it("runs only when dispatched by hand, with exactly the two inputs", () => {
    expect(code).toMatch(/^on:\n  workflow_dispatch:\n    inputs:\n      kind:\n/m);
    expect(code).not.toMatch(/^\s*(push|pull_request|pull_request_target|schedule|workflow_call|workflow_run|repository_dispatch|issue_comment):/m);
    const inputs = code.slice(code.indexOf("    inputs:\n"), code.indexOf("\npermissions:"));
    expect([...inputs.matchAll(/^      ([a-z0-9_]+):$/gm)].map((m) => m[1])).toEqual(["kind", "payloads_b64"]);
    expect(inputs).toMatch(/kind:\n        description: [^\n]+\n        type: choice\n        required: true\n        options:\n          - corrections\n          - ruling\n          - rulings-index\n/);
    expect(inputs).toMatch(/payloads_b64:\n        description: [^\n]+\n        type: string\n        required: true\n/);
  });

  it("the kinds on offer are exactly the kinds in the registry", () => {
    const offered = [...code.matchAll(/^          - ([a-z-]+)$/gm)].map((m) => m[1]);
    const registry = Object.keys(JSON.parse(read("scripts/sign-attest/kinds.json")).kinds);
    expect(offered).toEqual(registry);
  });

  it("has no concurrency block, one job, on ubuntu-latest, ten minutes at most", () => {
    expect(code).not.toMatch(/^\s*concurrency:/m);
    // Two-space keys that open a block: the trigger and the one job.
    expect([...code.matchAll(/^  ([a-z][a-z0-9_-]*):$/gm)].map((m) => m[1])).toEqual(["workflow_dispatch", "sign"]);
    expect(code).toMatch(/^  sign:\n    runs-on: ubuntu-latest\n    timeout-minutes: 10\n/m);
  });
});

describe("hf-fin-shells-attest.yml - what the job can reach", () => {
  it("exactly one id-token: write, anywhere in the file", () => {
    expect(count(WF, "id-token: write")).toBe(1);
  });

  it("the workflow grants read; the job grants read plus the OIDC token; nothing else is granted", () => {
    expect(code).toMatch(/^permissions:\n  contents: read\n\njobs:/m);
    expect(code).toMatch(/^    permissions:\n      contents: read\n      id-token: write\n    steps:/m);
    expect(count(code, "permissions:")).toBe(2);
    for (const grant of ["contents: write", "actions: write", "pull-requests", "packages:", "deployments:", "issues:", "statuses:", "checks:", "write-all"])
      expect(WF, grant).not.toContain(grant);
    expect([...WF.matchAll(/:\s*write\b/g)]).toHaveLength(1);
  });

  it("no stored credential: no `secrets.` and no token from the github context", () => {
    expect(WF).not.toContain("secrets.");
    expect(WF).not.toMatch(/github\.token|GITHUB_TOKEN|GH_TOKEN/);
  });

  it("no install step and no other tool that could fetch code", () => {
    expect(WF).not.toMatch(/\b(pip3?|npm|npx|yarn|pnpm|curl|wget)\b/);
    expect(code).not.toMatch(/\bgit\s+(push|commit|add)\b|\bgh\s/);
  });

  it("checks out master's code by its full ref name, and does not leave a credential in the checkout", () => {
    // A bare "master" makes the checkout action fetch every branch and tag whose name starts with it.
    expect(WF).toContain("ref: refs/heads/master");
    expect(WF).toContain("persist-credentials: false");
    const checkout = steps.find((s) => s.includes("actions/checkout@"));
    expect(checkout).toMatch(/uses: actions\/checkout@[0-9a-f]{40} # v4\.\d+\.\d+\n        with:\n          ref: refs\/heads\/master\n          persist-credentials: false\n/);
    expect(count(code, "ref:")).toBe(1);
    expect(code).not.toMatch(/^\s*ref: master\s*$/m);
  });

  it("uses only the three actions the plan names, each pinned by commit with its version beside it", () => {
    const uses = [...code.matchAll(/^\s+- uses: (\S+)( # (\S+))?$/gm)].map((m) => ({ action: m[1], version: m[3] }));
    expect(uses.map((u) => u.action.split("@")[0])).toEqual(["actions/checkout", "actions/setup-node", "actions/upload-artifact"]);
    for (const u of uses) {
      expect(u.action, u.action).toMatch(/^actions\/[a-z-]+@[0-9a-f]{40}$/); // a commit, not a tag that can move
      expect(u.version, u.action).toMatch(/^v4\.\d+\.\d+$/);
    }
    expect(count(code, "uses:")).toBe(3);
    expect(code).not.toMatch(/uses:\s*\S+@(v\d|main|master)/);
    expect(code).not.toMatch(/docker:\/\//);
  });

  it("has no block that could change what the script runs under: only the keys listed here exist", () => {
    // Top level, then the one job. A workflow-level or job-level env:, defaults:, container:,
    // services: or strategy: block would be a new key in one of these two lists.
    expect([...code.matchAll(/^([a-z][a-z0-9_-]*):/gm)].map((m) => m[1])).toEqual(["name", "on", "permissions", "jobs"]);
    const job = code.slice(code.indexOf("\n  sign:\n"));
    expect([...job.matchAll(/^    ([a-z][a-z0-9_-]*):/gm)].map((m) => m[1])).toEqual(["runs-on", "timeout-minutes", "permissions", "steps"]);
    // Step level: a step is a name and a run, or a uses and a with. Only the signing step has env.
    const stepKeys = steps.map((s) => [...s.matchAll(/^(?:      - |        )([a-z][a-z0-9_-]*):/gm)].map((m) => m[1]));
    expect(stepKeys).toEqual([["name", "run"], ["uses", "with"], ["uses", "with"], ["name", "env", "run"], ["uses", "with"]]);
    expect([...code.matchAll(/^\s*env:/gm)]).toHaveLength(1);
    for (const word of ["defaults:", "container:", "services:", "strategy:", "shell:", "working-directory:", "environment:", "NODE_OPTIONS", "NODE_PATH", "GITHUB_ENV", "GITHUB_PATH", "LD_PRELOAD"])
      expect(WF, word).not.toContain(word);
  });
});

describe("hf-fin-shells-attest.yml - the inputs never reach a shell line", () => {
  it("inputs.payloads_b64 appears once, on a line that starts PAYLOADS_B64:", () => {
    expect(count(WF, "inputs.payloads_b64")).toBe(1);
    const line = lines.find((l) => l.includes("inputs.payloads_b64"));
    expect(line.trim()).toBe("PAYLOADS_B64: ${{ inputs.payloads_b64 }}");
    expect(line.trim().startsWith("PAYLOADS_B64:")).toBe(true);
  });

  it("inputs.kind appears once, on a line that starts KIND:", () => {
    expect(count(WF, "inputs.kind")).toBe(1);
    expect(lines.find((l) => l.includes("inputs.kind")).trim()).toBe("KIND: ${{ inputs.kind }}");
    expect(count(WF, "github.event.inputs")).toBe(0);
  });

  it("no run: line or block contains an expression", () => {
    const runs = steps.map(runOf).filter((r) => r !== null);
    expect(runs).toHaveLength(2);
    for (const r of runs) expect(r).not.toContain("${{");
    expect(runs[1]).toBe("node scripts/sign-attest/sign.mjs");
  });

  it("the signing step passes exactly four variables, and the signer address is fixed in the file", () => {
    const sign = steps.find((s) => s.includes("node scripts/sign-attest/sign.mjs"));
    const env = sign.slice(sign.indexOf("        env:\n") + 13, sign.indexOf("        run:"));
    expect(env.split("\n").filter(Boolean).map((l) => l.trim())).toEqual([
      "KIND: ${{ inputs.kind }}",
      "PAYLOADS_B64: ${{ inputs.payloads_b64 }}",
      "BOARD_SIGN_URL: https://councilof.ai/api/board-sign",
      "OUT_DIR: ${{ runner.temp }}/board-sign-out",
    ]);
  });
});

describe("hf-fin-shells-attest.yml - order of steps", () => {
  it("refuse the ref, check out, set up node, sign, upload", () => {
    expect(steps).toHaveLength(5);
    expect(steps[0]).toContain("Refuse any ref but master");
    expect(steps[1]).toContain("actions/checkout@");
    // A Node line that still gets fixes. The script needs nothing newer than Node 18.
    expect(steps[2]).toMatch(/actions\/setup-node@[0-9a-f]{40} # v4\.\d+\.\d+\n        with:\n          node-version: 22\n/);
    expect(steps[3]).toContain("node scripts/sign-attest/sign.mjs");
    expect(steps[4]).toMatch(/actions\/upload-artifact@[0-9a-f]{40} # v4\.\d+\.\d+\n        with:\n          name: board-sign-\$\{\{ github\.run_id \}\}\n          path: \$\{\{ runner\.temp \}\}\/board-sign-out\n          if-no-files-found: error\n/);
    for (const s of steps) expect(s).not.toMatch(/continue-on-error|if:\s*always\(\)|if:\s*failure\(\)/);
  });

  it("the first step really stops every ref but refs/heads/master", () => {
    const script = runOf(steps[0]);
    const exit = (ref) => spawnSync("bash", ["-c", script], { env: { PATH: process.env.PATH, GITHUB_REF: ref }, encoding: "utf8" });
    expect(exit("refs/heads/master").status).toBe(0);
    for (const ref of ["refs/heads/main", "refs/heads/master-2", "refs/heads/lane/x", "refs/tags/master", "refs/pull/1/merge", "master", ""]) {
      const r = exit(ref);
      expect(r.status, ref).toBe(1);
      expect(r.stdout, ref).toContain("refused");
    }
  });
});

describe("scripts/sign-attest/sign.mjs - what the job runs", () => {
  const SRC = read("scripts/sign-attest/sign.mjs");
  it("imports Node built-ins only", () => {
    const froms = [...SRC.matchAll(/^import\s[^;]*?from\s+"([^"]+)";/gm)].map((m) => m[1]);
    expect(froms.length).toBeGreaterThan(3);
    for (const f of froms) expect(f, f).toMatch(/^node:/);
    expect(SRC).not.toMatch(/\brequire\(|\bimport\(/);
  });

  it("never emits a masking command and never prints the token variable", () => {
    expect(SRC).not.toContain("add-mask");
    expect(SRC).not.toMatch(/log\([^)]*\btoken\b/);
    expect(SRC).not.toMatch(/console\.(log|error|warn)\([^)]*(reqTok|token\b)/);
  });

  it("names the one signer address and the one audience", () => {
    expect(SRC).toContain('export const SIGN_URL = "https://councilof.ai/api/board-sign";');
    expect(SRC).toContain("export const AUDIENCE = SIGN_URL;");
  });

  it("every request that carries a credential refuses redirects, and only main() writes to the error stream", () => {
    // Two requests carry an Authorization header; each must sit beside redirect: "error".
    const withAuth = [...SRC.matchAll(/headers: \{ authorization: [^\n]+\n(?:[^\n]*\n){0,2}?\s*redirect: "error",/g)];
    expect(withAuth).toHaveLength(2);
    expect(count(SRC, "authorization:")).toBe(2);
    expect(count(SRC, 'redirect: "error"')).toBe(2);
    // One place prints a failure, and it goes through the line guard.
    expect([...SRC.matchAll(/console\.(error|warn|info|debug)\(/g)]).toHaveLength(1);
    expect(SRC).toContain("console.error(failureLines(");
    expect(SRC).not.toMatch(/process\.(stdout|stderr)\.write/);
    // Record lines are printed only through say(), which makes each call one line.
    expect([...SRC.matchAll(/\blog\(/g)]).toHaveLength(1);
    expect(SRC).toContain("const say = (line) => log(recordLine(line));");
  });
});
