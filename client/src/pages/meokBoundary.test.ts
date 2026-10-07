// 2026-09-28 meok-boundary lane. Council of AI measures; MEOK (a separate business) hosts SOVOS and
// its own products. A measurement body that hosts or advertises a product built by its own founder
// has no independence, so no page this site mounts may carry a MEOK product name, link to a MEOK
// product route, or point at a MEOK backend. Before this lane /ei3 was a "MEOK ONE" product page
// that placed its own stack first among named vendors, /authority offered a "MEOK Open" badge,
// ten pages sent readers to /meok-law, and the /opengridworks tools drawer linked a MEOK
// attestation API on a Vercel host that answers 402. The alias URL /meok-law still serves the jurisdiction
// engine (retiring it needs an owner-authorised sitemap withdrawal); nothing links to it.
//
// Scope: pages reachable from a <Route> in App.tsx. Comments are stripped before matching, so the
// history written in a file (this header included) cannot fail the guard.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { INTEGRATIONS } from "../data/intel/integrations";

const SRC = resolve(__dirname, "..");
const read = (p: string) => readFileSync(resolve(SRC, p), "utf8");
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Page modules App.tsx actually routes to: lazy/static imports whose binding is used as component={X}. */
function mountedPages(): string[] {
  const app = read("App.tsx");
  const used = new Set<string>();
  for (const m of app.matchAll(/component=\{([A-Za-z0-9_]+)\}/g)) used.add(m[1]);
  const files = new Set<string>();
  const add = (name: string, rel: string) => {
    if (!used.has(name) || !rel.startsWith("./pages/")) return;
    for (const ext of [".tsx", ".ts", "/index.tsx"]) {
      const p = rel.slice(2) + ext;
      if (existsSync(resolve(SRC, p))) { files.add(p); return; }
    }
  };
  for (const m of app.matchAll(/const\s+([A-Za-z0-9_]+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(\s*["']([^"']+)["']/g)) add(m[1], m[2]);
  for (const m of app.matchAll(/import\s+([A-Za-z0-9_]+)\s+from\s+["']([^"']+)["']/g)) add(m[1], m[2]);
  return [...files].sort();
}

// A MEOK product name, a MEOK product route used as a link, or a MEOK backend host.
const MEOK_PRODUCT = /\bMEOK\s+(?:ONE|Law|Open|bridge)\b|\bmeok-open\b|["'`]\/meok-law\/?["'`]|\bapi\.meok\.ai\b|\bmeok-attestation-api\b/i;

describe("no mounted page hosts or advertises a MEOK product", () => {
  const pages = mountedPages();

  it("finds the routed pages (the scan is not vacuous)", () => {
    expect(pages.length).toBeGreaterThan(100);
    expect(pages).toContain("pages/EI3.tsx");
    expect(pages).toContain("pages/JurisdictionEngine.tsx");
  });

  it("no routed page names a MEOK product, links a MEOK product route or calls a MEOK backend", () => {
    const hits = pages
      .map((p) => {
        const m = stripComments(read(p)).match(MEOK_PRODUCT);
        return m ? `${p}: ${m[0]}` : null;
      })
      .filter(Boolean);
    expect(hits).toEqual([]);
  });

  it("the jurisdiction engine is routed under its own name, not a MEOK product name", () => {
    const app = read("App.tsx");
    expect(app).toMatch(/<Route path="\/law" component=\{JurisdictionEngine\} \/>/);
    expect(app).not.toMatch(/component=\{MeokLaw\}/);
  });

  it("the /opengridworks tools drawer points at no MEOK backend", () => {
    // Every endpoint the drawer renders as a link must be a host this site answers for.
    const hosts = INTEGRATIONS.filter((i) => i.endpoint).map((i) => new URL(i.endpoint!).hostname);
    expect(hosts.length).toBeGreaterThan(0);
    expect(hosts.filter((h) => /meok/i.test(h) || h.endsWith(".vercel.app"))).toEqual([]);
    expect(INTEGRATIONS.find((i) => i.slug === "attestation-api")?.endpoint).toBe("https://councilof.ai/api/verify");
  });

  it("/ei3 states the boundary and stays UNMEASURED", () => {
    const c = stripComments(read("pages/EI3.tsx"));
    expect(c).toContain("separate business");
    expect(c).toContain("UNMEASURED");
    const head = JSON.parse(read("data/seo-head.json")).components.EI3;
    expect(head.description).toContain("separate business");
  });
});
