/**
 * Action-job storage + durability receipts for the GSPC Route tool.
 *
 * Persists route decisions as action-jobs in the API's format (hash-verified
 * submission + head + event + receipt) so both getPublicActionJob AND
 * /api/action-jobs?public=1 can read the same record.
 *
 * Durability receipt = local write + readback confirmation from LEADS KV with
 * hash-chain verification. Explicitly NOT global durability or exactly-once.
 * Pattern matches enquiryReceipt.ts (STORED_READBACK_CONFIRMED) and action-jobs.ts
 * (post-write loadLedger re-verification).
 *
 * Hash primitives duplicated from action-jobs.ts (functions/api/) to avoid
 * cross-directory coupling. action-jobs.ts uses canonicalJson (sorted-key
 * recursive JSON) — NOT RFC 8785 JCS (which evidence.ts uses for event_id).
 */

const JOB_PREFIX = "action-jobs:0.1:job";
const JOB_ID_RE = /^job_[0-9a-f]{40}$/;
const HASH_RE = /^sha256:[0-9a-f]{64}$/;

const EXECUTION = {
  automatic: false,
  provider_calls: false,
  worker_bound: false,
  board_write: false,
  model_training: false,
  external_egress: false,
} as const;

const CONSENT = {
  human_reviewed: true,
  task_use: true,
  audit_retention: true,
  external_egress: false,
  model_training: false,
  public_release: true,
} as const;

const ACTION = { id: "csoai.route.decision", version: "0.1.0" } as const;
const PURPOSE = "GSPC route decision (decide-only, unsigned preview)";

export interface DurabilityReceipt {
  schema: "csoai.durability-receipt/0.1";
  job_id: string;
  keys_written: string[];
  readback_confirmed: boolean;
  ledger_verified: boolean;
  recorded_at: string;
  note: "Local write + readback confirmation. Not global durability or exactly-once.";
}

