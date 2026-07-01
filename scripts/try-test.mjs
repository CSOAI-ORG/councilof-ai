import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 1100 } })).newPage();
const net = [];
p.on('response', r => { if (/os\.meok\.ai\/api\/chat/.test(r.url())) net.push(r.status()); });
await p.goto('http://localhost:4173/try', { waitUntil: 'domcontentloaded', timeout: 15000 });
await p.waitForTimeout(1000);
await p.getByText('We use AI to screen job applicants — what do we need?', { exact: true }).click();
await p.waitForTimeout(2800); // let deterministic agents animate in
let txt = await p.evaluate(() => document.body.innerText);
console.log('Instant verdict tier High-risk:', /High-risk/.test(txt));
console.log('Convene button present:', /Convene the live 5-agent council/.test(txt));
await p.getByText('Convene the live 5-agent council', { exact: false }).click({ force: true });
let done = false;
for (let i = 0; i < 40; i++) {
  await p.waitForTimeout(600);
  txt = await p.evaluate(() => document.body.innerText);
  if (/ledger hash \(SHA-256\)/.test(txt)) { done = true; break; }
}
const liveCount = await p.evaluate(() => document.querySelectorAll('span').length && [...document.querySelectorAll('span')].filter(s => s.textContent.trim().toLowerCase() === 'live').length);
console.log('Live agent badges (expect ~5):', liveCount);
console.log('Sealed hash present:', done);
const hash = (txt.match(/SHA-256\):\s*([0-9a-f]{20,})/) || [])[1] || '';
console.log('hash:', hash.slice(0, 40));
console.log('chat calls:', net.length, '(', net.join(',') , ')');
await b.close();
