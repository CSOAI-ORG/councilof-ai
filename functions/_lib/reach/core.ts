/**
 * Reach engine — shared core for the entity pages (/mcp-servers/, /agent-cards/, /x402/,
 * /stablecoins/<asset>/<chain>/, /notes/daily/), their JSON twins, the per-type sitemaps and the
 * records feeds.
 *
 * WHY FUNCTIONS, NOT FILES. The site sits a few hundred files under the Pages 20,000-file cap, and
 * there are thousands of measured entities. Each page is rendered at request time from records that
 * are already published and signed (Hugging Face datasets, /reach/v1/ shards copied from signed
 * records, /interop/ cards), then held in the Cache API.
 *
 * THE RULES EVERY PAGE KEEPS (tested in functions/_lib/reach/reach.test.ts):
 *  - declared vs observed, the dates, the evidence level, and a line saying the page says nothing
 *    about security, quality or safety;
 *  - the objection route https://councilof.ai/census/ and a note that the operator can add context;
 *  - no scores, ranks or grades, and no certification wording;
 *  - UNMEASURED / UNCHECKABLE shown as such, in words, never as a colour alone;
 *  - a finding with a pending correction is withheld and the correction is shown instead;
 *  - an entity on the census exclusion list or behind a robots.txt refusal has no page;
 *  - when a source cannot be read the answer is 503 with Retry-After — never a page built from
 *    nothing, and never a 404 that would tell a crawler the entity does not exist.
 */

export const SITE = "https://councilof.ai";
export const CENSUS_URL = `${SITE}/census/`;
export const RENDER_VERSION = "reach-1";
export const PAGE_TTL_S = 900;
export const SOURCE_TTL_S = 900;
export const LICENSE = "https://creativecommons.org/licenses/by/4.0/";

export type Json = Record<string, unknown>;

export interface Env {
  ASSETS?: { fetch: (req: Request | string) => Promise<Response> };
  CF_PAGES_COMMIT_SHA?: string;
}
export interface Ctx {
  request: Request;
  env: Env;
  params?: Record<string, string | string[]>;
  waitUntil?: (p: Promise<unknown>) => void;
}

export const esc = (s: unknown): string =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** A published source could not be read or did not verify. Rendered as 503, never as a page. */
export class SourceError extends Error {
  constructor(public source: string, public detail: string) {
    super(`${source}: ${detail}`);
  }
}

/** The entity is not in the published data (or is opted out). Rendered as 404. */
export class NotFound extends Error {
  constructor(public what: string) {
    super(what);
  }
}

const cacheOf = (): Cache | null => {
  try {
    return (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default ?? null;
  } catch {
    return null;
  }
};

/** GET a published source with the Cache API in front. Throws SourceError on anything but 200. */
export async function fetchSource(ctx: Ctx, url: string, source: string, ttl = SOURCE_TTL_S): Promise<Uint8Array> {
  const cache = cacheOf();
  const key = new Request(url, { method: "GET" });
  if (cache) {
    try {
      const hit = await cache.match(key);
      if (hit && hit.ok) return new Uint8Array(await hit.arrayBuffer());
    } catch {
      /* a cache fault is a miss, not an error */
    }
  }
  let r: Response;
  try {
    r = await fetch(url, { headers: { "user-agent": "councilof.ai reach-engine (+https://councilof.ai/census/)" }, signal: AbortSignal.timeout(20_000) });
  } catch (e) {
    throw new SourceError(source, `fetch failed: ${(e as Error).message}`.slice(0, 160));
  }
  if (!r.ok) throw new SourceError(source, `HTTP ${r.status}`);
  const body = new Uint8Array(await r.arrayBuffer());
  if (cache) {
    const put = cache.put(key, new Response(body, { headers: { "cache-control": `public, max-age=${ttl}` } })).catch(() => undefined);
    if (ctx.waitUntil) ctx.waitUntil(put);
  }
  return body;
}

/** A same-origin static file (e.g. /reach/v1/mcp/3.json) through the Pages ASSETS binding. */
export async function fetchStaticJson<T = Json>(ctx: Ctx, path: string, source: string): Promise<T> {
  let r: Response;
  try {
    const req = new Request(new URL(path, SITE).toString(), { method: "GET" });
    r = ctx.env?.ASSETS ? await ctx.env.ASSETS.fetch(req) : await fetch(new URL(path, ctx.request.url).toString());
  } catch (e) {
    throw new SourceError(source, `fetch failed: ${(e as Error).message}`.slice(0, 160));
  }
  if (!r.ok) throw new SourceError(source, `HTTP ${r.status}`);
  const text = await r.text();
  if (/^\s*</.test(text)) throw new SourceError(source, "served HTML where JSON was expected (not published)");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new SourceError(source, "body is not JSON");
  }
}