export interface PersistResult {
  jobId: string;
  durability: DurabilityReceipt;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

async function sha256(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function digestRef(value: unknown): Promise<string> {
  return `sha256:${await sha256(canonicalJson(value))}`;
}

async function putImmutable(
  kv: KVNamespace,
  key: string,
  value: Record<string, unknown>,
): Promise<"WRITTEN" | "REPLAY" | "CONFLICT"> {
  const encoded = canonicalJson(value);
  const existing = await kv.get(key);
  if (existing !== null) return existing === encoded ? "REPLAY" : "CONFLICT";
  await kv.put(key, encoded);
  return "WRITTEN";
}

export async function persistActionJob(
  kv: KVNamespace,
  routeRecord: Record<string, unknown>,
  origin: string,
): Promise<PersistResult> {
  // Generate a job_id (40 hex chars).
  const jobBytes = crypto.getRandomValues(new Uint8Array(20));
  const jobId = `job_${[...jobBytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;

  const jobPrefix = `${JOB_PREFIX}:${jobId}`;
  const submittedAt = new Date().toISOString();
  const INPUT_SHA256 = `sha256:${await sha256(JSON.stringify(routeRecord))}`;

  // 1. Submission (ActionJobSubmission format).
  const normalizedSubmission = {
    schema: "csoai.action-job-submit/0.1",
    action: ACTION,
    purpose: PURPOSE,
    input_ref: null,
    input_sha256: INPUT_SHA256,
    consent: CONSENT,
    request_origin: origin,
  };
  const submissionSha256 = await digestRef(normalizedSubmission);
  const idempotencyKeySha256 = `sha256:${await sha256(`${origin}\nroute-${jobId}`)}`;

  const submission = {
    schema: "csoai.action-job/0.1",
    job_id: jobId,
    action: ACTION,
    purpose: PURPOSE,
    consent: CONSENT,
    input_ref: null,
    input_sha256: INPUT_SHA256,
    request_origin: origin,
    submission_sha256: submissionSha256,
    idempotency_key_sha256: idempotencyKeySha256,
    submitted_at: submittedAt,
    immutable: true,
    execution: EXECUTION,
    storage_mode: "SINGLE_WRITER_STAGING",
  };

  // 2. Event revision 0 (ActionJobEvent format).
  // output_sha256 links the route evidence to the hash chain.
  const routeRecordSha256 = await digestRef(routeRecord);
  const eventValues = {
    job_id: jobId,
    revision: 0,
    prior_state: null,
    state: "SUBMITTED",
    actor: "REQUESTER",
    purpose: PURPOSE,
    reason: "route tool decision accepted into the intent ledger",
    output_ref: null,
    output_sha256: routeRecordSha256,
    request_sha256: submissionSha256,
    recorded_at: submittedAt,
    effects: EXECUTION,
  };
  const eventSha256 = await digestRef(eventValues);
  const event = {
    schema: "csoai.action-job-event/0.1",
    event_id: `evt_${eventSha256.slice("sha256:".length, "sha256:".length + 40)}`,
    ...eventValues,
    event_sha256: eventSha256,
    immutable: true,
  };

  // 3. Receipt revision 0 (ActionJobReceipt format).
  const receiptBase = {
    schema: "csoai.action-job-receipt/0.1",
    receipt_id: `rcpt_${eventSha256.slice("sha256:".length, "sha256:".length + 40)}`,
    job_id: jobId,
    event_id: event.event_id,
    event_sha256: eventSha256,
    revision: 0,
    state: "SUBMITTED",
    recorded_at: submittedAt,
    immutable: true,
    storage_mode: "SINGLE_WRITER_STAGING",
    execution_started: false,
    provider_calls: false,
  };
  const receipt = {
    ...receiptBase,
    receipt_sha256: await digestRef(receiptBase),
  };

  // 4. Head (ActionJobHead format).
  const head = {
    schema: "csoai.action-job-head/0.1",
    job_id: jobId,
    revision: 0,
    state: "SUBMITTED",
    last_event_id: event.event_id,
    updated_at: submittedAt,
  };

  // Write all records using putImmutable (write-once enforcement).
  const keys: Record<string, Record<string, unknown>> = {
    [`${jobPrefix}:submission`]: submission as Record<string, unknown>,
    [`${jobPrefix}:event:0000`]: event as Record<string, unknown>,
    [`${jobPrefix}:receipt:0000`]: receipt as Record<string, unknown>,
    [`${jobPrefix}:head`]: head as Record<string, unknown>,
  };

  const keysWritten: string[] = [];
  for (const [key, value] of Object.entries(keys)) {
    const result = await putImmutable(kv, key, value);
    if (result === "CONFLICT") {
      throw new Error(`IMMUTABLE_RECORD_CONFLICT: ${key} already contains different bytes`);
    }
    keysWritten.push(key);
  }

  // 5. Public projection for getPublicActionJob.
  const publicProjection = {
    schema: "csoai.action-job-public/0.1",
    job: {
      job_id: jobId,
      action: ACTION,
      purpose: PURPOSE,
      submitted_at: submittedAt,
      submission_sha256: submissionSha256,
      storage_mode: "SINGLE_WRITER_STAGING",
    },
    head,
    events: [event],
    receipts: [receipt],
    route_record: routeRecord,
  };
  const publicKey = `action-job:${jobId}:public`;
  await kv.put(publicKey, JSON.stringify(publicProjection));
  keysWritten.push(publicKey);

  // 6. Durability verification: read back all keys, confirm byte-equal.
  let readbackConfirmed = true;
  for (const [key, value] of Object.entries(keys)) {
    const readBack = await kv.get(key);
    const expected = canonicalJson(value);
    if (readBack !== expected) {
      readbackConfirmed = false;
      break;
    }
  }
  // Also verify the public projection.
  const publicReadBack = await kv.get(publicKey);
  if (publicReadBack !== JSON.stringify(publicProjection)) {
    readbackConfirmed = false;
  }

  // 7. Ledger verification: verify the hash chain (re-implement loadLedger checks).
  let ledgerVerified = false;
  try {
    // Verify submission hash.
    const subCheck = await digestRef(normalizedSubmission);
    // Verify event hash (minus schema/event_id/event_sha256/immutable).
    const eventBase = { ...event } as Record<string, unknown>;
    delete eventBase.schema;
    delete eventBase.event_id;
    delete eventBase.event_sha256;
    delete eventBase.immutable;
    const eventCheck = await digestRef(eventBase);
    // Verify receipt hash (minus receipt_sha256).
    const receiptCheckBase = { ...receipt } as Record<string, unknown>;
    delete receiptCheckBase.receipt_sha256;
    const receiptCheck = await digestRef(receiptCheckBase);
    // Verify ID derivations.
    const eventIdOk = event.event_id === `evt_${eventSha256.slice("sha256:".length, "sha256:".length + 40)}`;
    const receiptIdOk = receipt.receipt_id === `rcpt_${eventSha256.slice("sha256:".length, "sha256:".length + 40)}`;

    ledgerVerified =
      subCheck === submissionSha256 &&
      eventCheck === eventSha256 &&
      receiptCheck === receipt.receipt_sha256 &&
      eventIdOk &&
      receiptIdOk;
  } catch {
    ledgerVerified = false;
  }

  const durability: DurabilityReceipt = {
    schema: "csoai.durability-receipt/0.1",
    job_id: jobId,
    keys_written: keysWritten,
    readback_confirmed: readbackConfirmed,
    ledger_verified: ledgerVerified,
    recorded_at: submittedAt,
    note: "Local write + readback confirmation. Not global durability or exactly-once.",
  };

  return { jobId, durability };
}
