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

// GEO-critical, citable routes. Order doesn't matter.
const ROUTES = [
  '/', '/crosswalk', '/crosswalks', '/compare', '/certification', '/pricing',
  '/layer0', '/global-ai-regulation', '/readiness-assessment', '/framework-catalog',
  '/article-50', '/about',
  '/vs/vanta', '/vs/drata', '/vs/credo-ai', '/vs/onetrust',
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
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let ok = 0, fail = 0;
  for (const route of ROUTES) {
    try {
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(600); // let per-route useEffects inject title/meta/JSON-LD
      const html = '<!doctype html>\n' + await page.evaluate(() => document.documentElement.outerHTML);
      const out = route === '/' ? join(DIST, 'index.html') : join(DIST, route, 'index.html');
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, html);
      const bytes = Buffer.byteLength(html);
      console.log(`  ✓ ${route.padEnd(26)} → ${(bytes / 1024).toFixed(0)}kb`);
      ok++;
    } catch (e) {
      console.log(`  ✗ ${route.padEnd(26)} — ${String(e.message || e).slice(0, 80)}`);
      fail++;
    }
  }
  await browser.close();
  srv.close();
  console.log(`\nPrerendered ${ok}/${ROUTES.length} routes (${fail} failed).`);
  if (ok === 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
