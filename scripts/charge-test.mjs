import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 950 } });
const p = await ctx.newPage();
// start clean
await p.goto('http://localhost:4173/status', { waitUntil: 'domcontentloaded' });
await p.evaluate(() => localStorage.setItem('sov_charge', '0'));
// 1) ask the dock (+4)
await p.locator('button[aria-label="Open your Sovereign"]').first().click({ force: true });
await p.waitForTimeout(300);
const inp = p.locator('input[placeholder="Ask me anything..."]');
await inp.click(); await inp.pressSequentially('what is the EU AI Act?', { delay: 5 }); await inp.press('Enter');
await p.waitForTimeout(500);
let c1 = await p.evaluate(() => localStorage.getItem('sov_charge'));
console.log('after dock question:', c1, '(expect 4)');
// 2) graph query (+6)
await p.goto('http://localhost:4173/graph', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(500);
const gi = p.locator('input').first();
await gi.click(); await gi.pressSequentially('a hospital in Texas', { delay: 4 });
await p.getByText('Map it', { exact: true }).click({ force: true });
await p.waitForTimeout(800);
let c2 = await p.evaluate(() => localStorage.getItem('sov_charge'));
console.log('after graph query:', c2, '(expect 10)');
// 3) emergence reflects accumulated charge
await p.goto('http://localhost:4173/emergence', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(700);
const txt = await p.evaluate(() => document.body.innerText);
const m = txt.match(/Charge the emergence \((\d+)%\)/);
console.log('emergence shows charge:', m ? m[1] + '%' : '(button not found / already hatched)');
console.log('usage hint present:', /learns you as you use the OS/.test(txt));
await b.close();
