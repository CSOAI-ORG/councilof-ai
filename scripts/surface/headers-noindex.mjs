/**
 * headers-noindex.mjs — which paths does the edge tell crawlers not to index?
 *
 * Cloudflare Pages applies public/_headers at the edge. A block whose path pattern carries
 * `X-Robots-Tag: ... noindex` makes every matching URL non-indexable, whatever its HTML says.
 * The sitemap must not ask a crawler to index those URLs: a listed URL that answers noindex is
 * reported by search consoles as "Submitted URL marked 'noindex'".
 *
 * Measured live 2026-11-17 with a browser user agent: 13 URLs in /sitemap.xml answered
 * `X-Robots-Tag: noindex, nofollow`, all under /interop/:report/mirrors/* — the captured copies
 * of third-party pages (Tether, Franklin Templeton, Circle, Ethena and others) that the
 * _headers comment says "no search engine should index under this domain". The generator had
 * excluded a hand-kept subset of mirror ids instead of reading the rule the edge applies.
 *
 * Pattern syntax (Pages _headers, same matching as _redirects): a `*` splat matches any
 * characters including "/", a `:placeholder` matches one path segment. Absolute-URL patterns
 * (https://host/...) name other hosts and are ignored here; `! Header` lines detach a header
 * and are ignored. Only path patterns starting with "/" are returned.
 */

/** Parse _headers text into the path patterns whose block sets an X-Robots-Tag containing noindex. */
export function noindexPatterns(text) {
  const out = [];
  let pattern = null;
  for (const raw of String(text).split("\n")) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    if (!/^\s/.test(raw)) {
      pattern = raw.trim();
      continue;
    }
    if (!pattern || !pattern.startsWith("/")) continue;
    const m = raw.trim().match(/^x-robots-tag\s*:\s*(.+)$/i);
    if (m && /\bnoindex\b/i.test(m[1]) && !out.some((r) => r.pattern === pattern)) {
      out.push({ pattern, re: patternToRegExp(pattern) });
    }
  }
  return out;
}

/** "/interop/:report/mirrors/*" -> /^\/interop\/[^/]+\/mirrors\/.*$/ */
export function patternToRegExp(pattern) {
  let src = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "*") { src += ".*"; continue; }
    if (ch === ":" && /[A-Za-z_]/.test(pattern[i + 1] || "")) {
      while (i + 1 < pattern.length && /[A-Za-z0-9_]/.test(pattern[i + 1])) i++;
      src += "[^/]+";
      continue;
    }
    src += ch.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${src}$`);
}

/** The first noindex rule a site path matches, or null. */
export function noindexRuleFor(rules, path) {
  return rules.find((r) => r.re.test(path)) || null;
}
