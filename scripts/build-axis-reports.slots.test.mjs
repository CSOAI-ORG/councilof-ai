import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadSlots } from "./build-axis-reports.mjs";

// The canonical axis id set is the ONE alias table: "keys are the canonical axis ids
// exactly as GET https://councilof.ai/api/gspc spells them (axes[].axis)". It is a
// mirror of the axis modules, and functions/mcp/axis-aliases.test.ts already fails if
// a key stops being a board row. So comparing the loaded slots against it is a real
// cross-check — a slot that vanishes from the modules fails here — and it lets this
// test DERIVE the axis set instead of typing a count that goes stale the moment a
// slot is declared. A typed count here was the estate repeating the exact defect it
// repaired in canon.json: a frozen number that turns a legitimate growth into a red
// build (scripts/build-axis-reports.slots.test.mjs asserted 33 and 10 subject axes).
const ALIASES = JSON.parse(
  fs.readFileSync(new URL("../functions/mcp/axis-aliases.json", import.meta.url), "utf8"),
);

// The axes whose disappearance this test is here to catch. A named set, not a count:
// a new declared subject axis does not have to be added here to keep this test green,
// and an axis that vanishes still fails.
const GUARDED_SUBJECT_AXES = [
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
  "watchdog-ingest",
];

test("axis reports load every canonical slot, including declared subject axes", async () => {
  const slots = await loadSlots();
  const ids = slots.map((slot) => slot.axis);
  const canonical = Object.keys(ALIASES.axes);

  assert.ok(canonical.length > 0, "the alias table must not be empty");
  assert.deepEqual(
    [...ids].sort(),
    [...canonical].sort(),
    "the loaded slots and the canonical axis table must be the same set",
  );
  assert.equal(new Set(ids).size, ids.length);

  const subjects = slots.filter((slot) => slot.family === "subject");
  for (const axis of GUARDED_SUBJECT_AXES) {
    const slot = subjects.find((candidate) => candidate.axis === axis);
    assert.ok(slot, `${axis} must not disappear from report inputs`);
  }

  // A subject axis is either a DECLARED position with no run behind it or a
  // MEASURED subject axis with a frozen run behind it. The counts are DERIVED
  // from the slots themselves -- a typed count here is a frozen number that
  // turns a legitimate change into a red build.
  const declared = subjects.filter((slot) => slot.kind === "declared-slot");
  const measuredSubjects = subjects.filter((slot) => slot.kind === "measured-subject");
  assert.equal(declared.length + measuredSubjects.length, subjects.length);
  for (const slot of declared) {
    assert.equal(slot.status, "UNMEASURED", slot.axis);
    assert.equal(slot.n, 0, slot.axis);
  }
  for (const slot of measuredSubjects) {
    assert.equal(slot.status, "MEASURED", slot.axis);
    assert.ok(slot.n >= 30, `${slot.axis} is measured, so its n must be at least 30`);
  }

  // Every subject axis keeps its own grammar — checked over the slots themselves,
  // so the invariant holds for slots this file never names.
  for (const slot of subjects) {
    if (slot.kind === "declared-slot") {
      assert.equal(slot.status, "UNMEASURED", `${slot.axis} is a declared subject slot`);
      assert.equal(slot.n, 0, `${slot.axis} carries no measurement`);
    } else {
      assert.equal(slot.status, "MEASURED", `${slot.axis} carries a run, so it is measured`);
      assert.ok(slot.n >= 30, `${slot.axis} is measured, so its n must be at least 30`);
    }
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

test("the promoted axis's time and digest are read back out of the wave's own bytes", async () => {
  // The axis row carries facts_as_of and bank_sha256. Both must equal what the wave file
  // actually says, or a reader who re-reads the bank finds a different date or a different
  // digest than the board published.
  const { createHash } = await import("node:crypto");
  const { readFileSync } = await import("node:fs");
  const slots = await loadSlots();
  const slot = slots.find((candidate) => candidate.axis === "claim-maintenance");
  assert.ok(slot);
  const wavePath = new URL("../public/interop/claim-maintenance-wave-2026-10-28.json", import.meta.url);
  const bytes = readFileSync(wavePath);
  const wave = JSON.parse(bytes.toString("utf8"));
  assert.equal(slot.facts_as_of, wave.observed_at, "the axis time must be the wave's observed_at");
  assert.equal(
    slot.bank_sha256,
    createHash("sha256").update(bytes).digest("hex"),
    "the axis digest must be the sha256 of the wave's bytes",
  );
  assert.equal(slot.n, wave.thresholds.n_valid, "the axis n must be the wave's n_valid");
  assert.deepEqual(slot.per_outcome, {
    UNCHANGED: wave.counts.UNCHANGED,
    CHANGED: wave.counts.CHANGED,
    WITHDRAWN: wave.counts.WITHDRAWN,
    UNREACHABLE: wave.counts.UNREACHABLE,
  });
});
