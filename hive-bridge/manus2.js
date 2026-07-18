const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.goto('https://manus.im/app',{waitUntil:'networkidle',timeout:45000}).catch(()=>{});
  await page.waitForTimeout(9000);
  await page.screenshot({path:'/tmp/hive_shots/manus2.png'}).catch(()=>{});
  console.log('url:', page.url());
  // dump anything csoai-related in the DOM
  const hits = await page.evaluate(()=>{
    const out=[];
    document.querySelectorAll('a,[role=button],button,div,span,li').forEach(e=>{
      const t=(e.innerText||'').trim();
      if(t && t.length<60 && /csoai|council|safety|v2|site|website/i.test(t)) out.push(t.replace(/\s+/g,' '));
    });
    return [...new Set(out)].slice(0,25);
  }).catch(()=>[]);
  console.log('csoai-ish text:', JSON.stringify(hits));
  // recent task links
  const links = await page.$$eval('a[href*="/app/"],a[href*="/share/"]', els=>[...new Set(els.map(e=>`${(e.innerText||'').trim().slice(0,40).replace(/\s+/g,' ')}|${e.getAttribute('href')}`))].slice(0,25)).catch(()=>[]);
  console.log('task links:', JSON.stringify(links));
  await page.close(); await b.close();
})();
