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
 *
 * CONCURRENCY. With no --port the local server takes an OS-assigned free port, so two agent
 * lanes can prerender at the same time without touching each other. The browser and the server
 * are closed on every exit path, so a run leaves nothing behind. Never clean up after a run
 * with `pkill -f chrome-headless-shell` or a hardcoded `lsof -tiTCP:4400` — both are
 * machine-wide and kill other lanes' runs (2026-08-26: a lane died at 143 of 582 routes with
 * 439 "Target page, context or browser has been closed"). Use scripts/prerender-run.sh, which
 * scopes every kill to the pids this run reports via --run-state.
 *
 * Concurrency is now SAFE, not free: two full lanes on one machine are 2 × --conc browser
 * contexts competing for CPU, and a route that loses that race snapshots whatever had painted
 * by --wait. Measured 2026-08-26 on this repo: /about came out 245KB and 171KB in two parallel
 * lanes against 260KB solo — same routes, same pass, less late-injected CSS. If THIN rises when
 * you run lanes in parallel, lower --conc per lane or raise --wait; it is not a fault in the
 * routes.
 */
import { chromium } from "playwright";
import http from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { execFileSync } from "node:child_process";

const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
const DIST = arg("dist", "dist");
const MIN = Number(arg("min", 400));       // visible chars below which a route is "thin"
const WAIT = Number(arg("wait", 1800));    // ms after load before snapshotting
// LANE ISOLATION (2026-08-26). With no --port this binds an OS-assigned free port, so two
// agent lanes prerendering at once never contend by default. `--port N` still binds exactly N
// and fails loudly if N is taken — it never silently drifts onto someone else's port.
const PORT_ARG = arg("port", null);
const REQUESTED_PORT = PORT_ARG === null ? 0 : Number(PORT_ARG);
// Optional path to record THIS run's node pid / browser pid / bound port. A wrapper reads it
// to clean up this run and nothing else — never `pkill -f chrome-headless-shell`, which kills
// every headless browser on the box regardless of which run launched it.
const RUN_STATE = arg("run-state", null);
let PORT = REQUESTED_PORT;   // the real bound port; filled in after listen() resolves
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
    // The 15 canonical sector pages (client/src/data/industries.ts). Only four of
    // them were listed here; the other eleven had no snapshot at all, so a crawler
    // cold-loading /industries/media got the SPA shell — which is how "the sector
    // pages are one shared document" became true of the rendered HTML even though
    // the React pages differ.
    "/industries", "/competitors",
    "/industries/insurance", "/industries/government", "/industries/care",
    "/industries/defence", "/industries/critical-infrastructure", "/industries/media",
    "/industries/agent-rails", "/industries/open-source", "/industries/multi-agent-commerce",
    "/industries/security", "/industries/machinery", "/industries/humanoid",
    "/industries/xr", "/industries/legal", "/industries/emotion-ai",
    // Legacy slugs kept so no existing URL 404s — these fall through to the
    // ContentPage dataset, not the sector template.
    "/industries/finance", "/industries/healthcare",
    "/industries/health", "/industries/transport",
    "/industries/transportation", "/industries/retail", "/industries/education",
    "/industries/energy",
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
    "/harness",
    "/gspc/provenance-controls", "/gspc/reserve-attestation", "/gspc/regulatory-framework",
    "/gspc/distribution-integrity", "/gspc/custody-disclosure", "/gspc/ai-economy-index",
    "/gspc/human-labour-index", "/gspc/humanoid-labour-index",
    // Sitemap-listed routes that fell through to the homepage shell (E2E RETEST #2):
    // both have real pages in App.tsx but were never in the snapshot queue.
    "/badge",
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
    // The Regulator Atlas under BOTH its routes. /regulators is discovered only
    // because App.tsx happens to spell it in a title map; /regulator-atlas — the
    // path the atlas is linked and referred to by — is written as a JSX
    // `path="/regulator-atlas"` attribute, which heuristic discovery does not
    // match, so it had no snapshot at all and cold-loaded as a 404.
    "/regulators", "/regulator-atlas",
  ];
  for (const p of MUST) found.add(p);

  // ── /hive/:slug — every Framework Hive page, derived from the Hive data ──────
  // The Regulator Atlas links here for each regime it covers. Until 2026-08-26
  // these deep links were snapshotted only BY ACCIDENT: heuristic discovery found
  // the handful that happen to appear as string literals in Ecosystem.tsx, and any
  // Hive page not listed there had no snapshot, so the static host served an honest
  // 404 on a link the Atlas was actively rendering. Derive the list from the data
  // instead of relying on which paths another page happens to spell out.
  //
  // Read as slugs off the source rather than typed here, so a Hive entry added
  // later is snapshotted without anyone remembering to edit this file.
  try {
    const hiveSrc = readFileSync("client/src/data/hive-frameworks.ts", "utf8");
    const slugs = [...hiveSrc.matchAll(/^\s*slug: "([a-z0-9-]+)"/gm)].map((m) => m[1]);
    if (slugs.length === 0) throw new Error("no slugs parsed from hive-frameworks.ts");
    for (const s of slugs) found.add(`/hive/${s}`);
    console.log(`hive: queued ${slugs.length} /hive/:slug deep links from hive-frameworks.ts`);
  } catch (e) {
    // Loud, not silent: a parse failure here means Hive deep links ship as 404s.
    console.error(`hive: could not derive /hive/:slug routes — ${e.message}`);
    process.exitCode = 1;
  }
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

