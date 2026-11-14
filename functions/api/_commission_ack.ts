/** Private queue acknowledgement. No settlement, signing, inference or network calls. */
import { canonicalBytes, sha256Hex } from "../_lib/cardSign";
import type { CommissionTarget } from "./_commission_target";
export const COMMISSION_SCHEMA = "csoai.commission-intent/0.2";
export type AckState = "QUEUE_READBACK_CONFIRMED" | "QUEUE_READBACK_UNCONFIRMED" | "QUEUE_WRITE_UNCONFIRMED" | "QUEUE_ID_CONFLICT" | "SETTLEMENT_ID_MISSING";
export type QueueAck = { state: AckState; commission_id: string | null; scope_sha256: string;
  queue_key: string | null; enqueued: boolean | null; as_of: string; reused: boolean };
export const queueConfigured = (kv: unknown): kv is KVNamespace => !!kv &&
  ["get", "put", "list"].every(k => typeof (kv as any)[k] === "function");
export async function acknowledgeCommission(kv: KVNamespace, subject: string, axis: string,
  target: CommissionTarget, settlement: {transaction?: string; network?: string; payer?: string}, asOf: string): Promise<QueueAck> {
  const scope = {schema: "csoai.commission-scope/0.1", subject, axis:axis || null,
    subject_kind:target.subject_kind, model:target.model, bank:target.bank};
  const scope_sha256 = await sha256Hex(canonicalBytes(scope));
  const missing: QueueAck = {state:"SETTLEMENT_ID_MISSING",commission_id:null,scope_sha256,
    queue_key:null,enqueued:null,as_of:asOf,reused:false};
  if (typeof settlement.transaction !== "string" || !settlement.transaction.trim() ||
      typeof settlement.network !== "string" || !settlement.network.trim()) return missing;
  const identity = {scope_sha256, transaction:settlement.transaction, network:settlement.network};
  const commission_id = await sha256Hex(canonicalBytes(identity));
  const queue_key = `mill:commission:v2:${commission_id}`;
  const base = {...missing, commission_id, queue_key};
  const row = {...scope,schema:COMMISSION_SCHEMA,commission_id,request_scope_sha256:scope_sha256,
    subject_kind:target.subject_kind,fulfillment:target.fulfillment,tx:settlement.transaction,
    network:settlement.network,as_of:asOf,receipt_sha:null,card_sha:null,status:target.fulfillment === "QUEUED" ? "QUEUED" : "RECEIPT_ONLY"};
  // The intent schema is distinct from the input scope's schema.
  row.schema = COMMISSION_SCHEMA;
  const stableKeys = ["schema","commission_id","request_scope_sha256","subject","axis","subject_kind","model","bank","fulfillment","tx","network","status"];
  const same = (value: any) => value && typeof value === "object" &&
    stableKeys.every(k => value[k] === (row as any)[k]) && typeof value.as_of === "string";
  try {
    const prior = await kv.get(queue_key);
    if (prior !== null) {
      let old; try { old=JSON.parse(prior); } catch { return {...base,state:"QUEUE_ID_CONFLICT"}; }
      if (!same(old)) return {...base,state:"QUEUE_ID_CONFLICT"};
      return {...base,state:"QUEUE_READBACK_CONFIRMED",enqueued:target.fulfillment === "QUEUED",as_of:old.as_of,reused:true};
    }
  } catch { return {...base,state:"QUEUE_READBACK_UNCONFIRMED"}; }
  const raw = JSON.stringify(row);
  try { await kv.put(queue_key, raw); }
  catch { return {...base,state:"QUEUE_WRITE_UNCONFIRMED"}; }
  try {
    const readback = await kv.get(queue_key);
    if (readback !== raw) return {...base,state:"QUEUE_READBACK_UNCONFIRMED"};
    return {...base,state:"QUEUE_READBACK_CONFIRMED",enqueued:target.fulfillment === "QUEUED",reused:false};
  } catch { return {...base,state:"QUEUE_READBACK_UNCONFIRMED"}; }
}

/** KV readback is an observation, not a distributed exactly-once guarantee. */
export const ACK_LIMITS = "Readback confirms the observed queue row only; not worker execution, delivery, global persistence or exactly-once settlement. A paid request with unconfirmed queue state must be reconciled without automatically paying again.";
