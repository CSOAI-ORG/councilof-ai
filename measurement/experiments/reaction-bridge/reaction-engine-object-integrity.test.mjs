// SPDX-License-Identifier: Apache-2.0
// Defect controls added by a 2026-11-24 automated AI research-agent audit under the CSOAI-ORG account (research only).
// On master before this change, each non-todo test below FAILED: a stage that never passed
// validation (inherited, non-enumerable, proxy-hidden, accessor, or Object.prototype pollution)
// was reported as REPORTED, a realm accessor laundered SIMULATED stages into an OBSERVED chain,
// an impossible calendar date counted as a human approval inside its window, and extra
// source fields were echoed. Plain JSON input was never affected.
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateEpisode} from "./reaction-bridge.mjs";
import {projectHitlCandidateV02 as project} from "./hitl-candidate-projection.mjs";
import {projectObservedModelRun} from "../../../scripts/research/project_turkish_reaction.mjs";
const H="a".repeat(64),M="b".repeat(64);
const REQ=["request","method","human_approval","executor_authority","executor_response","effect","receiver_verification"];
const rep=(realm="OBSERVED")=>({state:"REPORTED",receipt_sha256:H,source_realm:realm});
const six=()=>Object.fromEntries(REQ.slice(0,6).map(k=>[k,rep()]));
const forged={state:"REPORTED",receipt_sha256:"NOT-A-DIGEST",source_realm:"SIMULATED"};
const ep=stages=>({schema:"csoai.reaction-experiment/0.1",realm:"OBSERVED",condition:"HUMAN_APPROVAL",experiment_id:"audit",case_id:"case-1",input_sha256:H,method_sha256:M,stages});
function assertNotCounted(make){
  let r;try{r=evaluateEpisode(make());}catch{return;} // refusal is also acceptable
  assert.equal(r.stages.find(s=>s.stage==="receiver_verification").state,"UNKNOWN");
  assert.notEqual(r.status,"REPORTED_CHAIN_NEEDS_EXTERNAL_QUALIFICATION");
  assert.ok(r.stages.every(s=>s.state!=="REPORTED"||/^[a-f0-9]{64}$/.test(s.receipt_sha256)));
}
test("control: the same forged stage as a plain own property is refused",()=>{
  assert.throws(()=>evaluateEpisode(ep({...six(),receiver_verification:forged})));
});
test("an inherited stage is never counted",()=>assertNotCounted(()=>ep(Object.assign(Object.create({receiver_verification:forged}),six()))));
test("a non-enumerable stage is never counted",()=>assertNotCounted(()=>{const s=six();Object.defineProperty(s,"receiver_verification",{value:forged});return ep(s);}));
test("a proxy-hidden stage is never counted",()=>assertNotCounted(()=>ep(new Proxy({...six(),receiver_verification:forged},{
  ownKeys:o=>Reflect.ownKeys(o).filter(k=>k!=="receiver_verification"),
  getOwnPropertyDescriptor:(o,k)=>k==="receiver_verification"?undefined:Reflect.getOwnPropertyDescriptor(o,k)}))));
test("a stage accessor cannot answer benign to validation and forged afterwards",()=>assertNotCounted(()=>{
  const s=six();let n=0;Object.defineProperty(s,"receiver_verification",{enumerable:true,get(){return ++n===1?{state:"UNKNOWN",source_realm:"OBSERVED"}:forged;}});return ep(s);}));
