/**
 * route-title.mjs — the <title> a client-only route ships in its prerendered SPA shell.
 *
 * prerender.mjs does not snapshot CLIENT_ONLY_FUNCTION_ROUTES (their Functions are absent on
 * Vite preview); it copies dist/index.html to <route>/index.html and rewrote only the canonical.
 * Measured 2026-09-15: all 10 such routes in the sitemap served the HOMEPAGE <title> to crawlers
 * (/art50, /assess, /assessment, /countdown, /health-inventory, /mcp-tools, /receipt, /rlusd,
 * /status, /tool-commons). The per-route title lives in App.tsx ROUTE_TITLES and is only set by
 * JavaScript after hydration, which a crawler does not run.
 *
 * The map is read from App.tsx source with the same patterns client/src/lib/ownerRuling.test.ts
 * uses to guard its copy, so the build and the copy guard parse one thing one way.
 */
const normRoute = (r) => String(r).split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

export function parseRouteTitles(appSource) {
  const block = String(appSource).match(/const ROUTE_TITLES[^=]*=\s*\{([\s\S]*?)\n\};/)?.[1] ?? "";
  const map = new Map();
  for (const m of block.matchAll(/"([^"]*)"\s*:\s*"([^"]*)"/g)) map.set(normRoute(m[1]), m[2]);
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
