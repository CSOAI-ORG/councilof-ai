/**
 * Markdown for Agents: Accept: text/markdown gets Markdown of the same page; every browser Accept keeps HTML;
 * non-HTML responses pass through byte for byte; the root middleware wires it after the www redirect.
 */
import { describe, expect, it, vi } from "vitest";
import { htmlToMarkdown, negotiateMarkdown, prefersMarkdown } from "./markdownNegotiation";
import { onRequest } from "../_middleware";

const req = (accept: string | null, method = "GET", url = "https://councilof.ai/methodology/") =>
  new Request(url, { method, headers: accept === null ? {} : { accept } });

const PAGE = `<!doctype html><html><head><title>Methodology · Council of AI</title><style>.x{}</style></head>
<body><nav><a href="/">Home</a></nav><main><h1>Methodology</h1><p>We <strong>measure</strong>; we never certify.
See <a href="/signed/HOW-TO-VERIFY.md">how to verify</a> &amp; the <code>/api/gspc</code> board.</p>
<ul><li>Frozen banks</li><li>Wilson intervals</li></ul><table><tr><th>axis</th><th>n</th></tr><tr><td>gov</td><td>40</td></tr></table>
<script>window.secret = "never-in-markdown"</script><pre>curl https://councilof.ai/api/gspc</pre></main></body></html>`;

describe("prefersMarkdown", () => {
  it("scanner and agent Accept values choose Markdown", () => {
    for (const a of ["text/markdown", "text/markdown, text/plain, */*", "text/markdown;q=1, text/html;q=0.5", "text/html;q=0.1, text/markdown"])
      expect(prefersMarkdown(req(a)), a).toBe(true);
  });
  it("browsers, curl and HTML-first agents keep HTML", () => {
    for (const a of [
      null,
      "*/*",
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "text/html, text/markdown",
      "text/markdown;q=0",
      "application/json",
    ])
      expect(prefersMarkdown(req(a)), String(a)).toBe(false);
  });
  it("only GET and HEAD negotiate", () => {
    expect(prefersMarkdown(req("text/markdown", "POST"))).toBe(false);
    expect(prefersMarkdown(req("text/markdown", "HEAD"))).toBe(true);
  });
});

describe("htmlToMarkdown", () => {
  const md = htmlToMarkdown(PAGE, "https://councilof.ai/methodology/");
  it("keeps the page's words, structure and absolute links", () => {
    expect(md).toContain("# Methodology");
    expect(md).toContain("We **measure**; we never certify.");
    expect(md).toContain("[how to verify](https://councilof.ai/signed/HOW-TO-VERIFY.md)");
    expect(md).toContain("& the `/api/gspc` board.");
    expect(md).toContain("- Frozen banks\n- Wilson intervals");
    expect(md).toContain("| axis | n |\n| gov | 40 |");
    expect(md).toContain("```\ncurl https://councilof.ai/api/gspc\n```");
  });
  it("drops scripts, styles and the nav outside <main>", () => {
    expect(md).not.toContain("never-in-markdown");
    expect(md).not.toContain(".x{}");
    expect(md).not.toContain("[Home]");
  });
  it("names the HTML page as the authority", () => {
    expect(md.trim().endsWith("(Markdown rendering of the served HTML page; the HTML page is the authority)")).toBe(true);
  });
});

describe("negotiateMarkdown", () => {
  it("HTML -> text/markdown with Vary: Accept", async () => {
    const r = await negotiateMarkdown(req("text/markdown"), new Response(PAGE, { headers: { "content-type": "text/html; charset=utf-8" } }));
    expect(r.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(r.headers.get("vary")).toBe("Accept");
    expect(r.headers.get("x-markdown-tokens")).toBeNull(); // no unmeasured number
    expect(await r.text()).toContain("# Methodology");
  });
  it("JSON, files, errors and redirects pass through untouched", async () => {
    for (const up of [
      new Response('{"a":1}', { headers: { "content-type": "application/json" } }),
      new Response("# auth.md", { headers: { "content-type": "text/markdown" } }),
      new Response("<h1>gone</h1>", { status: 404, headers: { "content-type": "text/html" } }),
      new Response(null, { status: 308, headers: { location: "/x/" } }),
    ]) {
      const r = await negotiateMarkdown(req("text/markdown"), up);
      expect(r).toBe(up);
    }
  });
});

describe("root middleware wiring", () => {
  const html = () => new Response(PAGE, { headers: { "content-type": "text/html; charset=utf-8" } });
  it("an agent asking for Markdown gets Markdown", async () => {
    const r = await onRequest({ request: req("text/markdown"), next: vi.fn(async () => html()) });
    expect(r.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
  });
  it("a browser gets the upstream response object itself", async () => {
    const up = html();
    const r = await onRequest({ request: req("text/html,*/*;q=0.8"), next: vi.fn(async () => up) });
    expect(r).toBe(up);
  });
  it("www still redirects first, even for a Markdown request", async () => {
    const next = vi.fn(async () => html());
    const r = await onRequest({ request: req("text/markdown", "GET", "https://www.councilof.ai/about/"), next });
    expect(r.status).toBe(301);
    expect(next).not.toHaveBeenCalled();
  });
});
