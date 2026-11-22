// SPDX-License-Identifier: MIT
// Read-only projection of existing Council working-group proposals and
// external charter-reference register. No authority or adoption is inferred.
import { createHash } from "node:crypto";
import { reviewBftCapabilityEvidence, HISTORICAL_BFT_EVIDENCE } from "./hf-bft-evidence.mjs";
const SHA = /^[0-9a-f]{64}$/;
const ID = /^[a-z0-9][a-z0-9-]{1,79}$/;
const hash = b => createHash("sha256").update(b).digest("hex");
function bytesAsObject(bytes,label) {
  if (!(bytes instanceof Uint8Array) && typeof bytes !== "string") throw Error(label+": exact source bytes required");
  const b = typeof bytes==="string" ? Buffer.from(bytes,"utf8") : Buffer.from(bytes);
  if (b.length>1024*1024) throw Error(label+": source exceeds bounded read");
  return {value:JSON.parse(b.toString("utf8")),sha256:hash(b)};
}
export function classifyLegacyBftObservation(value) {
  if (value?.schema!=="csoai.council-quorum-observation/0.2") throw Error("unrecognized BFT observation");
  const count=value.evaluated_vote_count;
  if (!Number.isSafeInteger(count)||count<0||!Array.isArray(value.votes) || value.votes.length!==count)
    throw Error("vote count / envelope mismatch");
  // This adapter is NOT a vote verifier. The legacy source can have simulated
  // responders or shared signing custody. Neither "true" nor a MAC proves BFT.
  return {
    review_state:"INDEPENDENT_QUORUM_NOT_VERIFIED",
    candidate_votes:count,
    claimed_bft_status:value.bft_status??"NOT_REPORTED",
    authority:"NONE",
    note:"Use an independently audited vote-identity, signing-key, fault-model and transport verifier before any authority promotion.",
  };
}
export function projectGovernanceSpine({groupsBytes, charterSourcesBytes, bftObservationBytes=null, hfBftEvidenceBytes=null, hfBftPins=HISTORICAL_BFT_EVIDENCE}) {
  const groups=bytesAsObject(groupsBytes,"working-groups"), sources=bytesAsObject(charterSourcesBytes,"charter-sources");
  if(groups.value?.schema!=="csoai.public-watchdog-working-groups/1" || !Array.isArray(groups.value.groups))
    throw Error("unrecognized working group schema");
  if(!Array.isArray(sources.value)) throw Error("unrecognized charter source register");
  const nodes=[],edges=[], groupIds=new Set(),axisIds=new Set(),sourceIds=new Set();
  for(const g of groups.value.groups) {
    if(!ID.test(g.id??"")||groupIds.has(g.id)||!Array.isArray(g.axes)) throw Error("bad or duplicate working group");
    groupIds.add(g.id);
    nodes.push({id:"wg:"+g.id,kind:"COUNCIL_WORKING_GROUP",state:"PROPOSAL_NOT_STAFFED_VERIFIED",title:g.name??g.id,
      declared_chair:Boolean(g.chair),declared_accepted_members:Array.isArray(g.acceptedMembers)?g.acceptedMembers.length:0});
    for(const axis of g.axes){
      if(!ID.test(axis??"")) throw Error("bad axis id");
      axisIds.add(axis);
      edges.push({from:"wg:"+g.id,to:"axis:"+axis,kind:"CANDIDATE_SCOPE",authority:"NONE"});
    }
  }
  for(const axis of axisIds) nodes.push({id:"axis:"+axis,kind:"GSPC_AXIS_REFERENCE",state:"MEASUREMENT_NOT_FETCHED"});
  for(const s of sources.value){
    if(!ID.test(s.id??"")||sourceIds.has(s.id)||!Array.isArray(s.groups)) throw Error("invalid charter source");
    sourceIds.add(s.id);
    nodes.push({id:"source:"+s.id,kind:"EXTERNAL_REFERENCE",state:"CITE_ONLY_NOT_ADOPTED",
      url:typeof s.url==="string"&&s.url.startsWith("https://")?s.url:null,
      retrieved_on:s.checked_on??null, mapped_status:"HUMAN_REVIEW_REQUIRED"});
    for(const id of s.groups){
      if(!groupIds.has(id)) throw Error("reference to unknown group");
      edges.push({from:"source:"+s.id,to:"wg:"+id,kind:"CANDIDATE_CROSSWALK",authority:"NONE"});
    }
  }
  const bft=bftObservationBytes===null ? {review_state:"NO_BFT_OBSERVATION_SUPPLIED",authority:"NONE"} :
    classifyLegacyBftObservation(bytesAsObject(bftObservationBytes,"bft-observation").value);
  const historicalBft=hfBftEvidenceBytes===null ? null : reviewBftCapabilityEvidence(hfBftEvidenceBytes,hfBftPins);
  if(historicalBft){
    const artifact="artifact:meok-hf-bft-20261027";
    nodes.push({id:artifact,kind:"SIGNED_HISTORICAL_CAPABILITY_EVIDENCE",state:"INTEGRITY_VALID_AUTHORITY_NOT_ESTABLISHED",
      source_sha256:historicalBft.source_sha256,issuer_binding:historicalBft.institutional_signer_binding,
      reported_outcomes:{corpora:historicalBft.track1_reported,fault_sweep:historicalBft.track2_reported,
        heldout:historicalBft.track3_reported,frontier:historicalBft.track4_reported},
      source_url:hfBftPins.url??null});
    for(const target of ["evaluation","provenance","agent-control"]){
      if(groupIds.has(target))edges.push({from:artifact,to:"wg:"+target,kind:"REVIEW_CANDIDATE",authority:"NONE"});
    }
  }
  const ids=new Set(nodes.map(n=>n.id));
  if(ids.size!==nodes.length||edges.some(e=>!ids.has(e.from)||!ids.has(e.to))) throw Error("graph referential integrity failed");
  nodes.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
  edges.sort((a,b)=>JSON.stringify(a)<JSON.stringify(b)?-1:JSON.stringify(a)>JSON.stringify(b)?1:0);
  return {schema:"csoai.governance-dependency-projection/0.1",status:"READ_ONLY_CANDIDATE",
    inputs:{groups_sha256:groups.sha256,charter_sources_sha256:sources.sha256,
      bft_observation_sha256:bftObservationBytes===null?null:hash(typeof bftObservationBytes==="string"?Buffer.from(bftObservationBytes):Buffer.from(bftObservationBytes))},
    nodes,edges,bft,historical_bft:historicalBft,controls:{
      gspc_scores_changed:false,human_authority_conferred:false,external_groups_contacted:false,
      charter_adopted:false,private_records_exposed:false
    },limitations:[
      "This is a bounded reference graph, not signed provenance, a legal crosswalk or a Palantir/Foundry integration.",
      "Chair and member metadata are declarations, not verified appointments.",
      "Source age is retained; no source is refreshed by this offline projection.",
      "No path through this graph grants action permission or changes GSPC measurement state.",
    ]};
}
