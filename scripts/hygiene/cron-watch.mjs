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
 */
import { execFileSync } from "node:child_process";

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

const offenders = [];
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
    try { runs = JSON.parse(gh(["api", `repos/${repo}/actions/workflows/${wf.id}/runs?per_page=30`])).workflow_runs ?? []; }
    catch { continue; }
    const scheduled = runs.filter((r) => r.event === "schedule");
    if (!scheduled.length) {
      offenders.push({ repo, workflow: wf.name, path: wf.path, last_scheduled: null, detail: "has a schedule: but no scheduled run has EVER fired" });
      continue;
    }
    const last = scheduled[0].created_at;
    const ageH = (Date.now() - Date.parse(last)) / 3_600_000;
    if (ageH > budgetHours) {
      offenders.push({ repo, workflow: wf.name, path: wf.path, last_scheduled: last, detail: `last scheduled run ${Math.round(ageH)}h ago (budget ${budgetHours}h)` });
    }
  }
}

console.log(JSON.stringify({ checked: REPOS, offenders, apply }, null, 1));

if (apply) {
  const existing = JSON.parse(gh(["issue", "list", "--repo", ISSUE_REPO, "--state", "open", "--search", `in:title "${ISSUE_TITLE}"`, "--json number,title"]));
  const body =
    `Automated cron-health sweep (${new Date().toISOString()}). Scheduled workflows whose last\n` +
    `schedule-event run exceeds ${budgetHours}h, or that have a schedule but have never fired it.\n` +
    `GitHub cron silently drops under load (known since 2026-09-13); this issue is the signal.\n\n` +
    (offenders.length
      ? offenders.map((o) => `- **${o.repo}** — ${o.workflow} (\`${o.path}\`): ${o.detail}`).join("\n")
      : "No offenders right now — every scheduled workflow fired within budget. (This comment only appears if a sweep found zero after an issue existed.)");
  if (existing.length) {
    if (offenders.length) {
      gh(["issue", "comment", String(existing[0].number), "--repo", ISSUE_REPO, "--body", body]);
      console.log(`[cron-watch] updated issue #${existing[0].number}`);
    } else {
      gh(["issue", "close", String(existing[0].number), "--repo", ISSUE_REPO, "--comment", "All scheduled workflows are firing within budget again — closing."]);
      console.log(`[cron-watch] closed issue #${existing[0].number} (no offenders)`);
    }
  } else if (offenders.length) {
    const n = gh(["issue", "create", "--repo", ISSUE_REPO, "--title", ISSUE_TITLE, "--body", body]);
    console.log(`[cron-watch] opened ${n.trim()}`);
  }
}
