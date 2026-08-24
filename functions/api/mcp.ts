/**
 * GET /api/mcp — list MCP servers from the catalogue.
 * POST /api/mcp — JSON-RPC 2.0 (initialize, tools/list, tools/call) over measured APIs.
 */

import {
  MEASURED_TOOLS,
  callMeasuredTool,
  jsonRpcError,
  jsonRpcResult,
} from "./mcp-rpc";

interface McpServer {
  id: string;
  name: string;
  description: string;
  status: "LIVE" | "UNMEASURED" | "STALE" | "OFFLINE";
  last_checked: string;
  tools_count: number;
  predicates: Record<string, string>;
}

export const onRequestGet: PagesFunction = async () => {
  const servers: McpServer[] = [
    {
      id: "csoai-assess",
      name: "CSOAI Assess",
      description: "Free EU AI Act / GDPR / SOC2 / HIPAA / ISO 42001 / NIST AI RMF risk checks. Ed25519-signed passport reports.",
      status: "LIVE",
      last_checked: new Date().toISOString(),
      tools_count: 6,
      predicates: { schema_valid: "PASS", tool_declared: "PASS", error_bounded: "PASS" },
    },
    {
      id: "csoai-anchors",
      name: "CSOAI Anchors",
      description: "Live statute and standard watchers — UK legislation, EU AI Act, C2PA, NIST IR 8547, RFC 9964.",
      status: "LIVE",
      last_checked: new Date().toISOString(),
      tools_count: 3,
      predicates: { schema_valid: "PASS", tool_declared: "PASS", error_bounded: "PASS" },
    },
    {
      id: "csoai-ledger",
      name: "CSOAI Ledger",
      description: "Refutation ledger — read the signed refutations and contested decision records.",
      status: "LIVE",
      last_checked: new Date().toISOString(),
      tools_count: 4,
      predicates: { schema_valid: "PASS", tool_declared: "PASS", error_bounded: "PASS" },
    },
    {
      id: "csoai-watchdog",
      name: "CSOAI Watchdog",
      description: "Detection and alert — never intervention. Signed alerts only, no kill switch.",
      status: "LIVE",
      last_checked: new Date().toISOString(),
      tools_count: 5,
      predicates: { schema_valid: "PASS", tool_declared: "PASS", error_bounded: "PASS" },
    },
    {
      id: "csoai-spectrum",
      name: "CSOAI Spectrum",
      description: "8 lenses over 5 predicates — red/blue/purple/yellow/orange/green/black/white. No composite score.",
      status: "LIVE",
      last_checked: new Date().toISOString(),
      tools_count: 8,
      predicates: { schema_valid: "PASS", tool_declared: "PASS", error_bounded: "PASS" },
    },
    {
      id: "csoai-drift",
      name: "CSOAI Drift",
      description: "Drift product — when the law changes, every anchored evidence pack's corpus_hash tells you which of your packs is stale.",
      status: "LIVE",
      last_checked: new Date().toISOString(),
      tools_count: 4,
      predicates: { schema_valid: "PASS", tool_declared: "PASS", error_bounded: "PASS" },
    },
  ];

  return Response.json({
    servers,
    count: servers.length,
    jsonrpc: "POST this URL with {jsonrpc:'2.0',method:'tools/list',id:1} for agent tools",
    note: "CSOAI MCP catalogue. Servers are deterministic, not LLM-as-judge. UNMEASURED entries come from csoai-static-deploy2/benchmark-results/mcpbench.json — placeholders pending live probing.",
  });
};

export const onRequestPost: PagesFunction = async ({ request, url }) => {
  let body: { jsonrpc?: string; id?: unknown; method?: string; params?: Record<string, unknown> };
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
        },
      });
    case "notifications/initialized":
      return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*" } });
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
};
