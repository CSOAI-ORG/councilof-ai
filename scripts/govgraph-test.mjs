import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
const net = [];
p.on('response', r => { if (/os\.meok\.ai\/api\/(chat|govern|knowledge)/.test(r.url())) net.push(r.status() + ' ' + r.url().split('/api/')[1].slice(0,30)); });
await p.goto('http://localhost:4173/graph', { waitUntil: 'domcontentloaded', timeout: 15000 });
await p.waitForTimeout(1000);
const inp = p.locator('input');
await inp.first().click();
await inp.first().pressSequentially('a hospital in Texas', { delay: 6 });
await p.getByText('Map it', { exact: true }).click({ force: true });
let txt = '';
for (let i = 0; i < 30; i++) {
  await p.waitForTimeout(500);
  txt = await p.evaluate(() => document.body.innerText);
  if (/Frameworks that apply to/.test(txt) && /Sovereign's read/.test(txt)) break;
}
const has = (s) => txt.includes(s);
console.log('Jurisdiction United States:', has('United States'));
console.log('Frameworks that apply to healthcare:', has('Frameworks that apply to healthcare'));
console.log('HIPAA present:', has('HIPAA'), '| EU MDR:', has('EU MDR'), '| FDA SaMD:', has('FDA SaMD'));
console.log("Sovereign's read present:", has("The Sovereign's read"));
console.log('HL7/FHIR bridge:', has('HL7/FHIR'));
const readMatch = txt.split("The Sovereign's read")[1] || '';
console.log('\nRead snippet:', readMatch.replace(/live reasoning/,'').slice(0, 240).replace(/\n+/g,' ').trim());
console.log('\nNET:', net.join(' | '));
await b.close();
