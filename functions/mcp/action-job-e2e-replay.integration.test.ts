import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "../api/action-jobs";
import { onRequest as onMcpRequest } from "./[[path]]";

/**
 * End-to-end replay integration tests (2026-10-01).
 *
 * These tests go through the FULL MCP dispatch ([[path]].ts → sharedToolResult →
 * routeTool / getPublicActionJob) — not direct handler calls. They prove:
 *
 * 1. Route tool via MCP tools/call generates an action_job_id and stores records
 *    in BOTH formats (action-jobs API format + public projection).
 * 2. The same job_id is replayable through get_public_action_job (MCP tools/call).
 * 3. The same job_id is replayable through /api/action-jobs?public=1 (human API).
 * 4. Both read paths return the same route evidence record.
 * 5. The action-jobs API's loadLedger can read the route handler's records
 *    (format boundary reconciled).
 */

const ORIGIN = "https://councilof.ai";

function memoryKv() {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => { store.set(key, value); },
    store,
  } as unknown as KVNamespace & { store: Map<string, string> };
}

async function responseMessage(response: Response) {
  const body = await response.text();
  const event = body.replace(/\r\n/g, "\n").split("\n\n").find((chunk) => chunk.includes("data:"));
  const data = event?.split("\n").find((line) => line.startsWith("data:"))?.slice(5).trim();
  return JSON.parse(data || body);
}

async function mcpCall(name: string, args: Record<string, unknown>, env: Record<string, unknown>) {
  const request = new Request(`${ORIGIN}/mcp`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-03-26",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
  });
  const response = await onMcpRequest({ request, env } as never);
  return responseMessage(response);
}

