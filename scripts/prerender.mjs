/* prerender.mjs — turn a Vite SPA build into real HTML files, one per route.
 *
 * THE DIAGNOSIS THIS IMPLEMENTS. csoai.org is not a site with a broken prerenderer. It
 * has no prerenderer at all. What it has is:
 *
 *   · a Vite SPA — `<div id="root"></div>`, one 1.26 MB bundle, 399 routes declared
 *     inside it, 273 dynamic imports, react-helmet for per-route meta;
 *   · a blanket catch-all rewrite, so EVERY path returns 200 with that shell. `/vercel.json`,
 *     `/netlify.toml`, `/_redirects` and `/404.html` all return 200 and the shell, which
 *     means the site has no 404 at all and every nonexistent URL is a valid page to a
 *     crawler;
 *   · and about five hand-authored standalone HTML files — /govbench, /tools, /pricing,
 *     /sov-space — sitting in the build output. Those carry no bundle reference and no
 *     root div. Somebody made them by hand.
 *
 * The last point is the useful one: those five prove the hosting serves a real HTML file
 * per path perfectly well. Nothing about the platform needs to change. What is missing is
 * a build step that produces the other 394.
 *
 * WHAT THIS DOES. After `vite build`, it serves `dist/` locally, loads every route in
 * headless Chromium, waits for the app to actually paint, and writes the rendered DOM
 * back as `dist/<route>/index.html`. The bundle tag stays in place, so the browser still
 * hydrates and the app behaves exactly as it does now — but a crawler, an answer engine,
 * an LLM fetch and a link preview all get the text.
 *
 * WHY SNAPSHOTTING RATHER THAN SSR. SSR means moving the app to a server runtime and
 * making 273 dynamic imports and every browser-only API server-safe. That is weeks. This
 * is a build step, it changes no application code, and it produces exactly the artefact
 * the five hand-made pages already prove the host will serve. If the estate later wants
 * true SSR, nothing here blocks it.
 *
 * WHAT IT WILL NOT FIX, said plainly: a route whose content arrives from a network call
 * after load will snapshot with whatever was on screen at the wait threshold. Those routes
 * need either a longer per-route wait or real SSR. The report at the end lists every route
 * that came out thin so none of them passes silently.
 *
 *   node prerender.mjs                      # dist/, all discovered routes
 *   node prerender.mjs --dist build --min 400 --wait 2500
 *   node prerender.mjs --routes routes.txt  # explicit list, one per line
 */
import { chromium } from "playwright";
import http from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join, extname, dirname } from "node:path";

const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const DIST = arg("dist", "dist");
const MIN = Number(arg("min", 400));       // visible chars below which a route is "thin"
const WAIT = Number(arg("wait", 1800));    // ms after load before snapshotting
// 0 = let the OS pick a free port. It used to default to 4400, which meant two lanes
// could not prerender at the same time: the second process failed to bind and then
// happily rendered every route against the FIRST lane's server — a different build.
// That is how /world "timed out" intermittently while the report showed nothing wrong.
// A staging server is per-run private state; it must never be a shared fixed address.
// An explicit --port is still honoured, and now fails loudly if it is taken.
const PORT = Number(arg("port", 0));
const CONC = Number(arg("conc", 4));
// Production origin the prerendered canonical/og:url/twitter:url must carry (NOT the
// localhost:PORT staging origin the snapshot runs on). Override with --prod-origin if the
// canonical host ever changes.
const PROD_ORIGIN = arg("prod-origin", "https://councilof.ai");

// Delete any previous report BEFORE doing anything. A tracked prerender-report.json
// survived a crashed run on 2026-08-26 — Playwright's chromium had been updated away, the
// prerender died on launch, and the stale report still claimed "582 ok" against 5 files on
// disk. check-prerender caught it, but only because it cross-checks the filesystem; the
// report alone would have shipped a lie about a build that never ran.
// A run that does not finish must leave NO report, not an old one. Three outcomes, never
// two: a fresh report, or nothing at all.
try { if (existsSync("prerender-report.json")) unlinkSync("prerender-report.json"); } catch {}

if (!existsSync(DIST)) {
  console.error(`no ${DIST}/ — run \`vite build\` first`);
  process.exit(1);
}

