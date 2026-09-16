/**
 * route-title.mjs — the <title> and meta description a client-only route ships in its
 * prerendered SPA shell.
 *
 * prerender.mjs does not snapshot CLIENT_ONLY_FUNCTION_ROUTES (their Functions are absent on
 * Vite preview); it copies dist/index.html to <route>/index.html and rewrites the canonical.
 * Measured 2026-09-15: all 10 such routes in the sitemap served the HOMEPAGE <title> to
 * crawlers. The per-route head is set by JavaScript after hydration, which a crawler never runs.
 *
 * The map is client/src/data/seo-head.json — the same file client/src/lib/seoHead.ts reads at
 * runtime and client/src/lib/ownerRuling.test.ts guards — so the build and the app cannot drift.
 * (Until 2026-09-16 this parsed ROUTE_TITLES out of App.tsx source with a regex; that map has
 * been folded into the JSON and App.tsx no longer carries one.)
 */
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const SEO_HEAD_PATH = join(ROOT, "client/src/data/seo-head.json");

const normRoute = (r) => String(r).split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

/** Map of normalised route → { title, description } from seo-head.json (or JSON text passed in). */
export function loadRouteHeads(jsonText = readFileSync(SEO_HEAD_PATH, "utf8")) {
  const map = new Map();
  let parsed;
  try { parsed = JSON.parse(String(jsonText)); } catch { return map; }
  for (const [route, entry] of Object.entries(parsed?.routes ?? {})) {
    if (entry && typeof entry.title === "string") map.set(normRoute(route), { title: entry.title, description: typeof entry.description === "string" ? entry.description : "" });
  }
  return map;
}

/** Back-compat name: the title-only view of the same map. */
export function parseRouteTitles(jsonText) {
  const heads = loadRouteHeads(jsonText);
  const map = new Map();
  for (const [k, v] of heads) map.set(k, v.title);
  return map;
}

const escText = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => escText(s).replace(/"/g, "&quot;");

/** Replace <title>, og:title and twitter:title with `title`. Idempotent; absent tags stay absent. */
export function rewriteTitle(html, title) {
  if (!title) return html;
  return String(html)
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escText(title)}</title>`)
    .replace(/(<meta[^>]*property=["']og:title["'][^>]*content=["'])[^"']*(["'])/i, `$1${escAttr(title)}$2`)
    .replace(/(<meta[^>]*name=["']twitter:title["'][^>]*content=["'])[^"']*(["'])/i, `$1${escAttr(title)}$2`);
}

/** Replace meta description, og:description and twitter:description. Idempotent; absent tags stay absent. */
export function rewriteDescription(html, description) {
  if (!description) return html;
  return String(html)
    .replace(/(<meta[^>]*name=["']description["'][^>]*content=["'])[^"']*(["'])/i, `$1${escAttr(description)}$2`)
    .replace(/(<meta[^>]*property=["']og:description["'][^>]*content=["'])[^"']*(["'])/i, `$1${escAttr(description)}$2`)
    .replace(/(<meta[^>]*name=["']twitter:description["'][^>]*content=["'])[^"']*(["'])/i, `$1${escAttr(description)}$2`);
}

/** Title + description in one call, from a { title, description } entry (or nothing). */
export function rewriteHead(html, entry) {
  if (!entry) return html;
  return rewriteDescription(rewriteTitle(html, entry.title), entry.description);
}
