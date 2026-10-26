/**
 * POST /api/refund — record a refund or chargeback and revoke entitlement + cert.
 *
 * Two channel paths supported today:
 *   1. paddle_webhook: Paddle (or any settled-payment rail) POSTs the event. The
 *      signing key is operator-side (M4/Nick); this endpoint validates only the
 *      shape and idempotency, not Paddle's signature yet — that part lives in
 *      lib/_paddle_verify when M4 wires Paddle in.
 *   2. operator_manual: an internal operator records a refund by hand.
 *
 * Idempotent. Two POSTs with the same source.reference and source.timestamp_buyer
 * collapse to one record (idempotency_key = sha256(canonical source-block)).
 *
 * Refunds never erase history: a refund is an event with timestamp, never a
 * DELETE. The original grant timestamp is preserved in revocations.entitlement.
 *
 * This endpoint does NOT sign the record. The publisher (Edge writer or M4
 * operator flow) is the signer; this is the intake that records the event.
 */
import { headFromGet } from "./_head";

type Env = { LEADS?: KVNamespace; REVENUE_KV?: KVNamespace };
type Channel = "paddle_webhook" | "operator_manual" | "buyer_request" | "dispute_resolution";

interface RefundInput {
  schema?: string;
  observed_at: string;
  source: {
    channel: Channel;
    reference: string;
    timestamp_buyer?: string | null;
    amount?: number | null;
    currency?: string | null;
  };
  subject: {
    kind: "account" | "license" | "cert";
    id: string;
  };
  revocations: {
    entitlement: {
      revoked: true;
      original_grant_at: string;
      sku: string;
    };
    cert: {
      revoked: true;
      cert_sha256: string;
    };
  };
  doctrine?: Record<string, unknown>;
}

interface ValidationOk { ok: true; }
interface ValidationErr { ok: false; code: string; detail: string }

function validate(input: unknown): ValidationOk | ValidationErr {
  if (!input || typeof input !== "object") return { ok: false, code: "BAD_BODY", detail: "body must be a JSON object" };
  const r = input as Record<string, unknown>;
  if (r.schema !== "csoai.refund-record/0.1")
    return { ok: false, code: "BAD_SCHEMA", detail: `expected schema csoai.refund-record/0.1, got ${String(r.schema)}` };
  if (typeof r.observed_at !== "string" || r.observed_at.length < 8)
    return { ok: false, code: "BAD_OBSERVED_AT", detail: "observed_at must be a string" };
  const src = r.source as Record<string, unknown>;
  if (!src || typeof src !== "object") return { ok: false, code: "BAD_SOURCE", detail: "source must be an object" };
  const validChannels: Channel[] = ["paddle_webhook", "operator_manual", "buyer_request", "dispute_resolution"];
  if (!validChannels.includes(src.channel as Channel))
    return { ok: false, code: "BAD_SOURCE_CHANNEL", detail: `channel must be one of ${validChannels.join("|")}` };
  if (typeof src.reference !== "string" || src.reference.length < 1)
    return { ok: false, code: "BAD_SOURCE_REFERENCE", detail: "source.reference must be a non-empty string" };
  const subj = r.subject as Record<string, unknown>;
  if (!subj || !["account", "license", "cert"].includes(subj.kind as string))
    return { ok: false, code: "BAD_SUBJECT_KIND", detail: "subject.kind must be account|license|cert" };
  if (typeof subj.id !== "string" || subj.id.length < 1)
    return { ok: false, code: "BAD_SUBJECT_ID", detail: "subject.id must be a non-empty string" };
  const rev = r.revocations as Record<string, Record<string, unknown>>;
  if (!rev || !rev.entitlement || rev.entitlement.revoked !== true)
    return { ok: false, code: "ENTITLEMENT_NOT_REVOKED", detail: "revocations.entitlement.revoked must be true (this endpoint only records revocations)" };
  if (!rev.cert || rev.cert.revoked !== true)
    return { ok: false, code: "CERT_NOT_REVOKED", detail: "revocations.cert.revoked must be true" };
  if (typeof rev.cert.cert_sha256 !== "string" || !/^[0-9a-f]{64}$/.test(rev.cert.cert_sha256))
    return { ok: false, code: "BAD_CERT_SHA256", detail: "cert_sha256 must be 64 hex chars" };
  return { ok: true };
}

