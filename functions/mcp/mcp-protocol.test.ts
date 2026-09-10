import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { MCP_MAX_REQUEST_BYTES, onRequest } from "./[[path]]";

// Normative contract, not snapshots of the old module-global wire version:
// https://modelcontextprotocol.io/specification/2026-07-28/basic/index
// https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http
// https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching
const ORIGIN = "https://councilof.ai";
const CURRENT = "2026-07-28";
const LEGACY = "2025-03-26";
const VERSION = "io.modelcontextprotocol/protocolVersion";
const CAPABILITIES = "io.modelcontextprotocol/clientCapabilities";

type Fields = Record<string, unknown>;
type Envelope = {
  jsonrpc: string;
  id?: unknown;
  result?: Fields;
  error?: { code: number; message: string; data?: Fields };
};
type Input = { body: Fields; headers: Headers };
type Reply = { response: Response; message: Envelope | null };

function modern(method: string, params: Fields = {}, options: {
  id?: string | number;
  version?: string;
  meta?: Fields;
} = {}): Input {
  const version = options.version ?? CURRENT;
  const headers = new Headers({
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "MCP-Protocol-Version": version,
    "Mcp-Method": method,
  });
  if (method === "tools/call" && typeof params.name === "string") headers.set("Mcp-Name", params.name);
  return {
    headers,
    body: {
      jsonrpc: "2.0", id: options.id ?? "modern", method,
      params: { ...params, _meta: options.meta ?? { [VERSION]: version, [CAPABILITIES]: {} } },
    },
  };
}

function legacy(method: string, params: Fields = {}, id: string | number = "legacy", withVersion = true): Input {
  const headers = new Headers({ "content-type": "application/json", accept: "application/json, text/event-stream" });
  if (withVersion) headers.set("MCP-Protocol-Version", LEGACY);
  return { headers, body: { jsonrpc: "2.0", id, method, params } };
}

// The official stateless legacy adapter may use a request-scoped SSE stream.
// Parse its final JSON-RPC message, never confuse progress events with a result.
async function decode(response: Response, id: unknown): Promise<Envelope | null> {
  const text = await response.text();
  if (!text.trim()) return null;
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("text/event-stream")) {
    const messages: Envelope[] = [];
    for (const event of text.replace(/\r\n/g, "\n").split(/\n\n/)) {
      const data = event.split("\n").filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).replace(/^ /, "")).join("\n");
      if (!data || data === "[DONE]") continue;
      const parsed = JSON.parse(data) as Envelope;
      if (parsed.jsonrpc === "2.0" && (parsed.result || parsed.error)) messages.push(parsed);
    }
    const final = messages.find((message) => message.id === id) ?? messages.at(-1);
    expect(final, "SSE must contain a final JSON-RPC result/error").toBeDefined();
    return final ?? null;
  }
  expect(type).toContain("application/json");
  return JSON.parse(text) as Envelope;
}

async function send(input: Input): Promise<Reply> {
  const response = await dispatch(new Request(`${ORIGIN}/mcp`, {
    method: "POST", headers: input.headers, body: JSON.stringify(input.body),
  }));
  return { response, message: await decode(response, input.body.id) };
}

async function dispatch(request: Request, env: Fields = {}): Promise<Response> {
  return onRequest({ request, env, params: {}, waitUntil: () => {} } as never);
}

function completed(reply: Reply, id: string | number): Fields {
  expect(reply.response.status).toBe(200);
  expect(reply.message).toMatchObject({ jsonrpc: "2.0", id, result: { resultType: "complete" } });
  expect(reply.message?.error).toBeUndefined();
  return reply.message!.result!;
}

