const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p=>p.url().includes('URIK4mMH')) || (await ctx.newPage());
  if(!page.url().includes('URIK4mMH')){ await page.goto('https://manus.im/app/URIK4mMH6dzi4viS56MYOa',{timeout:40000}); await page.waitForTimeout(7000);}
  for(const t of ['Accept all','Reject all','Not now']){ try{ await page.getByRole('button',{name:new RegExp('^'+t+'$','i')}).first().click({timeout:1800}); await page.waitForTimeout(500);}catch(e){} }
  // click each header icon-button (top bar) and any "more"/ellipsis to reveal export/github
  const hdrBtns = await page.locator('header button, [class*="header"] button, button[aria-haspopup]').all().catch(()=>[]);
  console.log('header buttons:', hdrBtns.length);
  for(let i=0;i<Math.min(hdrBtns.length,8);i++){ try{ await hdrBtns[i].click({timeout:1500}); await page.waitForTimeout(900);}catch(e){} }
  await page.screenshot({path:'/tmp/hive_shots/manus_menu.png'}).catch(()=>{});
  const opts = await page.evaluate(()=>{const o=[];document.querySelectorAll('[role=menuitem],[role=menu] *,button,a,[role=option]').forEach(e=>{const t=(e.innerText||'').trim().replace(/\s+/g,' ');if(t&&t.length<40)o.push(t);});return [...new Set(o)];}).catch(()=>[]);
  console.log('export/github/deploy opts:', JSON.stringify(opts.filter(o=>/github|deploy|export|download|repo|\.zip|connect|code|publish|vercel/i.test(o))));
  await b.close();
})();
