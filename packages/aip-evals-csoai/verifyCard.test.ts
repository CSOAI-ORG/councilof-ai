// SPDX-License-Identifier: Apache-2.0
// node --experimental-strip-types --test verifyCard.test.ts   (Node >= 22.6)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { verifyCard, sha256, sha512, ed25519Verify } from "./verifyCard.ts";

const fx = (f: string) => readFileSync(new URL("./fixtures/" + f, import.meta.url), "utf8");
const hex = (b: Uint8Array) => Buffer.from(b).toString("hex");
const signed = fx("FREEZE.signed.json");
const record = fx("FREEZE.json");
const did = JSON.parse(fx("did.json"));
const KID = "did:web:csoai.org#board-attestation-1";
const keys = { [KID]: did.verificationMethod.find((m: { id: string }) => m.id.endsWith("#board-attestation-1")).publicKeyJwk.x };

test("sha256 / sha512 known answers (FIPS 180-4 'abc')", () => {
  assert.equal(hex(sha256(new TextEncoder().encode("abc"))), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(hex(sha512(new TextEncoder().encode("abc"))).slice(0, 32), "ddaf35a193617abacc417349ae204131");
});

test("Ed25519 RFC 8032 test 1 (empty message) verifies; one flipped bit does not", () => {
  const pub = Buffer.from("d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a", "hex");
  const sig = Buffer.from("e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b", "hex");
  assert.equal(ed25519Verify(pub, new Uint8Array(0), sig), true);
  const bad = Buffer.from(sig); bad[0] ^= 1;
  assert.equal(ed25519Verify(pub, new Uint8Array(0), bad), false);
});

test("the real board-signed record is VALID", () => {
  const r = verifyCard({ signed, recordText: record, keys });
  assert.equal(r.state, "VALID", r.debug);
  assert.equal(r.verified, true);
});

test("a one-byte tamper of the record is INVALID", () => {
  const t = record.slice(0, 10) + (record[10] === "a" ? "b" : "a") + record.slice(11);
  assert.equal(verifyCard({ signed, recordText: t, keys }).state, "INVALID");
});

test("a one-nibble change of the signature is INVALID", () => {
  const s = JSON.parse(signed); const h: string = s.signature.sig_ed25519;
  s.signature.sig_ed25519 = (h[0] === "0" ? "1" : "0") + h.slice(1);
  assert.equal(verifyCard({ signed: s, recordText: record, keys }).state, "INVALID");
});

test("an unknown key id is UNVERIFIABLE_KEY, never VALID", () => {
  const r = verifyCard({ signed, recordText: record, keys: { "did:web:example.invalid#k": keys[KID] } });
  assert.equal(r.state, "UNVERIFIABLE_KEY");
  assert.equal(r.verified, false);
});
