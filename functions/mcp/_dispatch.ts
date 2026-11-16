/**
 * The GSPC tool fleet's one registry and one dispatch, shared by every door that runs a tool.
 *
 *   POST /mcp        every definition; a paid tool goes to the x402 wrapper (./_paid.ts)
 *   POST /mcp/free   the free definitions only; a paid name never reaches the wrapper
 *   POST /api/a2a    the per-tool skills: each tool as published on its own card at
 *                    /.well-known/agents/<tool>.json (functions/api/a2a.ts)
 *
 * WHY THIS FILE EXISTS (16 Nov 2026). Every per-tool A2A card names JSONRPC
 * https://councilof.ai/api/a2a as its interface, and every card but evidence_bundle's gives
 * SendMessage {"skill":"<tool>","input":{}} as its first example. The A2A router answered every one of them with
 * "unknown skill": cards naming a door that refused them, the paid ones included. The dispatch
 * lived inside functions/mcp/[[path]].ts, where the A2A router could reach it only through a
 * second copy. Here it is one function that both doors call, so they cannot disagree about which
 * handler answers a tool, which arguments it accepts, or how it is paid for.
 *
 * PAYMENT IS NOT RE-IMPLEMENTED HERE. A paid tool reaches paidToolResult (./_paid.ts), which
 * forwards the caller's x_payment ARGUMENT as X-PAYMENT to the tool's metered route on the same
 * origin. Settlement is that route's job (functions/api/_x402.ts: facilitator verify, then settle,
 * fail closed). With no x_payment the route answers 402 and nothing is charged. The free reads
 * (GET /api/gspc, GET /api/corrections, signature verification) sit behind nothing in this file.
 */
import { fromJsonSchema, type Tool } from "@modelcontextprotocol/server";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/server/validators/cf-worker";
import GSPC_TOOLS from "./gspc-tools.json";
import { sharedToolResult, type McpToolResult } from "./_handlers";
import { PAID_TOOL_DEFS, PAID_TOOL_NAMES, paidToolResult, type PaidCallerContext } from "./_paid";
import { MEASUREMENT_TOOL_NAMES, measurementToolResult } from "./_measurement";
import { EVIDENCE_TOOL_NAMES, evidenceToolResult } from "./_evidence";
import { ROUTE_TOOL_NAMES, routeToolResult } from "./_route";
import { READINESS_TOOL_NAMES, readinessToolResult } from "./_readiness";
import { withCouncilPanel } from "./_panel";

/** Every tool /mcp registers, in tools/list order: the free definitions, then the paid ones. */
export const TOOL_DEFINITIONS: Tool[] = ([...GSPC_TOOLS.tools, ...PAID_TOOL_DEFS] as Tool[]).map(withCouncilPanel);

/** The free door's registry: the same definitions, filtered. Never a second catalog. */
export const FREE_TOOL_DEFINITIONS: Tool[] = TOOL_DEFINITIONS.filter((d) => !PAID_TOOL_NAMES.has(d.name));

/**
 * Run one tool. `door.paid` guards the dispatch as well as the registry: a door that is not paid
 * never reaches the x402 wrapper, even if a paid name were passed to it by mistake.
 */
export function dispatchTool(
  name: string,
  args: Record<string, unknown>,
  origin: string,
  door: { paid: boolean },
  caller?: PaidCallerContext,
): Promise<McpToolResult> {
  return door.paid && PAID_TOOL_NAMES.has(name)
    ? paidToolResult(name, args, origin, caller)
    : MEASUREMENT_TOOL_NAMES.has(name)
      ? measurementToolResult(name, args, origin)
      : EVIDENCE_TOOL_NAMES.has(name)
        ? evidenceToolResult(name, args, origin)
        : ROUTE_TOOL_NAMES.has(name)
          ? routeToolResult(args, origin)
          : READINESS_TOOL_NAMES.has(name)
            ? readinessToolResult(args)
            : sharedToolResult(name, args, origin);
}

// The validator /mcp hands the SDK (no eval, so it runs on Workers), compiled from the same
// definitions, so a door that is not the SDK refuses exactly the arguments the SDK refuses.
const validator = new CfWorkerJsonSchemaValidator();
type JsonSchema = Parameters<typeof fromJsonSchema>[0];
const INPUT_SCHEMAS = new Map(
  TOOL_DEFINITIONS.map((d) => [d.name, fromJsonSchema<Record<string, unknown>>(d.inputSchema as JsonSchema, validator)]),
);

/** null when `args` satisfies the tool's inputSchema; otherwise the validator's own words. */
export async function toolInputError(name: string, args: Record<string, unknown>): Promise<string | null> {
  const schema = INPUT_SCHEMAS.get(name);
  if (!schema) return `unknown tool: ${name}`;
  const result = await schema["~standard"].validate(args);
  if (!result.issues) return null;
  return `Invalid arguments for tool ${name}: ${result.issues.map((issue) => issue.message).join("; ")}`;
}
