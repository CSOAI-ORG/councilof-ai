import test from "node:test";
import assert from "node:assert/strict";
import { loadSlots } from "./build-axis-reports.mjs";

test("axis reports load every canonical slot, including declared subject axes", async () => {
  const slots = await loadSlots();
  const ids = slots.map((slot) => slot.axis);
  assert.equal(ids.length, 33);
  assert.equal(new Set(ids).size, ids.length);
  const subjects = slots.filter((slot) => slot.family === "subject");
  assert.equal(subjects.length, 10);
  for (const axis of [
    "lab-practice",
    "company-practice",
    "measurer-integrity",
    "harness-fidelity",
    "interop-conformance",
    "humanoid-deployment",
    "regulator-transparency",
    "interpretability-reproducibility",
    "claim-maintenance",
    "serving-fidelity",
  ]) {
    const slot = subjects.find((candidate) => candidate.axis === axis);
    assert.ok(slot, `${axis} must not disappear from report inputs`);
    assert.equal(slot.status, "UNMEASURED");
    assert.equal(slot.n, 0);
  }
});
