/**
 * The /404 path must answer 404, and it must carry the same headers as every other
 * page on the site.
 *
 * WHY THERE IS A TEST HERE. The defect was live for as long as the site existed:
 * the path resolved, so it answered 200, and nothing failed. A route that answers
 * the wrong status is not caught by a test that only checks the route loads.
 */
import { describe, expect, it } from "vitest";
import { onRequest } from "./404";

const PAGE = "<!doctype html><title>Not found</title>";

function env(headers: Record<string, string> = {}) {
  const seen: string[] = [];
  return {
    seen,
    assets: {
      fetch: async (input: Request) => {
        seen.push(new URL(input.url).pathname);
        return new Response(PAGE, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "x-frame-options": "SAMEORIGIN",
            "strict-transport-security": "max-age=31536000; includeSubDomains",
            ...headers,
          },
        });
      },
    },
  };
}

describe("GET /404", () => {
  it("answers 404, not 200", async () => {
    const { assets, seen } = env();
    const res = await onRequest({ request: new Request("https://councilof.ai/404"), env: { ASSETS: assets } });
    expect(res.status).toBe(404);
    expect(await res.text()).toBe(PAGE);
    expect(seen).toEqual(["/404.html"]);
  });

  it("carries the headers the asset layer applied", async () => {
    const { assets } = env();
    const res = await onRequest({ request: new Request("https://councilof.ai/404"), env: { ASSETS: assets } });
    expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(res.headers.get("strict-transport-security")).toBe("max-age=31536000; includeSubDomains");
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
  });

  it("answers 404 even when there is no asset layer", async () => {
    const res = await onRequest({ request: new Request("https://councilof.ai/404"), env: {} });
    expect(res.status).toBe(404);
  });

  it("serves the site's own 404 page, not a bare string, when the asset layer answers", async () => {
    const { assets } = env();
    const res = await onRequest({ request: new Request("https://councilof.ai/404"), env: { ASSETS: assets } });
    expect(res.headers.get("content-type")).toContain("text/html");
  });
});
