import { test } from "node:test";
import assert from "node:assert/strict";
import { nEff, rhoFromNEff, observedRho, assessCouncil } from "../src/quorum-neff.mjs";

/** Deterministic legs with a TARGET PAIRWISE correlation.
 *
 *  Each leg copies a shared truth with probability p, else flips its own coin. Two such legs both
 *  copy with probability p^2, so the resulting pairwise phi is p^2 and NOT p — verified against the
 *  instrument at p = 0.3/0.6/0.9 giving phi 0.107/0.384/0.809. So to hit a target correlation we
 *  pass sqrt(target) as the copy probability. Getting this backwards made the instrument look
 *  broken when it was reading correctly. */
function legsWithRho(nLegs, m, targetRho, seed = 1) {
  const p = Math.sqrt(Math.max(0, Math.min(1, targetRho)));
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const truth = Array.from({ length: m }, () => (rnd() < 0.5 ? 1 : 0));
  return Array.from({ length: nLegs }, () =>
    truth.map((t) => (rnd() < p ? t : (rnd() < 0.5 ? 1 : 0))));
}

test("n_eff matches the closed form at the boundaries", () => {
  assert.equal(nEff(3, 0), 3, "independent legs count fully");
  assert.equal(nEff(3, 1), 1, "perfectly correlated legs are one opinion");
  assert.equal(nEff(33, 1), 1, "33 seats that always agree are still one opinion");
});

test("the DR-0007 figure round-trips: n_eff 1.21 of 3 implies rho ~0.74", () => {
  const rho = rhoFromNEff(3, 1.21);
  assert.ok(Math.abs(rho - 0.7397) < 0.001, `rho ${rho}`);
  assert.ok(Math.abs(nEff(3, rho) - 1.21) < 0.001, "inverts cleanly");
});

test("to reach n_eff 2.0 of 3, pairwise correlation must fall to 0.25", () => {
  assert.ok(Math.abs(rhoFromNEff(3, 2.0) - 0.25) < 1e-9);
});

test("instrument reads a known correlation back", () => {
  for (const target of [0.0, 0.3, 0.6, 0.9]) {
    const { rho } = observedRho(legsWithRho(3, 4000, target, 7));
    assert.ok(Math.abs(rho - target) < 0.05, `target ${target}, read ${rho.toFixed(3)}`);
  }
});

test("a council that cannot disagree is UNCHECKABLE, not a pass", () => {
  const alwaysYes = Array.from({ length: 33 }, () => Array(50).fill(1));
  const r = assessCouncil(alwaysYes, 23);
  assert.equal(r.state, "UNCHECKABLE");
  assert.equal(r.n_eff, 1);
  assert.equal(r.constantLegs, 33);
  assert.match(r.why, /cannot disagree/);
});

test("independent legs are measured as such, and a 23/33 quorum is discounted honestly", () => {
  const r = assessCouncil(legsWithRho(33, 2000, 0.05, 11), 23);
  assert.equal(r.state, "MEASURED");
  assert.ok(r.n_eff > 10, `n_eff ${r.n_eff} should be large when legs are near-independent`);
  assert.ok(r.effectiveQuorum < 23, "effective quorum is always at or below the nominal one");
});

test("correlated legs collapse n_eff even with many seats", () => {
  const r = assessCouncil(legsWithRho(33, 2000, 0.74, 3), 23);
  assert.ok(r.n_eff < 3, `33 seats at rho 0.74 behave like ${r.n_eff} legs`);
});
