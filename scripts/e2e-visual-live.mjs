// scripts/e2e-visual-live.mjs
// Real browser-rendered E2E check against the LIVE production site.
// Written because the Claude Science sandbox blocks the Chromium binary
// download (storage.googleapis.com path-style host is on the exfiltration
// denylist and cannot be granted) — this script is meant to be run from a
// normal machine where `npx playwright install` works.
//
// Usage:
//   cd councilof-ai
//   npm install --save-dev playwright   (if not already a devDependency)
//   npx playwright install chromium
//   node scripts/e2e-visual-live.mjs
//
// Optional: E2E_BASE=https://staging.csoai.org node scripts/e2e-visual-live.mjs

import { chromium } from 'playwright';
import fs from 'fs';

// RETARGETED 2026-08-26. The default pointed at a host this repo does not deploy, so a
// local run measured somebody else's site (or, for the Vercel default, a host that has
// been 402-dead since July). This repo deploys the Cloudflare Pages project `councilof-ai`
// at https://councilof.ai, and nothing else. A test aimed elsewhere is not a weaker test —
// it is a test of a different system, reporting on this one.
const BASE = process.env.E2E_BASE || 'https://councilof.ai';
const OS_BASE = process.env.OS_BASE || 'https://os.meok.ai';
const results = [];
function log(name, pass, detail) {
  results.push({ name, pass, detail: detail || '' });
  console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' :: ' + detail : ''));
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
fs.mkdirSync('e2e-screenshots', { recursive: true });

async function shot(page, name) {
  await page.screenshot({ path: `e2e-screenshots/${name}.png`, fullPage: false }).catch(() => {});
}

try {
  // 1. Homepage renders real content (not a blank shell / error boundary)
  {
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(800);
    const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
    const hasNav = await page.locator('a[href="/pricing"], a[href="/assess"]').count();
    const boundary = /something went wrong|error boundary|cannot read|is not a function/i.test(text);
    log('Homepage renders real content', text.length > 500 && !boundary, `bodyLen=${text.length} nav=${hasNav}`);
    await shot(page, 'homepage');
    await page.close();
  }

  // 2. Pricing page shows real pricing figures
  {
    const page = await ctx.newPage();
    await page.goto(BASE + '/pricing', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(600);
    const text = await page.evaluate(() => document.body.innerText);
    const hasPrice = /£|\$|\d{2,4}\s*\/\s*(mo|month|year)/i.test(text);
    log('Pricing page shows real figures', hasPrice, hasPrice ? 'price pattern found' : 'no price pattern in rendered DOM');
    await shot(page, 'pricing');
    await page.close();
  }

  // 3. Assess page has a working, interactive form (not just static text)
  {
    const page = await ctx.newPage();
    await page.goto(BASE + '/assess', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(600);
    const inputCount = await page.locator('input, textarea, select, button').count();
    log('Assess page has interactive form elements', inputCount > 2, `interactive elements=${inputCount}`);
    await shot(page, 'assess');
    await page.close();
  }

  // 4. Globe / hive-coverage overlay — the feature flagged as a deploy gap in
  //    AGENT_COORDINATION.md (committed but not observed reaching production
  //    as of the last check from inside the sandbox).
  {
    const page = await ctx.newPage();
    const apiHits = [];
    page.on('response', r => { if (/hive-coverage/i.test(r.url())) apiHits.push(r.status() + ' ' + r.url()); });
    await page.goto(BASE + '/globe', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);
    const text = await page.evaluate(() => document.body.innerText);
    log('Globe page loads', text.length > 200, `bodyLen=${text.length}`);
    log('hive-coverage.json fetched by globe page (deploy-gap check)', apiHits.length > 0, apiHits.join('; ') || 'no request to hive-coverage.json observed');
    await shot(page, 'globe');
    await page.close();
  }

  // 5. Live catalog count visible somewhere in the UI (tool-commons page)
  {
    const page = await ctx.newPage();
    await page.goto(BASE + '/tool-commons', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(800);
    const text = await page.evaluate(() => document.body.innerText);
    const has378 = /378/.test(text);
    log('Tool Commons page reflects live catalog count (378)', has378, has378 ? 'found 378 in DOM' : 'not found in rendered DOM (may be a different display format)');
    await shot(page, 'tool-commons');
    await page.close();
  }

  // 6. Direct check against os.meok.ai in a real browser context (CORS/JS-level,
  //    not just curl) — sign/verify round trip
  {
    const page = await ctx.newPage();
    await page.goto(OS_BASE + '/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    const signResp = await page.evaluate(async (osBase) => {
      const r = await fetch(osBase + '/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: { test: 'browser-e2e' } })
      });
      return r.json();
    }, OS_BASE);
    const verifyResp = await page.evaluate(async ({ osBase, canonical, signature, publicKey }) => {
      const r = await fetch(osBase + '/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canonical, signature, publicKey })
      });
      return r.json();
    }, { osBase: OS_BASE, canonical: signResp.canonical, signature: signResp.signature, publicKey: signResp.publicKey });
    log('Browser-context sign/verify round trip', verifyResp.valid === true, JSON.stringify(verifyResp));
    await page.close();
  }

} finally {
  await browser.close();
}

const passCount = results.filter(r => r.pass).length;
console.log(`\n${passCount}/${results.length} checks passed`);
fs.writeFileSync('e2e-visual-live-report.json', JSON.stringify({ base: BASE, osBase: OS_BASE, timestamp: new Date().toISOString(), results }, null, 2));
console.log('Report written: e2e-visual-live-report.json');
console.log('Screenshots written: e2e-screenshots/*.png');
// A run that produced no results is not a clean run — before this, a harness that threw
// before the first check printed "0/0 checks passed" and exited 0.
if (!results.length) {
  console.error("VISUAL-LIVE E2E: FAIL — zero checks ran; the harness died before measuring anything.");
  process.exitCode = 1;
} else if (passCount < results.length) {
  console.error(`VISUAL-LIVE E2E: FAIL — ${results.length - passCount}/${results.length} check(s) failed.`);
  process.exitCode = 1;
}
