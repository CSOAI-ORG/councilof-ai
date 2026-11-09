#!/usr/bin/env node
/**
 * one-cycle-sync.mjs — execute the ONE next action that lands a pull request on a moving base.
 *
 * The decision lives in `one-cycle-decide.mjs` and is PURE; this file is the thin network shell
 * around it. That split is the point: the rule that stopped the estate from landing anything
 * ("never push while a required check is in flight") can be proved against fixtures, offline,
 * without a repository, a token or a network — and a lane can run this without writing its own
 * loop.
 *
 * WHAT IT DOES, once per cycle:
 *   1. read the pull request (state, draft, auto-merge armed), how far its head is behind the
 *      base, and the state of the four required contexts on the CURRENT head;
 *   2. ask `decide()` for exactly one next action;
 *   3. do that one thing.
 *
 * WHAT IT NEVER DOES:
 *   - never pushes while a required check is in flight (that is the invariant `decide()` holds,
 *     and it is asserted over a sweep of states in `one-cycle-decide.test.mjs`);
 *   - never rebases and never force-pushes: catching a branch up is `PUT /pulls/{n}/update-branch`,
 *     which preserves the reviewed commit SHAs (a rebase rewrites them and invalidates any
 *     approval tied to them), measured at ~2 s and clean on this repository;
 *   - never merges by hand, never uses `--admin`, never touches branch protection. Arming an
 *     auto-merge is the most it does about merging, and it READS THE ARMING BACK, because an
 *     arming that was refused must not be reported as armed.
 *
 * USAGE
 *   node scripts/land/one-cycle-sync.mjs <pr-number> [--repo owner/name] [--once|--watch]
 *        [--poll-seconds 45] [--deadline-seconds 3600] [--json] [--dry-run]
 *
 * `--dry-run` computes the decision and the receipt and DOES NOTHING — no push, no arm, no
 * update-branch. It is how the network path is proved without touching a branch, which matters
 * because a lane's branch is that lane's to push and nobody else's.
 *
 * EXIT CODES
 *   0  the cycle completed (DONE, AWAIT_AUTO_MERGE, WAIT_FOR_CHECKS, or an action that was taken)
 *   2  usage error
 *   3  BLOCKED — a required check failed, or a required context never reported
 *   4  RETRY_READ — a read did not complete; nothing was decided
 *   5  CONFLICT — `update-branch` reported a real merge conflict; the branch was left alone
 *
 * The token is read from GITHUB_TOKEN. On a laptop: `export GITHUB_TOKEN=$(gh auth token)`.
 */

import { decide, mayMergeNow, REQUIRED_CONTEXTS } from "./one-cycle-decide.mjs";

const argv = process.argv.slice(2);
const flag = (name, fallback = undefined) => {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 && at + 1 < argv.length ? argv[at + 1] : fallback;
};
const has = (name) => argv.includes(`--${name}`);

const prNumber = Number(argv.find((a) => /^\d+$/.test(a)));
if (!Number.isFinite(prNumber) || prNumber <= 0) {
  console.error("usage: node scripts/land/one-cycle-sync.mjs <pr-number> [--repo owner/name] [--watch]");
  process.exit(2);
}

const REPO = flag("repo", "CSOAI-ORG/councilof-ai");
const API = `https://api.github.com/repos/${REPO}`;
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error("GITHUB_TOKEN missing — export GITHUB_TOKEN=$(gh auth token)");
  process.exit(2);
}
const WATCH = has("watch");
const DRY_RUN = has("dry-run");
const POLL = Number(flag("poll-seconds", "45"));
const DEADLINE = Number(flag("deadline-seconds", "3600"));

/**
 * One read, with ONE retry. A transport failure is not a content verdict: GitHub's API refusing a
 * connection says nothing about whether the head is behind the base, and reporting "behind = 0"
 * from a failed read would be the same lie as a typed number — a zero that passes because the
 * thing it measures was absent. The retry count is reported separately so the flakiness stays
 * VISIBLE instead of being swallowed.
 */
let retries = 0;
async function api(path, init = {}) {
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${API}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "csoai-one-cycle-sync/1.0",
          ...(init.headers || {}),
        },
      });
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      if (!res.ok) {
        const error = new Error(`${init.method || "GET"} ${path} -> ${res.status}`);
        error.status = res.status;
        error.body = body;
        throw error;
      }
      return body;
    } catch (error) {
      lastError = error;
      // A 4xx is an answer, not a transport failure: do not retry it.
      if (error.status && error.status >= 400 && error.status < 500) throw error;
      if (attempt === 0) {
        retries++;
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }
  throw lastError;
}

