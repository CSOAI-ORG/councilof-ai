// MEOK OS — cross-browser regression (Playwright). Renders the key pages in WebKit (Safari engine) and
// Firefox, asserting: no console/page errors, no horizontal overflow, non-empty render. Catches
// Safari-specific bugs (backdrop-filter, flexbox, inputs) that Chromium-only testing misses.
// Setup:  npx playwright install webkit firefox    Run:  node e2e/xbrowser.cjs [base_url]
const pw = require('playwright');
const B = process.argv[2] || 'https://os.meok.ai';
const PAGES = ['', 'pricing.html', 'connect.html', 'council.html', 'workspace.html', 'integrations.html', 'governance.html', 'character.html'];
let fails = 0;

(async () => {
  for (const engine of ['webkit', 'firefox']) {
    console.log('\n== ' + engine.toUpperCase() + ' ==');
    const br = await pw[engine].launch();
    const p = await (await br.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
    for (const pg of PAGES) {
      const errs = [];
      const onc = m => { if (m.type && m.type() === 'error') errs.push(m.text().slice(0, 80)); };
      p.on('console', onc); p.on('pageerror', e => errs.push('PE:' + String(e).slice(0, 80)));
      try {
        await p.goto(B + '/' + pg, { waitUntil: 'networkidle', timeout: 30000 });
        await p.waitForTimeout(1500);
        const ov = await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
        const rendered = await p.evaluate(() => document.body.innerText.trim().length > 50);
        const bad = errs.length || ov || !rendered;
        if (bad) { fails++; console.log(`  ✗ /${pg || 'home'} ${errs.length ? errs.length + ' err' : ''}${ov ? ' OVERFLOW' : ''}${rendered ? '' : ' EMPTY'}`); }
        else console.log(`  ✓ /${pg || 'home'}`);
      } catch (e) { fails++; console.log(`  ⚠ /${pg} ${String(e.message).slice(0, 40)}`); }
      p.removeAllListeners('console'); p.removeAllListeners('pageerror');
    }
    await br.close();
  }
  console.log('\n======== ' + (fails ? fails + ' cross-browser issues' : 'CLEAN in WebKit + Firefox') + ' ========');
  process.exit(fails ? 1 : 0);
})();
