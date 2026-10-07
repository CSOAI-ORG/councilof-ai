/**
 * How to buy — ONE statement, reused by every surface that answers "can I order, and how do I
 * get an invoice?" (persona sweep 6 Oct 2026, finding T10). No prices, no tiers: the amount is on
 * the 402 challenge or on the owner-issued invoice, never on a page.
 *
 * What the code supports today, and nothing more:
 *  - Verification is free.
 *  - Pay-per-call from a wallet (x402) is live at the doors GET /api/x402 lists.
 *  - A GBP invoice from CSOAI LTD can be arranged by email for the Article 50 pack, the evidence
 *    bundle and the provider-diff feed. The Article 50 door records the reference and the
 *    organisation (REVENUE_KV art50-invoice:<ref>, no contact details) and releases the signed pack
 *    only once the owner marks the reference paid; the other two derive a reference and STORE
 *    NOTHING (functions/api/_invoice_handoff.ts). Either way the buyer must email the reference.
 *    Corrected 7 Oct 2026: this line said "the site records nothing" for all three, which was false
 *    for the Article 50 door (sell organ SG-04 / M4).
 *  - Scoped fresh runs: booking is not live.
 *
 * The Pages Functions copy is functions/api/_buying.ts; client/src/lib/buying.test.ts pins the two
 * to the same words. DRAFT pending the owner's ruling on the wording (see the PR body).
 */

/**
 * The monitored mailbox. It is the address in the JSON-LD, security.txt, the invoice handoff and
 * CLAUDE.md. Switch every surface to another address (including functions/api/_invoice_handoff.ts
 * and functions/api/feeds/provider-diff.ts) only after the owner confirms that address reaches
 * the monitored inbox.
 */
export const CONTACT_MAILBOX = "nicholas@csoai.org";

export const BUYING_FAQ_URL = "/faq/#buying";

export const BUYING_LINES: readonly string[] = [
  "Checking a result is free, always.",
  "Pay per call from your own wallet (x402): live at the paid doors listed at GET /api/x402. You see the terms before anything is paid.",
  `A GBP invoice from CSOAI LTD can be arranged by email for the Article 50 pack, the evidence bundle and the provider-diff feed. For the Article 50 pack the site records your reference and organisation, never your contact details, and releases the signed pack once the invoice is paid; for the other two it records nothing. Either way, email the reference you are given to ${CONTACT_MAILBOX}.`,
  "Scoped fresh measurement runs: booking is not live. You can ask about one by email.",
];

/** The same statement as one paragraph, for chat answers and the FAQ. */
export const BUYING_STATEMENT = BUYING_LINES.join(" ");

/** The note that sits under an invoice "Commission" button. */
export const INVOICE_NEXT_STEP = `We do not send the invoice automatically. After you get a reference, email it to ${CONTACT_MAILBOX} with your billing contact, billing address and VAT number; CSOAI LTD then emails a GBP invoice. The signed pack is released once that invoice is paid: ask again with the same organisation and the same output.`;

/**
 * The FAQ answer (/faq/#buying): the same facts as BUYING_LINES inside the FAQ's 40–60 word rule,
 * plus the one VAT sentence the FAQ owes an EU buyer. It states no VAT treatment: the owner has
 * not ruled one, so the invoice confirms it.
 */
export const BUYING_FAQ_ANSWER =
  `Checking a result is free; a grade is never sold. Agents pay per call by wallet at the x402 doors (GET /api/x402). ` +
  `The Article 50 pack, evidence bundle and provider-diff feed can be invoiced in GBP: email your reference to ${CONTACT_MAILBOX} ` +
  `(no contact details are stored). VAT details are confirmed on the invoice. Fresh-run booking is not live.`;
