import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet, onRequestPost } from "../api/action-jobs";
import { onRequest as onMcpRequest } from "./[[path]]";

const ORIGIN = "https://councilof.ai";
const WRITER_SECRET = "test-action-job-writer";

function memoryKv() {
  const store = new Map<string, string>();
  const binding = {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => { store.set(key, value); },
  } as unknown as KVNamespace;
  return binding;
}

async function responseMessage(response: Response) {
  const body = await response.text();
  const event = body.replace(/\r\n/g, "\n").split("\n\n").find((chunk) => chunk.includes("data:"));
  const data = event?.split("\n").find((line) => line.startsWith("data:"))?.slice(5).trim();
  return JSON.parse(data || body);
}

describe("one action job shared by the browser and MCP", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("submits once, then reads the same released job through the human API and MCP", async () => {
    const LEADS = memoryKv();
    const submitBody = {
      schema: "csoai.action-job-submit/0.1",
      action: { id: "csoai.measurement.request", version: "0.1.0" },
      purpose: "Request a reviewed independent measurement",
      idempotency_key: "shared-record-job-0001",
      input_ref: "/public/evidence/example.json",
      input_sha256: `sha256:${"a".repeat(64)}`,
      consent: {
        human_reviewed: true,
        task_use: true,
        audit_retention: true,
        external_egress: false,
        model_training: false,
        public_release: true,
      },
    };
    const submitted = await onRequestPost({
      request: new Request(`${ORIGIN}/api/action-jobs`, {
        method: "POST",
        headers: { origin: ORIGIN, authorization: `Bearer ${WRITER_SECRET}`, "content-type": "application/json" },
        body: JSON.stringify(submitBody),
      }),
      env: { LEADS, ACTION_JOBS_WRITER_SECRET: WRITER_SECRET },
    } as never);
    expect(submitted.status).toBe(202);
    const submittedBody = await submitted.json() as { job: { job_id: string } };
    const jobId = submittedBody.job.job_id;

    const browserRead = await onRequestGet({
      request: new Request(`${ORIGIN}/api/action-jobs?public=1&job_id=${jobId}`),
      env: { LEADS },
    } as never);
    expect(browserRead.status).toBe(200);
    const browserRecord = await browserRead.json() as Record<string, any>;

    vi.stubGlobal("fetch", async (input: string | URL | Request) => {
      const request = input instanceof Request ? input : new Request(String(input));
      const url = new URL(request.url);
      if (url.pathname === "/api/action-jobs")
        return onRequestGet({ request, env: { LEADS } } as never);
      throw new Error(`Unexpected subrequest ${url.pathname}`);
    });
    const mcpResponse = await onMcpRequest({
      request: new Request(`${ORIGIN}/mcp`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          "MCP-Protocol-Version": "2025-03-26",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 42,
          method: "tools/call",
          params: { name: "get_public_action_job", arguments: { job_id: jobId } },
        }),
      }),
      env: {},
      params: {},
    } as never);
    const message = await responseMessage(mcpResponse);
    const mcpRecord = message.result.structuredContent;

    expect(mcpRecord).toMatchObject({
      state: "PUBLIC_RECORD",
      job_id: jobId,
      job: { job_id: jobId },
      head: { job_id: jobId, state: "SUBMITTED", revision: 0 },
      execution_started: false,
      provider_calls: false,
      not_a_certification: true,
    });
    expect(mcpRecord.job).not.toHaveProperty("input_ref");
    expect(mcpRecord.job).not.toHaveProperty("request_origin");
    expect(browserRecord.job.job_id).toBe(mcpRecord.job.job_id);
    expect(browserRecord.head.last_event_id).toBe(mcpRecord.head.last_event_id);
    expect(browserRecord.events[0].event_sha256).toBe(mcpRecord.events[0].event_sha256);
  });
});
