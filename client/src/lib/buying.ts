/**
 * How to buy — ONE statement, reused by every surface that answers "can I order, and how do I
 * get an invoice?" (persona sweep 6 Oct 2026, finding T10). No prices, no tiers: the amount is on
 * the 402 challenge or on the owner-issued invoice, never on a page.
 *
 * What the code supports today, and nothing more:
 *  - Verification is free.
 *  - Pay-per-call from a wallet (x402) is live at the doors GET /api/x402 lists.
 *  - A GBP invoice from CSOAI LTD can be arranged by email for the Article 50 pack, the evidence
 *    bundle and the provider-diff feed. Those endpoints derive a reference and STORE NOTHING
 *    (functions/api/_invoice_handoff.ts), so the buyer must email the reference.
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
  "Article 50 pack: a dated record of marking checks on a public output. Evidence bundle: the published evidence for a named subject. Provider-diff feed: provider changes and signed history where available.",
  `A GBP invoice from CSOAI LTD can be arranged by email for the Article 50 pack, the evidence bundle and the provider-diff feed. The site records nothing when you ask, so email the reference you are given to ${CONTACT_MAILBOX}.`,
  "Ask for a written scope before ordering: name the product, link the public output or subject, and say which dates or history you need. Scope, delivery and invoice terms are agreed by email.",
  "Pay per call from your own wallet (x402): live at the paid doors listed at GET /api/x402. You see the terms before anything is paid.",
  "Scoped fresh measurement runs: booking is not live. You can ask about one by email.",
];

/** Existing invoice products only; each link prepares an enquiry, never an order. */
export const BUYING_ENQUIRIES = [
  { product: "art50", label: "Article 50 pack", href: "/contact/?arm=invoice&product=art50" },
  { product: "evidence-bundle", label: "Evidence bundle", href: "/contact/?arm=invoice&product=evidence-bundle" },
  { product: "provider-diff", label: "Provider-diff feed", href: "/contact/?arm=invoice&product=provider-diff" },
] as const;

/** The same statement as one paragraph, for chat answers and the FAQ. */
export const BUYING_STATEMENT = BUYING_LINES.join(" ");

/** The note that sits under an invoice "Commission" button. */
export const INVOICE_NEXT_STEP = `We do not send the invoice automatically. After you get a reference, email it to ${CONTACT_MAILBOX} with your billing contact, billing address and VAT number; CSOAI LTD then emails a GBP invoice.`;

/**
 * The FAQ answer (/faq/#buying): the same facts as BUYING_LINES inside the FAQ's 40–60 word rule,
 * plus the one VAT sentence the FAQ owes an EU buyer. It states no VAT treatment: the owner has
 * not ruled one, so the invoice confirms it.
 */
export const BUYING_FAQ_ANSWER =
  `Checking a result is free; a grade is never sold. Agents pay per call by wallet at the x402 doors listed at GET /api/x402. ` +
  `The Article 50 pack, evidence bundle and provider-diff feed can be invoiced in GBP: email your reference to ${CONTACT_MAILBOX} ` +
  `(the site records nothing). VAT details are confirmed on the invoice. Fresh-run booking is not live.`;