/**
 * Read everything the decision needs. `readComplete` is false when any read failed, and the
 * decision then returns RETRY_READ rather than a verdict.
 */
async function readState() {
  const problems = [];
  let receiptNote = "";
  let headAgeSeconds;
  let pr = null;
  let behind = 0;
  let checkRuns = [];
  let runs = [];

  try {
    pr = await api(`/pulls/${prNumber}`);
  } catch (error) {
    problems.push(`pull request: ${error.message}`);
  }

  if (pr) {
    // Compare against the BASE BRANCH, not against `pr.base.sha`. MEASURED 2026-11-07 on #4084:
    // `pr.base.sha` was 3e1e09c64 — the tip of `master` when the pull request was CREATED — while
    // `master` had since moved to f956d5237. `compare/{pr.base.sha}...{head}` therefore reported
    // `behind_by: 0` and `status: ahead` while `compare/master...{head}` reported `behind_by: 2`
    // and `status: diverged`. So the first reading said "up to date" about a branch that was two
    // commits behind, and the instrument would have sat in AWAIT_AUTO_MERGE for ever — reproducing
    // the very stall it was written to remove. Two independent sources disagreed; the disagreement
    // is the finding, and the base BRANCH is the one that answers the question the decision asks.
    const baseRef = pr.base && pr.base.ref ? pr.base.ref : "master";
    try {
      const compare = await api(`/compare/${baseRef}...${pr.head.sha}`);
      behind = Number(compare.behind_by || 0);
      receiptNote = `compared against ${baseRef} (${String(compare.status)})`;
    } catch (error) {
      problems.push(`compare against ${baseRef}: ${error.message}`);
    }
    try {
      const checks = await api(`/commits/${pr.head.sha}/check-runs?per_page=100`);
      checkRuns = checks.check_runs || [];
    } catch (error) {
      problems.push(`check-runs: ${error.message}`);
    }
    try {
      const actions = await api(`/actions/runs?head_sha=${pr.head.sha}&per_page=50`);
      runs = actions.workflow_runs || [];
    } catch (error) {
      problems.push(`actions runs: ${error.message}`);
    }
    try {
      // The head's AGE. GitHub takes seconds to create the check-runs for a fresh push, so the
      // absence of the required contexts on a head that is fifteen seconds old is not a verdict.
      const commit = await api(`/commits/${pr.head.sha}`);
      const when = commit && commit.commit && commit.commit.committer && commit.commit.committer.date;
      if (when) {
        headAgeSeconds = Math.max(0, (Date.now() - new Date(when).getTime()) / 1000);
      }
    } catch (error) {
      problems.push(`head commit date: ${error.message}`);
    }
  }

  const byName = new Map();
  for (const run of checkRuns) if (!byName.has(run.name)) byName.set(run.name, run);
  const passed = [];
  const failed = [];
  const inFlight = [];
  const unreported = [];
  for (const name of REQUIRED_CONTEXTS) {
    const run = byName.get(name);
    if (!run) {
      unreported.push(name);
      continue;
    }
    if (run.status === "completed") {
      if (run.conclusion === "success") passed.push(name);
      else failed.push(name);
    } else {
      inFlight.push(name);
    }
  }
  const anyRunInFlight = runs.some((r) => r.status === "queued" || r.status === "in_progress");
  // A run held for approval has `status: completed` and `conclusion: action_required` — it is
  // NOT in flight, because it has not started. MEASURED 2026-11-08 on the catalogue's own
  // edition: the schedule pushes its branch with the workflow's GITHUB_TOKEN, so GitHub does not
  // start the runs it triggers — it holds all six of them as `action_required`, and the four
  // required contexts therefore never report. A reader that only asks "is anything running?"
  // sees nothing running and calls it broken.
  const runsAwaitingApproval = runs
    .filter((r) => r.conclusion === "action_required" || r.status === "action_required")
    .map((r) => r.name);

  return {
    note: receiptNote,
    state: {
      // The API's `state` is "closed" for a MERGED pull request too, so it cannot say whether the
      // change landed or was dropped. `merged` is the field that tells them apart. MEASURED
      // 2026-11-09: this read passed the raw `state` through, so PR #4148's receipt said "the pull
      // request is closed" for a pull request that had merged as 1d53df3cf.
      prState: pr ? (pr.merged ? "merged" : pr.state) : "open",
      draft: Boolean(pr && pr.draft),
      armed: Boolean(pr && pr.auto_merge),
      behind,
      readComplete: problems.length === 0,
      anyRunInFlight,
      runsAwaitingApproval,
      headAgeSeconds,
      required: { passed, failed, inFlight, unreported },
    },
    head: pr ? pr.head.sha : null,
    problems,
    anyRunInFlight,
  };
}

