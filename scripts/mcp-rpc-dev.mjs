/**
 * JSON-RPC slice for local dev-honesty-api POST /api/mcp.
 * Mirrors functions/api/mcp-rpc.ts — indices + RWA tools call local fixtures only.
 */

export const MEASURED_TOOLS = [
  {
    name: "gspc_board",
    description: "Fetch live GSPC board. Not available on dev-honesty-api — use production /api/gspc.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "indices_catalog",
    description: "Labour & AI-economy indices — UNMEASURED, measured_score null.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string", description: "ai-economy | human-labour | humanoid-labour" } },
    },
  },
  {
    name: "rwa_attestation_catalog",
    description: "RWA attestation targets — TESTNET UNMEASURED, measured_score null.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string", description: "Optional target slug" } },
    },
  },
];

const DEV_LOCAL_TOOLS = new Set(["indices_catalog", "rwa_attestation_catalog"]);

export function jsonRpcResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}

export function jsonRpcError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

export function toolPath(name, args = {}) {
  if (name === "indices_catalog") {
    return args.slug ? `/api/indices/${encodeURIComponent(String(args.slug))}` : "/api/indices";
  }
  if (name === "rwa_attestation_catalog") {
    return args.slug
      ? `/api/rwa-attestation/${encodeURIComponent(String(args.slug))}`
      : "/api/rwa-attestation";
  }
  return null;
}

export function isDevLocalTool(name) {
  return DEV_LOCAL_TOOLS.has(name);
}
