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
 * Is this working tree a READABLE git repository at all?
 *
 * WHY A THIRD DISTINCTION. "The commit is not in the local store" has at least three
 * causes, and they print the same words while wanting different repairs:
 *
 *   1. THE REPOSITORY ITSELF IS UNREADABLE — the work tree lost its .git link (a
 *      sibling's offload removed it), so every git command dies with "fatal: not a git
 *      repository". The repair is to restore the link, or to run the gate in a real
 *      clone. Nothing about the pin can be said until then.
 *   2. THE STORE'S HISTORY IS TRUNCATED — a --depth=1 fetch. The repair is to deepen.
 *   3. THE PIN NAMES A COMMIT IN NO REF — a real finding about the pin.
 *
 * Reading 1 as 3 names a false finding and sends the reader after a mechanism that
 * cannot help. Check the repository first; it costs one command.
 */
export function repoReadable(cwd = REPO) {
  try {
    const dir = execFileSync("git", ["rev-parse", "--git-dir"], {
      cwd,
      encoding: "utf8",
      // stderr is CAPTURED, not printed: git's "fatal: not a git repository" is the fact
      // this function reports, not noise for the reader.
      stdio: ["ignore", "pipe", "pipe"],
      env: gitEnv(),
    }).trim();
    return { readable: true, gitDir: dir, why: null };
  } catch (error) {
    return {
      readable: false,
      gitDir: null,
      why:
        "this working tree is not a readable git repository (git says " +
        (error?.stderr ? String(error.stderr).trim().split("\n")[0] : "nothing") +
        ") — the repository link is missing or broken, so no reachability question can be " +
        "asked here at all",
    };
  }
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
    return { reachable: true, why: null, unprovable: false };
  } catch (error) {
    const code = error?.status;
    if (code === 1) return { reachable: false, why: "it is not an ancestor of HEAD", unprovable: false };
    if (code === 128) {
      // 128 is git saying "I cannot answer" — the object is not in this store. That is the
      // SAME class of fact as a truncated store: an absence of evidence, not evidence of
      // absence. Reporting it as ORPHANED named a false finding and BLOCKED a merge, which
      // is the outcome this gate exists to avoid. The gate's own header has always said
      // that 1 and 128 are different verdicts; this is where that promise is kept.
      return {
        reachable: false,
        why: "this repository cannot answer the question — the commit is not in the local store",
        unprovable: true,
      };
    }
    return { reachable: false, why: `git could not be run (exit ${code ?? "?"})`, unprovable: false };
  }
}

/**
 * Is this repository's history TRUNCATED?
 *
 * A shallow repository cannot answer a reachability question about a commit that lies
 * beyond its shallow boundary: git walks the history, stops at the boundary, and reports
 * "not an ancestor" for a commit that IS one. That answer is indistinguishable from a
 * genuinely orphaned pin unless the boundary is noticed, and a false finding is worse
 * than no finding: it names something wrong, and a reader who has been named wrong once
 * stops reading the gate.
 */
