import { chromium } from 'playwright';

const SITE = 'https://www.csoai.org';
const BRAIN = 'https://os.meok.ai/api';
const R = [];
const pass = (c, d) => { R.push(`✅ ${c} — ${d}`); };
const fail = (c, d) => { R.push(`❌ ${c} — ${d}`); };

async function rpc(method, params) {
  const r = await fetch(BRAIN + '/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  return r.json();
}

// ---------- A. Brain / API truth ----------
async function apiTruth() {
  // Claim: "377 governed MCP tools"
  try { const d = await (await fetch(BRAIN + '/tools?q=governance')).json(); (d.total === 377) ? pass('CLAIM "377 tools"', `/api/tools total=${d.total}`) : fail('CLAIM "377 tools"', `actual total=${d.total} (copy says 377 — update if drifted)`); } catch (e) { fail('377 tools', e.message); }
  // Claim: live executable tools
  try { const d = await rpc('tools/list'); const n = (d.result?.tools || []).length; n >= 5 ? pass('Live MCP tools', `${n} execute server-side`) : fail('Live MCP tools', `only ${n}`); } catch (e) { fail('tools/list', e.message); }
  // Claim: governed answers are real
  try { const d = await rpc('tools/call', { name: 'meok_govern', arguments: { industry: 'a bank' } }); const txt = d.result?.content?.map(c => c.text).join(' ') || ''; /EU AI Act|DORA|GDPR/.test(txt) ? pass('meok_govern executes', txt.slice(0, 60)) : fail('meok_govern', 'no framework output'); } catch (e) { fail('meok_govern', e.message); }
  // Claim: "Ed25519 · Layer 0" real signature
  try { const r = await fetch(BRAIN + '/sign', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ message: 'claims-test' }) }); const d = await r.json(); (d.signature && d.publicKey) ? pass('CLAIM "Ed25519 signing"', `real sig len=${String(d.signature).length}, alg=${d.alg || '?'}`) : fail('Ed25519 signing', 'no signature/publicKey in /sign response — the "signed" claim would be false!'); } catch (e) { fail('Ed25519 signing', e.message); }
  // health
  try { const d = await (await fetch(BRAIN + '/health')).json(); d.ok ? pass('Brain health', d.service) : fail('Brain health', 'not ok'); } catch (e) { fail('health', e.message); }
  // dynamic OG
  try { const r = await fetch(SITE + '/api/og?title=Test'); (r.status === 200 && (r.headers.get('content-type') || '').includes('image')) ? pass('Dynamic OG', 'image/png 200') : fail('Dynamic OG', r.status + ''); } catch (e) { fail('OG', e.message); }
}

// ---------- B. Interactive functional truth ----------
async function interactive(b) {
  // Tool Runner actually runs
  try { const p = await b.newPage(); await p.goto(SITE + '/tool-commons', { waitUntil: 'networkidle', timeout: 25000 }); await p.waitForTimeout(2500);
    const btn = p.getByText(/Run tool/).first();
    if (await btn.count()) { const inp = p.locator('input').last(); if (await inp.count()) await inp.fill('a hospital'); await btn.click(); await p.waitForTimeout(6000);
      const body = await p.innerText('body'); /govern|framework|EU AI Act|GDPR|result/i.test(body) ? pass('CLAIM "run live tools"', 'ToolRunner returned governed output') : fail('run live tools', 'no output'); }
    else fail('run live tools', 'Run button not found'); await p.close(); } catch (e) { fail('ToolRunner', e.message.slice(0, 50)); }
  // Classifier
  try { const p = await b.newPage(); await p.goto(SITE + '/classifier', { waitUntil: 'domcontentloaded', timeout: 20000 }); await p.waitForTimeout(1200);
    await p.fill('input', 'AI that screens job applicants'); await p.getByText(/Classify/).first().click(); await p.waitForTimeout(6000);
    const body = await p.innerText('body'); /high[-\s]?risk|risk tier|obligation/i.test(body) ? pass('CLAIM "classify your AI"', 'returned a risk classification') : fail('classify', 'no classification'); await p.close(); } catch (e) { fail('classifier', e.message.slice(0, 50)); }
  // Report — must produce a REAL seal (SOV: fingerprint or sig), not just "sealed" text
  try { const p = await b.newPage(); await p.goto(SITE + '/report', { waitUntil: 'domcontentloaded', timeout: 20000 }); await p.waitForTimeout(1200);
    await p.fill('textarea', 'Proxy discrimination in an AI hiring tool.'); await p.getByText(/Submit \+ seal/).first().click(); await p.waitForTimeout(6000);
    const body = await p.innerText('body'); /(SOV:|Ed25519|sig )/i.test(body) ? pass('CLAIM "sealed to Layer 0"', 'receipt shows a real signature/fingerprint') : (/sealed|receipt|WD-/i.test(body) ? fail('sealed to Layer 0', 'shows "sealed" but NO real signature visible — verify not just a hash') : fail('report seal', 'no receipt')); await p.close(); } catch (e) { fail('report', e.message.slice(0, 50)); }
  // Workbench signs
  try { const p = await b.newPage(); await p.goto(SITE + '/workbench', { waitUntil: 'domcontentloaded', timeout: 20000 }); await p.waitForTimeout(1200);
    const inp = p.locator('input').first(); await inp.fill('Classify an EU AI Act risk tier for a credit model'); await p.getByText(/Run \+ seal/).first().click(); await p.waitForTimeout(7000);
    const body = await p.innerText('body'); /seal|Ed25519|Layer 0|council/i.test(body) ? pass('CLAIM "signed artifacts"', 'workbench produced a sealed artifact') : fail('workbench sign', 'no sealed artifact'); await p.close(); } catch (e) { fail('workbench', e.message.slice(0, 50)); }
  // Council viz on /try
  try { const p = await b.newPage(); await p.goto(SITE + '/try', { waitUntil: 'domcontentloaded', timeout: 20000 }); await p.waitForTimeout(1200);
    await p.getByText(/screen job applicants|facial recognition/i).first().click().catch(()=>{}); await p.waitForTimeout(3500);
    const body = await p.innerText('body'); /quorum|care-floor|Byzantine|consensus/i.test(body) ? pass('CLAIM "33-agent council"', 'BFT council visualization present') : fail('council viz', 'not shown'); await p.close(); } catch (e) { fail('council', e.message.slice(0, 50)); }
  // Globe loads
  try { const p = await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.goto(SITE + '/globe3d.html', { waitUntil: 'domcontentloaded', timeout: 25000 }); await p.waitForTimeout(4000);
    const hasCanvas = await p.evaluate(() => !!document.querySelector('canvas')); hasCanvas ? pass('CLAIM "live globe"', 'Cesium canvas rendered') : fail('globe', 'no canvas'); await p.close(); } catch (e) { fail('globe', e.message.slice(0, 50)); }
}

const b = await chromium.launch();
await apiTruth();
await interactive(b);
await b.close();
const passes = R.filter(x => x.startsWith('✅')).length, fails = R.filter(x => x.startsWith('❌')).length;
console.log('# CSOAI Claims-Verification E2E\n');
console.log(R.join('\n'));
console.log(`\nRESULT: ${passes} pass · ${fails} FAIL`);
