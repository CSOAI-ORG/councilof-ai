// SPDX-License-Identifier: Apache-2.0
// The exact real observed source is ready for the EXISTING local-only CouncilOS viewer.
// This is no browser/live-site acceptance, actor authorization or GSPC admission.
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {summarizeReactionCases,renderOperatingView} from "../../measurement/experiments/reaction-bridge/operating-view.mjs";
import {evaluateEpisode} from "../../measurement/experiments/reaction-bridge/reaction-bridge.mjs";
const data=JSON.parse(readFileSync(new URL("../../docs/research/turkish-guard-observed-20261124/councilos-import.json",import.meta.url),"utf8"));
test("canonical public 3372-case source model output imports into CouncilOS reader",()=>{
 assert.equal(data.length,1);
 const ep=data[0],r=evaluateEpisode(ep),view=summarizeReactionCases(data),message=renderOperatingView(view);
 assert.equal(ep.realm,"OBSERVED");
 assert.equal(ep.condition,"NO_HUMAN");
 assert.equal(r.status,"ACCEPTANCE_INCOMPLETE");
 assert.equal(view.observed_cases,1);
 assert.equal(view.simulated_cases,0);
 assert.equal(view.independently_qualified_chains,null);
 for(const stage of ["human_approval","executor_authority","executor_response","effect","receiver_verification"]){
   assert.ok(r.missing_stages.includes(stage));
   assert.match(message,new RegExp(stage));
 }
 assert.match(message,/UNQUALIFIED INPUT/);
 assert.equal(r.fresh_gspc_measurement,false);
});
test("reported output remains nonauthorizing on every readback",()=>{
 const v=summarizeReactionCases(data);
 assert.equal(v.execute_authorized,false);
 assert.equal(v.source_authentication_established,false);
 assert.equal(v.actual_buyer_acceptance_established,false);
 assert.equal(v.independent_receiver_acceptance_established,false);
});
