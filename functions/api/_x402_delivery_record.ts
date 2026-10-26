/** Transaction-linked CSOAI delivery evidence joined to a settled x402 transaction.
 *
 * This is NOT part of the x402 offer-receipt JWS and is deliberately unsigned bookkeeping.
 * It records prepared HTTP body bytes; this is not proof of network receipt.
 * KV get-then-put is not an atomic cross-region append-only operation.
 * The x402 receipt remains immutable and spec-shaped; this record is linked only by transaction.
 */
export const DELIVERY_RECORD_SCHEMA = "csoai.x402.delivery-record/0.1";
export const DELIVERY_KEY_PREFIX = "delivery:tx:";

export type DeliveryRecord = {
  schema: typeof DELIVERY_RECORD_SCHEMA;
  transaction: string;
  resource: string;
  response_sha256: string;
  response_bytes: number;
  content_type: string;
  delivered_at: string;
  settled_tx_key: string;
  receipt_tx_key: string;
  signed: false;
  claim_boundary: string;
};

type KvLike = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string) => Promise<void>;
};

export type DeliveryStoreResult = {
  stored: boolean;
  existing: boolean;
  conflict: boolean;
  reason: string;
  key: string | null;
  write_outcome_unknown?: boolean;
};

export const deliveryTxKey = (transaction: string): string =>
  `${DELIVERY_KEY_PREFIX}${transaction}`;

function requiredTransaction(value: string): string {
  const tx = String(value || "").trim();
  if (!tx || tx.length > 256 || /\s/.test(tx)) throw new Error("transaction must be a non-empty token no longer than 256 characters");
  return tx;
}

export function buildDeliveryRecord(opts: {
  transaction: string;
  resource: string;
  response_sha256: string;
  response_bytes: number;
  content_type?: string | null;
  delivered_at?: string;
}): DeliveryRecord {
  const transaction = requiredTransaction(opts.transaction);
  const digest = String(opts.response_sha256 || "").trim();
  if (!/^[a-f0-9]{64}$/.test(digest)) throw new Error("response_sha256 must be 64 lowercase hexadecimal characters");
  if (!Number.isSafeInteger(opts.response_bytes) || opts.response_bytes < 0) throw new Error("response_bytes must be a non-negative safe integer");
  const resource = String(opts.resource || "").trim();
  if (!resource) throw new Error("resource is required");
  const delivered_at = opts.delivered_at || new Date().toISOString();
  const parsed = Date.parse(delivered_at);
  if (!Number.isFinite(parsed)) throw new Error("delivered_at must be ISO-8601 parseable");
  return {
    schema: DELIVERY_RECORD_SCHEMA,
    transaction,
    resource,
    response_sha256: digest,
    response_bytes: opts.response_bytes,
    content_type: opts.content_type == null ? "application/json; charset=utf-8" : String(opts.content_type),
    delivered_at: new Date(parsed).toISOString(),
    settled_tx_key: `settled:tx:${transaction}`,
    receipt_tx_key: `receipt:tx:${transaction}`,
    signed: false,
    claim_boundary:
      "Exact prepared HTTP-body identity recorded by the CSOAI server after a confirmed settle. This unsigned record covers the underlying HTTP artifact, not a re-enveloped MCP response. It does not prove buyer receipt/acceptance, payment finality, semantic truth, or retained bytes.",
  };
}

function isDeliveryRecord(value: unknown): value is DeliveryRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as DeliveryRecord;
  try {
    return v.schema === DELIVERY_RECORD_SCHEMA &&
      typeof v.transaction === "string" && requiredTransaction(v.transaction) === v.transaction &&
      typeof v.resource === "string" && v.resource.trim().length > 0 &&
      typeof v.response_sha256 === "string" && /^[a-f0-9]{64}$/.test(v.response_sha256) &&
      Number.isSafeInteger(v.response_bytes) && v.response_bytes >= 0 &&
      typeof v.content_type === "string" &&
      typeof v.delivered_at === "string" && Number.isFinite(Date.parse(v.delivered_at)) &&
      v.settled_tx_key === `settled:tx:${v.transaction}` &&
      v.receipt_tx_key === `receipt:tx:${v.transaction}` && v.signed === false &&
      typeof v.claim_boundary === "string" && v.claim_boundary.length > 0;
  } catch { return false; }
}

function sameDelivery(a: DeliveryRecord, b: DeliveryRecord): boolean {
  return a.schema === b.schema &&
    a.transaction === b.transaction &&
    a.resource === b.resource &&
    a.response_sha256 === b.response_sha256 &&
    a.response_bytes === b.response_bytes &&
    a.content_type === b.content_type;
}

// One total storage budget, shared by get and put. KV has no cancellation API.
export const DELIVERY_STORE_DEADLINE_MS = 250;
class DeliveryStorageTimeout extends Error {
  constructor(readonly phase: "get" | "put", readonly invoked: boolean) {
    super(`KV ${phase} deadline exceeded`);
  }
}
function storageBudget() {
  let expired = false;
  let phase: "get" | "put" = "get";
  let invoked = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Per-call timer: no global timer and no arithmetic on Workers' I/O-bound clocks.
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { expired = true; reject(new DeliveryStorageTimeout(phase, invoked)); }, DELIVERY_STORE_DEADLINE_MS);
  });
  return {
    async run<T>(operation: () => Promise<T>, nextPhase: "get" | "put"): Promise<T> {
      if (expired) throw new DeliveryStorageTimeout(nextPhase, false);
      phase = nextPhase;
      invoked = false;
      return await Promise.race([timeout, Promise.resolve().then(() => {
        if (expired) throw new DeliveryStorageTimeout(nextPhase, false);
        invoked = true;
        return operation();
      })]);
    },
    clear() { if (timer !== undefined) clearTimeout(timer); },
  };
}

