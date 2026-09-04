/**
 * Deterministic Phase-1 action executor used only as an in-memory test fixture.
 *
 * This module proves the action lifecycle and its guardrails without implying
 * that a durable executor exists. It has no provider bindings, network calls,
 * board writes, payments, signing, anchoring, or compliance authority. The
 * factory refuses every runtime except an explicitly enabled test runtime.
 */

export const PHASE1_EXECUTOR_SCHEMA =
  "csoai.phase1-action-executor/0.1" as const;
export const PHASE1_COMMAND_SCHEMA =
  "csoai.phase1-action-command/0.1" as const;
export const PHASE1_RUN_SCHEMA = "csoai.phase1-action-run/0.1" as const;
export const PHASE1_EVENT_SCHEMA = "csoai.phase1-action-event/0.1" as const;
export const PHASE1_RECEIPT_SCHEMA =
  "csoai.phase1-action-evidence-receipt/0.1" as const;
export const PHASE1_RESPONSE_SCHEMA =
  "csoai.phase1-action-response/0.1" as const;

export const PHASE1_ACTION_KINDS = [
  "LOCAL_JSON_CANONICALIZE",
  "LOCAL_SHA256_COMPARE",
  "LOCAL_ASSERTION_RETEST",
] as const;

export type Phase1ActionKind = (typeof PHASE1_ACTION_KINDS)[number];

export const PHASE1_ACTION_STATES = [
  "AWAITING_APPROVAL",
  "APPROVED",
  "EXECUTED",
  "RETESTED",
  "EVIDENCE_RECORDED",
  "REJECTED",
  "FAILED",
] as const;

export type Phase1ActionState = (typeof PHASE1_ACTION_STATES)[number];

export const PHASE1_ACTION_TRANSITIONS: Readonly<
  Record<Phase1ActionState, readonly Phase1ActionState[]>
> = Object.freeze({
  AWAITING_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["EXECUTED", "FAILED"],
  EXECUTED: ["RETESTED", "FAILED"],
  RETESTED: ["EVIDENCE_RECORDED", "FAILED"],
  EVIDENCE_RECORDED: [],
  REJECTED: [],
  FAILED: [],
});

export const PHASE1_EXECUTOR_FIXTURE_CONTRACT = Object.freeze({
  schema: PHASE1_EXECUTOR_SCHEMA,
  mode: "IN_MEMORY_TEST_FIXTURE",
  public_endpoint_enabled: false,
  production_enabled: false,
  staging_enabled: false,
  durability: "NONE",
  concurrency_guarantee: "NONE",
  explicit_test_enable_required: true,
  allowed_action_kinds: PHASE1_ACTION_KINDS,
  approval: {
    required: true,
    requester_must_differ_from_approver: true,
  },
  lifecycle: PHASE1_ACTION_STATES,
  transitions: PHASE1_ACTION_TRANSITIONS,
  effects: {
    provider_calls: false,
    network_egress: false,
    payments: false,
    board_write: false,
    model_training: false,
    signing: false,
    anchoring: false,
    ots: false,
    compliance_determination: false,
  },
  production_upgrade_required:
    "authenticated durable executor plus transactional job, approval, idempotency, execution and evidence records",
} as const);

type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type Phase1ActorRole =
  | "REQUESTER"
  | "APPROVER"
  | "EXECUTOR"
  | "RETESTER"
  | "EVIDENCE_RECORDER";

export interface Phase1Actor {
  id: string;
  role: Phase1ActorRole;
}

type Phase1CommandName =
  | "SUBMIT"
  | "APPROVE"
  | "REJECT"
  | "EXECUTE"
  | "RETEST"
  | "RECORD_EVIDENCE";

interface CommandBase {
  schema: typeof PHASE1_COMMAND_SCHEMA;
  command: Phase1CommandName;
  actor: Phase1Actor;
  recorded_at: string;
  idempotency_key: string;
}

export interface Phase1SubmitCommand extends CommandBase {
  command: "SUBMIT";
  action_kind: Phase1ActionKind;
  input: JsonValue;
}

