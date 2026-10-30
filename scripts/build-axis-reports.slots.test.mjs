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
  }

  // Nine of the ten subject axes are still declared slots: nothing measured, n 0.
  const declared = subjects.filter((slot) => slot.kind === "declared-slot");
  assert.equal(declared.length, 9);
  for (const slot of declared) {
    assert.equal(slot.status, "UNMEASURED", slot.axis);
    assert.equal(slot.n, 0, slot.axis);
  }
});

test("claim-maintenance is a MEASURED subject axis with a frozen, sha-pinned bank", async () => {
  // Promoted 2026-10-29 under the owner's option-3 ruling: publish on the four outcomes
  // the evidence settles, and say in the axis's own note that the disclosure split is not
  // part of the measurement. This is the FIRST measured subject axis.
  const slots = await loadSlots();
  const slot = slots.find((candidate) => candidate.axis === "claim-maintenance");
  assert.ok(slot, "claim-maintenance must not disappear from report inputs");
  assert.equal(slot.kind, "measured-subject");
  assert.equal(slot.status, "MEASURED");
  assert.equal(slot.method_status, "meets-rule");
  assert.equal(slot.family, "subject");
  assert.ok(slot.n >= 30, "the Measure ruling's floor is n_valid >= 30");
  assert.equal(slot.n, 174);
  assert.equal(slot.method, "claim-maintenance v0.2");
  assert.match(slot.method_sha, /^[0-9a-f]{64}$/);
  assert.equal(slot.bank, "public/interop/claim-maintenance-wave-2026-10-28.json");
  assert.match(slot.bank_sha256, /^[0-9a-f]{64}$/);
  assert.deepEqual(slot.per_outcome, { UNCHANGED: 12, CHANGED: 110, WITHDRAWN: 52, UNREACHABLE: 8 });
  // A subject axis has no model fleet, so it carries no leader, no accuracy and no
  // separation: it must never join a mean or a separation tally.
  assert.equal(slot.accuracy, undefined);
  assert.equal(slot.leader, undefined);
  assert.equal(slot.separation, undefined);
  // And the limit is stated on the axis, not only in a proposal.
  assert.match(slot.note, /disclosure split/i);
  assert.match(slot.note, /NOT part of this measurement/i);
});
