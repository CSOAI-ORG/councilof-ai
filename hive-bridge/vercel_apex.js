const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  // project domains settings
  await page.goto('https://vercel.com/niks-projects-0a2ef942/csoai-v2-master/settings/domains',{waitUntil:'domcontentloaded',timeout:35000}).catch(()=>{});
  await page.waitForTimeout(4000);
  // find the add-domain input, type csoai.org, submit
  let added=false;
  for(const sel of ['input[placeholder*="domain" i]','input[name="domain"]','input[type="text"]']){
    try{ await page.locator(sel).first().fill('csoai.org',{timeout:4000}); await page.waitForTimeout(800);
      await page.getByRole('button',{name:/^Add$/i}).first().click({timeout:4000}); added=true; await page.waitForTimeout(3000); break;}catch(e){}
  }
  await page.screenshot({path:'/tmp/hive_shots/vercel_apex.png'}).catch(()=>{});
  console.log('add attempted:',added,'url:',page.url());
  const txt = (await page.evaluate(()=>document.body.innerText).catch(()=>''))||'';
  const sig = txt.match(/already (in use|assigned)[^.]*\.|different (team|account|scope)|don't have access|moved|added|verify|in use by/i);
  console.log('dashboard says:', sig?sig[0]:'(no clear signal — see screenshot)');
  await b.close();
})();
