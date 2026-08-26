import { chromium } from 'playwright-core';
const BASE = 'http://localhost:5301';
const ROUTES = process.argv.slice(2);
const browser = await chromium.launch();
for (const route of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const errs = [], nets = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0,220)); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0,220)));
  page.on('response', r => { if (r.status() >= 400) nets.push(r.status() + ' ' + r.url().replace(BASE,'')); });
  try { await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 }); }
  catch (e) { console.log(`\n##### ${route}\nGOTO FAIL: ${e.message.slice(0,200)}`); await ctx.close(); continue; }
  await page.waitForTimeout(2500);
  const title = await page.title();
  const url = page.url();
  const text = (await page.evaluate(() => document.body.innerText)).replace(/\n{3,}/g,'\n\n');
  const controls = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('button,select,input,a[role="button"],[role="tab"],[data-testid]').forEach(el => {
      const t = (el.innerText||el.value||el.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,70);
      const tid = el.getAttribute('data-testid');
      out.push(`${el.tagName.toLowerCase()}${tid?'[tid='+tid+']':''}${el.disabled?'[DISABLED]':''} :: ${t}`);
    });
    return [...new Set(out)];
  });
  console.log(`\n##### ${route}  -> ${url}`);
  console.log(`TITLE: ${title}`);
  console.log(`--- TEXT (${text.length} ch) ---`);
  console.log(text.slice(0, 5000));
  console.log(`--- CONTROLS (${controls.length}) ---`);
  console.log(controls.join('\n'));
  console.log(`--- CONSOLE ERRORS (${errs.length}) ---\n${errs.slice(0,12).join('\n')}`);
  console.log(`--- FAILED REQUESTS (${nets.length}) ---\n${[...new Set(nets)].slice(0,12).join('\n')}`);
  await ctx.close();
}
await browser.close();
