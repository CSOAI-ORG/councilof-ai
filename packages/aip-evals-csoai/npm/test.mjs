// SPDX-License-Identifier: Apache-2.0
// node --test test.mjs [path-to-built-module]   -- tests the BUILT file (default dist/csoai-verify.mjs), not the TS source
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const target = process.env.CSOAI_VERIFY_MODULE || new URL("./dist/csoai-verify.mjs", import.meta.url).href;
const M = await import(target.startsWith("http") || target.startsWith("file:") ? target : pathToFileURL(target).href);
const fx = (f) => readFileSync(new URL("../fixtures/" + f, import.meta.url), "utf8");
const signed = fx("FREEZE.signed.json"), record = fx("FREEZE.json");
const keys = M.keysFromDid(JSON.parse(fx("did.json")));

test("keysFromDid takes the board key", () => assert.ok(keys["did:web:csoai.org#board-attestation-1"]));
test("real board-signed record: VALID", () => assert.equal(M.verifyCard({ signed, recordText: record, keys }).state, "VALID"));
test("one-byte record tamper: INVALID", () => {
  const t = record.slice(0, 10) + (record[10] === "a" ? "b" : "a") + record.slice(11);
  assert.equal(M.verifyCard({ signed, recordText: t, keys }).state, "INVALID");
});
test("one-nibble signature change: INVALID", () => {
  const s = JSON.parse(signed); const h = s.signature.sig_ed25519;
  s.signature.sig_ed25519 = (h[0] === "0" ? "1" : "0") + h.slice(1);
  assert.equal(M.verifyCard({ signed: s, recordText: record, keys }).state, "INVALID");
});
test("key not pinned: UNVERIFIABLE_KEY, never VALID", () => {
  const k = { ...keys }; delete k["did:web:csoai.org#board-attestation-1"];
  assert.equal(M.verifyCard({ signed, recordText: record, keys: k }).state, "UNVERIFIABLE_KEY");
});
