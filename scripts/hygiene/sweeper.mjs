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
import { plan } from "./sweeper-plan.mjs";

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
    title: p.title,
    draft: p.draft ?? false,
    state: p.state === "open" ? "OPEN" : "CLOSED",
    mergedAt: p.merged_at ?? null,
    closedAt: p.closed_at ?? null,
  }));
}

const SUPERSEDE_COMMENT = (s) =>
  s.mergedKeep
    ? `Closing as superseded: this family's newest run is #${s.keep}, already MERGED — master holds that run's data, so this older branch can only regress it. Nothing is lost — the source datasets retain everything (mill landings stay staged; probes regenerate from the live doors). Standing rule: issue #3746.`
    : `Closing as superseded: the newest open run of this family is #${s.keep}. Each run writes the same output paths, so an older conflicting branch can only regress master. Nothing is lost — the source datasets retain everything (mill landings stay staged; probes regenerate from the live doors). Standing rule: issue #3746.`;

const summary = { supersedeClosed: [], millAutoMerge: [], gcDeleted: [], skipped: [], dryRun: mode === "dry-run" };

const open = listPulls("open");
const closed = listPulls("closed");
const p = plan({ open, closed, now: Date.now() });

// ── supersede-close ─────────────────────────────────────────────────────────
for (const s of p.supersede) {
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
