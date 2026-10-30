const {chromium}=require('/Users/nicholas/src/councilof-ai/node_modules/playwright-core');
const {spawn,execFileSync}=require('child_process'),assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=__dirname,output=path.join(root,'.checks');fs.mkdirSync(output,{recursive:true});
const base='http://127.0.0.1:8796',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{const initial=fs.readFileSync(path.join(root,'register.json'));
 const server=spawn('/opt/homebrew/bin/python3',['-B','-m','http.server','8796','--bind','127.0.0.1','--directory',root],{stdio:'ignore'});
 let browser,ownedChrome=[];
 try{
  for(let i=0;i<50;i++){try{execFileSync('/usr/bin/curl',['--noproxy','*','--fail','--silent','--max-time','2',base+'/tracker.html'],{stdio:'ignore'});break;}catch{}await new Promise(r=>setTimeout(r,100));if(i===49)throw Error('preview unavailable');}
  browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  ownedChrome=execFileSync('/bin/ps',['-axo','pid=,ppid=,command='],{encoding:'utf8'}).split('\n').map(x=>x.trim().split(/\s+/)).filter(x=>Number(x[1])===process.pid&&x.slice(2).join(' ').includes('/Google Chrome.app/')&&x.slice(2).join(' ').includes('playwright')).map(x=>({pid:Number(x[0]),command:x.slice(2).join(' ')}));assert.equal(ownedChrome.length,1,'owned test browser identified');const scenarios=[],errors=[],requests=[];
  for(const view of ['tracker','discussion']){
   const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
   const page=await context.newPage();page.setDefaultTimeout(10000);console.log('VIEW',view);page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>{requests.push({method:route.request().method(),origin:new URL(route.request().url()).origin});return new URL(route.request().url()).origin===base?route.continue():route.abort();});
   await page.goto(base+'/'+view+'.html');assert.equal(await page.locator('.source-card').count(),16);assert.equal(await page.locator('#nProvisions').textContent(),'417');
   assert.equal(await page.locator('#'+view).getAttribute('aria-pressed'),'true');scenarios.push(view+':inventory-and-mode');
   await page.locator('#search').fill('discourse');assert.equal(await page.locator('.source-card').count(),1);await page.locator('.source-card').click();assert.equal(await page.locator('#detail h2').textContent(),'Discourse');scenarios.push(view+':search-and-open');
   await page.locator('#search').fill('nothing-matches-this-source');assert.equal(await page.locator('.source-card').count(),0);assert.match(await page.locator('#sources').textContent(),/No matching/);
   await page.locator('#search').fill('');await page.locator('#group').selectOption('economy');assert.equal(await page.locator('.source-card').count(),1);await page.locator('#group').selectOption('');scenarios.push(view+':filters-and-empty');
   await page.locator('[data-source=ietf]').click();await page.locator('#note').fill('Add a public review period and an accessible route for affected users.');await page.locator('#saveNote').click();assert.match(await page.locator('#draftStatus').textContent(),/Saved in this browser/);
   await page.reload();await page.locator('[data-source=ietf]').click();assert.match(await page.locator('#note').inputValue(),/accessible route/);scenarios.push(view+':note-reload');
   console.log('DOWNLOAD',view);const downloadEvent=page.waitForEvent('download',{timeout:10000});await page.locator('#downloadDraft').click();const download=await downloadEvent;const file=await download.path();const draft=JSON.parse(fs.readFileSync(file,'utf8'));
   assert.equal(draft.human_approval,false);assert.equal(draft.may_execute,false);assert.equal(draft.changes_live_policy,false);assert.equal(draft.state,'DRAFT_NOT_SUBMITTED');assert.equal(draft.register_sha256,JSON.parse(initial).sha256);scenarios.push(view+':bound-draft-download');
   await page.locator('#provisionId').fill('32024R1689:9999');await page.locator('#provisionId').press('Enter');assert.match(await page.locator('#corpusResult').textContent(),/not in the frozen corpus/);
   await page.locator('#provisionId').fill('32024R1689:50');await page.locator('#provisionId').press('Enter');assert.match(await page.locator('#corpusResult').textContent(),/NOT_DETERMINED/);scenarios.push(view+':keyboard-provision-lookup');
   await page.locator('#note').fill('short');await page.locator('#downloadDraft').click();assert.match(await page.locator('#draftStatus').textContent(),/at least 20/);scenarios.push(view+':validation-error');
   for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
   await page.evaluate(()=>document.documentElement.style.fontSize='32px');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.evaluate(()=>document.documentElement.style.fontSize='');scenarios.push(view+':responsive-and-large-text');
   await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,view+'-desktop.png')});
   await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,view+'-mobile.png')});
   await context.close();
  }
  const context=await browser.newContext();await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked by test')}}));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/discussion.html');await page.locator('#note').fill('A retained local draft should survive a storage denial on this page.');await page.locator('#saveNote').click();assert.match(await page.locator('#draftStatus').textContent(),/storage is unavailable/);scenarios.push('blocked-storage-explicit-recovery');await context.close();
  assert.deepEqual(errors,[]);assert.ok(requests.every(r=>r.method==='GET'&&r.origin===base));assert.equal(hash(fs.readFileSync(path.join(root,'register.json'))),hash(initial));
  const report={passed:true,observed_at:new Date().toISOString(),host:'M4',browser:'Chrome via Playwright',scenarios,scenario_count:scenarios.length,viewports:[1440,390,320],large_text_px:32,page_errors:errors,external_requests:requests.filter(r=>r.origin!==base).length,post_requests:requests.filter(r=>r.method==='POST').length,register_unchanged:true,register_file_sha256:hash(initial),scope:'Two local prototype journeys, not representative-user, screen-reader, WCAG-conformance or deployed forum acceptance.'};
  fs.writeFileSync(path.join(root,'browser-acceptance.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{server.kill('SIGTERM');if(browser){await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,3000))]);for(const owned of ownedChrome){let command='';try{command=execFileSync('/bin/ps',['-p',String(owned.pid),'-o','command='],{encoding:'utf8'}).trim()}catch{}if(command===owned.command)process.kill(owned.pid,'SIGTERM');}await new Promise(resolve=>setTimeout(resolve,500));}}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