const network = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
beforeEach(() => {
  network.mockReset();
  network.mockImplementation(async () => { throw new Error("Network is mocked: unexpected subrequest"); });
  vi.stubGlobal("fetch", network);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function mockRoot() {
  network.mockImplementation(async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    expect(request.url).toBe(`${ORIGIN}/root.json`);
    return Response.json({ kind: "test-root", card_count: 2, merkle_root: "a".repeat(64) });
  });
}

describe("MCP per-request protocol contract", () => {
  it("discovers without initialize and supplies the modern discovery/cache contract", async () => {
    const result = completed(await send(modern("server/discover")), "modern");
    expect(result.supportedVersions).toContain(CURRENT);
    // SDK 2 separates eras: discover advertises modern revisions; legacy
    // support is proven below through initialize and real client round trips.
    expect(result.capabilities).toMatchObject({ tools: {} });
    expect(Number.isInteger(result.ttlMs)).toBe(true);
    expect(result.ttlMs as number).toBeGreaterThanOrEqual(0);
    expect(result.cacheScope).toBe("public");
    expect(network).not.toHaveBeenCalled();
  });

  it("lists deterministically with complete/public cache metadata, without clientInfo or initialize", async () => {
    const first = completed(await send(modern("tools/list", {}, { id: 0 })), 0);
    const second = completed(await send(modern("tools/list", {}, { id: "other" })), "other");
    expect(first.tools).toEqual(second.tools);
    expect(first.tools).toHaveLength(12);
    expect(Number.isInteger(first.ttlMs)).toBe(true);
    expect(first.ttlMs as number).toBeGreaterThanOrEqual(0);
    expect(first.cacheScope).toBe("public");
    expect(network).not.toHaveBeenCalled();
  });

  it("completes a direct modern tool call without invented tool-call caching hints", async () => {
    mockRoot();
    const result = completed(await send(modern("tools/call", { name: "get_root", arguments: {} })), "modern");
    expect(result.structuredContent).toMatchObject({ state: "VALID", card_count: 2 });
    expect(result.ttlMs).toBeUndefined();
    expect(result.cacheScope).toBeUndefined();
    expect(network).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["clientCapabilities", { [VERSION]: CURRENT }],
    ["protocolVersion", { [CAPABILITIES]: {} }],
  ] as const)("rejects missing required _meta %s before paid dispatch", async (_name, meta) => {
    const reply = await send(modern("tools/call", { name: "commission_card", arguments: { subject: "test", x_payment: "test-only-token" } }, { meta }));
    expect(reply.response.status).toBe(400);
    expect(reply.message?.error?.code).toBe(-32602);
    expect(network).not.toHaveBeenCalled();
  });

  it.each(["MCP-Protocol-Version", "Mcp-Method", "Mcp-Name"])("rejects mismatched %s before paid dispatch", async (header) => {
    const input = modern("tools/call", { name: "commission_card", arguments: { subject: "test", x_payment: "test-only-token" } });
    input.headers.set(header, header === "MCP-Protocol-Version" ? LEGACY : "wrong");
    const reply = await send(input);
    expect(reply.response.status).toBe(400);
    expect(reply.message).toMatchObject({ id: "modern", error: { code: -32020 } });
    expect(network).not.toHaveBeenCalled();
  });

  it.each(["MCP-Protocol-Version", "Mcp-Method", "Mcp-Name"])("rejects missing required header %s before paid dispatch", async (header) => {
    const input = modern("tools/call", { name: "commission_card", arguments: { subject: "test" } });
    input.headers.delete(header);
    const reply = await send(input);
    expect(reply.response.status).toBe(400);
    expect(reply.message?.error?.code).toBe(-32020);
    expect(network).not.toHaveBeenCalled();
  });

  it("rejects an unsupported modern version with truthful retry information", async () => {
    const reply = await send(modern("tools/list", {}, { version: "1900-01-01" }));
    expect(reply.response.status).toBe(400);
    expect(reply.message?.error).toMatchObject({ code: -32022, data: { requested: "1900-01-01" } });
    expect(reply.message?.error?.data?.supported).toContain(CURRENT);
    expect(reply.message?.error?.data?.supported).not.toContain("1900-01-01");
    expect(network).not.toHaveBeenCalled();
  });

  it("returns modern method-not-found rather than proxying an unknown RPC", async () => {
    const reply = await send(modern("not/a/real/method"));
    expect(reply.response.status).toBe(404);
    expect(reply.message).toMatchObject({ id: "modern", error: { code: -32601 } });
    expect(network).not.toHaveBeenCalled();
  });

  it("distinguishes an unknown tool from an unknown RPC", async () => {
    const reply = await send(modern("tools/call", { name: "witness_hash", arguments: {} }));
    expect(reply.message).toMatchObject({ id: "modern", error: { code: -32602 } });
    expect(network).not.toHaveBeenCalled();
  });

  it("does not execute an id-less tools/call notification, even with payment supplied", async () => {
    const input = modern("tools/call", { name: "commission_card", arguments: { subject: "test", x_payment: "test-only-token" } });
    delete input.body.id;
    const reply = await send(input);
    expect(reply.response.status === 202 || reply.response.status >= 400).toBe(true);
    expect(reply.message?.result).toBeUndefined();
    expect(network).not.toHaveBeenCalled();
  });

  it.each([null, true, 1.5, {}])("rejects invalid request id %j before paid work", async (id) => {
    const input = modern("tools/call", { name: "commission_card", arguments: { subject: "test", x_payment: "test-only-token" } });
    input.body.id = id;
    const reply = await send(input);
    expect(reply.message?.error?.code).toBe(-32600);
    expect(network).not.toHaveBeenCalled();
  });

  it.each([false, true])("supports legacy stateless initialize/list/tool calls (version header=%s)", async (withVersion) => {
    const initialized = await send(legacy("initialize", {
      protocolVersion: LEGACY, capabilities: {}, clientInfo: { name: "legacy-test", version: "1" },
    }, "init", withVersion));
    expect(initialized.message?.result?.protocolVersion).toBe(LEGACY);
    expect(initialized.response.headers.get("Mcp-Session-Id")).toBeNull();
    const listed = await send(legacy("tools/list", {}, "list", withVersion));
    expect(listed.message?.result?.tools).toHaveLength(12);
    expect(listed.message?.result?.resultType).toBeUndefined();
    mockRoot();
    const result = await send(legacy("tools/call", { name: "get_root", arguments: {} }, "call", withVersion));
    expect(result.message).toMatchObject({ id: "call", result: { structuredContent: { state: "VALID", card_count: 2 } } });
    expect(result.message?.result?.resultType).toBeUndefined();
    expect(network).toHaveBeenCalledTimes(1);
  });

  it.each(["modern", "legacy"] as const)("keeps a delayed %s paid response isolated from the other era", async (era) => {
    let entered!: () => void;
    let release!: () => void;
    const enteredFetch = new Promise<void>((resolve) => { entered = resolve; });
    const gate = new Promise<void>((resolve) => { release = resolve; });
    network.mockImplementation(async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      expect(new URL(request.url).pathname).toBe("/api/request-attestation");
      expect(request.headers.get("x-payment")).toBe("test-only-token");
      entered();
      await gate;
      return Response.json({ marker: era, kind: "mock-deliverable" });
    });
    const params = { name: "commission_card", arguments: { subject: "test", x_payment: "test-only-token" } };
    const pending = send(era === "modern" ? modern("tools/call", params, { id: "pending" }) : legacy("tools/call", params, "pending"));
    let reply: Reply | undefined;
    try {
      await Promise.race([
        enteredFetch,
        pending.then(() => { throw new Error("Tool returned before reaching the mocked paid route"); }),
      ]);
      if (era === "modern") {
        const other = await send(legacy("initialize", { protocolVersion: LEGACY, capabilities: {}, clientInfo: { name: "other", version: "1" } }));
        expect(other.message?.result?.protocolVersion).toBe(LEGACY);
      } else {
        completed(await send(modern("server/discover", {}, { id: "other" })), "other");
      }
    } finally {
      release();
      // Drain this request even when an assertion above fails; no promise or
      // fetch mock from this test may leak into the next test.
      reply = await pending;
    }
    expect(reply.message).toMatchObject({ id: "pending", result: { structuredContent: { status: "DELIVERED", deliverable: { marker: era } } } });
    expect(reply.message?.result?.resultType).toBe(era === "modern" ? "complete" : undefined);
    expect(reply.message?.result?.cacheScope).toBeUndefined();
    expect(reply.message?.result?.ttlMs).toBeUndefined();
    expect(network).toHaveBeenCalledTimes(1);
  });
});

