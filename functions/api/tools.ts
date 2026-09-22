/**
 * GET /api/tools?q=<query> — the MCP tool catalogue, derived from a PROBED artifact.
 *
 * WHAT CHANGED (2026-08-26, lane A4)
 * This handler used to return `const CATALOGUE_TOTAL = 378` — a hardcoded number whose cited source
 * (csoai-static-deploy2/benchmark-results/mcpbench.json) does not exist anywhere in the estate, so
 * 378 had no traceable derivation at all. Alongside it sat five hand-written "sample" rows
 * (Governance Crosswalk, EU AI Act Compliance, ISO 42001, Agent Content Watermark, SBOM CycloneDX)
 * that are not exposed by any reachable MCP server. Those rows existed to satisfy the
 * `?q=governance` assertion in scripts/claims-e2e.mjs — a test passing against invented data.
 *
 * It now derives everything from evidence/mcp-registry.json (scripts/mcp-probe.mjs).
 *
 * WHAT CHANGED (2026-09-22, K-1 fleet-size lock)
 * The registry had not been re-probed since 2026-08-27. That probe saw a PREVIOUS /mcp
 * implementation (measure · verify · jail-probe · enter-arena) and a four-tool stdio package, so
 * this route said `total: 8` while /tools said 13 and the well-known descriptors said 12 — three
 * counts for one door. The registry is re-probed against the live door, and the fleet is locked
 * by NAME in functions/mcp/tool-fleet.lock.json; functions/mcp/tool-fleet.lock.test.ts fails
 * when this registry, the manifests, the descriptors or the live door disagree with it.
 * `total` stays the (server × tool) ROW count the tests already contract on; the number a reader
 * means by "how many tools" is `distinct_tool_names`, the set of names the probes returned.
 *
 * KNOWN CONSEQUENCE, STATED RATHER THAN PAPERED OVER:
 * `?q=governance` now returns total=0, because no tool on any reachable server matches that string.
 * scripts/claims-e2e.mjs asserts `total > 0` for that query and will therefore fail. That failure is
 * correct: the estate has no governance-named MCP tool. The test's contract should move to
 * `catalogue_total > 0 && total === tools.length`. Do not restore the invented rows to make it green.
 */
import registry from "../../evidence/mcp-registry.json";

interface ProbedTool {
  name: string;
  description: string | null;
  required_args: string[];
}

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get("q") || "").toLowerCase();

  const servers = ((registry as any).servers || []) as any[];
  const counts = (registry as any).counts || {};

  // Only tools that a probe actually returned. Alias endpoints resolve to a server already
  // counted, so including them would double the catalogue.
  const probedServers = servers.filter((s) => s.status === "reachable" && !s.alias_of);

  const all = probedServers.flatMap((s) =>
    ((s.tools || []) as ProbedTool[]).map((t) => ({
      id: t.name,
      name: t.name,
      description: t.description,
      required_args: t.required_args || [],
      server: s.id,
      server_endpoint: s.endpoint,
      status: "probed",
      last_probed: s.last_probed,
    }))
  );

  // The fleet-size number: distinct names across probed servers. Two implementations of the
  // same door (Pages HTTP + the stdio package) each contribute their full list to `all`, so the
  // row count reads 2× the fleet; the set does not. Locked in functions/mcp/tool-fleet.lock.json.
  const distinctTools = [...new Set(all.map((t) => t.name))].sort();

  const tools = q
    ? all.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          t.server.toLowerCase().includes(q)
      )
    : all;

  return new Response(
    JSON.stringify({
      // `total` is the length of the array below — derived, never asserted.
      total: tools.length,
      total_kind: "probed",
      catalogue_total: all.length,
      // Derived, never asserted: the set of tool NAMES the probes returned. `total` and
      // `catalogue_total` are (server × tool) rows and double the fleet when two implementations
      // of one door are both probed. This is the count the K-1 lock is about.
      distinct_tool_names: distinctTools.length,
      distinct_tools: distinctTools,
      fleet_lock: "functions/mcp/tool-fleet.lock.json",
      server_count: probedServers.length,
      query: q || null,
      probe_method: (registry as any).probe_method,
      probe_host: (registry as any).probe_host,
      probe_finished: counts.finished ?? null,
      // The other half of the picture, kept separate on purpose.
      catalogued_not_probed_servers: counts.catalogued_not_probed ?? null,
      tools_catalogued_not_probed: counts.tools_catalogued_not_probed ?? null,
      external_catalogues_not_probed: counts.external_catalogues_not_probed ?? [],
      tools,
      note:
        "Every tool listed here was returned by a live MCP tools/list call recorded in " +
        "evidence/mcp-registry.json. Servers with no published endpoint contribute zero tools and are " +
        "reported separately as catalogued_not_probed_servers — catalogued tools are never added to probed tools.",
    }),
    {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=300" },
    }
  );
};
