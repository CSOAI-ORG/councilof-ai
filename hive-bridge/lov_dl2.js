const { chromium } = require('playwright');
const PID=process.argv[2];
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.goto(`https://lovable.dev/projects/${PID}`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(6000);
  for(const t of ['Accept all','Dismiss','Perfect']){ try{ await page.getByRole('button',{name:new RegExp('^'+t+'$','i')}).first().click({timeout:1500}); await page.waitForTimeout(400);}catch(e){} }
  // Click "Code" top toggle to reveal the Download codebase control
  for(const sel of ['button[aria-label="Code"]','button:has-text("Code")']){ try{ await page.locator(sel).first().click({timeout:3000,force:true}); await page.waitForTimeout(1800); break;}catch(e){} }
  // Now click Download codebase, several strategies
  let clicked=false;
  for(const loc of [page.getByText('Download codebase',{exact:true}), page.getByRole('menuitem',{name:/Download codebase/i}), page.getByRole('button',{name:/Download codebase/i}), page.locator('text=Download codebase')]){
    try{ await loc.first().scrollIntoViewIfNeeded({timeout:2000}); await loc.first().click({timeout:4000,force:true}); clicked=true; console.log('clicked Download codebase'); break;}catch(e){}
  }
  if(!clicked) console.log('could not click Download codebase');
  await page.waitForTimeout(9000); // let download start
  await b.close();
})();
