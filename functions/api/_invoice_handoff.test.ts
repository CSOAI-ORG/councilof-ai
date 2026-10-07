import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { invoiceHandoff, INVOICE_CONTACT } from "./_invoice_handoff";

describe("invoice handoff — a quotation that stores nothing must say so", () => {
  // evidence-bundle answers invoice=gbp with a reference derived by hashing the request and then
  // persists nothing. The old wording, "CSOAI LTD issues the invoice against this reference",
  // reads to a buyer as "they know I asked" — and nobody does. The lost thing is a customer.
  const h = invoiceHandoff("CSOAI-EB-ABC123", "evidence bundle for dora");

  it("states plainly that the request was not recorded", () => {
    expect(h.recorded).toBe(false);
    expect(h.recorded_note).toMatch(/not recorded/i);
    expect(h.recorded_under).toBeUndefined();
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

describe("invoice handoff — worded per door (sell organ SG-04, 7 Oct 2026)", () => {
  const recorded = invoiceHandoff("CSOAI-A50-0123456789", "Article 50 marking evidence", {
    store: "REVENUE_KV art50-invoice:CSOAI-A50-0123456789",
    holds: "the organisation you named, the output's URL and the sha256 of the bytes measured",
  });

  it("a door that recorded the request says where, what it holds, and that it holds no contact", () => {
    expect(recorded.recorded).toBe(true);
    expect(recorded.recorded_under).toBe("REVENUE_KV art50-invoice:CSOAI-A50-0123456789");
    expect(recorded.recorded_note).toMatch(/^Recorded under reference CSOAI-A50-0123456789/);
    expect(recorded.recorded_note).toMatch(/No contact details are stored/);
    expect(recorded.recorded_note).not.toMatch(/not recorded/i);
    // CSOAI still cannot reach the buyer, so the buyer still has to write
    expect(recorded.you_must_send_this).toMatch(/^Email the reference to nicholas@csoai\.org/);
    expect(decodeURIComponent(recorded.mailto)).toContain("CSOAI-A50-0123456789");
    expect(decodeURIComponent(recorded.mailto)).not.toMatch(/stores nothing/);
  });

  it("no door says 'No datastore is bound': /api/lead answers bound:true and REVENUE_KV is written", () => {
    for (const x of [invoiceHandoff("R", "w"), recorded]) expect(JSON.stringify(x)).not.toMatch(/datastore is bound/i);
    // the producer, not only its output (a claim lives in the artifact AND its producer)
    const src = readFileSync(resolve(__dirname, "_invoice_handoff.ts"), "utf8");
    expect(src).not.toContain("No datastore is bound");
  });
});
