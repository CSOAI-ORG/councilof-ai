/**
 * verify.test.mjs — prove the verifier can FAIL.
 *
 * A verifier that has only ever been shown succeeding is not evidence of anything: it is
 * indistinguishable from `return "VALID"`. Every negative path below is therefore asserted
 * on its exact state AND its exact code, and the two most dangerous cases have a companion
 * assertion showing what a weaker verifier would have done instead:
 *
 *   - the foreign-key card verifies perfectly under the key it ships with, so a verifier
 *     that skips key pinning reports it VALID;
 *   - the id-recomputed card satisfies id == sha256(body), so a verifier that stops at the
 *     hash reports it VALID.
 *
 * Zero dependencies. Run: node --test test/
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, createPublicKey, verify as edVerify } from "node:crypto";
import { verifyCard, analyseSet } from "../src/verify.mjs";
import { canonicalise, OutOfProfileDomain } from "../src/canonical.mjs";
import { defaultProfile, pubkeyFromDidDocument } from "../src/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (n) => JSON.parse(readFileSync(join(here, "fixtures", n), "utf8"));
const profile = defaultProfile();
const CLI = join(here, "..", "bin", "gspc-verify.mjs");

// ---------------------------------------------------------------- the positive control
test("a genuine card is VALID", async () => {
  const r = await verifyCard(fx("01-genuine.json"), profile);
  assert.equal(r.state, "VALID");
  assert.equal(r.code, "OK");
});

// ---------------------------------------------------------------- it must be able to fail
test("tampered body -> INVALID / ID_MISMATCH", async () => {
  const r = await verifyCard(fx("02-tampered-body.json"), profile);
  assert.equal(r.state, "INVALID");
  assert.equal(r.code, "ID_MISMATCH");
});

test("tampered body with the id recomputed -> INVALID / SIGNATURE_MISMATCH", async () => {
  const card = fx("03-tampered-id-recomputed.json");
  // A weaker verifier stops here and calls it good: the hash genuinely matches the body.
  const digest = createHash("sha256").update(canonicalise(card.body, profile)).digest("hex");
  assert.equal(digest, card.id, "fixture precondition: the id really does match the body");

  const r = await verifyCard(card, profile);
  assert.equal(r.state, "INVALID");
  assert.equal(r.code, "SIGNATURE_MISMATCH");
});

test("card signed by a foreign key -> INVALID / PUBKEY_NOT_PINNED", async () => {
  const card = fx("04-foreign-key.json");
  // Precondition: this card is entirely self-consistent. Its signature verifies under the
  // key it carries. Only pinning distinguishes it from a genuine card.
  const pre = Buffer.from(canonicalise(card.body, profile), "utf8");
  assert.equal(createHash("sha256").update(pre).digest("hex"), card.id);
  const jwkKey = createPublicKey({
    key: { kty: "OKP", crv: "Ed25519", x: Buffer.from(card.pubkey, "hex").toString("base64url") },
    format: "jwk",
  });
  assert.equal(
    edVerify(null, pre, jwkKey, Buffer.from(card.signature, "hex")),
    true,
    "fixture precondition: an unpinned verifier would call this VALID",
  );
  assert.notEqual(card.pubkey, profile.pinnedPubkeyHex);

  const r = await verifyCard(card, profile);
  assert.equal(r.state, "INVALID");
  assert.equal(r.code, "PUBKEY_NOT_PINNED");
});

test("malformed card -> UNCHECKABLE / MALFORMED_CARD", async () => {
  const r = await verifyCard(fx("05-malformed.json"), profile);
  assert.equal(r.state, "UNCHECKABLE");
  assert.equal(r.code, "MALFORMED_CARD");
});

test("a non-card -> UNCHECKABLE / NOT_A_CARD", async () => {
  const r = await verifyCard(fx("06-not-a-card.json"), profile);
  assert.equal(r.state, "UNCHECKABLE");
  assert.equal(r.code, "NOT_A_CARD");
});

test("non-objects are UNCHECKABLE, not INVALID", async () => {
  for (const junk of [null, 42, "a string", [], true]) {
    const r = await verifyCard(junk, profile);
    assert.equal(r.state, "UNCHECKABLE", `for ${JSON.stringify(junk)}`);
    assert.equal(r.code, "NOT_A_CARD");
  }
});

// ---------------------------------------------------------------- out of profile domain
test("an integral number in an unclassified field -> UNCHECKABLE / OUT_OF_PROFILE_DOMAIN", async () => {
  const r = await verifyCard(fx("07-out-of-domain-number.json"), profile);
  assert.equal(r.state, "UNCHECKABLE");
  assert.equal(r.code, "OUT_OF_PROFILE_DOMAIN");
  assert.match(r.reason, /cannot tell 0 from 0\.0/);
});

test("an undeclared preimage rule -> UNCHECKABLE / OUT_OF_PROFILE_DOMAIN, and it stops there", async () => {
  const r = await verifyCard(fx("08-out-of-domain-preimage-rule.json"), profile);
  assert.equal(r.state, "UNCHECKABLE");
  assert.equal(r.code, "OUT_OF_PROFILE_DOMAIN");
  // It must NOT have fallen through to a best-effort canonicalisation and produced a verdict.
  assert.notEqual(r.state, "VALID");
  assert.notEqual(r.state, "INVALID");
});

test("canonicalise refuses to guess rather than returning a best-effort string", () => {
  assert.throws(() => canonicalise({ trials: 3 }, profile), OutOfProfileDomain);
  assert.throws(() => canonicalise({ x: 1e-9 }, profile), OutOfProfileDomain);
  assert.throws(() => canonicalise({ n: Number.MAX_SAFE_INTEGER + 2 }, profile), OutOfProfileDomain);
});

test("a card of an unknown kind is UNCHECKABLE, never VALID", async () => {
  const card = fx("01-genuine.json");
  card.body = { ...card.body, kind: "some.other-card" };
  const r = await verifyCard(card, profile);
  assert.equal(r.state, "UNCHECKABLE");
  assert.equal(r.code, "OUT_OF_PROFILE_DOMAIN");
});

test("with no pinned key the answer is UNCHECKABLE, not VALID", async () => {
  const r = await verifyCard(fx("01-genuine.json"), { ...profile, pinnedPubkeyHex: undefined });
  assert.equal(r.state, "UNCHECKABLE");
  assert.equal(r.code, "NO_PINNED_KEY");
});

// ---------------------------------------------------------------- canonicalisation
test("integral floats render as CPython renders them, and integers as integers", () => {
  assert.equal(canonicalise({ accuracy: 0.0, ci_low: 1.0, n: 3 }, profile), '{"accuracy":0.0,"ci_low":1.0,"n":3}');
  assert.equal(canonicalise({ accuracy: 0.9667 }, profile), '{"accuracy":0.9667}');
});

test("string escaping matches CPython json.dumps(ensure_ascii=True)", () => {
  // Right-hand sides produced by CPython and pasted verbatim.
  const cases = [
    ["plain", '{"s":"plain"}'],
    ['quote" and \\ back', '{"s":"quote\\" and \\\\ back"}'],
    ["tab\there\nnl\rcr", '{"s":"tab\\there\\nnl\\rcr"}'],
    ["bell\x07 bs\b ff\f del\x7f", '{"s":"bell\\u0007 bs\\b ff\\f del\\u007f"}'],
    ["café ünïcode", '{"s":"caf\\u00e9 \\u00fcn\\u00efcode"}'],
    ["astral \u{1D11E} and emoji \u{1F30D}", '{"s":"astral \\ud834\\udd1e and emoji \\ud83c\\udf0d"}'],
  ];
  // Pin the mode explicitly. This test asserted ensure_ascii=True output while inheriting
  // whatever the default profile happened to declare — so changing the profile silently
  // changed what the test was testing.
  const asciiProfile = { ...profile, ensureAscii: true };
  for (const [input, expected] of cases) assert.equal(canonicalise({ s: input }, asciiProfile), expected);
});

test("string escaping matches CPython json.dumps(ensure_ascii=False) — what the signer uses", () => {
  // scripts/sign_financial_runs.py canonicalises with ensure_ascii=False, so this is the
  // mode every published card was actually signed under. Right-hand sides produced by
  // CPython and pasted verbatim. Note DEL (0x7f) is emitted RAW here and escaped above:
  // that one byte is the difference between a valid card and a false INVALID verdict.
  const utf8Profile = { ...profile, ensureAscii: false };
  const cases = [
    ["plain", '{"s":"plain"}'],
    ['quote" and \\ back', '{"s":"quote\\" and \\\\ back"}'],
    ["tab\there\nnl\rcr", '{"s":"tab\\there\\nnl\\rcr"}'],
    ["bell\x07 bs\b ff\f del\x7f", '{"s":"bell\\u0007 bs\\b ff\\f del\x7f"}'],
    ["caf\u00e9 \u00fcn\u00efcode", '{"s":"caf\u00e9 \u00fcn\u00efcode"}'],
    ["em\u2014dash", '{"s":"em\u2014dash"}'],
    ["astral \u{1D11E} and emoji \u{1F30D}", '{"s":"astral \u{1D11E} and emoji \u{1F30D}"}'],
  ];
  for (const [input, expected] of cases) assert.equal(canonicalise({ s: input }, utf8Profile), expected);
});

test("keys are sorted, not left in insertion order", () => {
  assert.equal(canonicalise({ z: 1n === 1n ? "z" : "", a: "a" }, profile), '{"a":"a","z":"z"}');
});

// ---------------------------------------------------------------- set-level completeness
test("a dangling prev is reported as CHAIN_INCOMPLETE, separately from card validity", () => {
  const set = analyseSet(
    [
      { id: "a".repeat(64), body: { prev: "GSPC-CARD-FACTORY-GENESIS" } },
      { id: "b".repeat(64), body: { prev: "a".repeat(64) } },
      { id: "c".repeat(64), body: { prev: "f".repeat(64) } },
    ],
    null,
    profile,
  );
  assert.equal(set.chainComplete, false);
  assert.equal(set.danglingPrev.length, 1);
  assert.ok(set.findings.some((f) => f.code === "CHAIN_INCOMPLETE"));
});

test("a chain that reaches its declared genesis is complete", () => {
  const set = analyseSet(
    [
      { id: "a".repeat(64), body: { prev: "GSPC-CARD-FACTORY-GENESIS" } },
      { id: "b".repeat(64), body: { prev: "a".repeat(64) } },
    ],
    null,
    profile,
  );
  assert.equal(set.chainComplete, true);
  assert.deepEqual(set.tips, ["b".repeat(64)]);
});

test("an index that lists a card nobody has is reported", () => {
  const set = analyseSet([], { cards: [{ card: "d".repeat(64) }], n_cards: 1, head: "d".repeat(64) }, profile);
  assert.ok(set.findings.some((f) => f.code === "INDEX_ENTRY_MISSING"));
  assert.ok(set.findings.some((f) => f.code === "INDEX_HEAD_MISSING"));
  assert.ok(set.findings.some((f) => f.code === "INDEX_UNSIGNED"));
});

// ---------------------------------------------------------------- offline key handling
test("the pinned key can be taken from a local DID document", () => {
  const x = Buffer.from(profile.pinnedPubkeyHex, "hex").toString("base64url");
  const doc = { verificationMethod: [{ id: "did:web:example#card-attestation-1", publicKeyJwk: { kty: "OKP", crv: "Ed25519", x } }] };
  assert.equal(pubkeyFromDidDocument(doc, "#card-attestation-1"), profile.pinnedPubkeyHex);
});

// ---------------------------------------------------------------- CLI exit codes
const runCli = (args) => {
  try {
    return { code: 0, out: execFileSync(process.execPath, [CLI, ...args], { encoding: "utf8" }) };
  } catch (e) {
    return { code: e.status, out: (e.stdout || "") + (e.stderr || "") };
  }
};

test("CLI exit 0 only on a fully valid, complete set", () => {
  const r = runCli([join(here, "fixtures", "01-genuine.json")]);
  assert.equal(r.code, 0);
  assert.match(r.out, /VALID 1 · INVALID 0 · UNCHECKABLE 0/);
});

test("CLI exit 1 when a card is INVALID", () => {
  assert.equal(runCli([join(here, "fixtures", "04-foreign-key.json")]).code, 1);
  assert.equal(runCli([join(here, "fixtures", "02-tampered-body.json")]).code, 1);
});

test("CLI exit 2 when a card is UNCHECKABLE — an incomplete path never exits 0", () => {
  // The expected CODE is asserted alongside the exit status. Exit 2 is also what a usage
  // error returns, so a status-only assertion would pass while the CLI read no files at
  // all — which is precisely how it passed once, wrongly, before this line existed.
  const expected = {
    "05-malformed.json": "MALFORMED_CARD",
    "06-not-a-card.json": "NOT_A_CARD",
    "07-out-of-domain-number.json": "OUT_OF_PROFILE_DOMAIN",
    "09-truncated.json": "UNREADABLE",
  };
  for (const [f, code] of Object.entries(expected)) {
    const r = runCli([join(here, "fixtures", f)]);
    assert.equal(r.code, 2, `exit code for ${f}`);
    assert.match(r.out, new RegExp(code), `reported code for ${f}`);
    assert.match(r.out, /UNCHECKABLE 1/, `tally for ${f}`);
  }
});

test("CLI exit 3 when every card is valid but the set is incomplete", () => {
  const r = runCli([join(here, "fixtures", "01-genuine.json"), "--index", join(here, "fixtures", "index-incomplete.json")]);
  assert.equal(r.code, 3);
  assert.match(r.out, /INCOMPLETE/);
});

test("CLI reports the pinned key it actually used", () => {
  const r = runCli([join(here, "fixtures", "01-genuine.json")]);
  assert.match(r.out, new RegExp(profile.pinnedPubkeyHex));
});

// ---------------------------------------------------------------------------
// DID-keyed cards. Every card published on councilof.ai names its key by `did`
// and carries no inline `pubkey`. Requiring one made the verifier report
// UNCHECKABLE MALFORMED_CARD on 102 of 102 genuine cards — a verifier that
// calls the entire published corpus unverifiable is worse than no verifier.
// These fixtures are a real published card, fetched from the live site.
// ---------------------------------------------------------------------------

const didCard = JSON.parse(readFileSync(new URL("./fixtures/07-did-keyed.json", import.meta.url), "utf8"));
const didProfile = JSON.parse(readFileSync(new URL("../profile/csoai-gspc-1.json", import.meta.url), "utf8"));

test("a DID-keyed card verifies when the profile pins that key id", async () => {
  const r = await verifyCard(didCard, didProfile);
  assert.equal(r.state, "VALID", `${r.code}: ${r.reason ?? ""}`);
});

test("a DID-keyed card whose key id is NOT pinned is UNCHECKABLE, never VALID", async () => {
  const r = await verifyCard({ ...didCard, did: "did:web:evil.example#k1" }, didProfile);
  assert.equal(r.state, "UNCHECKABLE");
  assert.equal(r.code, "KEY_NOT_PINNED");
});

test("a DID-keyed card with an edited body is INVALID, not UNCHECKABLE", async () => {
  const r = await verifyCard({ ...didCard, body: { ...didCard.body, accuracy: 0.99 } }, didProfile);
  assert.equal(r.state, "INVALID");
  assert.equal(r.code, "ID_MISMATCH");
});

test("a card naming no key at all is MALFORMED_CARD", async () => {
  const { did: _drop, ...noKey } = didCard;
  const r = await verifyCard(noKey, didProfile);
  assert.equal(r.state, "UNCHECKABLE");
  assert.equal(r.code, "MALFORMED_CARD");
});

test("the number policy follows the card's declared rule, not the profile as a whole", async () => {
  // Two card generations are in the wild. A whole accuracy is `0.0` under the legacy
  // CPython-literal rule and `0` under the mill's rule. One global policy verifies one
  // generation and calls the other a forgery — this is the regression that reported
  // ID_MISMATCH on 14 genuine published cards.
  const legacy = JSON.parse(readFileSync(new URL("./fixtures/01-genuine.json", import.meta.url), "utf8"));
  // Must be a card whose accuracy is INTEGRAL: 0.8333 renders identically under both
  // policies, so a fixture like that cannot tell the two apart and the test would pass
  // whether or not the dispatch existed.
  const mill = JSON.parse(readFileSync(new URL("./fixtures/08-mill-integral-accuracy.json", import.meta.url), "utf8"));
  const prof = JSON.parse(readFileSync(new URL("../profile/csoai-gspc-1.json", import.meta.url), "utf8"));

  assert.equal((await verifyCard(legacy, prof)).state, "VALID", "legacy generation must verify");
  assert.equal((await verifyCard(mill, prof)).state, "VALID", "mill generation must verify");

  // And the dispatch must be doing the work: strip the per-rule policy and the mill card
  // must stop verifying rather than quietly passing under the legacy policy.
  const { ruleProfiles: _drop, ...noDispatch } = prof;
  assert.notEqual((await verifyCard(mill, noDispatch)).state, "VALID",
    "without per-rule dispatch the mill card must NOT read VALID — the test would be vacuous");
});
