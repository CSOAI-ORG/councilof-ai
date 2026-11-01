#!/usr/bin/env node
/**
 * sbom-pin-gate — the SBOM's recorded generation commit must be REACHABLE from HEAD.
 *
 * WHY THIS EXISTS. `scripts/gen_sbom.py --check` proves the SBOM by reading its OWN
 * recorded generation commit back out of the repository:
 *
 *     git show <recorded>:package.json
 *
 * and comparing those bytes with the working tree. #3614 pinned master's SBOM to a
 * commit that is an ancestor of every future merge, so the read always resolves there.
 *
 * A branch that was REWRITTEN after its SBOM was minted (rebase, amend, force-push)
 * keeps a pin to a commit that is in NO ref. The merge that brings master in takes the
 * BRANCH's copy of the SBOM, so master's reachable pin is overwritten by an orphaned
 * one. In CI (pr-gates checks out the PR's merge ref) the read exits 128 and the
 * producer gate reports, without naming the cause:
 *
 *     ✗ sbom FAILED — SBOM held; previous output preserved
 *
 * A census of every open PR on 2026-10-30 found 40 of 132 carrying such a pin, and 29
 * of them were MERGEABLE and blocked by nothing else. Each cost a full CI round trip
 * (build + prerender + every gate) to learn only that a pin pointed at nothing.
 *
 * WHAT THIS GATE CHECKS, AND WHY IT IS NOT `gen_sbom.py --check`.
 *
 * `gen_sbom.py --check` asks "can I read that commit?". This asks "is that commit
 * REACHABLE FROM THE HEAD I AM PUSHING?" — the property CI actually depends on, because
 * CI checks out the merge ref and only commits reachable from it exist in that
 * checkout. The two differ exactly in the case that bit us: a lane that fetched the
 * branch BEFORE it was force-pushed still holds the old commit as a loose object, so
 * `git show` SUCCEEDS locally while the same read FAILS in CI. Object presence is not
 * reachability. A gate that only checks presence is green on the exact tree CI rejects.
 *
 * The remedy depends on WHY the pin is orphaned, so the message names both:
 *   - the branch changed NEITHER package.json NOR package-lock.json → merge master and
 *     take master's already-stamped SBOM pair (master's `.ots` proves exactly master's
 *     bytes, and master's recorded commit is an ancestor of every future merge);
 *   - the branch DID change its dependency inputs → the SBOM must be regenerated AND
 *     re-stamped, which needs the OpenTimestamps notary and is not a local operation.
 *
 * Usage:  node scripts/sbom-pin-gate.mjs [--selftest]
 * Exit:   0 reachable · 1 orphaned/unprovable · 2 UNCHECKABLE (no readable SBOM)
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SELFTEST = process.argv.includes("--selftest");

const SHA_RE = /^[0-9a-f]{40}$|^[0-9a-f]{64}$/;

/**
 * A git environment with NO inherited repository context.
 *
 * Git sets GIT_DIR (and GIT_WORK_TREE, GIT_INDEX_FILE, GIT_PREFIX) in the environment of
 * every hook. A hook that then runs git in a DIFFERENT directory inherits the hook's
 * GIT_DIR, so `git init` in a scratch directory under a pre-push hook operates on the
 * HOOK'S repository instead of the scratch one — which is how the first run of this
 * gate's own selftest failed, at exit 128, inside the pre-push hook and nowhere else.
 *
 * Every git call here therefore names its repository by CWD and carries no inherited
 * repository context. GIT_NO_LAZY_FETCH stays on: this repository is a partial clone
 * (blob:none), and a lazy promisor fetch on a commit that is not in the local store has
 * been observed to hang for minutes.
 */
export function gitEnv(extra = {}) {
  const env = { ...process.env, ...extra };
  for (const key of Object.keys(env)) {
    if (key.startsWith("GIT_") && key !== "GIT_NO_LAZY_FETCH" && key !== "GIT_TERMINAL_PROMPT" && key !== "GIT_CONFIG_NOSYSTEM") {
      delete env[key];
    }
  }
  env.GIT_NO_LAZY_FETCH = "1";
  env.GIT_TERMINAL_PROMPT = "0";
  return env;
}

/**
 * The SBOM AS IT WILL BE PUSHED.
 *
 * A push carries the COMMITTED tree, not the working tree. Reading the working-tree
 * file opens a trap: a developer who commits an orphaned pin and then repairs it
 * locally without committing gets a GREEN gate on a tree whose committed SBOM is
 * still orphaned — and the push then carries the orphaned bytes to a 12-minute CI
 * round trip. The committed copy is therefore what is checked, with the working tree
 * used only when HEAD does not carry the file at all.
 */
