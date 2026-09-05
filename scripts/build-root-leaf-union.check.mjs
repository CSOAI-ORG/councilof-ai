#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const history = JSON.parse(readFileSync("public/receipts/root-history.json", "utf8"));
const union = JSON.parse(readFileSync("public/signed/public-root-leaf-union.json", "utf8"));
const hex64 = /^[0-9a-f]{64}$/u;

const expected = new Set();
for (const root of history.roots ?? []) {
  for (const digest of root.card_sha256 ?? []) expected.add(digest);
}

assert.equal(union.schema, "councilof.ai/coverage-leaf-union/1");
assert.equal(union.derived_from, "/receipts/root-history.json");
assert.equal(union.source_roots, (history.roots ?? []).length);
assert.equal(union.size, expected.size);
assert.equal(union.entries.length, expected.size);
assert.deepEqual(
  new Set(union.entries.map((entry) => entry.leaf_digest_sha256)),
  expected,
  "coverage union must exactly cover the committed root history",
);
assert.ok(union.entries.every((entry) => hex64.test(entry.leaf_digest_sha256)));
assert.ok(union.entries.every((entry) => !("card" in entry)), "legacy card label must not return");
let individuallySigned = 0;
for (const entry of union.entries) {
  const wrapper = JSON.parse(
    readFileSync(`public/cards/${entry.leaf_digest_sha256.slice(0, 16)}.json`, "utf8"),
  );
  assert.equal(wrapper?.card?.sha256, entry.leaf_digest_sha256);
  if (/^[0-9a-f]{128}$/u.test(String(wrapper?.card?.sig_ed25519 ?? ""))) individuallySigned += 1;
}
assert.equal(union.resolution.resolved_card_wrappers, union.size);
assert.equal(union.resolution.individually_signed_card_wrappers, individuallySigned);
assert.equal(union.resolution.unsigned_card_wrappers, union.size - individuallySigned);
assert.match(union.what_this_is, /resolves to its public card wrapper/i);

const sha = (bytes) => createHash("sha256").update(bytes).digest();
let level = union.entries.map((entry) =>
  sha(Buffer.concat([Buffer.from([0]), Buffer.from(entry.leaf_digest_sha256, "hex")])),
);
if (level.length === 0) level = [sha(Buffer.alloc(0))];
while (level.length > 1) {
  const next = [];
  for (let index = 0; index < level.length; index += 2) {
    const left = level[index];
    const right = level[index + 1];
    next.push(right ? sha(Buffer.concat([Buffer.from([1]), left, right])) : left);
  }
  level = next;
}
assert.equal(union.merkle_root_sha256, level[0].toString("hex"));

console.log(`build-root-leaf-union test: PASS (${union.source_roots} roots, ${union.size} leaves)`);
