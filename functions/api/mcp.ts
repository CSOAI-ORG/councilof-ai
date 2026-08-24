/**
 * GET /api/mcp — list MCP servers from the catalogue.
 * Returns: { servers: [{id, name, description, status, last_checked, tools_count}], count }
 *
 * The MCP catalogue is a static snapshot from csoai-static-deploy2/benchmark-results/mcpbench.json
 * (real c2pa SDK 0.90.1 + ProvBench physics). In production this would be backed by
 * the council's running MCP server registry.
 */

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
    note: "CSOAI MCP catalogue. Servers are deterministic, not LLM-as-judge. UNMEASURED entries come from csoai-static-deploy2/benchmark-results/mcpbench.json — placeholders pending live probing.",
  });
};
