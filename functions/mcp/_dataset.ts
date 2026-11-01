/**
 * MCP handler for quote_dataset_version (data/v1). Its definition lives in ./gspc-tools.json with every
 * other free tool; logic lives in functions/_lib/dataV1.ts. Same pattern as ./_measurement.ts.
 */
import GSPC_TOOLS from "./gspc-tools.json";
import { quoteDatasetVersion } from "../_lib/dataV1";
import type { McpToolResult } from "./_handlers";

export const DATASET_TOOL_NAMES = new Set(["quote_dataset_version"]);
for (const name of DATASET_TOOL_NAMES)
  if (!GSPC_TOOLS.tools.some((t) => t.name === name)) throw new Error(`gspc-tools.json has no definition for ${name}`);

export async function datasetToolResult(args: Record<string, unknown>, origin: string): Promise<McpToolResult> {
  const p = await quoteDatasetVersion(origin, args.version);
  const head = p.state === "PUBLISHED"
    ? `PUBLISHED — data/v1 ${p.version}${p.is_latest ? " (latest)" : ""}: ${p.card_count} cards, manifest sha256 ${String((p.manifest_sha256 as Record<string, unknown>).recomputed).slice(0, 16)}…, licence ${p.license ?? "?"}.`
    : `${p.state} — ${p.reason ?? ""}`;
  return {
    content: [{ type: "text", text: `${head}\n\n${JSON.stringify(p, null, 2)}` }],
    structuredContent: p,
    isError: false,
  };
}
