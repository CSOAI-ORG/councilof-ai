import { describe, expect, it } from "vitest";
import { formatStoredContactReceipt, formatUnconfirmedContactSubmission } from "./contactReceipt";

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
});
