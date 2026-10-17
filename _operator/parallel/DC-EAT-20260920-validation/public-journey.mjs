// Bounded public journey inspection. No credentials, forms, payments or writes.
import { chromium } from '/Users/nicholas/clawd/councilof-ai-work/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
const dir=path.dirname(fileURLToPath(import.meta.url));
const report={started_at:new Date().toISOString(),mode:'PUBLIC_GET_ONLY',routes:[],limitations:[
 'Fresh unauthenticated browser; no account or fulfillment test',
 'Only GET/HEAD requests allowed; this intentionally blocks writes and telemetry',
 'Existing cookies, browser sessions, wallet and user drafts untouched']};
let browser;
try {
 browser=await chromium.launch({headless:true,timeout:15000});
 const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
 const rejected=[];
 await context.route('**/*',route=>{
  if(!['GET','HEAD'].includes(route.request().method())){
   rejected.push({method:route.request().method(),url:route.request().url().split('?')[0]});
   return route.abort();
  }
  return route.continue();
 });
 for(const route of ['/','/quickstart/','/gspc-verify/','/services/','/assess/']) {
  const page=await context.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message).slice(0,500)));
  const result={route,started_at:new Date().toISOString()};
  try {
   const response=await page.goto('https://councilof.ai'+route,{waitUntil:'domcontentloaded',timeout:15000});
   result.http_status=response?.status()??null;
   if([401,403,429].includes(result.http_status)){
    result.status='ACCESS_BLOCKED_NOT_RETRIED';report.routes.push(result);await page.close();break;
   }
   await page.waitForTimeout(1800);
   result.final_url=page.url();result.title=await page.title();
   result.headings=await page.locator('h1,h2').allTextContents();
   result.buttons=await page.locator('button').allTextContents();
   result.links=await page.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>({text:n.textContent.trim(),href:n.href})).filter(x=>x.text&&/^https:\/\/councilof\.ai\//.test(x.href)).slice(0,100));
   result.main_count=await page.locator('main').count();
   const body=await page.locator('body').innerText({timeout:5000});
   const name=route==='/'?'home':route.replaceAll('/','');
   await fs.writeFile(path.join(dir,name+'.txt'),body);
   result.body_sha256=crypto.createHash('sha256').update(body).digest('hex');
   result.body_characters=body.length;
   await page.screenshot({path:path.join(dir,name+'.png'),fullPage:false});
   result.status=result.http_status===200&&body.length>400?'RENDERED':'REVIEW';
   result.page_errors=errors;
  }catch(e){result.status='UNCHECKABLE';result.error=String(e.message).slice(0,600);}
  report.routes.push(result);await page.close();
 }
 report.write_requests_blocked=rejected;
 await context.close();
}catch(e){report.error=String(e.message).slice(0,800);report.status='UNCHECKABLE';}
finally{if(browser)await browser.close();}
report.completed_at=new Date().toISOString();
await fs.writeFile(path.join(dir,'public-journey.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({routes:report.routes.map(({route,http_status,status,body_characters,page_errors})=>({route,http_status,status,body_characters,page_errors})),error:report.error},null,2));
