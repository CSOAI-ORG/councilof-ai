// npx vitest run scripts/harness-x/sign-oasf.test.mjs — the OASF attestation verifier is not vacuous.
import { test } from "vitest";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateKeyPairSync, sign } from "node:crypto";
import { buildAttestation, verifyAttestation, RECORDS, OUT } from "./sign-oasf.mjs";
import { attestationPreimage } from "../rulings/ruling-lib.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function fixtureRepo() {
  const d = mkdtempSync(join(tmpdir(), "oasf-att-"));
  for (const p of [...RECORDS, "council-os/distribution.json"]) {
    mkdirSync(dirname(join(d, p)), { recursive: true });
    copyFileSync(join(REPO, p), join(d, p));
  }
  return d;
}
function keypair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const hex = publicKey.export({ format: "der", type: "spki" }).subarray(12).toString("hex");
  return { hex, privateKey };
}
function signInto(d, privateKey) {
  const att = buildAttestation("2026-09-30T17:00:00Z", d);
  const pre = attestationPreimage(att);
  writeFileSync(join(d, OUT), JSON.stringify({ payload: att, sig_ed25519: sign(null, Buffer.from(pre), privateKey).toString("hex") }));
}

test("UNSIGNED when there is no attestation", () => {
  assert.equal(verifyAttestation(fixtureRepo()).state, "UNSIGNED");
});

test("VALID for a fresh signature, STALE after the record changes, INVALID under another key", () => {
  const d = fixtureRepo();
  const k = keypair();
  signInto(d, k.privateKey);
  assert.equal(verifyAttestation(d, k.hex).state, "VALID");
  assert.equal(verifyAttestation(d, keypair().hex).state, "INVALID");
  const p = join(d, RECORDS[0]);
  const rec = JSON.parse(readFileSync(p, "utf8"));
  rec.description += " (edited)";
  writeFileSync(p, JSON.stringify(rec, null, 2) + "\n");
  assert.equal(verifyAttestation(d, k.hex).state, "STALE");
});

test("the attestation fits the signer cap and carries no record body", () => {
  const att = buildAttestation("2026-09-30T17:00:00Z");
  assert.ok(attestationPreimage(att).length <= 3072);
  assert.equal(att.records.length, RECORDS.length);
  assert.ok(att.records.every((r) => /^[0-9a-f]{64}$/.test(r.record_sha256)));
});
