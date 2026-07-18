const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p=>p.url().includes('a6fd6317')) || await ctx.newPage();
  if(!page.url().includes('a6fd6317')){ await page.goto('https://lovable.dev/projects/a6fd6317-3b35-4d03-b9e1-02064eff7b6e',{timeout:45000}); await page.waitForTimeout(6000);}
  await page.bringToFront();
  await page.keyboard.press('Meta+Period'); await page.waitForTimeout(2500);
  await page.screenshot({path:'/tmp/hive_shots/lov_kbd_settings.png'}).catch(()=>{});
  let opts = await page.$$eval('[role=tab],[role=menuitem],button,a,h2,h3', els=>[...new Set(els.map(e=>(e.innerText||'').trim().replace(/\s+/g,' ')).filter(t=>t&&t.length<40))]);
  console.log('git/connect:', JSON.stringify(opts.filter(o=>/git|repo|connect|connector|integration|supabase|export/i.test(o))));
  // try clicking GitHub or Connectors if present
  for(const name of ['GitHub','Connectors','Git']){
    try{ await page.getByText(new RegExp('^'+name+'$','i')).first().click({timeout:3000}); await page.waitForTimeout(2000); console.log('clicked',name); break;}catch(e){}
  }
  await page.screenshot({path:'/tmp/hive_shots/lov_github_panel.png'}).catch(()=>{});
  opts = await page.$$eval('button,a,h2,h3,[role=button]', els=>[...new Set(els.map(e=>(e.innerText||'').trim().replace(/\s+/g,' ')).filter(t=>t&&t.length<50))]);
  console.log('github panel:', JSON.stringify(opts.filter(o=>/git|repo|connect|create|authorize|install|export|sync|branch|csoai|nick/i.test(o))));
  await b.close();
})();
