// Browser bridge to the public JSON-RPC MCP door. /api/mcp is a read-only
// registry artefact; POST /mcp is the callable endpoint.

export type JsonSchema = {
  type?:
    "object" | "array" | "string" | "number" | "integer" | "boolean" | "null";
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: unknown[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  default?: unknown;
};

export type SovTool = {
  name: string;
  description: string;
  inputSchema?: JsonSchema;
  csoai?: {
    paid?: boolean;
    rail?: string;
    route?: string;
    sku?: string;
    free_preview?: string;
    free_status?: string;
  };
};

export type ToolResult = {
  ok: boolean;
  state: "runtime_observed" | "unreachable" | "unchecked";
  text: string;
  raw?: unknown;
  structuredContent?: unknown;
};

const env = (
  import.meta as ImportMeta & {
    env?: Record<string, string | boolean | undefined>;
  }
).env;

/**
 * Production is same-origin. A local Vite preview has no Pages Functions
 * runtime, so it uses the public endpoint unless VITE_MCP_ENDPOINT overrides it.
 */
export const MCP_RPC_ENDPOINT =
  (typeof env?.VITE_MCP_ENDPOINT === "string" && env.VITE_MCP_ENDPOINT) ||
  (env?.DEV ? "https://councilof.ai/mcp" : "/mcp");

async function rpc(
  method: string,
  params?: unknown,
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(MCP_RPC_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`POST /mcp answered HTTP ${response.status}`);
    const body = (await response.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("POST /mcp returned an unreadable JSON-RPC body");
    }
    return body as Record<string, unknown>;
  } finally {
    globalThis.clearTimeout(timer);
  }
}

// A tools/list reply proves catalogue discovery only. Each advertised tool must
// still be called before the UI may describe its behaviour as runtime-observed.
export type ToolListing =
  { state: "ok"; tools: SovTool[] } | { state: "unreachable"; reason: string };

export async function listTools(): Promise<ToolListing> {
  try {
    const d = await rpc("tools/list");
    const error = d.error as { message?: unknown } | undefined;
    if (error) {
      return {
        state: "unreachable",
        reason: String(error.message || "the server returned a JSON-RPC error"),
      };
    }
    const result = d.result as { tools?: unknown } | undefined;
    const tools = result?.tools;
    if (!Array.isArray(tools))
      return {
        state: "unreachable",
        reason: "the reply carried no tools list",
      };
    return { state: "ok", tools: tools as SovTool[] };
  } catch (e) {
    return {
      state: "unreachable",
      reason: e instanceof Error ? e.message : "the request failed",
    };
  }
}

// Run one advertised tool. A completed tools/call is RUNTIME_OBSERVED, not
// automatically MEASURED, REPRODUCED or SIGNED; those states belong to the
// returned artefact only when its own evidence supports them.
export async function callTool(
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  try {
    const d = await rpc("tools/call", { name, arguments: args });
    const error = d.error as { message?: unknown } | undefined;
    if (error) {
      return {
        ok: false,
        state: "unchecked",
        text: String(error.message || "The server returned a JSON-RPC error."),
        raw: d,
      };
    }

    const result = (d.result || {}) as {
      content?: unknown;
      structuredContent?: unknown;
      isError?: boolean;
    };
    const content = Array.isArray(result.content) ? result.content : [];
    const text =
      content
        .map((item) =>
          item && typeof item === "object" && "text" in item
            ? String((item as { text?: unknown }).text || "")
            : "",
        )
        .filter(Boolean)
        .join("\n") || JSON.stringify(result, null, 2);

    if (result.isError === true) {
      return {
        ok: false,
        state: "unchecked",
        text,
        raw: d,
        structuredContent: result.structuredContent,
      };
    }
    return {
      ok: true,
      state: "runtime_observed",
      text,
      raw: d,
      structuredContent: result.structuredContent,
    };
  } catch (e) {
    return {
      ok: false,
      state: "unreachable",
      text: e instanceof Error ? e.message : "POST /mcp could not be reached.",
    };
  }
}

// Friendly names for the twelve tools currently advertised by tools/list.
export const TOOL_META: Record<string, { glyph: string; label: string }> = {
  board_totals: { glyph: "▦", label: "Board totals" },
  get_axis: { glyph: "◎", label: "Read one axis" },
  verify_card: { glyph: "✓", label: "Verify signed card" },
  list_cards: { glyph: "≡", label: "List signed cards" },
  get_root: { glyph: "◇", label: "Read public root" },
  get_card: { glyph: "□", label: "Read root card" },
  verify_inclusion: { glyph: "⌁", label: "Verify inclusion" },
  commission_card: { glyph: "+", label: "Commission card" },
  art50_marking_evidence: { glyph: "A", label: "Article 50 evidence" },
  rwa_evidence: { glyph: "R", label: "RWA evidence" },
  witness_hash: { glyph: "#", label: "Witness hash" },
  receipts_batch: { glyph: "B", label: "Receipts batch" },
};
