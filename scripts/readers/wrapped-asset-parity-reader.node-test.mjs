import assert from "node:assert/strict";
import test from "node:test";

import { ROSTER, ratioString, SCHEMA } from "./wrapped-asset-parity-reader.mjs";

test("ratio is computed in BigInt with six places, truncated not rounded, no float", () => {
  // 52,222,558 / 48,501,527 = 1.0767197… → truncated to six places.
  assert.equal(ratioString(52_222_558_000000n, 48_501_527_000000n), "1.076719");
  assert.equal(ratioString(1n, 3n), "0.333333");
  assert.equal(ratioString(5n, 0n), null);
});

test("every roster entry names its backing model, and only escrow entries name an escrow", () => {
  for (const e of ROSTER) {
    assert.ok(["escrow", "native", "custodial"].includes(e.backing_model), e.id);
    if (e.backing_model === "escrow") assert.match(e.escrow, /^0x[0-9a-fA-F]{40}$/, e.id);
    else if (e.backing_model === "native") assert.ok(e.note && /natively|native/i.test(e.note), `${e.id} must say why no parity is claimed`);
    else assert.ok(e.note && /INDEXED, no parity claimed/.test(e.note) && e.escrow === null, `${e.id} custodial rows claim nothing`);
    assert.match(e.wrapped.address, /^0x[0-9a-fA-F]{40}$/);
    if (e.backing_model !== "custodial") assert.match(e.canonical.address, /^0x[0-9a-fA-F]{40}$/);
  }
  assert.equal(new Set(ROSTER.map((e) => e.id)).size, ROSTER.length, "ids are unique");
});

test("schema id is versioned", () => {
  assert.match(SCHEMA, /^csoai\.wrapped-asset-parity\/\d+\.\d+$/);
});
