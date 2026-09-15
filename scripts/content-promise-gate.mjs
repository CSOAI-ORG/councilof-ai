#!/usr/bin/env node
/**
 * content-promise-gate — promises and destinations are gated TOGETHER.
 *
 * WHY. On 2026-09-15 a third-party review found, on the live site: nine "field
 * notes" promoted on the homepage whose every link resolved to the withdrawal
 * notice; /status/ rendering the homepage under a "Yield status" title; backend
 * enum keys (CROSSWALK_POINTERS, most_obligations_incl_art50_and_gpai, no_fine)
 * printed as teaching copy; a "no on-chain rating or attestation body publishes"
 * comparison sitting on the same page as its own retraction; and two <main>
 * landmarks on the homepage. Every one of those passed brand-gate (display
 * strings), facts-gate (claims vs facts.json) and an HTTP 200 check, because
 * none of those gates binds a promise to the destination it points at.
 *
 * WHAT IT CHECKS (source + rendered output; exit 1 on any hit, 2 if it cannot run).
 *   1. Recommended reading. client/src/data/recommended-reading.json entries marked
 *      "published" must resolve to an App.tsx route served by a real component; an
 *      entry pointing at a withdrawn route (ContentReviewNotice, or a route pattern
 *      in publication-state.json) fails unless it is labelled "withdrawn".
 *   2. Publication manifest ↔ App.tsx. Every <Route … component={ContentReviewNotice}>
 *      must be in publication-state.json → withdrawn_routes, and vice versa. A
 *      picker that trusts the manifest is only as good as this equality.
 *   3. /status. App.tsx must route /status to a component whose source carries
 *      data-testid="service-status" and never "home-verify". The prerendered
 *      dist/client/status/index.html (when present) must say the same.
 *   4. Raw internal labels. Rendered HTML text must not carry the enum keys above
 *      outside a <details> technical-inspector block; DashboardLearningPane.tsx
 *      must not interpolate pointer.tier / regulation_context.state directly.
 *   5. The universal comparison. No rendered page or source file may assert
 *      "no on-chain rating or attestation body …" / "nobody else … discloses"
 *      unless the sentence is itself the correction (retraction context nearby).
 *   6. One <main> per rendered page.
 *
 * SELFTEST. `--selftest` runs every check against planted fixtures and asserts
 * each one goes red on the violation AND green on the honest form. A gate that
 * has never been seen failing is decoration.
 *
 *   node scripts/content-promise-gate.mjs [dist/client]
 *   node scripts/content-promise-gate.mjs --selftest
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const SELFTEST = args.includes("--selftest");
const DIST = resolve(REPO, args.find((a) => !a.startsWith("--")) ?? "dist/client");

const PATHS = {
  app: "client/src/App.tsx",
  manifest: "client/src/data/publication-state.json",
  reading: "client/src/data/recommended-reading.json",
  learningPane: "client/src/components/DashboardLearningPane.tsx",
  pages: "client/src/pages",
};

/* ── pure checks (strings in, findings out) ──────────────────────────────── */

export const RAW_LABELS = [
  /\bCROSSWALK_POINTERS\b/,
  /\bmost_obligations_incl_art50_and_gpai\b/,
  /\bincorrect_or_misleading_info\b/,
  /\bno_fine\b/,
];

export const UNIVERSAL_COMPARISON =
  /\bno (?:other )?(?:on-chain )?(?:rating|attestation)(?: or attestation)? body (?:publishes|discloses)|nobody else (?:in the field )?discloses|no one else (?:in the field )?(?:publishes|discloses)|the only (?:rating|attestation|measurement) body/i;

/** A retraction within ~200 chars means the sentence IS the correction. */
export const CORRECTION_CONTEXT = /used to say|withdrawn|retract|had not measured|is gone|no longer|UNMEASURED|correction/i;

export function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ");
}

/** Rendered text with every <details> technical inspector removed. */
export function primaryText(html) {
  return visibleText(html.replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi, " "));
}

export function parseRoutes(appSource) {
  const routes = [];
  const re = /<Route\s+path="([^"]+)"\s+component=\{([A-Za-z0-9_]+)\}/g;
  let m;
  while ((m = re.exec(appSource)) !== null) routes.push({ path: m[1], comp: m[2] });
  return routes;
}