test("Object.prototype pollution cannot complete an empty chain",()=>{
  for(const k of REQ)Object.prototype[k]=forged;
  try{assertNotCounted(()=>ep({}));}finally{for(const k of REQ)delete Object.prototype[k];}
});
test("a realm accessor cannot launder SIMULATED stages into an OBSERVED chain",()=>{
  const stages=Object.fromEntries(REQ.map(k=>[k,rep("SIMULATED")]));
  const e={...ep(stages)};delete e.realm;let n=0;
  Object.defineProperty(e,"realm",{enumerable:true,get(){return ++n<=8?"SIMULATED":"OBSERVED";}});
  let r;try{r=evaluateEpisode(e);}catch{return;}
  assert.equal(r.status,"SIMULATION_ONLY");
  assert.equal(r.realm,"SIMULATED");
});
const record=()=>({profile:"csoai.hitl-authority-effect/0.2",limits:[],request:{proposal_digest:{alg:"sha256",value:H}},
  authority:{decision:"APPROVE",review_kind:"HUMAN_REVIEW",external_record_digest:{alg:"sha256",value:H},scope_digest:{alg:"sha256",value:H},
    operational_baseline:{baseline_digest:{alg:"sha256",value:H},observed_at:"2026-03-02T09:00:00Z"},decided_at:"2026-03-02T09:10:00Z",
    validity_window:{not_before:"2026-03-02T09:00:00Z",not_after:"2026-03-02T10:00:00Z"},release_state:"ACTIVE",revocation_state:"NOT_REVOKED"},
  invocation:{state:"NOT_INVOKED"},effect:{state:"NONE"},verification:{state:"UNVERIFIED"},
  claim_maintenance:{watch_state:"CURRENT",watch_state_at_decision:"CURRENT"}});
const args=r=>({record:r,experiment_id:"audit",case_id:"case-1",realm:"OBSERVED",condition:"HUMAN_APPROVAL",input_sha256:H,method_sha256:M});
test("impossible calendar dates are not timestamps (Date.parse rolls 2026-02-30 to 2026-03-02)",()=>{
  assert.equal(project(args(record())).stages.human_approval.state,"REPORTED");
  for(const [k,v] of [["decided_at","2026-02-30T09:10:00Z"],["not_before","2026-02-30T09:00:00Z"],["observed_at","2026-02-30T09:00:00Z"]]){
    const r=record();
    if(k==="decided_at")r.authority.decided_at=v;else if(k==="not_before")r.authority.validity_window.not_before=v;else r.authority.operational_baseline.observed_at=v;
    assert.equal(project(args(r)).stages.human_approval.state,"UNKNOWN",k+"="+v);
  }
});
test("one invocation state is used for both the approval window and the executor response",()=>{
  const r=record();r.claim_maintenance.watch_state_at_invocation="STALE";
  r.invocation={invoked_at:"2027-01-01T00:00:00Z",invocation_digest:{alg:"sha256",value:H}};
  let n=0;Object.defineProperty(r.invocation,"state",{enumerable:true,get(){return ++n<=2?"NOT_INVOKED":"EXECUTED";}});
  let e;try{e=project(args(r));}catch{return;}
  assert.ok(!(e.stages.human_approval.state==="REPORTED"&&e.stages.executor_response.state==="REPORTED"));
});
const raw=readFileSync(new URL("../../../docs/research/turkish-guard-observed-20261124/record.json",import.meta.url));
const original=JSON.parse(raw);
test("observed model projection does not echo extra source fields inside confusion",()=>{
  const x=JSON.parse(raw);x.confusion.note="SOURCE-EXTRA";x.confusion.execute_authorized=true;
  const out=projectObservedModelRun(x,Buffer.from(JSON.stringify(x)));
  assert.deepEqual(Object.keys(out.confusion).sort(),["fn","fp","tn","tp"]);
});
test("a record with a forged perfect confusion matrix is refused",{todo:"record bytes are not pinned; needs an owner-chosen record or case-receipt digest"},()=>{
  const x=JSON.parse(raw);x.confusion={tp:317,fn:0,fp:0,tn:3055};x.missed_indices=[];x.false_alarm_indices=[];
  assert.throws(()=>projectObservedModelRun(x,Buffer.from(JSON.stringify(x))));
});
test("observed_model_output_sha256 is bound to the projected record",{todo:"library API hashes caller-supplied bytes without comparing them to the record"},()=>{
  assert.throws(()=>projectObservedModelRun(original,Buffer.from("unrelated bytes")));
});
test("missed and false-alarm indices are unique in-range integers",{todo:"only list lengths are checked"},()=>{
  const x=JSON.parse(raw);x.missed_indices=x.missed_indices.map(()=>-1);
  assert.throws(()=>projectObservedModelRun(x,Buffer.from(JSON.stringify(x))));
});
