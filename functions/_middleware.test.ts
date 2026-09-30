/**
 * www.councilof.ai must 301 to the apex with path and query intact; the apex and every
 * *.pages.dev host (production alias and per-deploy previews) must fall through untouched.
 */
import { describe, expect, it, vi } from "vitest";
import { onRequest } from "./_middleware";
import { wwwToApex } from "./_lib/wwwRedirect";

function run(url: string, method = "GET") {
  const passthrough = new Response("next", { status: 200 });
  const next = vi.fn(async () => passthrough);
  return { next, passthrough, res: onRequest({ request: new Request(url, { method }), next }) };
}

describe("root middleware: www -> apex", () => {
  it("www: 301 to the apex, keeping path and query", async () => {
    const { res, next } = run("https://www.councilof.ai/about/?x=1");
    const r = await res;
    expect(r.status).toBe(301);
    expect(r.headers.get("location")).toBe("https://councilof.ai/about/?x=1");
    expect(next).not.toHaveBeenCalled();
  });

  it("www root, deep paths, encoded paths and API paths all move", () => {
    for (const [from, to] of [
      ["https://www.councilof.ai/", "https://councilof.ai/"],
      ["https://www.councilof.ai", "https://councilof.ai/"],
      ["https://www.councilof.ai/api/gspc", "https://councilof.ai/api/gspc"],
      ["https://www.councilof.ai/mcp", "https://councilof.ai/mcp"],
      ["https://www.councilof.ai/a%20b/c.json?q=1&r=%2F", "https://councilof.ai/a%20b/c.json?q=1&r=%2F"],
      ["https://WWW.CouncilOf.AI/about/", "https://councilof.ai/about/"],
      ["https://www.councilof.ai:443/about/", "https://councilof.ai/about/"],
    ]) {
      const r = wwwToApex(new Request(from));
      expect(r?.status, from).toBe(301);
      expect(r?.headers.get("location"), from).toBe(to);
    }
  });

  it("www HEAD is 301; a non-GET method gets 308 so the body and method survive", async () => {
    expect((await run("https://www.councilof.ai/about/", "HEAD").res).status).toBe(301);
    const post = await run("https://www.councilof.ai/mcp", "POST").res;
    expect(post.status).toBe(308);
    expect(post.headers.get("location")).toBe("https://councilof.ai/mcp");
  });

  it("apex: falls through to the route unchanged", async () => {
    for (const u of ["https://councilof.ai/", "https://councilof.ai/about/?x=1", "https://councilof.ai/api/gspc", "https://councilof.ai/mcp"]) {
      for (const m of ["GET", "POST"]) {
        const { res, next, passthrough } = run(u, m);
        expect(await res, `${m} ${u}`).toBe(passthrough);
        expect(next).toHaveBeenCalledOnce();
      }
    }
  });

  it("pages.dev production alias and previews: fall through unchanged", async () => {
    for (const u of [
      "https://councilof-ai.pages.dev/about/?x=1",
      "https://1a2b3c4d.councilof-ai.pages.dev/",
      "https://master.councilof-ai.pages.dev/api/gspc",
      "https://www.councilof-ai.pages.dev/",
    ]) {
      const { res, next, passthrough } = run(u);
      expect(await res, u).toBe(passthrough);
      expect(next).toHaveBeenCalledOnce();
    }
  });

  it("look-alike hosts are not matched", () => {
    for (const u of ["https://www.councilof.ai.evil.example/", "https://wwwcouncilof.ai/", "https://app.councilof.ai/", "http://localhost:8788/"]) {
      expect(wwwToApex(new Request(u)), u).toBeNull();
    }
  });
});
