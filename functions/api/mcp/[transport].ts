/**
 * /api/mcp/:transport — streamable-HTTP / SSE slice wrapping measured board APIs.
 *
 * transport = "http" | "sse" | "jsonrpc" (aliases accepted)
 * JSON-RPC body methods: initialize | tools/list | tools/call | notifications/initialized
 * Measurement, not certification. Proxies live /api/gspc, /api/east-west, /api/instruments.
 */
import {
  MEASURED_TOOLS,
  callMeasuredTool,
  jsonRpcError,
  jsonRpcResult,
} from "../mcp-rpc";

type RpcBody = {
  jsonrpc?: string;
  id?: unknown;
  method?: string;
  params?: Record<string, unknown>;
};

async function handleJsonRpc(request: Request, url: URL): Promise<Response> {
  let body: RpcBody;
  try {
    body = await request.json();
  } catch {
    return jsonRpcError(null, -32700, "Parse error");
  }
  if (body.jsonrpc !== "2.0" || !body.method) {
    return jsonRpcError(body.id ?? null, -32600, "Invalid Request");
  }
  const { id, method, params } = body;
  switch (method) {
    case "initialize":
      return jsonRpcResult(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: {
          name: "csoai-measured",
          version: "0.1.0",
          description: "Measured board APIs — measurement, not certification",
          transport: url.pathname,
        },
      });
    case "notifications/initialized":
      return new Response(null, {
        status: 204,
        headers: { "access-control-allow-origin": "*" },
      });
    case "tools/list":
      return jsonRpcResult(id, { tools: MEASURED_TOOLS });
    case "tools/call": {
      const name = String((params as { name?: string })?.name ?? "");
      const args = ((params as { arguments?: Record<string, unknown> })?.arguments ?? {}) as Record<
        string,
        unknown
      >;
      const result = await callMeasuredTool(name, args, url.origin);
      return jsonRpcResult(id, result);
    }
    default:
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}

function sseEvent(data: unknown, event = "message"): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export const onRequest: PagesFunction = async ({ request, params, url }) => {
  const transport = String((params as { transport?: string }).transport ?? "http").toLowerCase();
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type,accept,mcp-session-id",
      },
    });
  }

  // SSE discovery / keepalive for streamable clients
  if (method === "GET" && (transport === "sse" || transport === "http")) {
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        controller.enqueue(
          enc.encode(
            sseEvent({
              endpoint: "/api/mcp",
              tools: MEASURED_TOOLS.map((t) => t.name),
              note: "POST JSON-RPC to /api/mcp or /api/mcp/http for tools/list and tools/call. Measurement, not certification.",
            }, "endpoint"),
          ),
        );
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    });
  }

  if (method === "POST") {
    return handleJsonRpc(request, url);
  }

  return jsonRpcError(null, -32600, `Unsupported method ${method} on transport ${transport}`);
};
