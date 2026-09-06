/**
 * _x402_receipt — server-signed RECEIPTS per the x402 Offer & Receipt extension
 * (specs/extensions/extension-offer-and-receipt.md, x402-foundation/x402
 * @ 69652a69798f0b08f95bef33318896e36e210f7e).
 *
 * A receipt is issued ONLY after the facilitator confirmed /settle (§5). Placement (§5.1): the
 * SettlementResponse — for us the base64 JSON in the X-PAYMENT-RESPONSE / PAYMENT-RESPONSE
 * header that every door already echoes — gains `extensions["offer-receipt"].info.receipt`.
 * Format `jws` (§3.1.1), payload inside the compact string, never repeated beside it.
 *
 * Signed payload (§5.2) — these fields and no others:
 *   version(1) network(CAIP-2) resourceUrl payer issuedAt [transaction]
 * We include `transaction` (§5.2: "when stronger verifiability is preferred over privacy") because
 * the estate's doctrine is that a stranger can check everything, and the settle tx is public.
 *
 * TWO ARTEFACTS, NEVER CONFUSED:
 *   1. the spec receipt   — {format:"jws", signature} — what the buyer takes away; verifies with
 *      did.json alone (kid did:web:csoai.org#board-attestation-1).
 *   2. the CSOAI record   — schema csoai.x402.receipt-record/0.1 — a NAMED CSOAI ENVELOPE written
 *      to REVENUE_KV beside settled:tx:*; it wraps (1) and adds what the spec deliberately leaves
 *      out (amount_atomic, asset, zero_value, self). It is ours, it is versioned, it is not the
 *      spec artefact, and nothing in it is signed except the receipt it wraps.
 *
 * Self-settlements are recorded exactly like anyone else's and are never revenue; `self` and
 * `zero_value` come from recordSettlement's record so the receipt ledger and the One Number
 * cannot disagree.
 */
import { toCaip2Network } from "./_x402_config";
import { parseJws, signJws, verifyJwsSignature, JWS_ALG } from "./_x402_jws";
import { X402_SIGNER_KID, OFFER_RECEIPT_EXTENSION } from "./_x402_offer";

export const RECEIPT_RECORD_SCHEMA = "csoai.x402.receipt-record/0.1";
export const RECEIPT_KEY_PREFIX = "receipt:tx:";
export const RECEIPT_PAYER_PREFIX = "receipt:payer:";

export type ReceiptPayload = {
  version: 1;
  network: string; // CAIP-2
  resourceUrl: string;
  payer: string;
  issuedAt: number; // unix seconds
  transaction?: string;
};

export type SignedReceipt = { format: "jws"; signature: string };

export function receiptPayload(opts: {
  network: string;
  resourceUrl: string;
  payer: string;
  issuedAt: number;
  transaction?: string | null;
}): ReceiptPayload {
  const p: ReceiptPayload = {
    version: 1,
    network: toCaip2Network(opts.network),
    resourceUrl: opts.resourceUrl.split("?")[0]!,
    payer: opts.payer,
    issuedAt: Math.floor(opts.issuedAt),
  };
  if (opts.transaction) p.transaction = opts.transaction;
  return p;
}

export async function signReceipt(payload: ReceiptPayload, pkcs8b64: string, kid = X402_SIGNER_KID): Promise<SignedReceipt> {
  return { format: "jws", signature: await signJws(payload, pkcs8b64, kid) };
}

/** The JSON Schema the spec transmits beside a JWS receipt (§6.7), verbatim in shape. */
export const RECEIPT_JWS_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  properties: {
    receipt: {
      type: "object",
      properties: {
        format: { type: "string", const: "jws" },
        signature: { type: "string", description: "JWS compact serialization containing the receipt payload" },
      },
      required: ["format", "signature"],
    },
  },
  required: ["receipt"],
} as const;

/** extensions["offer-receipt"] block for a SettlementResponse (§5.1 / §6.7). */
export function receiptExtension(receipt: SignedReceipt): Record<string, { info: { receipt: SignedReceipt }; schema: typeof RECEIPT_JWS_SCHEMA }> {
  return { [OFFER_RECEIPT_EXTENSION]: { info: { receipt }, schema: RECEIPT_JWS_SCHEMA } };
}

