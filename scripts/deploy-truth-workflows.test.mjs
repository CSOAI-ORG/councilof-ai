/**
 * Root, proofs and deploy truth (Lane A, 7 Oct 2026). Each block pins one repaired workflow, and
 * where the workflow's own shell or Python decides something, that code is extracted from the YAML
 * and RUN against fakes, so the test exercises the bytes Actions will execute.
 *
 *   A-G1 / O-P0-3  public-root-candidate-upgrade: the manifest + llms rebuild, the local head, only
 *                  workflow_dispatch gate runs, a hold that ends when a required check fails, a
 *                  reconcile that regenerates derived files (scripts/reconcile-derived.test.mjs), and
 *                  at most one gates dispatch per head.
 *   A-G3           card-root workflows stage the pointer and the derived files (rules: test_card_root_automation.py).
 *   O-P1-14        deploy.yml writes /.well-known/deploy.json before upload, outside the preflight window.
 *   O-pdv          deploy.yml dispatches post-deploy-verify; post-deploy-verify no longer comments on a random PR.
 *   O-drift        canon.json's expected wording follows its own counts; the self-heal skips a master that is live.
 *   O-P1-7         bot-checks-sweeper dispatches pr-gates at most once per head SHA, and never on an unread state.
 *   D-04           gspc-spray calls no Zenodo while the account is blocked; only owner-gated legs do not fail the run.
 */
import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const WF = (name) => read(`.github/workflows/${name}`);

/** The text of one step (from its `- name:` line to the next step at the same indent). */
function step(wf, name) {
  const i = wf.indexOf(`- name: ${name}`);
  expect(i, `step "${name}"`).toBeGreaterThan(0);
  const indent = wf.lastIndexOf("\n", i);
  const pad = wf.slice(indent + 1, i);
  const next = wf.indexOf(`\n${pad}- `, i + 1);
  return wf.slice(i, next === -1 ? undefined : next);
}

/** The literal `run: |` block of a step, de-indented, i.e. the script Actions hands to bash.
 * Run it with `bash -e`, as Actions does: a dispatched spray run (37578857227) stopped at the first
 * non-zero exit because the step relied on `set -uo pipefail` leaving -e off. */
function runBlock(wf, name) {
  const s = step(wf, name);
  const lines = s.split("\n");
  const at = lines.findIndex((l) => /^\s+run: \|\s*$/.test(l));
  expect(at, `run block of "${name}"`).toBeGreaterThan(0);
  const body = [];
  const keyIndent = lines[at].match(/^\s*/)[0].length;
  for (const l of lines.slice(at + 1)) {
    if (l.trim() !== "" && l.match(/^\s*/)[0].length <= keyIndent) break;
    body.push(l);
  }
  const ind = Math.min(...body.filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length));
  return body.map((l) => l.slice(ind)).join("\n") + "\n";
}

const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));

