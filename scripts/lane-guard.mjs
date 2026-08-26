#!/usr/bin/env node
// lane-guard.mjs — make the lost-work failure modes impossible to commit.
//
// WHY THIS EXISTS (all observed 2026-08-26, all in this repo):
//   1. A worktree merge committed a SELF-REFERENTIAL node_modules symlink. Git
//      recorded mode 120000 on a path that is a tree everywhere else, and the
//      checkout replaced the real 816-entry directory with a link to itself.
//      The build died. Nothing in CI noticed, because nothing looked at modes.
//   2. Lanes shared ONE checkout and flipped its branch under each other
//      (feat -> master -> os-aeo -> plays-white-label -> plays-deadline-products
//      -> master in minutes). Commit 3e5116ac was rewound and survived only via
//      reflog. The tell is always the same: the MAIN checkout sitting on a
//      branch that is not master, holding uncommitted work.
//
// Two rule families, therefore:
//   SYMLINK  — reject a symlink where a directory belongs (runs anywhere,
//              including CI, on the index or on the HEAD tree).
//   CHECKOUT — reject the main checkout being off master with dirty state
//              (local only; a CI checkout has no lanes to collide with).
//
// USAGE
//   node scripts/lane-guard.mjs --staged     pre-commit: check the index
//   node scripts/lane-guard.mjs              CI/local: check HEAD + checkout
//   node scripts/lane-guard.mjs --selftest   prove it catches AND passes negation
//
// No dependencies. Exit 0 clean, 1 violation, 2 usage/environment error.

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// ---------------------------------------------------------------- constants

// A symlink whose final path component is one of these is ALWAYS wrong: every
// one of them is a directory in every healthy checkout. node_modules is the one
// that actually bit us; the rest are the same shape of mistake waiting to land.
const PROTECTED_DIR_NAMES = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".wrangler",
  "coverage",
  "__pycache__",
  "client",
  "functions",
  "scripts",
  "harness",
  "public",
  "council-os",
  "src",
  ".git",
  ".github",
]);

const SYMLINK_MODE = "120000";

// ---------------------------------------------------------------- git helpers

