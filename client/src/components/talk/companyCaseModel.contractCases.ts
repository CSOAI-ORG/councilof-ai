import assert from "node:assert/strict";
import {
  companyCaseFailure,
  companyCaseReadFailure,
  companyCaseSessionKey,
  companyWorkspaceSelection,
  isCompanyCaseId,
  requireCommittedCompanyCase,
  requireVerifiedCompanyCase,
} from "./companyCaseModel.ts";


type Register = (name: string, work: () => void | Promise<void>) => unknown;
export function registerCompanyCaseModelContractCases(test: Register): void {
// Synthetic unit data only. This file does not submit the reserved real browser request.
const expected = { ownerSubject: "unit-owner@example.invalid", caseId: "unit-case-1" };
function fixture() {
  return {
    caseId: "unit-case-1", requestId: "unit-request-1", ownerSubject: expected.ownerSubject, request: "Synthetic unit request",
    result: { id: "unit-result-1", text: "Synthetic unit output", fetchedAt: "2026-10-12T17:00:00.000Z", sha256: "a".repeat(64), sources: [
      { title: "Synthetic source", reference: "unit-source:1", fetchedAt: "2026-10-12T17:00:00.000Z" },
    ] },
    receipt: { id: "unit-receipt-1", caseId: "unit-case-1", resultId: "unit-result-1", resultSha256: "a".repeat(64), sha256: "b".repeat(64), createdAt: "2026-10-12T17:00:01.000Z", integrity: "unsigned" },
    persistence: { merged: true, nativeReadbackVerified: true, nativeCommitId: "unit-native-head-1" },
    verification: { resultDigestVerified: true, receiptDigestVerified: true, receiptBindingVerified: true },
  };
}

test("company mode requires the explicit workspace and preserves an opaque reopen ID", () => {
  assert.deepEqual(companyWorkspaceSelection("?tab=board"), { enabled: false, invalidCase: false });
  assert.deepEqual(companyWorkspaceSelection("?workspace=company&case=case%2Funit%3A1"), { enabled: true, caseId: "case/unit:1", invalidCase: false });
});

test("owner state keys preserve the same owner and separate every different identity", () => {
  const ready = (subject: string) => ({ session: { status: "ready" as const, subject } });
  assert.equal(companyCaseSessionKey(ready("owner-a")), companyCaseSessionKey(ready("owner-a")));
  assert.notEqual(companyCaseSessionKey(ready("owner-a")), companyCaseSessionKey(ready("owner-b")));
  assert.notEqual(companyCaseSessionKey(ready("owner-a")), companyCaseSessionKey({ session: { status: "signed_out" } }));
  assert.notEqual(companyCaseSessionKey({ session: { status: "verifying" } }), companyCaseSessionKey(ready("owner-a")));
});

test("ambiguous company query cannot fall through to public Ask", () => {
  assert.deepEqual(companyWorkspaceSelection("?workspace=company&workspace=public"), { enabled: true, invalidCase: true });
  assert.deepEqual(companyWorkspaceSelection("?workspace=company&case=a&case=b"), { enabled: true, invalidCase: true });
});

test("control, empty and overlong case IDs are rejected without a reader target", () => {
  for (const id of ["", "bad\ncase", "bad\u0085case", "x".repeat(257), " padded "]) assert.equal(isCompanyCaseId(id), false);
  assert.deepEqual(companyWorkspaceSelection("?workspace=company&case=bad%0Acase"), { enabled: true, invalidCase: true });
});

test("a complete adapter-verified saved case is accepted on read and bound submit", () => {
  const value = fixture();
  assert.equal(requireCommittedCompanyCase(value, expected), value);
  assert.equal(requireCommittedCompanyCase(value, { ownerSubject: expected.ownerSubject, requestId: value.requestId, request: value.request }), value);
});

test("cross-owner, wrong case and wrong submit identity all fail closed", () => {
  const value = fixture();
  for (const constraint of [{ ...expected, ownerSubject: "other-owner@example.invalid" }, { ...expected, caseId: "other-case" }, { ...expected, requestId: "other-request" }, { ...expected, request: "other request" }]) {
    assert.throws(() => requireCommittedCompanyCase(value, constraint));
  }
});

test("pending merge, missing native readback and empty native head never become saved", () => {
  for (const patch of [{ merged: false }, { nativeReadbackVerified: false }, { nativeCommitId: "" }]) {
    const value = fixture(); Object.assign(value.persistence, patch);
    assert.throws(() => requireCommittedCompanyCase(value, expected));
  }
});

test("all three adapter digest and binding verifications are required", () => {
  for (const key of ["resultDigestVerified", "receiptDigestVerified", "receiptBindingVerified"]) {
    const value = fixture(); (value.verification as Record<string, boolean>)[key] = false;
    assert.throws(() => requireCommittedCompanyCase(value, expected));
  }
});

test("crossed receipt/result/case identities and digests cannot become saved", () => {
  for (const patch of [{ caseId: "other-case" }, { resultId: "other-result" }, { resultSha256: "c".repeat(64) }, { sha256: "bad" }, { integrity: "signed" }]) {
    const value = fixture(); Object.assign(value.receipt, patch);
    assert.throws(() => requireCommittedCompanyCase(value, expected));
  }
});

test("malformed result, sources and missing fetch times are rejected", () => {
  for (const patch of [{ text: "" }, { fetchedAt: "today" }, { sha256: "bad" }, { sources: [] }, { sources: [{ title: "unit", reference: "unit", fetchedAt: "" }] }]) {
    const value = fixture(); Object.assign(value.result, patch);
    assert.throws(() => requireCommittedCompanyCase(value, expected));
  }
});

test("transport error does not leak its private message and preserves a bounded recovery target", () => {
  const failure = companyCaseFailure({ message: "secret transport details", caseId: "unit-case-1" }, "unit-request-1");
  assert.equal(failure.outcomeUnknown, true);
  assert.equal(failure.caseId, "unit-case-1");
  assert.equal(failure.requestId, "unit-request-1");
  assert.equal(JSON.stringify(failure).includes("secret"), false);
});

test("failed recovery read does not declare an uncertain save absent or unlock automatic retry", () => {
  const failure = companyCaseReadFailure(new Error("network"), "unit-case-1", "unit-request-1");
  assert.equal(failure.outcomeUnknown, true);
  assert.equal(failure.caseId, "unit-case-1");
  assert.equal(failure.requestId, "unit-request-1");
  assert.equal(companyCaseReadFailure({ code: "not_found" }, "unit-case-1").outcomeUnknown, true);
});

test("definite client preflight rejection does not invent an uncertain write", () => {
  const failure = companyCaseFailure({ code: "invalid_request", outcomeUnknown: false }, "unit-request-1");
  assert.equal(failure.outcomeUnknown, false);
  assert.equal(failure.caseId, undefined);
  assert.match(failure.message, /could not be sent/);
});

test("explicit unknown outcome wins even when the current case read reports not found", () => {
  const failure = companyCaseFailure({ code: "not_found", caseId: "unit-case-1", outcomeUnknown: true }, "unit-request-1");
  assert.equal(failure.outcomeUnknown, true);
  assert.equal(failure.caseId, "unit-case-1");
});

test("authorization denial is distinct from persistence success", () => {
  const failure = companyCaseFailure({ code: "forbidden", caseId: "foreign-case", message: "private" }, "unit-request-1");
  assert.equal(failure.status, "failed");
  assert.equal(failure.caseId, undefined);
  assert.equal(failure.outcomeUnknown, false);
  assert.match(failure.message, /authorized account/);
  const unknown = companyCaseFailure({ code: "unauthorized", caseId: "unit-case-1", outcomeUnknown: true }, "unit-request-1");
  assert.equal(unknown.outcomeUnknown, true);
  assert.equal(unknown.caseId, "unit-case-1");
  assert.equal(unknown.requiresSignIn, true);
});


function pendingFixture(): any {
  const value: any = fixture();
  value.result.id = "proposal-result-head";
  value.receipt.id = "proposal-receipt-head";
  value.receipt.resultId = value.result.id;
  value.persistence = {
    merged: false, nativeReadbackVerified: false, proposalReadbackVerified: true,
    changeRequestId: "unit-review-request", reviewStatus: "in_review",
    proposedRecords: {
      case: { operationId: "proposal-case-op", headCommitId: "proposal-case-head", payloadSha256: "c".repeat(64) },
      result: { operationId: "proposal-result-op", headCommitId: "proposal-result-head", payloadSha256: "d".repeat(64) },
      receipt: { operationId: "proposal-receipt-op", headCommitId: "proposal-receipt-head", payloadSha256: "e".repeat(64) },
    },
  };
  value.verification.proposalReferencesVerified = true;
  return value;
}
test("a verified durable proposal is distinct from a committed save", () => {
  const value = pendingFixture();
  assert.equal(requireVerifiedCompanyCase(value, expected), value);
  assert.throws(() => requireCommittedCompanyCase(value, expected));
});
test("approved and changes-requested proposals still have no merge finality", () => {
  for (const status of ["approved", "changes_requested"]) {
    const value = pendingFixture(); value.persistence.reviewStatus = status;
    assert.equal(requireVerifiedCompanyCase(value, expected).persistence.merged, false);
    assert.throws(() => requireCommittedCompanyCase(value, expected));
  }
});
test("proposal operation and head identities must each be distinct and complete", () => {
  for (const mutate of [
    (v: any) => { v.persistence.proposedRecords.result.operationId = v.persistence.proposedRecords.case.operationId; },
    (v: any) => { v.persistence.proposedRecords.receipt.headCommitId = v.persistence.proposedRecords.case.headCommitId; },
    (v: any) => { delete v.persistence.proposedRecords.receipt; },
    (v: any) => { v.persistence.proposedRecords.result.payloadSha256 = "not-a-digest"; },
    (v: any) => { v.persistence.proposedRecords.result.id = "fabricated-native-record"; },
  ]) { const value = pendingFixture(); mutate(value); assert.throws(() => requireVerifiedCompanyCase(value, expected)); }
});
test("pending presentation IDs refer to the exact proposed result and receipt heads", () => {
  for (const mutate of [(v: any) => { v.result.id = "wrong-result"; }, (v: any) => { v.receipt.id = "wrong-receipt"; }]) {
    const value = pendingFixture(); mutate(value); assert.throws(() => requireVerifiedCompanyCase(value, expected));
  }
});
test("pending proposals cannot claim a native commit or committed readback", () => {
  for (const mutate of [
    (v: any) => { v.persistence.nativeCommitId = "invented-commit"; },
    (v: any) => { v.persistence.nativeReadbackVerified = true; },
    (v: any) => { v.persistence.nativeRecords = {}; },
    (v: any) => { v.persistence.proposalReadbackVerified = false; },
    (v: any) => { v.verification.proposalReferencesVerified = false; },
    (v: any) => { v.persistence.reviewStatus = "merged"; },
  ]) { const value = pendingFixture(); mutate(value); assert.throws(() => requireVerifiedCompanyCase(value, expected)); }
});
test("pending owner, case and receipt bindings remain mandatory", () => {
  for (const mutate of [
    (v: any) => { v.ownerSubject = "other-owner"; }, (v: any) => { v.caseId = "other-case"; },
    (v: any) => { v.receipt.resultId = "other-result"; }, (v: any) => { v.receipt.resultSha256 = "f".repeat(64); },
    (v: any) => { v.verification.receiptDigestVerified = false; },
  ]) { const value = pendingFixture(); mutate(value); assert.throws(() => requireVerifiedCompanyCase(value, expected)); }
});
test("committed values cannot retain proposal claims during promotion", () => {
  const value: any = fixture(); value.persistence.proposedRecords = pendingFixture().persistence.proposedRecords;
  assert.throws(() => requireVerifiedCompanyCase(value, expected));
  assert.equal(requireCommittedCompanyCase(fixture(), expected).persistence.merged, true);
});

}