describe("official SDK client interoperability (no external network)", () => {
  it.each(["auto", "legacy"] as const)("connects, lists and calls using SDK mode=%s", async (mode) => {
    mockRoot();
    const requests: { method: string; headers: Headers; body?: Fields }[] = [];
    const transport = new StreamableHTTPClientTransport(new URL(`${ORIGIN}/mcp`), {
      fetch: async (input, init) => {
        const request = new Request(input, init);
        expect(request.url).toBe(`${ORIGIN}/mcp`);
        requests.push({
          method: request.method, headers: new Headers(request.headers),
          ...(request.method === "POST" ? { body: await request.clone().json() as Fields } : {}),
        });
        return dispatch(request);
      },
    });
    const client = new Client({ name: "local-contract-test", version: "1.0.0" }, {
      capabilities: {}, versionNegotiation: { mode },
      supportedProtocolVersions: mode === "auto" ? [CURRENT, LEGACY] : [LEGACY],
    });
    try {
      await client.connect(transport);
      expect(client.getProtocolEra()).toBe(mode === "auto" ? "modern" : "legacy");
      expect(client.getNegotiatedProtocolVersion()).toBe(mode === "auto" ? CURRENT : LEGACY);
      const listed = await client.listTools();
      expect(listed.tools).toHaveLength(12);
      const result = await client.callTool({ name: "get_root", arguments: {} });
      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toMatchObject({ state: "VALID", card_count: 2 });
      expect(network).toHaveBeenCalledTimes(1);
      const post = requests.filter((request) => request.method === "POST");
      const methods = post.map((request) => request.body?.method);
      expect(methods).toContain("tools/list");
      expect(methods).toContain("tools/call");
      if (mode === "auto") {
        expect(methods).toContain("server/discover");
        expect(methods).not.toContain("initialize");
        for (const request of post) {
          expect(request.headers.get("MCP-Protocol-Version")).toBe(CURRENT);
          expect(request.headers.get("Mcp-Method")).toBe(request.body?.method);
          expect((request.body?.params as Fields)._meta).toMatchObject({ [VERSION]: CURRENT, [CAPABILITIES]: {} });
        }
        expect(post.find((request) => request.body?.method === "tools/call")?.headers.get("Mcp-Name")).toBe("get_root");
      } else {
        expect(methods).toContain("initialize");
        expect(methods).toContain("notifications/initialized");
        expect(methods).not.toContain("server/discover");
        expect(client.getDiscoverResult()).toBeUndefined();
      }
    } finally {
      await client.close();
    }
  });
});

