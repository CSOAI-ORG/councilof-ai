const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  for (const url of ['https://lovable.dev/','https://lovable.dev/dashboard']) {
    try {
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForTimeout(4000);
      const tag = url.replace(/[^a-z]/gi,'_').slice(0,24);
      await page.screenshot({path:`/tmp/hive_shots/${tag}.png`}).catch(()=>{});
      const links = await page.$$eval('a', els=>[...new Set(els.map(e=>`${(e.innerText||'').trim().replace(/\s+/g,' ').slice(0,32)}|${e.getAttribute('href')}`).filter(x=>x.length>1))].slice(0,50));
      console.log(`\n### ${url} → ${page.url()}`);
      console.log('title:', await page.title());
      console.log('links:', JSON.stringify(links.filter(l=>/project|fish|koi|dashboard|workspace|edit/i.test(l)).slice(0,25)));
    } catch(e){ console.log(url,'ERR',e.message.split('\n')[0]); }
  }
  await page.close(); await b.close();
})();
