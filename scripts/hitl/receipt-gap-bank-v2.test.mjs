import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runEvidenceGap, runBankV2, deriveV2 } from "./receipt-gap-bank-v2.mjs";
import { runTrial } from "../../harness/hitl/approval-effect-demo.mjs";

describe("HITL v2 incompletely observed effects", () => {
  it("preserves effect bytes and says UNCHECKABLE when a receipt disappears", () => {
    const c = runEvidenceGap("effect_present_receipt_missing");
    assert.equal(c.observed.state, "UNCHECKABLE");
    assert.equal(c.observed.reason, "EFFECT_PRESENT_RECEIPT_MISSING");
    assert.equal(c.remaining_effect_sha256, c.original_effect_sha256);
  });
  it("does not infer successful delivery from a receipt without effect bytes", () => {
    const c = runEvidenceGap("receipt_present_effect_missing");
    assert.equal(c.observed.state, "UNCHECKABLE");
    assert.equal(c.observed.reason, "RECEIPT_PRESENT_EFFECT_MISSING");
    assert.equal(c.remaining_effect_sha256, null);
  });
  it("runs 16 predeclared synthetic cases with explicit separated denominators", () => {
    const bank = runBankV2();
    assert.equal(bank.denominator.all_cases, 16);
    assert.equal(bank.denominator.authorization_refusal_controls, 13);
    assert.equal(bank.denominator.post_execution_evidence_gap_controls, 2);
    assert.equal(bank.outcomes.incomplete_evidence_UNCHECKABLE, 2);
    assert.equal(bank.cases.length, 16);
    assert.equal(bank.claim_limits.human_identity, "NOT_ESTABLISHED");
    assert.equal(bank.claim_limits.human_approval, "NOT_TESTED");
    assert.equal(bank.claim_limits.gspc_axis_admission, false);
  });
  it("refuses relabelling an observed effect as NO_EFFECT", () => {
    const a = runTrial();
    const gaps = ["effect_present_receipt_missing","receipt_present_effect_missing"].map(runEvidenceGap);
    gaps[0].observed.state = "NO_EFFECT";
    assert.throws(() => deriveV2(a,gaps), /not discriminating/);
  });
  it("rejects missing control and a false success in the negative controls", () => {
    const a = runTrial();
    const gaps = ["effect_present_receipt_missing","receipt_present_effect_missing"].map(runEvidenceGap);
    assert.throws(() => deriveV2(a, gaps.slice(0,1)),/denominator/);
    const altered = structuredClone(a);
    altered.cases.find(c=>c.scenario==="expired").execution="EXECUTED";
    assert.throws(() => deriveV2(altered,gaps),/v1 control result changed/);
  });
  it("rejects a duplicate v1 scenario even if all 13 refusal outcomes still appear valid", () => {
    const a=runTrial();
    const gaps=["effect_present_receipt_missing","receipt_present_effect_missing"].map(runEvidenceGap);
    const missing=a.cases.find(c=>c.scenario==="revoked");
    const substitute=a.cases.find(c=>c.scenario==="expired");
    Object.assign(missing, structuredClone(substitute));
    // Old validator merely counted 13 denials; this mutation still supplies 13 DENIED outcomes.
    assert.equal(a.cases.filter(c=>c.execution==="DENIED").length,13);
    assert.throws(()=>deriveV2(a,gaps),/scenario identity mismatch/);
  });
  it("rejects an unknown v1 scenario replacing one expected denial", () => {
    const a=runTrial();
    const gaps=["effect_present_receipt_missing","receipt_present_effect_missing"].map(runEvidenceGap);
    a.cases.find(c=>c.scenario==="wrong_scope").scenario="invented_case";
    assert.throws(()=>deriveV2(a,gaps),/scenario identity mismatch/);
  });
  it("refuses a success claim when replay denial is absent", () => {
    const a=runTrial();
    const gaps=["effect_present_receipt_missing","receipt_present_effect_missing"].map(runEvidenceGap);
    a.cases.find(c=>c.scenario==="pass").replay="EXECUTED";
    assert.throws(()=>deriveV2(a,gaps),/v1 control result changed/);
  });
  it("rejects any fabricated institutional review", () => {
    const a = runTrial();
    const gaps=["effect_present_receipt_missing","receipt_present_effect_missing"].map(runEvidenceGap);
    a.independent_review="CONDUCTED";
    assert.throws(()=>deriveV2(a,gaps),/v1 precondition/);
  });
});

