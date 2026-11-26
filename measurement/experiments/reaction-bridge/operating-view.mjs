// SPDX-License-Identifier: Apache-2.0
// Offline read-only operating view. No producer, signer, scheduler, model, verifier or executor.
import { evaluateEpisode } from "./reaction-bridge.mjs";
const PRIORITY=["human_approval","executor_authority","executor_response","effect","receiver_verification","method","request"];
const ROLES={human_approval:"HITL authority owner",executor_authority:"executor authority owner",executor_response:"technical operator",effect:"effect observer",receiver_verification:"receiving-party verifier",method:"measurement-method owner",request:"request owner"};
export function summarizeReactionCases(cases) {
  if(!Array.isArray(cases)||cases.length>64)throw new Error("bounded case array required");
  const seen=new Set(),out=[];
  for(const caseData of cases) {
    const reviewed=evaluateEpisode(caseData);
    const key=reviewed.experiment_id+":"+reviewed.case_id;
    if(seen.has(key))throw new Error("duplicate experiment case");
    seen.add(key);
    out.push({experiment_id:reviewed.experiment_id,case_id:reviewed.case_id,realm:reviewed.realm,status:reviewed.status,missing:reviewed.missing_stages,failed:reviewed.failed_stages});
  }
  out.sort((a,b)=>(a.experiment_id+":"+a.case_id).localeCompare(b.experiment_id+":"+b.case_id));
  const observed=out.filter(c=>c.realm==="OBSERVED");
  const gate=PRIORITY.find(k=>observed.some(c=>c.missing.includes(k)))||"external_qualification";
  return {
    schema:"csoai.reaction-operating-view/0.1",
    view_only:true, source_authentication_established:false, execute_authorized:false,
    independent_receiver_acceptance_established:false, actual_buyer_acceptance_established:false,
    total_cases:out.length, simulated_cases:out.length-observed.length, observed_cases:observed.length,
    reported_complete_chains:observed.filter(c=>c.status==="REPORTED_CHAIN_NEEDS_EXTERNAL_QUALIFICATION").length,
    independently_qualified_chains:null,
    highest_gate:{stage:gate,role:ROLES[gate]||"independent reviewer and receiving-party owner",owner_acknowledged:false},
    cases:out,
  };
}
export function renderOperatingView(view) {
  if(!view||view.schema!=="csoai.reaction-operating-view/0.1")throw new Error("wrong view schema");
  return [
    "# Council operating acceptance view — UNQUALIFIED INPUT",
    "Research-only view of reported pointers. Not a source authentication, human decision, accepted execution, GSPC measurement, paid delivery or live uptime probe.",
    "- cases: "+view.total_cases+"; observed-labelled: "+view.observed_cases+"; simulated-labelled: "+view.simulated_cases,
    "- complete reported chains: "+view.reported_complete_chains+"; independently qualified: UNKNOWN",
    "- highest missing gate: "+view.highest_gate.stage+"; responsible role: "+view.highest_gate.role+"; owner ACKNOWLEDGEMENT UNKNOWN",
    ...view.cases.map(c=>"- "+c.experiment_id+"/"+c.case_id+" ["+c.realm+"] "+c.status+"; missing: "+(c.missing.join(", ")||"none reported")+"; failed: "+(c.failed.join(", ")||"none")),
    "READ ONLY. No source, sender, signer, scheduler, model or executor action taken."
  ].join("\n");
}
