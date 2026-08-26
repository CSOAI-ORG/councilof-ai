#!/usr/bin/env node
// lane.mjs — the lane workflow as tooling, not documentation.
//
// CLAUDE.md has said "One lane = one writer = one branch/worktree. Never a
// shared checkout." since before the day lanes flipped the shared checkout's
// branch six times in minutes and rewound commit 3e5116ac. A rule that only
// exists as a sentence is a rule nobody can be stopped from breaking. This
// script is the same rule with teeth: claiming a lane MAKES the worktree, and
// claiming a lane that is already live REFUSES.
//
//   node scripts/lane.mjs claim <name> --desc "what this lane is doing"
//   node scripts/lane.mjs list
//   node scripts/lane.mjs release <name>
//
// Liveness is decided by `git worktree list` — repo metadata, shared by every
// worktree, impossible for a lane to be wrong about. council-os/LANES.md is the
// human-readable record and is reconciled against that truth, never trusted
// over it.
//
// Exit 0 success, 1 refusal, 2 usage/environment error.

import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

const BASE_BRANCH = "master";

function git(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
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

function die(msg, code = 1) {
  console.error(`lane: ${msg}`);
  process.exit(code);
}

// ---------------------------------------------------------------- locations

/** The main checkout: the working tree whose .git is a real directory. */
function mainCheckout() {
  const common = gitQuiet(["rev-parse", "--path-format=absolute", "--git-common-dir"], process.cwd());
  if (!common) die("not inside a git repository", 2);
  const gitCommon = common.trim();
  if (path.basename(gitCommon) !== ".git") die("bare repository — no main working tree", 2);
  return path.dirname(gitCommon);
}

/** Where lane worktrees live: a SIBLING of the repo, never inside it. */
function lanesRoot(main) {
  if (process.env.COAI_LANES_DIR) return process.env.COAI_LANES_DIR;
  return path.join(path.dirname(main), `${path.basename(main)}-lanes`);
}

function laneBranch(name) {
  return `lane/${name}`;
}

function validName(name) {
  return /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(name);
}

// ---------------------------------------------------------------- worktrees

function worktrees(main) {
  const raw = git(["worktree", "list", "--porcelain"], main);
  const out = [];
  let cur = null;
  for (const line of raw.split("\n")) {
    if (line.startsWith("worktree ")) {
      if (cur) out.push(cur);
      cur = { path: line.slice(9), branch: null, detached: false };
    } else if (line.startsWith("branch ")) {
      cur.branch = line.slice(7).replace(/^refs\/heads\//, "");
    } else if (line === "detached") {
      cur.detached = true;
    }
  }
  if (cur) out.push(cur);
  for (const w of out) w.exists = fs.existsSync(w.path);
  return out;
}

function branchExists(main, br) {
  return gitQuiet(["rev-parse", "--verify", "--quiet", `refs/heads/${br}`], main) !== null;
}

// ---------------------------------------------------------------- LANES.md

const LANES_HEADER = `# LANES — the live claim register

Machine-written by \`scripts/lane.mjs\`. Do not hand-edit the table; the row is
the human-readable half of a claim whose authority is \`git worktree list\`.

**One lane = one writer = one branch = one worktree.** Never a shared checkout.
See [LANE-PROTOCOL.md](LANE-PROTOCOL.md).

| lane | owner | branch | worktree | claimed | status | doing |
|---|---|---|---|---|---|---|
`;

function lanesFile(main) {
  return path.join(main, "council-os", "LANES.md");
}

function readLanes(main) {
  const f = lanesFile(main);
  if (!fs.existsSync(f)) return [];
  const rows = [];
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const c = line.split("|").map((x) => x.trim());
    if (c.length < 8) continue;
    if (!c[1] || c[1] === "lane" || /^-+$/.test(c[1])) continue;
    rows.push({
      lane: c[1],
      owner: c[2],
      branch: c[3].replace(/`/g, ""),
      worktree: c[4].replace(/`/g, ""),
      claimed: c[5],
      status: c[6],
      doing: c[7],
    });
  }
  return rows;
}

function writeLanes(main, rows) {
  const f = lanesFile(main);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const body = rows
    .map(
      (r) =>
        `| ${r.lane} | ${r.owner} | \`${r.branch}\` | \`${r.worktree}\` | ${r.claimed} | ${r.status} | ${r.doing} |`
    )
    .join("\n");
  fs.writeFileSync(f, LANES_HEADER + body + "\n");
}

function whoami(main) {
  return (
    process.env.COAI_LANE_OWNER ||
    (gitQuiet(["config", "user.name"], main) || "").trim() ||
    "unknown"
  );
}

// ---------------------------------------------------------------- claim

function cmdClaim(name, desc) {
  if (!name) die("usage: lane.mjs claim <name> --desc \"what this lane is doing\"", 2);
  if (!validName(name))
    die(`invalid lane name '${name}' — use lowercase letters, digits and hyphens (3-50 chars)`, 2);
  if (!desc) die("a claim must say what the lane is doing: --desc \"...\"", 2);

  const main = mainCheckout();
  const br = laneBranch(name);
  const wts = worktrees(main);
  const dest = path.join(lanesRoot(main), name);

  // REFUSAL 1: this lane name is already held by a worktree that exists on disk.
  const liveSame = wts.find((w) => w.branch === br && w.exists);
  if (liveSame) {
    const row = readLanes(main).find((r) => r.lane === name && r.status !== "released");
    console.error(
      `lane: REFUSED — lane '${name}' is already claimed by a LIVE worktree.\n` +
        `      branch:   ${br}\n` +
        `      worktree: ${liveSame.path}\n` +
        (row ? `      owner:    ${row.owner} (claimed ${row.claimed})\n      doing:    ${row.doing}\n` : "") +
        `\n  Two writers on one branch is exactly how work gets rewound.\n` +
        `  Pick another lane name, or take over that worktree directly:\n` +
        `      cd ${liveSame.path}\n`
    );
    process.exit(1);
  }

  // REFUSAL 2: the branch exists but has no live worktree — it holds commits
  // nobody is watching. Never silently reuse or reset it.
  if (branchExists(main, br)) {
    const tip = (gitQuiet(["log", "-1", "--format=%h %s", br], main) || "").trim();
    console.error(
      `lane: REFUSED — branch '${br}' already exists with no live worktree.\n` +
        `      tip: ${tip}\n` +
        `\n  That branch holds work. Reattach a worktree to it rather than\n` +
        `  starting a new branch on top of it:\n` +
        `      git worktree add ${dest} ${br}\n`
    );
    process.exit(1);
  }

  // REFUSAL 3: the destination directory is already occupied.
  if (fs.existsSync(dest)) {
    die(`REFUSED — ${dest} already exists. Remove or rename it first.`, 1);
  }

  // Base off the LOCAL master tip. Deliberately no fetch: a lane starts from
  // what this machine has actually verified, and reconciles at land time.
  const base = (gitQuiet(["rev-parse", "--short", BASE_BRANCH], main) || "").trim();
  if (!base) die(`cannot resolve base branch '${BASE_BRANCH}'`, 2);

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    git(["worktree", "add", "-b", br, dest, BASE_BRANCH], main);
  } catch (e) {
    die(`git worktree add failed: ${(e.stderr || e.message || "").toString().trim()}`, 2);
  }

  const rows = readLanes(main).filter((r) => r.lane !== name);
  rows.push({
    lane: name,
    owner: whoami(main),
    branch: br,
    worktree: dest,
    claimed: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
    status: "live",
    doing: desc.replace(/\|/g, "/"),
  });
  rows.sort((a, b) => a.lane.localeCompare(b.lane));
  writeLanes(main, rows);

  console.log(
    `lane '${name}' CLAIMED\n` +
      `  branch:   ${br}  (from ${BASE_BRANCH} @ ${base})\n` +
      `  worktree: ${dest}\n` +
      `  owner:    ${whoami(main)}\n` +
      `  doing:    ${desc}\n` +
      `\n  Work ONLY in that directory. Do not switch the main checkout's branch:\n` +
      `      cd ${dest}\n` +
      `\n  Registered in council-os/LANES.md (commit that row from the main checkout).\n`
  );
}

