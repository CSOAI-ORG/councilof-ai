// SPDX-License-Identifier: Apache-2.0
import {test} from "node:test";
import assert from "node:assert/strict";
import {parseSovereignSimulationStatus as parse} from "./status-contract.mjs";
test("valid source numbers stay source-reported, never observed or signed",()=>{
  const p=parse({cum_episodes:17,ungoverned_crimes:4});
  assert.deepEqual(p,{episodes:17,hypotheticalViolations:4,evidence_state:"SOURCE_REPORTED_NOT_INDEPENDENTLY_VERIFIED"});
});
test("genuine zero is allowed only from an explicit observed source value",()=>{
  const p=parse({cum_episodes:0,ungoverned_crimes:0});
  assert.equal(p.episodes,0);assert.equal(p.hypotheticalViolations,0);
});
test("missing input refuses; never fabricates fallback counts",()=>{
  for(const v of [null,undefined,[],{},true,"",3])assert.throws(()=>parse(v));
});
test("malformed numbers and nonfinite/unsafe totals refuse",()=>{
  for(const v of [NaN,Infinity,-1,1.2,"121",Number.MAX_SAFE_INTEGER+1]){
    assert.throws(()=>parse({cum_episodes:v,ungoverned_crimes:0}));
    assert.throws(()=>parse({cum_episodes:0,ungoverned_crimes:v}));
  }
});
test("unknown extra data does not qualify human authority or anchor status",()=>{
  const p=parse({cum_episodes:2,ungoverned_crimes:1,governed_crimes:0,anchor:"claimed",approved:true});
  assert.deepEqual(Object.keys(p).sort(),["episodes","evidence_state","hypotheticalViolations"].sort());
  assert.equal(Object.isFrozen(p),true);
});
