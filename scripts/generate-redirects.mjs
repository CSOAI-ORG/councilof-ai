#!/usr/bin/env node
/**
 * generate-redirects.mjs — kill the soft-404 without breaking client-side routing.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "client/src/App.tsx");
const OUT = join(ROOT, "public/_redirects");

const STATIC_DIRS = ["/arena", "/benchmarks", "/vendor", "/assets",
                     "/.well-known", "/corpus-watch", "/flywheel", "/packs",
                     "/datasets"];

const src = readFileSync(APP, "utf8");
const routes = [...src.matchAll(/<Route\s+path=["']([^"']+)["']/g)]
  .map((m) => m[1])
  .filter((p) => p.startsWith("/") && !p.includes(":") && !p.includes("*"))
  .filter((p, i, a) => a.indexOf(p) === i)
  .sort();

const EXISTING = [
  "/sov-space      /gspc-arena             308",
  "/sov-space/     /gspc-arena             308",
  "/sov-space/*    /gspc-arena             308",
  "/sovereign-space /gspc-arena            308",
  "/simulate       /gspc-arena             308",
  "/sovereign-town /gspc-arena?view=towns  308",
  "/towns          /gspc-arena?view=towns  308",
  "/globe          /globe3d.html           308",
  "/byzantine            /council   308",
  "/byzantine-consensus  /council   308",
  "/bft                  /council   308",
  "/consensus            /council   308",
  "/jewels               /          308",
  "/crown-jewels         /          308",
  "/plans                /pricing   308",
  "/enterprise-plans     /pricing   308",
  "/council-space  /gspc-arena             308",
  "/city           /gspc-arena?view=towns  308",
  "/method         /methodology            308",
  "/legal                  /disclaimers                 308",
  "/vulnerability          /vulnerability-disclosure    308",
  "/gspc                   /gspc-scoreboard             308",
  "/scoreboard             /gspc-scoreboard             308",
  "/scorecard              /gspc-scoreboard             308",
  "/scorecard/             /gspc-scoreboard             308",
  "/lobby                  /?lobby=home                 308",
  "/console                /?lobby=home                 308",
  "/council-os             /os                          308",
  "/council-os/            /os                          308",
  "/sov-os                 /?lobby=home                 308",
  "/sov-os/                /?lobby=home                 308",
  "/ag-ui                  /?lobby=home                 308",
  "/ag-ui/                 /?lobby=home                 308",
  "/agui                   /?lobby=home                 308",
  "/agui/                  /?lobby=home                 308",
  "/chat                   /?lobby=home                 308",
  "/chat/                  /?lobby=home                 308",
  "/rankings               /?lobby=board                308",
  "/rankings/              /?lobby=board                308",
  "/benchmarkers           /?lobby=results              308",
  "/benchmarkers/          /?lobby=results              308",
  "/mcp-registry           /mcps/                       308",
  "/mcp-registry/          /mcps/                       308",
  "/library/measurement    /library/axes                308",
  "/verify                 /gspc-verify/                308",
  "/verify/                /gspc-verify/                308",
  "/api/arena/rounds       /api/arena/rounds.jsonl      200",
  "/enterprise             /?lobby=measured&task=enterprise-start  308",
  "/enterprise/            /?lobby=measured&task=enterprise-start  308",
  "/enterprises            /?lobby=measured&task=enterprise-start  308",
  "/developers             /gspc-verify/                308",
  "/colosseum              /coliseum/                   308",
  "/for                    /for/enterprise/             308",

  // --- Stage 39/40 top-down align (J-D1 · J-D2 · J-D5 · datasets) ---
  "/regulation             /library/regulation/         308",
  "/regulation/            /library/regulation/         308",
  "/solutions              /assess/                     308",
  "/solutions/             /assess/                     308",
  "/company                /library/company/            308",
  "/company/               /library/company/            308",
  "/signin                 /login/                      308",
  "/signin/                /login/                      308",
  "/sign-in                /login/                      308",
  "/sign-in/               /login/                      308",
  "/verify-card            /gspc-verify/                308",
  "/verify-card/           /gspc-verify/                308",
  "/datasets               /datasets/gspc-axis-v0.1.0/dataset.json  308",
  "/datasets/              /datasets/gspc-axis-v0.1.0/dataset.json  308",
  "/cibola                 /dorado/                     308",
  "/cibola/                /dorado/                     308",
  "/corpus                 /signals/                    308",
  "/corpus/                /signals/                    308",
  "/first-fine             /first-fine-watch/           308",
  "/first-fine/            /first-fine-watch/           308",
  "/signal                 /signals/                    308",
  "/signal/                /signals/                    308",
  "/blog/layer-0-agent-economy-trust              /blog/  308",
  "/blog/layer-0-agent-economy-trust/             /blog/  308",
  "/blog/eu-ai-act-article-50-countdown           /blog/  308",
  "/blog/eu-ai-act-article-50-countdown/          /blog/  308",
  "/blog/choosing-ai-compliance-vendor            /blog/  308",
  "/blog/choosing-ai-compliance-vendor/           /blog/  308",
  "/blog/dora-compliance-uk-financial-services    /blog/  308",
  "/blog/dora-compliance-uk-financial-services/   /blog/  308",
  "/blog/ai-governance-vs-compliance              /blog/  308",
  "/blog/ai-governance-vs-compliance/             /blog/  308",
  "/blog/nis2-compliance-critical-infrastructure  /blog/  308",
  "/blog/nis2-compliance-critical-infrastructure/ /blog/  308",

  // JA-D2: keep edge alias without shipping the slug in the client bundle
  // (App.tsx route removed; string stays only in this edge map).
];

const STOREFRONT = [
  "/catalog.json  /catalog.json     200",
  "/claimguard    /claimguard.html  200",
  "/claimguard/   /claimguard       308",
  "/ras           /ras.html         200",
  "/ras/          /ras              308",
];

const PERSONA_SLASH = [
  "pricing", "honesty", "library", "regulators", "start", "insurers",
  "gspc-verify", "assess", "watchdog", "academy", "methodology", "compare", "layer0",
  "about", "privacy-policy", "dashboard", "login", "gspc-arena", "firewall-charter",
  "models", "tools", "api-docs",
  "workbench", "instrument", "system-card", "feed", "mcp-fleet", "crosswalk",
  "east-west", "challenge",
  "refutation-ledger",
  "benchmarks", "benchmark-index", "benchmark-quality", "watchdog-map",
  "mcps", "trust-center", "network", "hive", "intel",
];
const PERSONA_FOR_SLASH = [
  "finance", "healthcare", "startup", "enterprise", "regulator", "sec-filer",
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
  "# --- persona bare paths → prerendered trailing-slash (gauntlet cold loads) ---",
  ...PERSONA_SLASH.flatMap((p) => [`/${p}  /${p}/  308`]),
  ...PERSONA_FOR_SLASH.map((p) => `/for/${p}  /for/${p}/  308`),
  "",
  "# --- storefront static pages: served directly, trailing slash 308→slashless ---",
  ...STOREFRONT,
  "",
  "# --- static asset trees: served directly, never routed to the app ---",
  ...STATIC_DIRS.filter((d) => !HASHED_DIRS.includes(d)).map((d) => `${d}/*  ${d}/:splat  200`),
  "",
  "# --- SPA catch-all: hand the shell to wouter; unknown paths 404 in-app ---",
  "# canary-2026-08-22-7fb8: if /zzz-spa-test-7fb8 is still honest-404, this file did not reach the edge",
  "/*  /index.html  200",
  "",
];

writeFileSync(OUT, lines.join("\n"));
console.log(`[redirects] ${routes.length} app routes detected (not emitted; catch-all covers them)`);
console.log(`[redirects] ${STATIC_DIRS.length} static trees + ${EXISTING.length} hand-written + ${STOREFRONT.length} storefront redirects + catch-all`);
