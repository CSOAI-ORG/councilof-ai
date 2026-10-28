import { describe, expect, it } from "vitest";
import { BUYING_ENQUIRIES, BUYING_LINES, CONTACT_MAILBOX } from "./buying";
import * as api from "../../../functions/api/_buying";
import { enquiryPreset, prepareEnquiry, prepareContactEmail, PILOT_SUBJECT, wrapperEnquiryHref } from "./pilotEnquiry";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

describe("SovX selected-pair enquiry handoff", () => {
  const observed = "2026-09-14T10:51:51.468Z";
  const fields = { name: "Buyer", email: "buyer@example.org" };
  const presetFor = (pair: string, asOf = observed) => enquiryPreset(new URL(wrapperEnquiryHref(pair, asOf), "https://councilof.ai").search)!;

  it("carries the selected pair, dated record and scope through a sendable email draft", () => {
    const preset = presetFor("usdc.e:arbitrum");
    expect(preset.subject).toBe("SovX evidence enquiry — usdc.e:arbitrum");
    expect(preset.message).toContain("Pair: usdc.e:arbitrum");
    expect(preset.message).toContain("https://councilof.ai/w/usdc.e%3Aarbitrum");
    expect(preset.message).toContain(observed);
    for (const field of ["Required dates or history:", "What will you use the evidence for?", "Required output:", "Organisation:"])
      expect(preset.message).toContain(field);
    const draft = prepareContactEmail({ ...fields, ...preset });
    expect(draft.mailto).not.toBeNull();
    const email = new URL(draft.mailto!);
    expect(email.pathname).toBe(CONTACT_MAILBOX);
    expect(email.searchParams.get("subject")).toBe(preset.subject);
    expect(email.searchParams.get("body")).toContain(preset.message.replace(/\n/g, "\r\n"));
    expect(preset.message).toContain("enquiry, not a purchase or a booked fresh measurement");
  });

  it("preserves every actual published pair and its source observation date", () => {
    const ledger = JSON.parse(readFileSync(resolve(__dirname, "../../../public/interop/wrapped-asset-parity-latest.json"), "utf8"));
    for (const record of ledger.records) {
      const preset = presetFor(record.id, ledger.as_of);
      expect(preset.message).toContain(`Pair: ${record.id}\n`);
      expect(preset.message).toContain(`Published record: https://councilof.ai/w/${encodeURIComponent(record.id)}\n`);
      expect(preset.message).toContain(`Ledger observation date to confirm: ${ledger.as_of}\n`);
    }
  });

  it.each(["", "x".repeat(97) + ":base", "usdc.e:arbitrum\nBcc:attacker", "usdc.e:arbitrum&to=evil", "https://example.org", "../usdc:base"])("falls back for malformed pair %j", (pair) => {
    expect(wrapperEnquiryHref(pair, observed)).toBe("/contact/?arm=ledger");
    expect(enquiryPreset(`?arm=ledger&pair=${encodeURIComponent(pair)}&as_of=${encodeURIComponent(observed)}`)).toEqual(enquiryPreset("?arm=ledger"));
  });

  it.each(["", "2026-02-30T10:51:51.468Z", "2026-09-14", "2026-09-14T10:51:51.468Z\nBcc:attacker", "2026-09-14T10:51:51.468Z" + "x".repeat(500)])("falls back for malformed observation date %j", (date) => {
    expect(wrapperEnquiryHref("usdc.e:arbitrum", date)).toBe("/contact/?arm=ledger");
    expect(enquiryPreset(`?arm=ledger&pair=usdc.e%3Aarbitrum&as_of=${encodeURIComponent(date)}`)).toEqual(enquiryPreset("?arm=ledger"));
  });

  it("ignores query-supplied recipient, subject and record URL", () => {
    const link = new URL(wrapperEnquiryHref("usdc.e:arbitrum", observed), "https://councilof.ai");
    link.searchParams.set("to", "evil@example.org");
    link.searchParams.set("subject", "override");
    link.searchParams.set("record", "https://example.org/fake");
    const preset = enquiryPreset(link.search)!;
    expect(preset.message).not.toMatch(/evil@example|override|example.org\/fake/);
    expect(new URL(prepareContactEmail({ ...fields, ...preset }).mailto!).pathname).toBe(CONTACT_MAILBOX);
  });

  it("keeps the full selected context in copy recovery for a long buyer scope", () => {
    const preset = presetFor("usdc.e:arbitrum");
    const message = preset.message + "\n" + "Detailed buyer scope. ".repeat(180);
    const draft = prepareContactEmail({ ...fields, ...preset, message });
    expect(draft.mailto).toBeNull();
    expect(draft.copyText).toContain(message);
    expect(draft.copyText).toContain("usdc.e:arbitrum");
  });
});
