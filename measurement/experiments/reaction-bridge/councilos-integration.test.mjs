// SPDX-License-Identifier: Apache-2.0
// Source-level guard for the intentionally offline, opt-in CouncilOS projection.
// Browser/mobile/host acceptance is separate and not proven by these tests.
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const pane=readFileSync(new URL("../../../client/src/components/DashboardEvidenceLearningPane.tsx",import.meta.url),"utf8");
const ui=readFileSync(new URL("../../../client/src/components/ReactionResearchReview.tsx",import.meta.url),"utf8");
test("the existing evidence-learning pane mounts one optional research review",()=>{
  assert.match(pane,/import ReactionResearchReview from "\.\/ReactionResearchReview"/);
  assert.equal((pane.match(/<ReactionResearchReview\s*\/>/g)||[]).length,1);
  assert.match(ui,/<details/);
  assert.doesNotMatch(ui,/<details\s+open/);
});
test("presentation consumes the same side-effect-free operating-view module",()=>{
  assert.match(ui,/from "\.\.\/\.\.\/\.\.\/measurement\/experiments\/reaction-bridge\/operating-view\.mjs"/);
  assert.match(ui,/summarizeReactionCases\(JSON\.parse\(raw\)\)/);
  assert.match(ui,/renderOperatingView/);
});
test("the UI has no network, write, dangerous markup, paid or scheduling path",()=>{
  for(const forbidden of ["fetch(","XMLHttpRequest","innerHTML","dangerouslySetInnerHTML","localStorage","sessionStorage","WebSocket(","sendBeacon(","onSubmit=","setInterval("]){
    assert.ok(!ui.includes(forbidden),"unexpected path: "+forbidden);
  }
  assert.match(ui,/Processed in this browser only/);
  assert.match(ui,/Simulation never becomes a measured/);
});
test("the UI has visible refusal, responsive text and accessibility labels",()=>{
  assert.match(ui,/REVIEW REFUSED/);
  assert.match(ui,/new TextEncoder\(\)\.encode\(raw\)\.byteLength > MAX_BYTES/);
  assert.match(ui,/aria-live="polite"/);
  assert.match(ui,/htmlFor="council-reaction-episode-json"/);
  assert.match(ui,/break-words/);
});

test("the browser default uses exact actually observed non-sensitive source cases, not a synthetic demo",()=>{
  assert.match(ui,/observedSamples from "\.\.\/\.\.\/\.\.\/docs\/research\/turkish-guard-observed-20261124\/councilos-import\.json"/);
  assert.match(ui,/Load two observed research cases/);
  assert.match(ui,/original evidence bundle/);
  assert.doesNotMatch(ui,/const DEMO/);
  assert.doesNotMatch(ui,/Load synthetic example/);
  const bank=JSON.parse(readFileSync(new URL("../../../docs/research/turkish-guard-observed-20261124/councilos-import.json",import.meta.url),"utf8"));
  assert.equal(bank.length,2);
  assert.ok(bank.every(r=>r.realm==="OBSERVED"));
  assert.equal(bank[0].stages.human_approval.state,"UNKNOWN");
  assert.equal(bank[1].stages.effect.state,"REPORTED");
  assert.equal(bank[1].stages.receiver_verification.state,"UNKNOWN");
});
