const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p=>p.url().includes('a6fd6317')) || await ctx.newPage();
  if(!page.url().includes('a6fd6317')){ await page.goto('https://lovable.dev/projects/a6fd6317-3b35-4d03-b9e1-02064eff7b6e',{timeout:45000}); await page.waitForTimeout(6000);}
  for(const t of ['Accept all','Dismiss','Perfect']){ try{ await page.getByRole('button',{name:new RegExp('^'+t+'$','i')}).first().click({timeout:2000}); await page.waitForTimeout(600);}catch(e){} }
  // reopen project menu, click Settings
  try{ await page.locator('button:has-text("fishkeeperai")').first().click({timeout:4000}); await page.waitForTimeout(1200);}catch(e){}
  try{ await page.getByRole('menuitem',{name:/^Settings$/i}).first().click({timeout:4000}); }catch(e){ try{await page.getByText(/^Settings$/).first().click({timeout:3000});}catch(e2){console.log('settings click fail');} }
  await page.waitForTimeout(2500);
  await page.screenshot({path:'/tmp/hive_shots/lov_settings.png'}).catch(()=>{});
  const opts = await page.$$eval('[role=tab],[role=menuitem],button,a,h2,h3,label', els=>[...new Set(els.map(e=>(e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ')).filter(t=>t&&t.length<45))].slice(0,80));
  console.log('settings — git/repo items:', JSON.stringify(opts.filter(o=>/git|repo|export|connect|sync|branch|download/i.test(o))));
  console.log('settings sections:', JSON.stringify(opts.slice(0,45)));
  await b.close();
})();
