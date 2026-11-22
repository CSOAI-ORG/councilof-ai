#!/usr/bin/env node
/**
 * cron-watch.mjs — catch silently-dead scheduled workflows before a quarter passes.
 *
 * Two real losses motivated this (both found 2026-11-03): the mill land pipeline sat
 * without runs for 11 days, and the org profile's daily derivation had not fired for
 * FIFTY days while its output rotted on the org's most visible surface. GitHub cron
 * silently drops under load — this repo has known that since 2026-09-13 (see
 * bot-checks-sweeper.yml) — and a schedule that stops firing produces no failure signal
 * anywhere. This watch IS the signal.
 *
 * For each repo it knows about, it lists the registered workflows, takes the ones that
 * declare a `schedule:`, and reads each workflow's most recent run whose event was
 * `schedule`. Any scheduled workflow whose last scheduled run is older than the staleness
 * budget is reported. One issue holds the current offenders (title-searched, so it
 * updates instead of spamming); when the list is empty it does nothing.
 *
 * Usage: node scripts/hygiene/cron-watch.mjs [--repos a/b,c/d] [--budget-hours 48]
 *        [--issue-repo OWNER/REPO] (dry-run default: print; --apply opens/updates the issue)
 *        [--selftest] (offline; proves both directions of the watch, no network)
 */
import { execFileSync } from "node:child_process";
import { classifyRuns, sweepIsClear, selftest } from "./cron-watch-plan.mjs";

const args = process.argv.slice(2);
const val = (flag, dflt) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : dflt; };
const apply = args.includes("--apply") || val("--apply-if", "dry-run") === "apply";
const budgetHours = Number(val("--budget-hours", "48"));
const REPOS = val("--repos", "CSOAI-ORG/councilof-ai,CSOAI-ORG/.github").split(",").map(s => s.trim()).filter(Boolean);
const ISSUE_REPO = val("--issue-repo", "CSOAI-ORG/councilof-ai");
const ISSUE_TITLE = "cron-watch: scheduled workflows that have silently stopped firing";

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8", timeout: 120_000, maxBuffer: 64 * 1024 * 1024 });
}

// The selftest is offline and exits before any network work, so it can run in
// CI as a plain unit check. `node scripts/hygiene/cron-watch.mjs --selftest`
if (args.includes("--selftest")) {
  process.exit(selftest());
}

const offenders = [];
const unknown = [];
for (const repo of REPOS) {
  let workflows = [];
  try { workflows = JSON.parse(gh(["api", `repos/${repo}/actions/workflows?per_page=100`])).workflows ?? []; }
  catch (e) { console.error(`[cron-watch] could not list workflows for ${repo}: ${e.message}`); continue; }
  for (const wf of workflows) {
    if (wf.state !== "active") continue;
    let yaml = "";
    try { yaml = Buffer.from(gh(["api", `repos/${repo}/contents/${wf.path}`, "--jq", ".content"]), "base64").toString("utf8"); }
    catch { /* ghost registration: the workflow file is gone from the default branch */ continue; }
    if (!/^on:|\non:/.test(yaml) || !/\n\s+schedule:\n/.test(yaml)) continue; // only scheduled workflows
    let runs = [];
    // The event filter is applied SERVER-SIDE, not client-side.
    //
    // 2026-11-06: this fetched the 30 most recent runs of ANY event and then
    // filtered them for `event === "schedule"`. On a workflow that is mostly
    // triggered by pull_request, those 30 runs contain no schedule event at
    // all, so a HEALTHY workflow was reported as "no scheduled run has EVER
    // fired" — a false positive on a live schedule.
    //
    // CONTROL (2026-11-06, old logic vs new logic over the same live data,
    // 34 scheduled workflows): the old logic flagged crawler-view-gate as
    // "never fired" while its newest schedule run was 2026-11-05T14:44:11Z —
    // scheduleRunsInAnyWindow=0, which is the bug in one number. The old
    // logic's failure mode is OVER-REPORTING, not missing a dead schedule: a
    // dead workflow's own runs are few, so its window still contains its
    // schedule runs and the old filter reaches the right verdict by luck.
    //
    // Asking the API for `event=schedule` returns only schedule runs, so the
    // newest one is the newest schedule run, and an empty result means the
    // schedule really never fired.
    let runsError = null;
    try { runs = JSON.parse(gh(["api", `repos/${repo}/actions/workflows/${wf.id}/runs?event=schedule&per_page=30`])).workflow_runs ?? []; }
    catch (e) {
      // Never skip silently. A dropped workflow is a workflow this watch
      // cannot speak about, and a watch that quietly forgets is worse than a
      // watch that reports a gap — the whole point is to catch silence.
      runsError = e.message;
    }
    if (runsError !== null) {
      unknown.push({ repo, workflow: wf.name, path: wf.path, detail: `could not read runs: ${runsError}` });
      continue;
    }
    const verdict = classifyRuns(runs, budgetHours);
    if (verdict.offender) {
      offenders.push({ repo, workflow: wf.name, path: wf.path, last_scheduled: verdict.last_scheduled, detail: verdict.detail });
    }
  }
}

console.log(JSON.stringify({ checked: REPOS, offenders, unknown, apply }, null, 1));

if (apply) {
  // gh issue search treats the query as space-separated terms: embedded quotes or a
  // trailing colon break the parse outright (the first apply run died on exactly this).
  const existing = JSON.parse(gh(["issue", "list", "--repo", ISSUE_REPO, "--state", "open", "--search", "in:title cron-watch silently stopped", "--json", "number,title"]));
  const body =
    `Automated cron-health sweep (${new Date().toISOString()}). Scheduled workflows whose last\n` +
    `schedule-event run exceeds ${budgetHours}h, or that have a schedule but have never fired it.\n` +
    `GitHub cron silently drops under load (known since 2026-09-13); this issue is the signal.\n\n` +
    (offenders.length
      ? offenders.map((o) => `- **${o.repo}** — ${o.workflow} (\`${o.path}\`): ${o.detail}`).join("\n")
      : "No offenders right now — every scheduled workflow fired within budget. (This comment only appears if a sweep found zero after an issue existed.)") +
    (unknown.length
      ? `\n\n### Could not be read (not cleared)\n\nThese schedules were NOT verified. A workflow the sweep could not read is not a healthy workflow.\n\n` +
        unknown.map((u) => `- **${u.repo}** — ${u.workflow} (\`${u.path}\`): ${u.detail}`).join("\n")
      : "");
  // The issue may only be closed when NOTHING is wrong AND nothing is unknown.
  const clear = sweepIsClear(offenders, unknown);
  if (existing.length) {
    if (!clear) {
      gh(["issue", "comment", String(existing[0].number), "--repo", ISSUE_REPO, "--body", body]);
      console.log(`[cron-watch] updated issue #${existing[0].number}`);
    } else {
      gh(["issue", "close", String(existing[0].number), "--repo", ISSUE_REPO, "--comment", "All scheduled workflows are firing within budget again — closing."]);
      console.log(`[cron-watch] closed issue #${existing[0].number} (no offenders, nothing unknown)`);
    }
  } else if (!clear) {
    const n = gh(["issue", "create", "--repo", ISSUE_REPO, "--title", ISSUE_TITLE, "--body", body]);
    console.log(`[cron-watch] opened ${n.trim()}`);
  }
}