describe("A-G1: the root candidate can pass its own gates", () => {
  const wf = WF("public-root-candidate-upgrade.yml");

  it("rebuilds the OTS manifest and llms files after the proof upgrade, before the publishable proof", () => {
    const order = ["Upgrade the exact candidate proof", "Refresh exact-root witnesses and derived views",
      "Rebuild the OTS manifest and llms files from the proof bytes", "Prove the candidate is publishable",
      "Commit the upgraded proof and exact witness state", "Merge only after pr-gates passed on these exact bytes"];
    const at = order.map((n) => wf.indexOf(`- name: ${n}`));
    expect(at.every((x) => x > 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    const rebuild = step(wf, order[2]);
    expect(rebuild).toContain("python3 scripts/ots_manifest_rebuild.py --apply");
    expect(rebuild.indexOf("node scripts/llms-txt.mjs")).toBeGreaterThan(rebuild.indexOf("ots_manifest_rebuild.py --apply"));
    expect(step(wf, order[3])).toContain("python3 scripts/pod-loops/root_ots_manifest_gate.py --public-dir public");
    expect(step(wf, order[4])).toContain("git add public/interop/ots/manifest.json public/llms.txt public/llms-full.txt");
    expect(wf).toMatch(/uses: actions\/setup-node@v4/);
  });

  it("gates the head this job holds and waits only on workflow_dispatch runs", () => {
    const merge = runBlock(wf, "Merge only after pr-gates passed on these exact bytes");
    expect(merge).toContain("head=$(git rev-parse HEAD)");
    expect(merge).not.toMatch(/headRefOid/);
    expect(merge).toMatch(/--event workflow_dispatch/);
    expect(merge).toMatch(/select\(\.event == "workflow_dispatch"\)/);
    expect(merge).toMatch(/gh pr merge "\$URL" --repo "\$REPO" --squash --match-head-commit "\$head"/);
  });
});

describe("A-G1: a head whose gates passed is held, so the owner's one approval can stick", () => {
  const wf = WF("public-root-candidate-upgrade.yml");
  const HOLD = "Classify the head - gates passed (held), failed, or not yet run";

  it("skips reconcile and re-witness on a held head, and the merge step still runs for it", () => {
    expect(wf.indexOf(`- name: ${HOLD}`)).toBeLessThan(wf.indexOf("- name: Reconcile the rolling candidate"));
    expect(step(wf, "Reconcile the rolling candidate with current master")).toContain("steps.hold.outputs.held != 'true'");
    expect(step(wf, "Upgrade the exact candidate proof")).toContain("steps.hold.outputs.held != 'true'");
    expect(step(wf, "Merge only after pr-gates passed on these exact bytes"))
      .toContain("if: steps.ots.outputs.confirmed == 'true' || steps.hold.outputs.held == 'true'");
  });

  function hold(latest, mergeable, requiredFailed = "", apiFails = false) {
    const dir = tmp("hold-");
    const bin = path.join(dir, "bin");
    fs.mkdirSync(bin);
    spawnSync("git", ["init", "-q"], { cwd: dir });
    spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "x"], { cwd: dir });
    // gh applies --jq itself; the stand-in prints what that filter yields
    fs.writeFileSync(path.join(bin, "gh"), `#!/bin/bash
case "$1 $2" in
  "run list") echo "${latest}" ;;
  "pr view") echo "${mergeable}" ;;
  api*) ${apiFails ? "exit 1" : `echo "${requiredFailed}"`} ;;
esac
`, { mode: 0o755 });
    const out = path.join(dir, "out");
    const r = spawnSync("bash", ["-e", "-c", runBlock(wf, HOLD)], { cwd: dir, encoding: "utf8",
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_OUTPUT: out, REPO: "r/r", URL: "u" } });
    expect(r.status, r.stderr).toBe(0);
    const o = Object.fromEntries(fs.readFileSync(out, "utf8").trim().split("\n").map((l) => l.split("=")));
    expect(o.held).toBe(o.state === "held" ? "true" : "false");
    return o.state;
  }

  it("holds only a passed, non-conflicting head", () => {
    expect(hold("success", "MERGEABLE")).toBe("held");
    expect(hold("success", "UNKNOWN")).toBe("held");
    expect(hold("", "MERGEABLE")).toBe("open");
    expect(hold("success", "CONFLICTING")).toBe("open");
  });

  it("ends the hold when a required check failed after the dispatched pass (the verifier's frozen head)", () => {
    // the approved pull_request run tests the merge ref and reads the live board, so it can fail later
    expect(hold("success", "MERGEABLE", "gates")).toBe("failed");
    expect(hold("success", "MERGEABLE", "build")).toBe("failed");
    expect(hold("failure", "MERGEABLE")).toBe("failed");
    expect(hold("timed_out", "MERGEABLE")).toBe("failed");
    // an unreadable check-run list never moves or merges anything: the head is judged on its dispatched run
    expect(hold("success", "MERGEABLE", "", true)).toBe("held");
  });

  it("a failed head is not re-gated on the same bytes: only a moved reconcile makes a new head", () => {
    const stop = step(wf, "Stop on a failed head that nothing has changed");
    expect(stop).toContain("if: steps.hold.outputs.state == 'failed' && steps.reconcile.outputs.moved != 'true'");
    expect(stop).toMatch(/exit 1/);
    const at = (n) => wf.indexOf(`- name: ${n}`);
    expect(at("Reconcile the rolling candidate with current master")).toBeLessThan(at("Stop on a failed head that nothing has changed"));
    expect(at("Stop on a failed head that nothing has changed")).toBeLessThan(at("Upgrade the exact candidate proof"));
  });

  it("reconciles with master's copy of reconcile_derived.py, after the OTS client is installed, and pushes only a moved head", () => {
    const rec = runBlock(wf, "Reconcile the rolling candidate with current master");
    expect(rec).toContain("git show origin/master:scripts/reconcile_derived.py > \"$RUNNER_TEMP/reconcile_derived.py\"");
    expect(rec).toContain('python3 "$RUNNER_TEMP/reconcile_derived.py" --onto origin/master');
    expect(rec).not.toMatch(/git merge --no-edit origin\/master/);
    expect(rec).toMatch(/if \[ "\$\(git rev-parse HEAD\)" != "\$before" \]; then\n\s*git push origin "HEAD:public-root\/pending"/);
    expect(wf.indexOf("- name: Install witness dependencies")).toBeLessThan(wf.indexOf("- name: Reconcile the rolling candidate"));
    expect(fs.existsSync(path.join(ROOT, "scripts/reconcile_derived.py"))).toBe(true);
  });

  // The merge step, run against a stand-in gh and a real origin, for each state of the newest
  // dispatched run on the head.
  function merge(latestRun) {
    const dir = tmp("merge-");
    const bin = path.join(dir, "bin");
    const work = path.join(dir, "work");
    const origin = path.join(dir, "origin.git");
    fs.mkdirSync(bin);
    spawnSync("git", ["init", "-q", "--bare", origin]);
    spawnSync("git", ["init", "-q", work]);
    const g = (...a) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd: work, encoding: "utf8" });
    g("commit", "-q", "--allow-empty", "-m", "x");
    g("remote", "add", "origin", origin);
    g("push", "-q", "origin", "HEAD:refs/heads/public-root/pending");
    const head = g("rev-parse", "HEAD").stdout.trim();
    const log = path.join(dir, "calls");
    const flag = path.join(dir, "dispatched");
    const run = latestRun && { databaseId: 7, headSha: head, event: "workflow_dispatch", createdAt: "2026-10-07T00:00:00Z", ...latestRun };
    const fresh = { databaseId: 8, headSha: head, status: "queued", conclusion: "", event: "workflow_dispatch", createdAt: "2999-01-01T00:00:00Z" };
    fs.writeFileSync(path.join(bin, "gh"), `#!/bin/bash
echo "$*" >> ${JSON.stringify(log)}
case "$1 $2" in
  "run list") if [ -f ${JSON.stringify(flag)} ]; then echo '${JSON.stringify([fresh, ...(run ? [run] : [])])}'; else echo '${JSON.stringify(run ? [run] : [])}'; fi ;;
  "workflow run") touch ${JSON.stringify(flag)} ;;
  "run watch") exit 0 ;;
  "pr merge") exit 0 ;;
esac
`, { mode: 0o755 });
    fs.writeFileSync(path.join(bin, "sleep"), "#!/bin/bash\nexit 0\n", { mode: 0o755 });
    const r = spawnSync("bash", ["-e", "-c", runBlock(wf, "Merge only after pr-gates passed on these exact bytes")], { cwd: work, encoding: "utf8",
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, REPO: "r/r", URL: "u", GH_TOKEN: "x" } });
    const calls = fs.existsSync(log) ? fs.readFileSync(log, "utf8") : "";
    return { status: r.status, stderr: r.stderr, dispatches: (calls.match(/^workflow run pr-gates\.yml/gm) || []).length,
      merged: /^pr merge u .*--match-head-commit /m.test(calls) && calls.includes(head) };
  }

  it("dispatches pr-gates at most once per head: a failed run on these bytes is never retried", () => {
    const failed = merge({ status: "completed", conclusion: "failure" });
    expect(failed.status).toBe(1);
    expect(failed.stderr).toMatch(/already concluded failure/);
    expect(failed.dispatches).toBe(0);
    expect(failed.merged).toBe(false);
    const passed = merge({ status: "completed", conclusion: "success" });
    expect(passed.status, passed.stderr).toBe(0);
    expect(passed.dispatches).toBe(0);
    expect(passed.merged).toBe(true);
    const running = merge({ status: "in_progress", conclusion: "" });
    expect(running.dispatches).toBe(0);
    // nothing yet, or only a cancelled run that tested nothing: exactly one dispatch
    for (const r of [merge(null), merge({ status: "completed", conclusion: "cancelled" })]) {
      expect(r.status, r.stderr).toBe(0);
      expect(r.dispatches).toBe(1);
      expect(r.merged).toBe(true);
    }
  });
});