export async function storeDeliveryRecord(kv: KvLike | undefined, record: DeliveryRecord): Promise<DeliveryStoreResult> {
  if (!kv) return { stored: false, existing: false, conflict: false, reason: "no REVENUE_KV bound", key: null };
  const key = deliveryTxKey(record.transaction);
  const budget = storageBudget();
  try {
    const current = await budget.run(() => kv.get(key), "get");
    if (current !== null) {
      try {
        const parsed = JSON.parse(current) as DeliveryRecord;
        if (isDeliveryRecord(parsed) && sameDelivery(parsed, record)) return { stored: false, existing: true, conflict: false, reason: "identical delivery already recorded", key };
        return { stored: false, existing: true, conflict: true, reason: "existing delivery record differs; refusing overwrite", key };
      } catch {
        return { stored: false, existing: true, conflict: true, reason: "existing delivery record is unreadable; refusing overwrite", key };
      }
    }
    await budget.run(() => kv.put(key, JSON.stringify(record)), "put");
    return { stored: true, existing: false, conflict: false, reason: "written", key };
  } catch (e) {
    if (e instanceof DeliveryStorageTimeout) {
      const unknown = e.phase === "put" && e.invoked;
      return { stored: false, existing: false, conflict: false, write_outcome_unknown: unknown,
        reason: unknown ? "KV put deadline exceeded; write outcome UNKNOWN, may commit later; no automatic retry" : "KV storage deadline exceeded before a write; no put attempted", key };
    }
    return { stored: false, existing: false, conflict: false, reason: `kv write failed: ${(e as Error).message}`, key };
  } finally { budget.clear(); }
}

export async function readDeliveryByTransaction(kv: KvLike | undefined, transaction: string): Promise<DeliveryRecord | null> {
  if (!kv) return null;
  let tx: string;
  try { tx = requiredTransaction(transaction); } catch { return null; }
  const budget = storageBudget();
  try {
    const raw = await budget.run(() => kv.get(deliveryTxKey(tx)), "get");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeliveryRecord;
    return isDeliveryRecord(parsed) && parsed.transaction === tx ? parsed : null;
  } catch {
    return null;
  } finally { budget.clear(); }
}

export type PaidResponseOptions = {
  kv?: KvLike;
  transaction?: string | null;
  resource: string;
  confirmedPaid: boolean;
  successfulOutput: boolean;
  paymentResponse?: string;
};

function deliveryHeaders(response: Response, state: string, paymentResponse?: string): Headers {
  const headers = new Headers(response.headers);
  headers.set("x-csoai-delivery-record-state", state);
  if (paymentResponse) headers.set("x-payment-response", paymentResponse);
  const exposed = (headers.get("access-control-expose-headers") || "").split(",").map(v => v.trim()).filter(Boolean);
  for (const name of ["x-csoai-delivery-record-state", ...(paymentResponse ? ["x-payment-response"] : [])]) {
    if (!exposed.some(v => v.toLowerCase() === name)) exposed.push(name);
  }
  headers.set("access-control-expose-headers", exposed.join(", "));
  return headers;
}

/** Call only at an inspected successful paid-output seam, never on status alone.
 * Finite, already-prepared response bytes are consumed once and returned unchanged.
 * No settlement, signing, fetch or original-body retention is performed here.
 */
export async function recordPaidResponse(response: Response, opts: PaidResponseOptions): Promise<Response> {
  if (!opts.confirmedPaid || !opts.successfulOutput || !response.ok || !response.body) return response;
  const bytes = new Uint8Array(await response.arrayBuffer());
  const transaction = typeof opts.transaction === "string" ? opts.transaction.trim() : "";
  let state = transaction ? (opts.kv ? "ERROR" : "UNRECORDED_NO_STORE") : "UNRECORDED_NO_TRANSACTION";
  if (transaction && opts.kv) {
    try {
      const hash = await crypto.subtle.digest("SHA-256", bytes);
      const response_sha256 = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
      const result = await storeDeliveryRecord(opts.kv, buildDeliveryRecord({
        transaction, resource: opts.resource, response_sha256, response_bytes: bytes.byteLength,
        content_type: response.headers.get("content-type") || "",
      }));
      state = result.write_outcome_unknown ? "UNKNOWN" : result.stored ? "WRITTEN" : result.conflict ? "CONFLICT" : result.existing ? "ALREADY_RECORDED" : "ERROR";
    } catch { state = "ERROR"; }
  }
  return new Response(bytes, { status: response.status, statusText: response.statusText, headers: deliveryHeaders(response, state, opts.paymentResponse) });
}

/** A verified settlement followed by failed output is not successful delivery.
 * Preserve the original failure body/status and settlement echo without writing a row.
 */
export function markPaidUndeliveredResponse(response: Response, confirmedPaid: boolean, paymentResponse?: string): Response {
  if (!confirmedPaid) return response;
  const headers = deliveryHeaders(response, "NOT_DELIVERED", paymentResponse);
  headers.set("x-csoai-delivery-state", "PAID_NOT_DELIVERED");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
