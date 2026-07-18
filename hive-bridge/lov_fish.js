const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.goto('https://lovable.dev/projects/a6fd6317-3b35-4d03-b9e1-02064eff7b6e',{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForTimeout(6000);
  await page.screenshot({path:'/tmp/hive_shots/lov_fishkeeper.png'}).catch(()=>{});
  const btns = await page.$$eval('button,a,[role=button]', els=>[...new Set(els.map(e=>(e.innerText||e.getAttribute('aria-label')||e.getAttribute('title')||'').trim().replace(/\s+/g,' ')).filter(t=>t&&t.length<40))].slice(0,60));
  console.log('url:', page.url());
  console.log('title:', await page.title());
  console.log('controls:', JSON.stringify(btns));
  console.log('github-ish:', JSON.stringify(btns.filter(b=>/git|export|publish|dev mode|code|connect|settings|share/i.test(b))));
  await page.close(); await b.close();
})();
