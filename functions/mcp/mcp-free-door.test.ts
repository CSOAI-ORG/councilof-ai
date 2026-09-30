import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { FREE_DEFINITIONS, FREE_INSTRUCTIONS, doorFor, onRequest } from "./[[path]]";
import { PAID_TOOL_NAMES } from "./_paid";
import FREE from "./gspc-tools.json";
import PAID from "./paid-tools.json";

/**
 * /mcp/free — the address listed in the Claude connector directory (2026-09-27).
 *
 * Anthropic Software Directory Policy 4.A: "Unless otherwise expressly permitted by us in writing,
 * we do not allow … Software that transfers money, cryptocurrency, or other financial assets".
 * /mcp carries x402 tools that settle USDC, so the directory gets a door on which no payment
 * can happen: the free readers, the same definitions and handlers as /mcp, filtered.
 * /mcp itself is unchanged for agents that pay; the last block here pins that too.
 */
const ORIGIN = "https://councilof.ai";
const LEGACY = "2025-03-26";

type Tool = { name: string; title?: string; description?: string; annotations?: Record<string, unknown>; inputSchema?: { properties?: Record<string, unknown> } };
type Envelope = {
  jsonrpc: string;
  id?: unknown;
  result?: Record<string, unknown> & {
    tools?: Tool[];
    instructions?: string;
    isError?: boolean;
    content?: Array<{ type: string; text: string }>;
    structuredContent?: Record<string, unknown>;
  };
  error?: { code: number; message: string };
};

async function decode(response: Response, id: unknown): Promise<Envelope> {
  const text = await response.text();
  if (!(response.headers.get("content-type") ?? "").includes("text/event-stream")) return JSON.parse(text) as Envelope;
  const messages = text.replace(/\r\n/g, "\n").split(/\n\n/).flatMap((event) => {
    const data = event.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).replace(/^ /, "")).join("\n");
    return data && data !== "[DONE]" ? [JSON.parse(data) as Envelope] : [];
  });
  const message = messages.find((m) => m.id === id) ?? messages.at(-1);
  if (!message) throw new Error("SSE response did not contain a JSON-RPC result");
  return message;
}

const dispatch = (request: Request) => onRequest({ request, env: {}, params: {}, waitUntil: () => {} } as never);

