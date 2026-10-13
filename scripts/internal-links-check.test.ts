/**
 * The llms producer (scripts/llms-txt.mjs) must not publish a URL template as a link.
 *
 * 2026-10-13: the outward gate (hygiene.internal_links) found five failing links among the 216 in
 * /llms.txt — https://councilof.ai/mcp-servers/<host>/ and three more page patterns typed in the
 * template, and https://councilof.ai/api/wrapper?id=<wrapped-symbol:chain>&preview=1 derived from
 * a declared free preview. Three further templates were in link form and happened to answer.
 *
 * `node scripts/llms-txt.mjs --check` (pr-gates) already holds the committed files to what the
 * producer derives, so asserting over the committed files is asserting over the producer's output.
 * This is the offline half only. `node scripts/internal-links-check.mjs --live` fetches every link.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEFAULT_TARGETS, answers, gateForm, isPlaceholderLink, linksInHtml, linksInText, placeholderLinks, selftest,
} from "./internal-links-check.mjs";

const ROOT = resolve(__dirname, "..");
const R = (p: string) => readFileSync(resolve(ROOT, p), "utf8");

describe("internal-links-check reads a surface the way the outward gate does", () => {
  it("passes its own selftest", () => {
    expect(selftest()).toEqual([]);
  });

  it("keeps a template whole in the report, and knows what the gate would request for it", () => {
    const line = "- MCP servers: https://councilof.ai/mcp-servers/ — https://councilof.ai/mcp-servers/<host>/";
    expect(linksInText(line)).toEqual(["https://councilof.ai/mcp-servers/", "https://councilof.ai/mcp-servers/<host>/"]);
    expect(placeholderLinks(line)).toEqual(["https://councilof.ai/mcp-servers/<host>/"]);
    expect(gateForm("https://councilof.ai/mcp-servers/<host>/")).toBe("https://councilof.ai/mcp-servers/<host");
  });

  it("does not read code text as a link, in text or in HTML", () => {
    expect(placeholderLinks("one page per host, at `/mcp-servers/<host>/` · `GET /api/wrapper?id=<wrapped-symbol:chain>&preview=1`")).toEqual([]);
    expect(linksInHtml('<!doctype html><code>https://councilof.ai/api/wrapper?id=&lt;wrapped-symbol:chain&gt;</code>')).toEqual([]);
  });

  it("reads the href /services/ served on 2026-10-13 as a failing link", () => {
    const served = '<!doctype html><a href="https://councilof.ai/api/wrapper?id=&lt;wrapped-symbol:chain&gt;&amp;preview=1">Free preview →</a>';
    expect(linksInHtml(served).filter(isPlaceholderLink)).toHaveLength(1);
  });

  it("applies the gate's rule to a fetched link: 200 or 402, within one redirect", () => {
    expect(answers({ status: 200, hops: 0 })).toBe(true);
    expect(answers({ status: 402, hops: 1 })).toBe(true);
    expect(answers({ status: 200, hops: 2 })).toBe(false);
    expect(answers({ status: 400, hops: 0 })).toBe(false);
    expect(answers({ status: 0, hops: 0 })).toBe(false);
  });
});

describe("the llms producer publishes no template as a link", () => {
  it("checks exactly the two files the producer writes", () => {
    expect(DEFAULT_TARGETS).toEqual(["public/llms.txt", "public/llms-full.txt"]);
    const producer = R("scripts/llms-txt.mjs");
    for (const f of DEFAULT_TARGETS) expect(producer, f).toContain(`"${f}"`);
  });

  for (const f of DEFAULT_TARGETS) {
    it(`${f} lists zero placeholder-style internal links`, () => {
      const body = R(f);
      expect(linksInText(body).length, `${f} carries internal links at all`).toBeGreaterThan(50);
      expect(placeholderLinks(body)).toEqual([]);
    });
  }

  it("neither template types one", () => {
    for (const t of ["scripts/llms/llms.txt.tmpl", "scripts/llms/llms-full.txt.tmpl"]) {
      expect(placeholderLinks(R(t)), t).toEqual([]);
    }
  });

  it("prints a declared preview that carries a slot as code text, and a concrete one as an address", () => {
    const caps = JSON.parse(R("council-os/capabilities.json")).capabilities as Array<Record<string, any>>;
    const paid = caps.filter((c) => (c.payment === "x402" || c.payment === "free_preview_then_x402") && c.path && c.free_preview);
    const slotted = paid.filter((c) => isPlaceholderLink(c.free_preview));
    const concrete = paid.filter((c) => !isPlaceholderLink(c.free_preview));
    // If no declared preview carries a slot any more, the first loop below proves nothing. Say so.
    expect(slotted.length, "no declared free preview carries a slot: this case is now vacuous, re-aim it").toBeGreaterThan(0);
    expect(concrete.length).toBeGreaterThan(0);
    const out = R("public/llms.txt");
    for (const c of slotted) {
      expect(out, c.id).toContain("`GET " + c.free_preview + "`");
      expect(out, c.id).not.toContain("https://councilof.ai" + c.free_preview);
    }
    for (const c of concrete) expect(out, c.id).toContain("free preview: https://councilof.ai" + c.free_preview);
  });
});
