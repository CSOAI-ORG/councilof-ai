import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:4173';
const routes = `/ /about /academy /accreditation /advisory /agents /ai-act-faq /ai-act-summary /ai-act-timeline /ai-glossary /ai-governance /ai-systems /api-docs /architecture /assessment /authority /badges /blog /california-ai-law /canada-aida /careers /case-studies /certificates /certification /charter /checklist /china-ai-law /cobol /colorado-ai-act /commons /compare /compliance /conformity-assessment /connect /council /courses /covenant /crosswalks /crown-jewels /dashboard /demo /distribution /dragonfly /ecosystem /egg /emergence /enter /enterprise /eu-ai-act /eu-ai-act-checklist /eu-ai-act-timeline /evidence /faq /fedramp /finance-ai-act /fines /foundation-models /founding-members /framework-temples /glossary /governance-graph /government /gpai /graph /hatch /healthcare-ai-act /high-risk-ai-systems /hive /how-it-works /hr-ai-act /industries /industry-playbooks /integrations /iso-42001 /jewels /join /knowledge-base /law /leaderboard /learn /legacy /lineage /login /map /mcp-fleet /mcp-tools /meok-law /minds /models /nist-ai-rmf /nist-vs-eu-ai-act /onboard /open-media /os /oscal /partners /payg /pdca /penalties /plans /playbooks /policy-generator /press /pricing /privacy /prosperity /public-dashboard /pulse /readiness /real-world /recommendations /regions /register /registry /regulation-tracker /regulator /relevance-map /resources /rfc-0024 /risk-assessment /roi-calculator /sector-atlas /sectors /security /services /settings /signup /simulate /singapore-ai-governance /sla /social /sov-space /sov-towns /sovereign /sovereign-pricing /sovereign-town /standards /start /status /system /technology /temples /terms /texas-ai-act /tool-commons /tools /towns /training /transparency /trust-center /try /uk-ai-regulation /vanta-alternative /verify-certificate /voice /vs-competitors /watchdog /welcome /why-csoai /workbench /world /world-3d /world-data`.trim().split(/\s+/);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const bad = [];
const ok = [];
let i = 0;
for (const r of routes) {
  i++;
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0,160)); });
  page.on('pageerror', e => errors.push('PAGEERR: ' + (e.message||'').slice(0,160)));
  let info = { route: r, bodyLen: 0, h1: '', errCount: 0, blank: false, boundary: false };
  try {
    await page.goto(BASE + r, { waitUntil: "domcontentloaded", timeout: 12000 });
    await page.waitForTimeout(600);
    const data = await page.evaluate(() => ({
      bodyLen: document.body.innerText.replace(/\s+/g,' ').trim().length,
      h1: (document.querySelector('h1')?.textContent || '').replace(/\s+/g,' ').trim().slice(0,60),
      boundary: /something went wrong|error boundary|cannot read|is not a function|failed to fetch dynamically imported/i.test(document.body.innerText)
    }));
    info.bodyLen = data.bodyLen; info.h1 = data.h1; info.boundary = data.boundary;
    info.errCount = errors.length;
    info.blank = data.bodyLen < 350;
    if (info.blank || info.boundary || errors.length) {
      info.errors = errors.slice(0,3);
      bad.push(info);
    } else ok.push(r);
  } catch (e) {
    info.errors = ['NAV_FAIL: ' + (e.message||'').slice(0,120)];
    bad.push(info);
  }
  await page.close();
  if (i % 25 === 0) process.stdout.write(`...${i}/${routes.length}\n`);
}
await browser.close();
fs.writeFileSync('/tmp/e2e-report.json', JSON.stringify({ total: routes.length, okCount: ok.length, badCount: bad.length, bad }, null, 2));
console.log(`\n=== E2E SMOKE: ${ok.length}/${routes.length} clean, ${bad.length} flagged ===`);
for (const b of bad) {
  console.log(`\n[${b.blank?'BLANK':b.boundary?'BOUNDARY':b.errCount?'CONSOLE':'NAVFAIL'}] ${b.route}  bodyLen=${b.bodyLen} h1="${b.h1}"`);
  if (b.errors) b.errors.forEach(e => console.log('   - ' + e));
}
console.log('\n--- full report: /tmp/e2e-report.json ---');
