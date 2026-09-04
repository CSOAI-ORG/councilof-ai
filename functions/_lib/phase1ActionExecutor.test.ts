import { describe, expect, it } from "vitest";
import {
  PHASE1_ACTION_KINDS,
  PHASE1_ACTION_STATES,
  PHASE1_COMMAND_SCHEMA,
  PHASE1_EXECUTOR_FIXTURE_CONTRACT,
  Phase1ActionExecutorFixture,
  Phase1ExecutorError,
} from "./phase1ActionExecutor";

const at = (second: number) =>
  `2026-09-04T09:00:${String(second).padStart(2, "0")}.000Z`;

const actor = (
  id: string,
  role:
    | "REQUESTER"
    | "APPROVER"
    | "EXECUTOR"
    | "RETESTER"
    | "EVIDENCE_RECORDER",
) => ({ id, role });

const submitCommand = () => ({
  schema: PHASE1_COMMAND_SCHEMA,
  command: "SUBMIT",
  actor: actor("requester_01", "REQUESTER"),
  recorded_at: at(0),
  idempotency_key: "submit-local-action-0001",
  action_kind: "LOCAL_ASSERTION_RETEST",
  input: {
    assertions: [
      { id: "control.present", actual: true, expected: true },
      { id: "control.version", actual: 2, expected: 3 },
    ],
  },
});

const jobCommand = (
  command: "APPROVE" | "EXECUTE" | "RETEST" | "RECORD_EVIDENCE",
  jobId: string,
  id: string,
  role: "APPROVER" | "EXECUTOR" | "RETESTER" | "EVIDENCE_RECORDER",
  second: number,
) => ({
  schema: PHASE1_COMMAND_SCHEMA,
  command,
  actor: actor(id, role),
  recorded_at: at(second),
  idempotency_key: `${command.toLowerCase()}-command-0001`,
  job_id: jobId,
});

function fixture() {
  return Phase1ActionExecutorFixture.create({
    runtime: "test",
    explicitly_enable_test_fixture: true,
  });
}

async function expectCode(work: Promise<unknown>, code: string) {
  await expect(work).rejects.toMatchObject<Partial<Phase1ExecutorError>>({
    name: "Phase1ExecutorError",
    code,
  });
}

