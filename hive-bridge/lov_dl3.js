const { chromium } = require('playwright');
const fs=require('fs');
const PID=process.argv[2], NAME=process.argv[3], OUT='/Users/nicholas/clawd/_lovable_src';
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.goto(`https://lovable.dev/projects/${PID}`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(6000);
  for(const t of ['Accept all','Dismiss','Perfect']){ try{ await page.getByRole('button',{name:new RegExp('^'+t+'$','i')}).first().click({timeout:1500}); await page.waitForTimeout(400);}catch(e){} }
  for(const sel of ['button[aria-label="Code"]','button:has-text("Code")']){ try{ await page.locator(sel).first().click({timeout:3000,force:true}); await page.waitForTimeout(1800); break;}catch(e){} }
  const dl = page.waitForEvent('download',{timeout:75000});
  let clicked=false;
  for(const loc of [page.getByText('Download codebase',{exact:true}), page.getByRole('menuitem',{name:/Download codebase/i}), page.locator('text=Download codebase')]){
    try{ await loc.first().click({timeout:4000,force:true}); clicked=true; break;}catch(e){}
  }
  console.log('clicked:',clicked);
  try{ const d=await dl; const p=`${OUT}/${NAME}.zip`; await d.saveAs(p); console.log('SAVED',p,fs.statSync(p).size,'bytes'); }
  catch(e){ console.log('no download captured:',e.message.split('\n')[0]); 
    // maybe a confirm modal appeared — dump buttons
    const bs=await page.$$eval('button',els=>els.map(e=>(e.innerText||'').trim()).filter(t=>t&&t.length<30).slice(0,30)); console.log('buttons now:',JSON.stringify([...new Set(bs)])); }
  await b.close();
})();
