import { chromium } from 'playwright';
const B = process.env.E2E_BASE || 'http://localhost:4173';
const results = [];
function log(name, pass, detail) { results.push({ name, pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' :: ' + detail : '')); }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });

async function newPage(track) { const p = await ctx.newPage(); if (track) p.on('response', r => { const u = r.url(); if (/os\.meok\.ai\/api\//.test(u)) track.push(r.status() + ' ' + u.split('/api/')[1].split('?')[0]); }); return p; }
async function lastSov(p) { return p.evaluate(() => { const bs = [...document.querySelectorAll('div')].filter(d => typeof d.className === 'string' && d.className.includes('rounded-bl-sm')); return bs.length ? bs[bs.length - 1].textContent : ''; }); }
async function openDock(p) { await p.locator('button[aria-label="Open your Sovereign"]').first().click({ force: true }); await p.waitForTimeout(300); }
async function dockAsk(p, q) { const inp = p.locator('input[placeholder="Ask me anything..."]'); await inp.click(); await inp.pressSequentially(q, { delay: 4 }); await inp.press('Enter'); }

try {
  // 1. Dock live governance answer
  { const net = []; const p = await newPage(net); await p.goto(B + '/status', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500);
    await openDock(p); await dockAsk(p, 'Is a hiring AI in healthcare high risk?');
    let a = ''; for (let i = 0; i < 30; i++) { await p.waitForTimeout(500); a = await lastSov(p); if (a && /risk|framework|Act|governance/i.test(a) && !/Reasoning over/.test(a)) break; }
    log('Dock reasons live + stack', /Governance stack|high.?risk|framework|Act/i.test(a) && net.some(x => x.startsWith('200')), a.slice(0, 50)); await p.close(); }

  // 2. Governance Graph
  { const net = []; const p = await newPage(net); await p.goto(B + '/graph', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(800);
    const inp = p.locator('input').first(); await inp.click(); await inp.pressSequentially('a hospital in Texas', { delay: 4 }); await p.getByText('Map it', { exact: true }).click({ force: true });
    let t = ''; for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); t = await p.evaluate(() => document.body.innerText); if (/HIPAA/.test(t) && /United States/.test(t) && /Sovereign's read/.test(t)) break; }
    log('Governance Graph maps law', /United States/.test(t) && /HIPAA/.test(t) && /Sovereign's read/.test(t)); await p.close(); }

  // 3. Try Council - instant + live convene
  { const net = []; const p = await newPage(net); await p.goto(B + '/try', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(800);
    await p.getByText('We use AI to screen job applicants', { exact: false }).click({ force: true }); await p.waitForTimeout(2500);
    const tier = await p.evaluate(() => /High-risk/.test(document.body.innerText));
    await p.getByText('Convene the live 5-agent council', { exact: false }).click({ force: true });
    let hash = false; for (let i = 0; i < 30; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => /ledger hash \(SHA-256\)/.test(document.body.innerText))) { hash = true; break; } }
    log('Try Council instant + live + hash', tier && hash && net.filter(x => x.includes('chat')).length >= 3); await p.close(); }

  // 4. Sov Space live sim
  { const net = []; const p = await newPage(net); await p.goto(B + '/sov-space', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(800);
    const ta = p.locator('textarea'); await ta.click(); await ta.pressSequentially('A fintech in Singapore deploying an AI loan model', { delay: 3 });
    await p.getByText('Run experiment', { exact: true }).click({ force: true });
    let ok = false; for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => /SHA-256/.test(document.body.innerText) && /Council verdict/.test(document.body.innerText))) { ok = true; break; } }
    log('Sov Space live verdict + hash', ok && net.some(x => x.includes('chat'))); await p.close(); }

  // 5. World globe AI + watchdog overlay
  { const net = []; const p = await newPage(net); await p.goto(B + '/world', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1000);
    const wd = await p.evaluate(() => /Watchdog heat/.test(document.body.innerText));
    const inp = p.locator('input[placeholder*="hospital AI in Germany"]'); await inp.click(); await inp.pressSequentially('what governs a hospital AI in Germany?', { delay: 3 }); await inp.press('Enter');
    let flew = false; for (let i = 0; i < 26; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => /Brussels|Transparency 2 Aug|EU AI Act/i.test(document.body.innerText))) { flew = true; break; } }
    log('World globe AI + watchdog layer', wd && flew && net.some(x => x.includes('govern'))); await p.close(); }

  // 6. Watchdog map - report + ingest + hub
  { const net = []; const p = await newPage(net); await p.goto(B + '/watchdog-map', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(800);
    await p.fill('textarea', 'Test agent breach.'); await p.getByText('Report to the Watchdog', { exact: true }).click({ force: true }); await p.waitForTimeout(500);
    const rep = await p.evaluate(() => /logged and heat-mapped/i.test(document.body.innerText));
    await p.getByText('Pull live signals', { exact: false }).click({ force: true });
    let ing = false; for (let i = 0; i < 40; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => /Ingested \d+ live signals/.test(document.body.innerText))) { ing = true; break; } }
    log('Watchdog report + live ingest', rep && ing); await p.close(); }

  // 7. OS bar acts
  { const net = []; const p = await newPage(net); p.on('request', r => { if (/\/orchestrate/.test(r.url())) net.push('REQ orchestrate'); }); await p.goto(B + '/os', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1600);
    async function fire() { try { const inp = p.locator('input').first(); await inp.click(); await inp.fill(''); await inp.pressSequentially('open the council', { delay: 6 }); await inp.press('Enter'); } catch (e) {} }
    await fire();
    // The bar ACTS if it navigates away OR fires an orchestrate call (they race — either proves it responded).
    let acted = false; for (let i = 0; i < 40; i++) { await p.waitForTimeout(400); if (!/\/os$/.test(p.url()) || net.some(x => x.includes('orchestrate'))) { acted = true; break; } if (i === 12) await fire(); }
    log('OS home bar acts (orchestrate)', acted); await p.close(); }

  // 8. Status - SOV3 connected, no brand leak
  { const p = await newPage(); await p.goto(B + '/status', { waitUntil: 'domcontentloaded' }); let t = ''; for (let i = 0; i < 34; i++) { await p.waitForTimeout(700); t = await p.evaluate(() => document.body.innerText); if (/CONNECTED/.test(t)) break; }
    log('Status connected + brand clean', /Sovereign brain - CONNECTED/.test(t) && /Sign|Govern|Verify/.test(t) && !/SOV3|meok|defoneos/i.test(t)); await p.close(); }

  // 9. Pricing unified
  { const p = await newPage(); await p.goto(B + '/pricing', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(700);
    log('Pricing unified', await p.evaluate(() => /Own your AI/.test(document.body.innerText) && /(\$99|\$82)/.test(document.body.innerText))); await p.close(); }

  // 10. Demo OS immersive
  { const p = await newPage(); await p.goto(B + '/demo', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
    const overlay = await p.evaluate(() => !!document.querySelector('iframe[src="/globe3d.html"]') && /CSOAI Sovereign OS|full tour/i.test(document.body.innerText));
    try { await p.getByText('full tour', { exact: false }).click({ force: true }); } catch (e) {}
    let hud = false; for (let i = 0; i < 18; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => /EU AI Act|Council|Watchdog|Sovereign network|Run a live scenario/i.test(document.body.innerText))) { hud = true; break; } }
    log('Demo OS immersive (globe+HUD)', overlay && hud); await p.close(); }

} catch (e) { console.log('ERROR ' + (e.message || '').slice(0, 200)); }

const passed = results.filter(r => r.pass).length;
console.log('\n=== PRODUCT E2E: ' + passed + '/' + results.length + ' features working ===');
await browser.close();

// ─────────────────────────────────────────────────────────────────────────────
// EXIT CONTRACT (added 2026-08-26). This suite printed its tally and exited 0 no
// matter what it found, so a run where every check failed — or where the harness
// crashed before a single check ran — was indistinguishable from a clean pass to
// CI, to a shell, and to a reader skimming the log. A suite that cannot report
// failure is worse than no suite: it converts an unknown into a false assurance.
// Both an empty run and any failed check now exit non-zero.
// ─────────────────────────────────────────────────────────────────────────────
if (!results.length) {
  console.error("PRODUCT E2E: FAIL — zero checks ran. The harness died before it measured anything; that is not a pass.");
  process.exit(1);
}
const failedFeatures = results.filter((r) => !r.pass);
if (failedFeatures.length) {
  console.error(`PRODUCT E2E: FAIL — ${failedFeatures.length}/${results.length} feature(s) broken: ${failedFeatures.map((r) => r.name).join(", ")}`);
  process.exit(1);
}
console.log("PRODUCT E2E: PASS — every feature working.");
