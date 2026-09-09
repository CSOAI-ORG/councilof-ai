/** Request-scoped browser client for the Council MCP Streamable HTTP door. */

export const MCP_PROTOCOL_VERSION = "2026-07-28";
const VERSION_META = "io.modelcontextprotocol/protocolVersion";
const CAPABILITIES_META = "io.modelcontextprotocol/clientCapabilities";

type JsonObject = Record<string, unknown>;

export type McpJsonRpcReply = {
  jsonrpc: "2.0";
  id?: string | number | null;
  result?: JsonObject;
  error?: { code?: number; message?: string; data?: unknown };
};

export type McpHttpOptions = {
  hostname?: string;
  signal?: AbortSignal;
  allowPublicCatalogFallback?: boolean;
};

/**
 * Only the read-only catalog may fall back from a local Vite preview to the
 * public door. A tools/call request is never replayed across origins: it may
 * contain a payment and a failed response does not establish settlement state.
 */
export function mcpRpcEndpoints(
  hostname?: string,
  method = "tools/list",
  allowPublicCatalogFallback = false,
): string[] {
  const local = hostname === "localhost" || hostname === "127.0.0.1";
  return local && method === "tools/list" && allowPublicCatalogFallback
    ? ["/mcp", "https://councilof.ai/mcp"]
    : ["/mcp"];
}

function object(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function request(
  method: string,
  params: JsonObject,
  id: number,
  signal?: AbortSignal,
): RequestInit {
  const suppliedMeta = object(params._meta) ? params._meta : {};
  const modernParams = {
    ...params,
    _meta: {
      ...suppliedMeta,
      [VERSION_META]: MCP_PROTOCOL_VERSION,
      [CAPABILITIES_META]: {},
    },
  };
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
    "Mcp-Method": method,
  };
  if (method === "tools/call" && typeof params.name === "string") {
    headers["Mcp-Name"] = params.name;
  }
  return {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id,
      method,
      params: modernParams,
    }),
    signal,
  };
}

let nextId = 0;

export async function mcpRpc(
  method: string,
  params: JsonObject = {},
  options: McpHttpOptions = {},
): Promise<McpJsonRpcReply> {
  const hostname =
    options.hostname ??
    (typeof window === "undefined" ? undefined : window.location.hostname);
  const endpoints = mcpRpcEndpoints(
    hostname,
    method,
    options.allowPublicCatalogFallback ?? false,
  );
  const id = ++nextId;
  let lastError: Error = new Error("the MCP runtime did not answer");

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(
        endpoint,
        request(method, params, id, options.signal),
      );
      if (!response.ok) {
        throw new Error(`${endpoint} returned HTTP ${response.status}`);
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error(`${endpoint} returned a non-JSON MCP response`);
      }
      const reply: unknown = await response.json();
      if (!object(reply) || reply.jsonrpc !== "2.0" || reply.id !== id) {
        throw new Error(`${endpoint} returned an invalid JSON-RPC response`);
      }
      const hasResult = Object.prototype.hasOwnProperty.call(reply, "result");
      const hasError = Object.prototype.hasOwnProperty.call(reply, "error");
      if (hasResult === hasError) {
        throw new Error(`${endpoint} returned an invalid JSON-RPC response`);
      }
      if (hasResult) {
        if (!object(reply.result) || reply.result.resultType !== "complete") {
          throw new Error(`${endpoint} returned an incomplete MCP result`);
        }
      } else if (
        !object(reply.error) ||
        !Number.isInteger(reply.error.code) ||
        typeof reply.error.message !== "string"
      ) {
        throw new Error(`${endpoint} returned an invalid JSON-RPC error`);
      }
      return reply as McpJsonRpcReply;
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("the MCP runtime did not answer");
      if (options.signal?.aborted) break;
      // tools/call has exactly one endpoint by construction. Keep this guard
      // explicit so a future endpoint-list change cannot replay paid work.
      if (method !== "tools/list") break;
    }
  }
  throw lastError;
}
