/**
 * /mcp — the public MCP endpoint.
 *
 * tools/call name=measure | jail-probe — mill-tool DROPPED. Do not claim a signed
 * measurement card from this door. Use read-only board_totals / get_axis.
 * HTTP /mcp is seven FREE tools (board_totals get_axis verify_card list_cards get_root get_card verify_inclusion)
 * plus four PAID tools (commission_card art50_marking_evidence rwa_evidence receipts_batch —
 * ./paid-tools.json, handled by ./_paid.ts: unpaid → the route's 402 challenge as structuredContent).
 * Payment travels as the `x_payment` ARGUMENT and this door sets the X-PAYMENT header itself, so which
 * tools a package carries is a packaging choice, never a property of the transport. npm csoai-gspc-mcp
 * carried the seven free tools up to 0.1.1 and all twelve from 0.2.0.
 * POST /v1/measure is 404; this handler does not implement it.
 * Dead worker csoai-gspc-mcp.nicholastempleman.workers.dev/mcp is 404; Pages /mcp is the door.
 */

import GSPC_TOOLS from "./gspc-tools.json";
import {
  CORS,
  HOP_BY_HOP,
  UPSTREAM,
  SHARED_TOOL_NAMES,
  handleSharedTool,
  handleVerify,
  rpc,
} from "./_handlers";
import { toolSpan, withTraceHeader } from "./_otel";
import { PAID_TOOL_NAMES, PAID_TOOL_DEFS, handlePaidTool } from "./_paid";