describe("Phase-1 deterministic action executor fixture", () => {
  it("is explicitly non-durable and refuses staging or production", () => {
    expect(PHASE1_EXECUTOR_FIXTURE_CONTRACT).toMatchObject({
      mode: "IN_MEMORY_TEST_FIXTURE",
      public_endpoint_enabled: false,
      production_enabled: false,
      staging_enabled: false,
      durability: "NONE",
      approval: {
        required: true,
        requester_must_differ_from_approver: true,
      },
      effects: {
        provider_calls: false,
        network_egress: false,
        signing: false,
        anchoring: false,
        ots: false,
        compliance_determination: false,
      },
    });
    expect(PHASE1_ACTION_KINDS).toEqual([
      "LOCAL_JSON_CANONICALIZE",
      "LOCAL_SHA256_COMPARE",
      "LOCAL_ASSERTION_RETEST",
    ]);
    expect(PHASE1_ACTION_STATES).toEqual([
      "AWAITING_APPROVAL",
      "APPROVED",
      "EXECUTED",
      "RETESTED",
      "EVIDENCE_RECORDED",
      "REJECTED",
      "FAILED",
    ]);

    for (const runtime of ["staging", "production"]) {
      expect(() =>
        Phase1ActionExecutorFixture.create({
          runtime,
          explicitly_enable_test_fixture: true,
        }),
      ).toThrowError(
        expect.objectContaining({ code: "EXECUTOR_UNAVAILABLE" }),
      );
    }
    expect(() =>
      Phase1ActionExecutorFixture.create({
        runtime: "test",
        explicitly_enable_test_fixture: false,
      }),
    ).toThrowError(expect.objectContaining({ code: "EXECUTOR_UNAVAILABLE" }));
  });

  it("requires an independent approver before deterministic local execution", async () => {
    const executor = fixture();
    const submitted = await executor.dispatch(submitCommand());
    const jobId = submitted.run.job_id;

    expect(submitted).toMatchObject({
      replayed: false,
      run: {
        state: "AWAITING_APPROVAL",
        revision: 0,
        requested_by: "requester_01",
        approved_by: null,
        durable: false,
        external_effects: false,
      },
    });
    await expectCode(
      executor.dispatch(
        jobCommand("EXECUTE", jobId, "executor_01", "EXECUTOR", 1),
      ),
      "APPROVAL_REQUIRED",
    );
    await expectCode(
      executor.dispatch(
        jobCommand("APPROVE", jobId, "requester_01", "APPROVER", 2),
      ),
      "APPROVER_SEPARATION_REQUIRED",
    );

    const approved = await executor.dispatch(
      jobCommand("APPROVE", jobId, "approver_01", "APPROVER", 3),
    );
    expect(approved.run).toMatchObject({
      state: "APPROVED",
      revision: 1,
      approved_by: "approver_01",
    });

    const executed = await executor.dispatch(
      jobCommand("EXECUTE", jobId, "executor_01", "EXECUTOR", 4),
    );
    expect(executed.run).toMatchObject({
      state: "EXECUTED",
      revision: 2,
      execution: {
        action_kind: "LOCAL_ASSERTION_RETEST",
        output: {
          all_passed: false,
          results: [
            { id: "control.present", passed: true },
            { id: "control.version", passed: false },
          ],
        },
        deterministic_local_only: true,
        external_effects: false,
      },
    });

    const retested = await executor.dispatch(
      jobCommand("RETEST", jobId, "retester_01", "RETESTER", 5),
    );
    expect(retested.run).toMatchObject({
      state: "RETESTED",
      revision: 3,
      retest: {
        reproducible: true,
        deterministic_local_only: true,
      },
    });
    expect(retested.run.retest?.output_sha256).toBe(
      retested.run.execution?.output_sha256,
    );

    const recorded = await executor.dispatch(
      jobCommand(
        "RECORD_EVIDENCE",
        jobId,
        "recorder_01",
        "EVIDENCE_RECORDER",
        6,
      ),
    );
    expect(recorded.run).toMatchObject({
      state: "EVIDENCE_RECORDED",
      revision: 4,
      evidence_receipt: {
        reproducible: true,
        requested_by: "requester_01",
        approved_by: "approver_01",
        executed_by: "executor_01",
        retested_by: "retester_01",
        recorded_by: "recorder_01",
        durable: false,
        signed: false,
        anchored: false,
        ots: false,
        compliance_determination: false,
        immutable: true,
      },
    });
    expect(recorded.run.events.map((event) => event.state)).toEqual([
      "AWAITING_APPROVAL",
      "APPROVED",
      "EXECUTED",
      "RETESTED",
      "EVIDENCE_RECORDED",
    ]);
  });

  it("replays exact commands without rerunning and rejects key mutation", async () => {
    const executor = fixture();
    const first = await executor.dispatch(submitCommand());
    const replay = await executor.dispatch(submitCommand());
    expect(replay).toMatchObject({
      replayed: true,
      replay_of_revision: 0,
      run: { job_id: first.run.job_id, revision: 0 },
    });

    await expectCode(
      executor.dispatch({
        ...submitCommand(),
        action_kind: "LOCAL_JSON_CANONICALIZE",
        input: { value: "changed" },
      }),
      "IDEMPOTENCY_CONFLICT",
    );

    const approve = jobCommand(
      "APPROVE",
      first.run.job_id,
      "approver_01",
      "APPROVER",
      1,
    );
    await executor.dispatch(approve);
    await executor.dispatch(
      jobCommand("EXECUTE", first.run.job_id, "executor_01", "EXECUTOR", 2),
    );
    const approvalReplay = await executor.dispatch(approve);
    expect(approvalReplay).toMatchObject({
      replayed: true,
      replay_of_revision: 1,
      run: { state: "APPROVED", revision: 1 },
    });
    expect(executor.get(first.run.job_id)).toMatchObject({
      state: "EXECUTED",
      revision: 2,
    });

    await expectCode(
      executor.dispatch({ ...approve, recorded_at: at(9) }),
      "IDEMPOTENCY_CONFLICT",
    );
  });

  it("produces identical ids and hashes for identical deterministic runs", async () => {
    const first = await fixture().dispatch(submitCommand());
    const second = await fixture().dispatch(submitCommand());
    expect(second.run).toEqual(first.run);
  });

  it.each([
    {
      action_kind: "LOCAL_JSON_CANONICALIZE",
      input: { value: { z: 1, a: true } },
      expected: {
        canonical_json: '{"a":true,"z":1}',
      },
    },
    {
      action_kind: "LOCAL_SHA256_COMPARE",
      input: {
        claimed_sha256: `sha256:${"0".repeat(64)}`,
        value: "payload",
      },
      expected: { matches: false },
    },
  ])("executes $action_kind locally and deterministically", async (example) => {
    const executor = fixture();
    const submitted = await executor.dispatch({
      ...submitCommand(),
      action_kind: example.action_kind,
      input: example.input,
    });
    await executor.dispatch(
      jobCommand(
        "APPROVE",
        submitted.run.job_id,
        "approver_01",
        "APPROVER",
        1,
      ),
    );
    const executed = await executor.dispatch(
      jobCommand(
        "EXECUTE",
        submitted.run.job_id,
        "executor_01",
        "EXECUTOR",
        2,
      ),
    );
    expect(executed.run.execution?.output).toMatchObject(example.expected);
  });

  it("rejects unknown action kinds and invalid action inputs before creating a job", async () => {
    const executor = fixture();
    await expectCode(
      executor.dispatch({ ...submitCommand(), action_kind: "PROVIDER_CALL" }),
      "INVALID_SUBMISSION",
    );
    await expectCode(
      executor.dispatch({
        ...submitCommand(),
        action_kind: "LOCAL_SHA256_COMPARE",
        input: { claimed_sha256: "not-a-digest", value: "payload" },
      }),
      "INVALID_ACTION_INPUT",
    );
  });

  it("supports a terminal independent rejection without executing anything", async () => {
    const executor = fixture();
    const submitted = await executor.dispatch(submitCommand());
    const rejected = await executor.dispatch({
      schema: PHASE1_COMMAND_SCHEMA,
      command: "REJECT",
      actor: actor("approver_01", "APPROVER"),
      recorded_at: at(1),
      idempotency_key: "reject-command-0001",
      job_id: submitted.run.job_id,
      reason: "Evidence scope is incomplete",
    });
    expect(rejected.run).toMatchObject({
      state: "REJECTED",
      execution: null,
      retest: null,
      evidence_receipt: null,
    });
    await expectCode(
      executor.dispatch(
        jobCommand(
          "EXECUTE",
          submitted.run.job_id,
          "executor_01",
          "EXECUTOR",
          2,
        ),
      ),
      "INVALID_STATE_TRANSITION",
    );
  });
});
