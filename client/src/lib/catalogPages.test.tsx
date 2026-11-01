import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { CATALOG_ITEMS, CATALOG_PAGES } from "./catalogPages";
import { CatalogIndex } from "../pages/Products";

const ROOT = resolve(__dirname, "../../..");
const app = readFileSync(resolve(ROOT, "client/src/App.tsx"), "utf8");
const published = (JSON.parse(readFileSync(resolve(ROOT, "client/src/data/blog-published.json"), "utf8")).published as { slug: string }[]).map((p) => p.slug);
const routeOf = (page: string) => page.replace(/\/$/, "") || "/";

describe("every /catalog.json item maps to an indexable page", () => {
  it("no catalog id is missed and no mapping is stale", () => {
    expect(CATALOG_ITEMS.length).toBeGreaterThan(0);
    expect(Object.keys(CATALOG_PAGES).sort()).toEqual(CATALOG_ITEMS.map((i) => i.id).sort());
  });
  it.each(CATALOG_ITEMS.map((i) => i.id))("%s → an App.tsx route", (id) => {
    const page = CATALOG_PAGES[id].page;
    expect(page.startsWith("/") && page.endsWith("/")).toBe(true);
    expect(app).toContain(`path="${routeOf(page)}"`);
  });
  it("cards are never invented: UNMEASURED unless a published file backs it", () => {
    for (const [id, m] of Object.entries(CATALOG_PAGES)) {
      if (m.card.state === "SIGNED") expect(existsSync(resolve(ROOT, "public", m.card.href.replace(/^\//, ""))), id).toBe(true);
    }
  });
  it("articles come only from blog-published.json", () => {
    for (const m of Object.values(CATALOG_PAGES)) if (m.article) expect(published).toContain(m.article);
  });
});

describe("/products 'Everything in the catalog'", () => {
  const html = renderToStaticMarkup(<CatalogIndex />);
  it("renders one entry per catalog item with its page and card state", () => {
    for (const i of CATALOG_ITEMS) {
      expect(html).toContain(`data-testid="catalog-item-${i.id}"`);
      expect(html).toContain(`href="${CATALOG_PAGES[i.id].page}"`);
    }
    expect(html.match(/UNMEASURED<\/span>/g)?.length).toBe(Object.values(CATALOG_PAGES).filter((m) => m.card.state === "UNMEASURED").length);
  });
  it("JSON-LD lists the same names and pages as the visible list, with no rating, price or certification", () => {
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
    expect(ld.itemListElement.map((e: { name: string }) => e.name)).toEqual(CATALOG_ITEMS.map((i) => i.name));
    for (const e of ld.itemListElement) expect(html).toContain(`href="${e.url.replace("https://councilof.ai", "")}"`);
    expect(JSON.stringify(ld)).not.toMatch(/rating|price|offers|certif/i);
    expect(html).not.toMatch(/\bsov-[a-z0-9]/i);
  });
});
