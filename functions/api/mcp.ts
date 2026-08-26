/**
 * GET /api/mcp — the MCP registry, served from a PROBED artifact.
 *
 * WHAT CHANGED (2026-08-26, lane A4)
 * This handler used to return a hardcoded array of 6 servers in which every entry set
 *   last_checked: new Date().toISOString()
 * The timestamp was generated when the request was served, so the endpoint told every caller that
 * all six servers had been verified moments earlier while nothing was ever contacted. Two real
 * requests three seconds apart returned 11:43:53.111Z then 11:43:56.233Z — the field simply
 * followed the clock. The six also carried hardcoded status:"LIVE" and predicates:PASS, and cited
 * a provenance file (csoai-static-deploy2/benchmark-results/mcpbench.json) that does not exist.
 *
 * It now serves evidence/mcp-registry.json, produced by scripts/mcp-probe.mjs, which contacts each
 * declared endpoint over JSON-RPC and can only write `last_probed` on a server that answered.
 *
 * THE RULES THIS ENDPOINT KEEPS
 *  1. There is no `new Date()` in this file. Freshness comes from the probe or it is null.
 *  2. `reachable` and `catalogued-not-probed` are reported as separate counts and never summed.
 *     A directory listing is not a fleet.
 *  3. Alias endpoints (the same server behind a second URL) are excluded from the distinct count.
 *  4. Unknown is null. It is never a plausible-looking value.
 *
 * The artifact is committed to git, so this endpoint does not depend on a live pod. Re-run
 * `node scripts/mcp-probe.mjs` to refresh it; `--check` re-validates the honesty contract in CI.
 */
import registry from "../../evidence/mcp-registry.json";

export const onRequestGet: PagesFunction = async () => {
  const servers = (registry as any).servers || [];
  const counts = (registry as any).counts || {};

  return new Response(
    JSON.stringify({
      schema: (registry as any).schema,
      // How the numbers were obtained — stated, never implied.
      probe_method: (registry as any).probe_method,
      probe_host: (registry as any).probe_host,
      probe_started: counts.started ?? null,
      probe_finished: counts.finished ?? null,
      generated_by: (registry as any).generated_by,
      honesty_contract: (registry as any).honesty_contract,

      // Two numbers, always separate.
      reachable: counts.reachable_distinct_servers ?? null,
      reachable_endpoints: counts.reachable_endpoints ?? null,
      unreachable: counts.unreachable_endpoints ?? null,
      catalogued_not_probed: counts.catalogued_not_probed ?? null,
      tools_probed: counts.tools_probed ?? null,
      tools_catalogued_not_probed: counts.tools_catalogued_not_probed ?? null,
      external_catalogues_not_probed: counts.external_catalogues_not_probed ?? [],

      servers,

      note:
        "reachable = a server that answered MCP initialize from probe_host at probe_started. " +
        "catalogued-not-probed = an id with no published endpoint; it has never been contacted and " +
        "its tools_count is null, not the number its catalogue asserted. The two are never added together. " +
        "Source of truth: evidence/mcp-registry.json (committed). Re-run scripts/mcp-probe.mjs to refresh.",
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=300",
      },
    }
  );
};
