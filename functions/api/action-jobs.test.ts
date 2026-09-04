import { describe, expect, it, vi } from "vitest";
import {
  ACTION_JOB_LEDGER_CONTRACT,
  ACTION_JOB_STATES,
  MAX_ACTION_JOB_REQUEST_BYTES,
  onRequestGet,
  onRequestPatch,
  onRequestPost,
} from "./action-jobs";

const ORIGIN = "https://councilof.ai";
const WRITER_SECRET = "test-action-job-writer";

type MemoryKv = {
  binding: KVNamespace;
  store: Map<string, string>;
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

function memoryKv(): MemoryKv {
  const store = new Map<string, string>();
  const get = vi.fn(async (key: string) => store.get(key) ?? null);
  const put = vi.fn(async (key: string, value: string) => {
    store.set(key, value);
  });
  return {
    binding: { get, put } as unknown as KVNamespace,
    store,
    get,
    put,
  };
}

function submission(overrides: Record<string, unknown> = {}) {
  return {
    schema: "csoai.action-job-submit/0.1",
    action: { id: "csoai.measurement.request", version: "0.1.0" },
    purpose: "Request a reviewed independent measurement",
    idempotency_key: "submit-request-0001",
    input_ref: "/private/evidence/candidate-001.json",
    input_sha256: `sha256:${"a".repeat(64)}`,
    consent: {
      human_reviewed: true,
      task_use: true,
      audit_retention: true,
      external_egress: false,
      model_training: false,
      public_release: false,
    },
    ...overrides,
  };
}

function submitRequest(
  body: unknown,
  origin: string | null = ORIGIN,
  authorization: string | null = `Bearer ${WRITER_SECRET}`,
): Request {
  return new Request(`${ORIGIN}/api/action-jobs`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(origin === null ? {} : { origin }),
      ...(authorization === null ? {} : { authorization }),
    },
    body: JSON.stringify(body),
  });
}

function transition(jobId: string, overrides: Record<string, unknown> = {}) {
  return {
    schema: "csoai.action-job-transition/0.1",
    job_id: jobId,
    expected_revision: 0,
    from_state: "SUBMITTED",
    to_state: "WORKING",
    purpose: "Record an authorized operator state report",
    reason: "A separately configured operator accepted review",
    idempotency_key: "transition-request-0001",
    output_ref: null,
    output_sha256: null,
    consent: { human_reviewed: true, state_change: true },
    ...overrides,
  };
}

function transitionRequest(
  body: unknown,
  options: { origin?: string | null; authorization?: string | null } = {},
): Request {
  const origin = options.origin === undefined ? ORIGIN : options.origin;
  const authorization =
    options.authorization === undefined
      ? `Bearer ${WRITER_SECRET}`
      : options.authorization;
  return new Request(`${ORIGIN}/api/action-jobs`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(origin === null ? {} : { origin }),
      ...(authorization === null ? {} : { authorization }),
    },
    body: JSON.stringify(body),
  });
}

async function submit(kv: MemoryKv) {
  const response = await onRequestPost({
    request: submitRequest(submission()),
    env: { LEADS: kv.binding, ACTION_JOBS_WRITER_SECRET: WRITER_SECRET },
  } as never);
  return {
    response,
    body: (await response.json()) as Record<string, any>,
  };
}