// --- Two guards the snapshot queue was missing (nav-integrity audit, 2026-08-26) ---
//
// (1) HAND-AUTHORED STATIC PAGES. /arena is not a wouter route — it is an 8 KB static
//     page in public/arena/index.html. Heuristic discovery finds the string "/arena" in
//     the bundle, the SPA renders its honest-404 for it, and the snapshot (3.8k visible
//     chars, comfortably over --min) was written straight over the real page. The gate
//     could not see it: the 404 page is not thin. Never write into a path public/ already
//     owns.
// (2) PATHS _redirects SENDS SOMEWHERE ELSE. /gspc and /verify are 308s in _redirects
//     AND entries in MUST — a snapshot at those paths is a static file competing with a
//     redirect for the same URL. The file has no business existing.
const PUBLIC_DIR = join(DIST, "..", "..", "public");
function publicOwns(route) {
  const rel = route.replace(/^\//, "").split("?")[0];
  if (!rel) return false;
  return existsSync(join(PUBLIC_DIR, rel, "index.html")) || existsSync(join(PUBLIC_DIR, rel + ".html"));
}
// Only a rule that lands the visitor on a DIFFERENT page disqualifies a snapshot.
// The 36 "/pricing -> /pricing/" canonicalisers are the opposite: the 308 exists
// precisely so the bare path reaches the snapshot, which lives at /pricing/index.html.
const REDIRECTED_ELSEWHERE = new Set();
try {
  const rf = join(PUBLIC_DIR, "_redirects");
  const norm = (x) => (x.split("?")[0].replace(/\/$/, "") || "/");
  for (const raw of readFileSync(rf, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [from, to, code] = line.split(/\s+/);
    if (!from || !to || !from.startsWith("/") || from.includes("*")) continue;
    if (!(Number(code) >= 300 && Number(code) < 400)) continue;
    if (norm(from) === norm(to)) continue;          // trailing-slash canonicaliser: keep
    REDIRECTED_ELSEWHERE.add(norm(from));
  }
} catch {}

const discovered = discover();
const skippedStatic = discovered.filter(publicOwns);
const skippedRedirect = discovered.filter((r) => !publicOwns(r) && REDIRECTED_ELSEWHERE.has(r.split("?")[0].replace(/\/$/, "") || "/"));
const routes = discovered.filter((r) => !skippedStatic.includes(r) && !skippedRedirect.includes(r));
if (skippedStatic.length)
  console.log(`prerender: ${skippedStatic.length} route(s) skipped — public/ already owns the file: ${skippedStatic.join(", ")}`);
if (skippedRedirect.length)
  console.log(`prerender: ${skippedRedirect.length} route(s) skipped — _redirects sends them elsewhere: ${skippedRedirect.join(", ")}`);
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

// Bind before anything else starts, and learn the port actually assigned — every URL below
// (and the canonical rewrite) must use it, not the requested one.
await new Promise((resolve, reject) => {
  const onErr = e => {
    if (e.code === "EADDRINUSE")
      reject(new Error(`port ${REQUESTED_PORT} is already in use. Another lane is on it — ` +
        `omit --port to take a free one automatically, or pass a different --port.`));
    else reject(e);
  };
  srv.once("error", onErr);
  srv.listen(REQUESTED_PORT, () => { srv.off("error", onErr); resolve(); });
}).catch(e => { console.error(e.message); process.exit(1); });
PORT = srv.address().port;

// The pid of the browser THIS run launched. Playwright's JS driver spawns it as a direct
// child of this node process, so it can be read straight off our own children — scoped by
// ppid, which is the exact opposite of `pkill -f chrome-headless-shell` matching every lane's
// browser at once. Used only to report the pid; the run closes its own browser regardless.
function findBrowserPid() {
  try {
    for (const line of execFileSync("ps", ["-eo", "pid=,ppid=,comm="], { encoding: "utf8" }).split("\n")) {
      const m = line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);
      if (!m || m[2] !== String(process.pid)) continue;
      if (/chrome|chromium|headless|firefox|webkit/i.test(m[3])) return Number(m[1]);
    }
  } catch {}
  return null;
}

// ---------------------------------------------------------------- lifecycle
// Nothing this run starts may outlive it. The browser and the HTTP server close on EVERY exit
// path — clean finish, thrown error, or signal — so a run never leaves an orphan that some
// other lane has to kill. This is what makes concurrent lanes safe: no run ever reaches for a
// machine-wide `pkill`, because there is nothing machine-wide left to kill.
let browser = null;
let closed = false;
async function shutdown() {
  if (closed) return;
  closed = true;
  try { if (browser) await browser.close(); } catch {}
  try { srv.close(); } catch {}
  if (RUN_STATE) { try { unlinkSync(RUN_STATE); } catch {} }
}
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.once(sig, () => { shutdown().finally(() => process.exit(130)); });
}
process.on("exit", () => { try { srv.close(); } catch {} });