// ---------------------------------------------------------------- route discovery
function discover() {
  const explicit = arg("routes", null);
  if (explicit) {
    return readFileSync(explicit, "utf8").split("\n").map(s => s.trim())
      .filter(s => s.startsWith("/"));
  }
  // Routes live as string literals in the bundle. This is a heuristic and it is meant to
  // be — check the printed count against what you expect before shipping the output.
  const assets = join(DIST, "assets");
  let js = "";
  if (existsSync(assets))
    for (const f of readdirSync(assets))
      if (f.endsWith(".js")) js += readFileSync(join(assets, f), "utf8");
  const found = new Set(["/"]);
  for (const m of js.matchAll(/path\s*:\s*["'`](\/[a-zA-Z0-9\/_-]*)["'`]/g)) found.add(m[1]);
  for (const m of js.matchAll(/["'`](\/[a-z0-9][a-z0-9\/-]{2,60})["'`]\s*[,:\)]/g)) {
    const p = m[1];
    if (!/\.(js|css|png|svg|jpg|json|ico|woff2?|txt|xml)$/i.test(p) && !p.startsWith("/assets/"))
      found.add(p);
  }
  // Dynamic and alias paths the homepage / lobby send strangers to. Heuristic
  // discovery never sees /for/:persona or /industries/:slug, so those cold-load
  // 404 against the honest catch-all. Force them into the snapshot queue.
  const MUST = [
    "/gspc", "/scoreboard", "/console", "/council-os", "/lobby", "/legal",
    "/vs", "/vs/vanta", "/vs/drata", "/vs/credo-ai", "/vs/onetrust",
    "/for/regulator", "/for/enterprise", "/for/finance", "/for/healthcare",
    "/for/startup", "/for/sec-filer",
    "/industries/insurance", "/industries/finance", "/industries/healthcare",
    "/industries/health", "/industries/care", "/industries/transport",
    "/industries/transportation", "/industries/retail", "/industries/education",
    "/industries/energy", "/industries/government", "/industries/legal",
    "/library/axes",
    "/verify", "/os", "/assess", "/academy", "/compare", "/layer0",
    "/trust-center", "/network", "/intel", "/hive", "/methodology", "/honesty",
    "/dashboard", "/login", "/start", "/about", "/insurers",
    "/privacy-policy", "/firewall-charter", "/gspc-verify", "/gspc-arena",
    "/embed", "/white-label",
    "/challenge",
    "/regulator-findings",
    "/arena-scoreboard",
    "/watchdog", "/disclaimers", "/csoai-law",
    "/models", "/tools", "/api-docs",
    "/workbench", "/instrument", "/system-card", "/feed", "/mcp-fleet",
    "/crosswalk", "/refutation-ledger", "/library",
    "/east-west", "/challenge",
    // Flagship pages that were only SPA-routed (direct HTTP 404 = credibility leak:
    // crawlers + the law's visitors hit a broken page). Force-prerender them.
    "/article-50", "/tour", "/live-ledger", "/gspc-anchors", "/xrpl-attest",
    "/distribution-integrity",
    "/gspc-gap-map",
    // Legal surface (2026-08-23 audit)
    "/legal/licensing", "/legal/privacy", "/legal/terms", "/legal/cookies",
    "/legal/disclaimers", "/legal/dpa", "/legal/founding-council", "/legal/membership",
    "/legal/sla", "/licensing-agreement", "/terms-of-service", "/privacy",
    "/pricing-legacy", "/council-licensing",
    // Per-axis deep-dive URLs (2026-08-25): the board's axis rows link /gspc/<axis>;
    // production is a static host with an honest 404, so each needs a real snapshot.
    "/gspc/governance", "/gspc/safety", "/gspc/provenance", "/gspc/continuity",
    "/gspc/conformance", "/gspc/openness", "/gspc/machinery-conformity", "/gspc/care",
    "/gspc/cross-reality", "/gspc/detector-interop", "/gspc/art5-safeguard",
    "/gspc/swarm", "/gspc/affect", "/gspc/jail",
    // Financial half of the 22-axis canon (2026-08-25): the 8 financial/domain axes were
    // invisible — /gspc/<financial-axis> 404'd and no board listed them. /financial-axes
    // lists all 8 honestly from /interop/financial-axes.json; each /gspc/<financial-axis>
    // now renders a deep-dive from the same JSON. Static host needs a real snapshot per URL.
    "/financial-axes",
    "/gspc/provenance-controls", "/gspc/reserve-attestation", "/gspc/regulatory-framework",
    "/gspc/distribution-integrity", "/gspc/custody-disclosure", "/gspc/ai-economy-index",
    "/gspc/human-labour-index", "/gspc/humanoid-labour-index",
    // Sitemap-listed routes that fell through to the homepage shell (E2E RETEST #2):
    // both have real pages in App.tsx but were never in the snapshot queue.
    "/badges", "/verify-certificate",
    // Benchmark surfaces (2026-08-23 audit: 404'd live — heuristic discovery misses
    // route-manifest paths). Council OS layer URLs carry ?view= query strings that
    // heuristic discovery never sees; snapshot each so the static host serves them
    // exactly as it does for arena/towns (query-string-named snapshot dirs).
    "/products", "/catalog", "/gpai-evidence", "/cra-readiness", "/cobolbridge",
    "/benchmark-quality", "/benchmark-index", "/benchmarks", "/compare", "/leaderboard",
    "/gspc-arena?view=benchmarks",
    "/gspc-arena?view=training",
    "/gspc-arena?view=arena", "/gspc-arena?view=globe", "/gspc-arena?view=towns",
    // Dead homepage blog slugs already 308 to /blog/. Do not snapshot them —
    // prerendered HTML shadows the 308 and brand-gate rejects leftover
    // competitor GRC prices on choosing-ai-compliance-vendor.
    // AEO regulatory-explainer seed pages (22) — regulator/procurement citation surface.
    // Absent from heuristic discovery (blog deep links are only reachable via /blog/:slug),
    // so each needs an explicit snapshot or the static host serves an honest-404.
    "/blog/ai-insurance-verified-measurement",
    "/blog/ai-procurement-insurance-measured-risk",
    "/blog/bsi-art1-ai-testing-framework",
    "/blog/council-of-europe-ai-framework-convention",
    "/blog/colorado-chatbot-rulemaking-timeline",
    "/blog/colorado-ai-act-chatbot-disclosure-timeline",
    "/blog/council-city-municipal-ai-procurement",
    "/blog/council-signal-how-governance-measurement-works",
    "/blog/eu-ai-act-article-5-prohibited-practices",
    "/blog/eu-ai-act-article-50-machine-readable-marking",
    "/blog/eu-ai-act-high-risk-provider-obligations",
    "/blog/fedramp-oscal-september-30-mandate",
    "/blog/fedramp-oscal-ai-procurement",
    "/blog/iso-42001-audit-readiness",
    "/blog/iso-42001-vs-etsi-en-304-223",
    "/blog/what-is-monitored-containment",
    "/blog/monitored-containment-vs-provable-isolation",
    "/blog/nist-ai-600-1-profile-mapping",
    "/blog/scitt-ai-supply-chain-transparency",
    "/blog/third-party-ai-audit-standards-ss584-isae3000",
    "/blog/uk-cyber-security-resilience-bill-ai-supply-chain",
    "/blog/verified-measurement-credential-how-to-verify",
    "/blog/governance-benchmarking-is-broken-signed-fix",
    "/evidence-rail",
    "/datasets",
  ];
  for (const p of MUST) found.add(p);
  // /api/* are data endpoints served by Pages Functions — snapshotting them writes an
  // index.html that can shadow the JSON on the static host, and (2026-08-25) bakes live
  // data (incl. corrections-ledger text) into pages the brand gate then rejects.
  const DEAD_BLOG = new Set([
    "/blog/layer-0-agent-economy-trust",
    "/blog/eu-ai-act-article-50-countdown",
    "/blog/choosing-ai-compliance-vendor",
    "/blog/dora-compliance-uk-financial-services",
    "/blog/ai-governance-vs-compliance",
    "/blog/nis2-compliance-critical-infrastructure",
  ]);
  // Retired internal-codename URLs are owned by 308 function stubs — never prerender an
  // HTML page for them, or the codename becomes a served public page (brand-gate fails).
  const RETIRED_CODENAME = /^\/(sov3|sovos|ceasai|about-ceasai)\b/i;
  const routes = [...found].filter(p => !p.includes(":") && !p.includes("*") && !p.startsWith("/api/") && !DEAD_BLOG.has(p) && !RETIRED_CODENAME.test(p));
  // Library IA: /library/:sector is a dynamic route (filtered above), but the 8 concrete
  // sectors are prime AEO citation surface and the sitemap lists them — prerender each
  // so the static host serves them (2026-08-23 JEEVES: they were 404 on the static host
  // because only the :param pattern was discovered, never its values).
  for (const s of ["regulation", "regions", "academy", "tech", "axes", "governance", "product", "company"]) {
    routes.push(`/library/${s}`);
  }
  return [...new Set(routes)].sort();
}

const routes = discover();
console.log(`${routes.length} routes to prerender from ${DIST}/\n`);

// ---------------------------------------------------------------- static server
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain" };
const shell = readFileSync(join(DIST, "index.html"), "utf8");
const srv = http.createServer((q, r) => {
  const p = decodeURIComponent(q.url.split("?")[0]);
  const f = join(DIST, p);
  try {
    if (existsSync(f) && statSync(f).isFile()) {
      r.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
      r.end(readFileSync(f));
      return;
    }
  } catch {}
  // Data surfaces are served by Pages Functions in production, not by files in dist/ —
  // locally they'd fall through to the HTML catch-all, and any route that fetches them
  // at load would snapshot with "fetch failed" baked into its static HTML (the
  // 2026-08-25 /gspc-scoreboard defect). Proxy them to production so snapshots capture
  // the real board state.
  if (p.startsWith("/api/") || p.startsWith("/signed/")) {
    fetch(PROD_ORIGIN + p).then(async res => {
      const body = Buffer.from(await res.arrayBuffer());
      r.writeHead(res.status, { "content-type": res.headers.get("content-type") || "application/json" });
      r.end(body);
    }).catch(() => { r.writeHead(502); r.end(); });
    return;
  }
  // the same catch-all the host uses, so the snapshot sees what production serves
  r.writeHead(200, { "content-type": "text/html" });
  r.end(shell);
});

// Bind before rendering anything, and refuse to continue if the requested port is busy —
// rendering against someone else's server is worse than not rendering at all.
srv.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error(`prerender: port ${PORT} is already in use — another prerender is running.`);
    console.error("Omit --port so the OS assigns a free one, or wait for the other lane.");
    process.exit(2);
  }
  throw e;
});
const ACTIVE_PORT = await new Promise((resolve) => {
  srv.listen(PORT, () => resolve(srv.address().port));
});
console.log(`prerender: staging server on http://localhost:${ACTIVE_PORT}`);

// ---------------------------------------------------------------- render
const browser = await chromium.launch();
const results = [];
const queue = routes.slice();

async function worker(id) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on("pageerror", e => errs.push(e.message.slice(0, 100)));
  while (queue.length) {
    const route = queue.shift();
    const rec = { route, chars: 0, ok: false };
    try {
      // `networkidle` is the right wait for most routes but the wrong bar for a few heavy
      // ones: /world mounts a 3D globe with ~9 large assets and intermittently needs more
      // than 30s to go quiet, so it failed on some builds and passed on others. Excluding it
      // would hide a real page from crawlers to keep the gate green — the wrong trade. So:
      // retry once on timeout with a longer budget and the weaker `load` bar, which is enough
      // for a snapshot. Only a route that fails BOTH attempts is a genuine failure.
      try {
        await page.goto(`http://localhost:${ACTIVE_PORT}${route}`, { waitUntil: "networkidle", timeout: 30000 });
      } catch (e) {
        if (!/Timeout/i.test(String(e && e.message))) throw e;
        rec.slow = true;
        await page.goto(`http://localhost:${ACTIVE_PORT}${route}`, { waitUntil: "load", timeout: 90000 });
      }
      await page.waitForTimeout(rec.slow ? WAIT * 3 : WAIT);
      const info = await page.evaluate(() => {
        const root = document.getElementById("root");
        return { text: (document.body.innerText || "").replace(/\s+/g, " ").trim(),
                 rootEmpty: !root || root.children.length === 0,
                 title: document.title,
                 desc: document.querySelector('meta[name="description"]')?.content || "" };
      });
      rec.chars = info.text.length;
      rec.title = info.title;
      rec.hasDesc = !!info.desc;
      rec.rootEmpty = info.rootEmpty;

      // The snapshot keeps <script> tags so the app still hydrates on top of it. Only the
      // rendered markup is added — nothing is removed.
      // Canonical fix: the per-route self-canonical script in index.html sets canonical/og:url/
      // twitter:url to `location.origin` — which, DURING PRERENDER, is http://localhost:4400.
      // Left unrewritten it bakes the staging origin into every static page (the sitewide
      // localhost:4400 canonical the 2026-08-14 audit flagged). Rewrite it to the prod origin
      // in the captured markup before it is written to dist.
      const html = (await page.content())
        .split(`http://localhost:${ACTIVE_PORT}`).join(PROD_ORIGIN);
      // A snapshot that captured a data-fetch failure must be UNABLE to ship: it would
      // bake the error into the crawler-visible page (2026-08-25: /gspc-scoreboard went
      // live reading "Board fetch failed"). Refuse to write it, count it as an error.
      if (/fetch failed|HTML instead of JSON|Failed to fetch/i.test(info.text)) {
        rec.err = "BAKED-FETCH-FAILURE refused (page text contains a fetch error)";
        results.push(rec);
        console.log(`ERR  ${String(rec.chars).padStart(6)}ch  ${rec.route}  ${rec.err}`);
        continue;
      }
      const out = route === "/" ? join(DIST, "index.html")
                                : join(DIST, route.replace(/^\//, ""), "index.html");
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, html, "utf8");
      rec.ok = rec.chars >= MIN && !rec.rootEmpty;
      rec.bytes = html.length;
      rec.errs = errs.splice(0).slice(0, 1);
    } catch (e) {
      rec.err = e.message.slice(0, 80);
    }
    results.push(rec);
    const mark = rec.err ? "ERR  " : rec.ok ? "ok   " : "THIN ";
    console.log(`${mark}${String(rec.chars).padStart(6)}ch  ${rec.route}` +
                (rec.err ? `  ${rec.err}` : "") +
                (rec.rootEmpty ? "  ROOT STILL EMPTY" : "") +
                (rec.errs?.length ? `  js: ${rec.errs[0]}` : ""));
  }
  await page.close();
}
await Promise.all(Array.from({ length: CONC }, (_, i) => worker(i)));
await browser.close();
srv.close();

// ---------------------------------------------------------------- report
const ok = results.filter(r => r.ok);
const thin = results.filter(r => !r.ok && !r.err);
const err = results.filter(r => r.err);
const noDesc = ok.filter(r => !r.hasDesc);
const dupTitle = {};
ok.forEach(r => (dupTitle[r.title] ||= []).push(r.route));

console.log(`\n═══ ${results.length} routes`);
console.log(`  ${ok.length} prerendered with ≥${MIN} visible characters`);
console.log(`  ${thin.length} THIN — rendered but under threshold, or root still empty`);
console.log(`  ${err.length} errored`);
// A route that only rendered because it got a second, longer attempt is reported, not hidden.
// It passed, but it is one asset away from failing, and a silent retry is how a page quietly
// becomes unshippable without anyone noticing.
const slow = results.filter((r) => r.slow);
if (slow.length) {
  console.log(`  ${slow.length} SLOW — needed a retry at the longer timeout: ${slow.map((r) => r.route).join(", ")}`);
}
if (thin.length) {
  console.log(`\nTHIN routes need a longer wait or real SSR — they are NOT fixed:`);
  thin.slice(0, 25).forEach(r => console.log(`  ${String(r.chars).padStart(6)}ch  ${r.route}`));
  if (thin.length > 25) console.log(`  … and ${thin.length - 25} more`);
}
if (noDesc.length)
  console.log(`\n${noDesc.length} prerendered routes have no meta description.`);
const dups = Object.entries(dupTitle).filter(([, v]) => v.length > 3);
if (dups.length) {
  console.log(`\nDuplicate <title> across routes — react-helmet is not firing before the snapshot:`);
  dups.slice(0, 5).forEach(([t, v]) => console.log(`  ${v.length}×  "${t.slice(0, 60)}"`));
}
writeFileSync("prerender-report.json", JSON.stringify(results, null, 1));
console.log(`\nwrote prerender-report.json`);
console.log(`Ship only if THIN is small and you have looked at every route in it.`);
