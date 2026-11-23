import { test } from "node:test";
import assert from "node:assert/strict";
import { validateTrustedMasterRun } from "./gspc-trusted-run.mjs";

const SHA="a".repeat(40),MASTER="b".repeat(40);
const NAME="GSPC repeated-observation integrity audit";
function inputs(){
  const run={id:17,name:NAME,status:"completed",conclusion:"success",
    event:"push",head_branch:"master",head_sha:SHA,
    repository:{full_name:"CSOAI-ORG/councilof-ai"},
    head_repository:{full_name:"CSOAI-ORG/councilof-ai"}};
  const compare={status:"ahead",behind_by:0,ahead_by:2,
    base_commit:{sha:SHA},merge_base_commit:{sha:SHA}};
  return {run,compare,expected:{workflowName:NAME,runId:17}};
}
test("real main repository push/schedule/dispatch can qualify if source is master ancestor",()=>{
  for (const event of ["push","schedule","workflow_dispatch"]){
    const {run,compare,expected}=inputs();run.event=event;
    assert.equal(validateTrustedMasterRun(run,compare,expected).run_id,17);
  }
});
test("a fork PR called master is NEVER an authorized master source",()=>{
  const {run,compare,expected}=inputs();
  run.event="pull_request";
  run.head_repository.full_name="other-account/council-of-ai";
  assert.throws(()=>validateTrustedMasterRun(run,compare,expected),/head and executing repository/);
  run.head_repository.full_name="CSOAI-ORG/councilof-ai";
  assert.throws(()=>validateTrustedMasterRun(run,compare,expected),/untrusted event/);
});
test("foreign head repo cannot use push event as a bypass",()=>{
  const {run,compare,expected}=inputs();
  run.head_repository.full_name="attacker/fork";
  assert.throws(()=>validateTrustedMasterRun(run,compare,expected),/head and executing repository/);
});
test("a newer failed, pending or cancelled run cannot fall back to earlier success",()=>{
  for (const [status,conclusion] of [
    ["completed","failure"],["queued",null],["in_progress",null],
    ["completed","cancelled"]
  ]){
    const {run,compare,expected}=inputs();
    run.status=status;run.conclusion=conclusion;
    assert.throws(()=>validateTrustedMasterRun(run,compare,expected),/missing, pending or failed/);
  }
});
test("artifact is bound to the exact inspected run and workflow identity",()=>{
  for(const change of [
    x=>{x.run.id=18},
    x=>{x.run.name="GSPC fake source"},
    x=>{x.run.repository.full_name="fork/repo"},
    x=>{x.run.head_branch="dev"},
  ]){
    const x=inputs();change(x);
    assert.throws(()=>validateTrustedMasterRun(x.run,x.compare,x.expected),/UNTRUSTED/);
  }
});
test("a detached, diverged, or falsely compared commit is rejected",()=>{
  for(const change of [
    x=>{x.compare.status="diverged";x.compare.behind_by=2},
    x=>{x.compare.merge_base_commit.sha=MASTER},
    x=>{x.compare.base_commit.sha=MASTER},
    x=>{x.run.head_sha="unverified"},
  ]){
    const x=inputs();change(x);
    assert.throws(()=>validateTrustedMasterRun(x.run,x.compare,x.expected),/UNTRUSTED/);
  }
});
test("the result never claims external signature, regulator authority, or model grades",()=>{
  const x=inputs();x.compare.status="identical";x.compare.ahead_by=0;
  const y=validateTrustedMasterRun(x.run,x.compare,x.expected);
  assert.equal(y.ancestry,"identical");
  assert.equal(y.status,"TRUSTED_MASTER_ACTION_RUN_SOURCE_ONLY_NOT_AN_EXTERNAL_SIGNATURE");
  assert.ok(!JSON.stringify(y).includes("CERTIFIED"));
});
