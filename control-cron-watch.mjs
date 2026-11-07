#!/usr/bin/env node
/**
 * CONTROL for the cron-watch fix.
 *
 * Runs BOTH the old (client-side filter over the 30 newest runs of ANY event)
 * and the new (server-side ?event=schedule) logic against the SAME live data,
 * and prints the disagreements. This is the proof that the fix changed
 * behaviour, not just that a selftest passes.
 *
 * Not for commit.
 */
import { execFileSync } from "node:child_process";

const REPOS = ["CSOAI-ORG/councilof-ai", "CSOAI-ORG/.github"];
const BUDGET = 48;

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8", timeout: 120_000, maxBuffer: 64 * 1024 * 1024 });
}

// OLD logic, verbatim from the pre-fix script.
function oldVerdict(runs, nowMs) {
  const scheduled = runs.filter((r) => r.event === "schedule");
  if (!scheduled.length) {
    return { offender: true, last: null, detail: "has a schedule: but no scheduled run has EVER fired" };
  }
  const last = scheduled[0].created_at;
  const ageH = (nowMs - Date.parse(last)) / 3_600_000;
  if (ageH > BUDGET) return { offender: true, last, detail: `last scheduled run ${Math.round(ageH)}h ago` };
  return { offender: false, last, detail: null };
}

// NEW logic, verbatim from the fixed script.
function newVerdict(runs, nowMs) {
  const scheduled = runs.filter((r) => r.event === "schedule");
  if (!scheduled.length) {
    return { offender: true, last: null, detail: "has a schedule: but no scheduled run has EVER fired" };
  }
  const last = scheduled[0].created_at;
  const ageH = (nowMs - Date.parse(last)) / 3_600_000;
  if (ageH > BUDGET) return { offender: true, last, detail: `last scheduled run ${Math.round(ageH)}h ago` };
  return { offender: false, last, detail: null };
}

const now = Date.now();
const rows = [];

for (const repo of REPOS) {
  let workflows = [];
  try { workflows = JSON.parse(gh(["api", `repos/${repo}/actions/workflows?per_page=100`])).workflows ?? []; }
  catch (e) { console.error(`[control] list failed ${repo}: ${e.message}`); continue; }

  for (const wf of workflows) {
    if (wf.state !== "active") continue;
    let yaml = "";
    try { yaml = Buffer.from(gh(["api", `repos/${repo}/contents/${wf.path}`, "--jq", ".content"]), "base64").toString("utf8"); }
    catch { continue; }
    if (!/^on:|\non:/.test(yaml) || !/\n\s+schedule:\n/.test(yaml)) continue;

    let anyEvent = [], schedOnly = [];
    try { anyEvent = JSON.parse(gh(["api", `repos/${repo}/actions/workflows/${wf.id}/runs?per_page=30`])).workflow_runs ?? []; } catch { continue; }
    try { schedOnly = JSON.parse(gh(["api", `repos/${repo}/actions/workflows/${wf.id}/runs?event=schedule&per_page=30`])).workflow_runs ?? []; } catch { continue; }

    const o = oldVerdict(anyEvent, now);
    const n = newVerdict(schedOnly, now);
    rows.push({
      repo, workflow: wf.name, path: wf.path,
      scheduleRunsInAnyWindow: anyEvent.filter((r) => r.event === "schedule").length,
      scheduleRunsInFiltered: schedOnly.length,
      old: o.offender, new: n.offender,
      oldLast: o.last, newLast: n.last,
      detail: n.detail ?? o.detail,
    });
  }
}

const rowsJson = rows.map((r) => ({ ...r, workflow: r.workflow, id: undefined }));
console.log("=== CONTROL: old logic vs new logic, same live data ===");
console.log(`scheduled workflows examined: ${rows.length}`);
console.log(`old offenders: ${rows.filter((r) => r.old).length}`);
console.log(`new offenders: ${rows.filter((r) => r.new).length}`);

const fp = rows.filter((r) => r.old && !r.new);   // old cried wolf
const fn = rows.filter((r) => !r.old && r.new);   // old missed
console.log("\n--- FALSE POSITIVES (old flagged, new clears) ---");
for (const r of fp) console.log(`  ${r.workflow}  [${r.path}]  scheduleRunsInAnyWindow=${r.scheduleRunsInAnyWindow}  newLast=${r.newLast}`);
console.log("\n--- FALSE NEGATIVES (old cleared, new flags) ---");
for (const r of fn) console.log(`  ${r.workflow}  [${r.path}]  scheduleRunsInAnyWindow=${r.scheduleRunsInAnyWindow}  detail=${r.detail}`);
console.log("\n--- AGREED OFFENDERS (both flag) ---");
for (const r of rows.filter((x) => x.old && x.new)) console.log(`  ${r.workflow}  [${r.path}]  ${r.detail}`);
console.log("\n--- AGREED HEALTHY (both clear) ---");
for (const r of rows.filter((x) => !x.old && !x.new)) console.log(`  ${r.workflow}  [${r.path}]  last=${r.newLast}`);
console.log("\n--- DISAGREEMENT DETAIL ---");
for (const r of rows.filter((x) => x.old !== x.new)) {
  console.log(`  ${r.workflow}: oldLast=${r.oldLast ?? "none"} newLast=${r.newLast ?? "none"} anyWindowScheduleRuns=${r.scheduleRunsInAnyWindow}`);
}
