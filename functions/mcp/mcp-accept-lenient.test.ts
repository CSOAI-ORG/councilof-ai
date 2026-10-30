import { describe, expect, it } from "vitest";
import { onRequest } from "./[[path]]";

const ORIGIN = "https://councilof.ai";
const INIT = {
  jsonrpc: "2.0", id: 1, method: "initialize",
  params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "accept-test", version: "1" } },
};
const LIST = { jsonrpc: "2.0", id: 2, method: "tools/list" };

function post(body: unknown, accept?: string): Promise<Response> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (accept !== undefined) headers.accept = accept;
  const request = new Request(`${ORIGIN}/mcp`, { method: "POST", headers, body: JSON.stringify(body) });
  return onRequest({ request, env: {}, params: {}, waitUntil: () => {} } as never);
}

describe("/mcp Accept leniency (streamable HTTP)", () => {
  for (const [label, accept] of [["application/json only", "application/json"], ["no Accept header", undefined]] as const) {
    it(`${label}: initialize and tools/list answer 200 JSON, never 406`, async () => {
      const init = await post(INIT, accept);
      expect(init.status).toBe(200);
      expect(init.headers.get("content-type")).toContain("application/json");
      const initBody = (await init.json()) as { result?: { serverInfo?: { name?: string } } };
      expect(initBody.result?.serverInfo?.name).toBeTruthy();
      const list = await post(LIST, accept);
      expect(list.status).toBe(200);
      const listBody = (await list.json()) as { result?: { tools?: unknown[] } };
      expect(Array.isArray(listBody.result?.tools)).toBe(true);
      expect(listBody.result!.tools!.length).toBeGreaterThan(0);
    });
  }
  it("SSE is kept when the client asks for it", async () => {
    const res = await post(LIST, "application/json, text/event-stream");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(await res.text()).toMatch(/^data: /m);
  });
  it("notifications/initialized is accepted without SSE in Accept", async () => {
    const res = await post({ jsonrpc: "2.0", method: "notifications/initialized" }, "application/json");
    expect(res.status).toBe(202);
  });
});