describe("A-G3: card-root workflows publish the pointer and the derived files with the proof", () => {
  it("card-root.yml classifies rows with card_root.publish_rows and stages pointer, manifest and llms", () => {
    const wf = WF("card-root.yml");
    expect(wf).toContain("from card_root import publish_rows");
    expect(wf).not.toContain('if any(not row.startswith("?? ") for row in rows)');
    const pr = runBlock(wf, "Open a review-only pending-proof PR");
    expect(pr).toContain('git add -- public/interop/card-root-latest.json');
    expect(pr).toContain("git add -- public/interop/ots/manifest.json public/llms.txt public/llms-full.txt");
    expect(runBlock(wf, "Rebuild the OTS manifest and llms files for the new proof")).toContain("root_ots_manifest_gate.py");
  });

  it("card-root-ots-upgrade.yml stages the rebuilt manifest and llms files with the upgraded proofs", () => {
    const wf = WF("card-root-ots-upgrade.yml");
    expect(runBlock(wf, "Rebuild the OTS manifest and llms files for the upgraded proofs")).toContain("ots_manifest_rebuild.py --apply");
    expect(runBlock(wf, "Update the review branch or open one")).toContain("public/interop/ots/manifest.json");
    expect(read("scripts/maintain_card_root_ots.py")).toContain("roots = args.roots or default_roots()");
  });
});