export function isShallow(cwd = REPO) {
  try {
    const dir = execFileSync("git", ["rev-parse", "--git-dir"], {
      cwd,
      encoding: "utf8",
      env: gitEnv(),
    }).trim();
    const shallow = path.join(path.isAbsolute(dir) ? dir : path.resolve(cwd, dir), "shallow");
    return fs.existsSync(shallow) && fs.readFileSync(shallow, "utf8").trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Is the pinned commit object in this store at all?
 *
 * "I do not have it" and "it is not related" are different facts, and a gate that does not
 * know which one it is looking at cannot report either honestly.
 */
export function objectPresent(sha, cwd = REPO) {
  try {
    execFileSync("git", ["cat-file", "-e", sha + "^{commit}"], {
      cwd,
      stdio: "ignore",
      env: gitEnv(),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * How many commits this store can walk back from HEAD.
 *
 * A truncated store answers with a smaller number, which is the visible symptom of a
 * history that cannot be walked to its end.
 */
export function countReachable(cwd = REPO) {
  try {
    return execFileSync("git", ["rev-list", "--count", "HEAD"], {
      cwd,
      encoding: "utf8",
      env: gitEnv(),
    }).trim();
  } catch {
    return "unknown";
  }
}

/**
 * The reachability answer, as a VERDICT the workflow can act on.
 *
 * Two ways this repository cannot answer, and both are UNCHECKABLE rather than a finding:
 *
 *   - the store's history is TRUNCATED (a shallow boundary): git walks back from HEAD,
 *     stops at the boundary, and reports "not an ancestor" for a commit that IS one. On
 *     2026-11-02 twenty open pull requests were red on this gate with the pin that
 *     GitHub's own compare API proves is an ancestor of master, 183 commits back. A gate
 *     that names a false finding is worse than a gate that names none: it teaches the
 *     reader that the gate cries wolf, and then it protects nothing.
 *
 *   - the PIN ITSELF is not in the store (git exit 128): an absence of evidence, which is
 *     not evidence of absence.
 *
 * A genuine "not an ancestor" — the pin is here, the history is complete, and the walk
 * finished without reaching it — is the only thing this gate calls ORPHANED, and the only
 * thing that blocks a merge.
 *
 * This reads the store. It changes no tree, commits nothing and pushes nothing.
 */
export function answerReachability(sha, ref = "HEAD", cwd = REPO) {
  // THE REPOSITORY FIRST. A work tree that is not a git repository cannot answer any
  // reachability question, and calling that "the commit is not in the local store"
  // names a false cause with a false remedy.
  const repo = repoReadable(cwd);
  if (!repo.readable) {
    return { reachable: false, unprovable: true, cause: "NO_REPOSITORY", why: repo.why };
  }
  const first = isAncestor(sha, ref, cwd);
  if (first.reachable) return first;
  // The pin itself is not in this store (git exit 128): the question cannot be asked here.
  if (first.unprovable) return { ...first, cause: "PIN_NOT_IN_STORE" };
  // The store's history is truncated, so the walk from HEAD stopped at the boundary. That
  // is a question this repository cannot answer, and "cannot answer" is not a finding
  // about the pin: on 2026-11-02 twenty open pull requests were red on this gate with the
  // pin that GitHub's own compare API proves is an ancestor of master, 183 commits back.
  // A gate that names a false finding is worse than a gate that names none: it teaches
  // the reader that the gate cries wolf, and then it protects nothing.
  if (!isShallow(cwd)) return first;
  return {
    reachable: false,
    unprovable: true,
    cause: "TRUNCATED_STORE",
    why:
      "this repository's history is truncated (a shallow boundary), so reachability cannot be " +
      "decided here — UNCHECKABLE, not an orphaned pin",
  };
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
  if (!ancestor || !ancestor.reachable) {
    // A store that cannot answer the question produces no finding about the pin.
    return { ok: false, state: ancestor?.unprovable ? "UNPROVABLE" : "ORPHANED" };
  }
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
      ["a pin to a commit nobody has cannot be proven reachable", absent, { reachable: false, why: "this repository cannot answer the question — the commit is not in the local store" }, "UNPROVABLE"],
    ];

    let failures = 0;
    for (const [name, sha, expected, expectedState] of cases) {
      const got = judge(sha, isAncestor(sha, "HEAD", root));
      const ok = got.ok === expected.reachable && got.state === expectedState;
      if (!ok) failures++;
      console.log(`  ${ok ? "✓" : "✗"} ${name} → ${got.state}`);
      if (!ok) console.log(`      expected ${expectedState}, got ${got.state} (${got.ok})`);
    }

    // A TRUNCATED store. git walks the history, stops at the shallow boundary, and
    // reports "not an ancestor" for a commit that IS one — measured on 2026-11-02: a
    // depth-1 clone of a repository whose pin is the HEAD's parent, and
    // `git merge-base --is-ancestor` answering exit 1 for a pin that is demonstrably an
    // ancestor. A gate that reads that as ORPHANED names a false finding about a reachable
    // pin, and a reader who has been named wrong once stops reading the gate.
    //
    // The verdict for a truncated store is UNPROVABLE. It is not a pass — it is the
    // absence of a finding, and the workflow reads it as such.
    const baseBranch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: root,
      encoding: "utf8",
      env: gitEnv(),
    }).trim();
    git("checkout", "-q", baseBranch);
    git("commit", "-q", "--allow-empty", "-m", "root C with a parent");
    const shaC = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", env: gitEnv() }).trim();

    const shallowDir = fs.mkdtempSync(path.join(os.tmpdir(), "sbom-pin-gate-shallow-"));
    try {
      execFileSync("git", ["clone", "-q", "--depth", "1", "file://" + root, shallowDir], {
        stdio: "ignore",
        env: gitEnv(),
      });
      if (!isShallow(shallowDir)) {
        failures++;
        console.log("  ✗ the truncated clone is not shallow — the fixture is wrong");
      } else {
        console.log("  ✓ a truncated clone is recognised as truncated");
      }
      // shaA is shaC's parent: reachable from the clone's HEAD, and beyond the boundary.
      // Raw git says "not an ancestor" here, which is the whole point.
      const raw = isAncestor(shaA, "HEAD", shallowDir);
      if (raw.reachable) {
        console.log("  · the truncated store answered directly this time — the boundary did not bite");
      }
      const verdict = judge(shaA, answerReachability(shaA, "HEAD", shallowDir));
      if (verdict.state === "ORPHANED") {
        failures++;
        console.log("  ✗ a truncated store must never read ORPHANED — that names a false finding");
      } else {
        console.log(`  ✓ a truncated store reads ${verdict.state}, never ORPHANED`);
      }
    } finally {
      fs.rmSync(shallowDir, { recursive: true, force: true });
    }

    // A work tree that is NOT a git repository at all. A sibling lane's offload removed
    // the .git link, so every git command died with "fatal: not a git repository" and the
    // gate printed the same words as a truncated graph. It must name its own cause: the
    // repair is to restore the link, not to deepen a history that is not there.
    const notARepo = fs.mkdtempSync(path.join(os.tmpdir(), "sbom-pin-gate-not-a-repo-"));
    try {
      const verdict = judge(shaB, answerReachability(shaB, "HEAD", notARepo));
      if (verdict.state !== "UNPROVABLE") {
        failures++;
        console.log("  ✗ a directory that is not a repository must read UNPROVABLE, never ORPHANED");
      } else {
        console.log("  ✓ a directory that is not a repository reads UNPROVABLE");
      }
      const answer = answerReachability(shaB, "HEAD", notARepo);
      if (answer.cause !== "NO_REPOSITORY") {
        failures++;
        console.log(`  ✗ an unreadable repository must name its own cause, not the pin's (got ${answer.cause})`);
      } else if (/not in the local store/.test(answer.why)) {
        failures++;
        console.log("  ✗ an unreadable repository must not be reported as a missing pin");
      } else {
        console.log("  ✓ an unreadable repository names itself, and not the pin");
      }
    } finally {
      fs.rmSync(notARepo, { recursive: true, force: true });
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
  const ancestor = answerReachability(sha, "HEAD");
  const verdict = judge(sha, ancestor);
  if (verdict.state === "UNPROVABLE") {
    console.error(`✗ sbom-pin-gate: ${ancestor.why}.`);
    console.error("");
    console.error("  The pin may well be reachable — this repository cannot tell. That is an");
    console.error("  UNCHECKABLE state, not a finding about the pin, and it does not block a merge.");
    // Three causes, three repairs. Naming the wrong one sends the reader after a
    // mechanism that cannot help them.
    if (ancestor.cause === "NO_REPOSITORY") {
      console.error("  THE REPOSITORY ITSELF IS UNREADABLE. Restore the repository link, or run");
      console.error("  this gate in a real clone: no question about the pin can be asked until then.");
      console.error("  (A sibling lane's offload removed the .git link; every git command died with");
      console.error("  'fatal: not a git repository', and that is not the same fact as a truncated graph.)");
    } else if (ancestor.cause === "TRUNCATED_STORE") {
      console.error("  THE STORE'S HISTORY IS TRUNCATED. Deepen it — fetch without --depth — and");
      console.error("  re-run. The workflow's own depth-1 fetch makes one; do not re-stamp a pin on");
      console.error("  the strength of a verdict the graph cannot support.");
    } else {
      console.error("  THE PIN IS NOT IN THIS STORE. Fetch it, or run the gate where the history is");
      console.error("  complete, and ask again.");
    }
    process.exit(2);
  }
  if (!verdict.ok) {
    console.error(`✗ sbom-pin-gate: the SBOM read from ${sbom.from} pins ${sha}, and ${ancestor.why}.`);
    // THE FACTS. A gate that says "not an ancestor" without saying whether the object is
    // even in the store, or whether the graph it is reading is truncated, makes a claim it
    // cannot support - and the next reader has to rediscover the whole investigation.
    console.error(`  state: ${verdict.state}  ·  store truncated: ${isShallow() ? "yes" : "no"}` +
      `  ·  pinned object present: ${objectPresent(sha) ? "yes" : "no"}` +
      `  ·  commits reachable from HEAD: ${countReachable()}`);
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
