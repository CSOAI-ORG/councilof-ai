/**
 * Bundle entry for the pod service: the SAME TypeScript core the MCP tool `route` runs on the edge
 * (functions/_lib/route). build.sh bundles it to dist/route-core.mjs with esbuild; nothing is re-implemented.
 */
export { route, routeSummary, boardAxis, NOT_ENABLED } from "../../functions/_lib/route/route";
export { buildCandidates } from "../../functions/_lib/route/candidates";
export { callerPolicy, renderCedar, cedarEntity, CEDAR_SCHEMA, FLOOR_CEDAR } from "../../functions/_lib/route/policy";
export { computeEventId } from "../../functions/_lib/route/evidence";
