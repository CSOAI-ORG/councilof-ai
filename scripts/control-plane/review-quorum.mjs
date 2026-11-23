// SPDX-License-Identifier: MIT
// Advisory quorum accounting across an authenticated external-verifier boundary.
// NEVER grants authority or dispatches external reviewers itself.
const SHA = /^[0-9a-f]{64}$/;
export function reviewQuorumCandidate({ subject_sha256, minimum_distinct_reviewers = 2, receipts }, verifyReceipt) {
  if (!SHA.test(subject_sha256 ?? "") || !Number.isSafeInteger(minimum_distinct_reviewers) ||
      minimum_distinct_reviewers < 2 || !Array.isArray(receipts) || typeof verifyReceipt !== "function")
    throw new Error("exact revision, distinct quorum and external receipt-verifier required");
  const seen = new Set(), tallies={APPROVE:0, HOLD:0, REJECT:0};
  const excluded=[], counted=[];
  for (let i=0;i<receipts.length;i++) {
    // The consumer supplies a verifier that MUST validate signature, signer binding, role,
    // receipt expiry, conflict, acceptance, and the precise case revision. A boolean
    // carried in the submitted receipt is NOT an authority or signature check.
    let v;
    try { v=verifyReceipt(receipts[i]); } catch {excluded.push({index:i,reason:"VERIFIER_FAILURE"});continue;}
    if (!v || v.signature_state!=="VALID" || v.role_state!=="AUTHORISED" ||
        v.acceptance_state!=="ACCEPTED" || v.conflict_state!=="CLEAR" ||
        v.case_sha256!==subject_sha256 || !["APPROVE","HOLD","REJECT"].includes(v.decision) ||
        typeof v.reviewer_id!=="string" || !v.reviewer_id) {
      excluded.push({index:i,reason:"NOT_VERIFIED_FOR_CASE"});continue;
    }
    if(seen.has(v.reviewer_id)){excluded.push({index:i,reason:"DUPLICATE_REVIEWER"});continue;}
    seen.add(v.reviewer_id);tallies[v.decision]++;counted.push({index:i,reviewer_id:v.reviewer_id,decision:v.decision});
  }
  const consensus=Object.entries(tallies).find(([,n])=>n>=minimum_distinct_reviewers)?.[0] ?? null;
  return {
    schema:"csoai.review-quorum-candidate/0.1",subject_sha256,minimum_distinct_reviewers,
    counted,excluded,tallies,
    state:consensus?"QUORUM_EVIDENCE_CANDIDATE":"INSUFFICIENT_VERIFIED_REVIEWERS",
    recommendation:consensus,
    binding_authority:"NONE",
    action_executed:false,
    external_working_groups_notified:false,
    limitations:["Verifier trust, credential custody, independence and revocation must be externally tested.",
      "No quorum observation can execute, sign, publish, dispatch or override the existing authority-effect contract."],
  };
}
