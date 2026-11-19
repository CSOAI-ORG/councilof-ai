/**
 * mcp.meok.ai answers at its bare origin as the MCP door, not as a copy of the councilof.ai homepage.
 *
 * mcp.meok.ai is a custom domain on this Pages project (CNAME restored 16 Nov 2026; its HOSTS entry
 * in functions/mcp/[[path]].ts landed in #4368). Only /mcp and /mcp/free reached the MCP function,
 * so the root answered GET with the councilof.ai homepage and POST with 405. An MCP client given the
 * bare origin, `https://mcp.meok.ai`, failed at `initialize`.
 *
 * On that one host the root path is served as the full door, /mcp: POST is JSON-RPC, OPTIONS is the
 * CORS preflight, and GET/HEAD return the door's discovery document (its page for a browser). The
 * query string is kept. It is a rewrite, not a redirect, so a client that does not replay a POST
 * across a redirect works too. Every other host and every other path is untouched: councilof.ai/ is
 * still the homepage, and mcp.meok.ai/mcp, /mcp/free and their server cards answer as before.
 */
export const MCP_DOOR_HOST = "mcp.meok.ai";

/** The request to hand the /mcp door, or null when this request is not for mcp.meok.ai's root. */
export function mcpDoorRootRequest(request: Request): Request | null {
  const url = new URL(request.url);
  if (url.hostname !== MCP_DOOR_HOST || url.pathname !== "/") return null;
  url.pathname = "/mcp";
  return new Request(url.toString(), request);
}
