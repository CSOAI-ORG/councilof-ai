/**
 * _invoice_handoff — the truthful ending of every GBP-invoice quotation, worded per door.
 *
 * WHY THIS EXISTS. An `invoice=gbp` request is answered with a reference. A buyer reads "CSOAI LTD
 * issues the invoice against this reference" as "they know I asked". Whether anyone knows depends
 * on the door, so the handoff says which it is, door by door:
 *
 *  - evidence-bundle: the reference is derived by hashing the request and NOTHING is stored (no KV
 *    write, no queue, no mail). The buyer's email is the only thing that tells CSOAI.
 *  - art50/marking-evidence (since 2026-10-07): the reference IS recorded in REVENUE_KV under
 *    `art50-invoice:<reference>`, with the organisation named and the output measured, but with no
 *    contact details. CSOAI can see that the request exists and cannot reach the buyer, so the buyer
 *    still has to email the reference.
 *
 * CORRECTION (2026-10-07). This file used to tell every buyer that no datastore was bound to this
 * deployment, from a probe of /api/lead on 2026-09-05 that answered {"bound":false}. That stopped
 * being true: /api/lead answers {"bound":true}, and the art50 door was writing `art50:<sha>` to
 * REVENUE_KV the whole time while its reply said the request was NOT recorded (sell organ SG-04,
 * 7 Oct 2026). A door that stores nothing now says that it stores nothing, which is true whatever
 * is bound; a door that records says what it recorded and what it did not.
 */

/** Contact of record for commercial requests. Never a different address. */
export const INVOICE_CONTACT = "nicholas@csoai.org";

/** What a recording door stored, in words a buyer can read. */
export type InvoiceRecord = {
  /** Where the request was written, e.g. "REVENUE_KV art50-invoice:CSOAI-A50-…". */
  store: string;
  /** What the record holds, e.g. "the organisation you named and the sha256 of the output measured". */
  holds: string;
};

export type InvoiceHandoff = {
  recorded: boolean;
  /** Present only when the door recorded the request. */
  recorded_under?: string;
  recorded_note: string;
  you_must_send_this: string;
  contact: string;
  mailto: string;
};

/**
 * handoff — what a buyer must do next. `what` is a short human description of the thing being
 * commissioned. `record` is passed only by a door that actually wrote the request down, and only
 * after the write succeeded; without it the handoff says the request was NOT recorded.
 */
export function invoiceHandoff(reference: string, what: string, record: InvoiceRecord | null = null): InvoiceHandoff {
  const subject = `CSOAI invoice request ${reference}`;
  const body =
    `Reference: ${reference}\n` +
    `Requested: ${what}\n\n` +
    `Please raise the invoice for this reference.\n` +
    `Billing contact:\nBilling address:\nVAT number (if any):\n\n` +
    (record
      ? `(This message is not sent by CSOAI. The reference is recorded with the organisation named, ` +
        `but no contact details are stored, so this email is how CSOAI can reach you.)`
      : `(This message is not sent by CSOAI. The endpoint that produced this reference stores ` +
        `nothing, so this email is the only thing that tells CSOAI the request exists.)`);
  const mailto = `mailto:${INVOICE_CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  if (record) {
    return {
      recorded: true,
      recorded_under: record.store,
      recorded_note:
        `Recorded under reference ${reference} (${record.store}) with ${record.holds}. No contact ` +
        "details are stored, so CSOAI cannot reach you from this record.",
      you_must_send_this:
        `Email the reference to ${INVOICE_CONTACT} with your billing contact, billing address and VAT ` +
        "number. No invoice can be raised until you do, because the record holds no way to reach you.",
      contact: INVOICE_CONTACT,
      mailto,
    };
  }
  return {
    recorded: false,
    recorded_note:
      "This request was NOT recorded. This endpoint stores nothing, so nothing here has told CSOAI " +
      "that you asked. The reference is derived from your request, not stored against it — " +
      "requesting the same thing again returns the same reference and still tells nobody.",
    you_must_send_this:
      `Email the reference to ${INVOICE_CONTACT}. Until you do, no invoice can be raised, ` +
      "because no one at CSOAI knows this request happened.",
    contact: INVOICE_CONTACT,
    mailto,
  };
}
