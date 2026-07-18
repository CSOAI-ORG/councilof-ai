const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  // Git settings panel for fishkeeper
  await page.goto('https://lovable.dev/projects/a6fd6317-3b35-4d03-b9e1-02064eff7b6e',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(6000);
  for(const t of ['Accept all','Dismiss','Perfect']){ try{ await page.getByRole('button',{name:new RegExp('^'+t+'$','i')}).first().click({timeout:2000}); await page.waitForTimeout(500);}catch(e){} }
  await page.keyboard.press('Meta+Period'); await page.waitForTimeout(2000);
  try{ await page.getByText(/^Git$/).first().click({timeout:3000}); await page.waitForTimeout(1200);}catch(e){}
  try{ await page.getByText(/GitHub/).first().click({timeout:3000}); await page.waitForTimeout(1500);}catch(e){}
  await page.screenshot({path:'/tmp/hive_shots/lov_git_full.png'}).catch(()=>{});
  const all = await page.$$eval('button,a,[role=button],[role=menuitem]', els=>[...new Set(els.map(e=>(e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ')).filter(t=>t&&t.length<45))]);
  console.log('ALL controls on Git/GitHub panel:', JSON.stringify(all));
  // also check for a Download option anywhere (dev mode)
  console.log('download/disconnect/connect-ish:', JSON.stringify(all.filter(o=>/download|disconnect|connect|export|transfer|remove|create repo|new repo/i.test(o))));
  await b.close();
})();
