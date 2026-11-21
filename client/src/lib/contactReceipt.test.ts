import { describe, expect, it } from "vitest";
import { classifyContactResponse, formatRejectedContactSubmission, formatStoredContactReceipt, formatUnconfirmedContactSubmission } from "./contactReceipt";

describe("contact receipt is bound to the submitted revision", () => {
  const receipt = "a1b2c3";
  const mailbox = "contact@csoai.org";

  it("confirms the unchanged submitted form but not notification or acceptance", () => {
    const text = formatStoredContactReceipt(receipt, true, mailbox);
    expect(text).toContain("Stored with reference a1b2c3.");
    expect(text).toContain("No email notification was sent.");
    expect(text).toContain("contact@csoai.org");
    expect(text).not.toContain("subsequent edits");
    expect(text).not.toMatch(/accepted|payment received|appointment booked/i);
  });

  it("does not claim subsequent edits were saved under an older receipt", () => {
    const text = formatStoredContactReceipt(receipt, false, mailbox);
    expect(text).toContain("earlier version");
    expect(text).toContain("a1b2c3");
    expect(text).toContain("your subsequent edits were not submitted");
    expect(text).toContain("Submit again");
    expect(text).toContain("No email notification was sent.");
  });

  it("does not convert a lost response into a false claim that nothing reached storage", () => {
    const text = formatUnconfirmedContactSubmission(mailbox);
    expect(text).toContain("storage are unconfirmed");
    expect(text).toContain("may have reached the server");
    expect(text).toContain("do not assume it failed");
    expect(text).toContain(mailbox);
    expect(text).not.toMatch(/nothing was sent|not stored|failed to store/i);
  });

  it("accepts only a 202 with the expected stored receipt shape", () => {
    const id = "4c6a4ca0-197b-423d-8341-1f77d6eb40ba";
    expect(classifyContactResponse(202, { stored: true, receipt_id: id })).toEqual({ kind: "stored", receiptId: id });
    expect(classifyContactResponse(200, { stored: true, receipt_id: id })).toEqual({ kind: "unknown" });
    expect(classifyContactResponse(202, { stored: true, receipt_id: "unverified" })).toEqual({ kind: "unknown" });
  });

  it("calls a known pre-write rejection rejected, not a failed KV write", () => {
    expect(classifyContactResponse(400, { stored: false, code: "INVALID_FIELD" })).toEqual({ kind: "rejected", code: "INVALID_FIELD" });
    expect(classifyContactResponse(503, { stored: false, code: "INTAKE_UNAVAILABLE" })).toEqual({ kind: "rejected", code: "INTAKE_UNAVAILABLE" });
    expect(classifyContactResponse(503, { stored: false, code: "STORAGE_FAILED" })).toEqual({ kind: "unknown" });
    expect(classifyContactResponse(400, { stored: false, code: "STORAGE_FAILED" })).toEqual({ kind: "unknown" });
    expect(formatRejectedContactSubmission(mailbox)).toContain("rejected this attempt before storage");
  });

  it("fails closed on malformed and mismatched responses", () => {
    for (const value of [null, "", [], { stored: true }, { stored: false }, { stored: false, code: "UNRECOGNISED" }]) {
      expect(classifyContactResponse(202, value)).toEqual({ kind: "unknown" });
    }
    expect(classifyContactResponse(200, { stored: false, code: "INVALID_FIELD" })).toEqual({ kind: "unknown" });
    expect(classifyContactResponse(500, { stored: false, code: "INVALID_FIELD" })).toEqual({ kind: "unknown" });
  });
});
