import { describe, expect, it, vi } from "vitest";
import { onRequest } from "./[[path]]";

async function serve(path: string, response: Response) {
  const next = vi.fn(async () => response);
  const result = await onRequest({ request: new Request(`https://councilof.ai${path}`), next } as any);
  return { result, next };
}

describe("third-party capture boundary", () => {
  it("keeps exact captured HTML bytes while disabling active content", async () => {
    const bytes = new TextEncoder().encode('<!doctype html><script>window.captureExecuted=true</script><p>Original evidence: £1</p>');
    const { result } = await serve("/interop/report/mirrors/source.html", new Response(bytes, { headers: { "content-type": "text/html; charset=utf-8" } }));
    expect(new Uint8Array(await result.arrayBuffer())).toEqual(bytes);
    expect(result.headers.get("content-security-policy")).toContain("sandbox");
    expect(result.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(result.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(result.headers.get("x-content-type-options")).toBe("nosniff");
    expect(result.headers.get("referrer-policy")).toBe("no-referrer");
  });
  it("also protects an extensionless HTML capture", async () => {
    const { result } = await serve("/interop/report/mirrors/146", new Response("<p>Capture</p>", { headers: { "content-type": "text/html" } }));
    expect(result.headers.get("content-security-policy")).toContain("sandbox");
    expect(await result.text()).toBe("<p>Capture</p>");
  });
  it("preserves the existing CSP alongside the passive-viewing policy", async () => {
    const { result } = await serve("/interop/report/mirrors/source.html", new Response("original", { headers: { "content-type": "text/html", "content-security-policy": "frame-ancestors 'self'" } }));
    expect(result.headers.get("content-security-policy")).toMatch(/^frame-ancestors 'self', sandbox;/);
  });
  // MEASURED 2026-11-06 on the live site: the header shipped TWICE.
  // public/_headers sets the capture policy for /interop/:report/mirrors/* and _headers
  // reaches responses that pass through a Function, so ctx.next() already carries it --
  // and the function appended the same policy again.
  it("does not apply the capture policy twice when the response already carries it", async () => {
    const capture = "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:";
    const { result } = await serve("/interop/report/mirrors/146", new Response("<p>Capture</p>", { headers: { "content-type": "text/html", "content-security-policy": capture } }));
    const shipped = result.headers.get("content-security-policy") ?? "";
    expect(shipped).toBe(capture);
    expect(shipped.split("sandbox").length - 1).toBe(1);
  });
  it("applies the capture policy exactly once when nothing is there yet", async () => {
    const { result } = await serve("/interop/report/mirrors/146", new Response("<p>Capture</p>", { headers: { "content-type": "text/html" } }));
    const shipped = result.headers.get("content-security-policy") ?? "";
    expect(shipped.split("sandbox").length - 1).toBe(1);
    expect(shipped).toContain("default-src 'none'");
  });
  it("preserves JSON and PDF evidence content types and bytes", async () => {
    for (const type of ["application/json", "application/pdf"]) {
      const { result } = await serve("/interop/report/mirrors/source", new Response("original", { headers: { "content-type": type } }));
      expect(result.headers.get("content-type")).toBe(type);
      expect(result.headers.has("content-security-policy")).toBe(false);
      expect(await result.text()).toBe("original");
    }
  });
  it("leaves first-party report responses unchanged", async () => {
    const original = new Response("report", { headers: { "content-type": "text/html" } });
    const { result, next } = await serve("/interop/report/index.html", original);
    expect(result).toBe(original);
    expect(next).toHaveBeenCalledOnce();
  });
});