describe("MCP HTTP request boundaries", () => {
  it.each(["https://attacker.example", "null"])("rejects untrusted browser Origin %s without dispatch", async (origin) => {
    const input = modern("tools/list");
    input.headers.set("origin", origin);
    const response = await dispatch(new Request(`${ORIGIN}/mcp`, {
      method: "POST", headers: input.headers, body: JSON.stringify(input.body),
    }));
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(network).not.toHaveBeenCalled();
  });

  it("rejects an explicit conflicting Host and an untrusted URL authority", async () => {
    for (const request of [
      new Request(`${ORIGIN}/mcp`, { headers: { host: "attacker.example" } }),
      new Request("https://attacker.example/mcp", { headers: { host: "councilof.ai" } }),
    ]) expect((await dispatch(request)).status).toBe(403);
    expect(network).not.toHaveBeenCalled();
  });

  it("allows only the exact configured Pages preview, not arbitrary pages.dev siblings", async () => {
    const env = { CF_PAGES_URL: "https://review-123.csoai.pages.dev" };
    const allowed = await dispatch(new Request(`${env.CF_PAGES_URL}/mcp`), env);
    expect(allowed.status).toBe(200);
    const denied = await dispatch(new Request("https://review-456.csoai.pages.dev/mcp"), env);
    expect(denied.status).toBe(403);
    expect(network).not.toHaveBeenCalled();
  });

  it("serves bodyless HEAD discovery, rejects GET SSE, and advertises narrow CORS methods", async () => {
    const head = await dispatch(new Request(`${ORIGIN}/mcp`, { method: "HEAD" }));
    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");
    expect(head.headers.get("content-type")).toContain("application/json");
    expect(head.headers.get("cache-control")).toContain("public");
    const sse = await dispatch(new Request(`${ORIGIN}/mcp`, { headers: { accept: "text/event-stream" } }));
    expect(sse.status).toBe(405);
    const options = await dispatch(new Request(`${ORIGIN}/mcp`, { method: "OPTIONS" }));
    expect(options.status).toBe(204);
    expect(await options.text()).toBe("");
    expect(options.headers.get("access-control-allow-methods")).toBe("GET, HEAD, POST, OPTIONS");
    expect(options.headers.get("access-control-allow-headers")).toContain("Mcp-Name");
    expect(network).not.toHaveBeenCalled();
  });

  it.each(["text/plain", "application/octet-stream", ""])("rejects unsupported content type %s before parsing or paid work", async (contentType) => {
    const input = modern("tools/call", { name: "commission_card", arguments: { subject: "test", x_payment: "test-only-token" } });
    if (contentType) input.headers.set("content-type", contentType);
    else input.headers.delete("content-type");
    const reply = await send(input);
    expect(reply.response.status).toBe(415);
    expect(reply.message?.error?.code).toBe(-32600);
    expect(network).not.toHaveBeenCalled();
  });

  it.each([
    ["{", -32700],
    ["null", -32600],
    ["[]", -32600],
    [JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: [] }), -32600],
    [JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: "not-object" }), -32600],
  ] as const)("rejects malformed body %s with a protocol error", async (body, code) => {
    const response = await dispatch(new Request(`${ORIGIN}/mcp`, {
      method: "POST", headers: modern("tools/call").headers, body,
    }));
    expect(response.status).toBe(400);
    expect((await decode(response, 1))?.error?.code).toBe(code);
    expect(network).not.toHaveBeenCalled();
  });

  it("accepts a legacy initialized notification with no response body or work", async () => {
    const input = legacy("notifications/initialized");
    delete input.body.id;
    const reply = await send(input);
    expect(reply.response.status).toBe(202);
    expect(reply.message).toBeNull();
    expect(network).not.toHaveBeenCalled();
  });

  it("fails closed on malformed base64 Mcp-Name before paid work", async () => {
    const input = modern("tools/call", { name: "commission_card", arguments: { subject: "test", x_payment: "test-only-token" } });
    input.headers.set("Mcp-Name", "=?base64?%%%?=");
    const reply = await send(input);
    expect(reply.response.status).toBe(400);
    expect(reply.message?.error?.code).toBe(-32020);
    expect(network).not.toHaveBeenCalled();
  });

  it("validates paid arguments before calling a payment route", async () => {
    const reply = await send(modern("tools/call", { name: "commission_card", arguments: { subject: 123, x_payment: "test-only-token" } }));
    expect(reply.message?.result?.isError === true || reply.message?.error?.code === -32602).toBe(true);
    expect(network).not.toHaveBeenCalled();
  });

  it("keeps caller-specific successful tool responses out of HTTP shared caches", async () => {
    mockRoot();
    const reply = await send(modern("tools/call", { name: "get_root", arguments: {} }));
    completed(reply, "modern");
    expect(reply.response.headers.get("cache-control")).toBe("no-store");
    expect(reply.response.headers.get("Mcp-Session-Id")).toBeNull();
  });
});

