/**
 * MCP Server Card (SEP-2127, DRAFT — unreleased, in no published spec version) for each door, served at the
 * location the proposal reserves: `<streamable-http-url>/server-card`, i.e. /mcp/server-card and
 * /mcp/free/server-card, as `application/mcp-server-card+json`.
 *
 * Shape: the ServerCard interface of modelcontextprotocol/experimental-ext-server-card (schema.ts, snapshot
 * 526201bb, the one SEP-2127 cites): $schema, name (reverse-DNS), version, description (<= 100 chars),
 * title, websiteUrl, icons, remotes[] {type, url, supportedProtocolVersions}, _meta. The vendored JSON
 * Schema is scripts/harness-x/schemas/mcp-server-card-526201bb.schema.json; server-card-sep2127.test.ts
 * validates both cards against it.
 *
 * ONE SOURCE. Everything here is computed at request time from the objects the doors themselves serve:
 * the version is MCP_HTTP_SERVER_VERSION (what initialize answers), and the advisory tool snapshot in
 * _meta is the name list of the very definitions array tools/list returns for that door. SEP-2127 keeps
 * primitives OUT of the card on purpose (tools can vary at runtime), so the tool names live only under
 * our namespaced _meta, labelled advisory; a client must still call tools/list.
 *
 * The older, registry-shaped documents stay where they are: /.well-known/mcp/server-card.json (extended
 * card) and /.well-known/mcp/server.json. Nothing here replaces them.
 */

export const SERVER_CARD_MEDIA_TYPE = "application/mcp-server-card+json";
export const SERVER_CARD_SCHEMA = "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json";
export const SERVER_CARD_SPEC_STATUS = "draft SEP-2127, unreleased";
/**
 * Protocol revisions the doors answer, read live on 2026-09-30: initialize echoes each of the first four,
 * and server/discover (modern, per-request metadata) reports 2026-07-28. server-card-sep2127.test.ts
 * re-proves every entry against the handler, so this list cannot claim a revision the door refuses.
 */
export const SUPPORTED_PROTOCOL_VERSIONS = ["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25", "2026-07-28"];

/** The one rule both the card and check.mjs use to fingerprint a tool list. */
export const NAMES_SHA256_RULE = 'sha256 of the tool names from tools/list, sorted, joined by "\\n" (UTF-8)';

async function namesSha256(names: string[]): Promise<string> {
  const bytes = new TextEncoder().encode([...names].sort().join("\n"));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type Door = "full" | "free";

/** Which card a path names, or null. Trailing slashes are ignored (Pages may canonicalise them). */
export function serverCardDoor(pathname: string): Door | null {
  const p = pathname.replace(/\/+$/, "");
  return p === "/mcp/server-card" ? "full" : p === "/mcp/free/server-card" ? "free" : null;
}

export async function buildServerCard(
  door: Door,
  origin: string,
  served: { version: string; toolNames: string[]; toolCounts: string },
): Promise<Record<string, unknown>> {
  const endpoint = door === "free" ? `${origin}/mcp/free` : `${origin}/mcp`;
  return {
    $schema: SERVER_CARD_SCHEMA,
    name: door === "free" ? "ai.councilof/gspc-free" : "ai.councilof/gspc",
    version: served.version,
    title: door === "free" ? "GSPC (free tools)" : "GSPC",
    description:
      door === "free"
        ? "GSPC read-only tools: live measurement board, signed cards, free verification. No sign-in."
        : "GSPC evidence over MCP: live board, signed measurement cards, free verify. Measurement only.",
    websiteUrl: `${origin}/connect/`,
    icons: [{ src: `${origin}/csoai-icon.svg`, mimeType: "image/svg+xml", sizes: ["any"] }],
    remotes: [{ type: "streamable-http", url: endpoint, supportedProtocolVersions: SUPPORTED_PROTOCOL_VERSIONS }],
    _meta: {
      "ai.councilof/server-card": {
        spec_status: SERVER_CARD_SPEC_STATUS,
        spec: "https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127",
        schema_snapshot: "modelcontextprotocol/experimental-ext-server-card@526201bb schema.ts",
        door: door === "free" ? "free: read-only tools only; no payment can happen on this door" : "full: the free tools plus x402-metered evidence tools",
        authentication: "none — initialize and tools/list need no Authorization header",
        doctrine: "Measurement, not certification. Verification stays free.",
        other_cards: {
          [door === "free" ? "full_door" : "free_door"]: `${origin}${door === "free" ? "/mcp/server-card" : "/mcp/free/server-card"}`,
          extended_card: `${origin}/.well-known/mcp/server-card.json`,
          registry_shaped: `${origin}/.well-known/mcp/server.json`,
          catalog: `${origin}/.well-known/ai-catalog.json`,
        },
        tools_snapshot: {
          advisory:
            "Not part of the SEP-2127 card, which deliberately excludes primitives. Computed at request time from the same definitions this door's tools/list returns; a client must still call tools/list.",
          count: served.toolNames.length,
          names: served.toolNames,
          names_sha256: await namesSha256(served.toolNames),
          names_sha256_rule: NAMES_SHA256_RULE,
          tool_counts: served.toolCounts,
        },
      },
    },
  };
}
