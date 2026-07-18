const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.goto('https://manus.im/app',{waitUntil:'networkidle',timeout:45000}).catch(()=>{});
  await page.waitForTimeout(8000);
  // find the CSOAI/RLMAI build task and click it
  let opened=false;
  for(const re of [/RLMAI Backend/i,/DEV - CSOAI LIMITED/i,/Building RLMAI/i,/Preparing AI Projects/i]){
    try{ await page.getByText(re).first().click({timeout:4000}); opened=true; console.log('opened task matching',re); break;}catch(e){}
  }
  await page.waitForTimeout(6000);
  await page.screenshot({path:'/tmp/hive_shots/manus_task.png'}).catch(()=>{});
  console.log('url:', page.url());
  // dump action buttons (github/deploy/export/download/code)
  const acts = await page.evaluate(()=>{
    const out=[]; document.querySelectorAll('button,a,[role=button]').forEach(e=>{const t=((e.innerText||e.getAttribute('aria-label')||e.title||'').trim()).replace(/\s+/g,' '); if(t&&t.length<40) out.push(t);}); return [...new Set(out)];
  }).catch(()=>[]);
  console.log('actions:', JSON.stringify(acts.filter(a=>/github|deploy|export|download|code|repo|share|connect|publish/i.test(a))));
  console.log('all actions sample:', JSON.stringify(acts.slice(0,30)));
  await b.close();
})();
