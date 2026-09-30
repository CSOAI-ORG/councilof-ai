/**
 * GET /sitemaps/index.xml           — sitemap index: the static /sitemap.xml plus one Function-generated
 *                                      sitemap per entity type (chunked at 50,000 URLs).
 * GET /sitemaps/<type>-<n>.xml      — one chunk of one type.
 *
 * Every URL comes from functions/_lib/reach/lists.ts, the same loader the page renders from, so a
 * listed URL is one the edge answers 200 (the rule scripts/sitemap-truth-gate.mjs enforces for
 * /sitemap.xml, extended here and checked by scripts/reach/entity-sitemap-gate.mjs). A source that
 * cannot be read answers 503 with Retry-After — never an empty or partial urlset, which a crawler
 * would read as "these pages are gone".
 */
import { type Ctx, SITE, param, serve } from "../_lib/reach/core";
import { SITEMAP_CAP, TYPES, type EntityType, chunk, listType, sitemapIndex, urlset } from "../_lib/reach/lists";

const XML = "application/xml; charset=utf-8";

export const onRequest = async (ctx: Ctx & { next?: () => Promise<Response> }): Promise<Response> => {
  const name = param(ctx, "name");
  if (name === "index.xml") {
    return serve(ctx, "xml", async () => {
      const entries: { loc: string; lastmod: string | null }[] = [{ loc: `${SITE}/sitemap.xml`, lastmod: null }];
      // Only the MCP list can approach the 50,000-URL cap, so only it is counted here; the other
      // types are a few hundred entries and always fit in chunk 1. Keeping the index cheap keeps it
      // inside the Functions CPU budget on a cold cache.
      for (const t of TYPES) {
        let n = 1;
        if (t === "mcp-servers") {
          try {
            n = Math.max(1, Math.ceil((await listType(ctx, t)).length / SITEMAP_CAP));
          } catch {
            /* the type's own sitemap answers 503 until its source is back; keep the entry */
          }
        }
        for (let i = 1; i <= n; i++) entries.push({ loc: `${SITE}/sitemaps/${t}-${i}.xml`, lastmod: null });
      }
      return { status: 200, contentType: XML, body: sitemapIndex(entries), lastModified: entries.map((e) => e.lastmod).filter(Boolean).sort().at(-1) ?? null };
    });
  }
  const m = name.match(/^([a-z0-9-]+?)-(\d{1,3})\.xml$/);
  const t = m?.[1] as EntityType | undefined;
  if (!m || !t || !(TYPES as readonly string[]).includes(t)) return ctx.next ? ctx.next() : new Response("Not found", { status: 404 });
  const n = Number(m[2]);
  return serve(ctx, "xml", async () => {
    const items = chunk(await listType(ctx, t), n);
    if (!items.length && n > 1) return { status: 404, contentType: "text/plain; charset=utf-8", body: "no such sitemap chunk\n" };
    return { status: 200, contentType: XML, body: urlset(items), lastModified: items.map((i) => i.lastmod).filter(Boolean).sort().at(-1) ?? null };
  });
};