describe("A-G3: one open card-root upgrade PR at a time", () => {
  const script = runBlock(WF("card-root-ots-upgrade.yml"), "Find master and open card-root candidates");
  function refs(openHeads) {
    const dir = tmp("refs-");
    const bin = path.join(dir, "bin");
    fs.mkdirSync(bin);
    // the fake prints what `gh pr list --jq` would: the matching head names
    const keep = openHeads.filter((h) => h.startsWith("card-root/pending-") || h.startsWith("card-root/ots-upgrade-"));
    fs.writeFileSync(path.join(bin, "gh"), `#!/bin/bash\necho '${JSON.stringify(keep)}'\n`, { mode: 0o755 });
    const out = path.join(dir, "out");
    const r = spawnSync("bash", ["-e", "-c", script], { encoding: "utf8",
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_OUTPUT: out, REPO: "r/r" } });
    expect(r.status, r.stderr).toBe(0);
    return JSON.parse(fs.readFileSync(out, "utf8").trim().replace(/^refs=/, ""));
  }
  it("maintains an open upgrade PR's branch instead of branching from master again", () => {
    expect(refs([])).toEqual(["master"]);
    expect(refs(["card-root/pending-2026-10-07", "lane/x"])).toEqual(["card-root/pending-2026-10-07", "master"]);
    expect(refs(["card-root/ots-upgrade-37600000000"])).toEqual(["card-root/ots-upgrade-37600000000"]);
  });
  it("still names the matching PR heads in the gh query", () => {
    expect(script).toContain('select(startswith("card-root/pending-") or startswith("card-root/ots-upgrade-"))');
  });
});

describe("A-G1 / A-G4 repair: every writer of the derived files reconciles before it pushes", () => {
  it("card-root-ots-upgrade reconciles a review branch with master and pushes a reconciled branch once", () => {
    const wf = WF("card-root-ots-upgrade.yml");
    const rec = step(wf, "Reconcile a review branch with master");
    expect(rec).toContain("if: matrix.ref != 'master'");
    expect(rec).toContain("git show origin/master:scripts/reconcile_derived.py");
    expect(rec).toContain('python3 "$RUNNER_TEMP/reconcile_derived.py" --onto origin/master');
    expect(wf.indexOf("- name: Reconcile a review branch with master")).toBeLessThan(wf.indexOf("- name: Stage exact-root proof candidates"));
    // node is set up before the reconcile, which may regenerate llms
    expect(wf.indexOf("uses: actions/setup-node@v4")).toBeLessThan(wf.indexOf("- name: Reconcile a review branch with master"));
    // only a conflicting branch is merged with master: a behind-but-clean PR can merge as it is
    expect(rec).toMatch(/if \[ "\$mergeable" != "CONFLICTING" \]; then\n\s*echo "moved=false"/);
    const push = step(wf, "Push a reconciled review branch");
    expect(push).toContain("if: steps.stage.outputs.changed == '0' && steps.reconcile.outputs.moved == 'true'");
    expect(push).toContain('git push origin "HEAD:$BRANCH"');
    expect(wf).not.toMatch(/--force|HEAD:master|gh pr merge/);
  });

  it("the public-root candidate and ots-upgrade run the same script; card-root.yml opens fresh branches from master", () => {
    for (const name of ["public-root-candidate-upgrade.yml", "ots-upgrade.yml"]) {
      expect(WF(name)).toContain('python3 "$RUNNER_TEMP/reconcile_derived.py" --onto origin/master');
    }
    expect(step(WF("ots-upgrade.yml"), "Reconcile the open upgrade PR with master")).toMatch(/if \[ "\$mergeable" != "CONFLICTING" \]/);
    expect(WF("card-root.yml")).toMatch(/git checkout -b "\$branch"/);
  });
});

