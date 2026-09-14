/**
 * canonical-url.mjs — the canonical URL of a page is the URL the edge SERVES it at.
 *
 * Measured 2026-09-14 across the live sitemap (513 pages answering 200): 29 canonicals pointed at
 * the page itself, 305 pointed at the slashless path (which 308s to the trailing-slash URL the
 * prerender writes as dir/index.html), and ~110 client-only SPA shells carried the homepage
 * canonical copied from index.html — telling crawlers those pages duplicate the homepage.
 *
 * Every prerendered route except "/" is written to <route>/index.html, and generate-redirects.mjs
 * 308s the bare path to "<route>/". So the served URL is origin + "/<route>/".
 */
export function normRoute(route) {
  return String(route).split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
}

/** Served URL for a route written as a directory index. "/" → origin (no trailing slash). */
export function servedUrl(route, origin) {
  const r = normRoute(route);
  return r === "/" ? origin : `${origin}${r}/`;
}

/**
 * Rewrite canonical/og:url/twitter:url values that name this route WITHOUT its trailing slash, or
 * name the bare origin (the shell default), to the served URL. Values pointing anywhere else
 * (a real alias target such as /dashboard) are left alone. Query-string routes are not rewritten.
 */
export function rewriteCanonical(html, route, origin) {
  if (String(route).includes("?")) return html;
  const r = normRoute(route);
  if (r === "/") return html;
  const target = servedUrl(r, origin);
  const from = new Set([`${origin}${r}`, origin, `${origin}/`]);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let out = html;
  for (const f of from) {
    const v = esc(f);
    out = out
      .replace(new RegExp(`(<link[^>]*rel=["']canonical["'][^>]*href=["'])${v}(["'])`, "g"), `$1${target}$2`)
      .replace(new RegExp(`(<meta[^>]*property=["']og:url["'][^>]*content=["'])${v}(["'])`, "g"), `$1${target}$2`)
      .replace(new RegExp(`(<meta[^>]*name=["']twitter:url["'][^>]*content=["'])${v}(["'])`, "g"), `$1${target}$2`);
  }
  return out;
}
