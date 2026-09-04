/**
 * /api/action-jobs — bounded, durable action-intent ledger staging.
 *
 * This endpoint records reviewed intent and state reports. It never calls a
 * provider, starts a worker, writes GSPC, trains a model, spends money, or sends
 * data off-origin. LEADS KV is already used for Council intake records, so it is
 * the only storage binding used here.
 *
 * KV has no compare-and-swap transaction. Immutable submissions, events and
 * receipts use write-once keys, but the head and idempotency indexes cannot be
 * made safe under concurrent writers. This implementation is therefore
 * explicitly SINGLE_WRITER_STAGING. Production multi-writer execution requires
 * a Durable Object or transactional D1 ledger before execution can be enabled.
 */

import { PHASE1_EXECUTOR_FIXTURE_CONTRACT } from "../_lib/phase1ActionExecutor";

interface Env {
  LEADS?: KVNamespace;
  ACTION_JOBS_WRITER_SECRET?: string;
}

export const ACTION_JOB_SCHEMA = "csoai.action-job/0.1" as const;
export const ACTION_JOB_SUBMIT_SCHEMA = "csoai.action-job-submit/0.1" as const;
export const ACTION_JOB_TRANSITION_SCHEMA =
  "csoai.action-job-transition/0.1" as const;
export const ACTION_JOB_EVENT_SCHEMA = "csoai.action-job-event/0.1" as const;
export const ACTION_JOB_RECEIPT_SCHEMA =
  "csoai.action-job-receipt/0.1" as const;
export const ACTION_JOB_HEAD_SCHEMA = "csoai.action-job-head/0.1" as const;
export const ACTION_JOB_RESPONSE_SCHEMA =
  "csoai.action-job-response/0.1" as const;
export const ACTION_JOB_CONTRACT_SCHEMA =
  "csoai.action-job-contract/0.1" as const;

export const MAX_ACTION_JOB_REQUEST_BYTES = 8 * 1024;
export const MAX_ACTION_JOB_EVENTS = 64;

export const ACTION_JOB_STATES = [
  "SUBMITTED",
  "WORKING",
  "INPUT_REQUIRED",
  "AUTH_REQUIRED",
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "REJECTED",
] as const;

export type ActionJobState = (typeof ACTION_JOB_STATES)[number];

export const ACTION_JOB_TRANSITIONS: Readonly<
  Record<ActionJobState, readonly ActionJobState[]>
> = Object.freeze({
  SUBMITTED: [
    "WORKING",
    "INPUT_REQUIRED",
    "AUTH_REQUIRED",
    "FAILED",
    "CANCELED",
    "REJECTED",
  ],
  WORKING: [
    "INPUT_REQUIRED",
    "AUTH_REQUIRED",
    "COMPLETED",
    "FAILED",
    "CANCELED",
  ],
  INPUT_REQUIRED: ["WORKING", "FAILED", "CANCELED", "REJECTED"],
  AUTH_REQUIRED: ["WORKING", "FAILED", "CANCELED", "REJECTED"],
  COMPLETED: [],
  FAILED: [],
  CANCELED: [],
  REJECTED: [],
});

export const ACTION_JOB_LEDGER_CONTRACT = Object.freeze({
  schema: ACTION_JOB_CONTRACT_SCHEMA,
  storage: {
    binding: "LEADS",
    mode: "SINGLE_WRITER_STAGING",
    immutable_records: ["submission", "event", "receipt"],
    mutable_pointers: ["head", "idempotency_index"],
    concurrency_guarantee: "NONE",
    recovery:
      "partial immutable writes fail closed; a matching event and receipt may only advance their mutable head/index pointers",
    production_upgrade_required:
      "Durable Object serialization or transactional D1 compare-and-swap",
  },
  requests: {
    submit_schema: ACTION_JOB_SUBMIT_SCHEMA,
    transition_schema: ACTION_JOB_TRANSITION_SCHEMA,
    exact_same_origin_mutations: true,
    authenticated_writer: true,
    public_browser_mutations: false,
    explicit_purpose: true,
    explicit_consent: true,
  },
  execution: {
    automatic: false,
    provider_calls: false,
    worker_bound: false,
    board_write: false,
    model_training: false,
    external_egress: false,
  },
  phase1_executor_fixture: PHASE1_EXECUTOR_FIXTURE_CONTRACT,
  limits: {
    request_bytes: MAX_ACTION_JOB_REQUEST_BYTES,
    events_per_job: MAX_ACTION_JOB_EVENTS,
  },
  states: ACTION_JOB_STATES,
  transitions: ACTION_JOB_TRANSITIONS,
} as const);

type JsonRecord = Record<string, unknown>;

type ActionRef = {
  id: string;
  version: string;
};

type SubmissionConsent = {
  human_reviewed: true;
  task_use: true;
  audit_retention: true;
  external_egress: boolean;
  model_training: boolean;
  public_release: boolean;
};

