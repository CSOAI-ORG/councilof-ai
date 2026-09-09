import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../../../functions/mcp/[[path]]";
import { ALL_TOOL_NAMES } from "./mcpTools";
import { MCP_PROTOCOL_VERSION, mcpRpc, mcpRpcEndpoints } from "./mcpHttp";

const ORIGIN = "https://councilof.ai";
const VERSION_META = "io.modelcontextprotocol/protocolVersion";
const CAPABILITIES_META = "io.modelcontextprotocol/clientCapabilities";

function asRequest(input: RequestInfo | URL, init?: RequestInit): Request {
  if (input instanceof Request) return input;
  return new Request(new URL(String(input), ORIGIN), init);
}

async function throughHandler(request: Request): Promise<Response> {
  return onRequest({
    request,
    env: {},
    params: {},
    waitUntil: () => {},
  } as never);
}

afterEach(() => vi.unstubAllGlobals());

describe("browser MCP request contract", () => {
  it("falls back only for local tools/list and receives the exact canonical 12", async () => {
    const seen: Request[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input) === "/mcp") {
          throw new Error("local Vite preview has no Pages Function");
        }
        const request = asRequest(input, init);
        seen.push(request.clone());
        return throughHandler(request);
      }),
    );

    const reply = await mcpRpc(
      "tools/list",
      {},
      { hostname: "localhost", allowPublicCatalogFallback: true },
    );
    const tools = Array.isArray(reply.result?.tools)
      ? (reply.result.tools as Array<{ name: string }>)
      : [];

    expect(tools.map((tool) => tool.name)).toEqual(ALL_TOOL_NAMES);
    expect(tools).toHaveLength(12);
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe(`${ORIGIN}/mcp`);
    expect(seen[0].headers.get("accept")).toBe(
      "application/json, text/event-stream",
    );
    expect(seen[0].headers.get("MCP-Protocol-Version")).toBe(
      MCP_PROTOCOL_VERSION,
    );
    expect(seen[0].headers.get("Mcp-Method")).toBe("tools/list");
    expect(seen[0].headers.get("Mcp-Name")).toBeNull();
    const body = (await seen[0].json()) as {
      params: { _meta: Record<string, unknown> };
    };
    expect(body.params._meta).toEqual({
      [VERSION_META]: MCP_PROTOCOL_VERSION,
      [CAPABILITIES_META]: {},
    });
  });

  it("never retries a payment-bearing tools/call across origins", async () => {
    const outerRequests: Request[] = [];
    const downstreamRequests: Request[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = asRequest(input, init);
        const url = new URL(request.url);
        if (url.pathname === "/mcp") {
          outerRequests.push(request.clone());
          return throughHandler(request);
        }
        downstreamRequests.push(request);
        throw new Error("settlement status unavailable");
      }),
    );

    const secretPayment = "test-only-payment-payload";
    const reply = await mcpRpc(
      "tools/call",
      {
        name: "commission_card",
        arguments: { subject: "model/example", x_payment: secretPayment },
      },
      { hostname: "localhost" },
    );

    expect(mcpRpcEndpoints("localhost", "tools/call")).toEqual(["/mcp"]);
    expect(outerRequests).toHaveLength(1);
    expect(downstreamRequests).toHaveLength(1);
    expect(new URL(downstreamRequests[0].url).pathname).toBe(
      "/api/request-attestation",
    );
    expect(reply.result).toMatchObject({
      isError: true,
      structuredContent: {
        status: "UNREACHABLE",
        delivery_state: "UNKNOWN",
        settlement_state: "UNCONFIRMED",
      },
    });

    const headers = JSON.stringify([...outerRequests[0].headers]);
    expect(headers).not.toContain(secretPayment);
    expect(outerRequests[0].headers.get("Mcp-Name")).toBe("commission_card");
    const body = await outerRequests[0].text();
    expect(body).toContain(secretPayment);
  });

  it.each([
    ["wrong request id", "wrong-id"],
    ["both result and error", "ambiguous"],
    ["partial result", "partial"],
    ["missing result and error", "empty"],
    ["malformed error", "bad-error"],
  ])("rejects a %s rather than promoting it", async (_label, kind) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = asRequest(input, init);
        const sent = (await request.json()) as { id: number };
        const payload =
          kind === "wrong-id"
            ? {
                jsonrpc: "2.0",
                id: sent.id + 1,
                result: { resultType: "complete" },
              }
            : kind === "ambiguous"
              ? {
                  jsonrpc: "2.0",
                  id: sent.id,
                  result: { resultType: "complete" },
                  error: { code: -32603, message: "ambiguous" },
                }
              : kind === "partial"
                ? {
                    jsonrpc: "2.0",
                    id: sent.id,
                    result: { resultType: "partial" },
                  }
                : kind === "bad-error"
                  ? {
                      jsonrpc: "2.0",
                      id: sent.id,
                      error: { code: "-32603", message: 7 },
                    }
                  : { jsonrpc: "2.0", id: sent.id };
        return Response.json(payload);
      }),
    );

    await expect(
      mcpRpc("tools/list", {}, { hostname: "councilof.ai" }),
    ).rejects.toThrow(/invalid|incomplete/i);
  });

  it("does not use the local catalog fallback after the caller aborts", async () => {
    const controller = new AbortController();
    const network = vi.fn(async () => {
      controller.abort();
      throw new DOMException("aborted", "AbortError");
    });
    vi.stubGlobal("fetch", network);

    await expect(
      mcpRpc(
        "tools/list",
        {},
        {
          hostname: "localhost",
          signal: controller.signal,
          allowPublicCatalogFallback: true,
        },
      ),
    ).rejects.toThrow();
    expect(network).toHaveBeenCalledTimes(1);
  });

  it("keeps local catalog probes same-origin unless fallback is explicit", async () => {
    const network = vi.fn(async () => {
      throw new Error("local Vite preview has no Pages Function");
    });
    vi.stubGlobal("fetch", network);

    expect(mcpRpcEndpoints("localhost", "tools/list", false)).toEqual(["/mcp"]);
    expect(mcpRpcEndpoints("localhost", "tools/list", true)).toEqual([
      "/mcp",
      "https://councilof.ai/mcp",
    ]);
    await expect(
      mcpRpc("tools/list", {}, { hostname: "localhost" }),
    ).rejects.toThrow("local Vite preview");
    expect(network).toHaveBeenCalledTimes(1);
    expect(network.mock.calls[0]?.[0]).toBe("/mcp");
  });
});