describe("end-to-end action-job replay integration", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("route via MCP generates action_job_id stored in both formats", async () => {
    const LEADS = memoryKv();
    const result = await mcpCall("route", {
      task: "e2e: route decision for replay",
      policy: { presets: ["read-only"] },
    }, { LEADS });

    const sc = result.result?.structuredContent;
    expect(sc).toBeTruthy();
    expect(sc.state).toBe("ROUTED");
    expect(sc.action_job_wiring).toBe("WIRED");
    expect(sc.action_job_id).toMatch(/^job_[0-9a-f]{40}$/);

    const jobId = sc.action_job_id as string;
    // Action-jobs API format records (readable by loadLedger).
    expect(LEADS.store.get(`action-jobs:0.1:job:${jobId}:submission`)).toBeTruthy();
    expect(LEADS.store.get(`action-jobs:0.1:job:${jobId}:head`)).toBeTruthy();
    expect(LEADS.store.get(`action-jobs:0.1:job:${jobId}:event:0000`)).toBeTruthy();
    expect(LEADS.store.get(`action-jobs:0.1:job:${jobId}:receipt:0000`)).toBeTruthy();
    // Public projection (readable by getPublicActionJob).
    expect(LEADS.store.get(`action-job:${jobId}:public`)).toBeTruthy();
  });

  it("route via MCP is replayable through get_public_action_job via MCP", async () => {
    const LEADS = memoryKv();
    const routeResult = await mcpCall("route", {
      task: "e2e: MCP replay",
      policy: { presets: ["read-only"] },
    }, { LEADS });
    const jobId = routeResult.result?.structuredContent?.action_job_id;
    expect(jobId).toBeTruthy();

    const replayResult = await mcpCall("get_public_action_job", { job_id: jobId }, { LEADS });
    const replay = replayResult.result?.structuredContent;
    expect(replay).toBeTruthy();
    expect(replay.state).toBe("PUBLIC_RECORD");
    expect(replay.job_id).toBe(jobId);
    expect(replay.job).toBeTruthy();
    expect(replay.head).toBeTruthy();
  });

  it("route via MCP is replayable through the human /api/action-jobs endpoint", async () => {
    const LEADS = memoryKv();
    const routeResult = await mcpCall("route", {
      task: "e2e: API replay",
      policy: { presets: ["read-only"] },
    }, { LEADS });
    const jobId = routeResult.result?.structuredContent?.action_job_id;
    expect(jobId).toBeTruthy();

    const apiResponse = await onRequestGet({
      request: new Request(`${ORIGIN}/api/action-jobs?public=1&job_id=${jobId}`, {
        headers: { accept: "application/json" },
      }),
      env: { LEADS },
    } as never);
    expect(apiResponse.status).toBe(200);
    const apiRecord = await apiResponse.json() as Record<string, any>;
    expect(apiRecord.schema).toBe("csoai.action-job-public/0.1");
    expect(apiRecord.job).toBeTruthy();
    expect(apiRecord.head).toBeTruthy();
    expect(apiRecord.events).toBeTruthy();
    expect(apiRecord.events.length).toBeGreaterThan(0);
  });

  it("both read paths return the same route evidence record", async () => {
    const LEADS = memoryKv();
    const routeResult = await mcpCall("route", {
      task: "e2e: dual read path consistency",
      policy: { presets: ["read-only"] },
    }, { LEADS });
    const jobId = routeResult.result?.structuredContent?.action_job_id;
    expect(jobId).toBeTruthy();

    // Read via MCP get_public_action_job.
    const mcpReplay = await mcpCall("get_public_action_job", { job_id: jobId }, { LEADS });
    const mcpRecord = mcpReplay.result?.structuredContent;
    expect(mcpRecord.state).toBe("PUBLIC_RECORD");

    // Read via human API.
    const apiResponse = await onRequestGet({
      request: new Request(`${ORIGIN}/api/action-jobs?public=1&job_id=${jobId}`, {
        headers: { accept: "application/json" },
      }),
      env: { LEADS },
    } as never);
    const apiRecord = await apiResponse.json() as Record<string, any>;

    // Both must reference the same job_id.
    expect(mcpRecord.job_id).toBe(jobId);
    expect(apiRecord.job.job_id).toBe(jobId);

    // Both must have the same head state.
    expect(mcpRecord.head.state).toBe(apiRecord.head.state);
    expect(mcpRecord.head.revision).toBe(apiRecord.head.revision);
  });

  it("action-jobs API loadLedger can read route handler records (format reconciled)", async () => {
    const LEADS = memoryKv();
    const routeResult = await mcpCall("route", {
      task: "e2e: loadLedger format check",
      policy: { presets: ["read-only"] },
    }, { LEADS });
    const jobId = routeResult.result?.structuredContent?.action_job_id;
    expect(jobId).toBeTruthy();

    // The API's loadLedger reads from action-jobs:0.1:job:<id>:submission + :head
    // and verifies hashes. The route handler now writes in this format.
    const apiResponse = await onRequestGet({
      request: new Request(`${ORIGIN}/api/action-jobs?public=1&job_id=${jobId}`, {
        headers: { accept: "application/json" },
      }),
      env: { LEADS },
    } as never);
    // 200 means loadLedger successfully read and verified the route handler's records.
    expect(apiResponse.status).toBe(200);
  });

  it("route evidence record is embedded in the public projection", async () => {
    const LEADS = memoryKv();
    const routeResult = await mcpCall("route", {
      task: "e2e: evidence in projection",
      policy: { presets: ["read-only"] },
    }, { LEADS });
    const jobId = routeResult.result?.structuredContent?.action_job_id;

    const publicRaw = LEADS.store.get(`action-job:${jobId}:public`);
    expect(publicRaw).toBeTruthy();
    const publicRecord = JSON.parse(publicRaw!);
    expect(publicRecord.route_record).toBeTruthy();
    expect(publicRecord.route_record.schema).toBe("csoai.evidence-event/0.1");
    expect(publicRecord.route_record.profile).toBe("csoai.route-evidence/0.1");
  });

  it("multiple route calls generate distinct action-job IDs", async () => {
    const LEADS = memoryKv();
    const result1 = await mcpCall("route", {
      task: "e2e: first call",
      policy: { presets: ["read-only"] },
    }, { LEADS });
    const result2 = await mcpCall("route", {
      task: "e2e: second call",
      policy: { presets: ["read-only"] },
    }, { LEADS });

    const id1 = result1.result?.structuredContent?.action_job_id;
    const id2 = result2.result?.structuredContent?.action_job_id;
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it("route with custom candidates generates action-job with forbidden list", async () => {
    const LEADS = memoryKv();
    const result = await mcpCall("route", {
      task: "e2e: policy gate with custom candidates",
      candidates: [
        { id: "paid:tool", kind: "mcp_tool", paid: true },
        { id: "free:tool", kind: "mcp_tool", read_only: true },
      ],
      policy: { presets: ["read-only"] },
    }, { LEADS });

    const sc = result.result?.structuredContent;
    expect(sc.state).toBe("ROUTED");
    expect(sc.chosen.id).toBe("free:tool");
    expect(sc.action_job_id).toBeTruthy();
    expect(sc.forbidden).toBeTruthy();
    expect(sc.forbidden.length).toBeGreaterThan(0);
  });

  it("route response includes durability receipt with readback and ledger verification", async () => {
    const LEADS = memoryKv();
    const result = await mcpCall("route", {
      task: "e2e: durability receipt verification",
      policy: { presets: ["read-only"] },
    }, { LEADS });

    const sc = result.result?.structuredContent;
    expect(sc.durability).toBeTruthy();
    const durability = sc.durability as Record<string, any>;
    expect(durability.schema).toBe("csoai.durability-receipt/0.1");
    expect(durability.readback_confirmed).toBe(true);
    expect(durability.ledger_verified).toBe(true);
    expect(durability.keys_written.length).toBeGreaterThanOrEqual(5);
    expect(durability.note).toContain("Not global durability or exactly-once");
  });

  it("loadLedger verification passes for route handler records (hash chain intact)", async () => {
    const LEADS = memoryKv();
    const result = await mcpCall("route", {
      task: "e2e: loadLedger hash chain verification",
      policy: { presets: ["read-only"] },
    }, { LEADS });
    const jobId = result.result?.structuredContent?.action_job_id;
    expect(jobId).toBeTruthy();

    // The durability receipt already verified the hash chain.
    const durability = result.result?.structuredContent?.durability;
    expect(durability.ledger_verified).toBe(true);

    // Cross-check: the API endpoint also returns 200 (loadLedger passed).
    const apiResponse = await onRequestGet({
      request: new Request(`https://councilof.ai/api/action-jobs?public=1&job_id=${jobId}`, {
        headers: { accept: "application/json" },
      }),
      env: { LEADS },
    } as never);
    expect(apiResponse.status).toBe(200);
  });
});
