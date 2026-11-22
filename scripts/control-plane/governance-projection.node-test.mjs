// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import { projectGovernanceSpine, classifyLegacyBftObservation } from "./governance-projection.mjs";
const group={
  schema:"csoai.public-watchdog-working-groups/1",
  groups:[{id:"agent-control",name:"Agent control",axes:["safety","effect-binding"],chair:null,acceptedMembers:[]}]
};
const src=[{id:"safe",name:"SAFE",url:"https://github.com/OpenSecureAIAlliance/wg-safe/blob/main/CHARTER.md",
  checked_on:"2026-11-22",groups:["agent-control"],adoption:"REFERENCE_ONLY"}];
const enc=o=>JSON.stringify(o);
test("builds reproducible candidate ontology without making appointments or adoption",()=>{
 const input={groupsBytes:enc(group),charterSourcesBytes:enc(src)};
 const one=projectGovernanceSpine(input),two=projectGovernanceSpine(input);
 assert.deepEqual(one,two);
 assert.equal(one.nodes.length,4);
 assert.equal(one.edges.length,3);
 assert.equal(one.nodes.find(n=>n.id==="wg:agent-control").state,"PROPOSAL_NOT_STAFFED_VERIFIED");
 assert.equal(one.nodes.find(n=>n.id==="source:safe").state,"CITE_ONLY_NOT_ADOPTED");
 assert.equal(one.controls.human_authority_conferred,false);
 assert.equal(one.controls.gspc_scores_changed,false);
 assert.equal(one.bft.review_state,"NO_BFT_OBSERVATION_SUPPLIED");
});
test("does not elevate a claimed BFT vote or HMAC into independence",()=>{
 const bft={schema:"csoai.council-quorum-observation/0.2",evaluated_vote_count:1,
 votes:[{source:"simulated",decision:"APPROVE"}],bft_status:"VERIFIED",quorum_reached:true};
 const r=projectGovernanceSpine({groupsBytes:enc(group),charterSourcesBytes:enc(src),bftObservationBytes:enc(bft)});
 assert.equal(r.bft.review_state,"INDEPENDENT_QUORUM_NOT_VERIFIED");
 assert.equal(r.bft.authority,"NONE");
});
test("unknown endpoints and group references fail closed",()=>{
 assert.throws(()=>projectGovernanceSpine({groupsBytes:enc(group),charterSourcesBytes:enc([{...src[0],groups:["not-staffed"]}])}),/unknown group/);
 assert.throws(()=>classifyLegacyBftObservation({schema:"csoai.council-quorum-observation/0.2",evaluated_vote_count:4,votes:[]}),/mismatch/);
 assert.throws(()=>projectGovernanceSpine({groupsBytes:enc({...group,schema:"wrong"}),charterSourcesBytes:enc(src)}),/schema/);
});
