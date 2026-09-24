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

// The footer names /terms-of-service as the one current contract. The two
// working aliases remain readable, but must not advertise duplicate canonicals.
//
// The same holds for 27 more addresses measured 2026-09-24: across the live sitemap, each serves
// the same title, description and body as the route it maps to, and each advertised itself as the
// original, so search engines saw duplicate pages. The alias stays readable; its canonical names
// the route the site's own links use most (ties: the more descriptive path; /law over /meok-law,
// which names the sister project on a CSOAI page). client/index.html carries the same map for
// crawlers that run JavaScript; canonical-url.node-test.mjs holds the two copies equal.
export const CANONICAL_ALIAS = new Map([
  ["/terms", "/terms-of-service"],
  ["/legal/terms", "/terms-of-service"],
  ["/meok-law", "/law"],
  ["/csoai-law", "/law"],
  ["/eu-ai-act-explained", "/ai-act-summary"],
  ["/ai-act-vs-gdpr", "/eu-ai-act-vs-gdpr"],
  ["/ai-glossary", "/glossary"],
  ["/ai-governance-guide", "/ai-governance"],
  ["/aug-2026", "/readiness"],
  ["/cobol", "/cobolbridge"],
  ["/open-media", "/commons"],
  ["/connect-ai", "/connect-gspc"],
  ["/framework-crosswalks", "/crosswalks"],
  ["/drift-product", "/drift-audit"],
  ["/white-label", "/embed"],
  ["/legal/founding-council", "/founding-council-agreement"],
  ["/guides/iso-42001", "/iso-42001"],
  ["/guides/nist-ai-rmf", "/nist-ai-rmf"],
  ["/guides/tc260", "/tc260"],
  ["/help-center", "/help"],
  ["/high-risk-ai", "/high-risk-ai-systems"],
  ["/rediscovered", "/lineage"],
  ["/relevance-map", "/map"],
  ["/map-regions", "/regions"],
  ["/mcp-tools", "/tool-commons"],
  ["/prosperity", "/prosperity-fund"],
  ["/real-world", "/world-3d"],
  ["/regulator-atlas", "/regulators"],
  ["/x402-leaderboard", "/x402-board"],
]);

/**
 * Rewrite canonical/og:url/twitter:url values that name this route WITHOUT its trailing slash, or
 * name the bare origin (the shell default), to the served URL. Query-string routes are not rewritten.
 *
 * An alias route that client-redirects (e.g. /coliseum renders <Redirect to="/dashboard">) is
 * snapshotted after the redirect, so its canonical names the alias TARGET without a slash — and
 * that bare path 308s. Measured 2026-09-15 across the sitemap: 14 such canonicals (13 × /dashboard,
 * /faqs → /faq). When `servedRoutes` (normalized routes the prerender writes as dir/index.html) is
 * given, an on-site canonical naming one of them without its slash is rewritten to its served URL.
 * Without `servedRoutes`, other targets are left alone, as before.
 */
export function rewriteCanonical(html, route, origin, servedRoutes = null) {
  if (String(route).includes("?")) return html;
  const r = normRoute(route);
  if (r === "/") return html;
  const target = servedUrl(CANONICAL_ALIAS.get(r) || r, origin);
  const from = new Set([`${origin}${r}`, servedUrl(r, origin), origin, `${origin}/`]);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let out = html;
  for (const f of from) {
    const v = esc(f);
    out = out
      .replace(new RegExp(`(<link[^>]*rel=["']canonical["'][^>]*href=["'])${v}(["'])`, "g"), `$1${target}$2`)
      .replace(new RegExp(`(<meta[^>]*property=["']og:url["'][^>]*content=["'])${v}(["'])`, "g"), `$1${target}$2`)
      .replace(new RegExp(`(<meta[^>]*name=["']twitter:url["'][^>]*content=["'])${v}(["'])`, "g"), `$1${target}$2`);
  }
  if (servedRoutes && servedRoutes.size) {
    const o = esc(origin);
    const toServed = (m, pre, path, post) => {
      const p = normRoute(path);
      return p !== "/" && !path.endsWith("/") && servedRoutes.has(p) ? `${pre}${servedUrl(p, origin)}${post}` : m;
    };
    out = out
      .replace(new RegExp(`(<link[^>]*rel=["']canonical["'][^>]*href=["'])${o}(/[^"'?#]*)(["'])`, "g"), toServed)
      .replace(new RegExp(`(<meta[^>]*property=["']og:url["'][^>]*content=["'])${o}(/[^"'?#]*)(["'])`, "g"), toServed)
      .replace(new RegExp(`(<meta[^>]*name=["']twitter:url["'][^>]*content=["'])${o}(/[^"'?#]*)(["'])`, "g"), toServed);
  }
  return out;
}
