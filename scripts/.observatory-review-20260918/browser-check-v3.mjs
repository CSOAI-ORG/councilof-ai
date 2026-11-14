import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {chromium} from '@playwright/test';
const repo=process.cwd(),ops='/Users/nicholas/clawd/csoai-reach-pack-01Sep2026/tools/entrypoint/living-observatory',out=path.join(ops,'v3'),dist=path.join(out,'browser-dist');
const pointer=JSON.parse(await fs.readFile(path.join(ops,'state/latest.json'),'utf8'));
const retained=JSON.parse(await fs.readFile(path.join(ops,'state/receipts',pointer.receipt),'utf8'));
const sources=new Map();
for(const row of retained.sources){if(row.body_sha256&&new URL(row.url).host==='councilof.ai')sources.set(new URL(row.url).pathname,await fs.readFile(path.join(ops,'state/blobs',row.body_sha256+'.body')));}
// This source exists locally but was HTTP 404 in the live observation. The positive
// UI test emulates its release; the negative test below restores the actual 404.
const labPath='/interop/lab-card-census-2026-09-17.json';sources.set(labPath,await fs.readFile(path.join(repo,'public',labPath.slice(1))));
const supplyPath='/interop/stablecoin-universe-supply-2026-09-16.json';let failures=false;const requested=[];
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');requested.push(url.pathname);
 if(failures&&(url.pathname===labPath||url.pathname===supplyPath)){res.writeHead(url.pathname===labPath?404:200,{'Content-Type':'text/html'});res.end('<html>Unavailable test control</html>');return;}
 if(sources.has(url.pathname)){res.setHeader('Content-Type','application/json');res.end(sources.get(url.pathname));return;}
 const rel=url.pathname==='/gspc-scoreboard'?'scripts/.observatory-review-20260918/index.html':url.pathname.slice(1);const file=path.resolve(dist,rel);
 if(!file.startsWith(dist+path.sep))throw new Error('Out of scope');
 const raw=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(raw);
 }catch{res.writeHead(404,{'Content-Type':'application/json'});res.end('{"error":"outside review scope"}');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;const checks=[];
try{
 browser=await chromium.launch({headless:true});const origin=`http://127.0.0.1:${server.address().port}`;
 const context=await browser.newContext({viewport:{width:1280,height:960},reducedMotion:'reduce'});
 await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=origin+'/gspc-scoreboard?keep=1&gspcLens=nist-ai-rmf&gspcQuery=care';await page.goto(url);
 const workspace=page.getByTestId('living-observatory');await workspace.waitFor();
 const table=page.locator('table').filter({has:page.getByRole('columnheader',{name:'Leader accuracy',exact:true})});
 await page.waitForFunction(()=>document.querySelector('[data-testid="living-observatory"]')?.textContent.includes('1 matching instruments'));
 assert.equal(await table.locator('tbody tr').count(),1);checks.push('shared NIST + care link restores one source instrument');
 await page.getByTestId('control-evidence-map').locator('summary').first().click();assert.equal(await page.getByTestId('control-evidence-map').locator('article').count(),12);assert.match(await page.getByTestId('control-evidence-map').innerText(),/NOT ASSESSED/);checks.push('NIST lens exposes twelve scoped evidence requirements, not compliance passes');
 await page.reload();await page.waitForFunction(()=>document.querySelector('[data-testid="living-observatory"]')?.textContent.includes('1 matching instruments'));assert.equal(await page.getByLabel('Framework or topic lens').inputValue(),'nist-ai-rmf');checks.push('reload retains view');
 await page.getByLabel('Search instruments and organisations').fill('');await page.getByLabel('Framework or topic lens').selectOption('eu-ai-act');await page.waitForTimeout(80);assert.equal(await table.locator('tbody tr').count(),6);checks.push('EU topic lens filters real board rows');
 assert.equal(await page.getByTestId('control-evidence-map').locator('article').count(),10);checks.push('EU lens exposes ten independently scoped article evidence plans');
 await page.getByLabel('Search instruments and organisations').fill('unfindable-review-only');await page.waitForTimeout(80);assert.equal(await table.locator('tbody tr').count(),0);checks.push('empty search has no manufactured fallback');
 await page.getByLabel('Search instruments and organisations').press('Escape');assert.equal(await page.getByLabel('Search instruments and organisations').inputValue(),'');checks.push('Escape clears query');
 await page.getByRole('button',{name:'Reset filters',exact:true}).click();await page.waitForTimeout(80);assert.equal(await table.locator('tbody tr').count(),23);assert.equal(new URL(page.url()).search,'?keep=1');checks.push('reset restores 23 axes and preserves unrelated URL state');
 assert.ok(!requested.includes(supplyPath));checks.push('coverage sources are lazy loaded, not fetched at initial render');
 await page.getByText('Organisational evidence · labs and humanoid deployments',{exact:true}).click();await page.getByLabel('Evidence collection').selectOption('lab-artifact');
 await page.waitForFunction(()=>document.querySelectorAll('[data-testid="living-observatory"] article').length===10);
 const first=workspace.locator('article').first();await first.getByText('Inspect five evidence checks',{exact:true}).click();assert.equal(await first.locator('dt').count(),5);assert.match(await first.innerText(),/dated census|DATED CENSUS/);checks.push('ten existing lab records expose five qualified evidence checks; local-source positive replay, not live publication');
 await first.getByText('Census evidence narrative',{exact:true}).first().click();assert.ok((await first.innerText()).length>300);checks.push('evidence narrative and qualifications available without a company score');
 await page.getByTestId('observatory-coverage').locator('summary').first().click();await page.waitForFunction(()=>document.querySelector('[data-testid="observatory-coverage"]')?.textContent.includes('Fetched 6 of 6'));
 const coverage=page.getByTestId('observatory-coverage');assert.match(await coverage.innerText(),/425 · registry asset identities/);assert.match(await coverage.innerText(),/425 · asset identities in this supply snapshot/);checks.push('both 425-asset source datasets render with separate methods');
 assert.match(await coverage.innerText(),/2026-09-16T12:03:00Z/);checks.push('source measurement date remains unchanged after fresh UI fetch');
 await page.getByText('CARE, the Charter and human evidence cups',{exact:true}).click();assert.match(await workspace.innerText(),/Human participation evidence/);assert.match(await workspace.innerText(),/Independent evaluator evidence/);assert.match(await workspace.innerText(),/No admitted human-study receipt feed/);checks.push('participant and evaluator cups remain unfilled without admitted study receipts');
 await page.getByLabel('Framework or topic lens').focus();const focus=await page.getByLabel('Framework or topic lens').evaluate(el=>({height:el.getBoundingClientRect().height,shadow:getComputedStyle(el).boxShadow}));assert.ok(focus.height>=44);assert.notEqual(focus.shadow,'none');checks.push('real app CSS gives the primary selector a 44px target and visible keyboard focus');
 await page.screenshot({path:path.join(out,'desktop-review.png'),fullPage:false});
 await page.setViewportSize({width:375,height:812});await workspace.scrollIntoViewIfNeeded();await page.waitForTimeout(100);
 const sizes=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth,scrollX:scrollX,htmlOverflow:getComputedStyle(document.documentElement).overflowX,bodyOverflow:getComputedStyle(document.body).overflowX}));
 if(sizes.document>sizes.width+1){const offenders=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{return e.getBoundingClientRect().right>innerWidth+1;}).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,160),text:e.textContent?.slice(0,80),width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right,overflow:getComputedStyle(e).overflowX,whiteSpace:getComputedStyle(e).whiteSpace})).slice(0,18));console.log('DOCUMENT_PSEUDO',await page.evaluate(()=>({html:{width:getComputedStyle(document.documentElement).width,position:getComputedStyle(document.documentElement).position,before:getComputedStyle(document.documentElement,'::before').cssText},bodyRect:document.body.getBoundingClientRect().toJSON(),scrollContainers:[...document.querySelectorAll('div')].filter(e=>['auto','scroll'].includes(getComputedStyle(e).overflowX)).map(e=>({cls:e.className,width:e.getBoundingClientRect().width,scroll:e.scrollWidth,contain:getComputedStyle(e).contain}))})));await fs.writeFile(path.join(out,'mobile-overflow.json'),JSON.stringify({sizes,offenders},null,2));await page.screenshot({path:path.join(out,'mobile-overflow.png'),fullPage:false});console.log(JSON.stringify({sizes,offenders},null,2));}
 assert.ok(sizes.document<=sizes.width+1,JSON.stringify(sizes));checks.push('375px layout has no document-level horizontal overflow');
 const inputSize=await page.getByLabel('Search instruments and organisations').boundingBox();assert.ok(inputSize&&inputSize.height>=44);checks.push('mobile search target is at least 44px');
 await page.screenshot({path:path.join(out,'mobile-review.png'),fullPage:false});
 failures=true;await page.goto(origin+'/gspc-scoreboard');await page.getByText('Organisational evidence · labs and humanoid deployments',{exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-testid="living-observatory"]')?.textContent.includes('Some sources could not be read'));
 await page.getByLabel('Evidence collection').selectOption('lab-artifact');assert.equal(await workspace.locator('article').count(),0);checks.push('real-world lab 404 is exposed, not replaced by fabricated lab findings');
 await page.getByTestId('observatory-coverage').locator('summary').first().click();await page.waitForFunction(()=>document.querySelector('[data-testid="observatory-coverage"]')?.textContent.includes('Fetched 5 of 6'));assert.match(await coverage.innerText(),/UNAVAILABLE/);checks.push('HTML returned by a JSON source fails visibly without zero substitution');
 failures=false;await page.getByRole('button',{name:'Retry coverage reads'}).click();await page.waitForFunction(()=>document.querySelector('[data-testid="observatory-coverage"]')?.textContent.includes('Fetched 6 of 6'));checks.push('partial-source retry recovers');
 assert.deepEqual(errors,[]);checks.push('no uncaught browser runtime errors');
 const result={state:'PASS',checks,real_styles:true,live_deployment:false,scope:'Existing board component and real app stylesheet in an isolated build. Data are retained public-source bytes, except lab positive replay uses the local tracked census. Auxiliary routes not supplied remain 404. Not a full-site WCAG audit.',screenshots:['desktop-review.png','mobile-review.png']};await fs.writeFile(path.join(out,'browser-acceptance.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}catch(e){await fs.writeFile(path.join(out,'browser-failure.txt'),e.stack??String(e));console.error(e);process.exitCode=1;}
finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
