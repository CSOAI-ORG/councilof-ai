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
        const out = await res;
        // The route's own response is what answers. On a /api/ path the
        // middleware now adds security headers (public/_headers never reaches a
        // Pages Function), so identity is checked where the middleware does not
        // alter the response and the CONTENT is checked everywhere.
        if (new URL(u).pathname.startsWith("/api/")) {
          expect(out.status, `${m} ${u}`).toBe(passthrough.status);
          expect(out.headers.get("X-Content-Type-Options"), `${m} ${u}`).toBe("nosniff");
          expect(out.headers.get("Referrer-Policy"), `${m} ${u}`).toBe("strict-origin-when-cross-origin");
          expect(out.headers.get("Strict-Transport-Security"), `${m} ${u}`).toContain("max-age=");
          expect(out.headers.get("X-Frame-Options"), `${m} ${u}`).toBe("DENY");
        } else {
          expect(out, `${m} ${u}`).toBe(passthrough);
        }
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
      const out = await res;
      expect(out.status, u).toBe(passthrough.status);
      if (!new URL(u).pathname.startsWith("/api/")) expect(out, u).toBe(passthrough);
      expect(next).toHaveBeenCalledOnce();
    }
  });

  it("an /api/ answer carries the security headers the static rules never reach", async () => {
    // public/_headers applies to static assets. A Pages Function answers /api/*
    // and never sees that file, so the whole machine-readable surface used to
    // go out with no nosniff, no referrer policy, no HSTS and no frame
    // protection — while the HTML beside it carried all of them.
    const { res } = run("https://councilof.ai/api/gspc");
    const out = await res;
    expect(out.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(out.headers.get("X-Frame-Options")).toBe("DENY");
    expect(out.headers.get("Permissions-Policy")).toContain("geolocation=()");
  });

  it("an /api/ answer carries a Content-Security-Policy too", async () => {
    // MEASURED 2026-11-07: the surface answered /api/gspc, /api/state and
    // /api/cards with five security headers and NO Content-Security-Policy at
    // all, while the HTML beside it carried one. The machine-readable surface
    // is the surface agents read most, and it was the one with no policy.
    const { res } = run("https://councilof.ai/api/gspc");
    const out = await res;
    const csp = out.headers.get("Content-Security-Policy");
    expect(csp).toBeTruthy();
    // A machine surface carries no scripts to allow, so the policy that fits it
    // is the strictest there is: nothing loads from it.
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("an /api/ answer that IS an HTML document degrades, it does not go white", async () => {
    // This repo has already had a white-screen incident (2026-08-11). A policy
    // that guesses wrong about a response type is how you cause the next one,
    // so the two cases are separated on the response's own content-type: a
    // document is sandboxed — it still RENDERS, with scripts and forms inert —
    // rather than being given a policy that blocks its own styles.
    const next = vi.fn(async () =>
      new Response("<!doctype html><p>hello</p>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    );
    const out = await onRequest({
      request: new Request("https://councilof.ai/api/thing"),
      next,
    });
    const csp = out.headers.get("Content-Security-Policy");
    expect(csp).toBeTruthy();
    expect(csp).toContain("sandbox");
    expect(csp).not.toContain("default-src 'none'");
    // The document still arrives: a policy must not change what the route serves.
    expect(await out.text()).toContain("hello");
  });

  it("a non-/api/ answer is untouched by the API policy", async () => {
    // public/_headers owns the page surface, and /dashboard/* carries its own
    // frame-ancestors rule for the Hugging Face Space that frames it. The API
    // policy must not reach across to it.
    const { res, passthrough } = run("https://councilof.ai/about/");
    const out = await res;
    expect(out).toBe(passthrough);
    expect(out.headers.get("Content-Security-Policy")).toBeNull();
  });

  it("look-alike hosts are not matched", () => {
    for (const u of ["https://www.councilof.ai.evil.example/", "https://wwwcouncilof.ai/", "https://app.councilof.ai/", "http://localhost:8788/"]) {
      expect(wwwToApex(new Request(u)), u).toBeNull();
    }
  });
});
