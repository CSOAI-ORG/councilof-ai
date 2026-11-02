import {isEnquiryConfirmation,type EnquiryConfirmation} from '../../../functions/_lib/enquiryReceiptContract';
export type {EnquiryConfirmation};

// Preserve the existing caller-selected URL, including VITE_ASSESS_API on the
// assessment page. Destination configuration/authorization belongs to that caller.
// This client adds no cloud control, payment or operator-retrieval API.
const MAX_REQUEST_BYTES = 24_576; // Existing receiver's wire limit.
const MAX_RECEIPT_BYTES = 65_536; // Proposed consumer limit, before JSON parsing.
const DEADLINE_MS = 15_000; // One existing budget, covering fetch and body read.
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const PREPARATION_ERROR = 'This enquiry could not be prepared for the supported receiving route. No request was sent by this attempt. Keep your message and use the email option if needed.';
const UNCONFIRMED = 'We could not confirm that your enquiry was saved. Your message is still here. The request may have reached CSOAI. Keep the same submission details when choosing to retry, or use the email option; using both can create two enquiries.';
const CONNECTION_ENDED = 'The connection ended before a receipt was confirmed. This does not prove that nothing was saved. Keep your message and the same submission details for a manual retry, or use email; using both can create two enquiries.';

function discard(response: Response): void {
  try { void response.body?.cancel().catch(() => {}); } catch { /* Cleanup is best effort. */ }
}

/** One bounded submission; no automatic retry, email, signing or payment.
 * Confirmation remains source-reported storage readback, not operator review,
 * global durability, exactly-once delivery or buyer acceptance.
 */
export async function submitEnquiry(
  url: string,
  body: Record<string, unknown>,
  fetcher: typeof fetch = fetch,
): Promise<EnquiryConfirmation> {
  let serialized: string;
  let submittedId: string | undefined;
  try {
    if (typeof url !== 'string' || !url.trim() || !body || typeof body !== 'object' || Array.isArray(body)) {
      throw new Error('unsupported submission');
    }
    serialized = JSON.stringify(body);
    if (typeof serialized !== 'string' || new TextEncoder().encode(serialized).byteLength > MAX_REQUEST_BYTES) {
      throw new Error('unsupported request size');
    }
    // Match the exact serialized request, not a caller object changed while
    // awaiting the response. The backend remains the field-validation owner.
    const sent: unknown = JSON.parse(serialized);
    if (!sent || typeof sent !== 'object' || Array.isArray(sent)) throw new Error('unsupported body');
    const id = (sent as Record<string, unknown>).submission_id;
    if (id !== undefined && (typeof id !== 'string' || !UUID.test(id))) throw new Error('invalid id');
    submittedId = typeof id === 'string' ? id.toLowerCase() : undefined;
  } catch {
    throw new Error(PREPARATION_ERROR);
  }

  const control = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let finished = false;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let response: Response | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(CONNECTION_ENDED));
      control.abort();
    }, DEADLINE_MS);
  });
  try {
    const pending = Promise.resolve(fetcher(url, {
      method: 'POST',
      headers: {'content-type': 'application/json', accept: 'application/json'},
      body: serialized,
      signal: control.signal,
      credentials: 'same-origin',
      redirect: 'error',
      cache: 'no-store',
    })).then((value) => {
      // A custom transport may ignore abort and finish after the caller has
      // recovered. Discard that late response instead of retaining its body.
      if (finished) discard(value);
      return value;
    });
    response = await Promise.race([pending, deadline]);
    if (response.redirected || (response.status !== 200 && response.status !== 201)) {
      throw new Error(UNCONFIRMED);
    }
    const media = (response.headers.get('content-type') ?? '').split(';', 1)[0].trim().toLowerCase();
    if (media !== 'application/json' || !response.body) throw new Error(UNCONFIRMED);
    const declared = response.headers.get('content-length');
    if (declared !== null && (!/^[0-9]{1,10}$/.test(declared) || Number(declared) > MAX_RECEIPT_BYTES)) {
      throw new Error(UNCONFIRMED);
    }
    reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', {fatal: true});
    const parts: string[] = [];
    let bytes = 0;
    while (true) {
      const item = await Promise.race([reader.read(), deadline]);
      if (item.done) break;
      bytes += item.value.byteLength;
      if (bytes > MAX_RECEIPT_BYTES) throw new Error(UNCONFIRMED);
      parts.push(decoder.decode(item.value, {stream: true}));
    }
    parts.push(decoder.decode());
    const data: unknown = JSON.parse(parts.join(''));
    if (!isEnquiryConfirmation(data) || !UUID.test(data.submission_id)
        || data.submission_id !== data.submission_id.toLowerCase()
        || (submittedId !== undefined && data.submission_id !== submittedId)) {
      throw new Error(UNCONFIRMED);
    }
    // Do not pass unvalidated, unrelated response fields to downstream UI.
    return {
      ok: data.ok, stored: data.stored, state: data.state,
      receipt_id: data.receipt_id, submission_id: data.submission_id,
      received_at: data.received_at, reused: data.reused,
      email_sent: data.email_sent, reviewed: data.reviewed,
      work_started: data.work_started,
    };
  } catch (error) {
    if (error instanceof Error && error.message === CONNECTION_ENDED) throw error;
    if (!response) throw new Error(CONNECTION_ENDED);
    throw new Error(UNCONFIRMED);
  } finally {
    finished = true;
    clearTimeout(timer);
    control.abort();
    if (reader) {
      try { void reader.cancel().catch(() => {}); } catch { /* Best effort. */ }
      try { reader.releaseLock(); } catch { /* Never hide the original outcome. */ }
    } else if (response) {
      discard(response);
    }
  }
}
