import { describe, expect, it } from "vitest";
import { BUYING_ENQUIRIES, BUYING_LINES, CONTACT_MAILBOX } from "./buying";
import * as api from "../../../functions/api/_buying";
import { enquiryPreset, prepareEnquiry, prepareContactEmail, PILOT_SUBJECT } from "./pilotEnquiry";

describe("existing invoice products: buying answer to email draft", () => {
  it("keeps the client and API product links and buying words identical", () => {
    expect(api.BUYING_ENQUIRIES).toEqual(BUYING_ENQUIRIES);
    expect(api.BUYING_LINES).toEqual(BUYING_LINES);
  });

  for (const product of BUYING_ENQUIRIES) {
    it(`prepares a scoped, sendable enquiry from the ${product.product} buying link`, () => {
      const link = new URL(product.href, "https://councilof.ai");
      expect(link.pathname).toBe("/contact/");
      expect(api.buyingAnswer()).toContain(`https://councilof.ai${product.href}`);
      const preset = enquiryPreset(link.search)!;
      expect(preset.subject).toContain(product.label);
      for (const field of ["Public output URL or subject", "Date, period or history", "Organisation", "Billing contact", "Existing invoice reference"])
        expect(preset.message).toContain(field);
      const validatedDraft = prepareEnquiry({ name: "Buyer", email: "buyer@example.org", ...preset });
      expect(validatedDraft.body).toContain(preset.message);
      const draft = prepareContactEmail({ name: "Buyer", email: "buyer@example.org", ...preset });
      expect(draft.mailto).not.toBeNull();
      const uri = new URL(draft.mailto!);
      expect(uri.pathname).toBe(CONTACT_MAILBOX);
      expect(uri.searchParams.get("subject")).toBe(preset.subject);
      expect(uri.searchParams.get("body")).toContain(preset.message.replace(/\n/g, "\r\n"));
      expect(preset.message).toContain("enquiry, not a purchase or a booked fresh measurement");
    });
  }

  it("rejects missing, unknown and prototype-named invoice products", () => {
    for (const product of ["", "fresh-run", "constructor", "__proto__", "https://example.org"])
      expect(enquiryPreset(`?arm=invoice&product=${encodeURIComponent(product)}`)).toBeNull();
  });

  it("takes no recipient, scope or organisation from query parameters", () => {
    const preset = enquiryPreset("?arm=invoice&product=art50&to=evil@example.org&subject=override&organisation=Private%20Org")!;
    expect(preset.subject).toBe("Article 50 pack — written scope and invoice enquiry");
    expect(preset.message).not.toMatch(/evil@example|override|Private Org/);
    const draft = prepareContactEmail({ name: "Buyer", email: "buyer@example.org", ...preset });
    expect(new URL(draft.mailto!).pathname).toBe(CONTACT_MAILBOX);
  });

  it("preserves the existing enquiry arms and unknown-query behavior", () => {
    expect(enquiryPreset("?arm=pilot")?.subject).toBe(PILOT_SUBJECT);
    expect(enquiryPreset("?arm=run")?.subject).toBe("Run / re-attest enquiry");
    expect(enquiryPreset("?arm=data")?.subject).toBe("Data enquiry");
    expect(enquiryPreset("?arm=ledger")?.subject).toBe("Ledger enquiry");
    expect(enquiryPreset("?arm=unknown")).toBeNull();
    expect(enquiryPreset("")).toBeNull();
  });

  it("retains the full enquiry in copy recovery when a completed draft is too long for mailto", () => {
    const preset = enquiryPreset("?arm=invoice&product=evidence-bundle")!;
    const message = preset.message + "\n" + "Detailed scope. ".repeat(180);
    const draft = prepareContactEmail({ name: "Buyer", email: "buyer@example.org", subject: preset.subject, message });
    expect(draft.mailto).toBeNull();
    expect(draft.copyText).toContain(message);
  });

  it("states the send boundary and keeps fresh booking and verification truthful", () => {
    const answer = api.buyingAnswer();
    expect(answer).toContain("You must send it from your email app");
    expect(answer).toContain("does not send, book or pay");
    expect(answer).toContain("Checking a result is free");
    expect(answer).toContain("booking is not live");
    expect(answer).not.toMatch(/[£$€]\s?\d/);
    expect(answer).not.toMatch(/guarantee|certif/i);
  });
});