export interface Phase1JobCommand extends CommandBase {
  command: "APPROVE" | "EXECUTE" | "RETEST" | "RECORD_EVIDENCE";
  job_id: string;
}

export interface Phase1RejectCommand extends CommandBase {
  command: "REJECT";
  job_id: string;
  reason: string;
}

export type Phase1Command =
  | Phase1SubmitCommand
  | Phase1JobCommand
  | Phase1RejectCommand;

export interface Phase1ActionEvent {
  schema: typeof PHASE1_EVENT_SCHEMA;
  event_id: string;
  job_id: string;
  revision: number;
  command: Phase1CommandName;
  prior_state: Phase1ActionState | null;
  state: Phase1ActionState;
  actor: Phase1Actor;
  request_sha256: string;
  reason: string;
  recorded_at: string;
  event_sha256: string;
  immutable: true;
}

export interface Phase1ExecutionResult {
  action_kind: Phase1ActionKind;
  output: JsonValue;
  output_sha256: string;
  executed_by: string;
  executed_at: string;
  deterministic_local_only: true;
  external_effects: false;
}

export interface Phase1RetestResult {
  output_sha256: string;
  execution_output_sha256: string;
  reproducible: boolean;
  retested_by: string;
  retested_at: string;
  deterministic_local_only: true;
}

export interface Phase1EvidenceReceipt {
  schema: typeof PHASE1_RECEIPT_SCHEMA;
  receipt_id: string;
  job_id: string;
  action_kind: Phase1ActionKind;
  input_sha256: string;
  execution_output_sha256: string;
  retest_output_sha256: string;
  reproducible: true;
  requested_by: string;
  approved_by: string;
  executed_by: string;
  retested_by: string;
  recorded_by: string;
  recorded_at: string;
  durable: false;
  signed: false;
  anchored: false;
  ots: false;
  compliance_determination: false;
  receipt_sha256: string;
  immutable: true;
}

export interface Phase1ActionRun {
  schema: typeof PHASE1_RUN_SCHEMA;
  job_id: string;
  action_kind: Phase1ActionKind;
  state: Phase1ActionState;
  revision: number;
  requested_by: string;
  approved_by: string | null;
  input: JsonValue;
  input_sha256: string;
  execution: Phase1ExecutionResult | null;
  retest: Phase1RetestResult | null;
  evidence_receipt: Phase1EvidenceReceipt | null;
  events: Phase1ActionEvent[];
  runtime: "IN_MEMORY_TEST_FIXTURE";
  durable: false;
  external_effects: false;
}

export interface Phase1DispatchResult {
  schema: typeof PHASE1_RESPONSE_SCHEMA;
  ok: true;
  replayed: boolean;
  replay_of_revision: number | null;
  run: Phase1ActionRun;
  contract: typeof PHASE1_EXECUTOR_FIXTURE_CONTRACT;
}

export class Phase1ExecutorError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "Phase1ExecutorError";
  }
}

type ReplayRecord = {
  request_sha256: string;
  result: Phase1DispatchResult;
};

const encoder = new TextEncoder();
const HASH = /^sha256:[0-9a-f]{64}$/;
const JOB_ID = /^job_[0-9a-f]{40}$/;
const ACTOR_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{2,63}$/;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

function fail(code: string, message: string): never {
  throw new Phase1ExecutorError(code, message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
}

function isJsonValue(value: unknown, seen = new WeakSet<object>()): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  )
    return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value))
    return value.every((item) => isJsonValue(item, seen));
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Object.values(value).every((item) => isJsonValue(item, seen));
}

function canonicalJson(value: JsonValue): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
}

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(value: string): Promise<string> {
  return `sha256:${hex(
    await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(value) as unknown as BufferSource,
    ),
  )}`;
}

async function digest(value: JsonValue): Promise<string> {
  return sha256(canonicalJson(value));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function validTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString() === value;
}