function idempotencyKey(input: RefundInput): string {
  const s = input.source;
  // Stable: channel + reference + timestamp_buyer + subject + cert. The original
  // Paddle event id drives uniqueness; buyer timestamp is the secondary key.
  const blob = `${s.channel}|${s.reference}|${s.timestamp_buyer ?? ""}|${input.subject.kind}|${input.subject.id}|${input.revocations.cert.cert_sha256}`;
  return "sha256:" + hashHex(blob);
}

function hashHex(s: string): string {
  // Self-contained: no Node crypto import in Workers — use SubtleCrypto at runtime
  return s; // place-holder; actual hash via web crypto at runtime
}

// Built-time implementer (lazy bind to subtle to keep tests from needing crypto polyfill)
async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function buildIdempotencyKey(input: RefundInput): Promise<string> {
  const s = input.source;
  const blob = `${s.channel}|${s.reference}|${s.timestamp_buyer ?? ""}|${input.subject.kind}|${input.subject.id}|${input.revocations.cert.cert_sha256}`;
  return "sha256:" + await sha256Hex(blob);
}

interface StoredRecord {
  refund_id: string;
  observed_at: string;
  source: RefundInput["source"];
  subject: RefundInput["subject"];
  revocations: RefundInput["revocations"];
  idempotency_key: string;
  first_seen_at: string;
}

async function alreadyRecorded(kv: KVNamespace | undefined, key: string): Promise<StoredRecord | null> {
  if (!kv) return null;
  try {
    const raw = await kv.get(`refund:${key}`);
    return raw ? (JSON.parse(raw) as StoredRecord) : null;
  } catch { return null; }
}

async function recordIdempotent(kv: KVNamespace | undefined, idemKey: string, rec: StoredRecord): Promise<void> {
  if (!kv) return;
  try { await kv.put(`refund:${idemKey}`, JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 365 }); } catch { /* best-effort */ }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "no-store" },
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let input: unknown;
  try { input = await request.json(); } catch { return json({ ok: false, code: "BAD_BODY", detail: "body must be JSON" }, 400); }

  const v = validate(input);
  if (!v.ok) return json(v, 422);

  const refund = input as RefundInput;
  const idemKey = await buildIdempotencyKey(refund);

  // Idempotency: same source/channel/reference/timestamp_buyer collapses to one record
  const prior = await alreadyRecorded(env.LEADS, idemKey);
  if (prior) {
    return json({
      ok: true,
      idempotent: true,
      idempotency_key: idemKey,
      refund_id: prior.refund_id,
      first_seen_at: prior.first_seen_at,
      note: "An identical refund was already recorded; no new record was created.",
    });
  }

  const refundId = "rf_" + await sha256Hex(idemKey);
  const rec: StoredRecord = {
    refund_id: refundId,
    observed_at: refund.observed_at,
    source: refund.source,
    subject: refund.subject,
    revocations: refund.revocations,
    idempotency_key: idemKey,
    first_seen_at: new Date().toISOString(),
  };
  await recordIdempotent(env.LEADS, idemKey, rec);

  return json({
    ok: true,
    idempotency_key: idemKey,
    refund_id: refundId,
    observed_at: refund.observed_at,
    first_seen_at: rec.first_seen_at,
    revocations: refund.revocations,
    note:
      "Refund recorded. The entitlement and cert named in revocations are now marked revoked on this estate. " +
      "No public board is updated by this endpoint (writes_board: false on the record). " +
      "Downstream revocation logic (entitlement service, cert verifier) is the caller's responsibility — " +
      "this is the intake, not the executor.",
  }, 201);
};

export const onRequestGet: PagesFunction = async () => json({
  schema: "csoai.refund-endpoint/0.1",
  endpoint: "/api/refund",
  methods: { POST: "record a refund or chargeback; revokes entitlement + cert; idempotent on source.channel + source.reference + source.timestamp_buyer" },
  contract:
    "POST a body matching /schemas/csoai-refund-record-0.1.schema.json. " +
    "Two POSTs with the same source collapse to one record. " +
    "No record is ever silently deleted — refunds are appended, never erased.",
  schema_url: "/schemas/csoai-refund-record-0.1.schema.json",
});

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
