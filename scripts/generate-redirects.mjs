#!/usr/bin/env node
/**
 * generate-redirects.mjs — kill the soft-404 without breaking client-side routing.
 *
 * ORDERING IS LOAD-BEARING. Cloudflare's parser (wrangler
 * workers-shared/utils/configuration/parseRedirects.ts) keeps two budgets:
 *   MAX_STATIC_REDIRECT_RULES  = 2000
 *   MAX_DYNAMIC_REDIRECT_RULES = 100   <- hitting this `break`s out of the file
 * A rule is "static" only while `canCreateStaticRule` is still true. That flag is
 * set to false by the FIRST rule whose `from` contains a splat or a :placeholder,
 * and it is never set back. So one early `/sov-space/*` on line 8 made all 147
 * rules count as dynamic; the cap tripped at rule 101 and wrangler logged
 *   "Maximum number of dynamic rules supported is 100. Skipping remaining 53
 *    lines of file."
 * The 53 skipped lines contained the SPA catch-all. Production only survived
 * because the prerender writes real HTML per route — every route NOT prerendered
 * was a silent 404.
 *
 * Therefore: EMIT EVERY SPLAT-FREE RULE FIRST, THEN THE SPLAT RULES, CATCH-ALL LAST.
 * That keeps the dynamic budget spent on splats only (currently 11 of 100) and
 * puts the ~136 exact-path rules on the 2000-rule static budget where they belong.
 * scripts/redirects-guard.mjs re-implements the parser and fails the build if the
 * catch-all ever falls outside the cap again.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP = join(ROOT, "client/src/App.tsx");
const OUT = join(ROOT, "public/_redirects");

const STATIC_DIRS = ["/arena", "/benchmarks", "/vendor", "/assets",
                     "/.well-known", "/corpus-watch", "/flywheel", "/packs",
                     "/datasets",
                     // /signed is the evidence tree IETF implementers are pointed at.
                     // Without this the SPA catch-all answers /signed/ with the app
                     // shell (soft 404) instead of the directory index.
                     "/signed",
                     // 48h thesis stack JSON (index + watches) — serve as assets.
                     "/stack"];

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
  // Pricing lives in Council OS Assess (functions/pricing.ts). Do not chain
  // through /pricing — that is itself a 308 door hop.
  "/plans                /os?lobby=assess&task=pricing-overview   308",
  "/enterprise-plans     /os?lobby=assess&task=pricing-overview   308",
  "/council-space  /gspc-arena             308",
  "/city           /gspc-arena?view=towns  308",
  // Living-measurement / product short doors. Destinations already exist.
  // Do not invent /evm as its own page — the human surface that already
  // publishes EVM coverage is /xrpl-attest (coverage.evm + interop JSON).
  "/ins            /insurers/              308",
  "/ins/           /insurers/              308",
  "/insurance      /insurers/              308",
  "/insurance/     /insurers/              308",
  "/article50      /article-50/            308",
  "/article50/     /article-50/            308",
  "/overlay        /os?lobby=home          308",
  "/overlay/       /os?lobby=home          308",
  "/rwa            /distribution-integrity/ 308",
  "/rwa/           /distribution-integrity/ 308",
  "/financial-axis /financial-axes/        308",
  "/financial-axis/ /financial-axes/       308",
  "/xrpl           /xrpl-attest/           308",
  "/xrpl/          /xrpl-attest/           308",
  "/evm            /xrpl-attest/           308",
  "/evm/           /xrpl-attest/           308",
  "/arc-agi        /rating-the-raters/     308",
  "/arc-agi/       /rating-the-raters/     308",
  "/arcagi         /rating-the-raters/     308",
  "/arcagi/        /rating-the-raters/     308",
  "/acr-agi        /rating-the-raters/     308",
  "/acr-agi/       /rating-the-raters/     308",
  "/method         /methodology            308",
  // AEO short doors from LIVE-GAP-AUDIT. Destinations already ship as blog
  // (or /colorado-ai-act). Do not invent an SS 584 seed page — pin the
  // existing explainer. After /answers merges, the blog still 200s.
  "/scitt          /blog/scitt-ai-supply-chain-transparency/  308",
  "/scitt/         /blog/scitt-ai-supply-chain-transparency/  308",
  "/colorado       /colorado-ai-act/         308",
  "/colorado/      /colorado-ai-act/         308",
  "/ss584          /blog/third-party-ai-audit-standards-ss584-isae3000/  308",
  "/ss584/         /blog/third-party-ai-audit-standards-ss584-isae3000/  308",
  "/nist-ai-600    /blog/nist-ai-600-1-profile-mapping/  308",
  "/nist-ai-600/   /blog/nist-ai-600-1-profile-mapping/  308",
  "/containment    /blog/what-is-monitored-containment/  308",
  "/containment/   /blog/what-is-monitored-containment/  308",
  "/legal                  /disclaimers                 308",
  "/vulnerability          /vulnerability-disclosure    308",
  "/gspc                   /gspc-scoreboard             308",
  // TUI/plugin help used to 404. Help lives at /tools (seven MCP tools).
  "/plugin                 /tools                       301",
  "/plugin/                /tools                       301",
  "/scoreboard             /gspc-scoreboard             308",
  "/scorecard              /gspc-scoreboard             308",
  "/scorecard/             /gspc-scoreboard             308",
  "/lobby                  /os?lobby=home               308",
  "/console                /os?lobby=home               308",
  "/council-os             /os                          308",
  "/council-os/            /os                          308",
  "/sov-os                 /os?lobby=home               308",
  "/sov-os/                /os?lobby=home               308",
  "/ag-ui                  /os?lobby=home               308",
  "/ag-ui/                 /os?lobby=home               308",
  "/agui                   /os?lobby=home               308",
  "/agui/                  /os?lobby=home               308",
  "/chat                   /os?lobby=home               308",
  "/chat/                  /os?lobby=home               308",
  "/rankings               /os?lobby=board              308",
  "/rankings/              /os?lobby=board              308",
  "/benchmarkers           /os?lobby=verify             308",
  "/benchmarkers/          /os?lobby=verify             308",
  "/mcp-registry           /mcps/                       308",
  "/mcp-registry/          /mcps/                       308",
  "/library/measurement    /library/axes                308",
  "/verify                 /gspc-verify/                308",
  // REMOVED 2026-08-26 (dead rules — see redirects audit):
  //   /api/arena/rounds -> /api/arena/rounds.jsonl : never fired. Pages Functions run
  //     before the asset server, and functions/api/arena/rounds.js already answers it.
  //   /cibola, /cibola/ -> /dorado/ : destination /dorado/ does not exist (no route, no
  //     file), AND both names are PATH_BANNED internal codenames in scripts/brand-gate.mjs.
  //     They were shipping banned codenames in a public edge config.
  "/verify/                /gspc-verify/                308",
  "/badges                 /badge                       308",
  "/badges/                /badge                       308",
  "/verify-certificate     /gspc-verify/                308",
  "/verify-certificate/    /gspc-verify/                308",
  "/enterprise             /os?lobby=assess&task=enterprise-start  308",
  "/enterprise/            /os?lobby=assess&task=enterprise-start  308",
  "/enterprises            /os?lobby=assess&task=enterprise-start  308",
  "/developers             /gspc-verify/                308",
  "/colosseum              /coliseum/                   308",
  // /for is an index with no page of its own — send it to the default audience. The
  // trailing-slash form needs its own rule: it used to be swallowed by a Pages Function
  // at functions/for/index.ts (deleted with the rest of the /for/* suppression), and
  // without a rule here it falls through the catch-all to the SPA shell instead.
  "/for                    /for/enterprise/             308",
  "/for/                   /for/enterprise/             308",

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

  // SEO cleanup 2026-08-27: /fabric/* was a leftover product tree never wired in
  // this repo. Google indexed /fabric/agent-incident-reporter-mcp; send it to the
  // live MCP registry door. csoai.org has the same leftover but is a different
  // Pages project (csoai-site), so that redirect belongs in its own deploy.
  "/fabric/agent-incident-reporter-mcp  /mcps/  308",

  // 2026-08-28: /readiness-assessment was a 404 (no edge redirect, SPA catch-all
  // inert). The live page is /assess. /ras was 200→ras.html (STOREFRONT) but the
  // user requests a 308→/assess to kill the self-loop and unify the door.
  "/readiness-assessment   /assess  308",
  "/readiness-assessment/  /assess  308",
  "/ras                    /assess  308",
  "/ras/                   /assess  308",

  // 2026-08-28: /claimguard.html 200 rewrite loops with Pages' .html→slashless
  // strip (claimguard → claimguard.html → claimguard). Send humans to the live
  // honesty rail. /coming was a 404 orphan; same destination. /stack directory
  // index is JSON — hop bare /stack there so agents and browsers both resolve.
  "/claimguard             /honesty/                308",
  "/claimguard/            /honesty/                308",
  "/claimguard.html        /honesty/                308",
  "/coming                 /honesty/                308",
  "/coming/                /honesty/                308",
  "/stack                  /stack/index.json        308",
  "/stack/                 /stack/index.json        308",
];

const STOREFRONT = [
  "/catalog.json  /catalog.json     200",
];

const PERSONA_SLASH = [
  // pricing is a Functions door hop → /os Assess — do not emit /pricing → /pricing/
  "honesty", "library", "regulators", "start", "insurers",
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

// A rule is DYNAMIC iff its `from` carries a splat or a :placeholder. Cloudflare
// stops parsing the whole file after 100 of those, so they must all live at the end.
const IS_DYNAMIC = (line) => {
  const t = line.trim();
  if (!t || t.startsWith("#") || t.startsWith("//")) return false;
  const from = t.split(/\s+/)[0];
  return from.includes("*") || /:[A-Za-z]\w*/.test(from);
};

