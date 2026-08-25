/**
 * JSON-RPC helpers + measured-tool catalogue for POST /api/mcp.
 * Proxies live board APIs — no LLM-as-judge, no fabricated scores.
 */

export type McpToolDef = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
};

export const MEASURED_TOOLS: McpToolDef[] = [
  {
    name: "gspc_board",
    description:
      "Fetch the live GSPC 14-slot board (13 measured of 14). Per-axis n, leader, Wilson interval. Measurement, not certification.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "east_west_board",
    description:
      "East-West cross-jurisdiction measurement board. Mapping ≠ determination. UNSIGNED until board-attestation key is bound.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "ecosystem_index",
    description: "Ecosystem org index — regulators, enterprises, SMBs. Public cited data only.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Optional accountId filter" } },
    },
  },
  {
    name: "verify_tally",
    description:
      "Self-reported opt-in verification tally (✓/✗ counters only). Not a MEASURED number — privacy contract: no record content.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "benchmark_quality",
    description:
      "Third-party benchmark quality register. Deterministic predicates only; our own instruments excluded in code.",
    inputSchema: {
      type: "object",
      properties: { benchmark: { type: "string", description: "Optional benchmark id filter" } },
    },
  },
  {
    name: "instruments_catalog",
    description: "Published instruments catalogue with links to live measurement surfaces.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "indices_catalog",
    description:
      "Labour & AI-economy indices (ai-economy, human-labour, humanoid-labour). Declared UNMEASURED — measured_score is null. Contextual firewall only; never GSPC cell inputs.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string", description: "Optional: ai-economy | human-labour | humanoid-labour" } },
    },
  },
];

const TOOL_ROUTES: Record<string, (args: Record<string, unknown>) => string> = {
  gspc_board: () => "/api/gspc",
  east_west_board: () => "/api/east-west",
  ecosystem_index: (a) => (a.id ? `/api/ecosystem?id=${encodeURIComponent(String(a.id))}` : "/api/ecosystem"),
  verify_tally: () => "/api/verify-tally",
  benchmark_quality: (a) =>
    a.benchmark ? `/api/benchmark-quality?benchmark=${encodeURIComponent(String(a.benchmark))}` : "/api/benchmark-quality",
  instruments_catalog: () => "/api/instruments",
  indices_catalog: (a) =>
    a.slug ? `/api/indices/${encodeURIComponent(String(a.slug))}` : "/api/indices",
};

export function jsonRpcResult(id: unknown, result: unknown): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
}

export function jsonRpcError(id: unknown, code: number, message: string): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }), {
    status: code === -32600 || code === -32700 ? 400 : 200,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
}

export async function callMeasuredTool(
  name: string,
  args: Record<string, unknown> | undefined,
  origin: string,
): Promise<{ content: { type: string; text: string }[]; isError?: boolean }> {
  const routeFn = TOOL_ROUTES[name];
  if (!routeFn) {
    return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }
  const path = routeFn(args ?? {});
  try {
    const r = await fetch(`${origin}${path}`, { headers: { accept: "application/json" } });
    const text = await r.text();
    if (!r.ok) {
      return {
        content: [{ type: "text", text: `Upstream ${path} returned HTTP ${r.status}: ${text.slice(0, 500)}` }],
        isError: true,
      };
    }
    return { content: [{ type: "text", text }] };
  } catch (e) {
    return {
      content: [{ type: "text", text: `Upstream ${path} unreachable: ${e instanceof Error ? e.message : String(e)}` }],
      isError: true,
    };
  }
}
