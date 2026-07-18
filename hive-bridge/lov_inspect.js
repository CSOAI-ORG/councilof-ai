const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p=>p.url().includes('a6fd6317')) || await ctx.newPage();
  if(!page.url().includes('a6fd6317')){ await page.goto('https://lovable.dev/projects/a6fd6317-3b35-4d03-b9e1-02064eff7b6e',{timeout:45000}); await page.waitForTimeout(7000);}
  // clear overlays
  for(const t of ['Accept all','Dismiss']){ try{ await page.getByRole('button',{name:new RegExp('^'+t+'$','i')}).first().click({timeout:4000}); await page.waitForTimeout(1200);}catch(e){} }
  await page.waitForTimeout(1500);
  await page.screenshot({path:'/tmp/hive_shots/lov_cleared.png'}).catch(()=>{});
  // enumerate ALL buttons incl icon-only (aria-label/title)
  const all = await page.$$eval('button,a,[role=button],[role=menuitem]', els=>els.map(e=>({t:(e.innerText||'').trim().replace(/\s+/g,' ').slice(0,30), a:(e.getAttribute('aria-label')||e.getAttribute('title')||'').slice(0,30)})).filter(x=>x.t||x.a));
  const git = all.filter(x=>/git|repo/i.test(x.t+x.a));
  console.log('github controls:', JSON.stringify(git));
  console.log('all labels sample:', JSON.stringify([...new Set(all.map(x=>x.a||x.t).filter(Boolean))].slice(0,55)));
  await b.close();
})();
