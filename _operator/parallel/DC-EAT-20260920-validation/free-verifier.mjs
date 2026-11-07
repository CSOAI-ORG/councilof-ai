// Test the public free verifier in an isolated browser; no account or purchases.
import { chromium } from '/Users/nicholas/clawd/councilof-ai-work/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
const dir=path.dirname(fileURLToPath(import.meta.url));
const result={started_at:new Date().toISOString(),scope:'free published-card browser verification',steps:[]};
let browser;
try{
 browser=await chromium.launch({headless:true,timeout:15000});
 const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
 await context.route('**/*',r=>['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
 const page=await context.newPage();
 const response=await page.goto('https://councilof.ai/gspc-verify/',{waitUntil:'domcontentloaded',timeout:15000});
 if(response.status()!==200)throw new Error('Public verifier not accessible: '+response.status());
 await page.getByRole('button',{name:'Free preview · governance measurement',exact:true}).click({timeout:8000});
 const box=page.getByLabel('Estate record JSON',{exact:true});
 await page.waitForFunction(()=>[...document.querySelectorAll('textarea')].some(x=>x.value.trim().startsWith('{')),{timeout:8000});
 const raw=await box.inputValue();const data=JSON.parse(raw);
 result.input_sha256=crypto.createHash('sha256').update(raw).digest('hex');
 result.input_keys=Object.keys(data);result.preview_bytes=Buffer.byteLength(raw);
 await fs.writeFile(path.join(dir,'public-preview.json'),raw+'\n');
 const verify=page.getByRole('button',{name:'Verify this record',exact:true});
 await verify.click();await page.waitForTimeout(1500);
 const text=await page.locator('body').innerText();
 await fs.writeFile(path.join(dir,'free-verifier-positive.txt'),text);
 result.positive_excerpt=text.slice(text.indexOf('Estate record JSON'),text.indexOf('Chain replay is not claimed'));
 await page.screenshot({path:path.join(dir,'free-verifier-positive.png'),fullPage:true});
 result.steps.push('Published preview fetched; verify button exercised; inspect retained output for verdict');
 await box.fill('{');await verify.click();await page.waitForTimeout(500);
 const bad=await page.locator('body').innerText();
 await fs.writeFile(path.join(dir,'free-verifier-malformed.txt'),bad);
 result.malformed_excerpt=bad.slice(bad.indexOf('Estate record JSON'),bad.indexOf('Chain replay is not claimed'));
 result.steps.push('Malformed JSON supplied only to browser-local verifier');
 await context.close();
}catch(e){result.status='UNCHECKABLE';result.error=String(e.message).slice(0,900);}
finally{if(browser)await browser.close();}
result.completed_at=new Date().toISOString();
result.financial_actions=0;result.publication_actions=0;
await fs.writeFile(path.join(dir,'free-verifier.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
