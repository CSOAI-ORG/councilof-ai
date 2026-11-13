import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { onRequestGet, onRequestHead } from "./index";

const charter = readFileSync(
  join(__dirname, "../../public/constitutional-harness/index.html"),
  "utf8",
);

describe("/operational-charter/ canonical Pages view", () => {
  it("serves the canonical charter and enquiry without forwarding caller credentials or parameters", async () => {
    const fetch = vi.fn(async (input: Request) => {
      expect(input.url).toBe("https://councilof.ai/constitutional-harness/");
      expect(input.method).toBe("GET");
      expect(input.headers.has("authorization")).toBe(false);
      expect(input.headers.has("cookie")).toBe(false);
      return new Response(charter, {
        headers: { "content-type": "text/html; charset=utf-8", etag: '"canonical-asset"' },
      });
    });
    const response = await onRequestGet({
      request: new Request("https://councilof.ai/operational-charter/?subject=private", {
        headers: { authorization: "Bearer fixture", cookie: "fixture=private" },
      }),
      env: { ASSETS: { fetch } },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.headers.get("etag")).toBe('"canonical-asset"');
    expect(await response.text()).toBe(charter);
    expect(charter.match(/<h2>Article [0-9]+/g)).toHaveLength(22);
    expect(charter).toContain('href="/contact/?arm=run"');
    expect(charter).toContain('id="measurement-enquiry"');
  });

  it("HEAD keeps the asset status and headers with an empty body", async () => {
    const fetch = vi.fn(async (input: Request) => {
      expect(input.method).toBe("GET");
      expect(input.url).toBe("https://councilof.ai/constitutional-harness/");
      return new Response(charter, {
        headers: { "content-type": "text/html; charset=utf-8", etag: '"canonical-asset"' },
      });
    });
    const response = await onRequestHead({
      request: new Request("https://councilof.ai/operational-charter/", { method: "HEAD" }),
      env: { ASSETS: { fetch } },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(response.headers.get("etag")).toBe('"canonical-asset"');
    expect(await response.text()).toBe("");
  });

  it("reports an unavailable asset binding without inventing a charter", async () => {
    const response = await onRequestGet({
      request: new Request("https://councilof.ai/operational-charter/"),
    });
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).not.toContain("CURRENT_OPERATIONAL_CHARTER");
  });

  it("preserves a missing canonical asset response", async () => {
    const missing = new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
    const response = await onRequestGet({
      request: new Request("https://councilof.ai/operational-charter/"),
      env: { ASSETS: { fetch: async () => missing } },
    });
    expect(response).toBe(missing);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not found");
  });

  it("the buyer page links to the Pages view", () => {
    const page = readFileSync(join(__dirname, "../../client/src/pages/HowWeWork.tsx"), "utf8");
    expect(page).toContain('href="/operational-charter/"');
    expect(page).not.toContain('href="/charter"');
    expect(page).toContain("Read the operational charter");
  });
});
