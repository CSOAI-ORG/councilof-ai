import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 950 } });

async function openDock(p) {
  await p.locator('button[aria-label="Open your Sovereign"]').first().click({ force: true });
  await p.waitForTimeout(300);
}
async function ask(p, text) {
  const inp = p.locator('input[placeholder="Ask me anything..."]');
  await inp.click(); await inp.pressSequentially(text, { delay: 5 }); await inp.press('Enter');
}
function lastSov(p) {
  return p.evaluate(() => {
    const bs = [...document.querySelectorAll('div')].filter(d => typeof d.className === 'string' && d.className.includes('rounded-bl-sm'));
    return bs.length ? bs[bs.length - 1].textContent : '';
  });
}

// 1) Explain this page (page-aware) on /sov-space
const p1 = await ctx.newPage();
const net1 = [];
p1.on('response', r => { if (/api\/(orchestrate|chat)/.test(r.url())) net1.push(r.url().split('/api/')[1].split('?')[0]); });
await p1.goto('http://localhost:4173/sov-space', { waitUntil: 'domcontentloaded' }); await p1.waitForTimeout(900);
await openDock(p1);
await p1.getByText('Explain this page', { exact: true }).click({ force: true });
let ex = '';
for (let i = 0; i < 30; i++) { await p1.waitForTimeout(500); ex = await lastSov(p1); if (ex && !/On it|^$/.test(ex)) break; }
console.log('[explain] endpoint:', net1.join(',') || '(none)');
console.log('[explain] answer:', (ex || '').slice(0, 180).replace(/\n+/g, ' ').trim());
await p1.close();

// 2) "take me to pricing" -> opens /pricing
const p2 = await ctx.newPage();
await p2.goto('http://localhost:4173/graph', { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(900);
await openDock(p2);
await ask(p2, 'take me to pricing');
let navigated = false;
for (let i = 0; i < 24; i++) { await p2.waitForTimeout(400); if (/\/pricing/.test(p2.url())) { navigated = true; break; } }
console.log('[command] navigated to pricing:', navigated, '| url:', p2.url().replace('http://localhost:4173',''));
await p2.close();

// 3) governance question still rich
const p3 = await ctx.newPage();
await p3.goto('http://localhost:4173/status', { waitUntil: 'domcontentloaded' }); await p3.waitForTimeout(900);
await openDock(p3);
await ask(p3, 'Is a healthcare triage AI high risk?');
let a3 = '';
for (let i = 0; i < 30; i++) { await p3.waitForTimeout(500); a3 = await lastSov(p3); if (a3 && /risk|framework|Act|governance/i.test(a3) && !/Reasoning over/.test(a3)) break; }
console.log('[question] still answers + stack:', /Governance stack|framework|high.?risk/i.test(a3) ? 'YES' : 'no');
console.log('[question] snippet:', (a3 || '').slice(0, 150).replace(/\n+/g, ' ').trim());
await p3.close();
await b.close();
