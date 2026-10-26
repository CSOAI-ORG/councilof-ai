/** Derive the opt-in installer from the resolved workspace snippet; never accept a hand-written URI. */
export function vscodeInstallAction(client, freeUrl) {
  if (client.installer === undefined) return undefined;
  const fail = (reason) => { throw new Error(`VS Code installer: ${reason}`); };
  if (client.installer !== "vscode" || client.id !== "vscode" || client.door !== "free" || client.kind !== "json") {
    fail("only the declared VS Code free JSON row can opt in");
  }
  let endpoint;
  try { endpoint = new URL(freeUrl); } catch { fail("the free door must be an absolute HTTPS URL"); }
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== "/mcp/free" || client.url !== freeUrl) {
    fail("the resolved row must name the HTTPS free door");
  }
  const exactKeys = (value, keys) => value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
  let workspace;
  try { workspace = JSON.parse(client.snippet); } catch { fail("the resolved workspace snippet must be JSON"); }
  if (!exactKeys(workspace, ["servers"]) || !exactKeys(workspace.servers, ["gspc"])) {
    fail("the workspace must contain exactly one servers.gspc entry");
  }
  const server = workspace.servers.gspc;
  if (!exactKeys(server, ["type", "url"]) || server.type !== "http" || server.url !== freeUrl) {
    fail("only the free HTTP URL is allowed; no stdio, inputs or credentials");
  }
  return {
    kind: "vscode",
    href: `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: "gspc", ...server }))}`,
  };
}
