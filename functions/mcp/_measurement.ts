/**
 * MCP handlers for the measurement-capsule readers (definitions: ./measurement-tools.json).
 * Served by /mcp only when env MEASUREMENT_CAPSULE_TOOLS === "on" — see the manifest's note for
 * why the gate exists and what flips it. Logic lives in functions/_lib/measurementCapsule.ts,
 * shared with the A2A skills, so the two doors can never disagree.
 */
import MEASUREMENT_TOOLS from "./measurement-tools.json";
import { measurementIndex, verifyCapsule, serverEvidence } from "../_lib/measurementCapsule";
import type { McpToolResult } from "./_handlers";

export const MEASUREMENT_TOOL_DEFS = MEASUREMENT_TOOLS.tools;
export const MEASUREMENT_TOOL_NAMES = new Set(MEASUREMENT_TOOL_DEFS.map((t) => t.name));
export const MEASUREMENT_ENV_GATE = MEASUREMENT_TOOLS.env_gate;

export function measurementToolsEnabled(env: unknown): boolean {
  return (env as Record<string, unknown> | undefined)?.[MEASUREMENT_ENV_GATE] === "on";
}

function summary(name: string, p: Record<string, unknown>): string {
  const st = String(p.state);
  switch (name) {
    case "measurement_index":
      return st === "PUBLISHED"
        ? `PUBLISHED — index root ${String(p.index_root).slice(0, 16)}… over ${p.n_capsules_total} capsules in ${p.n_batches} batches; index signature ${(p.signature as Record<string, unknown>)?.state}.`
        : `${st} — ${p.reason ?? ""}`;
    case "verify_capsule":
      return st === "INCLUDED"
        ? `INCLUDED — ${String((p.capsule_id as Record<string, unknown>)?.recomputed).slice(0, 16)}… is leaf ${(p.inclusion as Record<string, unknown>)?.leaf_index} of batch ${(p.batch as Record<string, unknown>)?.adapter}.`
        : `${st} — ${p.reason ?? ""}`;
    default:
      return st === "MEASURED"
        ? `MEASURED — ${p.n_capsules} published capsule(s) about ${p.endpoint}. States only.`
        : `${st} — ${p.reason ?? p.note ?? "no published capsule about this endpoint"}`;
  }
}

export async function measurementToolResult(
  name: string,
  args: Record<string, unknown>,
  origin: string,
): Promise<McpToolResult> {
  const payload =
    name === "measurement_index"
      ? await measurementIndex(origin)
      : name === "verify_capsule"
        ? await verifyCapsule(origin, args.capsule_json)
        : await serverEvidence(origin, args.endpoint_url);
  return {
    content: [{ type: "text", text: `${summary(name, payload)}\n\n${JSON.stringify(payload, null, 2)}` }],
    structuredContent: payload,
    isError: false,
  };
}
