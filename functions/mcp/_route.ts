/**
 * MCP adapter for the free tool `route` (GSPC Route, decide-only). The core is
 * functions/_lib/route/route.ts, shared with the A2A skill `route` and services/gspc-router.
 * It reads the live board through the same fetch as get_axis; it executes nothing and charges nothing.
 */
import { fetchOriginJson } from "./_board";
import { route, routeSummary, type RouteResult } from "../_lib/route/route";
import type { McpToolResult } from "./_handlers";

export const ROUTE_TOOL_NAMES = new Set(["route"]);

export async function routeResult(args: Record<string, unknown>, origin: string): Promise<RouteResult> {
  return route(args, { fetchBoard: () => fetchOriginJson(origin, "/api/gspc") });
}

export async function routeToolResult(args: Record<string, unknown>, origin: string): Promise<McpToolResult> {
  const r = await routeResult(args, origin);
  return {
    content: [{ type: "text", text: `${routeSummary(r)}\n\n${JSON.stringify(r, null, 2)}` }],
    structuredContent: r,
    isError: r.state === "BAD_ARGUMENTS" || r.state === "NOT_ENABLED",
  };
}
