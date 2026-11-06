/**
 * route.js — GSPC Route adapters. The buyer consumes measurement to decide
 * what to buy; spending funds measurement. Both sides, one roof.
 */
export const allowAllRoute = {
  async decide() { return { decision: 'BUY', basis: 'policy-only (no route adapter configured)' }; },
};

/** Adapt an MCP client call (e.g. our own `route` tool) into a decision. */
export function gspcRouteAdapter(mcpCall, { qualityAxis = 'governance' } = {}) {
  return {
    async decide({ url, subject }) {
      try {
        const r = await mcpCall('route', {
          task: `buy measurement for subject ${subject} at ${url}`,
          objective: { quality_axis: qualityAxis },
        });
        const chosen = r?.chosen || r?.candidate;
        return chosen
          ? { decision: 'BUY', basis: `gspc.route → ${chosen} (${String(r?.basis || '').slice(0, 80)})` }
          : { decision: 'SKIP', basis: `gspc.route → ${String(r?.answer || 'UNTESTED').slice(0, 80)}` };
      } catch (e) {
        return { decision: 'SKIP', basis: `gspc.route error: ${e.message}` };
      }
    },
  };
}
