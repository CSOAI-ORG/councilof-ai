/// <reference types="@cloudflare/workers-types" />
// MCP Registry domain verification file.
// Hosting the Ed25519 public key here lets the official MCP Registry
// (registry.modelcontextprotocol.io) verify ownership of councilof.ai
// via HTTP authentication, enabling mcp-publisher to publish CSOAI servers
// under io.github.CSOAI-ORG/* namespace.

const PUBKEY = "AVkgKTDwpzB8d2/De+7w3RHVkgIyc/jh+GIGjBBCSZA=";

export const onRequestGet: PagesFunction = async () => {
  const body = `v=MCPv1; k=ed25519; p=${PUBKEY}\n`;
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
