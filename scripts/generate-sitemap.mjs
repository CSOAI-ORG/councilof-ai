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
import { readFileSync, writeFileSync } from "node:fs";
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
  const to = redirectRules.get(path);
  if (!to) return path;
  if (to === path + "/") return to;
  return null;
}

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
  ["/live-ledger", P_HIGH],
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
  ["/live-ledger", "daily"],
  ["/status", "hourly"],
  ["/blog", "daily"],
  ["/", "weekly"],
]);

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

function isJunk(path) {
  if (EXCLUDE_EXACT.has(path)) return true;
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
const src = readFileSync(APP_TSX, "utf8");
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
  if (!seen.has(bp)) { seen.add(bp); paths.push(bp); }
}

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
  "/live-ledger",
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
