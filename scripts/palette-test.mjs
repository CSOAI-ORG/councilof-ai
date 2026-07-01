import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 950 } })).newPage();
const net = [];
p.on('response', r => { if (/os\.meok\.ai\/api\/chat/.test(r.url())) net.push(r.status()); });
await p.goto('http://localhost:4173/status', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1000);
// Cmd/Ctrl+K opens palette anywhere
await p.keyboard.press('Control+k');
await p.waitForTimeout(600);
const inputSel = 'input[placeholder="Search the OS, or ask the Sovereign anything…"]';
const opened = await p.evaluate((s) => !!document.querySelector(s), inputSel);
console.log('Palette opens on Ctrl+K:', opened);
if (!opened) { console.log('NET:', net.join(',')); await b.close(); process.exit(0); }
await p.fill(inputSel, 'Is a credit-scoring AI high risk under the EU AI Act?');
await p.waitForTimeout(400);
const bannerThere = await p.evaluate(() => /Ask the Sovereign/.test(document.body.innerText));
console.log('Ask-the-Sovereign banner present:', bannerThere);
await p.getByText('Ask the Sovereign', { exact: false }).first().click({ force: true });
let ans = '';
for (let i = 0; i < 30; i++) {
  await p.waitForTimeout(500);
  ans = await p.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find(d => d.className && String(d.className).includes('whitespace-pre-wrap'));
    return el ? el.textContent : '';
  });
  if (ans && ans.length > 40) break;
}
console.log('Live AI answer in palette:', ans ? 'YES' : 'no');
console.log('answer:', (ans || '').slice(0, 220).replace(/\n+/g,' ').trim());
console.log('NET /chat:', net.join(',') || '(none)');
await b.close();
