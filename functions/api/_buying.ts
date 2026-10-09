/**
 * How to buy — the Pages Functions copy of client/src/lib/buying.ts (Functions cannot import from
 * client/). client/src/lib/buying.test.ts pins both files to the same words, so they cannot drift.
 * No prices: the amount is on the 402 challenge or on the owner-issued invoice, never here.
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

export const BUYING_STATEMENT = BUYING_LINES.join(" ");

/**
 * "How do I buy / get an invoice / pay by PO?" Narrow on purpose: a bare "order" ("in order to")
 * or "quote" ("which number do I quote?") is not a buying question, so neither is matched alone.
 */
export const BUY_INTENT =
  /\b(?:invoic\w*|billing|vat|purchase orders?|buy(?:ing)?|purchas\w*|place an order|how (?:do|can) (?:i|we) (?:order|pay)|get a quote|quotation|procure\w*)\b/i;

/** The deterministic chat answer: the one statement, the mailbox, the FAQ entry. */
export function buyingAnswer(): string {
  return (
    `${BUYING_LINES.map((l) => `- ${l}`).join("\n")}\n\n` +
    `Prepare a product enquiry: ${BUYING_ENQUIRIES.map((p) => `[${p.label}](https://councilof.ai${p.href})`).join(" · ")}.\n` +
    "The link fills an email draft with the scope to discuss. You must send it from your email app; opening it does not send, book or pay for work.\n\n" +
    `Mailbox: ${CONTACT_MAILBOX}. The full answer: https://councilof.ai${BUYING_FAQ_URL}\n\n` +
    "_Grounded in the published buying statement. Amounts and terms appear on the 402 challenge or the invoice._"
  );
}
