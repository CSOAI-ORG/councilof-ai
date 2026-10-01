/** Append-only CSOAI delivery evidence joined to a settled x402 transaction.
 *
 * This is NOT part of the x402 offer-receipt JWS and is deliberately unsigned bookkeeping.
 * It records the exact HTTP response payload bytes the server emitted after a confirmed settle.
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
    content_type: String(opts.content_type || "application/json; charset=utf-8"),
    delivered_at: new Date(parsed).toISOString(),
    settled_tx_key: `settled:tx:${transaction}`,
    receipt_tx_key: `receipt:tx:${transaction}`,
    signed: false,
    claim_boundary:
      "Exact payload-byte identity recorded by the CSOAI server after a confirmed settle. This record is unsigned and does not prove buyer acceptance, payment finality, semantic truth, or that the buyer retained the bytes.",
  };
}

function sameDelivery(a: DeliveryRecord, b: DeliveryRecord): boolean {
  return a.schema === b.schema &&
    a.transaction === b.transaction &&
    a.resource === b.resource &&
    a.response_sha256 === b.response_sha256 &&
    a.response_bytes === b.response_bytes &&
    a.content_type === b.content_type;
}

export async function storeDeliveryRecord(kv: KvLike | undefined, record: DeliveryRecord): Promise<DeliveryStoreResult> {
  if (!kv) return { stored: false, existing: false, conflict: false, reason: "no REVENUE_KV bound", key: null };
  const key = deliveryTxKey(record.transaction);
  try {
    const current = await kv.get(key);
    if (current !== null) {
      try {
        const parsed = JSON.parse(current) as DeliveryRecord;
        if (sameDelivery(parsed, record)) return { stored: false, existing: true, conflict: false, reason: "identical delivery already recorded", key };
        return { stored: false, existing: true, conflict: true, reason: "existing delivery record differs; refusing overwrite", key };
      } catch {
        return { stored: false, existing: true, conflict: true, reason: "existing delivery record is unreadable; refusing overwrite", key };
      }
    }
    await kv.put(key, JSON.stringify(record));
    return { stored: true, existing: false, conflict: false, reason: "written", key };
  } catch (e) {
    return { stored: false, existing: false, conflict: false, reason: `kv write failed: ${(e as Error).message}`, key };
  }
}

export async function readDeliveryByTransaction(kv: KvLike | undefined, transaction: string): Promise<DeliveryRecord | null> {
  if (!kv) return null;
  let tx: string;
  try { tx = requiredTransaction(transaction); } catch { return null; }
  try {
    const raw = await kv.get(deliveryTxKey(tx));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DeliveryRecord;
    return parsed?.schema === DELIVERY_RECORD_SCHEMA && parsed.transaction === tx ? parsed : null;
  } catch {
    return null;
  }
}