function parseActor(value: unknown): Phase1Actor {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["id", "role"]) ||
    typeof value.id !== "string" ||
    !ACTOR_ID.test(value.id) ||
    ![
      "REQUESTER",
      "APPROVER",
      "EXECUTOR",
      "RETESTER",
      "EVIDENCE_RECORDER",
    ].includes(String(value.role))
  )
    fail("INVALID_ACTOR", "actor must have a bounded id and known role");
  return value as unknown as Phase1Actor;
}

function parseCommand(value: unknown): Phase1Command {
  if (!isRecord(value)) fail("INVALID_COMMAND", "command must be an object");
  if (
    value.schema !== PHASE1_COMMAND_SCHEMA ||
    typeof value.command !== "string" ||
    !validTimestamp(value.recorded_at) ||
    typeof value.idempotency_key !== "string" ||
    !IDEMPOTENCY_KEY.test(value.idempotency_key)
  )
    fail("INVALID_COMMAND", "command envelope is invalid");
  const actor = parseActor(value.actor);
  const common = {
    schema: PHASE1_COMMAND_SCHEMA,
    actor,
    recorded_at: value.recorded_at,
    idempotency_key: value.idempotency_key,
  } as const;

  if (value.command === "SUBMIT") {
    if (
      !hasExactKeys(value, [
        "schema",
        "command",
        "actor",
        "recorded_at",
        "idempotency_key",
        "action_kind",
        "input",
      ]) ||
      actor.role !== "REQUESTER" ||
      !PHASE1_ACTION_KINDS.includes(value.action_kind as Phase1ActionKind) ||
      !isJsonValue(value.input) ||
      encoder.encode(canonicalJson(value.input)).byteLength > 8 * 1024
    )
      fail(
        "INVALID_SUBMISSION",
        "submission must use an allowed local action, a requester actor and at most 8KB of JSON input",
      );
    return {
      ...common,
      command: "SUBMIT",
      action_kind: value.action_kind as Phase1ActionKind,
      input: clone(value.input),
    };
  }

  if (
    !["APPROVE", "REJECT", "EXECUTE", "RETEST", "RECORD_EVIDENCE"].includes(
      value.command,
    ) ||
    typeof value.job_id !== "string" ||
    !JOB_ID.test(value.job_id)
  )
    fail("INVALID_COMMAND", "job command is invalid");

  if (value.command === "REJECT") {
    if (
      !hasExactKeys(value, [
        "schema",
        "command",
        "actor",
        "recorded_at",
        "idempotency_key",
        "job_id",
        "reason",
      ]) ||
      actor.role !== "APPROVER" ||
      typeof value.reason !== "string" ||
      value.reason.trim().length < 3 ||
      value.reason.trim().length > 280
    )
      fail("INVALID_REJECTION", "rejection requires an approver and reason");
    return {
      ...common,
      command: "REJECT",
      job_id: value.job_id,
      reason: value.reason.trim(),
    };
  }

  if (
    !hasExactKeys(value, [
      "schema",
      "command",
      "actor",
      "recorded_at",
      "idempotency_key",
      "job_id",
    ])
  )
    fail("INVALID_COMMAND", "job command contains unknown fields");
  const expectedRole: Record<Exclude<Phase1CommandName, "SUBMIT" | "REJECT">, Phase1ActorRole> = {
    APPROVE: "APPROVER",
    EXECUTE: "EXECUTOR",
    RETEST: "RETESTER",
    RECORD_EVIDENCE: "EVIDENCE_RECORDER",
  };
  if (actor.role !== expectedRole[value.command as keyof typeof expectedRole])
    fail("ROLE_REQUIRED", `${value.command} requires its dedicated actor role`);
  return {
    ...common,
    command: value.command as Phase1JobCommand["command"],
    job_id: value.job_id,
  };
}

