const { chromium } = require('playwright');
const fs = require('fs');
const OUT = '/Users/nicholas/clawd/_lovable_src';
const PID = process.argv[2], NAME = process.argv[3];
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.goto(`https://lovable.dev/projects/${PID}`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(6000);
  for(const t of ['Accept all','Dismiss','Perfect']){ try{ await page.getByRole('button',{name:new RegExp('^'+t+'$','i')}).first().click({timeout:1500}); await page.waitForTimeout(400);}catch(e){} }
  // open More (where Download codebase lives), set up download capture, click it
  let saved=false;
  const dlPromise = page.waitForEvent('download',{timeout:45000}).then(async d=>{
    const p = `${OUT}/${NAME}.zip`; await d.saveAs(p); saved=true; console.log('SAVED →',p, fs.statSync(p).size,'bytes');
  }).catch(e=>console.log('download event timeout:',e.message.split('\n')[0]));
  try{ await page.getByRole('button',{name:/^More$/}).first().click({timeout:4000}); await page.waitForTimeout(1000);}catch(e){}
  try{ await page.getByText(/Download codebase/i).first().click({timeout:5000}); }
  catch(e){ console.log('click Download codebase failed:',e.message.split('\n')[0]); }
  await dlPromise;
  await page.waitForTimeout(2000);
  await b.close();
})();