describe("O-P1-14 + O-pdv: deploy truth", () => {
  const wf = WF("deploy.yml");

  it("writes the deploy marker after every dist gate and before the preflight, with nothing ignored", () => {
    const marker = wf.indexOf("- name: Deploy marker");
    expect(marker).toBeGreaterThan(wf.indexOf("- name: Pages size guard — 25 MiB per-file limit (built tree)"));
    expect(marker).toBeLessThan(wf.indexOf("- name: Production target and binding preflight"));
    const s = step(wf, "Deploy marker — /.well-known/deploy.json names the commit this run built");
    expect(s).toContain("dist/client/.well-known/deploy.json");
    expect(s).toContain("SHA=$(git rev-parse HEAD)");
    expect(s).not.toMatch(/continue-on-error|\|\| true/);
  });

  it("the marker script writes {sha, run_id, at} and refuses a malformed sha", () => {
    const script = runBlock(wf, "Deploy marker — /.well-known/deploy.json names the commit this run built");
    const dir = tmp("marker-");
    spawnSync("git", ["init", "-q"], { cwd: dir });
    spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "x"], { cwd: dir });
    const env = { ...process.env, RUN_ID: "37575107101", RUN_ATTEMPT: "1", EVENT: "push", REPO: "CSOAI-ORG/councilof-ai" };
    const r = spawnSync("bash", ["-e", "-c", script], { cwd: dir, env, encoding: "utf8" });
    expect(r.status, r.stderr).toBe(0);
    const body = JSON.parse(fs.readFileSync(path.join(dir, "dist/client/.well-known/deploy.json"), "utf8"));
    const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).stdout.trim();
    expect(body.sha).toBe(head);
    expect(body.run_id).toBe(37575107101);
    expect(body.at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    // failing control: a run id that is not a number is refused, not written
    fs.rmSync(path.join(dir, "dist"), { recursive: true });
    const bad = spawnSync("bash", ["-e", "-c", script], { cwd: dir, env: { ...env, RUN_ID: "nope" }, encoding: "utf8" });
    expect(bad.status).not.toBe(0);
    expect(fs.existsSync(path.join(dir, "dist/client/.well-known/deploy.json"))).toBe(false);
  });

  it("dispatches post-deploy-verify once the gated tree held, which post-deploy-verify accepts", () => {
    expect(wf).toContain("deployed: ${{ steps.hold.outcome == 'success' }}");
    expect(wf).toContain("if: ${{ !cancelled() && needs.build-deploy.outputs.deployed == 'true' }}");
    expect(wf).toMatch(/gh workflow run post-deploy-verify\.yml --repo "\$REPO" --ref master \\\n\s+-f deploy_sha="\$SHA" -f deploy_run_id="\$RUN_ID"/);
    const pdv = WF("post-deploy-verify.yml");
    expect(pdv).toMatch(/workflow_dispatch:\n\s+inputs:\n\s+deploy_sha:/);
    expect(pdv).toContain("deploy_run_id:");
    expect(pdv).toContain("github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success'");
    expect(pdv).toContain("https://councilof.ai/.well-known/deploy.json?cb=");
    // a push deploy has no PR; the old step commented on whichever PR was updated last
    expect(pdv).not.toMatch(/createComment|pulls\.list/);
  });
});