type SubmitRequest = {
  schema: typeof ACTION_JOB_SUBMIT_SCHEMA;
  action: ActionRef;
  purpose: string;
  idempotency_key: string;
  input_ref: string | null;
  input_sha256: string | null;
  consent: SubmissionConsent;
};

type TransitionRequest = {
  schema: typeof ACTION_JOB_TRANSITION_SCHEMA;
  job_id: string;
  expected_revision: number;
  from_state: ActionJobState;
  to_state: ActionJobState;
  purpose: string;
  reason: string;
  idempotency_key: string;
  output_ref: string | null;
  output_sha256: string | null;
  consent: {
    human_reviewed: true;
    state_change: true;
  };
};

export type ActionJobSubmission = {
  schema: typeof ACTION_JOB_SCHEMA;
  job_id: string;
  action: ActionRef;
  purpose: string;
  consent: SubmissionConsent;
  input_ref: string | null;
  input_sha256: string | null;
  request_origin: string;
  submission_sha256: string;
  idempotency_key_sha256: string;
  submitted_at: string;
  immutable: true;
  execution: typeof ACTION_JOB_LEDGER_CONTRACT.execution;
  storage_mode: "SINGLE_WRITER_STAGING";
};

export type ActionJobEvent = {
  schema: typeof ACTION_JOB_EVENT_SCHEMA;
  event_id: string;
  job_id: string;
  revision: number;
  prior_state: ActionJobState | null;
  state: ActionJobState;
  actor: "REQUESTER" | "AUTHORIZED_WRITER";
  purpose: string;
  reason: string;
  output_ref: string | null;
  output_sha256: string | null;
  request_sha256: string;
  event_sha256: string;
  recorded_at: string;
  immutable: true;
  effects: typeof ACTION_JOB_LEDGER_CONTRACT.execution;
};

export type ActionJobReceipt = {
  schema: typeof ACTION_JOB_RECEIPT_SCHEMA;
  receipt_id: string;
  job_id: string;
  event_id: string;
  event_sha256: string;
  revision: number;
  state: ActionJobState;
  recorded_at: string;
  receipt_sha256: string;
  immutable: true;
  storage_mode: "SINGLE_WRITER_STAGING";
  execution_started: false;
  provider_calls: false;
};

export type ActionJobHead = {
  schema: typeof ACTION_JOB_HEAD_SCHEMA;
  job_id: string;
  revision: number;
  state: ActionJobState;
  last_event_id: string;
  updated_at: string;
};

type IdempotencyIndex = {
  schema: "csoai.action-job-idempotency/0.1";
  job_id: string;
  request_sha256: string;
  revision: number;
  receipt_key: string;
};

type BodyRead =
  { ok: true; value: unknown } | { ok: false; status: number; error: string };

const JOB_ID = /^job_[0-9a-f]{40}$/;
const HASH = /^sha256:[0-9a-f]{64}$/;
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const ACTION_ID = /^[a-z0-9]+(?:[._-][a-z0-9]+){1,15}$/;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const CONTROL = /[\u0000-\u001f\u007f]/;
const encoder = new TextEncoder();

const jobPrefix = (jobId: string) => `action-jobs:0.1:job:${jobId}`;
const submissionKey = (jobId: string) => `${jobPrefix(jobId)}:submission`;
const headKey = (jobId: string) => `${jobPrefix(jobId)}:head`;
const eventKey = (jobId: string, revision: number) =>
  `${jobPrefix(jobId)}:event:${String(revision).padStart(4, "0")}`;
const receiptKey = (jobId: string, revision: number) =>
  `${jobPrefix(jobId)}:receipt:${String(revision).padStart(4, "0")}`;
const submitIndexKey = (hash: string) => `action-jobs:0.1:submit:${hash}`;
const transitionIndexKey = (jobId: string, hash: string) =>
  `${jobPrefix(jobId)}:transition:${hash}`;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: JsonRecord, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function boundedText(
  value: unknown,
  min: number,
  max: number,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= min &&
    value.trim().length <= max &&
    !CONTROL.test(value)
  );
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  const record = value as JsonRecord;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(value: string): Promise<string> {
  return hex(
    await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(value) as unknown as BufferSource,
    ),
  );
}

async function digestRef(value: unknown): Promise<string> {
  return `sha256:${await sha256(canonicalJson(value))}`;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function error(status: number, code: string, message: string): Response {
  return json(
    {
      schema: ACTION_JOB_RESPONSE_SCHEMA,
      ok: false,
      error: code,
      message,
      execution_started: false,
      provider_calls: false,
      storage_mode: "SINGLE_WRITER_STAGING",
    },
    status,
  );
}

function exactSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin) && origin === new URL(request.url).origin;
}

function visibleSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function sameOriginRef(value: unknown, origin: string): value is string | null {
  if (value === null) return true;
  if (typeof value !== "string" || value.length > 500 || !value.startsWith("/"))
    return false;
  try {
    const parsed = new URL(value, origin);
    return parsed.origin === origin && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function refAndDigest(ref: unknown, digest: unknown, origin: string): boolean {
  return (
    sameOriginRef(ref, origin) &&
    ((ref === null && digest === null) ||
      (typeof ref === "string" &&
        typeof digest === "string" &&
        HASH.test(digest)))
  );
}

async function readBody(request: Request): Promise<BodyRead> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json"))
    return {
      ok: false,
      status: 415,
      error: "content-type must be application/json",
    };
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_ACTION_JOB_REQUEST_BYTES)
    return { ok: false, status: 413, error: "request exceeds the 8KB limit" };
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > MAX_ACTION_JOB_REQUEST_BYTES)
    return { ok: false, status: 413, error: "request exceeds the 8KB limit" };
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, status: 400, error: "body must be JSON" };
  }
}

function parseSubmit(value: unknown, origin: string): SubmitRequest | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "schema",
      "action",
      "purpose",
      "idempotency_key",
      "input_ref",
      "input_sha256",
      "consent",
    ]) ||
    value.schema !== ACTION_JOB_SUBMIT_SCHEMA ||
    !isRecord(value.action) ||
    !hasExactKeys(value.action, ["id", "version"]) ||
    !boundedText(value.action.id, 3, 120) ||
    !ACTION_ID.test(value.action.id) ||
    !boundedText(value.action.version, 5, 80) ||
    !SEMVER.test(value.action.version) ||
    !boundedText(value.purpose, 8, 280) ||
    !boundedText(value.idempotency_key, 8, 128) ||
    !IDEMPOTENCY_KEY.test(value.idempotency_key) ||
    !refAndDigest(value.input_ref, value.input_sha256, origin) ||
    !isRecord(value.consent) ||
    !hasExactKeys(value.consent, [
      "human_reviewed",
      "task_use",
      "audit_retention",
      "external_egress",
      "model_training",
      "public_release",
    ]) ||
    value.consent.human_reviewed !== true ||
    value.consent.task_use !== true ||
    value.consent.audit_retention !== true ||
    typeof value.consent.external_egress !== "boolean" ||
    typeof value.consent.model_training !== "boolean" ||
    typeof value.consent.public_release !== "boolean"
  )
    return null;
  return {
    schema: ACTION_JOB_SUBMIT_SCHEMA,
    action: {
      id: value.action.id.trim(),
      version: value.action.version.trim(),
    },
    purpose: value.purpose.trim(),
    idempotency_key: value.idempotency_key,
    input_ref: value.input_ref as string | null,
    input_sha256: value.input_sha256 as string | null,
    consent: value.consent as SubmissionConsent,
  };
}

function isState(value: unknown): value is ActionJobState {
  return ACTION_JOB_STATES.includes(value as ActionJobState);
}

function parseTransition(
  value: unknown,
  origin: string,
): TransitionRequest | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "schema",
      "job_id",
      "expected_revision",
      "from_state",
      "to_state",
      "purpose",
      "reason",
      "idempotency_key",
      "output_ref",
      "output_sha256",
      "consent",
    ]) ||
    value.schema !== ACTION_JOB_TRANSITION_SCHEMA ||
    typeof value.job_id !== "string" ||
    !JOB_ID.test(value.job_id) ||
    !Number.isSafeInteger(value.expected_revision) ||
    Number(value.expected_revision) < 0 ||
    Number(value.expected_revision) >= MAX_ACTION_JOB_EVENTS - 1 ||
    !isState(value.from_state) ||
    !isState(value.to_state) ||
    !boundedText(value.purpose, 8, 280) ||
    !boundedText(value.reason, 3, 500) ||
    !boundedText(value.idempotency_key, 8, 128) ||
    !IDEMPOTENCY_KEY.test(value.idempotency_key) ||
    !refAndDigest(value.output_ref, value.output_sha256, origin) ||
    !isRecord(value.consent) ||
    !hasExactKeys(value.consent, ["human_reviewed", "state_change"]) ||
    value.consent.human_reviewed !== true ||
    value.consent.state_change !== true
  )
    return null;
  return {
    schema: ACTION_JOB_TRANSITION_SCHEMA,
    job_id: value.job_id,
    expected_revision: Number(value.expected_revision),
    from_state: value.from_state,
    to_state: value.to_state,
    purpose: value.purpose.trim(),
    reason: value.reason.trim(),
    idempotency_key: value.idempotency_key,
    output_ref: value.output_ref as string | null,
    output_sha256: value.output_sha256 as string | null,
    consent: value.consent as TransitionRequest["consent"],
  };
}

function safeJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? (parsed as T) : null;
  } catch {
    return null;
  }
}

async function getJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  return safeJson<T>(await kv.get(key));
}

type ImmutablePut = "WRITTEN" | "REPLAY" | "CONFLICT";

async function putImmutable(
  kv: KVNamespace,
  key: string,
  value: JsonRecord,
): Promise<ImmutablePut> {
  const encoded = canonicalJson(value);
  const existing = await kv.get(key);
  if (existing !== null) return existing === encoded ? "REPLAY" : "CONFLICT";
  await kv.put(key, encoded);
  return "WRITTEN";
}

function recordsNoExecution(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, [
      "automatic",
      "provider_calls",
      "worker_bound",
      "board_write",
      "model_training",
      "external_egress",
    ]) &&
    Object.values(value).every((claim) => claim === false)
  );
}

async function loadLedger(kv: KVNamespace, jobId: string) {
  const [job, head] = await Promise.all([
    getJson<ActionJobSubmission>(kv, submissionKey(jobId)),
    getJson<ActionJobHead>(kv, headKey(jobId)),
  ]);
  if (
    !job ||
    !head ||
    job.schema !== ACTION_JOB_SCHEMA ||
    head.schema !== ACTION_JOB_HEAD_SCHEMA ||
    job.job_id !== jobId ||
    head.job_id !== jobId ||
    job.immutable !== true ||
    job.storage_mode !== "SINGLE_WRITER_STAGING" ||
    !recordsNoExecution(job.execution) ||
    !HASH.test(job.submission_sha256) ||
    !HASH.test(job.idempotency_key_sha256)
  )
    return null;
  const submissionSha256 = await digestRef({
    schema: ACTION_JOB_SUBMIT_SCHEMA,
    action: job.action,
    purpose: job.purpose,
    input_ref: job.input_ref,
    input_sha256: job.input_sha256,
    consent: job.consent,
    request_origin: job.request_origin,
  });
  if (submissionSha256 !== job.submission_sha256) return null;
  if (
    !Number.isSafeInteger(head.revision) ||
    head.revision < 0 ||
    head.revision >= MAX_ACTION_JOB_EVENTS ||
    !isState(head.state)
  )
    return null;
  const events: ActionJobEvent[] = [];
  const receipts: ActionJobReceipt[] = [];
  for (let revision = 0; revision <= head.revision; revision += 1) {
    const [event, receipt] = await Promise.all([
      getJson<ActionJobEvent>(kv, eventKey(jobId, revision)),
      getJson<ActionJobReceipt>(kv, receiptKey(jobId, revision)),
    ]);
    if (
      !event ||
      !receipt ||
      event.schema !== ACTION_JOB_EVENT_SCHEMA ||
      receipt.schema !== ACTION_JOB_RECEIPT_SCHEMA ||
      event.job_id !== jobId ||
      receipt.job_id !== jobId ||
      event.revision !== revision ||
      receipt.revision !== revision ||
      event.immutable !== true ||
      receipt.immutable !== true ||
      !recordsNoExecution(event.effects) ||
      receipt.execution_started !== false ||
      receipt.provider_calls !== false ||
      receipt.storage_mode !== "SINGLE_WRITER_STAGING" ||
      !isState(event.state) ||
      receipt.state !== event.state ||
      receipt.event_id !== event.event_id ||
      receipt.event_sha256 !== event.event_sha256 ||
      !HASH.test(event.request_sha256) ||
      !HASH.test(event.event_sha256) ||
      !HASH.test(receipt.receipt_sha256)
    )
      return null;
    const {
      schema: _eventSchema,
      event_id: _eventId,
      event_sha256: _eventSha256,
      immutable: _eventImmutable,
      ...eventBase
    } = event;
    const { receipt_sha256: _receiptSha256, ...receiptBase } = receipt;
    if (
      event.event_id !==
        `evt_${event.event_sha256.slice("sha256:".length, "sha256:".length + 40)}` ||
      receipt.receipt_id !==
        `rcpt_${event.event_sha256.slice("sha256:".length, "sha256:".length + 40)}` ||
      event.event_sha256 !== (await digestRef(eventBase)) ||
      receipt.receipt_sha256 !== (await digestRef(receiptBase)) ||
      (revision === 0
        ? event.prior_state !== null || event.state !== "SUBMITTED"
        : event.prior_state !== events[revision - 1]?.state)
    )
      return null;
    events.push(event);
    receipts.push(receipt);
  }
  const lastEvent = events[head.revision];
  if (
    !lastEvent ||
    head.state !== lastEvent.state ||
    head.last_event_id !== lastEvent.event_id
  )
    return null;
  return { job, head, events, receipts };
}

