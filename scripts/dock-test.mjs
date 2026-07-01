import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
const net = [];
p.on('response', r => { if (/os\.meok\.ai\/api\/(chat|govern|knowledge)/.test(r.url())) net.push(r.status() + ' ' + r.url().split('/api/')[1].slice(0,40)); });
p.on('requestfailed', r => { if (/os\.meok\.ai/.test(r.url())) net.push('FAIL ' + r.url().split('/api/')[1] + ' ' + (r.failure()?.errorText||'')); });

async function ask(route, question) {
  await p.goto('http://localhost:4173' + route, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(1000);
  await p.locator('button[aria-label="Open your Sovereign"]').first().click({ force: true });
  await p.waitForTimeout(400);
  const inp = p.locator('input[placeholder="Ask me anything..."]');
  await inp.click();
  await inp.pressSequentially(question, { delay: 6 });
  await inp.press('Enter');
  let ans = '';
  for (let i = 0; i < 30; i++) {
    await p.waitForTimeout(500);
    ans = await p.evaluate(() => {
      const box = document.querySelector('.overflow-y-auto');
      if (!box) return '';
      const kids = [...box.children].map(c => c.textContent.trim()).filter(Boolean);
      return kids[kids.length - 1] || '';
    });
    if (ans && !/Reasoning over live/i.test(ans) && !ans.startsWith('Is ') && !ans.startsWith('What')) break;
  }
  return ans;
}

const a1 = await ask('/status', 'Is a hiring AI in a hospital high risk under the EU AI Act?');
console.log('\n[/status] Q: hiring AI in a hospital high risk?\nA: ' + a1.slice(0, 600));
const a2 = await ask('/pricing', 'What frameworks govern a fintech company?');
console.log('\n[/pricing] Q: frameworks for a fintech?\nA: ' + a2.slice(0, 600));
const a3 = await ask('/graph', 'open sov space');
console.log('\n[/graph] Q: "open sov space" (nav intent) -> ' + a3.slice(0, 120));
console.log('\nNET:', net.join(' | '));
await b.close();
