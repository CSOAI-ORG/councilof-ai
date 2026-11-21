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
