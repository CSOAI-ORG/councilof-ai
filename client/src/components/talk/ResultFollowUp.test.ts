import { describe, expect, it } from "vitest";
import { MEOK_ENQUIRY_URL, meokBrief, companyMeokBrief } from "./ResultFollowUp";
import type { CommittedCompanyCase, PendingCompanyCase } from "./companyCaseModel";

const tool = (url: string | null, state = "UNCHECKABLE") => ({
  id: "read-1", name: "get_card", argsText: "{}", status: "done" as const,
  label: state, citation: { tool: "get_card", record_id: "native-record-1", url },
});

describe("manual result-to-MEOK enquiry", () => {
  it("retains the asked task and native record state without asserting verification", () => {
    const question = "Prepare an artifact from <literal text> & keep the limits.";
    const brief = meokBrief({ question, tools: [tool("https://councilof.ai/cards/record.json")] });
    expect(brief).toContain(question);
    expect(brief).toContain("Record: native-record-1");
    expect(brief).toContain("state: UNCHECKABLE");
    expect(brief).toContain("Returned Council reference: https://councilof.ai/cards/record.json");
    expect(brief).toContain("not independently verified here");
    expect(brief).toContain("Please agree written scope, quote, delivery and acceptance terms before work starts.");
  });

  it("does not invent missing record identifiers, URLs or states", () => {
    const brief = meokBrief({ question: "Task", tools: [{ id: "t", name: "board_totals", argsText: "{}", status: "done" }] });
    expect(brief).toContain("state: not supplied");
    expect(brief).not.toContain("  Record:");
    expect(brief).not.toContain("  Returned Council reference:");
  });

  it.each([
    "https://private.example/record",
    "https://councilof.ai:8443/record",
    "http://councilof.ai/record",
    "https://councilof.ai.evil.example/record",
    "https://user:password@councilof.ai/record",
    "javascript:alert(1)",
    "/relative-record",
  ])("does not put an unqualified URL in the brief: %s", (url) => {
    const brief = meokBrief({ question: "Task", tools: [tool(url)] });
    expect(brief).not.toContain("  Returned Council reference:");
    expect(brief).toContain("Record: native-record-1");
  });

  it("keeps failure states and distinct native references separate", () => {
    const first = tool("https://councilof.ai/api/gspc", "UNREACHABLE");
    const second = { ...tool(null, "NOT_MEASURED"), id: "read-2", citation: { tool: "get_card", record_id: "native-record-2", url: null } };
    const brief = meokBrief({ question: "Task", tools: [first, second] });
    expect(brief).toContain("state: UNREACHABLE");
    expect(brief).toContain("state: NOT_MEASURED");
    expect(brief).toContain("Record: native-record-1");
    expect(brief).toContain("Record: native-record-2");
  });

  it("opens the existing enquiry without transmitting task or result data in the URL", () => {
    const url = new URL(MEOK_ENQUIRY_URL);
    expect(url.origin + url.pathname).toBe("https://meok.ai/request-job");
    expect(url.search).toBe("");
    expect(url.hash).toBe("");
    expect(url.username).toBe("");
  });
});


const committedCase = (): CommittedCompanyCase => ({
  caseId: "company-case-exact", requestId: "company-request-exact", ownerSubject: "private-owner@example.invalid",
  request: "Literal GSPC request <company> & café",
  result: {
    id: "native-result-exact", text: "DISPLAY_ONLY_SENTINEL [Display shortened; full saved result remains bound.]",
    fetchedAt: "2026-10-14T20:00:00Z", sha256: "A".repeat(64),
    sources: [
      { title: "Fetched source", reference: "literal source <one> & café", fetchedAt: "2026-10-14T19:59:00Z", sha256: "C".repeat(64) },
      { title: "Recorded source", reference: "native library reference", recordedAt: "2026-10-14T19:58:00Z" },
    ],
  },
  receipt: { id: "native-receipt-exact", caseId: "company-case-exact", resultId: "native-result-exact", resultSha256: "a".repeat(64), sha256: "b".repeat(64), createdAt: "2026-10-14T20:00:01Z", integrity: "unsigned" },
  persistence: { merged: true, nativeReadbackVerified: true, nativeCommitId: "native-case-readback-exact" },
  verification: { resultDigestVerified: true, receiptDigestVerified: true, receiptBindingVerified: true },
});