// ---------------------------------------------------------------- render
const results = [];
const queue = routes.slice();

// SURVIVING A FOREIGN KILL. Closing our own browser cleanly stops us harming other lanes, but
// it cannot stop another lane's `pkill -f chrome-headless-shell` from killing OURS — and that
// is not hypothetical: it happened again mid-verification on 2026-08-26, killing two runs at
// route 406 of 581. A run that just records 175 "browser has been closed" errors is worse than
// it looks: every errored route keeps whatever HTML was in dist/ from the LAST build, so a
// stale page ships and the report calls it an error rather than a snapshot. So: when the
// browser disappears underneath us, relaunch it, put the route back in the queue and carry on.
// Loud, bounded, and it never invents a snapshot.
const MAX_RELAUNCH = Number(arg("max-relaunch", 3));
const RETRIES_PER_ROUTE = 2;
const retried = new Map();
let browserGen = 0;
let relaunches = 0;
let relaunching = null;
const browserGone = e =>
  /Target (?:page, context or browser|closed)|browser has been closed|Browser closed|has been closed/i
    .test(e?.message || "");

async function relaunchBrowser(seenGen) {
  if (browserGen !== seenGen) return;        // another worker already replaced it
  if (relaunching) { await relaunching; return; }
  if (relaunches >= MAX_RELAUNCH)
    throw new Error(`browser died ${relaunches}× from outside this run — giving up`);
  relaunching = (async () => {
    relaunches++;
    try { await browser.close(); } catch {}
    browser = await chromium.launch();
    browserGen++;
    const pid = findBrowserPid();
    console.log(`\n!!  browser was closed from OUTSIDE this run (someone's machine-wide kill). ` +
                `Relaunched ${relaunches}/${MAX_RELAUNCH}, new browser pid ${pid ?? "unknown"}. ` +
                `Affected routes are requeued, not failed.\n`);
    if (RUN_STATE)
      writeFileSync(RUN_STATE,
        JSON.stringify({ pid: process.pid, browserPid: pid, port: PORT, dist: DIST }, null, 1));
  })();
  try { await relaunching; } finally { relaunching = null; }
}