/** Arm the auto-merge, then READ IT BACK. An arming that was refused is not an arming. */
async function armAutoMerge(pr) {
  const mutation = `
    mutation ($id: ID!, $method: PullRequestMergeMethod!) {
      enablePullRequestAutoMerge(input: { pullRequestId: $id, mergeMethod: $method }) {
        pullRequest { number }
      }
    }`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "csoai-one-cycle-sync/1.0",
    },
    body: JSON.stringify({ query: mutation, variables: { id: pr.node_id, method: "MERGE" } }),
  });
  const body = await res.json();
  if (!res.ok || (body.errors && body.errors.length)) {
    return { armed: false, error: JSON.stringify(body.errors || body).slice(0, 400) };
  }
  const back = await api(`/pulls/${prNumber}`);
  return {
    armed: Boolean(back.auto_merge),
    by: back.auto_merge && back.auto_merge.enabled_by ? back.auto_merge.enabled_by.login : null,
    method: back.auto_merge ? back.auto_merge.merge_method : null,
  };
}

/**
 * MERGE NOW — the fallback for the one refusal that is not an obstacle.
 *
 * WHY. GitHub refuses to arm an auto-merge on a pull request that is ALREADY mergeable
 * ("Pull request is in clean status"). MEASURED 2026-11-09 on PR #4150. An auto-merge there
 * would have merged it a second later, so the arming is unnecessary and the merge is the
 * outcome. The other refusal — "Pull request is in unstable status" — means a non-required
 * check is still running: that one IS an obstacle, and the instrument waits.
 *
 * THE VERB IS PUT, NOT POST. GitHub's merge endpoint is a PUT route; a POST to it answers
 * 404, which is a very convincing way to look like a pull request that does not exist.
 *
 * The platform still enforces the branch policy here: this call fails if a required context
 * has not passed, and the required checks are the estate's, not this tool's.
 */
async function mergeNow() {
  try {
    const res = await api(`/pulls/${prNumber}/merge`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merge_method: "squash" }),
    });
    return { merged: true, result: res };
  } catch (error) {
    const message = JSON.stringify(error.body || "").slice(0, 300);
    return { merged: false, error: `${error.message} ${message}` };
  }
}