const pendingCase = (reviewStatus: PendingCompanyCase["persistence"]["reviewStatus"]): PendingCompanyCase => {
  const value = committedCase();
  return {
    ...value,
    result: { ...value.result, id: "proposed-result-head" },
    receipt: { ...value.receipt, id: "proposed-receipt-head", resultId: "proposed-result-head" },
    persistence: {
      merged: false, nativeReadbackVerified: false, proposalReadbackVerified: true, changeRequestId: "native-review-request", reviewStatus,
      proposedRecords: {
        case: { operationId: "case-op", headCommitId: "case-head", payloadSha256: "d".repeat(64) },
        result: { operationId: "result-op", headCommitId: "proposed-result-head", payloadSha256: "e".repeat(64) },
        receipt: { operationId: "receipt-op", headCommitId: "proposed-receipt-head", payloadSha256: "f".repeat(64) },
      },
    },
    verification: { ...value.verification, proposalReferencesVerified: true },
  };
};

describe("manual merged Company-case enquiry", () => {
  it("copies exact bound identifiers and distinct original JSON digests without display or owner data", () => {
    const value = committedCase();
    const brief = companyMeokBrief(value, value.ownerSubject);
    for (const line of [
      value.request, "Case: " + value.caseId, "Request reference: " + value.requestId,
      "Native result record: " + value.result.id, "Original saved result JSON SHA-256: " + value.result.sha256,
      "Result source fetch time: " + value.result.fetchedAt,
      "Native receipt record: " + value.receipt.id, "Original saved receipt JSON SHA-256: " + value.receipt.sha256,
      "Receipt case binding: " + value.receipt.caseId, "Receipt result binding: " + value.receipt.resultId,
      "Receipt bound result JSON SHA-256: " + value.receipt.resultSha256, "Receipt created: " + value.receipt.createdAt,
      "Native case readback commit: " + value.persistence.nativeCommitId,
    ]) expect(brief).toContain(line);
    expect(brief).not.toContain(value.result.text);
    expect(brief).not.toContain("DISPLAY_ONLY_SENTINEL");
    expect(brief).not.toContain(value.ownerSubject);
    expect(brief).toContain("Unsigned integrity receipt.");
    expect(brief).toContain("Digests identify the saved JSON bytes, not this editable brief.");
    expect(brief).toContain("This does not establish a signer, independent measurement, commissioning, payment, MEOK access or customer acceptance.");
    expect(brief).toContain("Nothing has been sent.");
  });

  it("keeps actual fetched and recorded dates distinct and omits an absent source digest", () => {
    const value = committedCase();
    const brief = companyMeokBrief(value, value.ownerSubject);
    expect(brief).toContain("- Source: Fetched source\n  Reference: literal source <one> & café\n  Fetched: 2026-10-14T19:59:00Z\n  Source SHA-256: " + "C".repeat(64));
    expect(brief).toContain("- Source: Recorded source\n  Reference: native library reference\n  Recorded: 2026-10-14T19:58:00Z\n\n");
    expect(brief.match(/  Source SHA-256:/g)).toHaveLength(1);
    expect(brief).not.toContain("undefined");
    expect(brief).toContain("A source fetch time alone is not proof of a fresh measurement.");
  });

  it.each(["in_review", "changes_requested", "approved"] as const)("refuses a valid %s proposal rather than inventing merged identifiers", (status) => {
    const value = pendingCase(status);
    expect(() => companyMeokBrief(value, value.ownerSubject)).toThrow("The case is awaiting review.");
  });

  it("refuses an externally supplied different owner", () => {
    expect(() => companyMeokBrief(committedCase(), "other-owner@example.invalid")).toThrow("The saved case identity could not be verified.");
  });

  it("refuses crossed receipt case, result and result-digest bindings", () => {
    const value = committedCase();
    for (const receipt of [
      { ...value.receipt, caseId: "crossed-case" },
      { ...value.receipt, resultId: "crossed-result" },
      { ...value.receipt, resultSha256: "f".repeat(64) },
    ]) expect(() => companyMeokBrief({ ...value, receipt }, value.ownerSubject)).toThrow();
  });

  it("refuses false native readback and digest/binding verification flags", () => {
    const value = committedCase();
    expect(() => companyMeokBrief({ ...value, persistence: { ...value.persistence, nativeReadbackVerified: false } }, value.ownerSubject)).toThrow();
    for (const verification of [
      { ...value.verification, resultDigestVerified: false },
      { ...value.verification, receiptDigestVerified: false },
      { ...value.verification, receiptBindingVerified: false },
    ]) expect(() => companyMeokBrief({ ...value, verification }, value.ownerSubject)).toThrow();
  });
});
