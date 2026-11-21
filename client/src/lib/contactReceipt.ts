/**
 * A receipt confirms exactly the submitted snapshot, not any edits made while
 * the storage request was in flight or after its completion.
 */
export function formatStoredContactReceipt(receiptId: string, unchanged: boolean, mailbox: string): string {
  const scope = unchanged
    ? `Stored with reference ${receiptId}.`
    : `An earlier version of your enquiry was stored with reference ${receiptId}; your subsequent edits were not submitted. Submit again to store those edits.`;
  return `${scope} No email notification was sent. For time-sensitive requests, email ${mailbox} directly.`;
}

/**
 * A lost response is not a negative storage receipt. The server may have stored
 * the request before the network failed; avoid prompting an automatic retry.
 */
export function formatUnconfirmedContactSubmission(mailbox: string): string {
  return `No storage receipt was returned. Delivery and storage are unconfirmed; this request may have reached the server. Please do not assume it failed or resubmit solely because of this message. The form sends no automatic email notification. Use the email draft or copy option to contact ${mailbox} if necessary.`;
}