/** The CSOAI envelope stored beside settled:tx:* — a named CSOAI extension, not the spec artefact. */
export type ReceiptRecord = {
  schema: typeof RECEIPT_RECORD_SCHEMA;
  receipt: SignedReceipt;
  kid: string;
  alg: typeof JWS_ALG;
  payload: ReceiptPayload; // decoded copy for readers; the signed bytes are inside receipt.signature
  resource: string; // the full URL as requested (query included) — the spec payload carries the bare URL
  amount_atomic: string | null;
  asset: string | null;
  zero_value: boolean;
  self: boolean | null; // null when no settlement record could be written (no KV) and self could not be judged
  settled_tx_key: string;
  settlement_recorded: boolean;
  issued_at: string; // ISO of payload.issuedAt
};

export function buildReceiptRecord(opts: {
  receipt: SignedReceipt;
  payload: ReceiptPayload;
  kid?: string;
  resource: string;
  amount_atomic: string | null;
  asset: string | null;
  self: boolean | null;
  settlement_recorded: boolean;
}): ReceiptRecord {
  const zero_value = !opts.amount_atomic || !/^[1-9]\d*$/.test(opts.amount_atomic);
  return {
    schema: RECEIPT_RECORD_SCHEMA,
    receipt: opts.receipt,
    kid: opts.kid || X402_SIGNER_KID,
    alg: JWS_ALG,
    payload: opts.payload,
    resource: opts.resource,
    amount_atomic: opts.amount_atomic,
    asset: opts.asset,
    zero_value,
    self: opts.self,
    settled_tx_key: `settled:tx:${opts.payload.transaction || "unknown"}`,
    settlement_recorded: opts.settlement_recorded,
    issued_at: new Date(opts.payload.issuedAt * 1000).toISOString(),
  };
}

type KvLike = {
  get: (k: string) => Promise<string | null>;
  put: (k: string, v: string) => Promise<void>;
  list?: (o: { prefix: string; cursor?: string; limit?: number }) => Promise<{ keys: { name: string }[]; list_complete: boolean; cursor?: string }>;
};

export const receiptTxKey = (transaction: string | undefined | null, fallbackTs: number): string =>
  `${RECEIPT_KEY_PREFIX}${transaction || `unknown:${fallbackTs}`}`;
export const receiptPayerKey = (payer: string, issuedAt: number, transaction: string | undefined | null): string =>
  `${RECEIPT_PAYER_PREFIX}${payer.toLowerCase()}:${String(issuedAt).padStart(12, "0")}:${transaction || "unknown"}`;

/**
 * storeReceipt — append-only, two keys per receipt (by tx, and by payer for /api/receipts?payer=).
 * Never throws; returns whether it wrote so the caller can surface a gap rather than infer silence.
 */
export async function storeReceipt(kv: KvLike | undefined, record: ReceiptRecord): Promise<{ stored: boolean; reason: string }> {
  if (!kv) return { stored: false, reason: "no REVENUE_KV bound" };
  try {
    const ts = record.payload.issuedAt;
    const byTx = receiptTxKey(record.payload.transaction, ts);
    const byPayer = receiptPayerKey(record.payload.payer, ts, record.payload.transaction);
    const json = JSON.stringify(record);
    if ((await kv.get(byTx)) == null) await kv.put(byTx, json);
    if ((await kv.get(byPayer)) == null) await kv.put(byPayer, json);
    return { stored: true, reason: "written" };
  } catch (e) {
    return { stored: false, reason: `kv write failed: ${(e as Error).message}` };
  }
}

/** readReceiptsByPayer — null when no store is bound (UNRECORDED), [] when bound and empty. Newest first. */
export async function readReceiptsByPayer(kv: KvLike | undefined, payer: string, limit = 100): Promise<ReceiptRecord[] | null> {
  if (!kv || !kv.list) return null;
  const prefix = `${RECEIPT_PAYER_PREFIX}${payer.toLowerCase()}:`;
  const names: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix, cursor, limit: 1000 });
    for (const k of page.keys) names.push(k.name);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor && names.length < 5000);
  names.sort().reverse();
  const out: ReceiptRecord[] = [];
  for (const n of names.slice(0, limit)) {
    const v = await kv.get(n);
    if (!v) continue;
    try {
      out.push(JSON.parse(v) as ReceiptRecord);
    } catch {
      /* an unreadable row is skipped, not invented */
    }
  }
  return out;
}

