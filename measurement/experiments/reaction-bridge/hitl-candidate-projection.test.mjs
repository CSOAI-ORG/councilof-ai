// SPDX-License-Identifier: Apache-2.0
import {test} from "node:test";
import assert from "node:assert/strict";
import {evaluateEpisode} from "./reaction-bridge.mjs";
import {projectHitlCandidateV02 as project} from "./hitl-candidate-projection.mjs";
const H="a".repeat(64),M="b".repeat(64),S="c".repeat(64),E="d".repeat(64),V="e".repeat(64);
const record=()=>({
  profile:"csoai.hitl-authority-effect/0.2",
  record_id:"PRIVATE-CASE-ID-NEVER-LEAK",limits:["candidate not authority"],
  request:{proposal_digest:{alg:"sha256",value:H},subject_ref:"PRIVATE-SUBJECT-NEVER-LEAK"},
  authority:{
    decision:"APPROVE",review_kind:"HUMAN_REVIEW",principal_ref:"PRIVATE-PRINCIPAL-NEVER-LEAK",
    external_record_digest:{alg:"sha256",value:S},
    scope_digest:{alg:"sha256",value:S},
    operational_baseline:{baseline_digest:{alg:"sha256",value:H},observed_at:"2026-10-27T09:09:30Z"},
    decided_at:"2026-10-27T09:10:00Z",
    validity_window:{not_before:"2026-10-27T09:10:00Z",not_after:"2026-10-27T10:10:00Z"},
    release_state:"ACTIVE",revocation_state:"NOT_REVOKED"
  },
  invocation:{state:"EXECUTED",invoked_at:"2026-10-27T09:11:00Z",invocation_digest:{alg:"sha256",value:E}},
  effect:{state:"OBSERVED",effect_digest:{alg:"sha256",value:V}},
  claim_maintenance:{watch_state:"CURRENT",watch_state_at_decision:"CURRENT",watch_state_at_invocation:"CURRENT"},
  verification:{state:"VERIFIED",evidence_refs:["sha256:"+S],verifier_ref:"SELF-DECLARED-VERIFIER"}
});
const args=(r=record())=>({record:r,realm:"OBSERVED",condition:"HUMAN_APPROVAL",experiment_id:"test-experiment",case_id:"case-1",input_sha256:H,method_sha256:M});
test("all source claims remain pointers, not validated human or executor",()=>{
  const ep=project(args()),view=evaluateEpisode(ep);
  assert.equal(ep.stages.request.state,"REPORTED");
  assert.equal(ep.stages.human_approval.state,"REPORTED");
  assert.equal(ep.stages.executor_authority.state,"UNKNOWN");
  assert.equal(ep.stages.receiver_verification.state,"UNKNOWN");
  assert.equal(view.execute_authorized,false);
  assert.equal(view.effect_independently_accepted,false);
});
test("private source references do not enter projection",()=>{
  const out=JSON.stringify(project(args()));
  for(const word of ["PRIVATE-CASE-ID-NEVER-LEAK","PRIVATE-SUBJECT-NEVER-LEAK","PRIVATE-PRINCIPAL-NEVER-LEAK","SELF-DECLARED-VERIFIER"]) assert.ok(!out.includes(word));
});
test("a fake VERIFIED label cannot promote receiver verification",()=>assert.equal(project(args()).stages.receiver_verification.state,"UNKNOWN"));
test("an explicitly supplied receiver SHA is only a reported pointer",()=>{
  const ep=project({...args(),receiver_receipt_sha256:S,executor_authority_receipt_sha256:E});
  assert.equal(ep.stages.receiver_verification.state,"REPORTED");
  assert.equal(evaluateEpisode(ep).status,"REPORTED_CHAIN_NEEDS_EXTERNAL_QUALIFICATION");
});
test("simulated realm remains simulation even with all declared evidence",()=>{
  const ep=project({...args(),realm:"SIMULATED",receiver_receipt_sha256:S,executor_authority_receipt_sha256:E});
  assert.equal(evaluateEpisode(ep).status,"SIMULATION_ONLY");
});
test("non-human review kind cannot turn into actual human approval",()=>{
  const r=record();r.authority.review_kind="PREAUTHORIZED_POLICY_WITH_HUMAN_MAXIMUM";
  assert.equal(project(args(r)).stages.human_approval.state,"UNKNOWN");
});
test("denied or revoked authority is not reported as human approval",()=>{
  for(const state of ["DENY","REVOKE"]){
    const r=record();r.authority.decision=state;
    assert.equal(project(args(r)).stages.human_approval.state,"UNKNOWN");
  }
});
test("no effect or partial outcome cannot become observed",()=>{
  for(const state of ["UNKNOWN","NONE","PARTIAL"]){
    const r=record();r.effect.state=state;
    assert.equal(project({...args(r),receiver_receipt_sha256:S}).stages.effect.state,"UNKNOWN");
    assert.equal(project({...args(r),receiver_receipt_sha256:S}).stages.receiver_verification.state,"UNKNOWN");
  }
});
test("not executed or failed invocation cannot become executor response",()=>{
  for(const state of ["REJECTED","NOT_INVOKED","FAILED_BEFORE_EFFECT"]){
    const r=record();r.invocation.state=state;
    assert.equal(project(args(r)).stages.executor_response.state,"UNKNOWN");
  }
});
test("unsupported profile and missing objects refuse",()=>{
  for(const altered of [{...record(),profile:"csoai.hitl-authority-effect/0.1"},{...record(),authority:null},null,{}]){
    assert.throws(()=>project(args(altered)));
  }
});
test("bad external digest never becomes approval",()=>{
  const r=record();r.authority.external_record_digest.value="INVALID";
  assert.equal(project(args(r)).stages.human_approval.state,"UNKNOWN");
});
test("no inferred realm, method, source or accepted receipt",()=>{
  for(const override of [{realm:undefined},{condition:undefined},{method_sha256:null},{input_sha256:null},{receiver_receipt_sha256:"D".repeat(64)}]){
    assert.throws(()=>project({...args(),...override}));
  }
});

