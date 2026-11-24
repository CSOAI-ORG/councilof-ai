// SPDX-License-Identifier: Apache-2.0
import {test} from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {readFileSync} from "node:fs";
const command=fileURLToPath(new URL("./reaction-review-cli.mjs",import.meta.url));
const H="a".repeat(64),M="b".repeat(64);
const example=[{schema:"csoai.reaction-experiment/0.1",realm:"SIMULATED",condition:"NO_HUMAN",experiment_id:"sample",case_id:"one",input_sha256:H,method_sha256:M,stages:{}}];
const run=(input,opts={})=>spawnSync(process.execPath,[command],{encoding:"utf8",input,...opts});
test("pure stdin review returns explicit unknown",()=>{const r=run(JSON.stringify(example));assert.equal(r.status,0);assert.match(r.stdout,/UNQUALIFIED INPUT/);assert.match(r.stdout,/SIMULATION_ONLY/);assert.match(r.stdout,/UNKNOWN/);assert.equal(r.stderr,"")});
test("empty input refuses",()=>{const r=run("");assert.equal(r.status,2);assert.match(r.stderr,/REVIEW REFUSED/)});
test("invalid JSON refuses",()=>{const r=run("{");assert.equal(r.status,2);assert.match(r.stderr,/REVIEW REFUSED/)});
test("oversized input refuses",()=>{const r=run("x".repeat(256*1024+1));assert.equal(r.status,2);assert.match(r.stderr,/exceeds 256 KiB/)});
test("malformed evidence refuses",()=>{const r=run(JSON.stringify([{schema:"other"}]));assert.equal(r.status,2);assert.match(r.stderr,/REVIEW REFUSED/)});
test("refuses unexpected arguments",()=>{const r=spawnSync(process.execPath,[command,"--execute"],{encoding:"utf8",input:JSON.stringify(example)});assert.equal(r.status,2);assert.match(r.stderr,/usage/)});

test("manual canonical HITL v0.2 candidate is projected without authenticating any actor",()=>{
  const record=JSON.parse(readFileSync(new URL("../../../docs/standards/osaia-safe-reverification/hitl-authority-effect-v0.2.example.json",import.meta.url),"utf8"));
  record.authority.principal_ref="private-person-should-not-echo";
  const input={record,experiment_id:"candidate-test",case_id:"nonprivate-1",
    realm:"SIMULATED",condition:"HUMAN_APPROVAL",input_sha256:H,method_sha256:M};
  const r=spawnSync(process.execPath,[command,"--candidate-hitl"],{encoding:"utf8",input:JSON.stringify(input)});
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/SIMULATION_ONLY/);
  assert.match(r.stdout,/independently qualified: UNKNOWN/);
  assert.doesNotMatch(r.stdout,/private-person-should-not-echo/);
  assert.doesNotMatch(r.stdout,/APPROVED/);
});
test("candidate mode refuses incomplete source and source/method pins",()=>{
  const r=spawnSync(process.execPath,[command,"--candidate-hitl"],{encoding:"utf8",input:'{"record":{"profile":"csoai.hitl-authority-effect/0.2"}}'});
  assert.equal(r.status,2);
  assert.match(r.stderr,/REVIEW REFUSED/);
});
