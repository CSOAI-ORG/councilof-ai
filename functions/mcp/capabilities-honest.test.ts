import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";

// These doors serve no subscriptions: createMcpHandler is configured with
// maxSubscriptions: 0, so a 2026-07-28 subscriptions/listen is refused and no
// list_changed notification is ever sent. The advertised capabilities must say
// so: no listChanged or subscribe bit on either door, in either protocol era.
const ORIGIN = "https://councilof.ai";
const CURRENT = "2026-07-28";
const LEGACY = "2025-03-26";
const VERSION = "io.modelcontextprotocol/protocolVersion";
const CAPABILITIES = "io.modelcontextprotocol/clientCapabilities";
const DOORS = ["/mcp", "/mcp/free"] as const;

type Fields = Record<string, unknown>;
type Envelope = {
  jsonrpc: string;
  id?: unknown;
  result?: Fields;
  error?: { code: number; message: string };
};

async function decode(response: Response, id: unknown): Promise<Envelope> {
  const text = await response.text();
  if (!(response.headers.get("content-type") ?? "").includes("text/event-stream")) {
    return JSON.parse(text) as Envelope;
  }
  const messages = text
    .replace(/\r\n/g, "\n")
    .split(/\n\n/)
    .flatMap((event) => {
      const data = event
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).replace(/^ /, ""))
        .join("\n");
      return data && data !== "[DONE]" ? [JSON.parse(data) as Envelope] : [];
    });
  const message = messages.find((candidate) => candidate.id === id) ?? messages.at(-1);
  if (!message) throw new Error("SSE stream carried no JSON-RPC message");
  return message;
}

async function call(door: string, method: string, params: Fields, era: "modern" | "legacy"): Promise<Envelope> {
  const headers = new Headers({
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "MCP-Protocol-Version": era === "modern" ? CURRENT : LEGACY,
  });
  if (era === "modern") headers.set("Mcp-Method", method);
  const body = {
    jsonrpc: "2.0",
    id: method,
    method,
    params: era === "modern" ? { ...params, _meta: { [VERSION]: CURRENT, [CAPABILITIES]: {} } } : params,
  };
  const request = new Request(`${ORIGIN}${door}`, { method: "POST", headers, body: JSON.stringify(body) });
  const response = await onRequest({ request, env: {}, params: {}, waitUntil: () => {} } as never);
  return decode(response, method);
}

// Every capability bit that promises a notification: listChanged and subscribe.
function notificationPromises(capabilities: Fields): string[] {
  return Object.entries(capabilities).flatMap(([name, value]) =>
    value !== null && typeof value === "object"
      ? Object.entries(value as Fields)
          .filter(([bit, on]) => (bit === "listChanged" || bit === "subscribe") && on === true)
          .map(([bit]) => `${name}.${bit}`)
      : [],
  );
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

describe("capabilities match doors that serve no subscriptions", () => {
  it.each(DOORS)("%s: server/discover promises no list-change or subscribe notification", async (door) => {
    const capabilities = (await call(door, "server/discover", {}, "modern")).result?.capabilities as Fields;
    expect(capabilities).toMatchObject({ tools: {}, resources: {}, prompts: {} });
    expect(notificationPromises(capabilities)).toEqual([]);
    expect(network).not.toHaveBeenCalled();
  });

  it.each(DOORS)("%s: initialize promises no list-change or subscribe notification", async (door) => {
    const initialized = await call(door, "initialize", {
      protocolVersion: LEGACY,
      capabilities: {},
      clientInfo: { name: "capabilities-test", version: "1" },
    }, "legacy");
    const capabilities = initialized.result?.capabilities as Fields;
    expect(capabilities).toMatchObject({ tools: {}, resources: {}, prompts: {} });
    expect(notificationPromises(capabilities)).toEqual([]);
    expect(network).not.toHaveBeenCalled();
  });

  // The reason no bit may be advertised. If the subscription limit is ever raised,
  // this test and the capability bits must change together.
  it.each(DOORS)("%s: subscriptions/listen is refused", async (door) => {
    const listened = await call(door, "subscriptions/listen", {
      notifications: { toolsListChanged: true, promptsListChanged: true, resourcesListChanged: true },
    }, "modern");
    expect(listened.result).toBeUndefined();
    expect(listened.error).toBeDefined();
    expect(network).not.toHaveBeenCalled();
  });
});