test("revoked, unknown revocation and suspended releases cannot create a reported human approval",()=>{
  for(const mode of ["REVOKED","REVOCATION_UNKNOWN"]){
    const r=record();r.authority.revocation_state=mode;
    assert.equal(project(args(r)).stages.human_approval.state,"UNKNOWN");
  }
  for(const mode of ["REVOKED","SUPERSEDED","SUSPENDED","EXPIRED"]){
    const r=record();r.authority.release_state=mode;
    assert.equal(project(args(r)).stages.human_approval.state,"UNKNOWN");
  }
});
test("stale or due-for-retest claims fail closed at decision and invocation",()=>{
  for(const k of ["watch_state","watch_state_at_decision","watch_state_at_invocation"]){
    const r=record();r.claim_maintenance[k]="STALE";
    assert.equal(project(args(r)).stages.human_approval.state,"UNKNOWN",k);
  }
});
test("out-of-window and chronologically impossible decisions do not count",()=>{
  const edits=[
    r=>{r.authority.decided_at="2026-10-27T10:11:00Z"},
    r=>{r.invocation.invoked_at="2026-10-27T10:15:00Z"},
    r=>{r.invocation.invoked_at="2026-10-27T09:09:00Z"},
    r=>{r.authority.validity_window.not_after="2026-10-27T08:10:00Z"},
    r=>{r.authority.operational_baseline.observed_at="2026-10-27T11:10:00Z"},
    r=>{r.authority.decided_at="2026-10-27Z"}
  ];
  for(const edit of edits){
    const r=record();edit(r);
    assert.equal(project(args(r)).stages.human_approval.state,"UNKNOWN");
  }
});
test("missing baseline, method scope or claim maintenance never implies human authority",()=>{
  for(const edit of [
    r=>{r.authority.scope_digest=null},
    r=>{r.authority.operational_baseline=null},
    r=>{r.claim_maintenance=null},
    r=>{r.authority.validity_window=null}
  ]){
    const r=record();edit(r);
    assert.equal(project(args(r)).stages.human_approval.state,"UNKNOWN");
  }
});
