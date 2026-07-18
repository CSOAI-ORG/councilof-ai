// drive.js — iterate the logged-in profile with full control + observability.
// Usage: node drive.js steps.json
// Steps: {goto:url} {click:"text=Export"} {fill:["selector","val"]} {press:"Enter"}
//        {waitFor:"selector"} {waitMs:1500} {shot:"name"} {dump:true}
// After every step it screenshots to /tmp/hive_shots and prints title/url.
const { chromium } = require('playwright');
const fs = require('fs');
const PROFILE = process.env.HIVE_BRIDGE_PROFILE || (process.env.HOME + '/.meok-browser-profile');
const OUT = '/tmp/hive_shots';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const steps = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    channel: 'chrome', headless: false, viewport: { width: 1440, height: 1000 },
    args: ['--no-first-run', '--no-default-browser-check'],
  });
  const page = ctx.pages()[0] || await ctx.newPage();
  let i = 0;
  const snap = async (tag) => {
    const f = `${OUT}/${tag}.png`;
    try { await page.screenshot({ path: f, fullPage: false }); } catch (e) {}
    let links = [];
    try {
      links = await page.$$eval('a,button,[role=button]', els => els
        .map(e => (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' '))
        .filter(t => t && t.length < 60).slice(0, 60));
    } catch (e) {}
    console.log(`\n[${tag}] ${page.url()}\n  title: ${await page.title().catch(()=> '')}`);
    console.log('  clickables: ' + JSON.stringify([...new Set(links)].slice(0, 45)));
  };
  for (const s of steps) {
    i++;
    try {
      if (s.goto)    { await page.goto(s.goto, { waitUntil: 'domcontentloaded', timeout: 45000 }); await page.waitForTimeout(2500); }
      if (s.waitFor) { await page.locator(s.waitFor).first().waitFor({ timeout: 20000 }); }
      if (s.click)   { await page.locator(s.click).first().click({ timeout: 15000 }); await page.waitForTimeout(1500); }
      if (s.fill)    { await page.locator(s.fill[0]).first().fill(s.fill[1], { timeout: 15000 }); }
      if (s.press)   { await page.keyboard.press(s.press); await page.waitForTimeout(1000); }
      if (s.waitMs)  { await page.waitForTimeout(s.waitMs); }
      await snap(`s${i}_${(s.shot || s.goto || s.click || 'step').toString().replace(/[^a-z0-9]+/gi,'_').slice(0,30)}`);
    } catch (e) {
      console.log(`\n[s${i}] ERROR: ${e.message.split('\n')[0]}`);
      await snap(`s${i}_error`);
    }
  }
  await ctx.close();
  console.log('\n=== done ===');
})();
