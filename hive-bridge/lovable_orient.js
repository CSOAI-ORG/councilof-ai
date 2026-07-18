const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.goto('https://lovable.dev/projects',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(4000);
  await page.screenshot({path:'/tmp/hive_shots/lovable_projects.png'}).catch(()=>{});
  // collect project links + names
  const projects = await page.$$eval('a[href*="/projects/"]', els =>
    [...new Set(els.map(e => `${(e.innerText||'').trim().replace(/\s+/g,' ').slice(0,40)} :: ${e.getAttribute('href')}`))].slice(0,40));
  console.log('=== Lovable projects visible ===');
  projects.forEach(p=>console.log('  '+p));
  // fish/koi specifically
  const fishkoi = projects.filter(p=>/fish|koi|aqua|pond/i.test(p));
  console.log('\n=== fish/koi matches ===');
  fishkoi.forEach(p=>console.log('  '+p));
  await page.close(); await b.close();
})();