export const utf8 = (b: Uint8Array) => new TextDecoder().decode(b);

export async function gunzip(b: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("gzip");
  const stream = new Blob([b as unknown as BlobPart]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function sha256Hex(b: Uint8Array | string): Promise<string> {
  const bytes = typeof b === "string" ? new TextEncoder().encode(b) : b;
  const d = await crypto.subtle.digest("SHA-256", bytes as unknown as BufferSource);
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const jsonl = (text: string): Json[] =>
  text.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l) as Json);

/* ------------------------------------------------------------------ states */

export const STATE_MEANING: Record<string, string> = {
  CONSISTENT: "every public statement read agrees with what was observed",
  INCONSISTENT: "two public statements disagree; this does not say which one is true",
  SINGLE_SURFACE: "only one surface states this, so there is nothing to compare",
  UNCHECKABLE: "a comparison was attempted but could not be made",
  UNMEASURED: "not measured by the records this page reads",
  NOT_A_SUPPLY_CLAIM: "the issuer's page states no figure here, so nothing is compared",
  VERIFIED: "the card's signature verified",
  FAILED: "a signature was present and did not verify",
  NO_SIGNATURES: "the card carries no signature",
  CARD_SERVED: "a card was served at the listed address",
  RESPONDED: "the server answered MCP discovery",
  AUTH_REQUIRED: "the server asked for credentials before discovery",
  DELIVERED: "one paid request was delivered",
  WITHHELD: "withheld while a correction is pending",
};

export function badge(state: unknown): string {
  const s = String(state ?? "UNMEASURED") || "UNMEASURED";
  const cls = /^(UNMEASURED|UNCHECKABLE|WITHHELD)$/.test(s) ? "st st-u" : s === "INCONSISTENT" || s === "FAILED" ? "st st-i" : "st";
  const title = STATE_MEANING[s] ? ` title="${esc(STATE_MEANING[s])}"` : "";
  return `<span class="${cls}"${title}>${esc(s)}</span>`;
}

export const dateOnly = (iso: unknown): string => (typeof iso === "string" && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : "not recorded");

/* ------------------------------------------------------------------- pages */

export interface Crumb {
  href?: string;
  label: string;
}

export interface PageSpec {
  title: string;
  description: string;
  canonical: string; // absolute
  twin?: string; // absolute URL of the JSON twin
  crumbs: Crumb[];
  h1: string;
  lede?: string;
  body: string;
  jsonld?: Json | Json[];
  subjectLabel: string; // "this server", "this deployment"...
  evidence?: string; // one-line evidence level
  noindex?: boolean;
}

export const DOCTRINE_LINE = (subject: string) =>
  `This page is a measurement of what was declared against what was observed. It says nothing about the security, quality or safety of ${subject}, and it is not a certification, rating, ranking or endorsement.`;

export const OBJECTION_HTML = (subject: string) =>
  `<p>If a row about ${esc(subject)} is wrong or out of date, or you want it re-checked or excluded, use the objection route at <a href="${CENSUS_URL}">${CENSUS_URL}</a> or write to <a href="mailto:nicholas@csoai.org">nicholas@csoai.org</a>. The operator can add context there; what they send is recorded with the next census run. Corrections are dated in the <a href="/corrections/">corrections ledger</a>.</p>`;

const CSS = `:root{color-scheme:light dark;--fg:#111418;--bg:#ffffff;--mut:#4a5058;--line:#d9dde3;--soft:#f4f6f8;--u:#8a4b00;--i:#8f1d1d;--ok:#1f5f3a;--link:#0b4fa8}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--fg:#e8eaed;--bg:#0f1115;--mut:#aab0b8;--line:#2c313a;--soft:#171a20;--u:#f0b35a;--i:#f19a9a;--ok:#8fd3a8;--link:#8ab8ff}}
:root[data-theme="dark"]{--fg:#e8eaed;--bg:#0f1115;--mut:#aab0b8;--line:#2c313a;--soft:#171a20;--u:#f0b35a;--i:#f19a9a;--ok:#8fd3a8;--link:#8ab8ff}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--link)}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--link);outline-offset:2px}
.skip{position:absolute;left:-9999px}.skip:focus{left:16px;top:8px;background:var(--bg);padding:.4rem .6rem;z-index:9}
header.site,footer.site,main,nav.crumbs{max-width:62rem;margin:0 auto;padding:0 16px}
header.site{display:flex;flex-wrap:wrap;gap:.25rem 1rem;align-items:baseline;padding-top:1rem;padding-bottom:.5rem;border-bottom:1px solid var(--line)}
header.site .brand{font-weight:700;text-decoration:none;color:var(--fg)}header.site .tag{color:var(--mut);font-size:.9rem}
nav.crumbs ol{list-style:none;margin:.75rem 0 0;padding:0;display:flex;flex-wrap:wrap;gap:.25rem;font-size:.9rem;color:var(--mut)}
nav.crumbs li+li:before{content:"/";margin-right:.25rem}
main{padding-bottom:3rem}h1{font-size:1.6rem;line-height:1.25;margin:1rem 0 .5rem;overflow-wrap:anywhere}
h2{font-size:1.15rem;margin:2rem 0 .5rem;padding-bottom:.25rem;border-bottom:1px solid var(--line)}h3{font-size:1rem;margin:1.25rem 0 .25rem;overflow-wrap:anywhere}
p,li{overflow-wrap:anywhere}.lede{color:var(--mut)}.mut{color:var(--mut);font-size:.92rem}
.box{background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:.75rem 1rem;margin:1rem 0}
.box.warn{border-color:var(--u)}.box h2{margin-top:0}
.st{display:inline-block;font:600 .78rem/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;border:1px solid var(--line);border-radius:4px;padding:0 .35rem;color:var(--ok);white-space:nowrap}
.st-u{color:var(--u);border-color:var(--u)}.st-i{color:var(--i);border-color:var(--i)}
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:.5rem 0}
table{border-collapse:collapse;width:100%;font-size:.92rem}caption{text-align:left;color:var(--mut);font-size:.88rem;padding:.25rem 0}
th,td{border-bottom:1px solid var(--line);padding:.4rem .5rem;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{font-weight:600}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.86rem;overflow-wrap:anywhere}
dl.kv{display:grid;grid-template-columns:minmax(8rem,max-content) 1fr;gap:.25rem 1rem;margin:.5rem 0}dl.kv dt{color:var(--mut)}dl.kv dd{margin:0;overflow-wrap:anywhere}
@media (max-width:40rem){dl.kv{grid-template-columns:1fr}dl.kv dd{margin-bottom:.4rem}}
footer.site{border-top:1px solid var(--line);margin-top:2rem;padding-top:1rem;padding-bottom:2rem;color:var(--mut);font-size:.9rem}`;

export const ldJson = (x: unknown) => JSON.stringify(x).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

export function renderPage(p: PageSpec): string {
  const crumbs = p.crumbs
    .map((c, i) => (i === p.crumbs.length - 1 || !c.href ? `<li aria-current="page">${esc(c.label)}</li>` : `<li><a href="${esc(c.href)}">${esc(c.label)}</a></li>`))
    .join("");
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: p.crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: c.href ? new URL(c.href, SITE).toString() : p.canonical })),
  };
  const ld = [...(Array.isArray(p.jsonld) ? p.jsonld : p.jsonld ? [p.jsonld] : []), breadcrumbLd];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
