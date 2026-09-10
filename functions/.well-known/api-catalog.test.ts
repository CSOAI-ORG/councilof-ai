import { describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { API_CATALOG, CATALOG_URL, onRequest } from "./api-catalog";

const ROOT = resolve(__dirname, "../..");
const request = (method = "GET") => new Request(CATALOG_URL, { method });

describe("RFC 9727 public API catalog", () => {
  it("serves a Linkset of four real API entry points, not a capabilities claim", async () => {
    const response = onRequest({ request: request() });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe('application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"');
    expect(await response.json()).toEqual(API_CATALOG);
    const [root, ...entries] = API_CATALOG.linkset;
    expect(root).toEqual({ anchor: CATALOG_URL, item: entries.map(({ anchor }) => ({ href: anchor })) });
    expect(entries.map(({ anchor }) => new URL(anchor).pathname)).toEqual(["/api/gspc", "/mcp", "/api/a2a", "/api/x402"]);
  });

  it("every advertised endpoint and description has an existing source", () => {
    const sourcePaths = {
      "/api/gspc": "functions/api/gspc.ts",
      "/mcp": "functions/mcp/[[path]].ts",
      "/api/a2a": "functions/api/a2a.ts",
      "/api/x402": "functions/api/x402.ts",
      "/api/openapi.json": "functions/api/openapi.json.ts",
      "/.well-known/mcp/server-card.json": "public/.well-known/mcp/server-card.json",
      "/.well-known/agent-card.json": "public/.well-known/agent-card.json",
      "/openapi.json": "public/openapi.json",
      "/.well-known/x402.json": "functions/.well-known/x402.json.ts",
    };
    const urls = [...JSON.stringify(API_CATALOG).matchAll(/https:\/\/councilof\.ai[^"\s]*/g)].map(([url]) => url);
    for (const url of urls) {
      if (url === CATALOG_URL) continue;
      const path = new URL(url).pathname;
      expect(sourcePaths).toHaveProperty(path);
      expect(existsSync(resolve(ROOT, sourcePaths[path as keyof typeof sourcePaths])), path).toBe(true);
    }
  });

  it("is linked from the static homepage and does not fabricate a .json alias", () => {
    const headers = readFileSync(resolve(ROOT, "public/_headers"), "utf8");
    const homepage = headers.split("\n/\n")[1]?.split("\n\n")[0];
    expect(homepage).toContain(`Link: <${CATALOG_URL}>; rel="api-catalog"`);
    expect(existsSync(resolve(ROOT, "public/.well-known/api-catalog.json"))).toBe(false);
  });

  it("advertises browser-readable MCP metadata without relaxing all paths", () => {
    const headers = readFileSync(resolve(ROOT, "public/_headers"), "utf8");
    const mcp = headers.split("\n/.well-known/mcp/server-card.json\n")[1]?.split("\n\n")[0];
    expect(mcp).toContain("Access-Control-Allow-Origin: *");
    expect(mcp).toContain("Content-Type: application/json");
    expect(headers.split("\n/*\n")[1]?.split("\n\n")[0]).not.toContain("Access-Control-Allow-Origin");
  });

  it("keeps GET and HEAD headers identical while suppressing the HEAD body", async () => {
    const get = onRequest({ request: request() });
    const head = onRequest({ request: request("HEAD") });
    expect([...head.headers]).toEqual([...get.headers]);
    expect(await head.text()).toBe("");
    expect(Number(get.headers.get("Content-Length"))).toBe(new TextEncoder().encode(await get.text()).byteLength);
  });

  it("supports public read-only CORS and an empty OPTIONS response", async () => {
    const response = onRequest({ request: request("OPTIONS") });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, HEAD, OPTIONS");
    expect(response.headers.has("Content-Length")).toBe(false);
    expect(response.headers.has("Access-Control-Allow-Credentials")).toBe(false);
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])("rejects %s without HTML or invoking any service", async (method) => {
    const response = onRequest({ request: request(method) });
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, HEAD, OPTIONS");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ error: "method_not_allowed" });
  });

  it("never reflects request origin, query, credentials or fetched values", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network must not be used"));
    try {
      const response = onRequest({ request: new Request("https://attacker.invalid/.well-known/api-catalog?token=private", {
        headers: { Authorization: "Bearer private", Cookie: "session=private", Origin: "https://attacker.invalid" },
      }) });
      const text = await response.text();
      expect(text).toBe(JSON.stringify(API_CATALOG) + "\n");
      expect(text).not.toMatch(/attacker|private|UNMEASURED|certified|amount|price|tool_count|\/api\/witness|\/api\/fulfill/);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
