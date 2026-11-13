#!/usr/bin/env node
/**
 * cron-watch-plan.mjs — the DECISIONS the cron-health watch makes, with no
 * clock and no network, so both directions can be proven offline.
 *
 * WHY THIS IS A SEPARATE FILE. cron-watch.mjs is a CLI: importing it runs the
 * whole sweep against GitHub. A test that imports it would fire a live sweep
 * and then assert on its side effects. The decisions therefore live here, and
 * the CLI imports them. This mirrors scripts/hygiene/sweeper-plan.mjs.
 *
 * The estate's rule is the reason the separation matters: a detector that
 * cries wolf protects nothing, and a detector nobody can exercise offline is
 * a detector nobody exercises.
 */

/**
 * Decide one workflow's verdict from its runs.
 *
 * @param runs         the runs the API returned (with ?event=schedule applied)
 * @param budgetHours  staleness budget in hours
 * @param nowMs        the clock, injected so the caller can pin it
 */
export function classifyRuns(runs, budgetHours, nowMs = Date.now()) {
  const scheduled = runs.filter((r) => r.event === "schedule");
  if (!scheduled.length) {
    return { offender: true, last_scheduled: null, detail: "has a schedule: but no scheduled run has EVER fired" };
  }
  const last = scheduled[0].created_at;
  const ageH = (nowMs - Date.parse(last)) / 3_600_000;
  if (ageH > budgetHours) {
    return { offender: true, last_scheduled: last, detail: `last scheduled run ${Math.round(ageH)}h ago (budget ${budgetHours}h)` };
  }
  return { offender: false, last_scheduled: last, detail: null };
}

/**
 * May the watch CLOSE its signal? Only when nothing is wrong AND nothing is
 * unknown. An unreadable schedule is a gap in the watch, and closing the
 * signal because the sweep went blind is how a silent death stays silent.
 */
export function sweepIsClear(offenders, unknown) {
  return offenders.length === 0 && unknown.length === 0;
}

/**
 * The watch must catch a dead schedule AND pass a live one. Both halves are
 * proven here, offline, because a detector that cries wolf protects nothing.
 *
 * Returns 0 on success, 1 on failure. Prints one line per check.
 */
export function selftest() {
  const NOW = Date.parse("2026-11-06T00:00:00Z");
  let failed = 0;
  const check = (name, cond) => {
    if (cond) console.log(`  ok   ${name}`);
    else { console.error(`  FAIL ${name}`); failed += 1; }
  };

  // 1. A schedule that never fired IS an offender.
  const never = classifyRuns([{ event: "pull_request", created_at: "2026-11-05T00:00:00Z" }], 48, NOW);
  check("a schedule with no schedule run is an offender", never.offender === true);
  check("  ...and says so", /ever fired/i.test(never.detail ?? ""));

  // 2. A schedule that fired inside the budget is NOT an offender.
  const live = classifyRuns([{ event: "schedule", created_at: "2026-11-05T12:00:00Z" }], 48, NOW);
  check("a schedule that fired inside the budget passes", live.offender === false);

  // 3. A schedule that fired too long ago IS an offender, and names the age.
  const stale = classifyRuns([{ event: "schedule", created_at: "2026-10-01T00:00:00Z" }], 48, NOW);
  check("a schedule past the budget is an offender", stale.offender === true);
  check("  ...and names the age", /\d+h ago/.test(stale.detail ?? ""));

  // 4. The bug this selftest exists for: schedule runs buried behind
  //    pull_request runs must still be found. The fetch is server-side
  //    filtered, so this is the shape the API returns.
  const buried = classifyRuns(
    [{ event: "schedule", created_at: "2026-11-05T23:00:00Z" },
     { event: "schedule", created_at: "2026-11-05T22:00:00Z" },
     { event: "pull_request", created_at: "2026-11-05T23:30:00Z" }],
    48, NOW,
  );
  check("schedule runs buried among pull_request runs are still found", buried.offender === false);
  check("  ...and the newest one is the one reported", buried.last_scheduled === "2026-11-05T23:00:00Z");

  // 5. The newest schedule run is the one that counts, not the oldest.
  const newest = classifyRuns(
    [{ event: "schedule", created_at: "2026-11-05T23:00:00Z" },
     { event: "schedule", created_at: "2026-09-01T00:00:00Z" }],
    48, NOW,
  );
  check("the newest schedule run decides the verdict", newest.offender === false);

  // 6. The watch may only close its signal when it is both clean AND blind-free.
  check("a clean sweep with nothing unknown may close the signal", sweepIsClear([], []) === true);
  check("a sweep with an offender may NOT close the signal", sweepIsClear([{ workflow: "x" }], []) === false);
  check("a sweep that could not read a workflow may NOT close the signal", sweepIsClear([], [{ workflow: "y" }]) === false);

  if (failed) {
    console.error(`\ncron-watch SELFTEST FAILED — ${failed} check(s).`);
    return 1;
  }
  console.log("\ncron-watch selftest OK — a dead schedule is caught, a live one passes, and a schedule run buried behind pull_request runs is still found.");
  return 0;
}
