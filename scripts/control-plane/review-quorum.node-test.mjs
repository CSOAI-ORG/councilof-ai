// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import { reviewQuorumCandidate } from "./review-quorum.mjs";
const d="d".repeat(64);
const good=(id,decision="HOLD")=>({reviewer_id:id,case_sha256:d,decision,signature_state:"VALID",
 role_state:"AUTHORISED",acceptance_state:"ACCEPTED",conflict_state:"CLEAR"});
test("two distinct externally verified humans yield a non-binding candidate",()=>{
 const r=reviewQuorumCandidate({subject_sha256:d,receipts:[good("one"),good("two")]},x=>x);
 assert.equal(r.state,"QUORUM_EVIDENCE_CANDIDATE");
 assert.equal(r.recommendation,"HOLD");
 assert.equal(r.binding_authority,"NONE");
 assert.equal(r.action_executed,false);
 assert.equal(r.external_working_groups_notified,false);
});
test("duplicate signer, conflict and wrong revision cannot satisfy quorum",()=>{
 const r=reviewQuorumCandidate({subject_sha256:d,receipts:[good("one"),good("one"),{...good("two"),conflict_state:"UNKNOWN"},good("three","APPROVE"),{...good("four"),case_sha256:"a".repeat(64)}]},x=>x);
 assert.equal(r.state,"INSUFFICIENT_VERIFIED_REVIEWERS");
 assert.equal(r.excluded.length,3);
 assert.equal(r.tallies.HOLD,1);
});
test("verifier is mandatory and a failed verification is not counted",()=>{
 assert.throws(()=>reviewQuorumCandidate({subject_sha256:d,receipts:[]}),/verifier/);
 const r=reviewQuorumCandidate({subject_sha256:d,receipts:[good("one")]},()=>{throw new Error("invalid signing key")});
 assert.equal(r.counted.length,0);
 assert.equal(r.excluded[0].reason,"VERIFIER_FAILURE");
});
