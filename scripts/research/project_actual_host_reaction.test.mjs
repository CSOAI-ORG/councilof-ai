// SPDX-License-Identifier: Apache-2.0
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {projectHostEffect} from "./project_actual_host_reaction.mjs";
const p=new URL("../../docs/research/turkish-guard-observed-20261124/",import.meta.url);
const raw=readFileSync(new URL("actual-github-host-observation.json",p));
const doc=JSON.parse(raw);
const bytes=readFileSync(new URL("actual-github-effect.txt",p));
const method=readFileSync(new URL("./verify_actual_github_effect.py",import.meta.url));
test("real host-provider effect is reported, not imagined",()=>{
 const r=projectHostEffect(doc,raw,bytes,method);
 assert.equal(r.real_github_provider_storage_effect,true);
 assert.equal(r.episode.realm,"OBSERVED");
 assert.equal(r.episode.stages.effect.state,"REPORTED");
 assert.equal(r.episode.stages.executor_response.state,"REPORTED");
 assert.equal(r.episode.stages.retrieval.state,"REPORTED");
 assert.equal(r.review.status,"ACCEPTANCE_INCOMPLETE");
 assert.equal(r.operating_view.independently_qualified_chains,null);
 for(const id of ["human_approval","executor_authority","receiver_verification"]){
   assert.equal(r.episode.stages[id].state,"UNKNOWN");
   assert.ok(r.review.missing_stages.includes(id));
 }
});
test("provider write and readback cannot become verified human authority",()=>{
 const r=projectHostEffect(doc,raw,bytes,method);
 assert.equal(r.review.execute_authorized,false);
 assert.equal(r.review.effect_independently_accepted,false);
 assert.equal(r.verified_human_authority_established,false);
 assert.equal(r.receiving_party_human_acceptance_established,false);
 assert.equal(r.true_meok_effect_prevention_established,false);
});
test("bad returned bytes and forged receiver approval refuse",()=>{
 assert.throws(()=>projectHostEffect(doc,raw,Buffer.from("tampered"),method));
 const tampered={...doc,independent_human_receiver_accepted:true};
 assert.throws(()=>projectHostEffect(tampered,Buffer.from(JSON.stringify(tampered)),bytes,method));
 const tampered2={...doc,actual_public_http_status:404};
 assert.throws(()=>projectHostEffect(tampered2,Buffer.from(JSON.stringify(tampered2)),bytes,method));
});
test("method changed after response is not accepted",()=>{
 assert.throws(()=>projectHostEffect(doc,raw,bytes,Buffer.from("changed method")));
});