export function readSbom(repo = REPO) {
  const rel = "public/interop/sbom-councilof-ai.json";
  try {
    const raw = execFileSync("git", ["show", "HEAD:" + rel], {
      cwd: repo,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      env: gitEnv(),
    });
    return { text: raw, from: "HEAD" };
  } catch {
    try {
      const raw = fs.readFileSync(path.join(repo, rel), "utf8");
      return { text: raw, from: "the working tree (HEAD does not carry this file)" };
    } catch (error) {
      return { text: null, error: error.message };
    }
  }
}

/**
 * The commit the SBOM says it was generated from.
 *
 * gen_sbom.py requires EXACTLY ONE `commit` property and requires the root reference to
 * agree with it. This reads the same two places and applies the same rules, so the gate
 * cannot disagree with the producer about which commit is meant.
 */
export function recordedCommit(doc) {
  const props = doc?.metadata?.properties ?? [];
  const commits = props.filter((p) => p?.name === "commit").map((p) => p?.value);
  if (commits.length !== 1 || typeof commits[0] !== "string" || !SHA_RE.test(commits[0])) {
    return { sha: null, reason: "the SBOM does not carry exactly one full generation commit" };
  }
  const bomRef = doc?.metadata?.component?.["bom-ref"];
  if (bomRef !== "source:" + commits[0]) {
    return {
      sha: null,
      reason: `the SBOM's root reference (${JSON.stringify(bomRef)}) disagrees with its recorded commit`,
    };
  }
  return { sha: commits[0], reason: null };
}

/**
 * Is `sha` an ancestor of `ref`?
 *
 * `git merge-base --is-ancestor` exits 0 for yes, 1 for no, and 128 for "I cannot
 * answer" (the object is not in this store). 1 and 128 are DIFFERENT verdicts and are
 * reported as such: "not an ancestor" is a finding about the tree, "cannot answer" is
 * an unprovable state, and collapsing them would let a gate pass on ignorance.
 *
 * GIT_NO_LAZY_FETCH=1: this repository is a partial clone (blob:none). Without it, a
 * `git` command on a commit that is not in the local store can trigger a lazy promisor
 * fetch, which on this network has been observed to hang for minutes.
 */
export function isAncestor(sha, ref, cwd = REPO) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", sha, ref], {
      cwd,
      stdio: "ignore",
      env: gitEnv(),
    });
    return { reachable: true, why: null };
  } catch (error) {
    const code = error?.status;
    if (code === 1) return { reachable: false, why: "it is not an ancestor of HEAD" };
    if (code === 128) {
      return {
        reachable: false,
        why: "this repository cannot answer the question — the commit is not in the local store",
      };
    }
    return { reachable: false, why: `git could not be run (exit ${code ?? "?"})` };
  }
}

/**
 * The verdict as data, so the selftest can exercise the decision without a real repo.
 *
 * `ancestor` is the OBJECT isAncestor() returns — not a bare boolean. A bare boolean
 * would lose the difference between "not an ancestor" (a finding about the tree) and
 * "cannot answer" (an unprovable state), and both must fail the gate for different
 * reasons.
 */
export function judge(sha, ancestor) {
  if (!sha) return { ok: false, state: "UNPROVABLE" };
  if (!ancestor || !ancestor.reachable) return { ok: false, state: "ORPHANED" };
  return { ok: true, state: "REACHABLE" };
}

