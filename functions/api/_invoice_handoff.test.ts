import { describe, expect, it } from "vitest";
import { invoiceHandoff, INVOICE_CONTACT } from "./_invoice_handoff";

describe("invoice handoff — a quotation that stores nothing must say so", () => {
  // Three endpoints answer invoice=gbp with a reference derived by hashing the request and then
  // persist nothing. /api/lead reports {"bound":false} on this deployment, so there is no store
  // to persist into. The old wording, "CSOAI LTD issues the invoice against this reference",
  // reads to a buyer as "they know I asked" — and nobody does. The lost thing is a customer.
  const h = invoiceHandoff("CSOAI-EB-ABC123", "evidence bundle for dora");

  it("states plainly that the request was not recorded", () => {
    expect(h.recorded).toBe(false);
    expect(h.recorded_note).toMatch(/not recorded/i);
    // and it must not imply someone will act without the buyer doing anything
    expect(h.you_must_send_this).toMatch(/email/i);
  });

  it("says the reference is derived, not stored — asking twice tells nobody twice", () => {
    expect(h.recorded_note).toMatch(/derived/i);
    expect(invoiceHandoff("CSOAI-EB-ABC123", "evidence bundle for dora").mailto).toBe(h.mailto);
  });

  it("makes the buyer's next step one action, carrying the reference", () => {
    expect(h.mailto.startsWith(`mailto:${INVOICE_CONTACT}?`)).toBe(true);
    expect(decodeURIComponent(h.mailto)).toContain("CSOAI-EB-ABC123");
    expect(decodeURIComponent(h.mailto)).toContain("evidence bundle for dora");
  });

  it("never quotes an amount — the owner invoices, the Function does not price", () => {
    expect(JSON.stringify(h)).not.toMatch(/[£$]\s?\d/);
    expect(JSON.stringify(h)).not.toMatch(/\b\d+(\.\d+)?\s?(gbp|usd|usdc)\b/i);
  });

  it("routes to the estate address and no other", () => {
    expect(INVOICE_CONTACT).toBe("nicholas@csoai.org");
    expect(h.contact).toBe(INVOICE_CONTACT);
  });
});
