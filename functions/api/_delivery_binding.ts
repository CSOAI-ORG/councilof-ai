import { sha256Hex } from "../_lib/cardSign";
import { signJws } from "./_x402_jws";
import { X402_SIGNER_KID } from "./_x402_offer";

export const DELIVERY_RECORD_SCHEMA = "csoai.x402.delivery-record/0.1";
export const DELIVERY_RECORD_PREFIX = "delivery:record:";
export const DELIVERY_BYTES_PREFIX = "delivery:bytes:";
export const DELIVERY_MAX_RETAINED_BYTES = 20 * 1024 * 1024;

type KvLike = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string) => Promise<void>;
};

export type DeliveryBindingPayload = {
  version: 1;
  order_id: string;
  resource_url: string;
  bytes_sha256: string;
  bytes_length: number;
  delivered_at: number;
  transaction?: string;
  payer?: string;
};

export type DeliveryRecord = {
  schema: typeof DELIVERY_RECORD_SCHEMA;
  payload: DeliveryBindingPayload;
  signed_delivery_receipt: { format: "jws"; signature: string } | null;
  signing_gap: string | null;
  retained_artifact_ref: string | null;
  retained_bytes: boolean;
  retention_gap: string | null;
};

export type DeliveryBinding = {
  bodyText: string;
  bodySha256: string;
  bodyBytes: number;
  orderId: string;
  record: DeliveryRecord;
  stored: boolean;
  storeReason: string;
};

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text);

export async function deliveryOrderId(opts: {
  resourceUrl: string;
  bodySha256: string;
  transaction?: string | null;
}): Promise<string> {
  const material = [opts.resourceUrl, opts.transaction || "", opts.bodySha256].join("\n");
  return "order:" + (await sha256Hex(bytes(material))).slice(0, 32);
}
export async function bindDeliveredJson(opts: {
  body: unknown;
  resourceUrl: string;
  transaction?: string | null;
  payer?: string | null;
  kv?: KvLike;
  signingPkcs8B64?: string;
  deliveredAt?: number;
}): Promise<DeliveryBinding> {
  const bodyText = JSON.stringify(opts.body, null, 2);
  const bodyBytes = bytes(bodyText).byteLength;
  const bodySha256 = await sha256Hex(bytes(bodyText));
  const orderId = await deliveryOrderId({
    resourceUrl: opts.resourceUrl,
    bodySha256,
    transaction: opts.transaction,
  });
  const deliveredAt = Math.floor(opts.deliveredAt ?? Date.now() / 1000);
  const payload: DeliveryBindingPayload = {
    version: 1,
    order_id: orderId,
    resource_url: opts.resourceUrl,
    bytes_sha256: bodySha256,
    bytes_length: bodyBytes,
    delivered_at: deliveredAt,
    ...(opts.transaction ? { transaction: opts.transaction } : {}),
    ...(opts.payer ? { payer: opts.payer } : {}),
  };
  let signed: DeliveryRecord["signed_delivery_receipt"] = null;
  let signingGap: string | null = null;
  const key = (opts.signingPkcs8B64 || "").trim();
  if (!key) {
    signingGap = "BOARD_SIGN_KEY_PKCS8_B64 absent; delivery bytes are hashed but not signed";
  } else {
    try {
      signed = {
        format: "jws",
        signature: await signJws(payload as unknown as Record<string, unknown>, key, X402_SIGNER_KID),
      };
    } catch (e) {
      signingGap = "delivery receipt signing failed: " + (e as Error).message;
    }
  }

  let retained = false;
  let retainedRef: string | null = null;
  let retentionGap: string | null = null;
  let stored = false;
  let storeReason = "no REVENUE_KV bound";
  const recordKey = DELIVERY_RECORD_PREFIX + orderId;
  const bytesKey = DELIVERY_BYTES_PREFIX + orderId;
  const record: DeliveryRecord = {
    schema: DELIVERY_RECORD_SCHEMA,
    payload,
    signed_delivery_receipt: signed,
    signing_gap: signingGap,
    retained_artifact_ref: null,
    retained_bytes: false,
    retention_gap: null,
  };

  if (opts.kv) {
    try {
      if (bodyBytes > DELIVERY_MAX_RETAINED_BYTES) {
        retentionGap =
          "delivery body exceeds retention cap " + String(DELIVERY_MAX_RETAINED_BYTES);
      } else {
        if ((await opts.kv.get(bytesKey)) == null) await opts.kv.put(bytesKey, bodyText);
        retained = true;
        retainedRef = "kv:" + bytesKey;
      }
      record.retained_artifact_ref = retainedRef;
      record.retained_bytes = retained;
      record.retention_gap = retentionGap;
      if ((await opts.kv.get(recordKey)) == null) {
        await opts.kv.put(recordKey, JSON.stringify(record));
      }
      stored = true;
      storeReason = "written";
    } catch (e) {
      storeReason = "kv write failed: " + (e as Error).message;
    }
  }
  return {
    bodyText,
    bodySha256,
    bodyBytes,
    orderId,
    record,
    stored,
    storeReason,
  };
}
