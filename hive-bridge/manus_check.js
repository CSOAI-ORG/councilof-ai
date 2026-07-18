const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.goto('https://manus.im/app',{waitUntil:'domcontentloaded',timeout:35000}).catch(()=>{});
  await page.waitForTimeout(4000);
  await page.screenshot({path:'/tmp/hive_shots/manus.png'}).catch(()=>{});
  console.log('url:', page.url());
  console.log('title:', await page.title());
  const txt = (await page.evaluate(()=>document.body.innerText).catch(()=>''))||'';
  const loggedOut = /sign in|log in|sign up|get started|continue with/i.test(txt.slice(0,500));
  console.log('logged out?', loggedOut);
  // look for csoai project mentions / project links
  const links = await page.$$eval('a', els=>[...new Set(els.map(e=>`${(e.innerText||'').trim().slice(0,30)}|${e.getAttribute('href')||''}`).filter(x=>x.length>1))].slice(0,40)).catch(()=>[]);
  console.log('csoai/project hints:', JSON.stringify(links.filter(l=>/csoai|project|app|share|task/i.test(l)).slice(0,15)));
  await page.close(); await b.close();
})();
