import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
const net = [];
p.on('response', r => { if (/os\.meok\.ai\/api\/(chat|govern)/.test(r.url())) net.push(r.status() + ' ' + r.url().split('/api/')[1].slice(0,20)); });
await p.goto('http://localhost:4173/sov-space', { waitUntil: 'domcontentloaded', timeout: 15000 });
await p.waitForTimeout(1000);
const ta = p.locator('textarea');
await ta.click();
await ta.pressSequentially('A fintech in Singapore wants an AI model that approves consumer loans automatically.', { delay: 4 });
await p.getByText('Run experiment', { exact: true }).click({ force: true });
let txt = '';
for (let i = 0; i < 40; i++) {
  await p.waitForTimeout(500);
  txt = await p.evaluate(() => document.body.innerText);
  if (/SHA-256/.test(txt) && /Council verdict/.test(txt)) break;
}
const has = (s) => txt.includes(s);
console.log('LIVE badge:', has('LIVE - os.meok.ai'));
console.log('Singapore jurisdiction in log:', /Singapore/.test(txt));
console.log('Finance frameworks (DORA/MiFID/PSD2):', /DORA|MiFID|PSD2|Basel/.test(txt));
console.log('Council verdict rendered:', has('Council verdict'));
console.log('SHA-256 ledger hash:', has('SHA-256'));
const sigLine = (txt.match(/SHA-256:\s*([0-9a-f]{20,})/) || [])[1] || '';
console.log('hash sample:', sigLine.slice(0, 40));
const vMatch = txt.split('Council verdict:')[1] || '';
console.log('\nVerdict snippet:', vMatch.split('Layer 0')[0].slice(0, 220).replace(/\n+/g,' ').trim());
console.log('\nNET:', net.join(' | '));
await b.close();
