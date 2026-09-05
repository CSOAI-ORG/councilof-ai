#!/usr/bin/env node
/**
 * generate-sitemap.mjs — builds public/sitemap.xml from client/src/App.tsx
 *
 * Parses `<Route path="...">` declarations (static string paths only), drops
 * :param routes, duplicates, and auth/admin/legacy junk, then emits a sitemap
 * with real lastmod (today) and hand-tuned priorities for flagship surfaces.
 *
 * Run: node scripts/generate-sitemap.mjs   (wired into `npm run build:client`)
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP_TSX = join(ROOT, "client/src/App.tsx");
const PERSONA_TSX = join(ROOT, "client/src/pages/PersonaRouter.tsx");
const INDUSTRIES_TS = join(ROOT, "client/src/data/industries.ts");
const OUT = join(ROOT, "public/sitemap.xml");
const BASE = "https://councilof.ai";

// --- Reconcile against _redirects (nav-integrity audit, 2026-08-26) -------------
// A sitemap URL that answers 3xx is a defect: 42 of 423 did on the last count — 4 of
// them 308'd to the homepage, 36 to their own trailing-slash canonical. The sitemap
// must list what the edge actually SERVES, so read the rules and either rewrite the
// entry to its canonical target or drop it. generate-redirects.mjs runs FIRST in
// build:client so the file read here is this build's, never the previous one's.
const REDIRECTS_FILE = join(ROOT, "public/_redirects");
const redirectRules = new Map();
try {
  for (const raw of readFileSync(REDIRECTS_FILE, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [from, to, code] = line.split(/\s+/);
    if (!from || !to || !from.startsWith("/") || from.includes("*")) continue;
    if (Number(code) >= 300 && Number(code) < 400) redirectRules.set(from, to);
  }
} catch {
  console.warn("[sitemap] no public/_redirects to reconcile against");
}

/**
 * "/pricing" -> "/pricing/"  (canonical trailing-slash prerender: keep, rewritten)
 * "/enterprise" -> "/?lobby=..."  (lands somewhere else entirely: drop)
 * anything else: keep as-is.
 */
function canonicalise(path) {
  // A Pages Function that forwards wins over everything: the edge never serves this path.
  if (functionRedirectRules.has(path)) {
    const fnTo = functionRedirectRules.get(path);
    return fnTo === path + "/" ? canonicaliseOnce(fnTo) : null;
  }
  return canonicaliseOnce(path);
}

/** One _redirects hop, then a final check that the destination itself serves. */
function canonicaliseOnce(path) {
  const to = redirectRules.get(path);
  if (!to) return functionRedirectRules.has(path) ? null : path;
  if (to !== path + "/") return null; // lands somewhere else entirely — drop
  // The trailing-slash form is canonical ONLY if something actually serves it. /watchdog ->
  // /watchdog/ is a real _redirects rule, but /watchdog/ is answered by a function that 308s
  // to /os?lobby=home, so the rewritten URL is no more listable than the original.
  return functionRedirectRules.has(to) ? null : to;
}


