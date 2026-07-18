const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p=>p.url().includes('a6fd6317')) || await ctx.newPage();
  if(!page.url().includes('a6fd6317')){ await page.goto('https://lovable.dev/projects/a6fd6317-3b35-4d03-b9e1-02064eff7b6e',{timeout:45000}); await page.waitForTimeout(7000);}
  for(const t of ['Accept all','Reject all','Dismiss','Perfect']){ try{ await page.getByRole('button',{name:new RegExp('^'+t+'$','i')}).first().click({timeout:2500}); await page.waitForTimeout(800);}catch(e){} }
  // open project-name dropdown (top-left, the project title button)
  let opened=false;
  for(const sel of ['button:has-text("fishkeeperai")','[aria-label="Switch project"]','header button:has(svg)']){
    try{ await page.locator(sel).first().click({timeout:4000}); opened=true; await page.waitForTimeout(1800); break;}catch(e){}
  }
  await page.screenshot({path:'/tmp/hive_shots/lov_projmenu.png'}).catch(()=>{});
  const opts = await page.$$eval('[role=menuitem],[role=menu] *,button,a', els=>[...new Set(els.map(e=>(e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ')).filter(t=>t&&t.length<40))].slice(0,70));
  console.log('opened dropdown:',opened);
  console.log('menu items:', JSON.stringify(opts.filter(o=>/git|repo|export|connect|setting|integration|download|sync/i.test(o))));
  console.log('all:', JSON.stringify(opts.slice(0,40)));
  await b.close();
})();
