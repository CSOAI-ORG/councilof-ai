#!/usr/bin/env node
/**
 * sweeper.mjs — apply (or print, in dry-run) the plan sweeper-plan.mjs proposes.
 *
 * Issue #3746, owner-ruling 2026-11-02: the automation families (mill landings, canary
 * captures, x402 door probes, hf coverage probes) were designed "human merge is the only
 * gate", and no human ever came — 17 mill landings piled up unmerged while the probes
 * superseded each other into conflicts. This sweeper is the standing replacement for that
 * manual pass:
 *
 *   · SUPERSEDE-CLOSE — when a family has several open PRs, keep the newest, close the
 *     rest with a pointer. Every run writes the same output paths, so an older conflicting
 *     branch can only regress master.
 *   · GREEN-MILL AUTO-MERGE — the newest open mill landing, when every check is green and
 *     the branch is mergeable, gets update-branch + `gh pr merge --squash --auto`. This is
 *     how the mill's measurement cards reach master again. Never with anything failing or
 *     pending; never for any other family (their value is the latest run, not the merge).
 *   · BRANCH GC — closed (unmerged) family PRs older than 7 days lose their head branch;
 *     the PR ref keeps every commit.
 *
 * AUTH MATTERS (see the workflow): every call runs through the gh CLI, so identity follows
 * GH_TOKEN. Run as SNAPSHOT_PR_TOKEN — a PAT — because a PAT's push events fire the
 * required pull_request checks after update-branch; GITHUB_TOKEN's would not, and its
 * auto-merge would hang forever (measured truth recorded in bot-checks-sweeper.yml).
 *
 * Usage: node scripts/hygiene/sweeper.mjs [--mode dry-run|apply] [--repo OWNER/REPO]
 */
import { execFileSync } from "node:child_process";
import { plan, logPayloadsIn, supersedeVerdict, gcVerdict } from "./sweeper-plan.mjs";

const args = process.argv.slice(2);
const modeArg = args.indexOf("--mode");
const mode = modeArg >= 0 ? args[modeArg + 1] : "dry-run";
const repoArg = args.indexOf("--repo");
const REPO = repoArg >= 0 ? args[repoArg + 1] : process.env.GITHUB_REPOSITORY;

if (!["dry-run", "apply"].includes(mode)) {
  console.error(`[sweeper] unknown mode ${mode} — use dry-run or apply`);
  process.exit(2);
}
if (!REPO || !REPO.includes("/")) {
  console.error("[sweeper] no repository — pass --repo OWNER/REPO or set GITHUB_REPOSITORY");
  process.exit(2);
}

function gh(args) {
  // Each PR object embeds the full repo object — a single page of /pulls is megabytes of
  // JSON, so the default 1 MB spawn buffer dies with ENOBUFS (measured 2026-11-02).
  return execFileSync("gh", args, { encoding: "utf8", timeout: 120_000, maxBuffer: 64 * 1024 * 1024 });
}

function listPulls(state) {
  const out = [];
  for (let page = 1; page <= 5; page++) {
    const chunk = gh(["api", `repos/${REPO}/pulls?state=${state}&per_page=100&page=${page}`]);
    const rows = JSON.parse(chunk);
    out.push(...rows);
    if (rows.length < 100) break;
  }
  return out.map((p) => ({
    number: p.number,
    headRefName: p.head?.ref ?? p.headRefName,
    headSha: p.head?.sha ?? null,
    title: p.title,
    draft: p.draft ?? false,
    state: p.state === "open" ? "OPEN" : "CLOSED",
    mergedAt: p.merged_at ?? null,
    closedAt: p.closed_at ?? null,
  }));
}

// ── the append-log evidence ───────────────────────────────────────────────────
//
// A close and a branch delete are both claims: "nothing is lost". For the
// replace families (x402, mill, coverage) the claim is true by construction —
// each run REWRITES the same output paths. For the canary family the payload is
// an append log and the claim is FALSE until shown: measured 3 Nov 2026, eight
// of #3392's rows are absent from #3565, so closing it drops dated observations.
//
// So the claim is CHECKED, not asserted, and it is checked against the bytes:
// the older run's rows must be present in the keeper. If they cannot be read,
// the verdict is UNPROVABLE and nothing is closed or deleted.

const filesCache = new Map();
function changedFiles(number) {
  if (filesCache.has(number)) return filesCache.get(number);
  let files = [];
  try {
    const raw = gh(["api", `repos/${REPO}/pulls/${number}/files?per_page=100`]);
    files = JSON.parse(raw).map((f) => f.filename);
  } catch {
    files = [];
  }
  filesCache.set(number, files);
  return files;
}

const rowsCache = new Map();
/** The non-empty lines of a file at a ref, or null when it cannot be read. */
function fileRows(path, ref) {
  const key = `${ref}:${path}`;
  if (rowsCache.has(key)) return rowsCache.get(key);
  let rows = null;
  try {
    const raw = gh(["api", `repos/${REPO}/contents/${path}?ref=${encodeURIComponent(ref)}`]);
    const j = JSON.parse(raw);
    if (j && j.type === "file" && typeof j.content === "string") {
      rows = Buffer.from(j.content, "base64")
        .toString("utf8")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    }
  } catch {
    rows = null;
  }
  rowsCache.set(key, rows);
  return rows;
}

const shaCache = new Map();
function headShaOf(number) {
  if (shaCache.has(number)) return shaCache.get(number);
  let sha = null;
  try {
    sha = JSON.parse(gh(["pr", "view", String(number), "--repo", REPO, "--json", "headRefOid"])).headRefOid || null;
  } catch {
    sha = null;
  }
  shaCache.set(number, sha);
  return sha;
}

