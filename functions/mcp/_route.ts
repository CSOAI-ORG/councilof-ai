/**
 * MCP adapter for the free tool `route` (GSPC Route, decide-only). The core is
 * functions/_lib/route/route.ts, shared with the A2A skill `route` and services/gspc-router.
 * It reads the live board through the same fetch as get_axis, and the signed effect-binding census index
 * (/interop/effect-binding-census-index.json) for the floor; it executes nothing and charges nothing.
 */
import { fetchOriginJson } from "./_board";
import { route, routeSummary, type RouteResult } from "../_lib/route/route";
import { CENSUS_PATH } from "../_lib/route/census";
import type { McpToolResult } from "./_handlers";

export const ROUTE_TOOL_NAMES = new Set(["route"]);

export async function routeResult(args: Record<string, unknown>, origin: string): Promise<RouteResult> {
  return route(args, {
    fetchBoard: () => fetchOriginJson(origin, "/api/gspc"),
    // The signed effect-binding census feeds the floor's DIVERGENT rule (functions/_lib/route/census.ts).
    fetchCensus: () => fetchOriginJson(origin, CENSUS_PATH),
  });
}

export async function routeToolResult(args: Record<string, unknown>, origin: string): Promise<McpToolResult> {
  const r = await routeResult(args, origin);
  return {
    content: [{ type: "text", text: `${routeSummary(r)}\n\n${JSON.stringify(r, null, 2)}` }],
    structuredContent: r,
    isError: r.state === "BAD_ARGUMENTS" || r.state === "NOT_ENABLED",
  };
}