function responseFor(
  ledger: NonNullable<Awaited<ReturnType<typeof loadLedger>>>,
  replayed: boolean,
  status = 200,
): Response {
  return json(
    {
      schema: ACTION_JOB_RESPONSE_SCHEMA,
      ok: true,
      replayed,
      ...ledger,
      contract: ACTION_JOB_LEDGER_CONTRACT,
      execution_started: false,
      provider_calls: false,
    },
    status,
  );
}

function constantTimeEqual(left: string, right: string): boolean {
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let mismatch = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1)
    mismatch |= (a[index] ?? 0) ^ (b[index] ?? 0);
  return mismatch === 0;
}

function writerAuthorized(
  request: Request,
  env: Env,
): "OK" | "MISSING" | "DENIED" {
  const secret = env.ACTION_JOBS_WRITER_SECRET?.trim();
  if (!secret) return "MISSING";
  const authorization = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return constantTimeEqual(authorization, expected) ? "OK" : "DENIED";
}

async function makeEvent(
  values: Omit<
    ActionJobEvent,
    "schema" | "event_id" | "event_sha256" | "immutable"
  >,
): Promise<ActionJobEvent> {
  const eventSha256 = await digestRef(values);
  return {
    schema: ACTION_JOB_EVENT_SCHEMA,
    event_id: `evt_${eventSha256.slice("sha256:".length, "sha256:".length + 40)}`,
    ...values,
    event_sha256: eventSha256,
    immutable: true,
  };
}

async function makeReceipt(event: ActionJobEvent): Promise<ActionJobReceipt> {
  const base = {
    schema: ACTION_JOB_RECEIPT_SCHEMA,
    receipt_id: `rcpt_${event.event_sha256.slice("sha256:".length, "sha256:".length + 40)}`,
    job_id: event.job_id,
    event_id: event.event_id,
    event_sha256: event.event_sha256,
    revision: event.revision,
    state: event.state,
    recorded_at: event.recorded_at,
    immutable: true as const,
    storage_mode: "SINGLE_WRITER_STAGING" as const,
    execution_started: false as const,
    provider_calls: false as const,
  };
  return { ...base, receipt_sha256: await digestRef(base) };
}