// ---------------------------------------------------------------- list

function cmdList() {
  const main = mainCheckout();
  const wts = worktrees(main);
  const rows = readLanes(main);

  console.log(`main checkout: ${main}`);
  const mainWt = wts.find((w) => path.resolve(w.path) === path.resolve(main));
  const mainStatus = (gitQuiet(["status", "--porcelain"], main) || "").trim();
  const mainDirty = mainStatus ? mainStatus.split("\n").length : 0;
  console.log(`  on branch ${mainWt?.branch ?? "(detached)"}, ${mainDirty} uncommitted path(s)` +
    (mainWt?.branch !== BASE_BRANCH ? "   <-- SHOULD BE master" : ""));

  console.log(`\nworktrees (${wts.length}):`);
  const stale = [];
  const rescue = [];
  for (const w of wts) {
    if (path.resolve(w.path) === path.resolve(main)) continue;
    if (!w.exists) {
      stale.push(w);
      console.log(`  GONE      ${w.branch ?? "(detached)"}\n            ${w.path}`);
      continue;
    }
    const st = (gitQuiet(["status", "--porcelain"], w.path) || "").trim();
    const dirty = st ? st.split("\n").length : 0;
    const ahead = (gitQuiet(["rev-list", "--count", `${BASE_BRANCH}..HEAD`], w.path) || "0").trim();
    if (dirty) rescue.push({ ...w, dirty });
    console.log(
      `  ${dirty ? "DIRTY".padEnd(9) : "clean".padEnd(9)} ${w.branch ?? "(detached)"}` +
        `  (+${ahead} ahead of ${BASE_BRANCH}, ${dirty} uncommitted)\n            ${w.path}`
    );
  }

  console.log(`\nLANES.md claims (${rows.length}):`);
  for (const r of rows) {
    const live = wts.some((w) => w.path === r.worktree && w.exists);
    console.log(`  ${live ? "live   " : "STALE  "} ${r.lane}  ${r.branch}  ${r.owner}  — ${r.doing}`);
  }

  if (stale.length) {
    console.log(`\n${stale.length} worktree(s) registered but missing from disk. Prune with:`);
    console.log(`      node scripts/lane.mjs prune`);
  }
  if (rescue.length) {
    console.log(`\n${rescue.length} worktree(s) hold UNCOMMITTED work — rescue before anyone prunes:`);
    for (const r of rescue) console.log(`      ${r.branch}  ${r.dirty} path(s)  ${r.path}`);
  }
}