// --- Redirects implemented as Pages Functions (audit 2026-09-05) -------------
// canonicalise() above reconciles against public/_redirects, which is the only redirect source
// it ever knew about. But 29 retired routes redirect from a Pages FUNCTION instead — e.g.
// functions/about-credential.ts returns `new Response(null, {status: 308, headers:{location:
// "/honesty/"}})`. Those rules never appear in _redirects, so canonicalise() saw no rule,
// returned the path unchanged, and the sitemap advertised 29 URLs that 308 away.
//
// Measured against the LIVE site before and after: 67 of 413 sitemap URLs answered 308.
// 38 were blog articles (handled below), 29 were these.
//
// The scan is deliberately narrow: a function file counts only if it returns an explicit 3xx
// status. A function that merely mentions a 3xx in a comment or handles one branch of a
// redirect is not matched, because the regex requires the status literal in a Response init.
const functionRedirectRules = new Map();
function noteFunctionRedirect(path, target) {
  if (!functionRedirectRules.has(path)) functionRedirectRules.set(path, target);
}
function scanFunctionRedirects(dir, urlPrefix = "") {
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      scanFunctionRedirects(full, `${urlPrefix}/${e.name}`);
      continue;
    }
    if (!e.name.endsWith(".ts") || e.name.endsWith(".test.ts")) continue;
    let src = "";
    try {
      src = readFileSync(full, "utf8");
    } catch {
      continue;
    }
    // Two spellings, both real in this tree:
    //   new Response(null, { status: 308, headers: { location: "/honesty/" } })
    //   Response.redirect(scoreboardDestination(request).toString(), 308)
    // The second has no statically knowable target, so it is recorded with target null and
    // treated as "forwards somewhere" — which is all a sitemap needs to know to drop it.
    // Matching only `status: 3xx` missed /gspc-scoreboard and /os, both of which 308.
    const hasStatus3xx = /status:\s*3\d\d/.test(src);
    const hasRedirectCall = /Response\.redirect\s*\(/.test(src);
    if (!hasStatus3xx && !hasRedirectCall) continue;
    const loc = src.match(/location:\s*["'`]([^"'`]+)["'`]/i);
    const target = loc ? loc[1] : null;
    const base = e.name.replace(/\.ts$/, "");
    if (base === "index") {
      // functions/watchdog/index.ts answers BOTH /watchdog and /watchdog/. Registering only the
      // bare form let /watchdog/ through: canonicalise rewrote /watchdog -> /watchdog/ via a
      // _redirects rule and never rechecked the result, so a path that 308s to /os?lobby=home
      // stayed in the sitemap.
      noteFunctionRedirect(urlPrefix || "/", target);
      noteFunctionRedirect(`${urlPrefix}/`, target);
    } else {
      noteFunctionRedirect(`${urlPrefix}/${base}`, target);
    }
  }
}
scanFunctionRedirects(join(ROOT, "functions"));

// --- Priority tiers -------------------------------------------------------
const P_TOP = 0.9; // flagship public surfaces
const P_HIGH = 0.8; // high-value product/learn pages
const P_DEFAULT = 0.6;
const P_LOW = 0.4; // legal / policy pages

const PRIORITY = new Map([
  ["/", 1.0],
  // /pricing and /certification are Functions door hops (OS Assess / honesty).
  // Rank the live destinations, not the hop URLs.
  ["/os", P_TOP],
  ["/honesty", P_TOP],
  ["/gspc-arena", P_TOP],
  ["/layer0", P_TOP],
  ["/refutation-ledger", P_TOP],
  ["/dispute", P_TOP],
  ["/methodology", P_TOP],
  ["/gspc-verify", P_TOP],
  ["/gspc-anchors", P_HIGH],
  ["/gspc-gap-map", P_HIGH],
  ["/instrument", P_HIGH],
  ["/tour", P_HIGH],
  ["/learn", P_HIGH],
  ["/article-50", P_HIGH],
  ["/benchmarks", P_HIGH],
  ["/benchmark-index", P_HIGH],
  ["/benchmark-quality", P_HIGH],
  ["/provenance-finding", P_HIGH],
  ["/enterprise", P_HIGH],
  ["/government", P_HIGH],
  ["/regulators", P_HIGH],
  ["/about", P_HIGH],
  ["/contact", P_HIGH],
  ["/blog", P_HIGH],
]);

const CHANGEFREQ = new Map([
  ["/status", "hourly"],
  ["/blog", "daily"],
  ["/", "weekly"],
]);

// Routes intentionally sent to ContentReviewNotice are withdrawn, not public
// catalogue entries. Derive this set from App.tsx so a newly quarantined route
// cannot remain advertised to crawlers by accident.
const src = readFileSync(APP_TSX, "utf8");
const reviewNoticePaths = new Set(
  [...src.matchAll(/<Route\b[^>]*?\bpath="([^"]+)"[^>]*?\bcomponent=\{ContentReviewNotice\}/g)]
    .map((match) => match[1]),
);

// --- Junk / legacy / non-indexable filters --------------------------------
const EXCLUDE_EXACT = new Set([
  "/404",
  "/login",
  "/signup",
  "/register",
  "/welcome",
  "/enter",
  "/join",
  "/start",
  "/onboard",
  "/me",
  "/my-applications",
  "/my-courses",
  "/api-keys",
  "/bulk-import",
  "/widget",
  "/egg",
  "/hatch",
  "/ab-testing",
  "/workbench",
  "/command-center",
  "/admin",
  "/dashboard",
  "/enterprise-dashboard",
  "/enterprise-onboarding",
  "/government-dashboard",
  "/region-settings",
  "/regional-analytics",
  "/outreach",
  "/report",
  "/reports",
  "/marketing",
  "/brief",
  "/public",
  // 2026-08-13 Part CJ: legacy sovereign-class redirects — sitemap lists canonical URLs only
  "/sovereign",
  "/sovereign-network",
  "/gspc-arena?view=towns",
  "/sovereign-space",
  "/sovereign-pricing",
  "/sovereign-twin",
  "/sov-space",
  "/sov-towns",
  "/sov3",
  "/sov3-model-card",
  "/sov3-system-card",
  "/sov3-whitepaper",
  "/sov-town-lab",
  "/about-ceasai",
  "/ceasai-training",
  "/simulate",
  // legacy / shadow surfaces
  "/old-home",
  "/landing",
  "/legacy",
  "/pricing-legacy",
  "/poc",
  "/humanoids-poc",
  // internal-codename pages, not for index
  "/gods-eye",
  "/horus",
  "/dragonfly",
  "/maternal-covenant",
  "/covenant",
  // Audit 2026-08-14 kills/redirects — these paths are now 308s, must NOT be in the sitemap.
  "/byzantine",
  "/byzantine-consensus",
  "/bft",
  "/consensus",
  "/jewels",
  "/crown-jewels",
  "/plans",
  "/enterprise-plans",
]);

const EXCLUDE_PREFIX = [
  "/settings",
  "/dashboard/",
  "/certification/exam",
  "/certification/results",
  "/certification/review",
];

/**
 * Asset extensions that can appear as a wouter <Route> but are never an indexable page.
 * `.txt` is deliberately NOT here: /llms.txt is an intentional AI-discovery surface that
 * answers 200 and is listed on purpose. The rule targets deleted scripts and binary assets,
 * not every non-HTML file — an earlier version included txt and dropped llms.txt, which the
 * sitemap-truth-gate caught.
 */
const NON_PAGE_EXT = /\.(?:js|mjs|cjs|css|map|ico|png|jpe?g|svg|webp|gif|woff2?|ttf)$/i;

function isJunk(path) {
  if (reviewNoticePaths.has(path)) return true;
  if (EXCLUDE_EXACT.has(path)) return true;
  // A sitemap lists pages, never scripts or assets. /stripe-checkout.js is declared as a route
  // in route-manifest.ts and was therefore emitted; it answers 410 Gone, because Stripe was
  // removed from this estate on purpose. Advertising a deleted script for indexing is wrong
  // whatever it answers, so the rule is by kind rather than by status — and it is general,
  // so the next asset route added does not repeat this.
  if (NON_PAGE_EXT.test(path)) return true;
  return EXCLUDE_PREFIX.some((p) => path === p || path.startsWith(p));
}

function priorityFor(path) {
  if (PRIORITY.has(path)) return PRIORITY.get(path);
  // The six audience pages and the industry pages are entry surfaces, not archive.
  if (path.startsWith("/for/") || path.startsWith("/industries/")) return P_HIGH;
  if (path.startsWith("/legal/") || /privacy|terms|cookie|disclaimer|sla|dpa|agreement/.test(path))
    return P_LOW;
  return P_DEFAULT;
}

function changefreqFor(path) {
  if (CHANGEFREQ.has(path)) return CHANGEFREQ.get(path);
  if (path.startsWith("/legal/")) return "monthly";
  return "weekly";
}

// --- Parse routes ---------------------------------------------------------
const routeRe = /<Route\b[^>]*?\bpath="([^"]+)"/g;
const seen = new Set();
const paths = [];
let skippedParams = 0;
let skippedJunk = 0;
let m;
while ((m = routeRe.exec(src)) !== null) {
  const p = m[1].trim();
  if (!p.startsWith("/")) continue;
  if (p.includes(":")) {
    skippedParams++;
    continue;
  }
  if (seen.has(p)) continue;
  seen.add(p);
  if (isJunk(p)) {
    skippedJunk++;
    continue;
  }
  paths.push(p);
}
// Library IA: the /library/:sector pages are dynamic routes (skipped above as :param) but are
// prime AEO citation surface — one sector-organized archive index each. List them explicitly.
for (const s of ["regulation", "regions", "academy", "tech", "axes", "governance", "product", "company"]) {
  const lp = `/library/${s}`;
  if (!seen.has(lp)) { seen.add(lp); paths.push(lp); }
}

// --- Dynamic route families the :param filter above drops on the floor ------
//
// The parser skips any path containing ":", which is correct — a sitemap cannot list a
// pattern. But it means EVERY dynamic family silently vanishes unless something enumerates
// it. Three families were missing entirely from the emitted sitemap: /for/:persona,
// /industries/:slug and /vs/:slug. The /for pages had also been suppressed behind redirect
// Functions, so their absence looked deliberate rather than mechanical; it was mechanical.
//
// Each family below is DERIVED from the module that owns its slugs, never typed here, so a
// slug added to the source lands in the sitemap on the next build instead of drifting.
const derived = (label, file, re, prefix) => {
  const out = [];
  const src = readFileSync(file, "utf8");
  let mm;
  while ((mm = re.exec(src)) !== null) {
    const p = `${prefix}${mm[1]}`;
    if (!out.includes(p)) out.push(p);
  }
  if (!out.length) {
    console.error(`[sitemap] ERROR: derived 0 ${label} paths from ${file} — the source shape changed.`);
    process.exit(1);
  }
  return out;
};

// /for/:persona — the six audience pages. Slugs are the `key` union in PersonaRouter's
// Persona type, which is the single place the set is declared.
const PERSONA_KEYS = (() => {
  const src = readFileSync(PERSONA_TSX, "utf8");
  const m = src.match(/key:\s*((?:"[a-z-]+"\s*\|\s*)+"[a-z-]+")/);
  if (!m) {
    console.error("[sitemap] ERROR: could not read the persona key union from PersonaRouter.tsx.");
    process.exit(1);
  }
  return [...m[1].matchAll(/"([a-z-]+)"/g)].map((x) => x[1]);
})();
const FOR_PATHS = PERSONA_KEYS.map((k) => `/for/${k}`);

// /industries/:slug — the canonical industry pages, from the data module IndustryTemplate reads.
const INDUSTRY_PATHS = derived("industry", INDUSTRIES_TS, /^\s*slug:\s*"([a-z0-9-]+)"/gm, "/industries/");

// /vs/:slug — one canonical page per named competitor. Compare.tsx's FOCUS map carries an
// ALIAS ("credo" and "credo-ai" both resolve to Credo AI); listing both would put two URLs
// with identical content in the sitemap, so only canonical slugs are emitted.
const VS_PATHS = ["/vs/vanta", "/vs/drata", "/vs/credo-ai", "/vs/onetrust"];

for (const p of [...FOR_PATHS, ...INDUSTRY_PATHS, ...VS_PATHS]) {
  if (!seen.has(p) && !isJunk(p)) { seen.add(p); paths.push(p); }
}
paths.sort((a, b) => (a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b)));

// --- Machine contracts (audit rec 5, lane d971a38) — not App.tsx routes, but
// prime agent/AEO citation surface. Kept here so regeneration never drops them.
const MACHINE_PATHS = [
  ["/api/gspc", "daily", "0.8"],
  ["/api/feed.xml", "daily", "0.7"],
  ["/api/reported", "daily", "0.6"],
  ["/llms.txt", "daily", "0.6"],
  ["/.well-known/agent-card.json", "daily", "0.6"],
  ["/.well-known/did.json", "daily", "0.6"],
  ["/.well-known/scitt.json", "daily", "0.6"],
  ["/api/arena/scoreboard", "daily", "0.6"],
  ["/api/regulator-findings", "daily", "0.6"],
];
for (const [mp, cf, pr] of MACHINE_PATHS) {
  if (!seen.has(mp)) { seen.add(mp); paths.push(mp); }
}

// Every blog article that is actually BUILT. /blog/:slug is a :param route (skipped above),
// so the family has to be enumerated. Two sources have to agree for a URL to be listed:
//
//   1. blog-content.ts — the slug has article content to render, AND
//   2. scripts/prerender.mjs MUST list — the slug is actually snapshotted to a static page.
//
// Reading ONLY blog-content.ts (as this did before) put every slug with content in the
// sitemap, but content is not a page: 19 of the 48 content slugs are NOT in the prerender
// queue, so the static host serves an honest 404 for them and the sitemap advertised 19 dead
// URLs (byzantine-consensus, sovereign-governance-layer, proof-of-ai, …). A sitemap must list
// what the edge SERVES, so the built set is the authority. This is DERIVED from prerender.mjs,
// never a hand-list: a slug added to the snapshot queue lands in the sitemap on the next build,
// and one removed leaves it — the two cannot drift the way a copied list does.
const BLOG_TS = join(ROOT, "client/src/data/blog-content.ts");
const PRERENDER_MJS = join(ROOT, "scripts/prerender.mjs");
let blogSlugs = [];
try {
  const bsrc = readFileSync(BLOG_TS, "utf8");
  blogSlugs = [...bsrc.matchAll(/^\s{4}"slug":\s*"([^"]+)"/gm)].map((m) => m[1]);
} catch {
  console.warn("[sitemap] blog-content.ts unreadable — no /blog/:slug entries emitted");
}
// The set of /blog/<slug> paths the prerender actually snapshots. If this comes back empty the
// source shape changed and every blog URL would silently vanish — fail loud instead.
let builtBlog = new Set();
try {
  const psrc = readFileSync(PRERENDER_MJS, "utf8");
  builtBlog = new Set([...psrc.matchAll(/["'`]\/blog\/([a-z0-9-]+)["'`]/g)].map((m) => m[1]));
  if (blogSlugs.length && builtBlog.size === 0) {
    console.error("[sitemap] ERROR: derived 0 built /blog/ slugs from prerender.mjs — the source shape changed.");
    process.exit(1);
  }
} catch {
  console.error("[sitemap] ERROR: scripts/prerender.mjs unreadable — cannot tell which blog pages are built.");
  process.exit(1);
}
let blogSkipped = 0;
let blogUnbuilt = 0;
for (const slug of blogSlugs) {
  const bp = `/blog/${slug}`;
  // Not snapshotted → the static host 404s it → it must not be in the sitemap.
  if (!builtBlog.has(slug)) { blogUnbuilt++; continue; }
  if (redirectRules.has(bp) || redirectRules.has(bp + "/")) { blogSkipped++; continue; }
  // THE TRAILING SLASH IS THE CANONICAL FORM AND IT IS NOT OPTIONAL. The prerender snapshots
  // each article to /blog/<slug>/index.html, so the edge serves 200 at /blog/<slug>/ and 308s
  // /blog/<slug> onto it. Pushing the bare path listed all 38 built articles at the URL that
  // redirects — measured live 2026-09-05, every one of them answered 308.
  //
  // The /answers/ family below relies on canonicalise() to do this rewrite, which works there
  // because generate-redirects emits an explicit /answers/<slug> -> /answers/<slug>/ rule for
  // all 12. There is no equivalent rule for these 38 (the only 6 /blog/<slug> rules in
  // _redirects send RETIRED articles to /blog/, and are correctly dropped by the branch above),
  // so the slash is applied here rather than left to a rule that does not exist.
  const canonicalBlog = bp + "/";
  if (!seen.has(canonicalBlog)) { seen.add(canonicalBlog); paths.push(canonicalBlog); }
}

// The AEO answer explainers. /answers/:slug is a :param route (skipped above), so the 12
// detail pages — the regulator/procurement citation surface these pages exist for — were
// absent from the sitemap. Unlike blog (content ≠ built), EVERY answers.json slug is
// snapshotted: prerender.mjs derives its /answers/<slug> queue from this same file, so the
// data file IS the built set. Push the bare path and let canonicalise() rewrite it to the
// 200 trailing-slash form via the /answers/<slug> → /answers/<slug>/ rule generate-redirects
// emits (do NOT pre-skip on "has a redirect" — that rule is the canonicaliser we want, not a
// send-elsewhere).
const ANSWERS_JSON = join(ROOT, "client/src/data/answers.json");
let answerSlugs = [];
try {
  answerSlugs = JSON.parse(readFileSync(ANSWERS_JSON, "utf8")).map((a) => a && a.slug).filter(Boolean);
} catch {
  console.warn("[sitemap] answers.json unreadable — no /answers/:slug entries emitted");
}
for (const slug of answerSlugs) {
  const ap = `/answers/${slug}`;
  if (!seen.has(ap)) { seen.add(ap); paths.push(ap); }
}

// --- Static pages under public/ ---------------------------------------------
// This generator derives its routes from App.tsx <Route> declarations, so a page that is a
// PLAIN HTML FILE under public/ is structurally invisible to it. Measured live 2026-09-05:
// 114 of the 115 static pages were absent from the sitemap and 110 of those answer 200 —
// real, indexable pages the crawl budget never learned about. /genai-mil is one of them.
//
// These are added the same way blog and answers are: push the bare path and let
// canonicalise() do the deciding, so a page that redirects (from _redirects OR from a Pages
// function) is dropped by the existing rule rather than by a second opinion here. The four
// that answered 308 on that audit (/advisory, /claimguard, /globe, /ras) fall out that way.
// /index.html is the homepage, already present as "/".
function collectStaticPages(dir, urlPrefix = "") {
  let out = [];
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    if (e.isDirectory()) {
      if (e.name === "assets" || e.name === "vendor" || e.name === "signed" || e.name === "cards") continue;
      out = out.concat(collectStaticPages(join(dir, e.name), `${urlPrefix}/${e.name}`));
    } else if (e.name.endsWith(".html")) {
      const base = e.name.slice(0, -5);
      // A subdirectory's index.html is served at the TRAILING-SLASH url; the bare form 308s
      // to it. Emitting the bare form would put ten redirects straight back into the sitemap.
      out.push(base === "index" ? (urlPrefix ? `${urlPrefix}/` : "/") : `${urlPrefix}/${base}`);
    }
  }
  return out;
}
let staticAdded = 0;
for (const sp of collectStaticPages(join(ROOT, "public"))) {
  if (sp === "/" || seen.has(sp) || isJunk(sp)) continue;
  seen.add(sp); paths.push(sp); staticAdded++;
}
console.log(`[sitemap] static public/*.html pages considered: +${staticAdded} before canonicalise`);

// --- Emit XML ---------------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const MACHINE = new Map(MACHINE_PATHS.map(([p, cf, pr]) => [p, { cf, pr }]));
let rewritten = 0;
let droppedRedirect = 0;
const finalPaths = [];
for (const p of paths) {
  const c = canonicalise(p);
  if (c === null) { droppedRedirect++; continue; }
  if (c !== p) rewritten++;
  finalPaths.push(c);
}

const urls = finalPaths
  .map((p) => {
    const loc = p === "/" ? BASE : `${BASE}${esc(p)}`;
    const m = MACHINE.get(p);
    const cf = m ? m.cf : changefreqFor(p);
    const pr = m ? m.pr : priorityFor(p).toFixed(1);
    return [
      "  <url>",
      `    <loc>${loc}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${cf}</changefreq>`,
      `    <priority>${pr}</priority>`,
      "  </url>",
    ].join("\n");
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(OUT, xml);
console.log(
  `[sitemap] ${finalPaths.length} URLs -> public/sitemap.xml ` +
    `(skipped ${skippedParams} :param routes, ${skippedJunk} junk/legacy, ` +
    `${droppedRedirect} redirect-to-elsewhere, ${blogUnbuilt} unbuilt blog slugs (404), ` +
    `${blogSkipped} redirected blog slugs; ` +
    `${rewritten} rewritten to their trailing-slash canonical; ` +
    `${blogSlugs.length - blogUnbuilt - blogSkipped} blog articles; lastmod=${today})`
);

// Flagship sanity check — these MUST be present.
const REQUIRED = [
  "/os",
  "/honesty",
  "/gspc-arena",
  "/gspc-verify",
  "/gspc-anchors",
  "/gspc-gap-map",
  "/layer0",
  "/methodology",
  "/refutation-ledger",
  "/instrument",
  "/tour",
  // The six audience pages. They were redirect-suppressed for two days and nothing
  // failed, because nothing asserted they should be reachable. Now something does.
  ...FOR_PATHS,
];
const missing = REQUIRED.filter((r) => !seen.has(r) || isJunk(r));
if (missing.length) {
  console.error(`[sitemap] ERROR: flagship routes missing from sitemap: ${missing.join(", ")}`);
  process.exit(1);
}