describe("/api/action-jobs durable intent ledger", () => {
  it("publishes the bounded single-writer contract without claiming execution", () => {
    expect(ACTION_JOB_STATES).toEqual([
      "SUBMITTED",
      "WORKING",
      "INPUT_REQUIRED",
      "AUTH_REQUIRED",
      "COMPLETED",
      "FAILED",
      "CANCELED",
      "REJECTED",
    ]);
    expect(ACTION_JOB_LEDGER_CONTRACT).toMatchObject({
      schema: "csoai.action-job-contract/0.1",
      storage: {
        binding: "LEADS",
        mode: "SINGLE_WRITER_STAGING",
        concurrency_guarantee: "NONE",
      },
      requests: {
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
      phase1_executor_fixture: {
        mode: "IN_MEMORY_TEST_FIXTURE",
        public_endpoint_enabled: false,
        production_enabled: false,
        staging_enabled: false,
        durability: "NONE",
      },
    });
  });

  it("creates deterministic write-once submission, event and receipt records", async () => {
    const firstKv = memoryKv();
    const first = await submit(firstKv);

    expect(first.response.status).toBe(202);
    expect(first.body).toMatchObject({
      schema: "csoai.action-job-response/0.1",
      ok: true,
      replayed: false,
      job: {
        schema: "csoai.action-job/0.1",
        purpose: "Request a reviewed independent measurement",
        immutable: true,
        storage_mode: "SINGLE_WRITER_STAGING",
        execution: { automatic: false, provider_calls: false },
      },
      head: { revision: 0, state: "SUBMITTED" },
      events: [
        {
          schema: "csoai.action-job-event/0.1",
          revision: 0,
          state: "SUBMITTED",
          immutable: true,
          effects: { automatic: false, provider_calls: false },
        },
      ],
      receipts: [
        {
          schema: "csoai.action-job-receipt/0.1",
          revision: 0,
          state: "SUBMITTED",
          immutable: true,
          execution_started: false,
          provider_calls: false,
        },
      ],
      execution_started: false,
      provider_calls: false,
    });
    expect(first.body.job.job_id).toMatch(/^job_[0-9a-f]{40}$/);
    expect(firstKv.store.size).toBe(5);
    expect([...firstKv.store.keys()]).toEqual(
      expect.arrayContaining([
        expect.stringContaining(":submission"),
        expect.stringContaining(":event:0000"),
        expect.stringContaining(":receipt:0000"),
        expect.stringContaining(":head"),
      ]),
    );
    expect([...firstKv.store.values()].join("\n")).not.toContain(
      "submit-request-0001",
    );

    const secondKv = memoryKv();
    const second = await submit(secondKv);
    expect(second.body.job.job_id).toBe(first.body.job.job_id);
  });

  it("replays the same submission without another write", async () => {
    const kv = memoryKv();
    const first = await submit(kv);
    const writesAfterFirst = kv.put.mock.calls.length;
    const replay = await submit(kv);

    expect(replay.response.status).toBe(200);
    expect(replay.body.replayed).toBe(true);
    expect(replay.body.job.job_id).toBe(first.body.job.job_id);
    expect(kv.put).toHaveBeenCalledTimes(writesAfterFirst);
  });

  it("rejects an idempotency mutation and preserves all immutable bytes", async () => {
    const kv = memoryKv();
    await submit(kv);
    const before = new Map(kv.store);
    const writesBefore = kv.put.mock.calls.length;
    const response = await onRequestPost({
      request: submitRequest(
        submission({
          purpose: "Use the same key for different mutable intent",
        }),
      ),
      env: { LEADS: kv.binding, ACTION_JOBS_WRITER_SECRET: WRITER_SECRET },
    } as never);

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: "IDEMPOTENCY_CONFLICT",
      execution_started: false,
      provider_calls: false,
    });
    expect(kv.store).toEqual(before);
    expect(kv.put).toHaveBeenCalledTimes(writesBefore);
  });

  it("appends an authorized transition, replays it, and rejects mutation", async () => {
    const kv = memoryKv();
    const created = await submit(kv);
    const jobId = String(created.body.job.job_id);
    const first = await onRequestPatch({
      request: transitionRequest(transition(jobId)),
      env: {
        LEADS: kv.binding,
        ACTION_JOBS_WRITER_SECRET: WRITER_SECRET,
      },
    } as never);
    const firstBody = (await first.json()) as Record<string, any>;

    expect(first.status).toBe(202);
    expect(firstBody).toMatchObject({
      replayed: false,
      head: { revision: 1, state: "WORKING" },
      execution_started: false,
      provider_calls: false,
    });
    expect(firstBody.events).toHaveLength(2);
    expect(firstBody.receipts).toHaveLength(2);
    const writesAfterFirst = kv.put.mock.calls.length;

    const replay = await onRequestPatch({
      request: transitionRequest(transition(jobId)),
      env: {
        LEADS: kv.binding,
        ACTION_JOBS_WRITER_SECRET: WRITER_SECRET,
      },
    } as never);
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({
      replayed: true,
      head: { revision: 1, state: "WORKING" },
    });
    expect(kv.put).toHaveBeenCalledTimes(writesAfterFirst);

    const mutation = await onRequestPatch({
      request: transitionRequest(
        transition(jobId, {
          reason: "Attempt to change immutable transition intent",
        }),
      ),
      env: {
        LEADS: kv.binding,
        ACTION_JOBS_WRITER_SECRET: WRITER_SECRET,
      },
    } as never);
    expect(mutation.status).toBe(409);
    expect(await mutation.json()).toMatchObject({
      error: "IDEMPOTENCY_CONFLICT",
      execution_started: false,
    });
  });

  it("rejects invalid and terminal state transitions without writes", async () => {
    const kv = memoryKv();
    const created = await submit(kv);
    const jobId = String(created.body.job.job_id);
    const writesBefore = kv.put.mock.calls.length;
    const response = await onRequestPatch({
      request: transitionRequest(
        transition(jobId, {
          from_state: "SUBMITTED",
          to_state: "COMPLETED",
        }),
      ),
      env: {
        LEADS: kv.binding,
        ACTION_JOBS_WRITER_SECRET: WRITER_SECRET,
      },
    } as never);

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: "INVALID_STATE_TRANSITION",
      execution_started: false,
    });
    expect(kv.put).toHaveBeenCalledTimes(writesBefore);

    const terminalAttempt = await onRequestPatch({
      request: transitionRequest(
        transition(jobId, {
          expected_revision: 8,
          from_state: "COMPLETED",
          to_state: "WORKING",
          idempotency_key: "terminal-mutation-0001",
        }),
      ),
      env: {
        LEADS: kv.binding,
        ACTION_JOBS_WRITER_SECRET: WRITER_SECRET,
      },
    } as never);
    expect(terminalAttempt.status).toBe(409);
    expect(await terminalAttempt.json()).toMatchObject({
      error: "INVALID_STATE_TRANSITION",
    });
    expect(kv.put).toHaveBeenCalledTimes(writesBefore);
  });

  it("fails closed when LEADS or transition writer authority is unavailable", async () => {
    const noBinding = await onRequestPost({
      request: submitRequest(submission()),
      env: { ACTION_JOBS_WRITER_SECRET: WRITER_SECRET },
    } as never);
    expect(noBinding.status).toBe(503);
    expect(await noBinding.json()).toMatchObject({
      error: "DURABLE_STORE_UNAVAILABLE",
      execution_started: false,
    });

    const submissionKv = memoryKv();
    const noSubmissionWriter = await onRequestPost({
      request: submitRequest(submission(), ORIGIN, null),
      env: { LEADS: submissionKv.binding },
    } as never);
    expect(noSubmissionWriter.status).toBe(503);
    expect(await noSubmissionWriter.json()).toMatchObject({
      error: "WRITER_AUTH_UNAVAILABLE",
    });
    expect(submissionKv.put).not.toHaveBeenCalled();

    const deniedSubmission = await onRequestPost({
      request: submitRequest(submission(), ORIGIN, "Bearer wrong-secret"),
      env: {
        LEADS: submissionKv.binding,
        ACTION_JOBS_WRITER_SECRET: WRITER_SECRET,
      },
    } as never);
    expect(deniedSubmission.status).toBe(401);
    expect(await deniedSubmission.json()).toMatchObject({
      error: "WRITER_AUTH_REQUIRED",
    });
    expect(submissionKv.put).not.toHaveBeenCalled();

    const kv = memoryKv();
    const created = await submit(kv);
    const jobId = String(created.body.job.job_id);
    const noWriter = await onRequestPatch({
      request: transitionRequest(transition(jobId)),
      env: { LEADS: kv.binding },
    } as never);
    expect(noWriter.status).toBe(503);
    expect(await noWriter.json()).toMatchObject({
      error: "WRITER_AUTH_UNAVAILABLE",
    });
    const denied = await onRequestPatch({
      request: transitionRequest(transition(jobId), {
        authorization: "Bearer wrong-secret",
      }),
      env: {
        LEADS: kv.binding,
        ACTION_JOBS_WRITER_SECRET: WRITER_SECRET,
      },
    } as never);
    expect(denied.status).toBe(401);
    expect(await denied.json()).toMatchObject({
      error: "WRITER_AUTH_REQUIRED",
    });
  });

  it("requires exact same-origin mutation requests", async () => {
    for (const origin of [null, "https://outside.example"]) {
      const kv = memoryKv();
      const response = await onRequestPost({
        request: submitRequest(submission(), origin),
        env: { LEADS: kv.binding, ACTION_JOBS_WRITER_SECRET: WRITER_SECRET },
      } as never);
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        error: "ORIGIN_REQUIRED",
        execution_started: false,
      });
      expect(kv.put).not.toHaveBeenCalled();
    }
  });

  it("rejects oversized and non-strict requests before persistence", async () => {
    const oversizedKv = memoryKv();
    const oversized = await onRequestPost({
      request: submitRequest({
        ...submission(),
        padding: "x".repeat(MAX_ACTION_JOB_REQUEST_BYTES),
      }),
      env: {
        LEADS: oversizedKv.binding,
        ACTION_JOBS_WRITER_SECRET: WRITER_SECRET,
      },
    } as never);
    expect(oversized.status).toBe(413);
    expect(await oversized.json()).toMatchObject({ error: "INVALID_REQUEST" });
    expect(oversizedKv.put).not.toHaveBeenCalled();

    const strictKv = memoryKv();
    const extraField = await onRequestPost({
      request: submitRequest({ ...submission(), unexpected: true }),
      env: {
        LEADS: strictKv.binding,
        ACTION_JOBS_WRITER_SECRET: WRITER_SECRET,
      },
    } as never);
    expect(extraField.status).toBe(400);
    expect(await extraField.json()).toMatchObject({
      error: "INVALID_SUBMISSION",
    });
    expect(strictKv.put).not.toHaveBeenCalled();
  });

  it("reads a complete ledger but rejects cross-origin reads", async () => {
    const kv = memoryKv();
    const created = await submit(kv);
    const jobId = String(created.body.job.job_id);
    const response = await onRequestGet({
      request: new Request(`${ORIGIN}/api/action-jobs?job_id=${jobId}`, {
        headers: { authorization: `Bearer ${WRITER_SECRET}` },
      }),
      env: { LEADS: kv.binding, ACTION_JOBS_WRITER_SECRET: WRITER_SECRET },
    } as never);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      job: { job_id: jobId },
      head: { state: "SUBMITTED" },
    });

    const crossOrigin = await onRequestGet({
      request: new Request(`${ORIGIN}/api/action-jobs?job_id=${jobId}`, {
        headers: {
          origin: "https://outside.example",
          authorization: `Bearer ${WRITER_SECRET}`,
        },
      }),
      env: { LEADS: kv.binding, ACTION_JOBS_WRITER_SECRET: WRITER_SECRET },
    } as never);
    expect(crossOrigin.status).toBe(403);
    expect(await crossOrigin.json()).toMatchObject({ error: "CROSS_ORIGIN" });

    const publicContract = await onRequestGet({
      request: new Request(`${ORIGIN}/api/action-jobs`),
      env: { LEADS: kv.binding },
    } as never);
    expect(publicContract.status).toBe(200);
    expect(await publicContract.json()).toMatchObject({
      schema: "csoai.action-job-contract/0.1",
      durable: true,
      ledger_reads: "AUTHENTICATED_WRITER_ONLY",
    });

    const privateKv = memoryKv();
    const unavailableReader = await onRequestGet({
      request: new Request(`${ORIGIN}/api/action-jobs?job_id=${jobId}`),
      env: { LEADS: privateKv.binding },
    } as never);
    expect(unavailableReader.status).toBe(503);
    expect(privateKv.get).not.toHaveBeenCalled();

    const deniedReader = await onRequestGet({
      request: new Request(`${ORIGIN}/api/action-jobs?job_id=${jobId}`, {
        headers: { authorization: "Bearer wrong-secret" },
      }),
      env: {
        LEADS: privateKv.binding,
        ACTION_JOBS_WRITER_SECRET: WRITER_SECRET,
      },
    } as never);
    expect(deniedReader.status).toBe(401);
    expect(privateKv.get).not.toHaveBeenCalled();
  });
});
