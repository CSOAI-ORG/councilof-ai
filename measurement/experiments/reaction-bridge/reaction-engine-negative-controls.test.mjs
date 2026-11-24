// SPDX-License-Identifier: Apache-2.0
// Negative controls added by a 2026-11-24 automated AI research-agent audit under the CSOAI-ORG account (research only).
// Each test pins a refusal or count that a hand-written mutation of the engine left unchecked:
// with the existing suite, 33 of 72 mutants survived. These tests change NO behaviour.
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {evaluateEpisode,compareSyntheticPaired} from "./reaction-bridge.mjs";
import {projectHitlCandidateV02 as project} from "./hitl-candidate-projection.mjs";
import {summarizeReactionCases,renderOperatingView} from "./operating-view.mjs";
import {projectObservedModelRun} from "../../../scripts/research/project_turkish_reaction.mjs";
const H="a".repeat(64),M="b".repeat(64);
const REQ=["request","method","human_approval","executor_authority","executor_response","effect","receiver_verification"];
const rep=()=>({state:"REPORTED",receipt_sha256:H,source_realm:"OBSERVED"});
const full=()=>Object.fromEntries(REQ.map(k=>[k,rep()]));
const ep=(o={})=>({schema:"csoai.reaction-experiment/0.1",realm:"OBSERVED",condition:"HUMAN_APPROVAL",experiment_id:"audit",case_id:"case-1",input_sha256:H,method_sha256:M,stages:full(),...o});

test("episode envelope: wrong schema, realm, condition, oversize ID, bad pins and array stages refuse",()=>{
  for(const bad of [{schema:"csoai.reaction-experiment/0.2"},{realm:"observed"},{realm:"MEASURED"},{condition:"EXECUTE"},
    {case_id:"a".repeat(97)},{experiment_id:"Audit"},{input_sha256:"a".repeat(63)},{method_sha256:"x"+"b".repeat(64)+"x"},
    {input_sha256:null},{stages:[]},{realm:"MEASURED",stages:{}},{realm:"observed",stages:{}}]){
    assert.throws(()=>evaluateEpisode(ep(bad)),JSON.stringify(bad).slice(0,60));
  }
  assert.equal(evaluateEpisode(ep({case_id:"a".repeat(96)})).status,"REPORTED_CHAIN_NEEDS_EXTERNAL_QUALIFICATION");
});
test("stage contents: unknown state, extra field and 63-char or embedded receipt refuse",()=>{
  for(const s of [{state:"VERIFIED",source_realm:"OBSERVED"},{...rep(),note:"x"},{...rep(),receipt_sha256:"a".repeat(63)},{...rep(),receipt_sha256:"z"+H}]){
    assert.throws(()=>evaluateEpisode(ep({stages:{...full(),effect:s}})));
  }
});
test("every required stage counts: one missing stage, including request, keeps the chain incomplete",()=>{
  for(const k of REQ){
    const stages=full();delete stages[k];
    const r=evaluateEpisode(ep({stages}));
    assert.equal(r.status,"ACCEPTANCE_INCOMPLETE",k);
    assert.deepEqual(r.missing_stages,[k]);
  }
});
test("failed_stages lists FAILED stages only, not UNKNOWN ones",()=>{
  const r=evaluateEpisode(ep({stages:{request:rep(),effect:{state:"FAILED",source_realm:"OBSERVED"},method:{state:"UNKNOWN",source_realm:"OBSERVED"}}}));
  assert.deepEqual(r.failed_stages,["effect"]);
});
const row=(n,c,success,o={})=>({experiment_id:"trial-1",case_id:"case-"+n,realm:"SIMULATED",condition:c,input_sha256:H,bank_sha256:M,success,...o});
test("paired comparison: discordant counts are exact and no causal claim is made",()=>{
  const rows=[row(1,"NO_HUMAN",true),row(1,"HUMAN_INFORMATION",true),row(2,"NO_HUMAN",true),row(2,"HUMAN_INFORMATION",false),
              row(3,"NO_HUMAN",false),row(3,"HUMAN_INFORMATION",true),row(4,"NO_HUMAN",false),row(4,"HUMAN_INFORMATION",true),
              row(5,"NO_HUMAN",true),row(5,"HUMAN_INFORMATION",true)];
  const v=compareSyntheticPaired(rows);
  assert.deepEqual([v.matched_cases,v.control_success,v.treatment_success,v.control_only,v.treatment_only,v.paired_difference],[5,3,4,1,2,0.2]);
  assert.equal(v.causal_effect_established,false);
  assert.equal(v.real_human_observed,false);
});
test("paired comparison: a third condition row refuses",()=>{
  const rows=[row(1,"NO_HUMAN",true),row(1,"HUMAN_INFORMATION",true),row(2,"NO_HUMAN",true),row(2,"HUMAN_INFORMATION",false),row(2,"HUMAN_APPROVAL",true)];
  assert.throws(()=>compareSyntheticPaired(rows),/third condition/);
});
const record=()=>({profile:"csoai.hitl-authority-effect/0.2",limits:[],request:{proposal_digest:{alg:"sha256",value:H}},
  authority:{decision:"APPROVE",review_kind:"HUMAN_REVIEW",external_record_digest:{alg:"sha256",value:H},scope_digest:{alg:"sha256",value:H},
    operational_baseline:{baseline_digest:{alg:"sha256",value:H},observed_at:"2026-10-27T09:00:00Z"},decided_at:"2026-10-27T09:10:00Z",
    validity_window:{not_before:"2026-10-27T09:05:00Z",not_after:"2026-10-27T10:00:00Z"},release_state:"ACTIVE",revocation_state:"NOT_REVOKED"},
  invocation:{state:"NOT_INVOKED"},effect:{state:"NONE"},verification:{state:"UNVERIFIED"},
  claim_maintenance:{watch_state:"CURRENT",watch_state_at_decision:"CURRENT"}});