// ---------------------------------------------------------------- release

function cmdRelease(name) {
  if (!name) die("usage: lane.mjs release <name>", 2);
  const main = mainCheckout();
  const br = laneBranch(name);
  const wts = worktrees(main);
  const wt = wts.find((w) => w.branch === br);
  if (!wt) die(`no worktree registered for lane '${name}' (branch ${br})`, 1);

  if (wt.exists) {
    const st = (gitQuiet(["status", "--porcelain"], wt.path) || "").trim();
    if (st) {
      const lines = st.split("\n");
      console.error(
        `lane: REFUSED — lane '${name}' has ${lines.length} uncommitted path(s).\n` +
          `      worktree: ${wt.path}\n\n` +
          lines.map((l) => `      ${l}`).join("\n") +
          `\n\n  Release NEVER discards work. Commit it, or stash it deliberately:\n` +
          `      git -C ${wt.path} add -A && git -C ${wt.path} commit -m "..."\n` +
          `      git -C ${wt.path} stash push -u -m "lane/${name} wip"\n` +
          `  then run release again.\n`
      );
      process.exit(1);
    }
    const unmerged = (gitQuiet(["rev-list", "--count", `${BASE_BRANCH}..${br}`], main) || "0").trim();
    if (unmerged !== "0") {
      console.error(
        `lane: REFUSED — lane '${name}' is ${unmerged} commit(s) ahead of ${BASE_BRANCH} and not landed.\n` +
          `      worktree: ${wt.path}\n` +
          (gitQuiet(["log", "--oneline", `${BASE_BRANCH}..${br}`], main) || "")
            .trim()
            .split("\n")
            .map((l) => `      ${l}`)
            .join("\n") +
          `\n\n  Land it first (ONE gated merge — see council-os/LANE-PROTOCOL.md),\n` +
          `  or release with --force-unlanded if you are deliberately abandoning it\n` +
          `  (the branch is kept either way; only the worktree is removed).\n`
      );
      if (!process.argv.includes("--force-unlanded")) process.exit(1);
    }
  }

  try {
    git(["worktree", "remove", wt.path], main);
  } catch (e) {
    // Directory already gone: just drop the registration.
    git(["worktree", "prune"], main);
  }

  const rows = readLanes(main).map((r) => (r.lane === name ? { ...r, status: "released" } : r));
  writeLanes(main, rows);
  console.log(
    `lane '${name}' RELEASED\n` +
      `  worktree removed: ${wt.path}\n` +
      `  branch ${br} KEPT (delete it yourself once it is landed and you are sure)\n`
  );
}

