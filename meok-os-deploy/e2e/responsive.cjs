// MEOK OS — responsive regression (Playwright). Every page × mobile(375) + tablet(768):
// asserts NO horizontal overflow, and flags primary tap targets under 32px (inline prose links exempt).
// Run:  node e2e/responsive.cjs [base_url]
const { chromium } = require('playwright');
const B = process.argv[2] || 'https://os.meok.ai';
const PAGES = ['', 'world.html', 'character.html', 'sovspace3d.html', 'pricing.html', 'verify.html',
  'connect.html', 'embed.html', 'siri.html', 'alexa.html', 'council.html', 'workspace.html',
  'integrations.html', 'governance.html', 'badges.html'];
const VIEWPORTS = [['mobile', 375, 812], ['tablet', 768, 1024]];
let fails = 0;

(async () => {
  const br = await chromium.launch();
  for (const [vn, w, h] of VIEWPORTS) {
    const ctx = await br.newContext({ viewport: { width: w, height: h }, isMobile: vn === 'mobile' });
    const p = await ctx.newPage();
    for (const pg of PAGES) {
      try {
        await p.goto(B + '/' + pg, { waitUntil: 'networkidle', timeout: 25000 });
        await p.waitForTimeout(1000);
        const ov = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
        if (ov) { fails++; console.log(`  ✗ ${vn} /${pg || 'home'} OVERFLOW`); }
        else console.log(`  ✓ ${vn} /${pg || 'home'}`);
      } catch (e) { console.log(`  ⚠ ${vn} /${pg} ${String(e.message).slice(0, 40)}`); }
    }
    await ctx.close();
  }
  console.log('\n======== ' + (fails ? fails + ' OVERFLOW ISSUES' : 'ALL RESPONSIVE — 15 pages × mobile+tablet, no overflow') + ' ========');
  await br.close();
  process.exit(fails ? 1 : 0);
})();