describe("O-drift", () => {
  it("canon's expected public_count wording is derived from its own counts (plural axes)", () => {
    const api = JSON.parse(read("canon.json")).api;
    expect(api.public_count_contains).toBe(`${api.axes_total} axes · ${api.measured_axes} measured`);
  });

  it("the self-heal does not redeploy a master that production already serves", () => {
    const heal = runBlock(WF("drift-guard.yml"), "Self-heal on drift (redeploy canonical master)");
    const dir = tmp("heal-");
    const bin = path.join(dir, "bin");
    fs.mkdirSync(bin);
    const log = path.join(dir, "calls.log");
    // fake gh + curl: master sha, a deploy marker, and the deploy-run list are fixtures
    fs.writeFileSync(path.join(bin, "gh"), `#!/bin/bash
echo "gh $*" >> "${log}"
case "$1 $2" in
  "api repos/"*) echo "$MASTER" ;;
  "run list") echo "$ACTIVE" ;;
  "workflow run") exit 0 ;;
esac
`, { mode: 0o755 });
    fs.writeFileSync(path.join(bin, "curl"), `#!/bin/bash
[ -n "$SERVED" ] || exit 22
echo "{\\"sha\\": \\"$SERVED\\"}"
`, { mode: 0o755 });
    const go = (env) => {
      fs.rmSync(log, { force: true });
      const r = spawnSync("bash", ["-e", "-c", heal], { encoding: "utf8",
        env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, REPO: "CSOAI-ORG/councilof-ai", ...env } });
      expect(r.status, r.stderr).toBe(0);
      return { out: r.stdout, dispatched: fs.existsSync(log) && fs.readFileSync(log, "utf8").includes("gh workflow run deploy.yml") };
    };
    const m = "a".repeat(40);
    expect(go({ MASTER: m, SERVED: m, ACTIVE: "0" }).dispatched).toBe(false);
    expect(go({ MASTER: m, SERVED: "b".repeat(40), ACTIVE: "1" }).dispatched).toBe(false);
    // failing controls: a clobbered or unmarked production still self-heals
    expect(go({ MASTER: m, SERVED: "b".repeat(40), ACTIVE: "0" }).dispatched).toBe(true);
    expect(go({ MASTER: m, SERVED: "", ACTIVE: "0" }).dispatched).toBe(true);
  });
});

describe("O-P1-7: bot-checks-sweeper dispatches pr-gates at most once per head SHA", () => {
  const script = runBlock(WF("bot-checks-sweeper.yml"), "Find check-less open PRs and dispatch the real gates");

  function sweep(prs, checks, dispatchedRuns) {
    const dir = tmp("sweep-");
    const bin = path.join(dir, "bin");
    fs.mkdirSync(bin);
    const fixture = path.join(dir, "fixture.json");
    const log = path.join(dir, "calls.jsonl");
    fs.writeFileSync(fixture, JSON.stringify({ prs, checks, dispatchedRuns }));
    fs.writeFileSync(path.join(bin, "gh"), `#!/usr/bin/env python3
import json, sys
fx = json.load(open(${JSON.stringify(fixture)}))
a = sys.argv[1:]
open(${JSON.stringify(log)}, "a").write(json.dumps(a) + "\\n")
if a[:2] == ["pr", "list"]:
    print(json.dumps(fx["prs"]))
elif a[0] == "api" and "/check-runs" in a[1]:
    sha = a[1].split("/commits/")[1].split("/")[0]
    if fx["checks"].get(sha) == "ERROR":
        sys.exit(1)
    print(json.dumps({"check_runs": fx["checks"].get(sha, [])}))
elif a[0] == "api" and "/actions/workflows/pr-gates.yml/runs" in a[1]:
    sha = a[1].split("head_sha=")[1].split("&")[0]
    print(fx["dispatchedRuns"].get(sha, 0))
elif a[:2] == ["pr", "view"]:
    print("")
`, { mode: 0o755 });
    const r = spawnSync("bash", ["-e", "-c", script], { encoding: "utf8",
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, REPO: "CSOAI-ORG/councilof-ai", GH_TOKEN: "x" } });
    expect(r.status, r.stderr).toBe(0);
    const calls = fs.readFileSync(log, "utf8").trim().split("\n").map((l) => JSON.parse(l));
    return calls.filter((c) => c[0] === "workflow" && c[1] === "run").map((c) => c[c.indexOf("--ref") + 1]);
  }

  const pr = (n, branch, sha) => ({ number: n, headRefName: branch, headRefOid: sha, title: "t", isCrossRepository: false });
  const sha = (c) => c.repeat(40);

  it("skips heads whose gates passed, failed or are running, and heads already dispatched", () => {
    const dispatched = sweep(
      [pr(1, "green", sha("a")), pr(2, "failed", sha("b")), pr(3, "running", sha("c")), pr(4, "queued", sha("d")),
        pr(5, "fresh", sha("e")), pr(6, "approval", sha("f"))],
      {
        [sha("a")]: [{ name: "gates", status: "completed", conclusion: "success" }],
        [sha("b")]: [{ name: "gates", status: "completed", conclusion: "failure" }],
        [sha("c")]: [{ name: "gates", status: "in_progress", conclusion: null }],
        [sha("f")]: [{ name: "gates", status: "completed", conclusion: "action_required" }],
      },
      { [sha("d")]: 1 },
    );
    // only the head with no gate run at all, and the one whose only "run" never ran (action_required)
    expect(dispatched).toEqual(["fresh", "approval"]);
  });

  it("an unreadable check-run list is an unknown state: no dispatch (it used to read as no gates yet)", () => {
    expect(sweep([pr(7, "unread", sha("u"))], { [sha("u")]: "ERROR" }, {})).toEqual([]);
    expect(sweep([pr(7, "unread", sha("u"))], {}, {})).toEqual(["unread"]);   // control: readable and empty
  });

  it("a failed head is not re-dispatched on the next sweep (it used to be, every 20 minutes)", () => {
    const failed = { [sha("b")]: [{ name: "gates", status: "completed", conclusion: "failure" }] };
    expect(sweep([pr(2, "failed", sha("b"))], failed, {})).toEqual([]);
    expect(sweep([pr(2, "failed", sha("b"))], failed, {})).toEqual([]);
  });
});