async function rpc(path: string, method: string, params: Record<string, unknown> = {}, id: number | string = 1) {
  const response = await dispatch(new Request(`${ORIGIN}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "MCP-Protocol-Version": LEGACY },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  }));
  return { response, message: await decode(response, id) };
}

const FREE_NAMES = (FREE as { tools: Tool[] }).tools.map((t) => t.name);
const PAID_NAMES = (PAID as { tools: Tool[] }).tools.map((t) => t.name);
// Payment metadata a directory reviewer or a chat user must not meet on the free door. "x402" alone is
// not in this list: x402_trust is a free census of OTHER parties' x402 endpoints, a measurement subject.
const PAYMENT_TEXT = /x_payment|x-payment|usdc|\bprice|\bwallet|settle|payTo|commission_card|rwa_evidence|receipts_batch|art50_marking_evidence/i;

const network = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
beforeEach(() => {
  network.mockReset();
  network.mockImplementation(async () => { throw new Error("Network is mocked: unexpected subrequest"); });
  vi.stubGlobal("fetch", network);
});
afterEach(() => vi.unstubAllGlobals());

describe("/mcp/free serves exactly the free tools", () => {
  it("routes /mcp and /mcp/free (with or without a trailing slash) and nothing else", () => {
    expect(doorFor("/mcp")).toBe("full");
    expect(doorFor("/mcp/")).toBe("full");
    expect(doorFor("/mcp/free")).toBe("free");
    expect(doorFor("/mcp/free/")).toBe("free");
    expect(doorFor("/mcp/paid")).toBeNull();
    expect(doorFor("/mcp/free/x")).toBeNull();
  });

  it("tools/list returns the free definitions, by name and in order, with their titles and annotations", async () => {
    const { response, message } = await rpc("/mcp/free", "tools/list");
    expect(response.status).toBe(200);
    const tools = message.result!.tools!;
    expect(FREE_NAMES).toHaveLength(13);
    expect(tools.map((t) => t.name)).toEqual(FREE_NAMES);
    expect(tools).toEqual((FREE as { tools: Tool[] }).tools);
    for (const t of tools) {
      expect(PAID_TOOL_NAMES.has(t.name), t.name).toBe(false);
      expect(t.title, t.name).toBeTruthy();
      expect(t.annotations, t.name).toMatchObject({ readOnlyHint: true, destructiveHint: false });
      expect(Object.keys(t.inputSchema?.properties ?? {}), t.name).not.toContain("x_payment");
      expect(JSON.stringify(t), t.name).not.toMatch(PAYMENT_TEXT);
    }
    expect(FREE_DEFINITIONS.map((d) => d.name)).toEqual(FREE_NAMES);
    expect(network).not.toHaveBeenCalled();
  });

  it("the same definitions are served on /mcp, so the two doors cannot disagree about a free tool", async () => {
    const full = (await rpc("/mcp", "tools/list")).message.result!.tools!;
    const free = (await rpc("/mcp/free", "tools/list")).message.result!.tools!;
    expect(full.filter((t) => !PAID_TOOL_NAMES.has(t.name))).toEqual(free);
  });

  it.each(PAID_NAMES)("calling the paid tool %s on /mcp/free is an ordinary unknown-tool error, and nothing is fetched", async (name) => {
    const { message } = await rpc("/mcp/free", "tools/call", { name, arguments: { subject: "t", asset: "t", from: "2026-09-01", url: "https://example.com", x_payment: "test-only-token" } });
    expect(message.result).toBeUndefined();
    expect(message.error?.code).toBe(-32602);
    expect(message.error?.message).toMatch(/not found/i);
    expect(network).not.toHaveBeenCalled();
  });

  it("the unlisted `verify` alias is /mcp only: the free door serves exactly what it lists", async () => {
    const { message } = await rpc("/mcp/free", "tools/call", { name: "verify", arguments: {} });
    expect(message.error?.code).toBe(-32602);
  });

  it("initialize carries the same identity and instructions with no payment text", async () => {
    const { message } = await rpc("/mcp/free", "initialize", { protocolVersion: LEGACY, capabilities: {}, clientInfo: { name: "t", version: "0" } });
    const r = message.result as { serverInfo: { name: string }; instructions: string };
    expect(r.serverInfo.name).toBe("csoai-gspc-mcp");
    expect(r.instructions).toBe(FREE_INSTRUCTIONS);
    expect(r.instructions).toContain(`${FREE_NAMES.length} free read-only tools`);
    expect(r.instructions).toMatch(/Measurement, not certification/);
    expect(r.instructions).not.toMatch(/x402|pay|price|usdc|wallet|quarantin|npm/i);
  });

  it("GET /mcp/free answers with a discovery document that has no paid_tools and no payment text", async () => {
    const r = await dispatch(new Request(`${ORIGIN}/mcp/free`));
    expect(r.status).toBe(200);
    const text = await r.text();
    const doc = JSON.parse(text) as Record<string, unknown>;
    expect(doc.paid_tools).toBeUndefined();
    expect(doc.tools).toEqual(FREE_NAMES);
    expect(doc.documentation).toBe(`${ORIGIN}/connect/claude/`);
    expect(text).not.toMatch(PAYMENT_TEXT);
    const page = await (await dispatch(new Request(`${ORIGIN}/mcp/free/`, { headers: { accept: "text/html" } }))).text();
    expect(page).toContain("https://councilof.ai/mcp/free");
    expect(page).not.toMatch(/x402 tools|x_payment/);
    expect(page.match(/<h1[\s>]/g)).toHaveLength(1);
    const head = await dispatch(new Request(`${ORIGIN}/mcp/free`, { method: "HEAD" }));
    expect(head.status).toBe(200);
  });

  it("an unknown path under /mcp is a 404 that names both doors", async () => {
    const r = await dispatch(new Request(`${ORIGIN}/mcp/paid`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }));
    expect(r.status).toBe(404);
    expect(((await r.json()) as { error: { message: string } }).error.message).toMatch(/\/mcp and \/mcp\/free/);
  });

  it("an official SDK client connects to /mcp/free, lists the free tools, calls a free one, and is refused a paid one", async () => {
    network.mockImplementation(async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      expect(request.url).toBe(`${ORIGIN}/root.json`);
      return Response.json({ kind: "test-root", card_count: 2, merkle_root: "a".repeat(64) });
    });
    const transport = new StreamableHTTPClientTransport(new URL(`${ORIGIN}/mcp/free`), {
      fetch: async (input, init) => dispatch(new Request(input, init)),
    });
    const client = new Client({ name: "free-door-test", version: "1.0.0" }, { capabilities: {}, versionNegotiation: { mode: "legacy" }, supportedProtocolVersions: [LEGACY] });
    try {
      await client.connect(transport);
      const listed = await client.listTools();
      expect(listed.tools.map((t) => t.name)).toEqual(FREE_NAMES);
      const root = await client.callTool({ name: "get_root", arguments: {} });
      expect(root.isError).not.toBe(true);
      expect(root.structuredContent).toMatchObject({ state: "VALID", card_count: 2 });
      await expect(client.callTool({ name: "commission_card", arguments: { subject: "t" } })).rejects.toThrow(/not found/i);
    } finally {
      await client.close();
    }
  });
});

describe("/mcp is unchanged for agents that pay", () => {
  it("still lists every tool and still answers an unpaid paid call with the x402 challenge", async () => {
    const listed = (await rpc("/mcp", "tools/list")).message.result!.tools!;
    expect(listed).toHaveLength(FREE_NAMES.length + PAID_NAMES.length);
    network.mockImplementation(async (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);
      expect(new URL(request.url).pathname).toBe("/api/request-attestation");
      expect(request.headers.get("x-payment")).toBeNull();
      return Response.json(
        { x402Version: 2, error: "Payment required", accepts: [{ scheme: "exact", network: "eip155:8453", payTo: "0xpay", amount: "1", asset: "0xasset" }] },
        { status: 402, headers: { "PAYMENT-REQUIRED": "e30=" } },
      );
    });
    const { message } = await rpc("/mcp", "tools/call", { name: "commission_card", arguments: { subject: "qwen3" } });
    const r = message.result!;
    // INTENDED, and pinned since 2026-09-26 (_paid.ts, paid-tools.test.ts): the x402 MCP transport
    // (x402-foundation/x402 specs/transports-v2/mcp.md) says a server MUST return isError:true with the
    // PaymentRequired object. The 27 Sep directory packet read an older checkout whose comment still
    // said "a challenge is an answer, not a failure" (isError:false); live and master already agree.
    expect(r.isError).toBe(true);
    expect(r.structuredContent).toMatchObject({ x402Version: 2, status: "PAYMENT_REQUIRED", nothing_charged: true, payment_presented: false });
    expect(r.content).toHaveLength(2);
    expect(JSON.parse(r.content![0].text)).toEqual(r.structuredContent);
    expect(r.content![1].text).toMatch(/^PAYMENT_REQUIRED/);
    expect(network).toHaveBeenCalledTimes(1);
  });
});

describe("board_totals is compact by default and full on request", () => {
  const MEASURED_ON = {
    model: "fleet notes ".repeat(40),
    endpoint: "internal hosts",
    date: "behavioural axes 2026-08-12 · financial-fact axes 2026-08-25",
    grading: "grading notes ".repeat(40),
    living_stamp: { signature: "f".repeat(128), preimage: { axes: Array.from({ length: 23 }, (_, i) => ({ axis: `a${i}`, n: i })) } },
  };
  const BOARD = {
    measured_on: MEASURED_ON,
    totals: {
      axes: 23, measured_axes: 23, unmeasured_axes: 0,
      public_count: "23 axis · 23 measured",
      separation_public_count: "0 of 14 model-comparison axes separated a leader · 2 TIE · 12 UNTESTED",
      comparison_axes: 14, separated_leads: 0, ties: 2, untested_separations: 12,
      count_grammar: "a long sentence ".repeat(30),
      by_family: { gspc: { axes: 15, measured: 15, note: "family note ".repeat(30) }, financial: { axes: 8, measured: 8 } },
    },
  };
  const board = () => network.mockImplementation(async (input, init) => {
    const request = input instanceof Request ? input : new Request(input, init);
    expect(request.url).toBe(`${ORIGIN}/api/gspc`);
    return Response.json(BOARD);
  });

  it.each(["/mcp", "/mcp/free"])("on %s the default answer is a summary under 2,000 characters", async (path) => {
    board();
    const { message } = await rpc(path, "tools/call", { name: "board_totals", arguments: {} });
    const r = message.result!;
    expect(r.isError).toBe(false);
    const sc = r.structuredContent!;
    expect(sc).toMatchObject({ state: "LIVE", detail: "summary", public_count: "23 axis · 23 measured", source: `${ORIGIN}/api/gspc` });
    expect(sc.separation).toMatchObject({ public_count: BOARD.totals.separation_public_count, comparison_axes: 14, separated_leads: 0, ties: 2, untested: 12 });
    expect((sc.as_of as Record<string, unknown>).board_measured_on).toBe(MEASURED_ON.date);
    expect((sc.counts as Array<{ name: string; value: unknown }>).map((c) => [c.name, c.value])).toEqual([["axis_slots", 23], ["measured", 23], ["unmeasured", 0]]);
    expect(sc).not.toHaveProperty("count_grammar");
    expect(sc).not.toHaveProperty("by_family");
    expect(r.content![0].text.length).toBeLessThan(2000);
    expect(r.content![0].text).toMatch(/^LIVE board totals — 23 axis · 23 measured .* Separation: 0 of 14/);
  });

  it('detail: "full" returns the previous payload, with the board\'s measured_on block', async () => {
    board();
    const { message } = await rpc("/mcp/free", "tools/call", { name: "board_totals", arguments: { detail: "full" } });
    const sc = message.result!.structuredContent!;
    expect(sc).toMatchObject({ state: "LIVE", detail: "full", count_grammar: BOARD.totals.count_grammar, by_family: BOARD.totals.by_family });
    expect((sc.as_of as Record<string, unknown>).board_measured_on).toEqual(MEASURED_ON);
  });

  it("an unknown detail value is an input-validation error, never a silent default", async () => {
    const { message } = await rpc("/mcp/free", "tools/call", { name: "board_totals", arguments: { detail: "everything" } });
    expect(message.result?.isError).toBe(true);
    expect(network).not.toHaveBeenCalled();
  });
});
