import { describe, expect, it } from "vitest";
import { onRequest, prefersHtml } from "./[[path]]";

const ORIGIN = "https://councilof.ai";
const BROWSER = "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";

async function get(accept: string | null) {
  const headers: Record<string, string> = {};
  if (accept !== null) headers.accept = accept;
  return onRequest({ request: new Request(`${ORIGIN}/mcp/`, { headers }), env: {} } as never);
}

describe("GET /mcp answers a browser with a page and everything else with the discovery JSON", () => {
  it("negotiates on Accept, JSON unless HTML is asked for first", () => {
    expect(prefersHtml(BROWSER)).toBe(true);
    expect(prefersHtml(null)).toBe(false);
    expect(prefersHtml("*/*")).toBe(false);
    expect(prefersHtml("application/json")).toBe(false);
    expect(prefersHtml("application/json, text/html")).toBe(false);
  });

  it("serves the same document as JSON to curl, fetch and SDK clients", async () => {
    for (const accept of [null, "*/*", "application/json"]) {
      const r = await get(accept);
      expect(r.headers.get("content-type")).toBe("application/json");
      expect(r.headers.get("vary")).toBe("Accept");
      const j = (await r.json()) as { server: string; paid_tools: { names: string[] } };
      expect(j.server).toBe("csoai-gspc-mcp");
      expect(j.paid_tools.names.length).toBeGreaterThan(0);
    }
  });

  it("serves a browser a titled, language-tagged page with one h1 carrying the same install line", async () => {
    const r = await get(BROWSER);
    expect(r.headers.get("content-type")).toContain("text/html");
    const html = await r.text();
    expect(html).toMatch(/<html lang="en">/);
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain('property="og:title"');
    expect(html).toContain("claude mcp add gspc -- npx -y csoai-gspc-mcp");
    expect(html).not.toMatch(/\$\s?\d/);
  });
});
