// MCP server JSON-LD — the free read-only MCP door, described as a schema.org WebAPI.
//
// Why: /connect/ documents the door, but until 2026-11-17 no page carried a machine-readable
// node naming it, so an answer engine asked "is there an MCP server for AI measurement records"
// had prose to paraphrase and no entity to cite. This node names the endpoint, the page that
// documents it and the organisation that runs it.
//
// Honesty invariants (as in datasetSchema.ts):
//   • No count. The tool list is read live from tools/list; a typed number here would drift
//     (the doctrine: counts come from the artifact that owns them).
//   • No price and no offer. The door is free and read-only; paid x402 tools live on a
//     different endpoint and are described where their 402 challenge is.
//   • `alternateName` is the server's own serverInfo.name (initialize, 2026-11-17), so the
//     node and the server name the same thing. Its version is deliberately not copied.
import { COUNCIL_ORG } from "./orgNode";

const BASE = "https://councilof.ai";

/** The free read-only MCP endpoint (Streamable HTTP). */
export const MCP_FREE_ENDPOINT = BASE + "/mcp/free";
/** The page that documents how to connect to it. */
export const MCP_CONNECT_PAGE = BASE + "/connect/";

/** The WebAPI node (no @context), for PageSchema's injector or an @graph. */
export function councilMcpServerNode(): Record<string, unknown> {
  return {
    "@type": "WebAPI",
    "@id": `${MCP_FREE_ENDPOINT}#webapi`,
    name: "Council of AI GSPC MCP server (free read-only door)",
    alternateName: "csoai-gspc-mcp",
    description:
      "A Streamable HTTP Model Context Protocol (MCP) server for reading the published GSPC measurement board and one axis, verifying signed measurement cards and capsules, and checking Merkle inclusion. Read-only tools; no sign-in and no key. Every answer carries its state, including UNMEASURED. Measurement, not certification.",
    url: MCP_FREE_ENDPOINT,
    documentation: MCP_CONNECT_PAGE,
    serviceType: "Model Context Protocol server (Streamable HTTP)",
    provider: COUNCIL_ORG,
    termsOfService: BASE + "/terms-of-service/",
  };
}

/** A ready-to-serialise JSON-LD document. */
export function councilMcpServerLd(): Record<string, unknown> {
  return { "@context": "https://schema.org", ...councilMcpServerNode() };
}
