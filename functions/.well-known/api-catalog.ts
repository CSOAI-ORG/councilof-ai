/** RFC 9727 entry points, not a second price, tool or measurement inventory. */
const ORIGIN = "https://councilof.ai";
export const CATALOG_URL = `${ORIGIN}/.well-known/api-catalog`;
const JSON_TYPE = "application/json";
const apiEntries = [
  {
    anchor: `${ORIGIN}/api/gspc`,
    "service-desc": [{ href: `${ORIGIN}/api/openapi.json`, type: JSON_TYPE }],
  },
  {
    anchor: `${ORIGIN}/mcp`,
    "service-desc": [{ href: `${ORIGIN}/.well-known/mcp/server-card.json`, type: JSON_TYPE }],
  },
  {
    anchor: `${ORIGIN}/api/a2a`,
    "service-desc": [{ href: `${ORIGIN}/.well-known/agent-card.json`, type: "application/a2a+json" }],
  },
  {
    anchor: `${ORIGIN}/api/x402`,
    "service-desc": [{ href: `${ORIGIN}/openapi.json`, type: JSON_TYPE }],
    "service-meta": [{ href: `${ORIGIN}/.well-known/x402.json`, type: JSON_TYPE }],
  },
];

export const API_CATALOG = {
  linkset: [
    { anchor: CATALOG_URL, item: apiEntries.map(({ anchor }) => ({ href: anchor })) },
    ...apiEntries,
  ],
};
const body = JSON.stringify(API_CATALOG) + "\n";
const bodyLength = new TextEncoder().encode(body).byteLength;
const allow = "GET, HEAD, OPTIONS";

// One method dispatcher prevents unsupported verbs from falling through to the SPA.
// This endpoint never reads a request body, invokes a service, or consumes a secret.
export const onRequest = ({ request }: { request: Request }): Response => {
  const headers = new Headers({
    "Content-Type": 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": allow,
    "Cache-Control": "public, max-age=300",
    Link: `<${CATALOG_URL}>; rel="api-catalog"`,
  });
  if (request.method === "OPTIONS") {
    headers.set("Allow", allow);
    headers.delete("Content-Type");
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    headers.set("Allow", allow);
    headers.set("Cache-Control", "no-store");
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers });
  }
  headers.set("Content-Length", String(bodyLength));
  return new Response(request.method === "HEAD" ? null : body, { headers });
};