describe("MCP streaming input limits", () => {
  function streamed(body: ReadableStream<Uint8Array>, contentLength?: string): Request {
    const headers = modern("tools/list").headers;
    if (contentLength !== undefined) headers.set("content-length", contentLength);
    const init: RequestInit & { duplex: "half" } = { method: "POST", headers, body, duplex: "half" };
    return new Request(`${ORIGIN}/mcp`, init);
  }

  it("rejects declared input larger than 28 MiB before reading its stream", async () => {
    expect(MCP_MAX_REQUEST_BYTES).toBe(28 * 1024 * 1024);
    const pull = vi.fn();
    const request = streamed(new ReadableStream({ pull }, { highWaterMark: 0 }), String(MCP_MAX_REQUEST_BYTES + 1));
    const response = await dispatch(request);
    expect(response.status).toBe(413);
    expect((await decode(response, undefined))?.error?.code).toBe(-32600);
    expect(pull).not.toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
    await request.body?.cancel();
  });

  it.each([undefined, "1"])("rejects actual streamed bytes over 28 MiB even when Content-Length=%s", async (contentLength) => {
    const chunk = new Uint8Array(1024 * 1024).fill(32);
    const cancel = vi.fn();
    let chunks = 0;
    const response = await dispatch(streamed(new ReadableStream({
      pull(controller) { chunks += 1; controller.enqueue(chunk); }, cancel,
    }, { highWaterMark: 0 }), contentLength));
    expect(response.status).toBe(413);
    expect(chunks).toBe(29);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(network).not.toHaveBeenCalled();
  });

  it("rejects invalid UTF-8 rather than silently rewriting signed inputs", async () => {
    const response = await dispatch(streamed(new ReadableStream({
      start(controller) { controller.enqueue(new Uint8Array([0xc3, 0x28])); controller.close(); },
    })));
    expect(response.status).toBe(400);
    expect(network).not.toHaveBeenCalled();
  });

  it("times out an unending input stream without waiting for hostile cancellation", async () => {
    vi.useFakeTimers();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const pending = dispatch(streamed(new ReadableStream({ cancel }, { highWaterMark: 0 })));
    await vi.advanceTimersByTimeAsync(10_001);
    const response = await pending;
    expect(response.status).toBe(400);
    expect((await decode(response, undefined))?.error?.code).toBe(-32600);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(network).not.toHaveBeenCalled();
  });
});
