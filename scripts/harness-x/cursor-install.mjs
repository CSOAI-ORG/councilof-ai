/** Derive the Cursor MCP install deeplink from the resolved free-door row; never accept a hand-written URI.
 *  Format (cursor.com/docs/context/mcp/install-links): cursor://anysphere.cursor-deeplink/mcp/install?name=$NAME&config=$BASE64_ENCODED_CONFIG */
export function cursorInstallAction(client, freeUrl) {
  if (client.installer !== "cursor") return undefined;
  const fail = (reason) => { throw new Error(`Cursor installer: ${reason}`); };
  if (client.id !== "cursor" || client.door !== "free" || client.kind !== "json") fail("only the declared Cursor free JSON row can opt in");
  let endpoint;
  try { endpoint = new URL(freeUrl); } catch { fail("the free door must be an absolute HTTPS URL"); }
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== "/mcp/free" || client.url !== freeUrl) {
    fail("the resolved row must name the HTTPS free door");
  }
  const exactKeys = (v, keys) => v !== null && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === keys.length && keys.every((k) => Object.hasOwn(v, k));
  let cfg;
  try { cfg = JSON.parse(client.snippet); } catch { fail("the resolved snippet must be JSON"); }
  if (!exactKeys(cfg, ["mcpServers"]) || !exactKeys(cfg.mcpServers, ["gspc"])) fail("the snippet must contain exactly one mcpServers.gspc entry");
  const server = cfg.mcpServers.gspc;
  if (!exactKeys(server, ["url"]) || server.url !== freeUrl) fail("only the free URL is allowed; no command, headers or credentials");
  const config = Buffer.from(JSON.stringify(server), "utf8").toString("base64");
  return { kind: "cursor", href: `cursor://anysphere.cursor-deeplink/mcp/install?name=gspc&config=${encodeURIComponent(config)}` };
}
