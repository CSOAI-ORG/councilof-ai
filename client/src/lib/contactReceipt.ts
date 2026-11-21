/**
 * A receipt confirms exactly the submitted snapshot, not any edits made while
 * the storage request was in flight or after its completion.
 */
export function formatStoredContactReceipt(receiptId: string, unchanged: boolean, mailbox: string): string {
  const scope = unchanged
    ? `Stored with reference ${receiptId}.`
    : `An earlier version of your enquiry was stored with reference ${receiptId}; your subsequent edits were not submitted. Submit again to store those edits.`;
  return `${scope} The Council team has NOT been notified and this is not a request for a reply. To reach us, send the prepared email using ‘Open email draft instead’ below or write to ${mailbox}.`;
}

/**
 * A lost response is not a negative storage receipt. The server may have stored
 * the request before the network failed; avoid prompting an automatic retry.
 */
export function formatUnconfirmedContactSubmission(mailbox: string): string {
  return `No storage receipt was returned. Delivery and storage are unconfirmed; this request may have reached the server. Please do not assume it failed or resubmit solely because of this message. This form does not notify the Council team. Use the email draft or copy option to contact ${mailbox} if necessary.`;
}

/**
 * Only an exact first-party response that exited before KV.put can establish
 * known non-storage. A KV write failure, lost response, or unrecognized body
 * cannot establish that a write did not occur.
 */
const KNOWN_NONSTORAGE_STATUS: Record<string, number> = {
  CROSS_ORIGIN: 403,
  JSON_REQUIRED: 415,
  TOO_LARGE: 413,
  BAD_JSON: 400,
  BOT_FIELD: 400,
  INVALID_FIELD: 400,
  INVALID_CONTACT: 400,
  INTAKE_UNAVAILABLE: 503,
};

export type ContactResponseOutcome =
  | { kind: "stored"; receiptId: string }
  | { kind: "rejected"; code: string }
  | { kind: "unknown" };

export function classifyContactResponse(status: number, value: unknown): ContactResponseOutcome {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { kind: "unknown" };
  const body = value as Record<string, unknown>;
  if (status === 202 && body.stored === true &&
      typeof body.receipt_id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.receipt_id)) {
    return { kind: "stored", receiptId: body.receipt_id };
  }
  if (body.stored === false && typeof body.code === "string" &&
      Object.prototype.hasOwnProperty.call(KNOWN_NONSTORAGE_STATUS, body.code) &&
      KNOWN_NONSTORAGE_STATUS[body.code] === status) {
    return { kind: "rejected", code: body.code };
  }
  return { kind: "unknown" };
}

export function formatRejectedContactSubmission(mailbox: string): string {
  return `The intake service rejected this attempt before storage. No receipt was issued and the Council team was not notified. Check the form or contact ${mailbox} using the email draft instead.`;
}
