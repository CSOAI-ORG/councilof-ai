import { describe, expect, it } from "vitest";
import { BUY_INTENT, buyingAnswer, BUYING_LINES, CONTACT_MAILBOX } from "./_buying";
import { INVOICE_CONTACT } from "./_invoice_handoff";

describe("chat: how to buy", () => {
  it("matches buying questions", () => {
    for (const q of [
      "How do I buy?",
      "can you invoice an EU company",
      "I need to add our VAT number",
      "Do you accept a purchase order?",
      "procurement process",
      "how can we pay",
      "Can I get a quote for a run?",
      "billing contact",
    ])
      expect(BUY_INTENT.test(q), q).toBe(true);
  });
  it("does not swallow ordinary questions that share a word", () => {
    for (const q of ["Which number do I quote for the board?", "in order to verify a card", "what order are the axes in", "how did safety measure"])
      expect(BUY_INTENT.test(q), q).toBe(false);
  });
  it("answers with the one statement and the one mailbox, and no price", () => {
    const a = buyingAnswer();
    for (const line of BUYING_LINES) expect(a).toContain(line);
    expect(CONTACT_MAILBOX).toBe(INVOICE_CONTACT);
    expect(a).toContain("/faq/#buying");
    expect(a).not.toMatch(/[£$€]\s?\d/);
  });
});
