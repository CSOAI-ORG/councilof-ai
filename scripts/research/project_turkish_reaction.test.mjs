// SPDX-License-Identifier: Apache-2.0
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {projectObservedModelRun} from "./project_turkish_reaction.mjs";
const path=new URL("../../docs/research/turkish-guard-observed-20261124/record.json",import.meta.url);
const raw=readFileSync(path);
const original=JSON.parse(raw);
test("actual third-party-labelled model-run is OBSERVED but unqualified",()=>{
 const x=projectObservedModelRun(original,raw);
 assert.equal(x.episode.realm,"OBSERVED");
 assert.equal(x.episode.condition,"NO_HUMAN");
 assert.equal(x.review.status,"ACCEPTANCE_INCOMPLETE");
 assert.equal(x.review.execute_authorized,false);
 assert.equal(x.review.effect_independently_accepted,false);
 assert.equal(x.review.fresh_gspc_measurement,false);
 assert.equal(x.operating_view.independently_qualified_chains,null);
 assert.equal(x.episode.stages.executor_response.state,"UNKNOWN");
 assert.equal(x.episode.stages.human_approval.state,"UNKNOWN");
 assert.equal(x.episode.stages.receiver_verification.state,"UNKNOWN");
 assert.equal(x.observed_model_output_sha256,createHash("sha256").update(raw).digest("hex"));
});
test("counts and observed result are reconstructed from the recorded population",()=>{
 const x=projectObservedModelRun(original,raw);
 assert.deepEqual(x.confusion,{fn:62,fp:287,tn:2768,tp:255});
 assert.equal(x.sample_population,3372);
 assert.equal(original.missed_indices.length,62);
 assert.equal(original.false_alarm_indices.length,287);
 assert.equal(x.buyer_receipt,false);
});
test("fake current human authorization cannot be inferred from labels or score",()=>{
 const changed={...original,confusion:{...original.confusion,tp:317,fn:0}};
 assert.throws(()=>projectObservedModelRun(changed,Buffer.from(JSON.stringify(changed))));
});
test("tampered method SHA and model weights are refused",()=>{
 for(const mutation of [
  {method_sha256:"0".repeat(64)},
  {weights_sha256:"0".repeat(64)},
  {dataset_parquet_sha256:"0".repeat(64)},
  {dataset_revision:"main"},
  {model_revision:"main"}
 ]){
  const altered={...original,...mutation};
  assert.throws(()=>projectObservedModelRun(altered,Buffer.from(JSON.stringify(altered))));
 }
});
test("result cannot become qualified without an actual receiver and executor",()=>{
 const altered={...original,external_receiving_party_acceptance:true};
 assert.throws(()=>projectObservedModelRun(altered,Buffer.from(JSON.stringify(altered))));
 const altered2={...original,real_tool_execution_tested:true};
 assert.throws(()=>projectObservedModelRun(altered2,Buffer.from(JSON.stringify(altered2))));
});
test("reported stage digests cannot turn into a GSPC measurement",()=>{
 const x=projectObservedModelRun(original,raw);
 assert.equal(x.episode.stages.request.receipt_sha256,original.dataset_parquet_sha256);
 assert.equal(x.episode.stages.method.receipt_sha256,original.method_sha256);
 assert.equal(x.episode.stages.effect.state,"UNKNOWN");
 assert.equal(x.qualified_model_security_prevention,false);
});
