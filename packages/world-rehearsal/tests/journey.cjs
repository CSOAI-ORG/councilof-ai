// DOM + real loopback HTTP journey. Canvas/layout and native browser behavior are not verified here.
const { JSDOM } = require("jsdom");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { readFile, mkdtemp, writeFile, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const assert = require("node:assert/strict");

(async()=>{
  const root=resolve(__dirname,".."),temp=await mkdtemp(join(tmpdir(),"rehearsal-journey-"));
  const server=spawn("python3",["-B",join(root,"main.py"),"serve","--port","0"],
                     {cwd:root,stdio:["ignore","pipe","pipe"]});
  let dom;
  try {
    const origin=await new Promise((done,fail)=>{
      const timer=setTimeout(()=>fail(new Error("Server startup timed out")),10000);
      server.stdout.on("data",chunk=>{const m=chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/);
        if(m){clearTimeout(timer);done(m[0]);}});
      server.on("exit",code=>{clearTimeout(timer);fail(new Error("Server exited: "+code));});
    });
    dom=new JSDOM(await readFile(join(root,"static/index.html"),"utf8"),{url:origin,runScripts:"outside-only"});
    const w=dom.window,d=w.document,$=id=>d.getElementById(id),errors=[],pending=new Set();
    w.addEventListener("error",event=>errors.push(event.error));
    const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
    w.HTMLCanvasElement.prototype.getContext=()=>ctx; // Stub only the drawing API, never the app logic.
    w.AbortSignal=global.AbortSignal;w.Blob=global.Blob;
    let heldRun=null;
    w.fetch=async(path,options)=>{
      assert.ok(path.startsWith("/api/"),"Only local application endpoints");
      if(path==="/api/run"&&heldRun)await heldRun.promise;
      const promise=fetch(origin+path,{...options,headers:{...options.headers,Origin:origin}});
      pending.add(promise);try{return await promise;}finally{pending.delete(promise);}
    };
    let exported;
    w.URL.createObjectURL=blob=>{exported=blob;return "blob:local-fixture";};
    w.URL.revokeObjectURL=()=>{};
    w.HTMLAnchorElement.prototype.click=()=>{}; // Capture exported Blob bytes; native download is a browser test.
    w.eval(await readFile(join(root,"static/app.js"),"utf8"));
    const wait=async(predicate)=>{
      const until=Date.now()+5000;
      while(!predicate()){if(Date.now()>until)throw Error("Timed out: "+$("status").textContent+" / "+$("verify-result").textContent);
        await new Promise(resolve=>setTimeout(resolve,10));}
    };
    const input=(name,value)=>{const el=d.querySelector(`[name="${name}"]`);el.value=value;el.dispatchEvent(new w.Event("input",{bubbles:true}));};
    const run=async(mode)=>{
      input("intervention",mode);$("scenario").dispatchEvent(new w.Event("submit",{bubbles:true,cancelable:true}));
      await wait(()=>$("status").textContent.startsWith("Rehearsal recorded locally"));
      assert.equal($("rows").children.length,10);assert.equal($("messages").children.length,3);
      assert.equal($("node").children.length,120);assert.match($("node-detail").textContent,/synthetic-00000/);
      $("tick").value=0;$("tick").dispatchEvent(new w.Event("input"));
      assert.match($("frame").textContent,/Tick 0:/);
      $("download").click();const path=join(temp,mode+".json");
      await writeFile(path,await exported.text());return path;
    };
    const baseline=await run("baseline"),aware=await run("evidence-aware");
    $("events").click();await wait(()=>$("export-result").textContent.startsWith("1 canonical event exported"));
    const event=JSON.parse(await exported.text());
    assert.equal(event.schema,"csoai.evidence-event/0.1");assert.equal(event.state,"UNMEASURED");
    assert.equal(event.value,null);assert.equal(event.signature,null);
    const select=async(id,path)=>{
      const raw=await readFile(path,"utf8"),file={size:Buffer.byteLength(raw),text:async()=>raw};
      Object.defineProperty($(id),"files",{value:[file],configurable:true});
      $(id).dispatchEvent(new w.Event("change"));
    };
    $("clear").click();input("seed","99");await select("reopen",aware);
    await wait(()=>$("verify-result").textContent.startsWith("Replay match."));
    assert.equal($("rows").children.length,10);
    assert.equal(d.querySelector('[name="seed"]').value,"42");
    await select("first",baseline);await select("second",aware);$("compare").click();
    await wait(()=>$("compare-result").textContent.startsWith("Comparable fixtures."));
    assert.equal($("comparison-rows").children.length,10);assert.equal($("comparison-table").hidden,false);
    await select("second",baseline);
    assert.equal($("compare-result").textContent,"Comparison inputs changed. No previous verdict applies.");
    assert.equal($("comparison-table").hidden,true);
    const changed=JSON.parse(await readFile(aware,"utf8"));changed.core.frames[9].counts[0]=999;
    const bad=join(temp,"bad.json");await writeFile(bad,JSON.stringify(changed));await select("reopen",bad);
    await wait(()=>$("verify-result").textContent.includes("does not match deterministic replay"));
    assert.equal($("rows").children.length,0);assert.equal($("download").disabled,true);
    await select("reopen",aware);await wait(()=>$("verify-result").textContent.startsWith("Replay match."));
    assert.equal(d.querySelector('[name="seed"]').value,"42");
    input("seed","43");assert.equal($("rows").children.length,0);assert.equal($("download").disabled,true);
    let release;heldRun={promise:new Promise(done=>{release=done;})};
    $("scenario").dispatchEvent(new w.Event("submit",{bubbles:true,cancelable:true}));
    input("seed","44");release();heldRun=null;
    await wait(()=>!$("run").disabled);
    assert.equal($("rows").children.length,0,"Changed inputs discard an in-flight response");
    input("permit_expires_tick","0");await run("evidence-aware");
    assert.match($("lesson").textContent,/No selection update was permitted/);
    assert.match($("frame").textContent,/new revoked-A selections: 0/);
    input("permit_expires_tick","50");input("revocation_tick","10");await run("evidence-aware");
    assert.match($("lesson").textContent,/was not tested/);
    input("permit_expires_tick","3");input("revocation_tick","3");
    const expiredFirst=await run("baseline"),expiredSecond=await run("evidence-aware");
    await select("first",expiredFirst);await select("second",expiredSecond);$("compare").click();
    await wait(()=>$("compare-result").textContent.includes("No new decisions were permitted after revocation"));
    assert.match($("compare-result").textContent,/Zero new exposures does not show/);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({result:"PASS",journeys:["run two interventions","SwarmChat records",
      "sample inspector and timeline","export bytes to disk","reopen original bytes","controlled comparison",
      "changed comparison clears verdict","tamper refusal clears old view","recover original",
      "input edit clears result","in-flight edit discards stale response",
      "canonical event export","full comparison timeline clears on edit",
      "reopened scenario fields match evidence","expired permit is not success","unobserved revocation is not success",
      "unexposed comparison cannot claim success"],
      excluded:["native browser downloads","canvas rendering","responsive layout","real runtime"],
      model_calls:0,external_requests:0},null,2));
  } finally {
    if(dom)dom.window.close();
    server.kill("SIGINT");
    await Promise.race([once(server,"exit"),new Promise(resolve=>setTimeout(resolve,1000))]);
    await rm(temp,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