// ---------------------------------------------------------------- prune

function cmdPrune() {
  const main = mainCheckout();
  const before = worktrees(main);
  const missing = before.filter((w) => !w.exists);
  const held = [];
  for (const w of before) {
    if (!w.exists) continue;
    if (path.resolve(w.path) === path.resolve(main)) continue;
    const st = (gitQuiet(["status", "--porcelain"], w.path) || "").trim();
    if (st) held.push({ ...w, dirty: st.split("\n").length });
  }

  if (!missing.length) {
    console.log("nothing to prune — every registered worktree exists on disk.");
  } else {
    git(["worktree", "prune"], main);
    console.log(`pruned ${missing.length} registration(s) whose directory is gone:`);
    for (const w of missing) console.log(`  ${w.branch ?? "(detached)"}  ${w.path}`);
    console.log(`\nTheir branches are untouched. Nothing was deleted from disk.`);
  }

  if (held.length) {
    console.log(`\nNOT touched — these worktrees exist and hold uncommitted work:`);
    for (const w of held) console.log(`  ${w.branch}  ${w.dirty} path(s)  ${w.path}`);
  }

  const rows = readLanes(main);
  const wts = worktrees(main);
  const reconciled = rows.map((r) =>
    wts.some((w) => w.path === r.worktree && w.exists) ? r : { ...r, status: "released" }
  );
  writeLanes(main, reconciled);
}

// ---------------------------------------------------------------- adopt

