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
  "/old-home",
  "/landing",
  "/legacy",
  "/pricing-legacy",
  "/poc",
  "/humanoids-poc",
  "/gods-eye",
  "/horus",
  "/dragonfly",
  "/maternal-covenant",
  "/covenant",
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
for (const s of ["regulation", "regions", "academy", "tech", "axes", "governance", "product", "company"]) {
  const lp = `/library/${s}`;
  if (!seen.has(lp)) { seen.add(lp); paths.push(lp); }
}

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
const INDUSTRY_PATHS = derived("industry", INDUSTRIES_TS, /^\s*slug:\s*"([a-z0-9-]+)"/gm, "/industries/");
const VS_PATHS = ["/vs/vanta", "/vs/drata", "/vs/credo-ai", "/vs/onetrust"];

for (const p of [...FOR_PATHS, ...INDUSTRY_PATHS, ...VS_PATHS]) {
  if (!seen.has(p) && !isJunk(p)) { seen.add(p); paths.push(p); }
}
paths.sort((a, b) => (a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b)));

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

const BLOG_TS = join(ROOT, "client/src/data/blog-content.ts");
let blogSlugs = [];
try {
  const bsrc = readFileSync(BLOG_TS, "utf8");
  blogSlugs = [...bsrc.matchAll(/^\s{4}"slug":\s*"([^"]+)"/gm)].map((m) => m[1]);
} catch {
  console.warn("[sitemap] blog-content.ts unreadable — no /blog/:slug entries emitted");
}
let blogSkipped = 0;
for (const slug of blogSlugs) {
  const bp = `/blog/${slug}`;
  if (redirectRules.has(bp) || redirectRules.has(bp + "/")) { blogSkipped++; continue; }
  if (!seen.has(bp)) { seen.add(bp); paths.push(bp); }
}

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
    `${droppedRedirect} redirect-to-elsewhere, ${blogSkipped} redirected blog slugs; ` +
    `${rewritten} rewritten to their trailing-slash canonical; ` +
    `${blogSlugs.length - blogSkipped} blog articles; lastmod=${today})`
);

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
  ...FOR_PATHS,
];
const missing = REQUIRED.filter((r) => !seen.has(r) || isJunk(r));
if (missing.length) {
  console.error(`[sitemap] ERROR: flagship routes missing from sitemap: ${missing.join(", ")}`);
  process.exit(1);
}
