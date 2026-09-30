/**
 * GET /agent-cards/index.json — the list the static hub shell (public/agent-cards/index.html) searches and filters.
 * Same derivation as the per-type sitemap (functions/_lib/reach/lists.ts): only entities with data,
 * never an opted-out or robots-refused one. Facets are recorded states, never scores; the order is
 * alphabetical, never a ranking.
 */
import { type Ctx, serve } from "../_lib/reach/core";
import { listType } from "../_lib/reach/lists";

export const onRequest = async (ctx: Ctx): Promise<Response> =>
  serve(ctx, "json", async () => {
    const items = await listType(ctx, "agent-cards");
    const lastmod = items.map((i) => i.lastmod).filter(Boolean).sort().at(-1) ?? null;
    const facetKeys = [...new Set(items.flatMap((i) => Object.keys(i.facets)))];
    return {
      status: 200,
      contentType: "application/json; charset=utf-8",
      lastModified: lastmod,
      body: JSON.stringify({
        schema: "csoai.reach-list/0.1",
        type: "agent-cards",
        n: items.length,
        newest_observation: lastmod,
        doctrine: "Measurement of declared vs observed. Not a ranking: the order is alphabetical and no entity is scored.",
        // Columnar to keep the hub download small: one row per entity, values in `columns` order.
        // `label` is null where it equals `key`; each page lives at url_template with {key}.
        url_template: items[0] ? items[0].loc.replace(items[0].key, "{key}") : null,
        columns: ["key", "label", "lastmod", ...facetKeys],
        rows: items.map((i) => [i.key, i.label === i.key ? null : i.label, i.lastmod ? i.lastmod.slice(0, 10) : null, ...facetKeys.map((k) => i.facets[k] ?? null)]),
      }) + "\n",
    };
  });
