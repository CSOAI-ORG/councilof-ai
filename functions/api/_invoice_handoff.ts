/**
 * _invoice_handoff — the truthful ending of every GBP-invoice quotation.
 *
 * WHY THIS EXISTS. evidence-bundle and art50/marking-evidence answer an `invoice=gbp` request
 * with a reference derived by hashing the request, and then tell NOBODY: no write to LEADS (the
 * namespace inbound requests are kept in), no queue, no mail. evidence-bundle writes nothing at
 * all on that path; art50 adds a best-effort usage-tally row to REVENUE_KV, which nothing reads
 * back and which notifies no one.
 *
 * When this was written (probed 2026-09-05) `/api/lead` answered `{"bound":false}`: LEADS was not
 * bound and `/api/contact` was 404. LEADS has been bound since (wrangler.jsonc, 841ebbcde), and
 * `/api/lead` and `/api/contact` store what they are sent. These quotation paths still do not
 * write to it, so binding the namespace did not close this gap: it is the endpoints, not the
 * deployment, that keep nothing.
 *
 * The response used to say "CSOAI LTD issues the invoice against this reference", which a buyer
 * reads as "they know I asked". Nobody knows. An organisation that wants to pay us gets a
 * reference, assumes an invoice is coming, and is never contacted, because the request leaves no
 * trace that anyone at CSOAI sees. That is the same defect as an endpoint claiming a read it never
 * performs, except the thing lost is a customer.
 *
 * Until these paths file the request somewhere the owner works from, the honest answer is to say
 * it was NOT recorded and make the buyer's next step one action rather than an unprompted email
 * they have to compose. This does not fix the leak; it stops the response implying the leak
 * isn't there.
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
    `(This message is not sent by CSOAI — the endpoint that produced this reference does not ` +
    `file the request anywhere CSOAI looks, so this email is the only thing that tells CSOAI the ` +
    `request exists.)`;
  return {
    recorded: false,
    recorded_note:
      "This request was NOT recorded as an invoice request. This deployment does have a store for " +
      "inbound requests, but the endpoint that answered you does not write to it and sends no " +
      "mail, so nothing here has told CSOAI that you asked. The reference is derived from your " +
      "request; it is not entered in any queue or inbox that CSOAI works from, so asking again " +
      "still tells nobody.",
    you_must_send_this:
      `Email the reference to ${INVOICE_CONTACT}. Until you do, no invoice can be raised, ` +
      "because no one at CSOAI knows this request happened.",
    contact: INVOICE_CONTACT,
    mailto: `mailto:${INVOICE_CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  };
}