/** readRecentReceipts — the public feed the receipts.v1 adapter reads. Newest first by issued_at. */
export async function readRecentReceipts(kv: KvLike | undefined, limit = 50): Promise<ReceiptRecord[] | null> {
  if (!kv || !kv.list) return null;
  const names: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: RECEIPT_KEY_PREFIX, cursor, limit: 1000 });
    for (const k of page.keys) names.push(k.name);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor && names.length < 5000);
  const rows: ReceiptRecord[] = [];
  for (const n of names) {
    const v = await kv.get(n);
    if (!v) continue;
    try {
      rows.push(JSON.parse(v) as ReceiptRecord);
    } catch {
      /* skipped, never invented */
    }
  }
  rows.sort((a, b) => (b.payload?.issuedAt || 0) - (a.payload?.issuedAt || 0));
  return rows.slice(0, limit);
}

export type ReceiptVerdict = {
  ok: boolean;
  reason: string;
  kid: string | null;
  payload: ReceiptPayload | null;
  checks: Record<string, boolean | null>;
};

const REQUIRED: (keyof ReceiptPayload)[] = ["version", "network", "resourceUrl", "payer", "issuedAt"];

/**
 * verifyReceipt — §5.5 (JWS). Same contract as verifyOffer: `resolveKey` decides authorization
 * (§4.5.1) and returns null when the kid is not authorised for payload.resourceUrl.
 * `maxSkewSeconds` is the verifier policy on issuedAt (§5.5 step 7): a receipt from the future is
 * refused; an old one is accepted — age is the reader's call, not a validity fault.
 */
export async function verifyReceipt(
  compact: string,
  resolveKey: (kid: string, resourceUrl: string) => Promise<Uint8Array | null>,
  nowSeconds = Math.floor(Date.now() / 1000),
  maxSkewSeconds = 300,
): Promise<ReceiptVerdict> {
  const checks: Record<string, boolean | null> = { parsed: null, alg: null, version: null, fields: null, kid_resolved: null, signature: null, issued_at_plausible: null };
  let parsed;
  try {
    parsed = parseJws(compact);
    checks.parsed = true;
  } catch (e) {
    checks.parsed = false;
    return { ok: false, reason: (e as Error).message, kid: null, payload: null, checks };
  }
  const kid = parsed.header.kid;
  checks.alg = parsed.header.alg === JWS_ALG;
  if (!checks.alg) return { ok: false, reason: `alg ${parsed.header.alg} is not ${JWS_ALG}`, kid, payload: null, checks };
  const p = parsed.payload as Partial<ReceiptPayload>;
  checks.version = p.version === 1;
  if (!checks.version) return { ok: false, reason: `receipt payload version ${String(p.version)} is not 1`, kid, payload: null, checks };
  const missing = REQUIRED.filter((k) => p[k] === undefined || p[k] === null || p[k] === "");
  checks.fields = missing.length === 0 && typeof p.issuedAt === "number" && /^[a-z0-9-]+:[A-Za-z0-9._-]+$/.test(String(p.network));
  if (!checks.fields) return { ok: false, reason: `receipt payload missing/invalid: ${missing.join(",") || "issuedAt/network"}`, kid, payload: null, checks };
  const key = await resolveKey(kid, String(p.resourceUrl));
  checks.kid_resolved = !!key;
  if (!key) return { ok: false, reason: `kid ${kid} did not resolve to a key authorised for ${p.resourceUrl}`, kid, payload: p as ReceiptPayload, checks };
  checks.signature = await verifyJwsSignature(parsed, key);
  if (!checks.signature) return { ok: false, reason: "signature does not verify under the resolved key", kid, payload: p as ReceiptPayload, checks };
  checks.issued_at_plausible = (p.issuedAt as number) <= nowSeconds + maxSkewSeconds;
  if (!checks.issued_at_plausible) return { ok: false, reason: `issuedAt ${p.issuedAt} is in the future (now ${nowSeconds})`, kid, payload: p as ReceiptPayload, checks };
  return { ok: true, reason: "receipt verifies under the resolved key", kid, payload: p as ReceiptPayload, checks };
}
