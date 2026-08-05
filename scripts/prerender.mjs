#!/usr/bin/env node
/**
 * Post-build prerender for GEO/AEO — snapshots the SPA's key routes to static HTML
 * so AI crawlers (GPTBot, PerplexityBot, ClaudeBot, Google-Extended) and search
 * engines get full content + schema.org in the raw HTML instead of an empty shell.
 *
 * SAFE BY DESIGN: standalone script, run AFTER `npm run build:client`. It only
 * WRITES extra static HTML into dist/client — it does not touch the app, the vite
 * config, or the normal build. If it fails, the SPA still deploys as before.
 *
 * Usage:  npm run build:client && npm run prerender
 * Deps:   playwright (already in devDependencies). Needs chromium:
 *         npx playwright install chromium   (once)
 *
 * Add more routes to ROUTES as you add citable pages.
 */
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist/client');
const PORT = 4319;
// Public origin the prerendered HTML must reference. Never localhost.
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || 'https://www.csoai.org';

// GEO-critical, citable routes. Order doesn't matter.
const ROUTES = [
  // NOTE ON /benchmarks — do NOT add it here. It is a hand-written static page in
  // public/ (9.9 KB, its own inline CSS), not an SPA route, and prerendering it would
  // overwrite the static file with a React render. Its problem is the trailing-slash
  // routing below, plus the fact that it still carries ZERO JSON-LD — the best page in
  // the estate arrives at a crawler as prose it has to trust.
  '/', '/crosswalk', '/crosswalks', '/compare', '/vs/vanta', '/vs/drata', '/vs/credo-ai', '/vs/onetrust', '/certification', '/pricing',
  '/trust-center', '/global-ai-regulation', '/readiness-assessment', '/framework-catalog',
  '/article-50', '/about',
  // Jurisdiction cluster
  '/uk-ai-regulation', '/canada-aida', '/china-ai-law', '/singapore-ai-governance',
  // Sector deadline pages
  '/healthcare-ai-act', '/finance-ai-act', '/hr-ai-act',
  // AEO / high-intent cluster
  '/eu-ai-act-checklist', '/gpai', '/penalties', '/nist-vs-eu-ai-act', '/iso-42001-vs-eu-ai-act',
  '/high-risk-ai-systems', '/ai-act-summary', '/ai-governance', '/eu-ai-act-timeline',
  // Cyber + readiness
  '/dora', '/nis2', '/cra', '/fedramp', '/readiness',
  // Commercial-intent competitor pages (focus-aware Compare)
  '/vs/vanta', '/vs/drata', '/vs/credo-ai', '/vs/onetrust',
  // Net-new sector pages
  '/energy-ai-act', '/pharma-ai-act', '/defence-ai-act',
  // SOV3 model-release documentation
  '/sov3-model-card', '/sov3-system-card', '/sov3-whitepaper', '/research-transparency',
  // Measured-results cluster (citable)
  '/ai-act-benchmark',
  '/provbench',
];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain',
};

// Static server with SPA fallback to index.html (so client routes resolve).
function serve() {
  return new Promise((res) => {
    const srv = http.createServer(async (req, rq) => {
      try {
        let p = decodeURIComponent((req.url || '/').split('?')[0]);
        let file = join(DIST, p);
        let ext = extname(file);
        if (!ext) { // route → SPA shell
          file = join(DIST, 'index.html'); ext = '.html';
        }
        try { await stat(file); } catch { file = join(DIST, 'index.html'); ext = '.html'; }
        const body = await readFile(file);
        rq.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
        rq.end(body);
      } catch (e) { rq.writeHead(500); rq.end(String(e)); }
    });
    srv.listen(PORT, () => res(srv));
  });
}

async function main() {
  const srv = await serve();
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    // Build-safe: if chromium isn't installed (e.g. Vercel install --ignore-scripts),
    // skip prerender WITHOUT failing the deploy. SPA still ships; run prerender where chromium exists.
    console.log(`\n⚠ prerender skipped — chromium unavailable (${String(e.message || e).slice(0, 80)}).`);
    console.log('  To enable in CI/Vercel: add "npx playwright install chromium" before "npm run prerender".');
    srv.close();
    return; // exit 0
  }
  const page = await browser.newPage();
  let ok = 0, fail = 0;
  const written = [], failed = [];
  for (const route of ROUTES) {
    try {
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(600); // let per-route useEffects inject title/meta/JSON-LD
      let html = '<!doctype html>\n' + await page.evaluate(() => document.documentElement.outerHTML);

      // The app writes canonical/og:url from window.location.origin, which during
      // prerender is http://localhost:4319 — and that origin was being baked into every
      // deployed page. Found live 2026-08-05 on every prerendered route.
      html = html.split(`http://localhost:${PORT}`).join(PUBLIC_ORIGIN);
      const canonical = PUBLIC_ORIGIN + (route === '/' ? '/' : route);
      html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i,
        `<link rel="canonical" href="${canonical}" />`);
      html = html.replace(/(<meta\s+property=["']og:url["']\s+content=)["'][^"']*["']/i,
        `$1"${canonical}"`);

      // WRITE BOTH SHAPES. Cloudflare Pages resolved /pricing but not /compare, and the
      // difference between them was invisible in the repo: /compare/index.html existed
      // and was correct, while a request for /compare with NO trailing slash fell through
      // to the SPA fallback and served the homepage. Eight citable routes shipped that
      // way — /benchmarks, /crosswalk, /article-50, /about, /certification, /cra,
      // /ai-act-summary, /compare — all returning HTTP 200 with the wrong page, which is
      // why nothing caught it. Emitting route.html as well as route/index.html makes the
      // no-slash form resolve to a real file instead of the fallback.
      const outs = route === '/'
        ? [join(DIST, 'index.html')]
        : [join(DIST, route, 'index.html'), join(DIST, `${route.replace(/^\//, '')}.html`)];
      for (const out of outs) {
        await mkdir(dirname(out), { recursive: true });
        await writeFile(out, html);
      }
      written.push(route);
      const bytes = Buffer.byteLength(html);
      console.log(`  ✓ ${route.padEnd(26)} → ${(bytes / 1024).toFixed(0)}kb`);
      ok++;
    } catch (e) {
      console.log(`  ✗ ${route.padEnd(26)} — ${String(e.message || e).slice(0, 80)}`);
      failed.push(route);
      fail++;
    }
  }
  await browser.close();
  srv.close();
  // Belt and braces: normalise the no-slash form at the edge too, so the fix does not
  // depend on one platform's asset-resolution order staying the same.
  const redirects = written.filter((r) => r !== '/')
    .map((r) => `${r} ${r}/ 301`).join('\n');
  await writeFile(join(DIST, '_redirects'), redirects + '\n');
  console.log(`  ✓ _redirects              → ${written.length - 1} trailing-slash rules`);

  console.log(`\nPrerendered ${ok}/${ROUTES.length} routes (${fail} failed).`);

  // THE GATE WAS `if (ok === 0)`. Forty-four of forty-five routes could fail and the
  // build stayed green — which is how eight citable pages went out serving the homepage.
  // Any failure is now a build failure; a prerender that silently half-works is worse
  // than one that does not run, because the output looks fine and returns 200.
  if (fail > 0) {
    console.error(`\n✗ ${fail} route(s) failed to prerender: ${failed.join(', ')}`);
    console.error('  Refusing to ship a partial prerender — those routes would serve the SPA shell.');
    process.exit(1);
  }
  if (ok === 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
