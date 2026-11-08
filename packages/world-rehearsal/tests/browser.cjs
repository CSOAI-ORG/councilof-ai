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
    const save=async(name)=>{
      const [download]=await Promise.all([page.waitForEvent("download",{timeout:5000}),
                                        page.getByRole("button",{name:"Save evidence bundle"}).click()]);
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
    const original=JSON.parse(await readFile(aware,"utf8"));
    assert.equal(original.core.counters.population_records,1000);
    assert.equal(original.core.counters.model_calls,0);
    await page.getByRole("button",{name:"Clear this view"}).click();
    await page.locator("#reopen").setInputFiles(aware);
    await page.getByText(/Replay match. Unsigned fixture/).waitFor();
    await check(()=>page.locator("#rows tr").count().then(n=>n===10),"actual downloaded file reopened");
    await page.locator("#first").setInputFiles(baseline);
    await page.locator("#second").setInputFiles(aware);
    await page.getByRole("button",{name:"Compare interventions"}).click();
    await page.getByText(/Comparable fixtures. Change/).waitFor();
    await page.locator("#second").setInputFiles(baseline);
    await page.getByText("Comparison inputs changed. No previous verdict applies.").waitFor();
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
    // Paired measurements must retain separate units and refuse rewritten reports.
    await page.getByRole("button",{name:"Run paired controls",exact:true}).click();
    await page.getByText(/Measurement recorded in/).waitFor();
    assert.equal(await page.locator("#measurement-rows tr").count(),12);
    assert.match(await page.locator("#measurement-counts").textContent(),/Actual model calls: 0/);
    assert.match(await page.locator("#measurement-counts").textContent(),/Consenting human participants: 0/);
    assert.equal(await page.getByText("Not estimable: no decisions",{exact:true}).count(),3);
    const [measurementDownload]=await Promise.all([page.waitForEvent("download",{timeout:5000}),
      page.getByRole("button",{name:"Save measurement report",exact:true}).click()]);
    const measurementPath=join(temp,"measurement.json");await measurementDownload.saveAs(measurementPath);
    const measurement=JSON.parse(await readFile(measurementPath,"utf8"));
    assert.equal(measurement.counters.simulation_episodes,24);
    assert.equal(measurement.counters.actual_model_calls,0);
    assert.equal(measurement.counters.consenting_human_participants,0);
    assert.equal(measurement.summary.promotion_allowed,false);
    await page.getByRole("textbox",{name:"Seeds, separated by commas"}).fill("42,42");
    assert.equal(await page.locator("#measurement-download").isDisabled(),true);
    assert.equal(await page.locator("#measurement-rows tr").count(),0);
    await page.getByRole("button",{name:"Run paired controls",exact:true}).click();
    await page.getByText(/Use 1 to 8 distinct integer seeds/).waitFor();
    await page.locator("#measurement-reopen").setInputFiles(measurementPath);
    await page.getByText(/Replay match. Internal consistency only/).waitFor();
    assert.equal(await page.locator("#measurement-rows tr").count(),12);
    const forged=structuredClone(measurement);forged.counters.consenting_human_participants=1;
    const forgedPath=join(temp,"forged-measurement.json");await writeFile(forgedPath,JSON.stringify(forged));
    await page.locator("#measurement-reopen").setInputFiles(forgedPath);
    await page.getByText(/Measurement report does not match deterministic replay/).waitFor();
    assert.equal(await page.locator("#measurement-download").isDisabled(),true);
    assert.equal(await page.locator("#measurement-rows tr").count(),0);
    await page.locator("#measurement-reopen").setInputFiles(measurementPath);
    await page.getByText(/Replay match. Internal consistency only/).waitFor();
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.screenshot({path:join(temp,"mobile.png"),fullPage:true});
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({result:"PASS",scenarios:[
      "two interventions with real SwarmChat records","saved actual bundles",
      "reopened downloaded original","compared controlled changes","changed comparison clears result",
      "tampered bundle refused and stale view cleared","original recovery",
      "scenario input clears old output","390px no horizontal page overflow","no page errors",
      "paired controls render twelve cases","separate synthetic/model/human units",
      "zero-decision rate is not estimable","actual measurement report downloaded",
      "changed measurement inputs clear old result","duplicate seeds refused",
      "downloaded measurement replayed","forged participation refused and cleared",
      "original measurement recovered"
    ],origin:"loopback",models:0,external_requests:0},null,2));
  } finally {
    if(browser)await browser.close();
    server.kill("SIGINT");
    await Promise.race([once(server,"exit"),new Promise(resolve=>setTimeout(resolve,3000))]);
    await rm(temp,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});

