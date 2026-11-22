// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import { observeAgentBoundaries } from "./agent-boundary.mjs";
const policy={allowedAgentEdges:[["a","b"]],allowedTools:["public_lookup"],allowedEgressHosts:["example.org"]};
test("allows declared path and reports no breach, without claiming collusion absent",()=>{
 const r=observeAgentBoundaries([{actor:"a",action:"agent_message",target:"b"},{actor:"a",action:"network_egress",target:"https://example.org/x"}],policy);
 assert.equal(r.state,"NO_POLICY_BREACH_OBSERVED");
 assert.equal(r.hidden_reasoning_visibility,"NONE");
 assert.equal(r.enforcement,"NOT_CONNECTED_ADVISORY_ONLY");
});
test("flags undeclared inter-agent, tool and egress edges",()=>{
 const r=observeAgentBoundaries([
  {actor:"a",action:"agent_message",target:"c"},
  {actor:"a",action:"tool_call",target:"write_files"},
  {actor:"a",action:"network_egress",target:"https://evil.example"},
  {actor:"a",action:"authority_effect",authorisation_state:"HUMAN_DECLARED"},
 ],policy);
 assert.deepEqual(r.findings.map(f=>f.type),["UNAUTHORISED_INTER_AGENT_EDGE","UNAPPROVED_TOOL_CALL","UNAUTHORISED_EGRESS","UNVERIFIED_AUTHORITY"]);
 assert.equal(r.enforcement,"NOT_CONNECTED_ADVISORY_ONLY");
});
test("blocks invalid policy and treats non-HTTPS or credential URLs as unauthorised",()=>{
 assert.throws(()=>observeAgentBoundaries([],{...policy,allowedAgentEdges:undefined}),/required/);
 const r=observeAgentBoundaries([{actor:"a",action:"network_egress",target:"http://example.org"}],policy);
 assert.equal(r.findings[0].type,"UNAUTHORISED_EGRESS");
});
