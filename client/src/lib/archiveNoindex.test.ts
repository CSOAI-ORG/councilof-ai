import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import archive from "../data/archive-noindex.json";
import { ROUTE_MANIFEST } from "../data/route-manifest";
import { isLibraried, replacementFor } from "../data/library-ia";
import { ARCHIVE_NOINDEX, ARCHIVE_ROBOTS, applyHead, resolveHead, type HeadDocument } from "./seoHead";

// Owner ruling 2026-11-27: archive pages ("kept for the record", no current replacement) are
// noindex; flagship, legal, trust and help pages stay indexed even though they carry the banner.
describe("archive-noindex.json: the owner-ruled archive pages", () => {
  const manifest = new Set(ROUTE_MANIFEST.map((r) => r.path));

  it("lists only real archive routes, sorted, with no duplicates", () => {
    expect(archive.paths.length).toBeGreaterThan(0);
    expect([...archive.paths].sort()).toEqual(archive.paths);
    expect(new Set(archive.paths).size).toBe(archive.paths.length);
    for (const p of archive.paths) {
      expect(manifest.has(p), `${p} is an App.tsx route`).toBe(true);
      expect(isLibraried(p), `${p} shows the archive banner`).toBe(true);
      expect(replacementFor(p), `${p} has no current replacement`).toBeNull();
    }
  });

  it("never noindexes a page the ruling keeps indexed", () => {
    for (const p of archive.kept_indexed) expect(ARCHIVE_NOINDEX.has(p), p).toBe(false);
    for (const p of ["/answers", "/gspc-anchors", "/gspc-gap-map", "/learn", "/provenance-finding", "/tour", "/help", "/cookie-policy", "/refund-policy"]) {
      expect(archive.kept_indexed).toContain(p);
    }
  });

  it("is left out of the committed sitemap", () => {
    const xml = readFileSync(resolve(__dirname, "../../../public/sitemap.xml"), "utf8");
    for (const p of archive.paths) expect(xml.includes(`<loc>https://councilof.ai${p}/</loc>`), p).toBe(false);
  });
});

describe("seoHead writes the archive robots directive", () => {
  const stubDoc = (content: string) => {
    const els: Record<string, { attrs: Record<string, string> }> = {};
    const mk = () => {
      const attrs: Record<string, string> = {};
      return { attrs, setAttribute(n: string, v: string) { attrs[n] = v; }, getAttribute(n: string) { return attrs[n] ?? null; } };
    };
    const robots = mk();
    robots.setAttribute("name", "robots");
    robots.setAttribute("content", content);
    els['meta[name="robots"]'] = robots;
    const doc: HeadDocument = {
      title: "",
      head: { appendChild: () => undefined },
      querySelector: (sel: string) => (els[sel] as never) ?? null,
      createElement: () => mk(),
    };
    return { doc, robots };
  };

  it("resolves noindex for an archive page and nothing for a current page", () => {
    const p = archive.paths[0];
    expect(resolveHead(p).robots).toBe(ARCHIVE_ROBOTS);
    expect(resolveHead(`${p}/`).robots).toBe(ARCHIVE_ROBOTS);
    expect(resolveHead("/about").robots).toBeUndefined();
    expect(resolveHead("/tour").robots).toBeUndefined();
  });

  it("turns the shell robots meta to noindex on an archive page and back on the next page", () => {
    const { doc, robots } = stubDoc("index, follow");
    applyHead(resolveHead(archive.paths[0]), doc);
    expect(robots.getAttribute("content")).toBe("noindex, follow");
    applyHead(resolveHead("/about"), doc);
    expect(robots.getAttribute("content")).toBe("index, follow");
  });

  it("leaves a robots value it did not write alone", () => {
    const { doc, robots } = stubDoc("noindex,nofollow,noarchive");
    applyHead(resolveHead("/about"), doc);
    expect(robots.getAttribute("content")).toBe("noindex,nofollow,noarchive");
  });
});
