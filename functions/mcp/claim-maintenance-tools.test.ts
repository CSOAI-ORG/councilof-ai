import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";

const ORIGIN = "https://councilof.ai";
const network = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

async function decode(response: Response, id: number) {
  const text = await response.text();
  if (!(response.headers.get("content-type") ?? "").includes("text/event-stream"))
    return JSON.parse(text);
  const frames = text.replace(/\r\n/g, "\n").split(/\n\n/).flatMap((event) => {
    const data = event.split("\n").filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^ /, "")).join("\n");
    return data && data !== "[DONE]" ? [JSON.parse(data)] : [];
  });
  return frames.find((m) => m.id === id) ?? frames.at(-1);
}

async function call(name: string) {
  const id = 7;
  const request = new Request(`${ORIGIN}/mcp/free`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-03-26",
    },
    body: JSON.stringify({
      jsonrpc: "2.0", id, method: "tools/call",
      params: { name, arguments: {} },
    }),
  });
  const response = await onRequest({ request, env: {}, params: {}, waitUntil: () => {} } as never);
  return decode(response, id);
}

beforeEach(() => {
  network.mockReset();
  vi.stubGlobal("fetch", network);
});
afterEach(() => vi.unstubAllGlobals());

describe("Claim Maintenance MCP readers", () => {
  it.each([
    ["claim_maintenance_watch", "/api/claim-maintenance-watch", { schema: "csoai.claim-maintenance.watch-summary/0.1", review_required_claims: ["x"] }],
    ["claim_maintenance_reaction", "/api/claim-maintenance-reaction", { schema: "csoai.claim-maintenance-reaction-index/0.1", category: { full_stack_collision_count: 0 } }],
  ] as const)("%s reads only its canonical API", async (name, path, payload) => {
    network.mockImplementation(async (input) => {
      const url = String(input);
      expect(url).toBe(`${ORIGIN}${path}`);
      return Response.json(payload);
    });
    const message = await call(name);
    expect(message.error).toBeUndefined();
    expect(message.result.isError).toBe(false);
    expect(message.result.structuredContent).toMatchObject({
      ...payload,
      state: "VALID",
      source: `${ORIGIN}${path}`,
      not_a_certification: true,
    });
    expect(network).toHaveBeenCalledTimes(1);
  });

  it("fails closed when the canonical API is unavailable", async () => {
    network.mockResolvedValue(new Response("down", { status: 503 }));
    const message = await call("claim_maintenance_watch");
    expect(message.error).toBeUndefined();
    expect(message.result.structuredContent).toMatchObject({
      state: "UNREACHABLE",
      http_status: 503,
      source: `${ORIGIN}/api/claim-maintenance-watch`,
      not_a_certification: true,
    });
  });
});