${p.noindex ? '<meta name="robots" content="noindex">\n' : ""}<link rel="canonical" href="${esc(p.canonical)}">
${p.twin ? `<link rel="alternate" type="application/json" title="Machine-readable twin" href="${esc(p.twin)}">\n` : ""}<link rel="alternate" type="application/atom+xml" title="Council of AI — new records (Atom)" href="${SITE}/feeds/records.xml">
<link rel="alternate" type="application/feed+json" title="Council of AI — new records (JSON Feed)" href="${SITE}/feeds/records.json">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Council of AI">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${esc(p.canonical)}">
<meta property="og:image" content="${SITE}/og-image.png">
${ld.map((x) => `<script type="application/ld+json">${ldJson(x)}</script>`).join("\n")}
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site"><a class="brand" href="/">Council of AI</a><span class="tag">measurement, not certification</span></header>
<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs}</ol></nav>
<main id="main">
<h1>${esc(p.h1)}</h1>
${p.lede ? `<p class="lede">${p.lede}</p>` : ""}
<div class="box" role="note" aria-label="What this page is">
<p><strong>What this page is.</strong> ${esc(DOCTRINE_LINE(p.subjectLabel))}</p>
${p.evidence ? `<p class="mut"><strong>Evidence level:</strong> ${p.evidence}</p>` : ""}
</div>
${p.body}
<h2 id="object">Object, correct or add context</h2>
${OBJECTION_HTML(p.subjectLabel)}
${p.twin ? `<p class="mut">Machine-readable twin of this page: <a href="${esc(p.twin)}">${esc(p.twin)}</a>. New records: <a href="/feeds/records.xml">Atom</a> · <a href="/feeds/records.json">JSON Feed</a>.</p>` : ""}
</main>
<footer class="site"><p>Council of AI is operated by CSOAI Ltd (England &amp; Wales, Companies House 16939677). We measure; we do not certify. Data: CC BY 4.0. <a href="/methodology">Methodology</a> · <a href="/corrections/">Corrections</a> · <a href="/census/">Census crawler and objections</a></p></footer>
</body>
</html>
`;
}

/* --------------------------------------------------------------- responses */

const weakEtag = async (body: string) => `W/"${(await sha256Hex(body)).slice(0, 32)}"`;
const httpDate = (iso: string | null | undefined) => {
  const d = iso ? new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso) : null;
  return d && !isNaN(d.getTime()) ? d.toUTCString() : null;
};

export interface Rendered {
  status: number;
  body: string;
  contentType: string;
  lastModified?: string | null; // ISO — the data's own date, never "now"
  headers?: Record<string, string>;
}

/** 200/304 with ETag and Last-Modified; HEAD gets headers only. */
export async function respond(req: Request, r: Rendered): Promise<Response> {
  const headers: Record<string, string> = {
    "content-type": r.contentType,
    "cache-control": r.status === 200 ? `public, max-age=${PAGE_TTL_S}` : "no-store",
    "access-control-allow-origin": "*",
    "x-content-type-options": "nosniff",
    ...(r.headers || {}),
  };
  if (r.status === 200) {
    const etag = await weakEtag(r.body);
    headers.etag = etag;
    const lm = httpDate(r.lastModified);
    if (lm) headers["last-modified"] = lm;
    const inm = req.headers.get("if-none-match");
    const ims = req.headers.get("if-modified-since");
    const notModified =
      (inm && inm.split(",").map((s) => s.trim()).some((t) => t === etag || t === "*")) ||
      (!inm && ims && lm && new Date(ims).getTime() >= new Date(lm).getTime());
    if (notModified) return new Response(null, { status: 304, headers });
  }
  return new Response(req.method === "HEAD" ? null : r.body, { status: r.status, headers });
}

export function errorPage(status: 404 | 503 | 405, what: string, detail: string, retryAfter?: number): Rendered {
  const title = status === 503 ? "Source temporarily unavailable" : status === 404 ? "Not in the published records" : "Method not allowed";
  const msg =
    status === 503
      ? `The published record this page is rendered from could not be read just now (${esc(detail)}). Nothing is shown rather than a page built without it. Please retry in about ${Math.round((retryAfter ?? 120) / 60)} minutes.`
      : status === 404
        ? `${esc(what)} is not in the published records this page reads, or its operator has opted out. That is not a finding about it.`
        : "Only GET and HEAD are served here.";
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} — Council of AI</title><style>${CSS}</style></head><body><a class="skip" href="#main">Skip to content</a><header class="site"><a class="brand" href="/">Council of AI</a><span class="tag">measurement, not certification</span></header><main id="main"><h1>${esc(title)}</h1><p>${msg}</p><p class="mut">Objections, re-checks and opt-outs: <a href="${CENSUS_URL}">${CENSUS_URL}</a></p></main></body></html>`;
  return {
    status,
    body,
    contentType: "text/html; charset=utf-8",
    headers: status === 503 ? { "retry-after": String(retryAfter ?? 120) } : status === 405 ? { allow: "GET, HEAD" } : {},
  };
}

