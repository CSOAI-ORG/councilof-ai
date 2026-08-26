/**
 * chain.test.mjs — a chain manifest is a claim, and this proves the tool can reject one.
 *
 * The interesting assertion in here is the last group. A manifest that lists withheld
 * positions is a genuine improvement on publishing a subset: a withheld card becomes a
 * counted tombstone instead of an absence indistinguishable from a card that never existed.
 * But the manifest is unsigned, so a withheld position is only anchored where a PUBLISHED
 * body's `prev` names it — and `prev` is inside the signed body. Everything else in a run of
 * consecutive withheld positions is an unsigned assertion. The tool must count those two
 * kinds separately, or "the chain is complete" would claim more than the evidence carries.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { analyseChain } from "../src/verify.mjs";
import { defaultProfile } from "../src/index.mjs";

const profile = defaultProfile();
const ID = (n) => String(n).padStart(64, "0");
const link = (n, prev, extra = {}) => ({
  id: ID(n), prev, alg: "Ed25519", pubkey: profile.pinnedPubkeyHex,
  sig: "s".repeat(128), body_published: true, ...extra,
});
const card = (n, prev) => ({ id: ID(n), pubkey: profile.pinnedPubkeyHex, signature: "s".repeat(128), body: { prev } });

// head=3 -> 2 -> 1 -> genesis
const goodLinks = [link(3, ID(2)), link(2, ID(1)), link(1, "GSPC-CARD-FACTORY-GENESIS")];
const manifest = (links, over = {}) => ({
  kind: "gspc.card-chain", head: links[0].id, genesis_prev: "GSPC-CARD-FACTORY-GENESIS",
  length: links.length, links, ...over,
});

test("a well-formed manifest walks from head to genesis", () => {
  const r = analyseChain([card(3, ID(2)), card(2, ID(1)), card(1, "GSPC-CARD-FACTORY-GENESIS")], manifest(goodLinks), profile);
  assert.equal(r.ok, true);
  assert.equal(r.walkLength, 3);
  assert.equal(r.reachesGenesis, true);
  assert.equal(r.bodiesHeld, 3);
  assert.equal(r.withheld.total, 0);
});

test("a walk that does not reach genesis is CHAIN_WALK_BROKEN", () => {
  const broken = [link(3, ID(2)), link(2, ID(9))];
  const r = analyseChain([], manifest(broken), profile);
  assert.equal(r.ok, false);
  assert.ok(r.findings.some((f) => f.code === "CHAIN_WALK_BROKEN"));
});

test("a cycle is CHAIN_WALK_BROKEN, not an infinite loop", () => {
  const cyc = [link(3, ID(2)), link(2, ID(3))];
  const r = analyseChain([], manifest(cyc), profile);
  assert.equal(r.ok, false);
  assert.match(r.findings.find((f) => f.code === "CHAIN_WALK_BROKEN").detail, /cycle/);
});

test("a link listed but unreachable from head is CHAIN_ORPHAN_LINK", () => {
  const r = analyseChain([], manifest([...goodLinks, link(7, ID(6))], { length: 4 }), profile);
  assert.ok(r.findings.some((f) => f.code === "CHAIN_ORPHAN_LINK"));
});

test("a declared length that disagrees with the listing is reported", () => {
  const r = analyseChain([], manifest(goodLinks, { length: 99 }), profile);
  assert.ok(r.findings.some((f) => f.code === "CHAIN_LENGTH_MISMATCH"));
});

test("a manifest signature that differs from the card file is reported", () => {
  const c = card(1, "GSPC-CARD-FACTORY-GENESIS");
  c.signature = "a".repeat(128);
  const r = analyseChain([c], manifest([link(1, "GSPC-CARD-FACTORY-GENESIS")]), profile);
  assert.ok(r.findings.some((f) => f.code === "CHAIN_SIG_DIFFERS"));
});

test("holding a card the manifest does not list is CARD_NOT_IN_CHAIN", () => {
  const r = analyseChain([card(8, ID(7))], manifest(goodLinks), profile);
  assert.ok(r.findings.some((f) => f.code === "CARD_NOT_IN_CHAIN"));
});

test("holding fewer bodies than declared is BODY_NOT_HELD, and does not accuse the publisher", () => {
  const r = analyseChain([card(1, "GSPC-CARD-FACTORY-GENESIS")], manifest(goodLinks), profile);
  const f = r.findings.find((x) => x.code === "BODY_NOT_HELD");
  assert.ok(f);
  assert.match(f.detail, /which is fine/);
});

// ---------------------------------------------------------------- the one that matters
test("withheld positions are split into attested and merely asserted", () => {
  //   head 5 -> 4(withheld) -> 3(withheld) -> 2 -> 1 -> genesis
  // Card 5's SIGNED body names 4, so position 4 is attested by a signature.
  // Nothing signed names 3: it exists only because an unsigned file says so.
  const links = [
    link(5, ID(4)),
    link(4, ID(3), { body_published: false, withheld_reason: "internal identifier in the signed body" }),
    link(3, ID(2), { body_published: false, withheld_reason: "internal identifier in the signed body" }),
    link(2, ID(1)),
    link(1, "GSPC-CARD-FACTORY-GENESIS"),
  ];
  const cards = [card(5, ID(4)), card(2, ID(1)), card(1, "GSPC-CARD-FACTORY-GENESIS")];
  const r = analyseChain(cards, manifest(links), profile);

  assert.equal(r.withheld.total, 2);
  assert.equal(r.withheld.attestedBySignedPrev, 1, "position 4 is named inside a signed body");
  assert.equal(r.withheld.assertedOnly, 1, "position 3 is named by nothing signed");
  assert.ok(r.findings.some((f) => f.code === "WITHHELD_UNATTESTED"));
  assert.ok(r.findings.some((f) => f.code === "WITHHELD_BODY"));
  assert.ok(r.findings.some((f) => f.code === "CHAIN_UNSIGNED"));
});

test("a manifest whose every withheld position is signed for raises no WITHHELD_UNATTESTED", () => {
  const links = [link(3, ID(2)), link(2, ID(1), { body_published: false }), link(1, "GSPC-CARD-FACTORY-GENESIS")];
  const cards = [card(3, ID(2)), card(1, "GSPC-CARD-FACTORY-GENESIS")];
  // Card 3's prev is 2 — wait: 3's prev is ID(2), and 2 is the withheld one. So it IS attested.
  const r = analyseChain(cards, manifest(links), profile);
  assert.equal(r.withheld.attestedBySignedPrev, 1);
  assert.equal(r.withheld.assertedOnly, 0);
  assert.ok(!r.findings.some((f) => f.code === "WITHHELD_UNATTESTED"));
  // WITHHELD_BODY still fires: a body you were not given cannot have its signature checked.
  assert.ok(r.findings.some((f) => f.code === "WITHHELD_BODY"));
});

test("a malformed manifest is rejected rather than half-read", () => {
  for (const junk of [null, {}, { links: "nope" }]) {
    const r = analyseChain([], junk, profile);
    assert.equal(r.ok, false);
    assert.ok(r.findings.some((f) => f.code === "CHAIN_MANIFEST_MALFORMED"));
  }
});
