import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";

// MCP 2026-07-28 subscriptions/listen on doors that serve no subscriptions.
// The SDK handler runs with maxSubscriptions 0, so its listen router can only refuse, and it
// refuses with -32603 "Subscription limit reached" under HTTP 200. The Streamable HTTP transport
// says a server that does not implement a method MUST answer 404 with -32601, and `ping` is
// already answered that way here. The door turns that one refusal into the same answer. The SDK's
// header and envelope checks still run first, and what they answer passes through unchanged.
const ORIGIN = "https://councilof.ai";
const CURRENT = "2026-07-28";
const META = {
  "io.modelcontextprotocol/protocolVersion": CURRENT,
  "io.modelcontextprotocol/clientCapabilities": {},
};
const DOORS = ["/mcp", "/mcp/free"] as const;
const EVERY_FILTER = { toolsListChanged: true, promptsListChanged: true, resourcesListChanged: true };

type Body = { jsonrpc?: string; id?: unknown; result?: Record<string, unknown>; error?: { code: number; message: string } };

async function post(
  door: string,
  body: Record<string, unknown>,
  mcpMethod: string,
): Promise<{ status: number; contentType: string; body: Body }> {
  const headers = new Headers({
    "content-type": "application/json",
    // What a 2026-07-28 client sends; the door answers JSON when the reply is a single message.
    accept: "application/json, text/event-stream",
    "MCP-Protocol-Version": CURRENT,
    "Mcp-Method": mcpMethod,
  });
  const request = new Request(`${ORIGIN}${door}`, { method: "POST", headers, body: JSON.stringify(body) });
  const response = await onRequest({ request, env: {}, params: {}, waitUntil: () => {} } as never);
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  const json = contentType.includes("text/event-stream")
    ? text
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .filter((data) => data.startsWith("{"))
        .at(-1) ?? "{}"
    : text;
  return { status: response.status, contentType, body: JSON.parse(json) as Body };
}

const network = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
beforeEach(() => {
  network.mockReset();
  network.mockImplementation(async () => {
    throw new Error("Network is mocked: unexpected subrequest");
  });
  vi.stubGlobal("fetch", network);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("subscriptions/listen is answered as an unimplemented method", () => {
  it.each(DOORS)("%s: listen answers 404 with -32601, exactly as ping does", async (door) => {
    const listened = await post(
      door,
      { jsonrpc: "2.0", id: "listen-1", method: "subscriptions/listen", params: { _meta: META, notifications: EVERY_FILTER } },
      "subscriptions/listen",
    );
    expect(listened.status).toBe(404);
    expect(listened.contentType).toContain("application/json");
    expect(listened.body.id).toBe("listen-1");
    expect(listened.body.result).toBeUndefined();
    expect(listened.body.error?.code).toBe(-32601);
    expect(listened.body.error?.message).not.toMatch(/limit/i);

    const pinged = await post(door, { jsonrpc: "2.0", id: "ping-1", method: "ping", params: { _meta: META } }, "ping");
    expect(pinged.status).toBe(404);
    expect(pinged.body.error?.code).toBe(-32601);
    expect(network).not.toHaveBeenCalled();
  });

  it.each(DOORS)("%s: an integer id and a request with no filter get the same answer", async (door) => {
    const listened = await post(
      door,
      { jsonrpc: "2.0", id: 7, method: "subscriptions/listen", params: { _meta: META } },
      "subscriptions/listen",
    );
    expect(listened.status).toBe(404);
    expect(listened.body.id).toBe(7);
    expect(listened.body.error?.code).toBe(-32601);
  });

  it.each(DOORS)("%s: the SDK's header and envelope checks still answer first", async (door) => {
    const mismatched = await post(
      door,
      { jsonrpc: "2.0", id: "listen-2", method: "subscriptions/listen", params: { _meta: META, notifications: EVERY_FILTER } },
      "tools/list",
    );
    expect(mismatched.status).toBe(400);
    expect(mismatched.body.error?.code).toBe(-32020);

    const noEnvelope = await post(
      door,
      { jsonrpc: "2.0", id: "listen-3", method: "subscriptions/listen", params: { notifications: EVERY_FILTER } },
      "subscriptions/listen",
    );
    expect(noEnvelope.status).toBe(400);
    expect(noEnvelope.body.error?.code).toBe(-32602);
    expect(network).not.toHaveBeenCalled();
  });

  it.each(DOORS)("%s: other methods are untouched", async (door) => {
    const listed = await post(door, { jsonrpc: "2.0", id: "tools-1", method: "tools/list", params: { _meta: META } }, "tools/list");
    expect(listed.status).toBe(200);
    expect(Array.isArray(listed.body.result?.tools)).toBe(true);
    expect((listed.body.result?.tools as unknown[]).length).toBeGreaterThan(0);
  });
});