export function errorJson(status: 404 | 503 | 405, what: string, detail: string, retryAfter?: number): Rendered {
  return {
    status,
    body: JSON.stringify({
      schema: "csoai.reach-error/0.1",
      status,
      state: status === 503 ? "SOURCE_UNAVAILABLE" : status === 404 ? "NOT_IN_PUBLISHED_RECORDS" : "METHOD_NOT_ALLOWED",
      subject: what,
      detail,
      retry_after_s: status === 503 ? (retryAfter ?? 120) : undefined,
      note: status === 503 ? "Nothing is returned rather than an answer built without its source. Retry later." : status === 404 ? "Absence from these records is not a finding." : undefined,
      objections: CENSUS_URL,
    }, null, 1),
    contentType: "application/json; charset=utf-8",
    headers: status === 503 ? { "retry-after": String(retryAfter ?? 120) } : {},
  };
}

/**
 * The one entry point every reach route uses: method check, page cache, render, error mapping.
 * `render` throws NotFound or SourceError; anything else is a 503 too (never a half page).
 */
export async function serve(ctx: Ctx, kind: "html" | "json" | "xml", render: () => Promise<Rendered>): Promise<Response> {
  const req = ctx.request;
  const mkErr = kind === "json" ? errorJson : errorPage;
  if (req.method !== "GET" && req.method !== "HEAD") return respond(req, mkErr(405, "", "method"));
  const cache = cacheOf();
  const url = new URL(req.url);
  // The deploy's commit is part of the key, so a new template never serves an old deploy's cached page.
  const deploy = String(ctx.env?.CF_PAGES_COMMIT_SHA || "").slice(0, 12);
  const key = new Request(`${url.origin}${url.pathname}?__reach=${RENDER_VERSION}-${deploy}`, { method: "GET" });
  if (cache) {
    try {
      const hit = await cache.match(key);
      if (hit && hit.status === 200) {
        const body = await hit.text();
        return respond(req, { status: 200, body, contentType: hit.headers.get("content-type") || "text/html; charset=utf-8", lastModified: hit.headers.get("x-reach-last-modified"), headers: { "x-reach-cache": "hit" } });
      }
    } catch {
      /* miss */
    }
  }
  let out: Rendered;
  try {
    out = await render();
  } catch (e) {
    if (e instanceof NotFound) out = mkErr(404, e.what, "not in the published records");
    else if (e instanceof SourceError) out = mkErr(503, e.source, e.detail, 120);
    else out = mkErr(503, "render", (e as Error)?.message?.slice(0, 160) || "unexpected error", 120);
  }
  if (out.status === 200 && cache) {
    const stored = new Response(out.body, {
      headers: { "content-type": out.contentType, "cache-control": `public, max-age=${PAGE_TTL_S}`, ...(out.lastModified ? { "x-reach-last-modified": out.lastModified } : {}) },
    });
    const put = cache.put(key, stored).catch(() => undefined);
    if (ctx.waitUntil) ctx.waitUntil(put);
  }
  return respond(req, out);
}

