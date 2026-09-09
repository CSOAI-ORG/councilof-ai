/** Public MCP: request-scoped SDK server; eight free tools and four x402 tools. */
import {
  createMcpHandler,
  fromJsonSchema,
  hostHeaderValidationResponse,
  McpServer,
  originValidationResponse,
  type Tool,
} from "@modelcontextprotocol/server";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/server/validators/cf-worker";
import GSPC_TOOLS from "./gspc-tools.json";
import { sharedToolResult, verifyToolResult } from "./_handlers";
import { PAID_TOOL_DEFS, PAID_TOOL_NAMES, paidToolResult } from "./_paid";
import { toolSpan, withTraceHeader } from "./_otel";

// HTTP runtime and registry descriptor share an identity; npm releases separately.
export const MCP_HTTP_SERVER_VERSION = "1.4.2";
const SERVER_INFO = {
  name: "csoai-gspc-mcp",
  version: MCP_HTTP_SERVER_VERSION,
};
const INSTRUCTIONS =
  "GSPC MCP. Eight free read-only tools and four paid x402 tools. Call tools/list for the current definitions. Call a paid tool without x_payment for its payment challenge; payment comes from the caller's wallet. Payment travels as the x_payment ARGUMENT; each implementation sets the X-PAYMENT header itself. A 402 challenge is not settlement, delivery or revenue. Measurement, not certification; verification stays free. witness_hash is quarantined and not advertised. MCP Registry server.version identifies this Pages HTTP implementation; npm is a separately versioned implementation.";
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, POST, OPTIONS",
  "access-control-allow-headers":
    "Content-Type, Accept, MCP-Protocol-Version, Mcp-Method, Mcp-Name, Mcp-Session-Id, Last-Event-ID",
  "access-control-expose-headers":
    "MCP-Protocol-Version, Mcp-Session-Id, x-otel-trace-id",
};
// Wire cap accommodates 20 MiB base64 input; this is not a concurrency SLA.
export const MCP_MAX_REQUEST_BYTES = 28 * 1024 * 1024;
const BODY_TIMEOUT_MS = 10_000;
const HOSTS = [
  "councilof.ai",
  "www.councilof.ai",
  "csoai.org",
  "www.csoai.org",
  "localhost",
  "127.0.0.1",
  "[::1]",
];
const BROWSER_ORIGINS = [...HOSTS, "chatgpt.com", "claude.ai"];
type McpPagesContext = {
  request: Request;
  env?: Record<string, unknown>;
};
const DEFINITIONS = [...GSPC_TOOLS.tools, ...PAID_TOOL_DEFS] as Tool[];
// The SDK's no-eval adapter retains the canonical JSON Schema. No parallel catalog.
const validator = new CfWorkerJsonSchemaValidator();
type JsonSchema = Parameters<typeof fromJsonSchema>[0];
const TOOLS = DEFINITIONS.map((definition) => ({
  definition,
  inputSchema: fromJsonSchema<Record<string, unknown>>(
    definition.inputSchema as JsonSchema,
    validator,
  ),
  outputSchema: definition.outputSchema
    ? fromJsonSchema<Record<string, unknown>>(
        definition.outputSchema,
        validator,
      )
    : undefined,
}));