describe("D-04: gspc-spray leaves the blocked Zenodo account alone", () => {
  const wf = WF("gspc-spray.yml");
  const choose = runBlock(wf, "choose surfaces from the secrets that exist");

  function surfaces(state, env = {}) {
    const dir = tmp("spray-");
    fs.mkdirSync(path.join(dir, "functions/_lib"), { recursive: true });
    if (state !== null) {
      fs.writeFileSync(path.join(dir, "functions/_lib/zenodoStatus.ts"),
        `export const ZENODO_ACCOUNT_STATE: "UNAVAILABLE" | "AVAILABLE" = "${state}";\n`);
    }
    const out = path.join(dir, "out");
    const r = spawnSync("bash", ["-e", "-c", choose], { cwd: dir, encoding: "utf8", env: {
      ...process.env, GITHUB_OUTPUT: out, RUNNER_TEMP: dir, HAS_HF: "true", HAS_KAGGLE: "true", HAS_GITHUB: "false",
      HAS_ZENODO: "true", HAS_PYPI: "true", HAS_NPM: "false", EVENT: "schedule", ...env } });
    expect(r.status, r.stderr).toBe(0);
    return { flags: fs.readFileSync(out, "utf8").match(/^flags=(.*)$/m)[1], stdout: r.stdout };
  }

  it("passes no --zenodo while ZENODO_ACCOUNT_STATE is UNAVAILABLE or unreadable", () => {
    const blocked = surfaces("UNAVAILABLE");
    expect(blocked.flags).not.toContain("--zenodo");
    expect(blocked.stdout).toMatch(/owner-gated::Zenodo skipped: ZENODO_ACCOUNT_STATE=UNAVAILABLE/);
    expect(surfaces(null).flags).not.toContain("--zenodo");
    expect(read("functions/_lib/zenodoStatus.ts")).toMatch(/ZENODO_ACCOUNT_STATE: "UNAVAILABLE" \| "AVAILABLE" = "(UNAVAILABLE|AVAILABLE)";/);
  });

  it("calls Zenodo again once the constant says AVAILABLE (failing control), still never per deploy", () => {
    expect(surfaces("AVAILABLE").flags).toContain("--zenodo");
    expect(surfaces("AVAILABLE", { EVENT: "workflow_run" }).flags).not.toContain("--zenodo");
  });

  it("checks out the status file it reads", () => {
    expect(wf).toMatch(/sparse-checkout: \|\n\s+scripts\/spray\n\s+functions\/_lib\/zenodoStatus\.ts/);
  });

  function spray(report, rc) {
    const dir = tmp("sprayrun-");
    fs.mkdirSync(path.join(dir, "scripts/spray"), { recursive: true });
    fs.writeFileSync(path.join(dir, "scripts/spray/gspc-spray.py"), `import json, sys
args = sys.argv[1:]
rep = args[args.index("--report") + 1]
${report === null ? "" : `open(rep, "w").write(json.dumps(${JSON.stringify(report)}))`}
sys.exit(${rc})
`);
    const script = runBlock(wf, "spray").replace("${{ steps.choose.outputs.flags }}", "--hf");
    return spawnSync("bash", ["-e", "-c", script], { cwd: dir, encoding: "utf8",
      env: { ...process.env, RUNNER_TEMP: dir, FORCE: "", DRY: "" } });
  }
  const results = (...rows) => ({ results: rows.map(([surface, status, detail = "d"]) => ({ surface, status, detail })) });
  // the two PyPI refusal texts scripts/spray/gspc-spray.py writes (pypi_stale_source_refusal)
  const WAIT = "the snapshot version 0.2.20261007 sorts below the package source's own 0.2.20261007.1: pip would never pick it. The source release goes out first (distribution/SUBMIT.md).";
  const AHEAD = "package source declares 0.2.20260930.1, older than the source PyPI already serves (0.2.20261007.1; latest release 0.2.20261007.1): publishing would put a newer version number over older code. Update the checkout this script runs from.";

  it("the source-release-first PyPI refusal and npm BLOCKED are owner-gated warnings; any other FAILED still fails", () => {
    const ok = spray(results(["hf-dataset", "PUBLISHED"], ["pypi", "REFUSED", WAIT], ["npm", "BLOCKED"]), 1);
    expect(ok.status, ok.stdout + ok.stderr).toBe(0);
    expect(ok.stdout).toMatch(/owner-gated::PyPI REFUSED/);
    expect(spray(results(["hf-dataset", "FAILED"], ["pypi", "REFUSED", WAIT]), 1).status).toBe(1);
    expect(spray(results(["kaggle", "REFUSED"]), 1).status).toBe(1);
    expect(spray(null, 2).status).toBe(2);   // refused to publish at all: always red
    expect(spray(null, 0).status).toBe(1);   // no report is not a pass
  });

  it("PyPI serving a source newer than master declares stays red: code not on master reached PyPI", () => {
    const r = spray(results(["hf-dataset", "PUBLISHED"], ["pypi", "REFUSED", AHEAD]), 1);
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/::error title=gspc-spray::pypi REFUSED: package source declares/);
    expect(spray(results(["pypi", "REFUSED", "the package source's pyproject.toml declares no version"]), 1).status).toBe(1);
  });

  it("an unreachable GitHub API reads as HTTP 000, not 000000", () => {
    const dir = tmp("probe-");
    const bin = path.join(dir, "bin");
    fs.mkdirSync(bin);
    fs.mkdirSync(path.join(dir, "functions/_lib"), { recursive: true });
    fs.writeFileSync(path.join(dir, "functions/_lib/zenodoStatus.ts"), 'export const ZENODO_ACCOUNT_STATE: "UNAVAILABLE" | "AVAILABLE" = "UNAVAILABLE";\n');
    // what curl does on a connect failure with -w '%{http_code}': prints 000, exits 7
    fs.writeFileSync(path.join(bin, "curl"), "#!/bin/bash\nprintf 000\nexit 7\n", { mode: 0o755 });
    const out = path.join(dir, "out");
    const r = spawnSync("bash", ["-e", "-c", choose], { cwd: dir, encoding: "utf8", env: {
      ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_OUTPUT: out, RUNNER_TEMP: dir, HAS_HF: "true", HAS_KAGGLE: "true",
      HAS_GITHUB: "true", GSPC_BOARD_TOKEN: "t", HAS_ZENODO: "false", HAS_PYPI: "false", HAS_NPM: "false", EVENT: "schedule" } });
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toMatch(/\(HTTP 000, push=False\)/);
    expect(r.stdout).not.toMatch(/000000/);
    expect(fs.readFileSync(out, "utf8")).not.toMatch(/--github/);
  });
});