function validateActionInput(kind: Phase1ActionKind, input: JsonValue): void {
  if (!isRecord(input)) fail("INVALID_ACTION_INPUT", "action input must be an object");
  if (kind === "LOCAL_JSON_CANONICALIZE") {
    if (!hasExactKeys(input, ["value"]))
      fail("INVALID_ACTION_INPUT", "canonicalize input requires value only");
    return;
  }
  if (kind === "LOCAL_SHA256_COMPARE") {
    if (
      !hasExactKeys(input, ["claimed_sha256", "value"]) ||
      typeof input.claimed_sha256 !== "string" ||
      !HASH.test(input.claimed_sha256)
    )
      fail(
        "INVALID_ACTION_INPUT",
        "digest comparison requires value and sha256:<64 lowercase hex>",
      );
    return;
  }
  if (
    !hasExactKeys(input, ["assertions"]) ||
    !Array.isArray(input.assertions) ||
    input.assertions.length < 1 ||
    input.assertions.length > 64 ||
    !input.assertions.every(
      (assertion) =>
        isRecord(assertion) &&
        hasExactKeys(assertion, ["id", "actual", "expected"]) &&
        typeof assertion.id === "string" &&
        /^[a-z0-9][a-z0-9._:-]{1,63}$/.test(assertion.id) &&
        isJsonValue(assertion.actual) &&
        isJsonValue(assertion.expected),
    )
  )
    fail(
      "INVALID_ACTION_INPUT",
      "retest input requires 1-64 exact id/actual/expected assertions",
    );
}

async function executeLocalAction(
  kind: Phase1ActionKind,
  input: JsonValue,
): Promise<JsonValue> {
  validateActionInput(kind, input);
  const record = input as Record<string, JsonValue>;
  if (kind === "LOCAL_JSON_CANONICALIZE") {
    const canonical = canonicalJson(record.value);
    return {
      schema: "csoai.local-json-canonicalize-result/0.1",
      canonical_json: canonical,
      canonical_sha256: await sha256(canonical),
    };
  }
  if (kind === "LOCAL_SHA256_COMPARE") {
    const computed = await digest(record.value);
    return {
      schema: "csoai.local-sha256-compare-result/0.1",
      claimed_sha256: record.claimed_sha256,
      computed_sha256: computed,
      matches: computed === record.claimed_sha256,
    };
  }
  const assertions = record.assertions as Array<{
    id: string;
    actual: JsonValue;
    expected: JsonValue;
  }>;
  const results = assertions.map((assertion) => ({
    id: assertion.id,
    passed:
      canonicalJson(assertion.actual) === canonicalJson(assertion.expected),
  }));
  return {
    schema: "csoai.local-assertion-retest-result/0.1",
    all_passed: results.every((result) => result.passed),
    results,
  };
}

async function commandDigest(command: Phase1Command): Promise<string> {
  const { idempotency_key: _rawKey, ...withoutRawKey } = command;
  return digest({
    ...(withoutRawKey as unknown as Record<string, JsonValue>),
    idempotency_key_sha256: await sha256(command.idempotency_key),
  });
}

async function appendEvent(
  run: Phase1ActionRun,
  command: Phase1Command,
  state: Phase1ActionState,
  requestSha256: string,
  reason: string,
): Promise<Phase1ActionRun> {
  if (!PHASE1_ACTION_TRANSITIONS[run.state].includes(state))
    fail("INVALID_STATE_TRANSITION", `${run.state} cannot transition to ${state}`);
  const base = {
    job_id: run.job_id,
    revision: run.revision + 1,
    command: command.command,
    prior_state: run.state,
    state,
    actor: command.actor,
    request_sha256: requestSha256,
    reason,
    recorded_at: command.recorded_at,
  } as const;
  const eventSha256 = await digest(base as unknown as JsonValue);
  const event: Phase1ActionEvent = {
    schema: PHASE1_EVENT_SCHEMA,
    event_id: `evt_${eventSha256.slice("sha256:".length, "sha256:".length + 40)}`,
    ...base,
    event_sha256: eventSha256,
    immutable: true,
  };
  return {
    ...run,
    state,
    revision: event.revision,
    events: [...run.events, event],
  };
}

function response(run: Phase1ActionRun): Phase1DispatchResult {
  return {
    schema: PHASE1_RESPONSE_SCHEMA,
    ok: true,
    replayed: false,
    replay_of_revision: null,
    run,
    contract: PHASE1_EXECUTOR_FIXTURE_CONTRACT,
  };
}