const mcp = createMcpHandler(
  ({ requestInfo }) => {
    if (!requestInfo) throw new Error("HTTP request context required");
    const origin = new URL(requestInfo.url).origin;
    const server = new McpServer(SERVER_INFO, {
      instructions: INSTRUCTIONS,
      capabilities: { tools: { listChanged: false } },
      cacheHints: {
        "server/discover": { ttlMs: 300_000, cacheScope: "public" },
        "tools/list": { ttlMs: 300_000, cacheScope: "public" },
      },
    });
    for (const { definition, inputSchema, outputSchema } of TOOLS) {
      server.registerTool(
        definition.name,
        {
          description: definition.description,
          inputSchema,
          ...(outputSchema ? { outputSchema } : {}),
        },
        (args) =>
          PAID_TOOL_NAMES.has(definition.name)
            ? paidToolResult(definition.name, args, origin)
            : sharedToolResult(definition.name, args, origin),
      );
    }
    // Historical unlisted alias; it does not inflate the twelve canonical tools.
    server.registerTool(
      "verify",
      {
        description: "Compatibility alias for signed-card verification.",
        inputSchema: fromJsonSchema<Record<string, unknown>>(
          { type: "object" },
          validator,
        ),
      },
      (args) => verifyToolResult(args, origin),
    );
    server.server.setRequestHandler("tools/list", () => ({
      tools: DEFINITIONS,
    }));
    return server;
  },
  { legacy: "stateless", maxSubscriptions: 0 },
);

function jsonError(
  status: number,
  code: number,
  message: string,
  id?: string | number,
): Response {
  return Response.json(
    {
      jsonrpc: "2.0",
      ...(id !== undefined ? { id } : {}),
      error: { code, message },
    },
    {
      status,
      headers: { ...CORS, "cache-control": "no-store" },
    },
  );
}

function withHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS)) headers.set(key, value);
  // Caller-supplied verification inputs and paid deliverables are never shared-cacheable.
  headers.set("cache-control", "no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function readBody(request: Request): Promise<string> {
  const length = request.headers.get("content-length");
  if (
    length !== null &&
    (!/^\d+$/.test(length) || Number(length) > MCP_MAX_REQUEST_BYTES)
  )
    throw new RangeError("body limit");
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const parts: string[] = [];
  let bytes = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("body timeout")),
      BODY_TIMEOUT_MS,
    );
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MCP_MAX_REQUEST_BYTES) throw new RangeError("body limit");
      parts.push(decoder.decode(value, { stream: true }));
    }
    parts.push(decoder.decode());
    return parts.join("");
  } finally {
    clearTimeout(timer);
    // Hostile streams may never resolve cancellation; never await that promise.
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export const onRequest = async ({ request, env }: { request: Request; env?: unknown }) => {
  const url = new URL(request.url);
  const hosts = [...HOSTS];
  // Only this deployment's configured preview is allowed, not all pages.dev hosts.
  const preview = (env as Record<string, unknown> | undefined)?.CF_PAGES_URL;
  if (typeof preview === "string") {
    try {
      hosts.push(new URL(preview).hostname);
    } catch {
      /* invalid config grants nothing */
    }
  }
  // Fetch-native synthetic requests can omit Host; use their URL authority in
  // that case. An explicit conflicting Host must still be rejected.
  const guardHeaders = new Headers(request.headers);
  if (!hosts.includes(url.hostname))
    return jsonError(403, -32600, "Request host is not allowed.");
  if (!guardHeaders.has("host")) guardHeaders.set("host", url.host);
  const guardRequest = new Request(request.url, { headers: guardHeaders });
  const rejected =
    hostHeaderValidationResponse(guardRequest, hosts) ??
    originValidationResponse(request, [...BROWSER_ORIGINS, ...hosts]);
  if (rejected) return withHeaders(rejected);
  if (url.pathname.replace(/\/+$/, "") !== "/mcp")
    return jsonError(404, -32601, "MCP endpoint is /mcp.");
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: CORS });
  if (
    (request.method === "GET" || request.method === "HEAD") &&
    !(request.headers.get("accept") ?? "").includes("text/event-stream")
  ) {
    const origin = url.origin;
    const document = {
      ok: true,
      protocol:
        "MCP: modern clients declare per-request metadata; legacy Streamable HTTP clients initialize, then tools/list and tools/call. This GET document is not the protocol.",
      transport: "streamable-http",
      server: SERVER_INFO.name,
      server_info: { ...SERVER_INFO, release_train: "pages-http" },
      doctrine:
        "We measure, never certify. Verification is VALID / INVALID / UNCHECKABLE; an unmeasured axis is a first-class answer.",
      install: {
        remote: "Add https://councilof.ai/mcp as a Streamable HTTP MCP server.",
        claude_code: "claude mcp add gspc -- npx -y csoai-gspc-mcp",
        any_client: "npx -y csoai-gspc-mcp",
        no_install_at_all: "curl -s https://councilof.ai/api/gspc",
        python: 'pip install "csoai-gspc[verify]" && csoai-gspc check',
      },
      stdio_alternative:
        "npm csoai-gspc-mcp and the Pages HTTP implementation are released independently. Payment travels as the x_payment ARGUMENT; each door sets the X-PAYMENT header itself. Ask each installed version for its tools/list.",
      paid_tools: {
        names: [...PAID_TOOL_NAMES],
        how: "Call without x_payment for a 402 challenge. A challenge is not settlement, delivery or revenue.",
        doctrine:
          "measurement, not certification; the catalog and verification remain free",
        catalog: `${origin}/api/x402`,
      },
      board: `${origin}/api/gspc`,
      signed_cards: `${origin}/signed/card_index.json`,
      how_to_verify: `${origin}/signed/HOW-TO-VERIFY.md`,
      registry_evidence:
        "evidence/mcp-registry.json in the repo; registry publication is separate from this runtime.",
    };
    return new Response(
      request.method === "HEAD" ? null : JSON.stringify(document),
      {
        headers: {
          ...CORS,
          "content-type": "application/json",
          "cache-control": "public, max-age=300",
        },
      },
    );
  }
  if (request.method !== "POST")
    return new Response(null, {
      status: 405,
      headers: { ...CORS, allow: "POST, GET, HEAD, OPTIONS" },
    });
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    return jsonError(415, -32600, "Use Content-Type: application/json.");

  let body: string;
  try {
    body = await readBody(request);
  } catch (error) {
    return jsonError(
      error instanceof RangeError ? 413 : 400,
      -32600,
      "Request body exceeds the size/time limit or is not valid UTF-8.",
    );
  }
  let call: unknown;
  try {
    call = JSON.parse(body);
  } catch {
    return jsonError(400, -32700, "Invalid JSON.");
  }
  const id =
    object(call) &&
    (typeof call.id === "string" ||
      (typeof call.id === "number" && Number.isSafeInteger(call.id)))
      ? call.id
      : undefined;
  if (
    !object(call) ||
    call.jsonrpc !== "2.0" ||
    typeof call.method !== "string" ||
    ("id" in call && id === undefined) ||
    (call.params !== undefined && !object(call.params))
  ) {
    return jsonError(
      400,
      -32600,
      "Expected one JSON-RPC request with object params and a string or integer id.",
      id,
    );
  }
  // Never execute payment-bearing work as an id-less notification.
  if (id === undefined && !call.method.startsWith("notifications/"))
    return jsonError(400, -32600, "A request id is required for this method.");
  const params = object(call.params) ? call.params : {};
  // Published SDK 2.0.0 accepts a modern body without its version header.
  // Keep the normative HTTP requirement at our mount until upstream closes it.
  if (
    object(params._meta) &&
    "io.modelcontextprotocol/protocolVersion" in params._meta &&
    !request.headers.has("MCP-Protocol-Version")
  ) {
    return jsonError(
      400,
      -32020,
      "MCP-Protocol-Version header is required for modern requests.",
      id,
    );
  }
  const traceId =
    call.method === "tools/call" && typeof params.name === "string"
      ? toolSpan((env ?? {}) as Record<string, unknown>, params.name)
      : null;
  try {
    const boundedRequest = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body,
      signal: request.signal,
    });
    return withTraceHeader(
      withHeaders(await mcp.fetch(boundedRequest)),
      traceId,
    );
  } catch {
    return jsonError(
      500,
      -32603,
      "MCP request failed. Delivery and settlement are unconfirmed; inspect receipts before retrying paid work.",
      id,
    );
  }
};
