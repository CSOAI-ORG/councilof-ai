import fs from "node:fs";
import assert from "node:assert/strict";

const url = new URL("./rulings/GSPC-PONTIUS-CONSTITUTIONAL-BOUNDARY-CANDIDATE-2026-10-01.json", import.meta.url);
const c = JSON.parse(fs.readFileSync(url, "utf8"));

assert.equal(c.status, "CANDIDATE_NOT_EFFECTIVE");
assert.equal(c.gspc.role, "constitutional_measurement_evidence_interoperability_ecosystem");
assert.equal(c.pontius.parent, "GSPC");
assert.deepEqual(c.pontius.governed_by, ["GSPC", "Layer O"]);

for (const [name, value] of Object.entries(c.pontius_authority)) {
  assert.equal(value, false, `Pontius must not self-grant ${name}`);
}
for (const ref of Object.values(c.external_reference_patterns)) {
  assert.equal(ref.authority_over_csoai, false);
}
for (const required of [
  "GSPC_CONTAINS_INTEROPERABILITY_GOVERNANCE",
  "PONTIUS_IS_SUBORDINATE_TO_GSPC_AND_LAYER_O",
  "TRANSPORT_NEVER_GRANTS_MEASUREMENT_OR_ADMISSION",
  "EXTERNAL_ECOSYSTEM_STATUS_NEVER_GRANTS_CSOAI_AUTHORITY",
]) assert.ok(c.invariants.includes(required), `missing invariant ${required}`);

assert.equal(c.owner_gate.effective, false);
assert.equal(c.owner_gate.requires_explicit_owner_authorization, true);
console.log("PASS GSPC/Pontius constitutional boundary");
