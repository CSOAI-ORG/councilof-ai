#!/usr/bin/env node
/**
 * generate-redirects.mjs — kill the soft-404 without breaking client-side routing.
 *
 * THE PROBLEM THIS FIXES, measured on production 2026-08-05:
 *
 *     https://csoai.org/zzz-cannot-exist-4a7b   ->  HTTP 200, 36,188 visible characters
 *
 * Cloudflare Pages falls back to index.html for any unmatched path, and since prerendering
 * started working that fallback is now a full, content-rich homepage. Every typo, every stale
 * inbound link, every crawler probe returns a real page with a 200. Search engines will index an
 * unbounded set of URLs all serving duplicate content, and nothing ever deindexes.
 *
 * BEFORE prerendering this was a 60-character shell — bad but low-value. The prerender fix, which
 * was correct and needed, made this defect far more damaging. That is worth stating plainly: the
 * regression came from a good change.
 *
 * WHY NOT JUST ADD 404.html. Because wouter does client-side routing: a cold load of a REAL route
 * like /provenance-finding must receive index.html or the app never boots. A blanket 404 breaks
 * every deep link on the site.
 *
 * THE FIX (revised 2026-08-06): emit ONLY the catch-all SPA fallback.
 *
 *     /*   /index.html   200    <- wouter boots for every path, routes or 404s in-app
 *
 * A previous revision emitted one EXACT rule per route (`/about /index.html 200`, ...).
 * Cloudflare Pages canonicalizes an exact-rule `/index.html` target to `/`, so those rules
 * turned into 308 redirects to the homepage for real SPA routes (/about, /crosswalks 308'd
 * to / while routes without an exact rule correctly returned 200 via the catch-all).
 * Per-route exact rules are therefore forbidden here; the catch-all alone covers them.
 *
 * Routes are still parsed from App.tsx (the SAME parse generate-sitemap.mjs uses) purely as a
 * sanity signal that the app has routes at all — none are written to the redirect table.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "client/src/App.tsx");
const OUT = join(ROOT, "public/_redirects");

// Static asset directories served directly by Pages — must NOT be routed to the app.
// /sov-space is no longer a public tree: it 308s to /gspc-arena (Council Space).
const STATIC_DIRS = ["/arena", "/benchmarks", "/vendor", "/assets",
                     "/.well-known", "/corpus-watch", "/flywheel", "/packs"];

const src = readFileSync(APP, "utf8");
const routes = [...src.matchAll(/<Route\s+path=["']([^"']+)["']/g)]
  .map((m) => m[1])
  .filter((p) => p.startsWith("/") && !p.includes(":") && !p.includes("*"))
  .filter((p, i, a) => a.indexOf(p) === i)
  .sort();

// Preserve hand-written rules that already exist — they are consolidation redirects and
// clobbering them would break live inbound links.
const EXISTING = [
  // 17 Aug 2026: /gspc-arena is the spectator (Council Space).
  // Do NOT 200-rewrite it to /sov-space/index.html — Pages canonicalizes that to a 308 /sov-space/ and loops with the 308s below.
  // SPA catch-all serves /gspc-arena as /index.html. App mounts SovSpace there.
  "/sov-space      /gspc-arena             308",
  "/sov-space/     /gspc-arena             308",
  "/sov-space/*    /gspc-arena             308",
  "/sovereign-space /gspc-arena            308",
  "/simulate       /gspc-arena             308",
  "/sovereign-town /gspc-arena?view=towns  308",
  "/towns          /gspc-arena?view=towns  308",
  "/globe          /globe3d.html           308",
  // Audit 2026-08-14 kills/consolidations — edge 308s so crawlers + direct hits redirect
  // WITHOUT booting the SPA at a killed path. Must mirror the client Redirects in App.tsx.
  "/byzantine            /council   308",   // §0.2 #13 — retracted fault-tolerance claim
  "/byzantine-consensus  /council   308",   // §0.2 #12 — same
  "/bft                  /council   308",   // §0.2 #14 — "BFT setup" asserts the retracted claim
  "/consensus            /council   308",   // §0.2 #14 — same
  "/jewels               /          308",   // §0.2 #22 — internal strategy page was public
  "/crown-jewels         /          308",   // §0.2 #22 — same
  "/plans                /pricing   308",   // §3.5 #2 — duplicate of /pricing
  "/enterprise-plans     /pricing   308",   // §3.5 #2 — fold Enterprise into one pricing page
  // qa-sweep 2026-08-19: dead internal links found on live pages — no such routes existed.
  "/council-space  /gspc-arena             308",  // Council Space's own console/nav linked it
  "/city           /gspc-arena?view=towns  308",  // home "Council City" CTA target
  "/method         /methodology            308",  // home USP cards linked /method
  // qa-sweep 2026-08-21: guessed / inbound aliases 404'd (catch-all is honest 404.html).
  "/legal                  /disclaimers                 308",
  "/vulnerability          /vulnerability-disclosure    308",
  "/gspc                   /gspc-scoreboard             308",
  "/scoreboard             /gspc-scoreboard             308",
  "/lobby                  /?lobby=home                 308",
  "/console                /os                          308",
  "/library/measurement    /library/axes                308",
];

const HASHED_DIRS = ["/assets"];

const lines = [
  "# GENERATED by scripts/generate-redirects.mjs — do not hand-edit.",
  "# ONLY hand-written redirects, static asset trees, and the SPA catch-all belong here.",
  "# Per-route exact rules to /index.html are FORBIDDEN: Pages canonicalizes them to / (308).",
  "",
  "# --- hand-written consolidation redirects (preserved) ---",
  ...EXISTING,
  "",
  "# --- static asset trees: served directly, never routed to the app ---",
  ...STATIC_DIRS.filter((d) => !HASHED_DIRS.includes(d)).map((d) => `${d}/*  ${d}/:splat  200`),

  "",
  "# --- SPA catch-all: known routes are prerendered static files (200); unknown paths get a real 404 ---",
  "/*  /404.html  404",
  "",
];

writeFileSync(OUT, lines.join("\n"));
console.log(`[redirects] ${routes.length} app routes detected (not emitted; catch-all covers them)`);
console.log(`[redirects] ${STATIC_DIRS.length} static trees + ${EXISTING.length} hand-written redirects + catch-all`);
