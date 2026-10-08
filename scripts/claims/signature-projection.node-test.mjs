import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const sha = (raw) => createHash("sha256").update(raw).digest("hex");
function generate(inline = {}, sidecar = undefined) {
  const dir = mkdtempSync(join(tmpdir(), "claim-signature-projection-"));
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    for (const p of ["scripts/claims", "public/claims", "public/spec/claim-maintenance"])
      mkdirSync(join(dir, p), { recursive: true });
    for (const [source, target] of [
      [join(here, "../claim-maintenance-register.mjs"), "scripts/claim-maintenance-register.mjs"],
      [join(here, "maintenance-schedule-state.mjs"), "scripts/claims/maintenance-schedule-state.mjs"],
    ]) copyFileSync(source, join(dir, target));
    const registry = {
      schema: "csoai.claim-registry/0.3", registry_id: "r",
      created_utc: "2026-09-23T00:00:00Z",
      signature_state: "SIGNED BY SIDECAR — fixture source wording, not verifier evidence",
      ...inline,
      claims: [{
        schema: "csoai.claim-maintenance.artifact/0.2", claim_id: "A", state: "UNMEASURED",
        subject: { name: "Fixture", identifier: "fixture" },
      }],
    };
    const raw = JSON.stringify(registry) + "\n";
    writeFileSync(join(dir, "public/claims/r.json"), raw);
    if (sidecar !== undefined) {
      const value = typeof sidecar === "function" ? sidecar(sha(raw)) : sidecar;
      writeFileSync(join(dir, "public/claims/r.signed.json"), typeof value === "string" ? value : JSON.stringify(value));
    }
    const run = spawnSync(process.execPath, [join(dir, "scripts/claim-maintenance-register.mjs")], { cwd: dir, encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    const doc = JSON.parse(readFileSync(join(dir, "public/spec/claim-maintenance/register.json"), "utf8"));
    const projected = doc.registries.find((r) => r.registry_id === "r");
    assert.equal(doc.signature_projection.verification, "UNCHECKABLE");
    assert.match(doc.signature_projection.compatibility_fields.signed, /never.*validity/i);
    assert.equal(projected.signature_verification, "UNCHECKABLE");
    assert.match(projected.signature_verification_note, /have not been verified here/);
    assert.equal(doc.totals.by_state.UNMEASURED, 1);
    assert.equal(Object.keys(doc.states).length, 4);
    return projected;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
const bound = (signature) => (digest) => ({
  schema: "csoai.signed-run/0.1", payload: { artifact: { sha256: digest } },
  ...(signature === undefined ? {} : { signature }),
});

test("invalid inline material remains uncheckable while the legacy presence flag is preserved", () => {
  const r = generate({ signature: "not-a-signature" });
  assert.equal(r.signed, true);
  assert.equal(r.signature_binding, "inline");
  assert.equal(r.signature_material_present, true);
  assert.equal(r.signature_binding_state, "INLINE_MATERIAL_UNVERIFIED");
});
test("digest-bound invalid sidecar is a byte match, never authenticated signature evidence", () => {
  const r = generate({}, bound({ algorithm: "Ed25519", value: "invalid" }));
  assert.equal(r.signed, true);
  assert.equal(r.sidecar_pin_verified, true);
  assert.equal(r.signature_material_present, true);
  assert.equal(r.signature_binding_state, "SIDECAR_SHA256_MATCH");
});
test("a digest match without signature material preserves compatibility without claiming material", () => {
  const r = generate({}, bound(undefined));
  assert.equal(r.signed, true);
  assert.equal(r.signature_material_present, false);
  assert.equal(r.signature_binding_state, "SIDECAR_SHA256_MATCH");
});
test("valid-looking unverified material cannot acquire a VALID verification verdict", () => {
  const r = generate({}, bound({ algorithm: "Ed25519", public_key: "A".repeat(43), sig: "A".repeat(86) }));
  assert.equal(r.signed, true);
  assert.equal(r.signature_verification, "UNCHECKABLE");
});
test("a sidecar pinning other bytes records mismatch without asserting signature invalidity", () => {
  const r = generate({}, { signature: "present", payload: { artifact: { sha256: "0".repeat(64) } } });
  assert.equal(r.signed, false);
  assert.equal(r.sidecar_pin_verified, false);
  assert.equal(r.signature_material_present, true);
  assert.equal(r.signature_binding_state, "SIDECAR_SHA256_MISMATCH");
});
test("unparseable sidecar leaves material presence unknown and verification uncheckable", () => {
  const r = generate({}, "{not-json");
  assert.equal(r.signed, false);
  assert.equal(r.signature_material_present, null);
  assert.equal(r.signature_binding_state, "SIDECAR_UNPARSEABLE");
});
test("source prose claiming signed does not override absent material", () => {
  const r = generate();
  assert.equal(r.signed, false);
  assert.equal(r.signature_material_present, false);
  assert.equal(r.signature_binding_state, "NO_MATERIAL");
  assert.match(r.signature_state_verbatim, /SIGNED BY SIDECAR/);
});
