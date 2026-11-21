import test from "node:test";
import assert from "node:assert/strict";
import { readFlywheelSnapshot } from "../client/src/lib/flywheelSnapshot.ts";

const row = () => ({
  id: "n-eff", name: "Roster diversity", axis: "continuity", phase: "honey",
  metric: "Source-reported n_eff: 2.5", description: "Local metadata",
  source_status: "AVAILABLE", freshness: "WITHIN_WINDOW", signature_verified: false, admitted: false,
});
const snap = () => ({ schema: "csoai.flywheel-snapshot/0.2", generated_at: "2026-11-18T00:00:00Z", n_planets: 1, planets: [row()] });

test("legacy and malformed snapshots cannot supply results", () => {
  for (const value of [null, {}, { planets: [row()] }, { ...snap(), schema: "legacy" }, { ...snap(), generated_at: "not-a-date" }])
    assert.equal(readFlywheelSnapshot(value), null);
});
test("zero rows clears the view rather than retaining bundled scores", () => {
  assert.deepEqual(readFlywheelSnapshot({ ...snap(), n_planets: 0, planets: [] }).planets, []);
});
test("per-user data and source phase do not cross the projection", () => {
  const input = { ...snap(), citizens: [{ citizen_id: "private-user" }] };
  const output = readFlywheelSnapshot(input);
  assert.equal(output.planets[0].phase, "water");
  assert.equal("citizens" in output, false);
  assert.equal(JSON.stringify(output).includes("private-user"), false);
});
test("freshness and unavailable states stay visible", () => {
  for (const state of ["STALE", "UNKNOWN_TIME", "FUTURE_DATED", "UNAVAILABLE"]) {
    const input = snap();
    input.planets[0].freshness = state;
    assert.ok(readFlywheelSnapshot(input).planets[0].metric.includes(state));
  }
});
test("duplicates, forged promotion, unexpected axes and invalid dates are rejected", () => {
  for (const mutation of [
    s => s.planets.push(s.planets[0]),
    s => s.planets[0].admitted = true,
    s => s.planets[0].signature_verified = true,
    s => s.planets[0].axis = "new-axis",
    s => s.planets[0].last_run_iso = "today",
  ]) {
    const input = snap(); mutation(input);
    input.n_planets = input.planets.length;
    assert.equal(readFlywheelSnapshot(input), null);
  }
});