async function worker(id) {
  let gen = browserGen;
  const errs = [];
  const openPage = async () => {
    gen = browserGen;
    const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    pg.on("pageerror", e => errs.push(e.message.slice(0, 100)));
    return pg;
  };
  let page = await openPage();
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
        await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: "networkidle", timeout: 30000 });
      } catch (e) {
        if (!/Timeout/i.test(String(e && e.message))) throw e;
        rec.slow = true;
        await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: "load", timeout: 90000 });
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
      // twitter:url to `location.origin` — which, DURING PRERENDER, is http://localhost:<PORT>.
      // Left unrewritten it bakes the staging origin into every static page (the sitewide
      // localhost canonical the 2026-08-14 audit flagged). Rewrite it to the prod origin in the
      // captured markup before it is written to dist. PORT is the port actually bound, which is
      // OS-assigned unless --port was passed — brand-gate's infra_leak rule matches any
      // localhost:<port>, not just 4400, so a missed rewrite still fails the build.
      const html = (await page.content())
        .split(`http://localhost:${PORT}`).join(PROD_ORIGIN);
      // A snapshot that captured a data-fetch failure must be UNABLE to ship: it would
      // bake the error into the crawler-visible page (2026-08-25: /gspc-scoreboard went
      // live reading "Board fetch failed"). Refuse to write it, count it as an error.
      if (/fetch failed|HTML instead of JSON|Failed to fetch/i.test(info.text)) {
        rec.err = "BAKED-FETCH-FAILURE refused (page text contains a fetch error)";
        results.push(rec);
        console.log(`ERR  ${String(rec.chars).padStart(6)}ch  ${rec.route}  ${rec.err}`);
        continue;
      }
      // A snapshot of the honest-404 catch-all is worse than no snapshot: the route has
      // no page, and writing one turns a soft in-app 404 into a hard, crawler-visible
      // 200 that SAYS "Page Not Found" — and, at /arena, silently replaced a real page.
      // The 404 body is ~3.8k visible chars, so --min can never catch it. Refuse it.
      if (/Page Not Found/i.test(info.text) && /\b404\b/.test(info.text) && route !== "/404") {
        // NOT an error — a refusal. Heuristic discovery scrapes every "/x"-shaped string
        // in the bundle, so paths with no route reach the queue; writing their snapshot
        // turns a soft in-app 404 into a hard static page that answers 200 and says
        // "Page Not Found" (and at /arena it silently replaced a real page). The 404 body
        // is ~3.8k visible chars, so --min can never catch it. Skip and list it instead.
        rec.skipped404 = true;
        results.push(rec);
        console.log(`SKIP ${String(rec.chars).padStart(6)}ch  ${rec.route}  no route — honest-404, nothing written`);
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
      // The browser vanished under us. That is not this route's fault — requeue it.
      const n = retried.get(route) || 0;
      if (browserGone(e) && n < RETRIES_PER_ROUTE) {
        retried.set(route, n + 1);
        queue.push(route);
        try {
          await relaunchBrowser(gen);
          try { await page.close(); } catch {}
          page = await openPage();
        } catch (fatal) {
          rec.err = fatal.message.slice(0, 80);
          results.push(rec);
          console.log(`ERR  ${String(rec.chars).padStart(6)}ch  ${rec.route}  ${rec.err}`);
          return;
        }
        continue;
      }
      rec.err = e.message.slice(0, 80);
    }
    results.push(rec);
    const mark = rec.err ? "ERR  " : rec.skipped404 ? "SKIP " : rec.ok ? "ok   " : "THIN ";
    console.log(`${mark}${String(rec.chars).padStart(6)}ch  ${rec.route}` +
                (rec.err ? `  ${rec.err}` : "") +
                (rec.rootEmpty ? "  ROOT STILL EMPTY" : "") +
                (rec.errs?.length ? `  js: ${rec.errs[0]}` : ""));
  }
  try { await page.close(); } catch {}
}
try {
  browser = await chromium.launch();
  const browserPid = findBrowserPid();
  // Printed so a supervising wrapper can scope any kill to THIS run's own processes.
  console.log(`run: node pid ${process.pid} · browser pid ${browserPid ?? "unknown"} · ` +
              `server http://localhost:${PORT}\n`);
  if (RUN_STATE)
    writeFileSync(RUN_STATE,
      JSON.stringify({ pid: process.pid, browserPid, port: PORT, dist: DIST }, null, 1));
  await Promise.all(Array.from({ length: CONC }, (_, i) => worker(i)));
} finally {
  await shutdown();
}

// ---------------------------------------------------------------- report
const ok = results.filter(r => r.ok);
const skipped404 = results.filter(r => r.skipped404);
const thin = results.filter(r => !r.ok && !r.err && !r.skipped404);
const err = results.filter(r => r.err);
const noDesc = ok.filter(r => !r.hasDesc);
const dupTitle = {};
ok.forEach(r => (dupTitle[r.title] ||= []).push(r.route));

console.log(`\n═══ ${results.length} routes`);
console.log(`  ${ok.length} prerendered with ≥${MIN} visible characters`);
console.log(`  ${thin.length} THIN — rendered but under threshold, or root still empty`);
console.log(`  ${err.length} errored`);
if (skipped404.length) {
  console.log(`  ${skipped404.length} SKIPPED — no route, renders the honest-404; nothing written:`);
  console.log(`     ${skipped404.map(r => r.route).join(", ")}`);
  console.log(`     (these are strings heuristic discovery scraped from the bundle, not links —`);
  console.log(`      prune them from discovery or give them a real route.)`);
}
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
