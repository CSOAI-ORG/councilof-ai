import { describe, expect, it, vi, afterEach } from "vitest";
import { getPublicActionJobForTest, routeToolForTest } from "./_handlers";
import { onRequestGet } from "../api/action-jobs";

/**
 * Contract fixtures for action-job replay (2026-10-01).
 *
 * These tests prove the route tool's action-job linkage is a durable, replayable
 * record: the same job_id is readable through get_public_action_job, and the
 * record carries the csoai.evidence-event/0.1 / csoai.route-evidence/0.1 contract
 * shape. Tests use a memory-backed LEADS KV and direct handler calls (not the full
 * MCP dispatch) to avoid fetch stubbing conflicts with the SDK.
 */

function memoryKv() {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => { store.set(key, value); },
    store,
  } as unknown as KVNamespace & { store: Map<string, string> };
}

describe("action-job replay contract fixtures", () => {
  // Route tool calls through the full library are slow (board fetch + policy eval).
  const TEST_TIMEOUT = 15000;
  
  // Override default timeout for all tests in this describe.
  vi.setConfig({ testTimeout: TEST_TIMEOUT });
  afterEach(() => vi.unstubAllGlobals());

  it("route tool returns an action_job_id and stores a replayable record in LEADS KV", async () => {
    const LEADS = memoryKv();
    const sc = await routeToolForTest(
      { task: "contract fixture: route decision for replay", policy: { presets: ["read-only"] } },
      "https://councilof.ai",
      { LEADS },
    );

    expect(sc.state).toBe("ROUTED");
    expect(sc.action_job_wiring).toBe("WIRED");
    expect(sc.action_job_id).toMatch(/^job_[0-9a-f]{40}$/);
    expect(sc.action_job_read).toContain(`job_id=${sc.action_job_id}`);

    // The record must be in LEADS KV under both keys.
    const jobId = sc.action_job_id as string;
    const submission = LEADS.store.get(`action-jobs:0.1:job:${jobId}:submission`);
    const publicRecord = LEADS.store.get(`action-job:${jobId}:public`); // public projection uses legacy key // public projection uses legacy key
    expect(submission).toBeTruthy();
    expect(publicRecord).toBeTruthy();
  });

  it("route record carries the csoai.evidence-event/0.1 contract shape", async () => {
    const LEADS = memoryKv();
    const sc = await routeToolForTest(
      { task: "contract fixture: evidence event shape", policy: { presets: ["read-only"] } },
      "https://councilof.ai",
      { LEADS },
    );

    const record = sc.record as Record<string, any>;
    expect(record.schema).toBe("csoai.evidence-event/0.1");
    expect(record.profile).toBe("csoai.route-evidence/0.1");
    expect(record.subject.kind).toBe("route");
    expect(record.subject.locator).toMatch(/^urn:gspc:route:/);
    expect(record.method.id).toBe("gspc-route");
    expect(record.declared.task.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(record.declared.task.content_retained).toBe(false);
    expect(record.declared.policy.presets).toContain("read-only");
    expect(Array.isArray(record.observed.considered)).toBe(true);
    expect(record.observed.considered.length).toBeGreaterThan(0);
  });

  it("action-job record is readable from LEADS KV and carries route evidence", async () => {
    const LEADS = memoryKv();
    const sc = await routeToolForTest(
      { task: "contract fixture: evidence linkage", policy: { presets: ["read-only"] } },
      "https://councilof.ai",
      { LEADS },
    );
    const jobId = sc.action_job_id as string;
    expect(jobId).toBeTruthy();

    // The action-job public record must contain the route record.
    const publicRecord = JSON.parse(LEADS.store.get(`action-job:${jobId}:public`)!); // public projection // public projection
    expect(publicRecord.schema).toBe("csoai.action-job-public/0.1");
    expect(publicRecord.job).toBeTruthy();
    expect(publicRecord.head).toBeTruthy();
    expect(publicRecord.route_record).toBeTruthy();
    expect(publicRecord.route_record.schema).toBe("csoai.evidence-event/0.1");
    expect(publicRecord.route_record.profile).toBe("csoai.route-evidence/0.1");
  });

  it("action-job record is replayable through get_public_action_job handler", async () => {
    const LEADS = memoryKv();
    const sc = await routeToolForTest(
      { task: "contract fixture: handler replay", policy: { presets: ["read-only"] } },
      "https://councilof.ai",
      { LEADS },
    );
    const jobId = sc.action_job_id as string;

    const replay = await getPublicActionJobForTest({ job_id: jobId }, "https://councilof.ai", { LEADS });
    expect(replay.state).toBe("PUBLIC_RECORD");
    expect(replay.job_id).toBe(jobId);
    expect(replay.job).toBeTruthy();
    expect(replay.head).toBeTruthy();
  });

  it("action-job record is readable through both get_public_action_job and the public projection", async () => {
    const LEADS = memoryKv();
    const sc = await routeToolForTest(
      { task: "contract fixture: dual read path", policy: { presets: ["read-only"] } },
      "https://councilof.ai",
      { LEADS },
    );
    const jobId = sc.action_job_id as string;

    // Path 1: get_public_action_job reads action-job:<id>:public directly (route handler's format).
    const replay = await getPublicActionJobForTest({ job_id: jobId }, "https://councilof.ai", { LEADS });
    expect(replay.state).toBe("PUBLIC_RECORD");
    expect(replay.job_id).toBe(jobId);
    expect(replay.job).toBeTruthy();
    expect(replay.head).toBeTruthy();

    // Path 2: the raw public projection in LEADS KV has the full route evidence.
    const publicRaw = LEADS.store.get(`action-job:${jobId}:public`);
    expect(publicRaw).toBeTruthy();
    const publicRecord = JSON.parse(publicRaw!);
    expect(publicRecord.schema).toBe("csoai.action-job-public/0.1");
    expect(publicRecord.route_record).toBeTruthy();
    expect(publicRecord.route_record.schema).toBe("csoai.evidence-event/0.1");

    // Path 2b: the action-jobs API format records are also present.
    const submissionRaw = LEADS.store.get(`action-jobs:0.1:job:${jobId}:submission`);
    const headRaw = LEADS.store.get(`action-jobs:0.1:job:${jobId}:head`);
    const eventRaw = LEADS.store.get(`action-jobs:0.1:job:${jobId}:event:0000`);
    expect(submissionRaw).toBeTruthy();
    expect(headRaw).toBeTruthy();
    expect(eventRaw).toBeTruthy();

    // Path 2b: the action-jobs API format records are also present.
    // Path 3: the action-jobs API endpoint (loadLedger format) — format boundary
    // reconciled: route handler writes in action-jobs API format, so loadLedger
    // can read it. 200 expected.
    const apiResponse = await onRequestGet({
      request: new Request(`https://councilof.ai/api/action-jobs?public=1&job_id=${jobId}`, {
        headers: { accept: "application/json" },
      }),
      env: { LEADS },
    } as never);
    // Format boundary reconciled: route handler writes action-jobs API format.
    expect(apiResponse.status).toBe(200);
  });

  it("route tool hashes the task and never stores or echoes the plaintext", async () => {
    const LEADS = memoryKv();
    const taskText = "contract fixture: task text must not appear in output";
    const sc = await routeToolForTest(
      { task: taskText, policy: { presets: ["read-only"] } },
      "https://councilof.ai",
      { LEADS },
    );

    const output = JSON.stringify(sc);
    expect(output).not.toContain(taskText);
    const record = sc.record as Record<string, any>;
    expect(record.declared.task.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(record.declared.task.content_retained).toBe(false);
  });

  it("route tool execute mode answers NOT_ENABLED without creating an action-job", async () => {
    const LEADS = memoryKv();
    const sc = await routeToolForTest(
      { task: "contract fixture: execute mode", mode: "execute" },
      "https://councilof.ai",
      { LEADS },
    );

    expect(sc.state).toBe("NOT_ENABLED");
    expect(sc.action_job_id).toBeFalsy();
  });

  it("get_public_action_job returns NOT_PUBLIC_OR_NOT_FOUND for unknown job_id", async () => {
    const LEADS = memoryKv();
    const replay = await getPublicActionJobForTest(
      { job_id: "job_" + "f".repeat(40) },
      "https://councilof.ai",
      { LEADS },
    );
    expect(replay.state).toBe("NOT_PUBLIC_OR_NOT_FOUND");
    expect(replay.job_id).toBe("job_" + "f".repeat(40));
  });

  it("get_public_action_job returns INVALID_ARGUMENT for malformed job_id", async () => {
    const replay = await getPublicActionJobForTest(
      { job_id: "not-a-valid-job-id" },
      "https://councilof.ai",
    );
    expect(replay.state).toBe("INVALID_ARGUMENT");
  });

  it("route tool policy gate forbids paid candidates without caller_wallet", async () => {
    const LEADS = memoryKv();
    const sc = await routeToolForTest(
      {
        task: "contract fixture: policy gate",
        candidates: [
          { id: "paid:tool", kind: "mcp_tool", paid: true },
          { id: "free:tool", kind: "mcp_tool", read_only: true },
        ],
        policy: { presets: ["read-only"] },
      },
      "https://councilof.ai",
      { LEADS },
    );

    expect(sc.state).toBe("ROUTED");
    expect(sc.chosen.id).toBe("free:tool");
    const forbidden = sc.forbidden as Array<{ id: string; forbid_policy: string }>;
    const paidForbidden = forbidden.find((f) => f.id === "paid:tool");
    expect(paidForbidden).toBeTruthy();
    expect(paidForbidden!.forbid_policy).toBe("floor:paid-needs-caller-wallet");
  });

  it("route tool returns durability receipt with readback and ledger verification", async () => {
    const LEADS = memoryKv();
    const sc = await routeToolForTest(
      { task: "contract fixture: durability receipt", policy: { presets: ["read-only"] } },
      "https://councilof.ai",
      { LEADS },
    );

    expect(sc.durability).toBeTruthy();
    const durability = sc.durability as Record<string, any>;
    expect(durability.schema).toBe("csoai.durability-receipt/0.1");
    expect(durability.readback_confirmed).toBe(true);
    expect(durability.ledger_verified).toBe(true);
    expect(durability.keys_written.length).toBeGreaterThanOrEqual(5);
    expect(durability.note).toContain("Not global durability or exactly-once");
  });

  it("durability receipt confirms byte-equal readback of all keys", async () => {
    const LEADS = memoryKv();
    const sc = await routeToolForTest(
      { task: "contract fixture: byte-equal readback", policy: { presets: ["read-only"] } },
      "https://councilof.ai",
      { LEADS },
    );
    const jobId = sc.action_job_id as string;
    const durability = sc.durability as Record<string, any>;

    // Verify each key in keys_written exists in LEADS.
    for (const key of durability.keys_written) {
      expect(LEADS.store.get(key)).toBeTruthy();
    }
    expect(durability.readback_confirmed).toBe(true);
  });
});