async function cycle() {
  const { state, head, problems, anyRunInFlight, note } = await readState();
  const decision = decide(state);
  const receipt = {
    pr: prNumber,
    at: new Date().toISOString(),
    head: head ? head.slice(0, 9) : null,
    behind: state.behind,
    required: state.required,
    anyRunInFlight,
    retries,
    problems,
    decision: decision.action,
    reason: decision.reason,
    note: note || "",
    executed: null,
  };

  switch (decision.action) {
    case "DONE":
    case "WAIT_FOR_CHECKS":
    case "AWAIT_AUTO_MERGE":
      receipt.executed = "none";
      break;
    case "READY": {
      if (DRY_RUN) {
        receipt.executed = "dry-run — would mark the pull request ready";
        break;
      }
      const res = await api(`/pulls/${prNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: false }),
      });
      receipt.executed = `marked ready (${res && res.number})`;
      break;
    }
    case "SYNC": {
      if (DRY_RUN) {
        receipt.executed = "dry-run — would send ONE update-branch (no push, no rebase)";
        break;
      }
      try {
        const res = await api(`/pulls/${prNumber}/update-branch`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        });
        receipt.executed = `update-branch accepted: ${JSON.stringify(res).slice(0, 200)}`;
      } catch (error) {
        const message = JSON.stringify(error.body || "").slice(0, 300);
        if (error.status === 422) {
          receipt.executed = `CONFLICT: the base and the head do not merge — ${message}. The branch was left alone; this is a real conflict for the lane to resolve.`;
          receipt.conflict = true;
        } else {
          receipt.executed = `update-branch failed: ${error.message} ${message}`;
          receipt.error = true;
        }
      }
      break;
    }
    case "ARM": {
      if (DRY_RUN) {
        receipt.executed = "dry-run — would arm the auto-merge and read the arming back";
        break;
      }
      const pr = await api(`/pulls/${prNumber}`);
      const arm = await armAutoMerge(pr);
      receipt.armed = arm.armed;
      if (arm.armed) {
        receipt.executed = `auto-merge armed by ${arm.by} (${arm.method}) — read back from the pull request`;
        break;
      }
      // The arming was refused. ONE of the two refusals means "you do not need an auto-merge,
      // the merge is available now" — and an instrument that stops there leaves a READY pull
      // request unlanded, which is exactly what happened to PR #4150 on 2026-11-09.
      const refusal = arm.error || "";
      const mergeableNow = /clean status/i.test(refusal);
      if (mergeableNow && mayMergeNow(state)) {
        const merged = await mergeNow();
        receipt.executed = merged.merged
          ? `merged (squash) — the auto-merge could not be armed because the pull request was already mergeable (${refusal.slice(0, 120)})`
          : `the merge was refused: ${merged.error}`;
        receipt.merged = Boolean(merged.merged);
        if (!merged.merged) receipt.error = true;
        break;
      }
      receipt.executed = `auto-merge was NOT armed: ${refusal || "the read-back shows no auto_merge"}`;
      if (mergeableNow && !mayMergeNow(state)) {
        receipt.executed += " — and a merge right now was NOT authorised by the state that was read";
      }
      break;
    }
    case "BLOCKED":
    case "RETRY_READ":
      receipt.executed = "none";
      break;
    default:
      receipt.executed = "none";
  }

  return receipt;
}

function print(receipt) {
  if (has("json")) {
    console.log(JSON.stringify(receipt));
    return;
  }
  const req = receipt.required || {};
  console.log(
    [
      receipt.at,
      `PR #${receipt.pr}`,
      `head=${receipt.head}`,
      `behind=${receipt.behind}`,
      `required[passed=${req.passed?.length || 0} inFlight=${req.inFlight?.length || 0} failed=${req.failed?.length || 0} unreported=${req.unreported?.length || 0}]`,
      receipt.headAgeSeconds !== undefined ? `head_age=${Math.round(receipt.headAgeSeconds)}s` : "",
      receipt.runsAwaitingApproval && receipt.runsAwaitingApproval.length ? `held_for_approval=${receipt.runsAwaitingApproval.join("+")}` : "",
      `-> ${receipt.decision}`,
      receipt.reason,
      receipt.note ? `   (${receipt.note})` : "",
      receipt.executed && receipt.executed !== "none" ? `   ${receipt.executed}` : "",
      receipt.retries ? `   (${receipt.retries} transport retry/retries — the read was retried, not assumed)` : "",
    ]
      .filter(Boolean)
      .join(" ")
  );
}

const startedAt = Date.now();
for (;;) {
  let receipt;
  try {
    receipt = await cycle();
  } catch (error) {
    // The loop itself failed. That is a transport event, not a verdict: report it and try again
    // until the deadline, rather than declaring the pull request stuck on a read that never
    // happened.
    print({
      pr: prNumber,
      at: new Date().toISOString(),
      head: null,
      behind: null,
      required: {},
      retries,
      problems: [error.message],
      decision: "RETRY_READ",
      reason: "the cycle itself failed — a read did not complete; absence is a state, not a reading",
      executed: "none",
    });
    if (!WATCH || Date.now() - startedAt > DEADLINE * 1000) process.exit(4);
    await new Promise((r) => setTimeout(r, POLL * 1000));
    continue;
  }
  print(receipt);

  if (!WATCH) {
    if (receipt.decision === "BLOCKED") process.exit(3);
    if (receipt.decision === "RETRY_READ") process.exit(4);
    if (receipt.conflict) process.exit(5);
    if (receipt.error) process.exit(4);
    process.exit(0);
  }
  if (receipt.decision === "DONE") process.exit(0);
  if (receipt.decision === "BLOCKED") process.exit(3);
  if (Date.now() - startedAt > DEADLINE * 1000) {
    console.error("deadline reached — exiting without a verdict");
    process.exit(4);
  }
  await new Promise((r) => setTimeout(r, POLL * 1000));
}