function git(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    // Capture stderr rather than leaking it: `git add` on a self-referential
    // symlink prints "Too many levels of symbolic links", which is the incident
    // reproducing itself inside the selftest and reads like a real failure.
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function gitQuiet(args, cwd) {
  try {
    return git(args, cwd);
  } catch {
    return null;
  }
}

// git quotes paths containing odd bytes as "..." with C escapes. Undo that so a
// violation always prints the path a human can act on.
function unquotePath(p) {
  if (!p.startsWith('"')) return p;
  const body = p.slice(1, -1);
  return body.replace(/\\([abfnrtv\\"]|[0-7]{3})/g, (_, esc) => {
    const simple = { a: "\x07", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v", "\\": "\\", '"': '"' };
    if (esc in simple) return simple[esc];
    return String.fromCharCode(parseInt(esc, 8));
  });
}

/** Symlink entries staged in the index, as {path, sha, wasTreeInHead}. */
function stagedSymlinks(cwd) {
  const raw = gitQuiet(["diff", "--cached", "--raw", "-z"], cwd);
  if (raw === null) return [];
  // -z form: ":<srcmode> <dstmode> <srcsha> <dstsha> <status>\0<path>\0" and for
  // renames a second \0-terminated path follows. Walk it as a token stream.
  const tok = raw.split("\0");
  const out = [];
  for (let i = 0; i < tok.length; i++) {
    const t = tok[i];
    if (!t.startsWith(":")) continue;
    const parts = t.slice(1).split(" ");
    const dstMode = parts[1];
    const dstSha = parts[3];
    const status = parts[4] || "";
    const nPaths = status.startsWith("R") || status.startsWith("C") ? 2 : 1;
    const p = unquotePath(tok[i + nPaths] ?? "");
    i += nPaths;
    if (dstMode !== SYMLINK_MODE) continue;
    out.push({ path: p, sha: dstSha, wasTreeInHead: isTreeInHead(cwd, p) });
  }
  return out;
}

/** Symlink entries in the committed HEAD tree. */
function headSymlinks(cwd) {
  const raw = gitQuiet(["ls-tree", "-r", "-z", "HEAD"], cwd);
  if (raw === null) return [];
  const out = [];
  for (const rec of raw.split("\0")) {
    if (!rec) continue;
    const tabAt = rec.indexOf("\t");
    if (tabAt < 0) continue;
    const meta = rec.slice(0, tabAt).split(/\s+/);
    if (meta[0] !== SYMLINK_MODE) continue;
    out.push({ path: rec.slice(tabAt + 1), sha: meta[2], wasTreeInHead: false });
  }
  return out;
}

function isTreeInHead(cwd, p) {
  const r = gitQuiet(["ls-tree", "-d", "HEAD", "--", p], cwd);
  return !!(r && r.trim());
}

function blob(cwd, sha) {
  try {
    return git(["cat-file", "blob", sha], cwd).trim();
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------- rule: symlink

/**
 * Pure over the entry list so the selftest can drive it directly.
 * Returns [{rule, path, detail}].
 */
export function ruleSymlinkWhereDirectoryBelongs(entries) {
  const violations = [];
  for (const e of entries) {
    const base = e.path.split("/").pop();

    if (PROTECTED_DIR_NAMES.has(base)) {
      violations.push({
        rule: "symlink-replaces-directory",
        path: e.path,
        detail: `mode 120000 on '${base}', which is a directory in every healthy checkout (target: ${e.target || "?"})`,
      });
      continue;
    }

    if (e.wasTreeInHead) {
      violations.push({
        rule: "symlink-replaces-directory",
        path: e.path,
        detail: `mode 120000 on a path that HEAD records as a directory (target: ${e.target || "?"})`,
      });
      continue;
    }

    // Self-referential / ancestor-referential link: node_modules -> node_modules,
    // or node_modules -> . — the exact shape that ate the real directory.
    const target = e.target || "";
    if (target) {
      const dir = e.path.includes("/") ? e.path.slice(0, e.path.lastIndexOf("/")) : "";
      const resolved = path.posix.normalize(path.posix.join(dir, target));
      const self = path.posix.normalize(e.path);
      const isSelf = resolved === self || resolved === "." || resolved === "";
      const isAncestor = self.startsWith(resolved + "/") && resolved !== ".";
      if (isSelf || isAncestor) {
        violations.push({
          rule: "self-referential-symlink",
          path: e.path,
          detail: `link target '${target}' resolves to '${resolved}', which is the path itself or an ancestor of it`,
        });
      }
    }
  }
  return violations;
}

// ---------------------------------------------------------------- rule: checkout

/**
 * Pure over a small state object so the selftest can drive it directly.
 * state = { isMainCheckout, branch, dirtyCount, dirtySample, claimedBy }
 */
export function ruleMainCheckoutOnMaster(state) {
  if (!state.isMainCheckout) return [];
  if (state.branch === "master" || state.branch === "HEAD") return [];
  if (state.dirtyCount === 0) return [];
  return [
    {
      rule: "main-checkout-off-master",
      path: state.root || "(main checkout)",
      detail:
        `the shared main checkout is on '${state.branch}' with ${state.dirtyCount} uncommitted path(s)` +
        (state.claimedBy ? ` — '${state.branch}' is claimed by lane '${state.claimedBy}'` : "") +
        `. A lane must own its own worktree; flipping this checkout's branch is what rewound 3e5116ac.` +
        (state.dirtySample?.length ? ` e.g. ${state.dirtySample.slice(0, 3).join(", ")}` : ""),
    },
  ];
}

// ---------------------------------------------------------------- collectors

function repoRoot(cwd) {
  const r = gitQuiet(["rev-parse", "--show-toplevel"], cwd);
  return r ? r.trim() : null;
}

/** The main checkout is the one whose .git is a directory, not a `gitdir:` file. */
function mainCheckoutPath(cwd) {
  const common = gitQuiet(["rev-parse", "--path-format=absolute", "--git-common-dir"], cwd);
  if (!common) return null;
  const gitCommon = common.trim();
  // <main>/.git  ->  <main>
  if (path.basename(gitCommon) === ".git") return path.dirname(gitCommon);
  return null; // bare repo: no main working tree to police
}

function readLaneClaims(root) {
  const f = path.join(root, "council-os", "LANES.md");
  if (!fs.existsSync(f)) return [];
  const out = [];
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    // | lane | owner | branch | worktree | claimed | status | doing |
    if (cells.length < 8) continue;
    if (!cells[1] || cells[1] === "lane" || /^-+$/.test(cells[1])) continue;
    out.push({ lane: cells[1], owner: cells[2], branch: cells[3].replace(/`/g, ""), worktree: cells[4].replace(/`/g, ""), claimed: cells[5], status: cells[6] });
  }
  return out;
}

function collectCheckoutState(cwd) {
  const main = mainCheckoutPath(cwd);
  if (!main || !fs.existsSync(main)) return null;
  const branch = (gitQuiet(["rev-parse", "--abbrev-ref", "HEAD"], main) || "").trim();
  const status = (gitQuiet(["status", "--porcelain"], main) || "").trim();
  const dirty = status ? status.split("\n") : [];
  const claim = readLaneClaims(main).find((c) => c.branch === branch && c.status !== "released");
  return {
    isMainCheckout: true,
    root: main,
    branch,
    dirtyCount: dirty.length,
    dirtySample: dirty.map((l) => l.slice(3)),
    claimedBy: claim ? claim.lane : null,
  };
}

function withTargets(cwd, entries) {
  return entries.map((e) => ({ ...e, target: e.sha ? blob(cwd, e.sha) : "" }));
}

// ---------------------------------------------------------------- reporting

function report(violations, scope) {
  if (!violations.length) {
    console.log(`lane-guard OK (${scope}): no symlink-for-directory, main checkout disciplined.`);
    return 0;
  }
  console.error(`\nlane-guard FAILED (${scope}): ${violations.length} violation(s)\n`);
  for (const v of violations) {
    console.error(`  [${v.rule}]  ${v.path}`);
    console.error(`      ${v.detail}`);
  }
  console.error(
    "\nFix, do not force. See council-os/LANE-PROTOCOL.md.\n" +
      "  symlink-replaces-directory / self-referential-symlink:\n" +
      "      git rm --cached <path> && rm <path> && npm ci      (restore the real directory)\n" +
      "  main-checkout-off-master:\n" +
      "      commit or stash the work on its OWN worktree, then\n" +
      "      git -C <main> switch master     (never flip the shared checkout mid-lane)\n"
  );
  return 1;
}

// ---------------------------------------------------------------- selftest

function tmpRepo(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `lane-guard-${name}-`));
  git(["init", "-q", "-b", "master"], dir);
  git(["config", "user.email", "selftest@local"], dir);
  git(["config", "user.name", "selftest"], dir);
  git(["config", "commit.gpgsign", "false"], dir);
  return dir;
}

function selftest() {
  let pass = 0;
  let fail = 0;
  const check = (name, mustCatch, got) => {
    const ok = mustCatch === got.length > 0;
    if (ok) pass++;
    else fail++;
    console.log(
      `  ${ok ? "ok  " : "FAIL"}  ${mustCatch ? "must CATCH" : "must PASS "}  ${name}` +
        (ok ? "" : `  -> got ${got.length ? "CAUGHT" : "passed"}`)
    );
    if (!ok && got.length) console.log(`         ${got[0].rule}: ${got[0].detail}`);
  };

  console.log("lane-guard --selftest\n");
  console.log("  SYMLINK rules (real git repos, real index, real modes)");

  // (1) THE ACTUAL INCIDENT: a real node_modules directory, replaced in the index
  //     by a symlink pointing at itself.
  {
    const r = tmpRepo("nm");
    fs.mkdirSync(path.join(r, "node_modules", "left-pad"), { recursive: true });
    fs.writeFileSync(path.join(r, "node_modules", "left-pad", "index.js"), "module.exports=1\n");
    fs.writeFileSync(path.join(r, "package.json"), "{}\n");
    git(["add", "-A", "-f"], r);
    git(["commit", "-qm", "real node_modules directory"], r);

    fs.rmSync(path.join(r, "node_modules"), { recursive: true, force: true });
    fs.symlinkSync("node_modules", path.join(r, "node_modules"));
    git(["add", "-A", "-f"], r);

    const got = ruleSymlinkWhereDirectoryBelongs(withTargets(r, stagedSymlinks(r)));
    check("node_modules directory replaced by self-referential symlink", true, got);
    fs.rmSync(r, { recursive: true, force: true });
  }

  // (2) NEGATION: the same repo, node_modules still a real directory, ordinary edit.
  {
    const r = tmpRepo("clean");
    fs.mkdirSync(path.join(r, "node_modules", "left-pad"), { recursive: true });
    fs.writeFileSync(path.join(r, "node_modules", "left-pad", "index.js"), "module.exports=1\n");
    fs.writeFileSync(path.join(r, "package.json"), "{}\n");
    git(["add", "-A", "-f"], r);
    git(["commit", "-qm", "base"], r);
    fs.writeFileSync(path.join(r, "package.json"), '{"name":"x"}\n');
    git(["add", "-A", "-f"], r);

    const got = ruleSymlinkWhereDirectoryBelongs(withTargets(r, stagedSymlinks(r)));
    check("ordinary file edit, node_modules still a real directory", false, got);
    fs.rmSync(r, { recursive: true, force: true });
  }

  // (3) NEGATION: a legitimate symlink that points somewhere else entirely.
  //     The guard must not become a blanket symlink ban.
  {
    const r = tmpRepo("oklink");
    fs.writeFileSync(path.join(r, "README.md"), "hi\n");
    git(["add", "-A", "-f"], r);
    git(["commit", "-qm", "base"], r);
    fs.symlinkSync("README.md", path.join(r, "readme-alias"));
    git(["add", "-A", "-f"], r);

    const got = ruleSymlinkWhereDirectoryBelongs(withTargets(r, stagedSymlinks(r)));
    check("benign symlink readme-alias -> README.md", false, got);
    fs.rmSync(r, { recursive: true, force: true });
  }

  // (4) CATCH: a symlink at a path HEAD records as a tree, under a name that is
  //     NOT in the protected list — proves the wasTreeInHead rule pulls its weight.
  {
    const r = tmpRepo("treeswap");
    fs.mkdirSync(path.join(r, "vendorlib"), { recursive: true });
    fs.writeFileSync(path.join(r, "vendorlib", "a.js"), "1\n");
    git(["add", "-A", "-f"], r);
    git(["commit", "-qm", "base"], r);
    fs.rmSync(path.join(r, "vendorlib"), { recursive: true, force: true });
    fs.symlinkSync("/etc", path.join(r, "vendorlib"));
    git(["add", "-A", "-f"], r);

    const got = ruleSymlinkWhereDirectoryBelongs(withTargets(r, stagedSymlinks(r)));
    check("vendorlib/ (a tree in HEAD) replaced by a symlink", true, got);
    fs.rmSync(r, { recursive: true, force: true });
  }

  // (5) CATCH: dist -> . (ancestor-referential, protected name).
  {
    const r = tmpRepo("dot");
    fs.writeFileSync(path.join(r, "x.txt"), "1\n");
    git(["add", "-A", "-f"], r);
    git(["commit", "-qm", "base"], r);
    fs.symlinkSync(".", path.join(r, "dist"));
    git(["add", "-A", "-f"], r);

    const got = ruleSymlinkWhereDirectoryBelongs(withTargets(r, stagedSymlinks(r)));
    check("dist -> . (link to its own parent)", true, got);
    fs.rmSync(r, { recursive: true, force: true });
  }

  console.log("\n  CHECKOUT rule (the branch-flip that rewound 3e5116ac)");

  check(
    "main checkout on feat/x with 6 uncommitted paths",
    true,
    ruleMainCheckoutOnMaster({
      isMainCheckout: true,
      root: "/repo",
      branch: "feat/x",
      dirtyCount: 6,
      dirtySample: ["client/src/App.tsx"],
      claimedBy: "home-uplift",
    })
  );
  check(
    "main checkout on master with uncommitted paths",
    false,
    ruleMainCheckoutOnMaster({ isMainCheckout: true, root: "/repo", branch: "master", dirtyCount: 6, dirtySample: [] })
  );
  check(
    "main checkout on feat/x but perfectly clean (a finished, landed lane)",
    false,
    ruleMainCheckoutOnMaster({ isMainCheckout: true, root: "/repo", branch: "feat/x", dirtyCount: 0, dirtySample: [] })
  );
  check(
    "a LANE worktree on its own branch, dirty — that is the correct state",
    false,
    ruleMainCheckoutOnMaster({ isMainCheckout: false, root: "/wt", branch: "lane/y", dirtyCount: 9, dirtySample: [] })
  );

  console.log(`\n  ${pass} passed, ${fail} failed`);
  if (fail) {
    console.error("\nlane-guard SELFTEST FAILED — the guard does not behave as specified.");
    return 1;
  }
  console.log("\nlane-guard selftest OK — provably catches the violations AND passes their negations.");
  return 0;
}

// ---------------------------------------------------------------- main

const args = process.argv.slice(2);

if (args.includes("--selftest")) {
  process.exit(selftest());
}

const cwd = process.cwd();
if (!repoRoot(cwd)) {
  console.error("lane-guard: not inside a git repository");
  process.exit(2);
}

const staged = args.includes("--staged");
const violations = [];

const entries = withTargets(cwd, staged ? stagedSymlinks(cwd) : headSymlinks(cwd));
violations.push(...ruleSymlinkWhereDirectoryBelongs(entries));

// The checkout rule needs sibling lanes to exist; a CI runner has exactly one
// checkout and legitimately sits on a detached or PR branch. Skip it there.
if (!process.env.CI) {
  const state = collectCheckoutState(cwd);
  if (state) violations.push(...ruleMainCheckoutOnMaster(state));
}

process.exit(report(violations, staged ? "staged index" : "HEAD tree"));