// Everything with an exact `from`. These land on the 2000-rule STATIC budget.
const STATIC_RULES = [
  "# --- hand-written consolidation redirects (preserved) ---",
  ...EXISTING,
  "",
  "# --- persona bare paths → prerendered trailing-slash (gauntlet cold loads) ---",
  ...PERSONA_SLASH.flatMap((p) => [`/${p}  /${p}/  308`]),
  ...PERSONA_FOR_SLASH.map((p) => `/for/${p}  /for/${p}/  308`),
  "",
  "# --- storefront static pages: served directly, trailing slash 308→slashless ---",
  ...STOREFRONT,
].filter((l) => !IS_DYNAMIC(l));

// Everything with a splat. These are the only rules that may spend the 100-rule
// DYNAMIC budget, and the SPA catch-all is deliberately the very last of them.
const DYNAMIC_RULES = [
  ...EXISTING.filter(IS_DYNAMIC),
  ...STATIC_DIRS.filter((d) => !HASHED_DIRS.includes(d)).map((d) => `${d}/*  ${d}/:splat  200`),
];

const lines = [
  "# GENERATED by scripts/generate-redirects.mjs — do not hand-edit.",
  "# ONLY hand-written redirects, static asset trees, and the SPA catch-all belong here.",
  "# Per-route exact rules to /index.html are FORBIDDEN: Pages canonicalizes them to / (308).",
  "#",
  "# ORDER IS LOAD-BEARING: every splat-free rule first (2000-rule static budget),",
  "# then every splat rule (100-rule dynamic budget), catch-all last. One splat placed",
  "# early makes Cloudflare count EVERY later rule as dynamic and stop parsing at 100 —",
  `# which is how the catch-all fell off the edge on 2026-08-26. Dynamic rules here: ${DYNAMIC_RULES.filter(IS_DYNAMIC).length + 1}/100.`,
  "# Enforced by scripts/redirects-guard.mjs.",
  "",
  ...STATIC_RULES,
  "",
  "# ================= DYNAMIC (splat) RULES — 100 MAX, NOTHING BELOW THE CATCH-ALL =================",
  "# --- static asset trees: served directly, never routed to the app ---",
  ...DYNAMIC_RULES,
  "",
  "# --- SPA catch-all: hand the shell to wouter; unknown paths 404 in-app ---",
  "# canary-2026-08-22-7fb8: if /zzz-spa-test-7fb8 is still honest-404, this file did not reach the edge",
  "#",
  "# READ THIS BEFORE DEBUGGING THE CANARY. This rule is currently INERT, and not",
  "# because of the rule cap. Cloudflare's parser rejects it outright:",
  "#   from ends in `/*` AND to ends in `/index.html`  ->  \"Infinite loop detected in",
  "#   this rule and has been ignored.\"",
  "# Verified 2026-08-26 against wrangler 4.126.0 `pages dev`, which logs the rejection",
  "# and STILL serves index.html for unknown paths — that is Pages' built-in SPA",
  "# fallback, which applies only when the output has no 404.html. This build ships a",
  "# 404.html, so unknown paths get the designed honest-404 page instead.",
  "# To make the catch-all actually fire, `to` must not end in /index or /index.html",
  "# (e.g. `/*  /index.html?spa=1  200`, which the parser accepts because `to` is",
  "# validated with the query string included). That flips every unknown path from",
  "# honest-404 to 200-plus-shell, which is an OWNER RULING, not a config tidy-up.",
  "/*  /index.html  200",
  "",
];

writeFileSync(OUT, lines.join("\n"));
const nStatic = STATIC_RULES.filter((l) => l.trim() && !l.trim().startsWith("#")).length;
const nDynamic = DYNAMIC_RULES.filter((l) => l.trim() && !l.trim().startsWith("#")).length + 1; // +1 catch-all
console.log(`[redirects] ${routes.length} app routes detected (not emitted; catch-all covers them)`);
console.log(`[redirects] ${nStatic} static rules (cap 2000) + ${nDynamic} dynamic rules incl. catch-all (cap 100)`);