async function recoverInitialReplay(
  kv: KVNamespace,
  jobId: string,
  requestSha256: string,
  indexHash: string,
): Promise<Response | null> {
  const existing = await getJson<ActionJobSubmission>(kv, submissionKey(jobId));
  if (!existing) return null;
  if (existing.submission_sha256 !== requestSha256)
    return error(
      409,
      "IDEMPOTENCY_CONFLICT",
      "the idempotency key is already bound to different immutable submission bytes",
    );
  let ledger = await loadLedger(kv, jobId);
  if (!ledger) {
    const [event, receipt, storedHead] = await Promise.all([
      getJson<ActionJobEvent>(kv, eventKey(jobId, 0)),
      getJson<ActionJobReceipt>(kv, receiptKey(jobId, 0)),
      getJson<ActionJobHead>(kv, headKey(jobId)),
    ]);
    if (
      !event ||
      !receipt ||
      event.job_id !== jobId ||
      event.revision !== 0 ||
      event.prior_state !== null ||
      event.state !== "SUBMITTED" ||
      event.request_sha256 !== requestSha256 ||
      receipt.job_id !== jobId ||
      receipt.revision !== 0 ||
      receipt.event_id !== event.event_id ||
      receipt.event_sha256 !== event.event_sha256
    )
      return error(
        503,
        "LEDGER_INCOMPLETE",
        "partial immutable submission records require operator reconciliation",
      );
    const recoveredHead: ActionJobHead = {
      schema: ACTION_JOB_HEAD_SCHEMA,
      job_id: jobId,
      revision: 0,
      state: "SUBMITTED",
      last_event_id: event.event_id,
      updated_at: event.recorded_at,
    };
    if (
      storedHead &&
      canonicalJson(storedHead) !== canonicalJson(recoveredHead)
    )
      return error(
        503,
        "LEDGER_INCOMPLETE",
        "the mutable head conflicts with the immutable submission records",
      );
    if (!storedHead) await kv.put(headKey(jobId), canonicalJson(recoveredHead));
    ledger = await loadLedger(kv, jobId);
    if (!ledger)
      return error(
        503,
        "LEDGER_INCOMPLETE",
        "submission pointer recovery did not produce a complete ledger",
      );
  }
  const index: IdempotencyIndex = {
    schema: "csoai.action-job-idempotency/0.1",
    job_id: jobId,
    request_sha256: requestSha256,
    revision: 0,
    receipt_key: receiptKey(jobId, 0),
  };
  const put = await putImmutable(kv, submitIndexKey(indexHash), index);
  if (put === "CONFLICT")
    return error(409, "IDEMPOTENCY_CONFLICT", "submission index conflicts");
  return responseFor(ledger, true);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!exactSameOrigin(request))
    return error(
      403,
      "ORIGIN_REQUIRED",
      "action submissions require an exact same-origin Origin header",
    );
  const authorization = writerAuthorized(request, env);
  if (authorization === "MISSING")
    return error(
      503,
      "WRITER_AUTH_UNAVAILABLE",
      "no submission writer is configured; the public endpoint is read-only",
    );
  if (authorization === "DENIED")
    return error(
      401,
      "WRITER_AUTH_REQUIRED",
      "authorized writer token required",
    );
  if (!env.LEADS)
    return error(
      503,
      "DURABLE_STORE_UNAVAILABLE",
      "LEADS is not bound; no job or receipt was recorded",
    );

  const read = await readBody(request);
  if (!read.ok) return error(read.status, "INVALID_REQUEST", read.error);
  const origin = new URL(request.url).origin;
  const submitted = parseSubmit(read.value, origin);
  if (!submitted)
    return error(
      400,
      "INVALID_SUBMISSION",
      "submit body does not match the strict action-job-submit/0.1 schema or explicit consent contract",
    );

  const normalized = {
    schema: submitted.schema,
    action: submitted.action,
    purpose: submitted.purpose,
    input_ref: submitted.input_ref,
    input_sha256: submitted.input_sha256,
    consent: submitted.consent,
    request_origin: origin,
  };
  const [requestSha256, indexHash] = await Promise.all([
    digestRef(normalized),
    sha256(`${origin}\n${submitted.idempotency_key}`),
  ]);
  const jobId = `job_${indexHash.slice(0, 40)}`;
  const kv = env.LEADS;

  try {
    const indexed = await getJson<IdempotencyIndex>(
      kv,
      submitIndexKey(indexHash),
    );
    if (indexed) {
      if (indexed.job_id !== jobId || indexed.request_sha256 !== requestSha256)
        return error(
          409,
          "IDEMPOTENCY_CONFLICT",
          "the idempotency key is already bound to different immutable submission bytes",
        );
      const ledger = await loadLedger(kv, jobId);
      return ledger
        ? responseFor(ledger, true)
        : error(
            503,
            "LEDGER_INCOMPLETE",
            "the idempotency index exists but immutable job records are incomplete",
          );
    }

    const recovered = await recoverInitialReplay(
      kv,
      jobId,
      requestSha256,
      indexHash,
    );
    if (recovered) return recovered;

    const submittedAt = new Date().toISOString();
    const idempotencyKeySha256 = `sha256:${indexHash}`;
    const job: ActionJobSubmission = {
      schema: ACTION_JOB_SCHEMA,
      job_id: jobId,
      action: submitted.action,
      purpose: submitted.purpose,
      consent: submitted.consent,
      input_ref: submitted.input_ref,
      input_sha256: submitted.input_sha256,
      request_origin: origin,
      submission_sha256: requestSha256,
      idempotency_key_sha256: idempotencyKeySha256,
      submitted_at: submittedAt,
      immutable: true,
      execution: ACTION_JOB_LEDGER_CONTRACT.execution,
      storage_mode: "SINGLE_WRITER_STAGING",
    };
    const event = await makeEvent({
      job_id: jobId,
      revision: 0,
      prior_state: null,
      state: "SUBMITTED",
      actor: "REQUESTER",
      purpose: submitted.purpose,
      reason: "explicit same-origin submission accepted into the intent ledger",
      output_ref: null,
      output_sha256: null,
      request_sha256: requestSha256,
      recorded_at: submittedAt,
      effects: ACTION_JOB_LEDGER_CONTRACT.execution,
    });
    const receipt = await makeReceipt(event);
    const head: ActionJobHead = {
      schema: ACTION_JOB_HEAD_SCHEMA,
      job_id: jobId,
      revision: 0,
      state: "SUBMITTED",
      last_event_id: event.event_id,
      updated_at: submittedAt,
    };
    const index: IdempotencyIndex = {
      schema: "csoai.action-job-idempotency/0.1",
      job_id: jobId,
      request_sha256: requestSha256,
      revision: 0,
      receipt_key: receiptKey(jobId, 0),
    };

    for (const [key, value] of [
      [submissionKey(jobId), job],
      [eventKey(jobId, 0), event],
      [receiptKey(jobId, 0), receipt],
    ] as const) {
      const written = await putImmutable(
        kv,
        key,
        value as unknown as JsonRecord,
      );
      if (written === "CONFLICT")
        return error(
          409,
          "IMMUTABLE_RECORD_CONFLICT",
          "a write-once job record already contains different bytes",
        );
    }
    await kv.put(headKey(jobId), canonicalJson(head));
    const indexWrite = await putImmutable(kv, submitIndexKey(indexHash), index);
    if (indexWrite === "CONFLICT")
      return error(409, "IDEMPOTENCY_CONFLICT", "submission index conflicts");
    const ledger = await loadLedger(kv, jobId);
    return ledger
      ? responseFor(ledger, false, 202)
      : error(
          503,
          "LEDGER_INCOMPLETE",
          "job records were not readable after storage; no durable receipt is claimed",
        );
  } catch {
    return error(
      503,
      "DURABLE_WRITE_FAILED",
      "the durable ledger write failed; no complete receipt is claimed",
    );
  }
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  if (!exactSameOrigin(request))
    return error(
      403,
      "ORIGIN_REQUIRED",
      "state transitions require an exact same-origin Origin header",
    );
  if (!env.LEADS)
    return error(
      503,
      "DURABLE_STORE_UNAVAILABLE",
      "LEADS is not bound; no state event was recorded",
    );
  const authorization = writerAuthorized(request, env);
  if (authorization === "MISSING")
    return error(
      503,
      "WRITER_AUTH_UNAVAILABLE",
      "no transition writer is configured; the ledger remains read/submit only",
    );
  if (authorization === "DENIED")
    return error(
      401,
      "WRITER_AUTH_REQUIRED",
      "authorized writer token required",
    );

  const read = await readBody(request);
  if (!read.ok) return error(read.status, "INVALID_REQUEST", read.error);
  const origin = new URL(request.url).origin;
  const transition = parseTransition(read.value, origin);
  if (!transition)
    return error(
      400,
      "INVALID_TRANSITION_REQUEST",
      "transition body does not match the strict action-job-transition/0.1 schema",
    );

  const normalized = {
    schema: transition.schema,
    job_id: transition.job_id,
    expected_revision: transition.expected_revision,
    from_state: transition.from_state,
    to_state: transition.to_state,
    purpose: transition.purpose,
    reason: transition.reason,
    output_ref: transition.output_ref,
    output_sha256: transition.output_sha256,
    consent: transition.consent,
    request_origin: origin,
  };
  const [requestSha256, transitionHash] = await Promise.all([
    digestRef(normalized),
    sha256(`${transition.job_id}\n${transition.idempotency_key}`),
  ]);
  const kv = env.LEADS;

  try {
    const indexed = await getJson<IdempotencyIndex>(
      kv,
      transitionIndexKey(transition.job_id, transitionHash),
    );
    if (indexed) {
      if (
        indexed.job_id !== transition.job_id ||
        indexed.request_sha256 !== requestSha256
      )
        return error(
          409,
          "IDEMPOTENCY_CONFLICT",
          "the transition idempotency key is already bound to different immutable bytes",
        );
      const ledger = await loadLedger(kv, transition.job_id);
      return ledger
        ? responseFor(ledger, true)
        : error(
            503,
            "LEDGER_INCOMPLETE",
            "the transition index exists but the bounded ledger is incomplete",
          );
    }

    if (
      !ACTION_JOB_TRANSITIONS[transition.from_state].includes(
        transition.to_state,
      )
    )
      return error(
        409,
        "INVALID_STATE_TRANSITION",
        `${transition.from_state} cannot transition to ${transition.to_state}`,
      );

    const revision = transition.expected_revision + 1;
    const current = await loadLedger(kv, transition.job_id);
    if (!current)
      return error(404, "JOB_NOT_FOUND", "no complete durable job was found");
    const existingEvent = await getJson<ActionJobEvent>(
      kv,
      eventKey(transition.job_id, revision),
    );
    if (existingEvent) {
      if (existingEvent.request_sha256 !== requestSha256)
        return error(
          409,
          "IMMUTABLE_RECORD_CONFLICT",
          "the next write-once event slot already contains different bytes",
        );
      const existingReceipt = await getJson<ActionJobReceipt>(
        kv,
        receiptKey(transition.job_id, revision),
      );
      if (
        !existingReceipt ||
        existingReceipt.job_id !== transition.job_id ||
        existingReceipt.revision !== revision ||
        existingReceipt.event_id !== existingEvent.event_id ||
        existingReceipt.event_sha256 !== existingEvent.event_sha256
      )
        return error(
          503,
          "LEDGER_INCOMPLETE",
          "the immutable event exists without its receipt",
        );
      if (
        current.head.revision === transition.expected_revision &&
        current.head.state === transition.from_state
      ) {
        const recoveredHead: ActionJobHead = {
          schema: ACTION_JOB_HEAD_SCHEMA,
          job_id: transition.job_id,
          revision,
          state: existingEvent.state,
          last_event_id: existingEvent.event_id,
          updated_at: existingEvent.recorded_at,
        };
        await kv.put(headKey(transition.job_id), canonicalJson(recoveredHead));
      } else if (
        current.head.revision < revision ||
        current.events[revision]?.event_id !== existingEvent.event_id
      ) {
        return error(
          409,
          "REVISION_CONFLICT",
          `expected revision/state does not match the current immutable head (${current.head.revision}/${current.head.state})`,
        );
      }
      const recoveredIndex: IdempotencyIndex = {
        schema: "csoai.action-job-idempotency/0.1",
        job_id: transition.job_id,
        request_sha256: requestSha256,
        revision,
        receipt_key: receiptKey(transition.job_id, revision),
      };
      const indexWrite = await putImmutable(
        kv,
        transitionIndexKey(transition.job_id, transitionHash),
        recoveredIndex,
      );
      if (indexWrite === "CONFLICT")
        return error(409, "IDEMPOTENCY_CONFLICT", "transition index conflicts");
      const recovered = await loadLedger(kv, transition.job_id);
      return recovered
        ? responseFor(recovered, true)
        : error(503, "LEDGER_INCOMPLETE", "transition recovery was incomplete");
    }

    if (
      current.head.revision !== transition.expected_revision ||
      current.head.state !== transition.from_state
    )
      return error(
        409,
        "REVISION_CONFLICT",
        `expected revision/state does not match the current immutable head (${current.head.revision}/${current.head.state})`,
      );

    const recordedAt = new Date().toISOString();
    const event = await makeEvent({
      job_id: transition.job_id,
      revision,
      prior_state: transition.from_state,
      state: transition.to_state,
      actor: "AUTHORIZED_WRITER",
      purpose: transition.purpose,
      reason: transition.reason,
      output_ref: transition.output_ref,
      output_sha256: transition.output_sha256,
      request_sha256: requestSha256,
      recorded_at: recordedAt,
      effects: ACTION_JOB_LEDGER_CONTRACT.execution,
    });
    const receipt = await makeReceipt(event);
    const head: ActionJobHead = {
      schema: ACTION_JOB_HEAD_SCHEMA,
      job_id: transition.job_id,
      revision,
      state: transition.to_state,
      last_event_id: event.event_id,
      updated_at: recordedAt,
    };
    const index: IdempotencyIndex = {
      schema: "csoai.action-job-idempotency/0.1",
      job_id: transition.job_id,
      request_sha256: requestSha256,
      revision,
      receipt_key: receiptKey(transition.job_id, revision),
    };

    for (const [key, value] of [
      [eventKey(transition.job_id, revision), event],
      [receiptKey(transition.job_id, revision), receipt],
    ] as const) {
      const written = await putImmutable(
        kv,
        key,
        value as unknown as JsonRecord,
      );
      if (written === "CONFLICT")
        return error(
          409,
          "IMMUTABLE_RECORD_CONFLICT",
          "a write-once transition record already contains different bytes",
        );
    }
    await kv.put(headKey(transition.job_id), canonicalJson(head));
    const indexWrite = await putImmutable(
      kv,
      transitionIndexKey(transition.job_id, transitionHash),
      index,
    );
    if (indexWrite === "CONFLICT")
      return error(409, "IDEMPOTENCY_CONFLICT", "transition index conflicts");
    const ledger = await loadLedger(kv, transition.job_id);
    return ledger
      ? responseFor(ledger, false, 202)
      : error(
          503,
          "LEDGER_INCOMPLETE",
          "transition records were not readable after storage",
        );
  } catch {
    return error(
      503,
      "DURABLE_WRITE_FAILED",
      "the durable state write failed; no complete receipt is claimed",
    );
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!visibleSameOrigin(request))
    return error(
      403,
      "CROSS_ORIGIN",
      "cross-origin ledger reads are not allowed",
    );

  const url = new URL(request.url);
  const jobId = url.searchParams.get("job_id");
  if (!jobId)
    return json({
      ...ACTION_JOB_LEDGER_CONTRACT,
      durable: Boolean(env.LEADS),
      ledger_reads: "AUTHENTICATED_WRITER_ONLY",
    });

  const authorization = writerAuthorized(request, env);
  if (authorization === "MISSING")
    return error(
      503,
      "WRITER_AUTH_UNAVAILABLE",
      "no ledger reader is configured; job records remain private",
    );
  if (authorization === "DENIED")
    return error(
      401,
      "WRITER_AUTH_REQUIRED",
      "authorized writer token required",
    );
  if (!env.LEADS)
    return json(
      {
        ...ACTION_JOB_LEDGER_CONTRACT,
        durable: false,
        error: "DURABLE_STORE_UNAVAILABLE",
        message: "LEADS is not bound; no durable job state can be read",
      },
      503,
    );

  if (!JOB_ID.test(jobId))
    return error(400, "INVALID_JOB_ID", "job_id has an unsupported shape");
  try {
    const ledger = await loadLedger(env.LEADS, jobId);
    return ledger
      ? responseFor(ledger, false)
      : error(404, "JOB_NOT_FOUND", "no complete durable job was found");
  } catch {
    return error(
      503,
      "DURABLE_READ_FAILED",
      "the bounded ledger could not be read",
    );
  }
};
