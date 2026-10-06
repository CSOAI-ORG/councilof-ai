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
    expect(all).toMatch(/records nothing/);
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
