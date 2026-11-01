/**
 * Every /catalog.json product mapped to the indexable page that explains it, its signed card and its
 * canonical article. Read by the /products "Everything in the catalog" list.
 *
 * - page: the indexable, canonical page for the item (follows the catalog href through the edge's
 *   redirects and canonical tags as served on 14 Oct 2026). Where the catalog href is a machine file
 *   (JSON), the page is the human page that documents it.
 * - card: a signed card that measures the product itself. None exists for any catalog product today,
 *   so every entry is UNMEASURED. A board card measures a model on an axis, not a product; never
 *   substitute one. Set a card here only when a signed card about this product is published.
 * - article: a canonical article in client/src/data/blog-published.json (a served /blog/<slug>/).
 *   Omitted where none exists. Withdrawn or redirected blog slugs are never linked.
 *
 * catalogPages.test.ts fails when a catalog id has no entry here, so nothing in the catalog is missed.
 */
import CATALOG from "../../../public/catalog.json";

export type CatalogPage = { page: string; card: { state: "UNMEASURED" } | { state: "SIGNED"; href: string }; article?: string; pageNote?: string };

export const CATALOG_PAGES: Record<string, CatalogPage> = {
  claimguard: { page: "/honesty/", card: { state: "UNMEASURED" }, article: "keeping-ai-claims-current" },
  "gspc-mcp": { page: "/connect/", card: { state: "UNMEASURED" } },
  "east-west": { page: "/east-west/", card: { state: "UNMEASURED" } },
  "gspc-verify": { page: "/gspc-verify/", card: { state: "UNMEASURED" }, article: "how-to-verify-an-ai-measurement" },
  "gspc-arena": { page: "/dashboard/", card: { state: "UNMEASURED" } },
  "arena-scoreboard": { page: "/dashboard/", card: { state: "UNMEASURED" } },
  "article-50-pack": { page: "/packs/eu-article-50/", card: { state: "UNMEASURED" } },
  benchmarks: { page: "/benchmarks/", card: { state: "UNMEASURED" } },
  "mcp-fleet": { page: "/mcp-fleet/", card: { state: "UNMEASURED" }, pageNote: "withdrawn notice" },
  "ras-booking": { page: "/assess/", card: { state: "UNMEASURED" } },
  "cobol-bridge": { page: "/cobolbridge/", card: { state: "UNMEASURED" } },
};

export type CatalogItem = { id: string; name: string; status: string; href: string };
export const CATALOG_ITEMS: CatalogItem[] = (CATALOG as { products: CatalogItem[] }).products;