export const param = (ctx: Ctx, name: string): string => {
  const v = ctx.params?.[name];
  return decodeURIComponent(String(Array.isArray(v) ? v[0] : v ?? "")).trim();
};

/** Hosts in page keys: lower-case DNS names only (no scheme, port, path or spaces). */
export const HOST_RE = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

/** A bare path (no trailing slash) is 308'd to the slash form; the slash form is canonical. */
export function slashRedirect(req: Request): Response | null {
  const u = new URL(req.url);
  if (u.pathname.endsWith("/") || u.pathname.endsWith(".json") || u.pathname.endsWith(".xml")) return null;
  return new Response(null, { status: 308, headers: { location: `${u.pathname}/${u.search}` } });
}

export function datasetLd(o: {
  name: string;
  description: string;
  url: string;
  isBasedOn: string[];
  dateModified?: string | null;
  temporalCoverage?: string | null;
  variableMeasured?: string[];
  about?: Json;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: o.name,
    description: o.description,
    url: o.url,
    isBasedOn: o.isBasedOn,
    ...(o.dateModified ? { dateModified: o.dateModified } : {}),
    ...(o.temporalCoverage ? { temporalCoverage: o.temporalCoverage } : {}),
    ...(o.variableMeasured?.length ? { variableMeasured: o.variableMeasured } : {}),
    ...(o.about ? { about: o.about } : {}),
    measurementTechnique: "Declared vs observed comparison of public statements (Council of AI census instruments)",
    license: LICENSE,
    isAccessibleForFree: true,
    creator: { "@id": `${SITE}/#org`, "@type": "Organization", name: "Council of AI", legalName: "CSOAI LTD" },
    publisher: { "@id": `${SITE}/#org`, "@type": "Organization", name: "Council of AI" },
  };
}