export function routePatternMatches(pattern, path) {
  const norm = (p) => {
    const bare = p.split(/[?#]/)[0] || "/";
    return bare.length > 1 ? bare.replace(/\/+$/, "") : bare;
  };
  const a = norm(pattern).split("/");
  const b = norm(path).split("/");
  if (a.length !== b.length) return false;
  return a.every((seg, i) => (seg.startsWith(":") ? b[i].length > 0 : seg === b[i]));
}

/** 1 + 2: manifest ↔ App.tsx, and recommended reading vs both. */
export function checkRecommendations({ appSource, manifest, reading }) {
  const out = [];
  const routes = parseRoutes(appSource);
  const withdrawnInApp = new Set(routes.filter((r) => r.comp === manifest.withdrawal_notice_component).map((r) => r.path));
  const withdrawnInManifest = new Set(manifest.withdrawn_routes);
  for (const p of withdrawnInApp) if (!withdrawnInManifest.has(p)) out.push(`manifest drift: App.tsx withdraws ${p} but publication-state.json does not list it`);
  for (const p of withdrawnInManifest) if (!withdrawnInApp.has(p)) out.push(`manifest drift: publication-state.json lists ${p} but App.tsx does not withdraw it`);

  const isWithdrawn = (href) => [...withdrawnInManifest, ...withdrawnInApp].some((pat) => routePatternMatches(pat, href));
  const servedBy = (href) => routes.find((r) => routePatternMatches(r.path, href));
  for (const e of reading.entries) {
    if (typeof e.href !== "string" || !e.href.startsWith("/")) { out.push(`recommended reading: ${JSON.stringify(e.href)} is not a site path`); continue; }
    const withdrawn = isWithdrawn(e.href);
    if (e.state === "published") {
      if (withdrawn) out.push(`recommended reading promotes a WITHDRAWN destination: ${e.href} ("${e.title}") — label it "withdrawn" or remove it`);
      const r = servedBy(e.href);
      if (!r) out.push(`recommended reading: ${e.href} matches no App.tsx route`);
      else if (r.comp === manifest.withdrawal_notice_component) out.push(`recommended reading: ${e.href} is served by ${r.comp}`);
    } else if (e.state === "withdrawn") {
      if (!withdrawn) out.push(`recommended reading labels ${e.href} withdrawn but nothing withdraws it — stale label`);
    } else out.push(`recommended reading: ${e.href} has unknown state ${JSON.stringify(e.state)}`);
  }
  return out;
}

/** 3: /status is a status page, in source and (when rendered) in dist. */
export function checkStatusRoute({ appSource, pageSourceFor, statusHtml }) {
  const out = [];
  const route = parseRoutes(appSource).find((r) => r.path === "/status");
  if (!route) return ["/status has no App.tsx route"];
  const src = pageSourceFor(route.comp);
  if (src == null) out.push(`/status routes to ${route.comp} but its page source was not found`);
  else {
    if (!/data-testid="service-status"/.test(src)) out.push(`/status routes to ${route.comp}, which does not declare data-testid="service-status"`);
    if (/data-testid="home-verify"|<HeroSlides/.test(src)) out.push(`/status routes to ${route.comp}, which renders homepage content`);
  }
  if (typeof statusHtml === "string") {
    if (/data-testid="home-verify"/.test(statusHtml)) out.push("rendered /status/index.html carries the homepage (data-testid=\"home-verify\")");
    // /status is client-only in prerender.mjs (it reads live Functions), so the file may be the
    // unrendered SPA shell that hydrates into the page checked above. That is honest; the homepage,
    // or any other rendered page, is not.
    const unrenderedShell = /<div id="root"><\/div>/.test(statusHtml);
    if (!/data-testid="service-status"/.test(statusHtml) && !unrenderedShell) out.push("rendered /status/index.html does not carry data-testid=\"service-status\" and is not the unrendered client-only shell");
  }
  return out;
}

/** 4: raw enum keys in primary copy (rendered) and raw interpolation (source). */
export function checkRawLabelsRendered(html, file = "html") {
  const text = primaryText(html);
  return RAW_LABELS.filter((re) => re.test(text)).map((re) => `${file}: raw internal label ${re.source} in primary copy (allowed only inside <details>)`);
}
export function checkRawLabelsSource(paneSource) {
  const out = [];
  const forbidden = [
    [/\{pointer\.tier\}/, "{pointer.tier} rendered raw"],
    [/`\s*·\s*\$\{pointer\.tier\}/, "pointer.tier concatenated into copy"],
    // Raw ids may appear inside a <code> element of the technical inspector; anywhere else is copy.
    [/(?<!<code>)\{scenario\?\.regulation_context\?\.state\s*\?\?\s*"UNCHECKABLE"\}/, "regulation_context.state rendered raw"],
    [/\{boardState\}/, "board status rendered raw"],
    [/\{publishedState\}/, "published_state rendered raw"],
  ];
  for (const [re, why] of forbidden) if (re.test(paneSource)) out.push(`DashboardLearningPane.tsx: ${why} — go through learningDisplayLabels`);
  if (!/learningDisplayLabels/.test(paneSource)) out.push("DashboardLearningPane.tsx does not import the display dictionary");
  return out;
}

/** 5: the universal comparison, in rendered text or source, outside its correction. */
export function checkUniversalComparison(text, file = "text") {
  const out = [];
  const re = new RegExp(UNIVERSAL_COMPARISON.source, "gi");
  let m;
  while ((m = re.exec(text)) !== null) {
    const window = text.slice(Math.max(0, m.index - 200), Math.min(text.length, m.index + m[0].length + 200));
    if (!CORRECTION_CONTEXT.test(window)) out.push(`${file}: universal comparison "${m[0]}" without its correction — a first/only/nobody-else claim needs a comparative evidence record`);
  }
  return out;
}

/** 6: exactly one <main> per rendered page (zero is a static asset, tolerated). */
export function checkOneMain(html, file = "html") {
  const n = (html.match(/<main\b/gi) ?? []).length;
  return n > 1 ? [`${file}: ${n} <main> landmarks (one per page)`] : [];
}

/* ── drivers ─────────────────────────────────────────────────────────────── */

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    // interop/ holds captured third-party evidence pages (mirrors of what a stranger saw);
    // they are artefacts we cite, not copy we wrote, so the site-page rules do not apply.
    if (st.isDirectory()) { if (name !== "node_modules" && name !== "functions" && name !== "interop") walk(p, out); }
    else if (/\.html?$/i.test(name)) out.push(p);
  }
  return out;
}

function pageSourceForFactory() {
  return (comp) => {
    const app = readFileSync(resolve(REPO, PATHS.app), "utf8");
    const m = app.match(new RegExp(`const\\s+${comp}\\s*=\\s*lazy\\(\\(\\)\\s*=>\\s*import\\(["']\\.\\/pages\\/([^"']+)["']`))
      ?? app.match(new RegExp(`import\\s+${comp}\\s+from\\s+["'](?:\\.\\/|@\\/)pages\\/([^"']+)["']`));
    if (!m) return null;
    for (const ext of ["", ".tsx", ".ts", "/index.tsx"]) {
      const p = resolve(REPO, PATHS.pages, m[1] + ext);
      if (existsSync(p) && statSync(p).isFile()) return readFileSync(p, "utf8");
    }
    return null;
  };
}

function run() {
  const need = [PATHS.app, PATHS.manifest, PATHS.reading, PATHS.learningPane].map((p) => resolve(REPO, p));
  for (const p of need) if (!existsSync(p)) { console.error(`✖ content-promise-gate cannot run: ${relative(REPO, p)} missing`); process.exit(2); }
  const appSource = readFileSync(need[0], "utf8");
  const manifest = JSON.parse(readFileSync(need[1], "utf8"));
  const reading = JSON.parse(readFileSync(need[2], "utf8"));
  const pane = readFileSync(need[3], "utf8");
  const findings = [];

  findings.push(...checkRecommendations({ appSource, manifest, reading }));
  const statusFile = join(DIST, "status", "index.html");
  findings.push(...checkStatusRoute({ appSource, pageSourceFor: pageSourceForFactory(), statusHtml: existsSync(statusFile) ? readFileSync(statusFile, "utf8") : undefined }));
  findings.push(...checkRawLabelsSource(pane));

  // Source-level comparison scan: every page/component the client renders.
  const srcFiles = [];
  (function walkSrc(dir) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walkSrc(p);
      else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) srcFiles.push(p);
    }
  })(resolve(REPO, "client/src"));
  for (const f of srcFiles) {
    const s = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
    findings.push(...checkUniversalComparison(s, relative(REPO, f)));
  }

  const htmlFiles = walk(DIST);
  for (const f of htmlFiles) {
    const html = readFileSync(f, "utf8");
    const rel = relative(REPO, f);
    findings.push(...checkOneMain(html, rel));
    findings.push(...checkRawLabelsRendered(html, rel));
    findings.push(...checkUniversalComparison(visibleText(html), rel));
  }

  if (findings.length) {
    console.error(`✖ content-promise-gate: ${findings.length} finding(s)`);
    for (const f of findings) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`✓ content-promise-gate: recommendations, /status, labels, comparisons and landmarks hold (${srcFiles.length} source files, ${htmlFiles.length} rendered pages under ${relative(REPO, DIST) || "."})`);
}

function selftest() {
  let bad = 0;
  const must = (name, findings, expectRed) => {
    const red = findings.length > 0;
    if (red !== expectRed) { bad++; console.error(`✖ selftest ${name}: expected ${expectRed ? "RED" : "GREEN"}, got ${red ? "RED" : "GREEN"} ${JSON.stringify(findings)}`); }
    else console.log(`✓ selftest ${name}: ${expectRed ? "goes red" : "stays green"}`);
  };
  const app = `<Switch>
  <Route path="/" component={HomeVerify} />
  <Route path="/methodology" component={Methodology} />
  <Route path="/blog/:slug" component={ContentReviewNotice} />
  <Route path="/blog" component={ContentReviewNotice} />
  <Route path="/status" component={YieldStatus} />
</Switch>`;
  const manifest = { withdrawal_notice_component: "ContentReviewNotice", withdrawn_routes: ["/blog/:slug", "/blog"] };
  must("recommended reading (clean)", checkRecommendations({ appSource: app, manifest, reading: { entries: [{ href: "/methodology", state: "published", title: "M" }, { href: "/blog", state: "withdrawn", title: "W" }] } }), false);
  must("recommended reading promotes a withdrawn article", checkRecommendations({ appSource: app, manifest, reading: { entries: [{ href: "/blog/governance-benchmarking-is-broken-signed-fix", state: "published", title: "X" }] } }), true);
  must("recommended reading to a route that does not exist", checkRecommendations({ appSource: app, manifest, reading: { entries: [{ href: "/no-such-page", state: "published", title: "X" }] } }), true);
  must("manifest drift (App withdraws more than the manifest)", checkRecommendations({ appSource: app, manifest: { ...manifest, withdrawn_routes: ["/blog"] }, reading: { entries: [] } }), true);
  must("manifest drift (stale manifest entry)", checkRecommendations({ appSource: app, manifest: { ...manifest, withdrawn_routes: [...manifest.withdrawn_routes, "/gone"] }, reading: { entries: [] } }), true);

  const statusOk = (comp) => (comp === "YieldStatus" ? '<section data-testid="service-status">' : null);
  const statusHome = (comp) => (comp === "YieldStatus" ? '<div data-testid="home-verify"><HeroSlides />' : null);
  must("/status is a status page", checkStatusRoute({ appSource: app, pageSourceFor: statusOk, statusHtml: '<main></main><section data-testid="service-status">' }), false);
  must("/status renders the homepage (source)", checkStatusRoute({ appSource: app, pageSourceFor: statusHome }), true);
  must("/status client-only SPA shell (unrendered root)", checkStatusRoute({ appSource: app, pageSourceFor: statusOk, statusHtml: '<title>Service status | Council of AI</title><div id="root"></div>' }), false);
  must("/status prerendered as another page", checkStatusRoute({ appSource: app, pageSourceFor: statusOk, statusHtml: '<main><div id="root"><section data-testid="yield-dashboard">x</section></div></main>' }), true);
  must("/status renders the homepage (prerendered)", checkStatusRoute({ appSource: app, pageSourceFor: statusOk, statusHtml: '<div data-testid="home-verify">' }), true);

  must("raw label in primary copy", checkRawLabelsRendered("<p>most_obligations_incl_art50_and_gpai</p>"), true);
  must("raw label inside <details>", checkRawLabelsRendered("<p>Fine tier</p><details><summary>Technical</summary><code>most_obligations_incl_art50_and_gpai</code></details>"), false);
  must("raw interpolation in the pane source", checkRawLabelsSource('import x from "@/data/learningDisplayLabels";\n{pointer.tier ? ` · ${pointer.tier}` : ""}'), true);
  must("pane goes through the dictionary", checkRawLabelsSource('import { fineTierLabel } from "@/data/learningDisplayLabels";\n{fineTierLabel(pointer.tier).label}'), false);

  must("universal comparison, asserted", checkUniversalComparison("Statistical discipline. The part no on-chain rating or attestation body publishes. Every number carries its uncertainty."), true);
  must("universal comparison, as its own correction", checkUniversalComparison("This page used to say that nobody else in the field discloses confidence-interval methodology. We had not measured that, so it is gone."), false);

  must("one main", checkOneMain("<main>a</main>"), false);
  must("two mains", checkOneMain("<main>a</main><main>b</main>"), true);

  if (bad) { console.error(`✖ content-promise-gate selftest FAILED (${bad})`); process.exit(1); }
  console.log("✓ content-promise-gate selftest: every check goes red on its violation and green on the honest form");
}

if (SELFTEST) selftest();
else run();
