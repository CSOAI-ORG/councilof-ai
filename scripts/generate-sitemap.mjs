#!/usr/bin/env node
/**
 * generate-sitemap.mjs — builds public/sitemap.xml from App + AppRoutesA/B.
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
const ROUTE_SOURCES = [
  join(ROOT, "client/src/App.tsx"),
  join(ROOT, "client/src/AppRoutesA.tsx"),
  join(ROOT, "client/src/AppRoutesB.tsx"),
];
const OUT = join(ROOT, "public/sitemap.xml");
const BASE = "https://councilof.ai";

// --- Priority tiers -------------------------------------------------------
const P_TOP = 0.9; // flagship public surfaces
const P_HIGH = 0.8; // high-value product/learn pages
const P_DEFAULT = 0.6;
const P_LOW = 0.4; // legal / policy pages

const PRIORITY = new Map([
  ["/", 1.0],
  ["/pricing", P_TOP],
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
  ["/indices", P_HIGH],
  ["/indices/ai-economy", P_HIGH],
  ["/indices/human-labour", P_HIGH],
  ["/indices/humanoid-labour", P_HIGH],
  ["/products", P_HIGH],
  ["/powered-by", P_HIGH],
]);

const CHANGEFREQ = new Map([
  ["/live-ledger", "daily"],
  ["/status", "hourly"],
  ["/blog", "daily"],
  ["/", "weekly"],
  ["/indices", "weekly"],
  ["/products", "weekly"],
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
  "/sovereign-town",
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
for (const srcPath of ROUTE_SOURCES) {
  let src;
  try {
    src = readFileSync(srcPath, "utf8");
  } catch {
    continue;
  }
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
}
// Library IA: the /library/:sector pages are dynamic routes (skipped above as :param) but are
// prime AEO citation surface — one sector-organized archive index each. List them explicitly.
for (const s of ["regulation", "regions", "academy", "tech", "axes", "governance", "product", "company"]) {
  const lp = `/library/${s}`;
  if (!seen.has(lp)) { seen.add(lp); paths.push(lp); }
}
// Indices UNMEASURED pages are /indices/:slug (param route) — list hub children explicitly (#215).
for (const slug of ["ai-economy", "human-labour", "humanoid-labour"]) {
  const ip = `/indices/${slug}`;
  if (!seen.has(ip)) { seen.add(ip); paths.push(ip); }
}
paths.sort((a, b) => (a === "/" ? -1 : b === "/" ? 1 : a.localeCompare(b)));

// --- Machine contracts (audit rec 5, lane d971a38) — not App.tsx routes, but
// prime agent/AEO citation surface. Kept here so regeneration never drops them.
const MACHINE_PATHS = [
  ["/api/gspc", "daily", "0.8"],
  ["/api/indices", "weekly", "0.7"],
  ["/api/feed.xml", "daily", "0.7"],
  ["/api/reported", "daily", "0.6"],
  ["/llms.txt", "daily", "0.6"],
  ["/.well-known/agent-card.json", "daily", "0.6"],
  ["/.well-known/did.json", "daily", "0.6"],
  ["/.well-known/scitt.json", "daily", "0.6"],
  // NEXT_300 #149 — static regulator brief (not App Route; print + PDF)
  ["/regulator-indices-one-pager.html", "monthly", "0.7"],
  ["/regulator-indices-one-pager.pdf", "monthly", "0.6"],
];
for (const [mp, cf, pr] of MACHINE_PATHS) {
  if (!seen.has(mp)) { seen.add(mp); paths.push(mp); }
}

// --- Emit XML ---------------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const MACHINE = new Map(MACHINE_PATHS.map(([p, cf, pr]) => [p, { cf, pr }]));
const urls = paths
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
  `[sitemap] ${paths.length} URLs -> public/sitemap.xml ` +
    `(skipped ${skippedParams} :param routes, ${skippedJunk} junk/legacy, lastmod=${today})`
);

// Flagship sanity check — these MUST be present.
const REQUIRED = [
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
  "/indices",
  "/indices/ai-economy",
  "/indices/human-labour",
  "/indices/humanoid-labour",
  "/products",
  "/powered-by",
  "/api/indices",
  "/regulator-indices-one-pager.html",
  "/regulator-indices-one-pager.pdf",
];
const missing = REQUIRED.filter((r) => !seen.has(r) || isJunk(r));
if (missing.length) {
  console.error(`[sitemap] ERROR: flagship routes missing from sitemap: ${missing.join(", ")}`);
  process.exit(1);
}
