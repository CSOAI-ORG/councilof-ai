/**
 * _invoice_handoff — the truthful ending of every GBP-invoice quotation.
 *
 * WHY THIS EXISTS. Three endpoints (evidence-bundle, art50/marking-evidence, feeds/provider-diff)
 * answer an `invoice=gbp` request with a reference derived by hashing the request, and then
 * PERSIST NOTHING: no KV write, no queue, no mail. Probed 2026-09-05, `/api/lead` — the one
 * endpoint that would store an inbound lead — answers `{"bound":false}`, so the LEADS namespace
 * is not bound on this deployment and `/api/contact` is 404.
 *
 * The response nonetheless said "CSOAI LTD issues the invoice against this reference", which a
 * buyer reads as "they know I asked". Nobody knows. An organisation that wants to pay us gets a
 * reference, assumes an invoice is coming, and is never contacted — the request leaves no trace
 * on our side at all. That is the same defect as an endpoint claiming a read it never performs,
 * except the thing lost is a customer.
 *
 * Until a datastore is bound, the honest answer is to say the request was NOT recorded and make
 * the buyer's next step one action rather than an unprompted email they have to compose. This
 * does not fix the leak — only binding the namespace does — it stops the response implying the
 * leak isn't there.
 */

/** Contact of record for commercial requests. Never a different address. */
export const INVOICE_CONTACT = "nicholas@csoai.org";

export type InvoiceHandoff = {
  recorded: false;
  recorded_note: string;
  you_must_send_this: string;
  contact: string;
  mailto: string;
};

/**
 * handoff — what a buyer must do, given that nothing here has told the owner anything.
 * `what` is a short human description of the thing being commissioned.
 */
export function invoiceHandoff(reference: string, what: string): InvoiceHandoff {
  const subject = `CSOAI invoice request ${reference}`;
  const body =
    `Reference: ${reference}\n` +
    `Requested: ${what}\n\n` +
    `Please raise the invoice for this reference.\n\n` +
    `(This message is not sent by CSOAI — the endpoint that produced this reference stores ` +
    `nothing, so this email is the only thing that tells CSOAI the request exists.)`;
  return {
    recorded: false,
    recorded_note:
      "This request was NOT recorded. No datastore is bound to this deployment, so nothing here " +
      "has told CSOAI that you asked. The reference is derived from your request, not stored " +
      "against it — requesting the same thing again returns the same reference and still tells " +
      "nobody.",
    you_must_send_this:
      `Email the reference to ${INVOICE_CONTACT}. Until you do, no invoice can be raised, ` +
      "because no one at CSOAI knows this request happened.",
    contact: INVOICE_CONTACT,
    mailto: `mailto:${INVOICE_CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  };
}
