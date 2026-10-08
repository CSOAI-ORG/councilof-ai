import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { ledgerCanonical, verifyOutcomes, scheduledReadState } from "./maintenance-schedule-state.mjs";

const sha = (s) => createHash("sha256").update(s).digest("hex");
const registry = { id: "r", url: "https://councilof.ai/claims/r.json", sha256: "a".repeat(64) };
const now = "2026-10-08T12:00:00Z", next = "2026-09-28T09:20:00Z";
function fixture(overrides = {}, prior = []) {
  const row = {
    schema: "csoai.claim-maintenance-check/0.1", seq: prior.length,
    prev_hash: prior.at(-1)?.row_sha256 ?? "0".repeat(64),
    registry_id: registry.id, registry_url: registry.url, registry_sha256: registry.sha256,
    check: "scheduled-read", due: "2026-09-28", checked_at: "2026-09-29T16:55:06Z",
    outcome: "CHANGED_CONFIRMED", claim_ids_read: ["A"], claims_fetch_failed: [], claims_unconfirmed: [],
    ...overrides,
  };
  row.row_sha256 = sha(ledgerCanonical(row));
  const rows = [...prior, row], raw = Buffer.from(rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  const revision = "b".repeat(40);
  const capture = {
    schema: "csoai.claim-maintenance-public-capture/0.1", file: "outcomes.jsonl", source_revision: revision,
    source_url: `https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/${revision}/public/interop/claim-maintenance/outcomes.jsonl`,
    captured_at: now, bytes_sha256: sha(raw), entries: rows.length, outcomes_head_sha256: row.row_sha256,
  };
  return { raw, capture, ...verifyOutcomes(raw, capture) };
}
function state(ledger, overrides = {}) {
  return scheduledReadState({ next, asOf: now, registry, claimIds: ["A"], ledger, ...overrides });
}

test("exact completed check replaces a false not-run claim and carries its original proof time", () => {
  const f = fixture(), projected = state(f);
  assert.equal(projected.state, "COMPLETED");
  assert.equal(projected.evidence.checked_at, f.rows[0].checked_at);
  assert.equal(projected.evidence.row_sha256, f.rows[0].row_sha256);
  assert.equal(projected.evidence.outcome, "CHANGED_CONFIRMED");
  assert.match(projected.evidence.boundary, /Unsigned/);
});
test("missing execution evidence remains unverified, not a claim that no read ran", () => {
  assert.equal(state({ rows: [], capture: null }).state, "DUE_EXECUTION_UNVERIFIED");
});
test("a digest from another registry version or a read missing a subject claim cannot complete", () => {
  assert.equal(state(fixture({ registry_sha256: "c".repeat(64) })).state, "DUE_EXECUTION_UNVERIFIED");
  assert.equal(state(fixture({ claim_ids_read: ["B"] })).state, "DUE_EXECUTION_UNVERIFIED");
});
test("a read before the exact signed due time or in the future cannot complete", () => {
  assert.equal(state(fixture({ checked_at: "2026-09-28T09:19:59Z" })).state, "DUE_EXECUTION_UNVERIFIED");
  assert.equal(state(fixture({ checked_at: "2026-10-08T12:00:01Z" })).state, "DUE_EXECUTION_UNVERIFIED");
});
test("confirmed change with a failed or unconfirmed sibling preserves retry work and original outcome", () => {
  for (const partial of [{ claims_fetch_failed: ["B"] }, { claims_unconfirmed: ["B"] }]) {
    const projected = state(fixture(partial));
    assert.equal(projected.state, "RETRY_REQUIRED");
    assert.equal(projected.evidence.outcome, "CHANGED_CONFIRMED");
  }
});
test("a later complete retry supersedes only the projection, while the old chain row remains", () => {
  const first = fixture({ claims_fetch_failed: ["B"] });
  const nextRun = fixture({ checked_at: "2026-10-01T01:00:00Z", outcome: "UNCHANGED" }, first.rows);
  assert.equal(nextRun.rows.length, 2);
  assert.equal(nextRun.rows[0].row_sha256, first.rows[0].row_sha256);
  assert.equal(state(nextRun).state, "COMPLETED");
});
test("unknown outcome is rejected even when its hash is internally consistent", () => {
  assert.throws(() => fixture({ outcome: "SAFE" }), /schema/);
});
test("changed bytes or reordered chain are rejected, including when only the capture byte pin is updated", () => {
  const first = fixture(), f = fixture({ checked_at: "2026-10-01T01:00:00Z" }, first.rows);
  const changed = Buffer.from(f.raw.toString().replace("CHANGED_CONFIRMED", "UNCHANGED"));
  assert.throws(() => verifyOutcomes(changed, f.capture), /pin mismatch/);
  assert.throws(() => verifyOutcomes(changed, { ...f.capture, bytes_sha256: sha(changed) }), /chain/);
  const reordered = Buffer.from([...f.rows].reverse().map((r) => JSON.stringify(r)).join("\n"));
  assert.throws(() => verifyOutcomes(reordered, { ...f.capture, bytes_sha256: sha(reordered) }), /chain/);
});
test("a floating source URL and wrong capture head are rejected", () => {
  const f = fixture();
  assert.throws(() => verifyOutcomes(f.raw, { ...f.capture, source_url: f.capture.source_url.replace(/b{40}/, "main") }), /source pin/);
  assert.throws(() => verifyOutcomes(f.raw, { ...f.capture, outcomes_head_sha256: "0".repeat(64) }), /head/);
});
test("scheduled and unscheduled dates remain unchanged", () => {
  const f = fixture();
  assert.equal(state(f, { next: null }).state, "UNSCHEDULED");
  assert.equal(state(f, { next: "2026-10-09T00:00:00Z" }).state, "SCHEDULED");
});
test("entry point generates and checks a pinned local projection without a network request", () => {
  const dir = mkdtempSync(join(tmpdir(), "claim-register-checks-"));
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    mkdirSync(join(dir, "scripts/claims"), { recursive: true });
    copyFileSync(join(here, "../claim-maintenance-register.mjs"), join(dir, "scripts/claim-maintenance-register.mjs"));
    copyFileSync(join(here, "maintenance-schedule-state.mjs"), join(dir, "scripts/claims/maintenance-schedule-state.mjs"));
    for (const p of ["public/claims", "public/spec/claim-maintenance", "public/interop/claim-maintenance"]) mkdirSync(join(dir, p), { recursive: true });
    const registryDoc = { schema: "csoai.claim-registry/0.3", registry_id: "r", created_utc: "2026-09-23T00:00:00Z", claims: [{
      schema: "csoai.claim-maintenance.artifact/0.2", claim_id: "A", state: "UNMEASURED", subject: { name: "Fixture", identifier: "fixture" },
      next_read_utc: next, first_captured_utc: "2026-09-23T00:00:00Z",
    }] };
    const registryBytes = JSON.stringify(registryDoc) + "\n";
    writeFileSync(join(dir, "public/claims/r.json"), registryBytes);
    const f = fixture({ registry_sha256: sha(registryBytes) });
    writeFileSync(join(dir, "public/interop/claim-maintenance/outcomes.jsonl"), f.raw);
    writeFileSync(join(dir, "public/interop/claim-maintenance/capture.json"), JSON.stringify(f.capture));
    const run = (args) => spawnSync(process.execPath, [join(dir, "scripts/claim-maintenance-register.mjs"), ...args], { cwd: dir, encoding: "utf8" });
    const generated = run([]); assert.equal(generated.status, 0, generated.stderr);
    const doc = JSON.parse(readFileSync(join(dir, "public/spec/claim-maintenance/register.json"), "utf8"));
    assert.equal(doc.subjects[0].next_scheduled_read_state, "COMPLETED");
    assert.equal(doc.subjects[0].next_scheduled_read, next);
    assert.equal(doc.totals.by_state.UNMEASURED, 1);
    assert.equal(Object.keys(doc.states).length, 4);
    const checked = run(["--check"]); assert.equal(checked.status, 0, checked.stderr);
    const invalid = run(["--checks-dir"]); assert.notEqual(invalid.status, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("presence-bearing v0.2 rows can follow historical rows, while an unknown schema is rejected", () => {
  const first = fixture();
  const newer = fixture({ schema: "csoai.claim-maintenance-check/0.2", checked_at: "2026-10-01T01:00:00Z" }, first.rows);
  assert.equal(newer.rows.length, 2);
  assert.equal(newer.rows[0].row_sha256, first.rows[0].row_sha256);
  assert.equal(state(newer).state, "COMPLETED");
  assert.throws(() => fixture({ schema: "csoai.claim-maintenance-check/99" }), /schema/);
});
