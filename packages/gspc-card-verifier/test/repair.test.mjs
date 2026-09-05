import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { adviseOn, adviseOnFindings, FIXABLE_BY } from "../src/repair.mjs";
import { verifyCard, defaultProfile } from "../src/index.mjs";

test("a tampered card is NOT the holder's to fix, and says so", async () => {
  const card = JSON.parse(readFileSync("test/fixtures/02-tampered-body.json", "utf8"));
  const v = await verifyCard(card.card ?? card, defaultProfile());
  const a = adviseOn(v);
  assert.equal(v.state, "INVALID");
  assert.equal(a.fixableBy, FIXABLE_BY.NOT_YOURS);
  assert.equal(a.editingIsWrong, true);
  assert.match(a.next.join(" "), /do NOT edit|Do not edit/i);
});

test("advice never mutates the verdict it was given", async () => {
  const v = { state: "INVALID", code: "ID_MISMATCH", reason: "x" };
  const frozen = JSON.stringify(v);
  adviseOn(v);
  assert.equal(JSON.stringify(v), frozen);
});

test("an unmapped code is reported as unmapped, never dressed up as understood", () => {
  const a = adviseOn({ state: "INVALID", code: "SOME_FUTURE_CODE" });
  assert.equal(a.known, false);
  assert.match(a.says, /No repair guidance is published/);
  assert.match(a.next.join(" "), /Guessing at a fix is worse/);
});

test("UNCHECKABLE advice insists it is not a failure", () => {
  const a = adviseOn({ state: "UNCHECKABLE", code: "KEY_NOT_PINNED" });
  assert.equal(a.fixableBy, FIXABLE_BY.SELF);
  assert.match(a.next.join(" "), /UNCHECKABLE, not INVALID|learned nothing/i);
});

test("every code the verifier can emit has guidance — or is honestly unmapped", () => {
  const src = readFileSync("src/verify.mjs", "utf8");
  const codes = new Set([...src.matchAll(/(?:invalid|uncheckable)\("([A-Z_]+)"/g)].map((m) => m[1]));
  assert.ok(codes.size >= 8, `expected the real code set, found ${codes.size}`);
  const unmapped = [...codes].filter((c) => !adviseOn({ state: "INVALID", code: c }).known);
  assert.deepEqual(unmapped, [], `card-level codes without guidance: ${unmapped.join(", ")}`);
});

test("a valid card is told the one thing a valid signature does not establish", () => {
  const a = adviseOn({ state: "VALID", code: "OK" });
  assert.equal(a.fixableBy, FIXABLE_BY.INFORMATIONAL);
  assert.match(a.next.join(" "), /revocation/i);
});

test("findings roll up by who must act", () => {
  const r = adviseOnFindings([
    { code: "CHAIN_FORKED", detail: "2 tips" },
    { code: "CHAIN_INCOMPLETE", detail: "missing prev" },
    { code: "WHO_KNOWS", detail: "?" },
  ]);
  assert.equal(r.total, 3);
  assert.equal(r.unmapped, 1);
  assert.equal(r.byOwner[FIXABLE_BY.ISSUER], 1);
  assert.ok(r.byOwner[FIXABLE_BY.SELF] >= 1);
});
