// SPDX-License-Identifier: Apache-2.0
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {projectHitlCandidateV02 as project} from "./hitl-candidate-projection.mjs";
import {evaluateEpisode} from "./reaction-bridge.mjs";
const example=JSON.parse(readFileSync(new URL("../../../docs/standards/osaia-safe-reverification/hitl-authority-effect-v0.2.example.json",import.meta.url),"utf8"));
const H="a".repeat(64);
test("real source-format candidate remains unqualified even with self-described VERIFIED",()=>{
  const ep=project({record:example,experiment_id:"canonical-candidate",case_id:"example-1",
    realm:"SIMULATED",condition:"HUMAN_APPROVAL",input_sha256:H,method_sha256:H});
  const review=evaluateEpisode(ep);
  assert.equal(review.status,"SIMULATION_ONLY");
  assert.equal(review.execute_authorized,false);
  assert.equal(review.effect_independently_accepted,false);
  assert.equal(ep.stages.receiver_verification.state,"UNKNOWN");
  assert.equal(ep.stages.executor_authority.state,"UNKNOWN");
});
test("a v0.2 example requiring explicit external receipts still never authorizes",()=>{
  const ep=project({record:example,experiment_id:"canonical-candidate",case_id:"example-2",
    realm:"OBSERVED",condition:"HUMAN_APPROVAL",input_sha256:H,method_sha256:H,
    executor_authority_receipt_sha256:H,receiver_receipt_sha256:H});
  const review=evaluateEpisode(ep);
  assert.equal(review.status,"REPORTED_CHAIN_NEEDS_EXTERNAL_QUALIFICATION");
  assert.equal(review.execute_authorized,false);
  assert.equal(review.human_identity_qualified,false);
  assert.equal(review.effect_independently_accepted,false);
});
