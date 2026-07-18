const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.goto('https://lovable.dev/projects/a6fd6317-3b35-4d03-b9e1-02064eff7b6e',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(6000);
  for(const t of ['Accept all','Dismiss','Perfect']){ try{ await page.getByRole('button',{name:new RegExp('^'+t+'$','i')}).first().click({timeout:1800}); await page.waitForTimeout(400);}catch(e){} }
  // click "Code" top toggle, then look for a dropdown / download
  for(const sel of ['button[aria-label="Code"]','button:has-text("Code")']){ try{ await page.locator(sel).first().click({timeout:3000}); await page.waitForTimeout(2000); break;}catch(e){} }
  await page.screenshot({path:'/tmp/hive_shots/lov_code_view.png'}).catch(()=>{});
  let all = await page.$$eval('button,a,[role=button],[role=menuitem]', els=>[...new Set(els.map(e=>(e.innerText||e.getAttribute('aria-label')||e.getAttribute('title')||'').trim().replace(/\s+/g,' ')).filter(t=>t&&t.length<45))]);
  console.log('after Code:', JSON.stringify(all.filter(o=>/download|export|zip|dev mode|github|copy|edit code/i.test(o))));
  // try "More" menu
  try{ await page.getByRole('button',{name:/^More$/}).first().click({timeout:3000}); await page.waitForTimeout(1500);}catch(e){}
  await page.screenshot({path:'/tmp/hive_shots/lov_more.png'}).catch(()=>{});
  all = await page.$$eval('button,a,[role=button],[role=menuitem]', els=>[...new Set(els.map(e=>(e.innerText||'').trim().replace(/\s+/g,' ')).filter(t=>t&&t.length<45))]);
  console.log('More menu:', JSON.stringify(all.filter(o=>/download|export|zip|github|code|copy|dev/i.test(o))));
  await b.close();
})();
