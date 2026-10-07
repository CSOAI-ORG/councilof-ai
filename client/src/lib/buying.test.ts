import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as client from "./buying";
import * as fn from "../../../functions/api/_buying";
import { INVOICE_CONTACT } from "../../../functions/api/_invoice_handoff";
import { CONTACT_MAILBOX as PLAIN_EMAIL_MAILBOX } from "@/components/PlainEmail";
import { CONTACT_ENQUIRY_EMAIL, ENQUIRY_EMAIL } from "./pilotEnquiry";

describe("how to buy: one statement, one mailbox", () => {
  it("the Functions copy says exactly what the client copy says", () => {
    expect(fn.BUYING_LINES).toEqual(client.BUYING_LINES);
    expect(fn.BUYING_STATEMENT).toBe(client.BUYING_STATEMENT);
    expect(fn.CONTACT_MAILBOX).toBe(client.CONTACT_MAILBOX);
    expect(fn.BUYING_FAQ_URL).toBe(client.BUYING_FAQ_URL);
  });

  it("names no price and promises nothing the code does not do", () => {
    const all = client.BUYING_STATEMENT + " " + client.INVOICE_NEXT_STEP;
    expect(all).not.toMatch(/[£$€]\s?\d/);
    expect(all).not.toMatch(/certif|complian|guarantee/i);
    expect(all).toMatch(/booking is not live/);
    expect(all).toMatch(/GBP invoice/);
  });

  // Sell organ SG-04 / M4 (7 Oct 2026): this statement said "the site records nothing when you ask"
  // for all three invoice doors while the Article 50 door wrote REVENUE_KV art50:<sha>. Each door
  // is now named for what it does: art50 records the reference and organisation (no contact) and
  // releases the signed pack only once paid; evidence-bundle and provider-diff record nothing.
  it("says per door what is recorded, and never that the whole site records nothing", () => {
    const all = client.BUYING_STATEMENT + " " + client.INVOICE_NEXT_STEP + " " + client.BUYING_FAQ_ANSWER;
    expect(all).not.toMatch(/The site records nothing when you ask/);
    expect(all).not.toMatch(/\(the site records nothing\)/);
    expect(client.BUYING_STATEMENT).toMatch(/For the Article 50 pack the site records your reference and organisation, never your contact details/);
    expect(client.BUYING_STATEMENT).toMatch(/releases the signed pack once the invoice is paid/);
    expect(client.BUYING_STATEMENT).toMatch(/for the other two it records nothing/);
    expect(client.INVOICE_NEXT_STEP).toMatch(/signed pack is released once that invoice is paid/);
    expect(client.BUYING_FAQ_ANSWER).toMatch(/no contact details are stored/);
  });

  it("the FAQ answer keeps the FAQ's 40–60 word rule", () => {
    const words = client.BUYING_FAQ_ANSWER.split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThanOrEqual(40);
    expect(words).toBeLessThanOrEqual(60);
  });

  it("every surface uses the one mailbox the invoice handoff names", () => {
    for (const m of [fn.CONTACT_MAILBOX, PLAIN_EMAIL_MAILBOX, CONTACT_ENQUIRY_EMAIL, ENQUIRY_EMAIL])
      expect(m).toBe(INVOICE_CONTACT);
    const footer = readFileSync(resolve(__dirname, "../components/Footer.tsx"), "utf8");
    expect(footer).not.toContain("contact@csoai.org");
    const note = readFileSync(resolve(__dirname, "../components/momentum/MomentumMethodNote.tsx"), "utf8");
    expect(note).not.toContain("contact@csoai.org");
  });
});