/**
 * The log payloads to compare for a PR, against a keeper ref. Every .jsonl the
 * PR changed is a log; each is compared against the keeper's copy of the same
 * path. A payload the keeper does not have at all is UNPROVABLE, not empty.
 */
function logPayloadsFor(number, keeperRef) {
  const payloads = [];
  for (const path of logPayloadsIn(changedFiles(number))) {
    const olderRows = fileRows(path, headShaOf(number) || "HEAD");
    const keeperRows = fileRows(path, keeperRef);
    payloads.push({ path, olderRows, keeperRows });
  }
  return payloads;
}

// The comment a close carries. It used to ASSERT "nothing is lost"; now it is
// only ever said after the bytes were compared (see the verdict gate above), so
// the sentence is a checked statement rather than a hope.
const SUPERSEDE_COMMENT = (s) =>
  s.mergedKeep
    ? `Closing as superseded: this family's newest run is #${s.keep}, already MERGED — master holds that run's data, and the payload comparison found no row of this run that master lacks, so this older branch can only regress it. Standing rule: issue #3746.`
    : `Closing as superseded: the newest open run of this family is #${s.keep}, and the payload comparison found no row of this run that #${s.keep} lacks, so an older conflicting branch can only regress master. Standing rule: issue #3746.`;

const summary = { supersedeClosed: [], millAutoMerge: [], gcDeleted: [], skipped: [], dryRun: mode === "dry-run" };

const open = listPulls("open");
const closed = listPulls("closed");
const p = plan({ open, closed, now: Date.now() });

// ── supersede-close ─────────────────────────────────────────────────────────
for (const s of p.supersede) {
  // The keeper is the newer OPEN sibling, or — when the newest is already
  // MERGED — master's tip, because master is where that run's data lives.
  const keeperRef = s.mergedKeep ? "master" : headShaOf(s.keep);
  const payloads = logPayloadsFor(s.number, keeperRef || "master");
  const verdict = supersedeVerdict({ payloads });
  if (!verdict.ok) {
    console.log(`[sweeper] supersede: NOT closing #${s.number} (newest of ${s.family} is #${s.keep}) — ${verdict.reason}`);
    summary.skipped.push({ number: s.number, reason: verdict.reason });
    continue;
  }
  console.log(`[sweeper] supersede: close #${s.number} (newest of ${s.family} is #${s.keep}${s.mergedKeep ? ", merged" : ""})`);
  if (mode === "apply") {
    gh(["pr", "close", String(s.number), "--repo", REPO, "--comment", SUPERSEDE_COMMENT(s)]);
    summary.supersedeClosed.push(s.number);
  } else {
    summary.supersedeClosed.push(s.number);
  }
}

// ── green-mill auto-merge ───────────────────────────────────────────────────
for (const n of p.millAutoMerge) {
  const detail = JSON.parse(gh(["pr", "view", String(n), "--repo", REPO,
    "--json", "mergeStateStatus,statusCheckRollup"]));
  const rollup = detail.statusCheckRollup ?? [];
  const pending = rollup.filter((c) => c.status && c.status !== "COMPLETED");
  const failing = rollup.filter((c) => c.conclusion === "FAILURE" || c.conclusion === "TIMED_OUT" || c.conclusion === "CANCELLED");
  if (pending.length || failing.length) {
    const why = pending.length ? `${pending.length} check(s) pending` : `failing: ${failing.map((f) => f.name).join(", ")}`;
    console.log(`[sweeper] mill #${n}: NOT auto-mergeable — ${why}`);
    summary.skipped.push({ number: n, reason: why });
    continue;
  }
  if (mode === "apply") {
    // update-branch as the PAT fires pull_request.synchronize — the required checks run
    // for real on the new head, which is what lets the armed auto-merge actually fire.
    if (detail.mergeStateStatus === "BEHIND") {
      gh(["pr", "update-branch", String(n), "--repo", REPO]);
      console.log(`[sweeper] mill #${n}: updated branch (was behind)`);
    }
    gh(["pr", "merge", String(n), "--repo", REPO, "--squash", "--auto"]);
    summary.millAutoMerge.push({ number: n, action: `auto-merge armed (${detail.mergeStateStatus})` });
  } else {
    summary.millAutoMerge.push({ number: n, action: `would arm auto-merge (${detail.mergeStateStatus})` });
  }
}

// ── branch GC ───────────────────────────────────────────────────────────────
for (const g of p.gc) {
  // The same question, asked of a BRANCH: does it still hold rows master does
  // not? MEASURED 3 Nov 2026 — the sweeper closed six canary PRs and deleted
  // all six branches in the same pass, so the branch that held a dated
  // observation went with it. The PR ref keeps the COMMITS, but a branch that
  // is the only keeper of rows master does not have is not garbage.
  const payloads = logPayloadsFor(g.number, "master");
  const verdict = gcVerdict({ payloads });
  if (!verdict.ok) {
    console.log(`[sweeper] gc: NOT deleting branch ${g.branch} (closed PR #${g.number}) — ${verdict.reason}`);
    summary.skipped.push({ number: g.number, reason: verdict.reason });
    continue;
  }
  console.log(`[sweeper] gc: delete branch ${g.branch} (closed PR #${g.number}, >7d, unmerged)`);
  if (mode === "apply") {
    try {
      gh(["api", "-X", "DELETE", `repos/${REPO}/git/refs/heads/${g.branch}`]);
      summary.gcDeleted.push(g.branch);
    } catch {
      console.log(`[sweeper] gc: ${g.branch} already gone`);
    }
  } else {
    summary.gcDeleted.push(g.branch);
  }
}

console.log(JSON.stringify(summary, null, 1));
