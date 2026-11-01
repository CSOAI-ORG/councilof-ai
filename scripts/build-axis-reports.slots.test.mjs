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
    assert.equal(slot.status, "UNMEASURED");
    assert.equal(slot.n, 0);
  }

  // Every subject slot is a DECLARED position with no run behind it — checked over
  // the slots themselves, so the invariant holds for slots this file never names.
  for (const slot of subjects) {
    assert.equal(slot.status, "UNMEASURED", `${slot.axis} is a declared subject slot`);
    assert.equal(slot.n, 0, `${slot.axis} carries no measurement`);
  }
});
