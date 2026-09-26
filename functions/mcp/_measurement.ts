/**
 * MCP handlers for the measurement-capsule readers. Their definitions live in ./gspc-tools.json with
 * every other free tool (moved there 2026-09-26 when /measurement-capsules/ was published; until then
 * they sat in a separate manifest behind env MEASUREMENT_CAPSULE_TOOLS). Logic lives in
 * functions/_lib/measurementCapsule.ts, shared with the A2A skills and the /verify-server page, so the
 * doors can never disagree.
 */
import GSPC_TOOLS from "./gspc-tools.json";
import { measurementIndex, verifyCapsule, serverEvidence } from "../_lib/measurementCapsule";
import type { McpToolResult } from "./_handlers";

/** The readers this module answers, by name. Each must be a definition in gspc-tools.json. */
export const MEASUREMENT_TOOL_NAMES = new Set(["measurement_index", "verify_capsule", "server_evidence"]);
for (const name of MEASUREMENT_TOOL_NAMES)
  if (!GSPC_TOOLS.tools.some((t) => t.name === name)) throw new Error(`gspc-tools.json has no definition for ${name}`);

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
