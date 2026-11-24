// SPDX-License-Identifier: Apache-2.0
// Guard the honesty of a LEGACY React simulation source. This is a source test,
// not proof it is deployed or that remote status/anchor endpoints are trustworthy.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src=readFileSync(new URL("./SovereignTown.jsx",import.meta.url),"utf8");

test("no default episode count or invented real-world zero",()=>{
  for(const forbidden of ["1446621120","121043036","Bitcoin block 954857","177 jurisdictions","governed violations approach 0","world’s first","world's first"]){
    assert.ok(!src.toLowerCase().includes(forbidden.toLowerCase()),forbidden);
  }
  assert.match(src,/useState\(null\)/);
  assert.match(src,/Not established/);
});
test("bad status reads remain unknown, not live",()=>{
  assert.match(src,/SOURCE_REPORTED_NOT_INDEPENDENTLY_VERIFIED/);
  assert.match(src,/UNAVAILABLE_OR_UNCHECKABLE/);
  assert.match(src,/if \(!r\.ok\) throw/);
  assert.match(src,/Number\.isSafeInteger\(d\?\.cum_episodes\)/);
  assert.match(src,/Number\.isSafeInteger\(d\?\.ungoverned_crimes\)/);
  assert.doesNotMatch(src,/setLive\(/);
});
test("cross-domain source is only a reported simulation",()=>{
  assert.match(src,/simulation outcomes and controls/);
  assert.match(src,/not independently verified original episodes/);
  assert.match(src,/simulation difference does not prove prevented real-world harm/i);
});
test("signature/anchor/authority boundaries are explicit",()=>{
  assert.match(src,/No signature, issuer custody, Bitcoin inclusion or real-world effect/);
  assert.match(src,/cannot establish who performed an action/);
  assert.match(src,/legal compliance/);
});
test("regulatory framework references do not claim conformity",()=>{
  assert.match(src,/Applicability, current legal text, adoption and conformity require separate qualified review/);
  assert.doesNotMatch(src,/measures conduct against the binding and emerging regimes in force across/);
});
test("green and white surface retains basic responsive structure",()=>{
  assert.match(src,/background: '#ffffff'/);
  assert.match(src,/background: '#f6fbf7'/);
  assert.match(src,/repeat\(auto-fit, minmax/);
});
