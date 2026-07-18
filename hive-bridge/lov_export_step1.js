const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.goto('https://lovable.dev/projects/a6fd6317-3b35-4d03-b9e1-02064eff7b6e',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(7000);
  // Click the "Code" control (GitHub export entry)
  try { await page.getByRole('button',{name:/^Code$/i}).first().click({timeout:8000}); }
  catch(e){ try{ await page.locator('button:has-text("Code")').first().click({timeout:6000}); }catch(e2){ console.log('Code click failed:',e2.message.split('\n')[0]); } }
  await page.waitForTimeout(3000);
  await page.screenshot({path:'/tmp/hive_shots/lov_code_menu.png'}).catch(()=>{});
  const opts = await page.$$eval('button,a,[role=menuitem],[role=button]', els=>[...new Set(els.map(e=>(e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ')).filter(t=>t&&t.length<50))].slice(0,70));
  console.log('after Code click — options:', JSON.stringify(opts));
  console.log('github-ish:', JSON.stringify(opts.filter(o=>/git|repo|export|connect|sync|download/i.test(o))));
  await page.close(); await b.close();
})();