function selftest() {
  // A scratch repository, because the thing under test is a RELATIONSHIP between a
  // commit and a HEAD — it cannot be exercised without one. Three cases, and the gate
  // must go RED on two of them: a gate that has never gone red proves nothing about the
  // tree it just passed.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sbom-pin-gate-"));
  const hooks = path.join(root, "empty-hooks");
  fs.mkdirSync(hooks);
  const git = (...args) =>
    execFileSync("git", ["-c", "core.hooksPath=" + hooks, "-c", "user.name=gate", "-c", "user.email=gate@example.invalid", ...args], {
      cwd: root,
      stdio: "ignore",
      env: gitEnv(),
    });

  try {
    git("init", "-q", ".");
    // `git init` installs the user's template hooks into .git/hooks. This machine has a
    // global pre-commit hook that runs a test suite, and it would fire on the scratch
    // commits: slow, and unrelated to what is being tested. Remove the directory and
    // point core.hooksPath at an empty one.
    fs.rmSync(path.join(root, ".git", "hooks"), { recursive: true, force: true });
    git("commit", "-q", "--allow-empty", "-m", "root A");
    const shaA = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", env: gitEnv() }).trim();

    // An UNRELATED root: A is still in the object store, but it is not an ancestor of
    // HEAD. This is exactly the shape of the failure that bit us — present locally,
    // absent from the merge ref CI checks out.
    git("checkout", "-q", "--orphan", "unrelated");
    git("commit", "-q", "--allow-empty", "-m", "root B");
    const shaB = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", env: gitEnv() }).trim();

    const absent = "0".repeat(40);

    const cases = [
      ["a pin to HEAD is reachable", shaB, { reachable: true, why: null }, "REACHABLE"],
      ["a pin to a commit that is present but NOT an ancestor is orphaned", shaA, { reachable: false, why: "it is not an ancestor of HEAD" }, "ORPHANED"],
      ["a pin to a commit nobody has cannot be proven reachable", absent, { reachable: false, why: "this repository cannot answer the question — the commit is not in the local store" }, "ORPHANED"],
    ];

    let failures = 0;
    for (const [name, sha, expected, expectedState] of cases) {
      const got = judge(sha, isAncestor(sha, "HEAD", root));
      const ok = got.ok === expected.reachable && got.state === expectedState;
      if (!ok) failures++;
      console.log(`  ${ok ? "✓" : "✗"} ${name} → ${got.state}`);
      if (!ok) console.log(`      expected ${expectedState}, got ${got.state} (${got.ok})`);
    }

    // The decision function itself, without a repository: an absent pin is never
    // silently treated as fine.
    const noSha = judge(null, { reachable: true, why: null });
    if (noSha.ok || noSha.state !== "UNPROVABLE") {
      failures++;
      console.log("  ✗ a missing pin must be UNPROVABLE, never reachable");
    } else {
      console.log("  ✓ a missing pin is UNPROVABLE, never reachable");
    }

    // The reader agrees with the producer's own rules.
    const good = recordedCommit({
      metadata: { properties: [{ name: "commit", value: shaB }], component: { "bom-ref": "source:" + shaB } },
    });
    const twoPins = recordedCommit({
      metadata: { properties: [{ name: "commit", value: shaB }, { name: "commit", value: shaA }], component: { "bom-ref": "source:" + shaB } },
    });
    const mismatched = recordedCommit({
      metadata: { properties: [{ name: "commit", value: shaB }], component: { "bom-ref": "source:" + shaA } },
    });
    if (good.sha !== shaB) { failures++; console.log("  ✗ a well-formed pin was not read"); }
    else console.log("  ✓ a well-formed pin is read");
    if (twoPins.sha !== null) { failures++; console.log("  ✗ two pins must not be read as one"); }
    else console.log("  ✓ two pins are refused");
    if (mismatched.sha !== null) { failures++; console.log("  ✗ a root reference that disagrees with the pin must be refused"); }
    else console.log("  ✓ a disagreeing root reference is refused");

    if (failures) {
      console.error(`\n✗ sbom-pin-gate SELFTEST failed: ${failures} case(s)`);
      process.exit(1);
    }
    console.log("\n✓ sbom-pin-gate selftest: the gate goes red on an orphaned pin and green on a reachable one");
    process.exit(0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

if (SELFTEST) {
  selftest();
} else {
  const sbom = readSbom();
  if (sbom.text === null) {
    console.error(`✗ sbom-pin-gate: no readable SBOM (${sbom.error}) — UNCHECKABLE, not a clean bill`);
    process.exit(2);
  }
  let doc;
  try {
    doc = JSON.parse(sbom.text);
  } catch (error) {
    console.error(`✗ sbom-pin-gate: the SBOM is unreadable (${error.message}) — UNCHECKABLE, not a clean bill`);
    process.exit(2);
  }
  const { sha, reason } = recordedCommit(doc);
  if (!sha) {
    console.error(`✗ sbom-pin-gate: ${reason} — the pin cannot be checked, so it cannot be called good`);
    process.exit(1);
  }
  const ancestor = isAncestor(sha, "HEAD");
  const verdict = judge(sha, ancestor);
  if (!verdict.ok) {
    console.error(`✗ sbom-pin-gate: the SBOM read from ${sbom.from} pins ${sha}, and ${ancestor.why}.`);
    console.error("");
    console.error("  In CI this reads as 'sbom FAILED — SBOM held; previous output preserved',");
    console.error("  because pr-gates checks out the PR's merge ref and this commit is not in it.");
    console.error("");
    console.error("  If this branch changed NEITHER package.json NOR package-lock.json:");
    console.error("    merge master and take master's already-stamped SBOM pair — master's .ots proves");
    console.error("    exactly master's bytes and master's pin is an ancestor of every future merge.");
    console.error("  If it DID change its dependency inputs, the SBOM must be regenerated AND re-stamped,");
    console.error("    which needs the OpenTimestamps notary and is not a local operation.");
    process.exit(1);
  }
  console.log(`✓ sbom-pin-gate: the SBOM read from ${sbom.from} pins ${sha.slice(0, 12)}, which is reachable from HEAD`);
}
