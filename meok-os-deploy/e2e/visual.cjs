// MEOK OS — visual/interaction E2E (Playwright headless Chromium). Complements e2e/smoke.sh (API) with
// real rendering: signup click-through, the workspace running a goal, mobile overflow, console errors,
// screenshots. Setup once:  npm i playwright && npx playwright install chromium
// Run:  node e2e/visual.js [base_url]   → screenshots + report in ./shots/
const { chromium } = require('playwright');
const B = process.argv[2] || 'https://os.meok.ai';
const OUT = __dirname + '/shots';
require('fs').mkdirSync(OUT, { recursive: true });
let fails = 0;
const ok = (m) => console.log('  ✓ ' + m);
const no = (m) => { fails++; console.log('  ✗ FAIL: ' + m); };

(async () => {
  const br = await chromium.launch();

  // ---- desktop ----
  const ctx = await br.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 100)); });
  page.on('pageerror', e => errs.push('PE:' + String(e).slice(0, 100)));

  console.log('== homepage + signup flow ==');
  await page.goto(B, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/home.png` });
  (await page.title()).includes('MEOK') ? ok('homepage loads') : no('homepage title');
  try {
    await page.getByText('Explore myself', { exact: false }).first().click({ timeout: 6000 });
    await page.waitForTimeout(700);
    await page.getByText("I'll keep it quiet").first().click({ timeout: 6000 }); // the "Type" card, unique subtitle
    await page.waitForTimeout(700);
    await page.getByText('your life & family').first().click({ timeout: 6000 }); // the "Personal" card
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/in-os.png` });
    ok('signup: Explore → Type → Personal → in OS');
  } catch (e) { no('signup flow: ' + String(e.message).slice(0, 60)); }

  console.log('== workspace runs a goal ==');
  await page.goto(B + '/workspace.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  try {
    await page.fill('#q', 'show me the world and fly to London');
    await page.click('#go');
    await page.waitForTimeout(6000);
    const rb = (await page.textContent('#rbrain'))?.trim() || '';
    const lb = (await page.textContent('#lbrain'))?.trim() || '';
    const wins = await page.locator('.win').count();
    (rb.length > 20 && lb.length > 20) ? ok('twin brains produced answers') : no('brains empty');
    wins >= 1 ? ok('router spawned a surface (' + wins + ' window)') : no('no window spawned');
    await page.screenshot({ path: `${OUT}/workspace-run.png` });
  } catch (e) { no('workspace run: ' + String(e.message).slice(0, 60)); }

  console.log('== council + integrations ==');
  await page.goto(B + '/council.html', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
  (await page.locator('.col h3').count()) >= 6 ? ok('council has 6 voices') : no('council voice count');
  await page.goto(B + '/integrations.html', { waitUntil: 'networkidle' }); await page.waitForTimeout(1000);
  (await page.locator('.card h3').count()) >= 8 ? ok('integrations hub cards') : no('integrations cards');

  await page.goto(B, { waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  errs.length === 0 ? ok('homepage: no console errors') : no('console errors: ' + errs.join(' | '));
  await ctx.close();

  // ---- mobile 375px ----
  console.log('== mobile (375px) no horizontal overflow ==');
  const mctx = await br.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const mp = await mctx.newPage();
  for (const [nm, url] of [['home', B], ['workspace', B + '/workspace.html'], ['council', B + '/council.html'], ['pricing', B + '/pricing.html']]) {
    await mp.goto(url, { waitUntil: 'networkidle', timeout: 30000 }); await mp.waitForTimeout(1500);
    const ov = await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    await mp.screenshot({ path: `${OUT}/m-${nm}.png` });
    ov ? no('mobile ' + nm + ' overflows') : ok('mobile ' + nm + ' no overflow');
  }
  await mctx.close();
  await br.close();

  console.log('\n======== ' + (fails ? fails + ' FAILED' : 'ALL PASSED') + ' — screenshots in e2e/shots/ ========');
  process.exit(fails ? 1 : 0);
})();
