// SPDX-License-Identifier: Apache-2.0
import {test} from "node:test";
import assert from "node:assert/strict";
import {summarizeReactionCases,renderOperatingView} from "./operating-view.mjs";
const H="a".repeat(64),M="b".repeat(64);
const mk=(realm,id,stages={})=>({schema:"csoai.reaction-experiment/0.1",realm,condition:"HUMAN_APPROVAL",experiment_id:"fixture",case_id:id,input_sha256:H,method_sha256:M,stages});
const stages=Object.fromEntries(["request","method","human_approval","executor_authority","executor_response","effect","receiver_verification"].map(k=>[k,{state:"REPORTED",source_realm:"OBSERVED",receipt_sha256:H}]));
test("mixed realms never become accepted",()=>{const x=summarizeReactionCases([mk("SIMULATED","s1"),mk("OBSERVED","o1")]);assert.equal(x.total_cases,2);assert.equal(x.simulated_cases,1);assert.equal(x.independently_qualified_chains,null)});
test("missing human approval remains visible",()=>assert.equal(summarizeReactionCases([mk("OBSERVED","o1",{request:stages.request})]).highest_gate.stage,"human_approval"));
test("complete reported chain remains unqualified",()=>{const x=summarizeReactionCases([mk("OBSERVED","o1",stages)]);assert.equal(x.reported_complete_chains,1);assert.equal(x.independently_qualified_chains,null);assert.equal(x.highest_gate.stage,"external_qualification")});
test("simulated effect laundered as observed rejected",()=>assert.throws(()=>summarizeReactionCases([mk("SIMULATED","s1",{effect:stages.effect})])));
test("duplicate IDs rejected",()=>assert.throws(()=>summarizeReactionCases([mk("OBSERVED","o1"),mk("OBSERVED","o1")])));
test("malformed input rejected",()=>assert.throws(()=>summarizeReactionCases([null])));
test("empty report makes no acceptance claim",()=>{const x=summarizeReactionCases([]);assert.equal(x.independently_qualified_chains,null);assert.equal(x.observed_cases,0)});
test("view has explicit unqualified/unknown labels",()=>{const s=renderOperatingView(summarizeReactionCases([mk("OBSERVED","o1",stages)]));assert.match(s,/UNQUALIFIED INPUT/);assert.match(s,/UNKNOWN/);assert.match(s,/READ ONLY/)});
test("wrong report schema refused",()=>assert.throws(()=>renderOperatingView({schema:"wrong"})));