/**
 * Non-durable harness for contract and UI tests. It cannot be constructed for
 * staging or production, even accidentally, and is not exported by a route.
 */
export class Phase1ActionExecutorFixture {
  private readonly runs = new Map<string, Phase1ActionRun>();
  private readonly replays = new Map<string, ReplayRecord>();

  private constructor() {}

  static create(options: {
    runtime: string;
    explicitly_enable_test_fixture: boolean;
  }): Phase1ActionExecutorFixture {
    if (
      options.runtime !== "test" ||
      options.explicitly_enable_test_fixture !== true
    )
      fail(
        "EXECUTOR_UNAVAILABLE",
        "the in-memory executor is test-only; production and staging require a real durable executor",
      );
    return new Phase1ActionExecutorFixture();
  }

  get(jobId: string): Phase1ActionRun | null {
    const run = this.runs.get(jobId);
    return run ? clone(run) : null;
  }

  async dispatch(value: unknown): Promise<Phase1DispatchResult> {
    const command = parseCommand(value);
    const [requestSha256, keySha256] = await Promise.all([
      commandDigest(command),
      sha256(command.idempotency_key),
    ]);
    const replayScope =
      command.command === "SUBMIT"
        ? `submit:${keySha256}`
        : `job:${command.job_id}:${keySha256}`;
    const prior = this.replays.get(replayScope);
    if (prior) {
      if (prior.request_sha256 !== requestSha256)
        fail(
          "IDEMPOTENCY_CONFLICT",
          "the idempotency key is already bound to different command bytes",
        );
      const replayed = clone(prior.result);
      replayed.replayed = true;
      replayed.replay_of_revision = prior.result.run.revision;
      return replayed;
    }

    let next: Phase1ActionRun;
    if (command.command === "SUBMIT") {
      validateActionInput(command.action_kind, command.input);
      const inputSha256 = await digest(command.input);
      const jobSeed = await digest({
        request_sha256: requestSha256,
        input_sha256: inputSha256,
        action_kind: command.action_kind,
        requested_by: command.actor.id,
      });
      const jobId = `job_${jobSeed.slice("sha256:".length, "sha256:".length + 40)}`;
      const eventBase = {
        job_id: jobId,
        revision: 0,
        command: "SUBMIT" as const,
        prior_state: null,
        state: "AWAITING_APPROVAL" as const,
        actor: command.actor,
        request_sha256: requestSha256,
        reason: "bounded local action submitted for independent approval",
        recorded_at: command.recorded_at,
      };
      const eventSha256 = await digest(eventBase as unknown as JsonValue);
      next = {
        schema: PHASE1_RUN_SCHEMA,
        job_id: jobId,
        action_kind: command.action_kind,
        state: "AWAITING_APPROVAL",
        revision: 0,
        requested_by: command.actor.id,
        approved_by: null,
        input: clone(command.input),
        input_sha256: inputSha256,
        execution: null,
        retest: null,
        evidence_receipt: null,
        events: [
          {
            schema: PHASE1_EVENT_SCHEMA,
            event_id: `evt_${eventSha256.slice("sha256:".length, "sha256:".length + 40)}`,
            ...eventBase,
            event_sha256: eventSha256,
            immutable: true,
          },
        ],
        runtime: "IN_MEMORY_TEST_FIXTURE",
        durable: false,
        external_effects: false,
      };
    } else {
      const current = this.runs.get(command.job_id);
      if (!current) fail("JOB_NOT_FOUND", "the in-memory job does not exist");
      if (command.command === "APPROVE" || command.command === "REJECT") {
        if (command.actor.id === current.requested_by)
          fail(
            "APPROVER_SEPARATION_REQUIRED",
            "the requester cannot approve or reject their own action",
          );
      }
      if (command.command === "APPROVE") {
        next = await appendEvent(
          current,
          command,
          "APPROVED",
          requestSha256,
          "independent approver authorized bounded local execution",
        );
        next.approved_by = command.actor.id;
      } else if (command.command === "REJECT") {
        next = await appendEvent(
          current,
          command,
          "REJECTED",
          requestSha256,
          `independent approver rejected the action: ${command.reason}`,
        );
      } else if (command.command === "EXECUTE") {
        if (current.state !== "APPROVED") {
          if (current.state === "AWAITING_APPROVAL")
            fail("APPROVAL_REQUIRED", "execution requires an approval record");
          fail(
            "INVALID_STATE_TRANSITION",
            `${current.state} cannot transition to EXECUTED`,
          );
        }
        if (!current.approved_by)
          fail("APPROVAL_REQUIRED", "execution requires an approval record");
        const output = await executeLocalAction(
          current.action_kind,
          current.input,
        );
        next = await appendEvent(
          current,
          command,
          "EXECUTED",
          requestSha256,
          "deterministic local-only action completed without external effects",
        );
        next.execution = {
          action_kind: current.action_kind,
          output,
          output_sha256: await digest(output),
          executed_by: command.actor.id,
          executed_at: command.recorded_at,
          deterministic_local_only: true,
          external_effects: false,
        };
      } else if (command.command === "RETEST") {
        if (current.state !== "EXECUTED")
          fail(
            "INVALID_STATE_TRANSITION",
            `${current.state} cannot transition to RETESTED`,
          );
        if (!current.execution)
          fail("EXECUTION_REQUIRED", "retest requires an execution result");
        const output = await executeLocalAction(
          current.action_kind,
          current.input,
        );
        const outputSha256 = await digest(output);
        const reproducible = outputSha256 === current.execution.output_sha256;
        next = await appendEvent(
          current,
          command,
          reproducible ? "RETESTED" : "FAILED",
          requestSha256,
          reproducible
            ? "independent deterministic retest reproduced the execution output"
            : "deterministic retest did not reproduce the execution output",
        );
        next.retest = {
          output_sha256: outputSha256,
          execution_output_sha256: current.execution.output_sha256,
          reproducible,
          retested_by: command.actor.id,
          retested_at: command.recorded_at,
          deterministic_local_only: true,
        };
      } else {
        if (current.state !== "RETESTED")
          fail(
            "INVALID_STATE_TRANSITION",
            `${current.state} cannot transition to EVIDENCE_RECORDED`,
          );
        if (
          !current.execution ||
          !current.retest ||
          current.retest.reproducible !== true ||
          !current.approved_by
        )
          fail(
            "RETEST_REQUIRED",
            "evidence receipt requires an approved, executed and reproducibly retested action",
          );
        const receiptBase = {
          schema: PHASE1_RECEIPT_SCHEMA,
          job_id: current.job_id,
          action_kind: current.action_kind,
          input_sha256: current.input_sha256,
          execution_output_sha256: current.execution.output_sha256,
          retest_output_sha256: current.retest.output_sha256,
          reproducible: true as const,
          requested_by: current.requested_by,
          approved_by: current.approved_by,
          executed_by: current.execution.executed_by,
          retested_by: current.retest.retested_by,
          recorded_by: command.actor.id,
          recorded_at: command.recorded_at,
          durable: false as const,
          signed: false as const,
          anchored: false as const,
          ots: false as const,
          compliance_determination: false as const,
          immutable: true as const,
        };
        const receiptSha256 = await digest(receiptBase as unknown as JsonValue);
        next = await appendEvent(
          current,
          command,
          "EVIDENCE_RECORDED",
          requestSha256,
          "local evidence receipt recorded without durability, signature, anchor or compliance claim",
        );
        next.evidence_receipt = {
          ...receiptBase,
          receipt_id: `p1rcpt_${receiptSha256.slice("sha256:".length, "sha256:".length + 40)}`,
          receipt_sha256: receiptSha256,
        };
      }
    }

    const result = response(clone(next));
    this.runs.set(next.job_id, clone(next));
    this.replays.set(replayScope, {
      request_sha256: requestSha256,
      result: clone(result),
    });
    return result;
  }
}