async function proxy(ctx: Parameters<PagesFunction>[0], bodyText: string | null): Promise<Response> {
  const url = new URL(ctx.request.url);
  const subpath = url.pathname.replace(/^\/mcp\/?/, "");
  const target = subpath ? `${UPSTREAM}/${subpath}${url.search}` : `${UPSTREAM}${url.search}`;

  const forwardHeaders = new Headers();
  for (const [k, v] of ctx.request.headers) {
    if (!HOP_BY_HOP.has(k.toLowerCase()) && k.toLowerCase() !== "host") forwardHeaders.set(k, v);
  }

  const init: RequestInit & { duplex?: string } = {
    method: ctx.request.method,
    headers: forwardHeaders,
  };
  if (bodyText !== null) {
    init.body = bodyText;
  } else if (ctx.request.body) {
    init.body = ctx.request.body;
    init.duplex = "half";
  }

  const upstream = await fetch(target, init as RequestInit);

  const responseHeaders = new Headers();
  for (const [k, v] of upstream.headers) {
    if (!HOP_BY_HOP.has(k.toLowerCase())) responseHeaders.set(k, v);
  }
  for (const [k, v] of Object.entries(CORS)) responseHeaders.set(k, v);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const onRequest: PagesFunction = async (ctx) => {
  if (ctx.request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const origin = new URL(ctx.request.url).origin;

  // A plain GET /mcp used to proxy the upstream's 404 — so the very link llms.txt
  // hands to agents answered "not found" unless they already knew to POST. Answer
  // browsers and probes with a discovery document instead. An SSE-capable MCP
  // client asking for an event stream is still proxied untouched.
  {
    const url = new URL(ctx.request.url);
    const isRoot = url.pathname.replace(/\/+$/, "") === "/mcp";
    const wantsSse = (ctx.request.headers.get("accept") ?? "").includes("text/event-stream");
    if ((ctx.request.method === "GET" || ctx.request.method === "HEAD") && isRoot && !wantsSse) {
      return Response.json(
        {
          ok: true,
          protocol: "MCP (JSON-RPC 2.0). POST this URL: initialize -> tools/list -> tools/call.",
          transport: "streamable-http",
          server: "csoai-gspc-mcp",
          doctrine:
            "We measure, never certify. Verdicts are three-state (VALID / INVALID / UNCHECKABLE). An unmeasured axis is a first-class answer. This GET is a discovery document, not the protocol.",
          // The one-command path. It existed only in the npm README, where nobody discovering
          // this door would look, so the shortest real install was invisible at the point of
          // discovery. Stated first, before any prose about transports.
          install: {
            remote: "Add https://councilof.ai/mcp as a streamable-HTTP MCP server — no install at all.",
            claude_code: "claude mcp add gspc -- npx -y csoai-gspc-mcp",
            any_client: "npx -y csoai-gspc-mcp",
            no_install_at_all: "curl -s https://councilof.ai/api/gspc — the board, one GET, no key and no account.",
            python: 'pip install "csoai-gspc[verify]" && csoai-gspc check',
          },
          stdio_alternative:
            "node mcp/gspc-server/index.mjs from https://github.com/CSOAI-ORG/councilof-ai (package csoai-gspc-mcp) — the same tools from the same shared definitions files. Payment travels as the x_payment ARGUMENT and each door sets the X-PAYMENT header itself, so carrying a paid tool is a packaging choice, never a property of the transport. Ask that package which tools its version lists; this door does not track its release schedule.",
          paid_tools: {
            names: [...PAID_TOOL_NAMES],
            how: "tools/call without x_payment returns the route's x402 402 challenge (accepts[], PAYMENT-REQUIRED) as structuredContent; pay from your wallet and call again with x_payment. Amounts live only inside a 402.",
            doctrine: "measurement, not certification — no tool carries or awards a trust label of any kind; the catalogue and every free tool stay free",
            catalog: `${origin}/api/x402`,
          },
          board: `${origin}/api/gspc`,
          signed_cards: `${origin}/signed/card_index.json`,
          how_to_verify: `${origin}/signed/HOW-TO-VERIFY.md`,
          registry_evidence: "evidence/mcp-registry.json in the repo — probed, never asserted",
        },
        { headers: { ...CORS, "cache-control": "public, max-age=300" } },
      );
    }
  }

  // Only POSTed JSON-RPC is inspected; everything else streams through untouched.
  let bodyText: string | null = null;
  let call: { method?: string; id?: unknown; params?: { name?: string; arguments?: Record<string, unknown> } } | null =
    null;

  if (ctx.request.method === "POST") {
    try {
      bodyText = await ctx.request.text();
      const parsed = JSON.parse(bodyText);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) call = parsed;
    } catch {
      call = null; // not JSON — proxy the bytes we already read
    }
  }

  // Optional GenAI span for tool calls (H22). No-op unless CSOAI_OTEL is set; when on, the
  // trace id rides back on x-otel-trace-id and the OTLP span is logged to the Workers tail.
  const otelTid =
    call?.method === "tools/call" && call.params?.name
      ? toolSpan((ctx.env ?? {}) as Record<string, unknown>, String(call.params.name))
      : null;

  try {
    if (call?.method === "tools/call" && call.params?.name === "verify") {
      return withTraceHeader(await handleVerify(call.id, call.params.arguments ?? {}, origin), otelTid);
    }

    if (call?.method === "tools/call" && (call.params?.name === "measure" || call.params?.name === "jail-probe")) {
      return Response.json(
        {
          jsonrpc: "2.0",
          id: call.id ?? null,
          error: {
            code: -32601,
            message:
              "mill-tool `" +
              call.params.name +
              "` dropped. Use read-only board_totals / get_axis / get_root. POST /v1/measure is 404; this door does not mill.",
          },
        },
        { headers: { ...CORS } },
      );
    }

    if (call?.method === "tools/call" && call.params?.name && PAID_TOOL_NAMES.has(call.params.name)) {
      return withTraceHeader(
        await handlePaidTool(call.id, call.params.name, call.params.arguments ?? {}, origin),
        otelTid,
      );
    }

    if (call?.method === "tools/call" && call.params?.name && SHARED_TOOL_NAMES.has(call.params.name)) {
      return withTraceHeader(
        await handleSharedTool(call.id, call.params.name, call.params.arguments ?? {}, origin),
        otelTid,
      );
    }

    if (call?.method === "tools/call" && call.params?.name) {
      return Response.json(
        {
          jsonrpc: "2.0",
          id: call.id ?? null,
          error: {
            code: -32601,
            message: `Tool not found: ${call.params.name}. Use tools/list for the currently available tools.`,
          },
        },
        { headers: { ...CORS } },
      );
    }

    if (call?.method === "initialize") {
      return rpc(call.id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "csoai-gspc-mcp", version: "0.1.0" },
        instructions:
          "GSPC MCP. Seven free read-only tools: board_totals get_axis verify_card list_cards get_root get_card verify_inclusion. Four paid tools over the x402 rail: commission_card art50_marking_evidence rwa_evidence receipts_batch — call without x_payment to receive the 402 challenge as structuredContent, pay from your wallet, call again with x_payment. Measurement, not certification; verification free. The witness_hash SKU is quarantined pre-release and is not advertised. mill-tool measure dropped. Dead worker is 404; this Pages /mcp is the door. Remote URL https://councilof.ai/mcp. The npm stdio package csoai-gspc-mcp reads the same two definitions files; payment is the x_payment argument, so which tools it carries is a packaging choice of its version, not a limit of stdio.",
      });
    }

    if (call?.method === "notifications/initialized") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (call?.method === "tools/list") {
      // Serve the local honest tool list. Dead worker csoai-gspc-mcp.nicholastempleman.workers.dev/mcp is 404; not a door.
      // Free seven first, then the paid four (./paid-tools.json). Same list for every caller — the
      // catalogue is free and no tool carries a trust label.
      return rpc(call.id, { tools: [...(GSPC_TOOLS as { tools: unknown[] }).tools, ...PAID_TOOL_DEFS] });
    }

    return await proxy(ctx, bodyText);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return Response.json(
      { error: "mcp upstream unavailable", detail: msg },
      { status: 502, headers: { ...CORS, "content-type": "application/json" } },
    );
  }
};