// The register starts life true, not empty. Every worktree that exists on disk
// right now becomes a row, so LANES.md describes the estate as it actually is
// on the day the protocol lands rather than pretending the past did not happen.
// Dirty worktrees are flagged 'live-UNRESCUED' — somebody has work in there.
function cmdAdopt() {
  const main = mainCheckout();
  const wts = worktrees(main);
  const existing = new Map(readLanes(main).map((r) => [r.worktree, r]));
  const rows = [];
  let adopted = 0;
  for (const w of wts) {
    if (path.resolve(w.path) === path.resolve(main)) continue;
    if (!w.exists) continue;
    if (existing.has(w.path)) {
      rows.push(existing.get(w.path));
      continue;
    }
    const st = (gitQuiet(["status", "--porcelain"], w.path) || "").trim();
    const dirty = st ? st.split("\n").length : 0;
    const ahead = (gitQuiet(["rev-list", "--count", `${BASE_BRANCH}..HEAD`], w.path) || "0").trim();
    const br = w.branch ?? "(detached)";
    rows.push({
      lane: br.replace(/^(lane|feat|fix|docs|claude)\//, "").replace(/[^a-zA-Z0-9-]/g, "-"),
      owner: "adopted-pre-protocol",
      branch: br,
      worktree: w.path,
      claimed: "pre-protocol",
      status: dirty ? "live-UNRESCUED" : "live",
      doing: `adopted from git worktree list — +${ahead} ahead of ${BASE_BRANCH}, ${dirty} uncommitted`,
    });
    adopted++;
  }
  rows.sort((a, b) => a.lane.localeCompare(b.lane));
  writeLanes(main, rows);
  console.log(`adopted ${adopted} existing worktree(s) into council-os/LANES.md (${rows.length} rows total).`);
  const unrescued = rows.filter((r) => r.status === "live-UNRESCUED");
  if (unrescued.length) {
    console.log(`\n${unrescued.length} hold UNCOMMITTED work — rescue before anyone prunes:`);
    for (const r of unrescued) console.log(`  ${r.branch}  ${r.worktree}`);
  }
}

// ---------------------------------------------------------------- install-hooks

// Hooks are not shared by clone, so every machine has to opt in once. This sets
// core.hooksPath in the shared .git/config, which every worktree of this repo
// reads — one install covers all lanes. The mirrored git-lfs hooks in .githooks
// mean pointing away from the user's global hooksPath loses nothing.
function cmdInstallHooks() {
  const main = mainCheckout();
  const dir = path.join(main, ".githooks");
  if (!fs.existsSync(path.join(dir, "pre-commit"))) die(`missing ${dir}/pre-commit`, 2);
  const prev = (gitQuiet(["config", "--local", "core.hooksPath"], main) || "").trim();
  const globalPrev = (gitQuiet(["config", "--global", "core.hooksPath"], main) || "").trim();
  git(["config", "--local", "core.hooksPath", ".githooks"], main);
  console.log(
    `hooks installed: core.hooksPath = .githooks  (repo-local)\n` +
      (prev ? `  previous repo-local value: ${prev}\n` : "") +
      (globalPrev ? `  your global core.hooksPath (${globalPrev}) still applies to every OTHER repo;\n  its git-lfs hooks are mirrored into .githooks so nothing regresses here.\n` : "") +
      `\n  pre-commit now runs: node scripts/lane-guard.mjs --staged\n` +
      `  bypass one commit with: LANE_GUARD_SKIP=1 git commit ...\n`
  );
}

// ---------------------------------------------------------------- main

const [cmd, ...rest] = process.argv.slice(2);
const flagIdx = rest.indexOf("--desc");
const desc = flagIdx >= 0 ? rest[flagIdx + 1] : null;
const descValueIdx = flagIdx >= 0 ? flagIdx + 1 : -1;
const positional = rest.filter((a, i) => !a.startsWith("--") && i !== descValueIdx);

switch (cmd) {
  case "claim":
    cmdClaim(positional[0], desc);
    break;
  case "list":
    cmdList();
    break;
  case "release":
    cmdRelease(positional[0]);
    break;
  case "prune":
    cmdPrune();
    break;
  case "adopt":
    cmdAdopt();
    break;
  case "install-hooks":
    cmdInstallHooks();
    break;
  default:
    console.error(
      "usage:\n" +
        "  node scripts/lane.mjs claim <name> --desc \"what this lane is doing\"\n" +
        "  node scripts/lane.mjs list\n" +
        "  node scripts/lane.mjs release <name> [--force-unlanded]\n" +
        "  node scripts/lane.mjs prune\n" +
        "  node scripts/lane.mjs install-hooks\n"
    );
    process.exit(2);
}
