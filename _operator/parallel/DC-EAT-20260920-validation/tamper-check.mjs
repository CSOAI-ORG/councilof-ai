// Corrupt only a local copy, never publish it or submit a public tally.
import {chromium} from '/Users/nicholas/clawd/councilof-ai-work/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';import path from 'node:path';import{fileURLToPath}from'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const data=JSON.parse(await fs.readFile(path.join(dir,'public-preview.json'),'utf8'));
if(!/^[0-9a-f]{128}$/.test(data.signature))throw Error('Unexpected signature format');
data.signature=(data.signature[0]==='0'?'1':'0')+data.signature.slice(1);
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({serviceWorkers:'block'});
 await context.route('**/*',r=>['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
 const page=await context.newPage();
 const r=await page.goto('https://councilof.ai/gspc-verify/',{waitUntil:'domcontentloaded',timeout:15000});
 if(r.status()!==200)throw Error('Page unavailable');
 await page.getByLabel('Estate record JSON',{exact:true}).fill(JSON.stringify(data));
 await page.getByRole('button',{name:'Verify this record',exact:true}).click();
 await page.waitForTimeout(1000);
 const body=await page.locator('body').innerText();
 const excerpt=body.slice(body.indexOf('Estate record JSON'),body.indexOf('Chain replay is not claimed'));
 await fs.writeFile(path.join(dir,'tamper-check.txt'),excerpt);
 const result={at:new Date().toISOString(),scope:'one signature nibble changed locally',rejected:excerpt.includes('NOT VERIFIED')&&excerpt.includes('Signature'),excerpt,public_tally_submitted:false};
 await fs.writeFile(path.join(dir,'tamper-check.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
 if(!result.rejected)throw Error('Rejection not confirmed');
}finally{await browser.close();}
