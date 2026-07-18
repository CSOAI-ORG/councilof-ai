const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.goto('https://github.com/settings/profile',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(2500);
  let who='';
  try{ who = await page.locator('meta[name="octolytics-actor-login"]').getAttribute('content',{timeout:4000}); }catch(e){}
  if(!who){ try{ who = await page.evaluate(()=>document.querySelector('[name="octolytics-actor-login"]')?.content || (document.body.innerText.match(/@([a-z0-9-]+)/i)||[])[1] || ''); }catch(e){} }
  console.log('bridge GitHub account:', who || '(unknown)');
  console.log('url:', page.url());
  // can THIS session see the optimobile repos?
  await page.goto('https://github.com/optimobile/fishkeeperai',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(2000);
  console.log('optimobile/fishkeeperai →', (await page.title()).slice(0,50), '|', page.url());
  await page.close(); await b.close();
})();
