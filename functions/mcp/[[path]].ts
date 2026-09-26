/** Public MCP: request-scoped SDK server; the free tools in gspc-tools.json plus the x402 tools in paid-tools.json. */
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
import { MEASUREMENT_TOOL_NAMES, measurementToolResult } from "./_measurement";

// HTTP runtime and registry descriptor share an identity; npm releases separately.
export const MCP_HTTP_SERVER_VERSION = "1.4.2";
const SERVER_INFO = {
  name: "csoai-gspc-mcp",
  version: MCP_HTTP_SERVER_VERSION,
};
// Counts are derived from the definition files that tools/list serves; a typed "Eight" drifted
// from nine free tools once mcp_trust was added (2026-09-15).
const FREE_TOOL_COUNT = GSPC_TOOLS.tools.length;
const PAID_TOOL_COUNT = PAID_TOOL_DEFS.length;
const INSTRUCTIONS =
  `GSPC MCP. ${FREE_TOOL_COUNT} free read-only tools and ${PAID_TOOL_COUNT} paid x402 tools. Call tools/list for the current definitions. Call a paid tool without x_payment for its payment challenge; payment comes from the caller's wallet. Payment travels as the x_payment ARGUMENT; each implementation sets the X-PAYMENT header itself. A 402 challenge is not settlement, delivery or revenue. Measurement, not certification; verification stays free. witness_hash is quarantined and not advertised. MCP Registry server.version identifies this Pages HTTP implementation; npm is a separately versioned implementation.`;
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
// The measurement-capsule readers (measurement_index, verify_capsule, server_evidence) are ordinary
// free tools in gspc-tools.json since 2026-09-26, when /measurement-capsules/ was published; the
// MEASUREMENT_CAPSULE_TOOLS env gate that held them back is gone. One list, one fleet (the lock).
const DEFINITIONS = [...GSPC_TOOLS.tools, ...PAID_TOOL_DEFS] as Tool[];
// The SDK's no-eval adapter retains the canonical JSON Schema. No parallel catalog.
const validator = new CfWorkerJsonSchemaValidator();
type JsonSchema = Parameters<typeof fromJsonSchema>[0];
const compile = (defs: Tool[]) => defs.map((definition) => ({
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

function buildMcp(definitions: Tool[]) {
  const TOOLS = compile(definitions);
  return createMcpHandler(
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
          ...(definition.title ? { title: definition.title } : {}),
          description: definition.description,
          inputSchema,
          ...(outputSchema ? { outputSchema } : {}),
          // readOnlyHint for the free readers; the paid tools spend the caller's funds when called
          // with x_payment, so they are neither read-only nor idempotent (paid-tools.json).
          ...(definition.annotations ? { annotations: definition.annotations } : {}),
        },
        (args) =>
          PAID_TOOL_NAMES.has(definition.name)
            ? paidToolResult(definition.name, args, origin)
            : MEASUREMENT_TOOL_NAMES.has(definition.name)
              ? measurementToolResult(definition.name, args, origin)
              : sharedToolResult(definition.name, args, origin),
      );
    }
    // Historical unlisted alias; it is not in tools/list and does not inflate the canonical count.
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
      tools: definitions,
    }));
    return server;
  },
  { legacy: "stateless", maxSubscriptions: 0 },
  );
}
const mcp = buildMcp(DEFINITIONS);

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

/**
 * True when a GET is a browser page load: `text/html` is accepted and preferred over JSON.
 *
 * WHY. /mcp/ is a sitemap URL (App.tsx declares a /mcp route) and the address people are told
 * to paste into a client, so people open it in a browser. It used to answer every GET with the
 * discovery JSON: no title, no lang, no heading (ux-gauntlet 2026-09-26). Agents DO read that JSON
 * (llms.txt tells them to quote paid_tools.names from it), so it stays exactly where it is for any
 * request that does not ask for HTML (curl's default, fetch's default, SDK clients). Only a
 * browser navigation, which sends Accept: text/html first, gets the same document as a page.
 */
export function prefersHtml(accept: string | null): boolean {
  const a = (accept ?? "").toLowerCase();
  const html = a.indexOf("text/html");
  if (html < 0) return false;
  const json = a.indexOf("application/json");
  return json < 0 || html < json;
}

const escHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** The discovery document as a page. Renders the SAME object the JSON answer carries. */
export function discoveryHtml(document: {
  protocol: string;
  doctrine: string;
  server_info: { name: string; version: string };
  install: Record<string, string>;
  paid_tools: { names: string[]; how: string; catalog: string };
  board: string;
  signed_cards: string;
  how_to_verify: string;
}): string {
  const free = (GSPC_TOOLS.tools as Array<{ name: string; title?: string }>)
    .map((t) => `<li><code>${escHtml(t.name)}</code>${t.title ? ` — ${escHtml(t.title)}` : ""}</li>`)
    .join("");
  const paid = document.paid_tools.names.map((n) => `<li><code>${escHtml(n)}</code></li>`).join("");
  const install = Object.entries(document.install)
    .map(([k, v]) => `<dt>${escHtml(k.replace(/_/g, " "))}</dt><dd><code>${escHtml(v)}</code></dd>`)
    .join("");
  const desc = `The Council of AI MCP server: ${FREE_TOOL_COUNT} free read-only tools and ${PAID_TOOL_COUNT} x402 tools over Streamable HTTP. Measurement, not certification.`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MCP server endpoint — Council of AI</title>
<meta name="description" content="${escHtml(desc)}">
<link rel="canonical" href="https://councilof.ai/mcp/">
<link rel="alternate" type="application/json" href="https://councilof.ai/mcp">
<meta property="og:type" content="website">
<meta property="og:url" content="https://councilof.ai/mcp/">
<meta property="og:title" content="MCP server endpoint — Council of AI">
<meta property="og:description" content="${escHtml(desc)}">
<meta property="og:image" content="https://councilof.ai/og-image.png">
<style>
:root{color-scheme:light dark;--fg:#111;--bg:#fff;--mut:#555;--line:#e5e5e5;--pre:#f6f6f6;--a:#047857}
@media(prefers-color-scheme:dark){:root{--fg:#e9e9e9;--bg:#0f1115;--mut:#a2a2a2;--line:#262a31;--pre:#171a20;--a:#6ee7b7}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:52rem;margin:0 auto;padding:2.5rem 1.25rem 4rem}
h1{font-size:1.9rem;line-height:1.2;margin:0 0 .4rem}h2{margin:2.2rem 0 .6rem;font-size:1.2rem;border-bottom:1px solid var(--line);padding-bottom:.35rem}
a{color:var(--a);text-decoration:underline;text-underline-offset:2px}
.lede{color:var(--mut)}p,li,dd{overflow-wrap:anywhere}
dl{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:.35rem 1rem}dt{color:var(--mut)}dd{margin:0;min-width:0}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.9em;background:var(--pre);border-radius:4px;padding:0 .2em}
footer{margin-top:3rem;color:var(--mut);font-size:.9rem;border-top:1px solid var(--line);padding-top:1rem}
</style></head><body><main>
<h1>MCP server endpoint</h1>
<p class="lede">This address is a Model Context Protocol server (<code>${escHtml(document.server_info.name)}</code> ${escHtml(document.server_info.version)}, Streamable HTTP). Add <code>https://councilof.ai/mcp</code> to an MCP client; this page is what a browser sees.</p>
<p>${escHtml(document.doctrine)}</p>
<h2>Connect</h2>
<dl>${install}</dl>
<h2>Free tools (${FREE_TOOL_COUNT})</h2>
<ul>${free}</ul>
<h2>x402 tools (${PAID_TOOL_COUNT})</h2>
<p>${escHtml(document.paid_tools.how)} Terms come from each live challenge; the catalog is at <a href="${escHtml(document.paid_tools.catalog)}">${escHtml(document.paid_tools.catalog)}</a>.</p>
<ul>${paid}</ul>
<h2>Check it yourself</h2>
<ul>
<li>Board: <a href="${escHtml(document.board)}">${escHtml(document.board)}</a></li>
<li>Signed cards: <a href="${escHtml(document.signed_cards)}">${escHtml(document.signed_cards)}</a></li>
<li>How to verify: <a href="${escHtml(document.how_to_verify)}">${escHtml(document.how_to_verify)}</a></li>
<li>Directory of MCP servers we measure: <a href="/mcps/">/mcps/</a></li>
</ul>
<footer><p>${escHtml(document.protocol)}</p><p>Machine-readable: any GET to this address that does not ask for <code>text/html</code> (for example <code>curl -s https://councilof.ai/mcp</code>) returns this page's content as JSON.</p></footer>
</main></body></html>`;
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
    const html = prefersHtml(request.headers.get("accept"));
    return new Response(
      request.method === "HEAD" ? null : html ? discoveryHtml(document) : JSON.stringify(document),
      {
        headers: {
          ...CORS,
          "content-type": html ? "text/html; charset=utf-8" : "application/json",
          "cache-control": "public, max-age=300",
          vary: "Accept",
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
      withHeaders(
        await mcp.fetch(
          boundedRequest,
        ),
      ),
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
