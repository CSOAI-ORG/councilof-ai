// Local browser acceptance; no public endpoints or model calls.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { readFile, mkdtemp, writeFile, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const assert = require("node:assert/strict");

(async()=>{
  const root=resolve(__dirname,".."), temp=await mkdtemp(join(tmpdir(),"rehearsal-browser-"));
  const server=spawn("python3",["-B",join(root,"main.py"),"serve","--port","0"],
                     {cwd:root,stdio:["ignore","pipe","pipe"]});
  let browser;
  try {
    const origin=await new Promise((done,fail)=>{
      const timer=setTimeout(()=>fail(new Error("Local server startup timed out")),10000);
      server.stdout.on("data",chunk=>{const m=chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/);
        if(m){clearTimeout(timer);done(m[0]);}});
      server.on("exit",code=>{clearTimeout(timer);fail(new Error("Local server exited: "+code));});
    });
    browser=await chromium.launch({headless:true,
      ...(process.env.REHEARSAL_CHROMIUM_PATH?{executablePath:process.env.REHEARSAL_CHROMIUM_PATH}:{})});
    const context=await browser.newContext({acceptDownloads:true});
    const page=await context.newPage(), errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.route("**/*",route=>{
      const url=route.request().url();
      return url.startsWith(origin+"/")||url.startsWith("blob:")?route.continue():route.abort();
    });
    const check=async(condition,message)=>{assert.ok(await condition(),message);};
    await page.goto(origin);
    await page.getByRole("heading",{name:"Rehearse the decision."}).waitFor();
    const save=async(name,button="Save evidence bundle")=>{
      const [download]=await Promise.all([page.waitForEvent("download",{timeout:5000}),
                                        page.getByRole("button",{name:button}).click()]);
      const path=join(temp,name);await download.saveAs(path);return path;
    };
    const run=async(mode)=>{
      await page.locator('[name="intervention"]').selectOption(mode);
      await page.getByRole("button",{name:"Run rehearsal"}).click();
      await page.getByText(/Rehearsal recorded locally/).waitFor();
      await check(()=>page.locator("#rows tr").count().then(n=>n===10),"10 frame rows");
      await check(()=>page.locator("#messages .message").count().then(n=>n===3),"three real SwarmChat records");
      return save(mode+".json");
    };
    const baseline=await run("baseline"), aware=await run("evidence-aware");
    const eventFile=await save("events.jsonl","Export canonical events");
    const event=JSON.parse(await readFile(eventFile,"utf8"));
    assert.equal(event.schema,"csoai.evidence-event/0.1");assert.equal(event.state,"UNMEASURED");
    assert.equal(event.value,null);assert.equal(event.signature,null);
    await page.locator("#tick").focus();await page.keyboard.press("Home");
    assert.match(await page.locator("#frame").textContent(),/Tick 0:/);
    await page.keyboard.press("ArrowRight");assert.match(await page.locator("#frame").textContent(),/Tick 1:/);
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,
      JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll("body *")]
        .filter(el=>!el.closest(".table-wrap")&&(el.getBoundingClientRect().right>innerWidth+1||el.scrollWidth>el.clientWidth+1))
        .slice(0,8).map(el=>({tag:el.tagName,id:el.id,class:el.className,client:el.clientWidth,scroll:el.scrollWidth})))));
    assert.equal(await page.locator("#rows tr").count(),10);
    await page.locator("#aggregate-table").focus();
    assert.equal(await page.locator("#aggregate-table").evaluate(el=>el===document.activeElement),true);
    await page.setViewportSize({width:1280,height:900});
    const original=JSON.parse(await readFile(aware,"utf8"));
    assert.equal(original.core.counters.population_records,1000);
    assert.equal(original.core.counters.model_calls,0);
    await page.getByRole("button",{name:"Clear this view"}).click();
    await page.locator('[name="seed"]').fill("99");
    await page.locator("#reopen").setInputFiles(aware);
    await page.getByText(/Replay match. Unsigned fixture/).waitFor();
    assert.equal(await page.locator('[name="seed"]').inputValue(),"42");
    await check(()=>page.locator("#rows tr").count().then(n=>n===10),"actual downloaded file reopened");
    await page.locator("#first").setInputFiles(baseline);
    await page.locator("#second").setInputFiles(aware);
    await page.getByRole("button",{name:"Compare interventions"}).click();
    await page.getByText(/Comparable fixtures. Change/).waitFor();
    assert.equal(await page.locator("#comparison-rows tr").count(),10);
    await page.locator("#second").setInputFiles(baseline);
    await page.getByText("Comparison inputs changed. No previous verdict applies.").waitFor();
    assert.equal(await page.locator("#comparison-table").isVisible(),false);
    const changed=structuredClone(original);changed.core.frames[9].counts[0]=999;
    const bad=join(temp,"tampered.json");await writeFile(bad,JSON.stringify(changed));
    await page.locator("#reopen").setInputFiles(bad);
    await page.getByText(/Bundle does not match deterministic replay/).waitFor();
    assert.equal(await page.locator("#rows tr").count(),0);
    assert.equal(await page.locator("#download").isDisabled(),true);
    await page.locator("#reopen").setInputFiles(aware);
    await page.getByText(/Replay match. Unsigned fixture/).waitFor();
    await page.locator('[name="seed"]').fill("43");
    assert.equal(await page.locator("#download").isDisabled(),true);
    assert.equal(await page.locator("#rows tr").count(),0);
    await page.getByText("Timing and simulation permit",{exact:true}).click();
    await page.getByLabel("Permit expiry tick").fill("0");await run("evidence-aware");
    assert.match(await page.locator("#lesson").textContent(),/No selection update was permitted/);
    await page.getByLabel("Permit expiry tick").fill("50");
    await page.getByLabel("Evidence revocation tick").fill("10");await run("evidence-aware");
    assert.match(await page.locator("#lesson").textContent(),/was not tested/);
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:join(temp,"mobile.png"),fullPage:true});
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({result:"PASS",scenarios:[
      "two interventions with real SwarmChat records","saved actual bundles",
      "reopened downloaded original","compared controlled changes","changed comparison clears result",
      "tampered bundle refused and stale view cleared","original recovery",
      "scenario input clears old output","390px no horizontal page overflow","no page errors",
      "canonical JSONL download","keyboard timeline","populated mobile result fits page",
      "complete comparison timeline clears on edit","expired permit has no success claim",
      "unobserved revocation has no success claim","reopen restores original scenario controls"
    ],origin:"loopback",models:0,external_requests:0},null,2));
  } finally {
    if(browser)await browser.close();
    server.kill("SIGINT");
    await Promise.race([once(server,"exit"),new Promise(resolve=>setTimeout(resolve,3000))]);
    await rm(temp,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
