import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyRuns, sweepIsClear } from "./cron-watch-plan.mjs";

const NOW = Date.parse("2026-11-06T00:00:00Z");
const run = (event, created_at) => ({ event, created_at });

test("classifyRuns: a schedule that never fired is an offender", () => {
  const v = classifyRuns([run("pull_request", "2026-11-05T00:00:00Z")], 48, NOW);
  assert.equal(v.offender, true);
  assert.match(v.detail, /ever fired/i);
  assert.equal(v.last_scheduled, null);
});

test("classifyRuns: a schedule that fired inside the budget passes", () => {
  const v = classifyRuns([run("schedule", "2026-11-05T12:00:00Z")], 48, NOW);
  assert.equal(v.offender, false);
  assert.equal(v.detail, null);
});

test("classifyRuns: a schedule past the budget is an offender and names the age", () => {
  const v = classifyRuns([run("schedule", "2026-10-01T00:00:00Z")], 48, NOW);
  assert.equal(v.offender, true);
  assert.match(v.detail, /\d+h ago/);
  assert.equal(v.last_scheduled, "2026-10-01T00:00:00Z");
});

test("classifyRuns: a schedule run buried behind pull_request runs is still found", () => {
  // This is the bug the fix exists for. The pre-fix watch fetched the 30 most
  // recent runs of ANY event and filtered for event === "schedule" in JS, so a
  // workflow that is mostly PR-driven had no schedule run inside that window
  // and was reported as never having fired. The API now filters server-side,
  // so the newest run returned IS the newest schedule run.
  const v = classifyRuns(
    [
      run("schedule", "2026-11-05T23:00:00Z"),
      run("schedule", "2026-11-05T22:00:00Z"),
      run("pull_request", "2026-11-05T23:30:00Z"),
    ],
    48, NOW,
  );
  assert.equal(v.offender, false);
  assert.equal(v.last_scheduled, "2026-11-05T23:00:00Z");
});

test("classifyRuns: the newest schedule run decides the verdict", () => {
  const v = classifyRuns(
    [run("schedule", "2026-11-05T23:00:00Z"), run("schedule", "2026-09-01T00:00:00Z")],
    48, NOW,
  );
  assert.equal(v.offender, false);
  assert.equal(v.last_scheduled, "2026-11-05T23:00:00Z");
});

test("sweepIsClear: the signal may close only when clean AND blind-free", () => {
  assert.equal(sweepIsClear([], []), true);
  assert.equal(sweepIsClear([{ workflow: "x" }], []), false);
  // A workflow the sweep could not read is NOT a healthy workflow. Closing the
  // issue because the sweep went blind is how a silent death stays silent.
  assert.equal(sweepIsClear([], [{ workflow: "y" }]), false);
  assert.equal(sweepIsClear([{ workflow: "x" }], [{ workflow: "y" }]), false);
});