const args=(r=record(),o={})=>({record:r,experiment_id:"audit",case_id:"case-1",realm:"OBSERVED",condition:"HUMAN_APPROVAL",input_sha256:H,method_sha256:M,...o});
const approval=r=>project(args(r)).stages.human_approval.state;
test("HITL control: the un-invoked fixture is a reported human approval",()=>assert.equal(approval(record()),"REPORTED"));
test("HITL: a decision outside the window is not approval even when nothing was invoked",()=>{
  for(const t of ["2026-10-27T09:04:59Z","2026-10-27T10:00:01Z"]){const r=record();r.authority.decided_at=t;assert.equal(approval(r),"UNKNOWN",t);}
});
test("HITL: a timestamp without a zone, or a non-sha256 digest label, is not approval",()=>{
  const r1=record();r1.authority.decided_at="2026-10-27T09:10:00";assert.equal(approval(r1),"UNKNOWN");
  const r2=record();r2.authority.scope_digest={alg:"SHA256",value:H};assert.equal(approval(r2),"UNKNOWN");
  const r3=record();r3.authority.external_record_digest={alg:"md5",value:H};assert.equal(approval(r3),"UNKNOWN");
});
test("HITL: empty-string executor or receiver receipt pins refuse instead of reading as absent",()=>{
  assert.throws(()=>project(args(record(),{executor_authority_receipt_sha256:""})),/executor-authority/);
  assert.throws(()=>project(args(record(),{receiver_receipt_sha256:""})),/receiving-party/);
});
const mk=(realm,id,stages={})=>({schema:"csoai.reaction-experiment/0.1",realm,condition:"HUMAN_APPROVAL",experiment_id:"fixture",case_id:id,input_sha256:H,method_sha256:M,stages});
test("operating view: 65 cases refuse; 64 are accepted",()=>{
  const many=n=>Array.from({length:n},(_,i)=>mk("SIMULATED","s"+i));
  assert.equal(summarizeReactionCases(many(64)).total_cases,64);
  assert.throws(()=>summarizeReactionCases(many(65)));
});
test("operating view: simulated gaps do not set the gate and incomplete observed cases are not complete chains",()=>{
  const fullObs={...full()};
  const v=summarizeReactionCases([mk("OBSERVED","o1",fullObs),mk("SIMULATED","s1",{})]);
  assert.equal(v.highest_gate.stage,"external_qualification");
  const w=summarizeReactionCases([mk("OBSERVED","o1",fullObs),mk("OBSERVED","o2",{request:rep()})]);
  assert.equal(w.reported_complete_chains,1);
  assert.equal(w.independently_qualified_chains,null);
});
test("operating view render refuses a well-shaped view with the wrong schema",()=>{
  const v=summarizeReactionCases([mk("OBSERVED","o1",full())]);
  assert.throws(()=>renderOperatingView({...v,schema:"csoai.reaction-operating-view/0.2"}));
});
const raw=readFileSync(new URL("../../../docs/research/turkish-guard-observed-20261124/record.json",import.meta.url));
const original=JSON.parse(raw);
test("observed model run: a changed population or tp count refuses",()=>{
  const a={...original,rows:3373};
  assert.throws(()=>projectObservedModelRun(a,Buffer.from(JSON.stringify(a))));
  const b={...original,confusion:{...original.confusion,tp:original.confusion.tp+1}};
  assert.throws(()=>projectObservedModelRun(b,Buffer.from(JSON.stringify(b))));
});
