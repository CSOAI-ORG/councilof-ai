#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Isolated Chromium integration, not a production CouncilOS host test.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {build} from "esbuild";
import {chromium} from "playwright";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../..");
const dir=await fs.mkdtemp(path.join(os.tmpdir(),"csoai-reaction-"));
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated reaction research fixture</title><style>body{margin:0;background:white;color:#123d2b;font-family:system-ui}main{max-width:920px;margin:auto;padding:12px}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%}textarea{max-width:100%;box-sizing:border-box}button{cursor:pointer;padding:8px;border:1px solid green;margin:4px}details{border:1px solid #b5d8c0;border-radius:10px;padding:12px}</style></head><body><main><div id="root"></div></main><script src="/bundle.js"></script></body></html>';
const server=http.createServer(async (req,res)=>{
  if(req.method!=="GET"||!["/","/bundle.js"].includes(req.url)){res.writeHead(404);return res.end();}
  const file=req.url==="/"?"index.html":"bundle.js";
  try{
    const bytes=await fs.readFile(path.join(dir,file));
    res.writeHead(200,{"Content-Type":file==="index.html"?"text/html;charset=utf-8":"text/javascript;charset=utf-8","Cache-Control":"no-store"});
    res.end(bytes);
  }catch{res.writeHead(500);res.end();}
});
let browser=null, listening=false;
try {
  await build({entryPoints:[path.join(root,"measurement/experiments/reaction-bridge/browser-fixture.tsx")],outfile:path.join(dir,"bundle.js"),bundle:true,platform:"browser",format:"iife",target:"es2022",jsx:"automatic",minify:true});
  await fs.writeFile(path.join(dir,"index.html"),html);
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});listening=true;
  const address=server.address(),base="http://127.0.0.1:"+address.port;
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  const check=async viewport=>{
    const page=await browser.newPage({viewport});
    const errors=[],outbound=[];
    page.on("pageerror",e=>errors.push(e.message));
    page.on("request",req=>{if(!req.url().startsWith(base+"/"))outbound.push(req.url());});
    try{
      await page.goto(base+"/",{waitUntil:"load"});
      await page.locator('[data-testid="reaction-research-review"]').waitFor();
      assert.equal(await page.locator("details").getAttribute("open"),null);
      await page.locator("summary").click();
      await page.getByRole("button",{name:"Load two observed research cases"}).click();
      assert.match(await page.locator("textarea").inputValue(),/OBSERVED/);
      await page.getByRole("button",{name:"Review reported stages"}).click();
      assert.match(await page.locator('pre[role="status"]').innerText(),/UNQUALIFIED INPUT/);
      assert.match(await page.locator('pre[role="status"]').innerText(),/ACCEPTANCE_INCOMPLETE/);
      assert.match(await page.locator('pre[role="status"]').innerText(),/observed-labelled: 2/);
      assert.match(await page.locator('pre[role="status"]').innerText(),/simulated-labelled: 0/);
      assert.match(await page.locator('pre[role="status"]').innerText(),/independently qualified: UNKNOWN/);
      await page.locator("textarea").fill("{invalid json");
      await page.getByRole("button",{name:"Review reported stages"}).click();
      assert.match(await page.locator('pre[role="status"]').innerText(),/REVIEW REFUSED/);
      assert.equal(await page.locator("form").count(),0);
      await page.getByRole("button",{name:"Clear local input"}).click();
      assert.equal(await page.locator("textarea").inputValue(),"");
      assert.match(await page.locator('pre[role="status"]').innerText(),/Cleared/);
      const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
      assert.ok(width.scroll<=width.client+1,"horizontal overflow "+JSON.stringify(width));
      assert.deepEqual(errors,[],"browser page errors");
      assert.deepEqual(outbound,[],"unexpected outbound browser requests");
      return {viewport,source:"ISOLATED_FIXTURE",observed_source_only:true,interaction:"PASSED",outbound_requests:outbound.length,page_errors:errors.length};
    }finally{await page.close();}
  };
  const results=[await check({width:390,height:844}),await check({width:1280,height:900})];
  process.stdout.write(JSON.stringify({schema:"csoai.reaction-browser-fixture/0.1",results,actual_councilos_host_accepted:false,real_human_authority:false,live_public_site_tested:false})+"\n");
}finally{
  await browser?.close();
  if(listening)await new Promise(resolve=>server.close(()=>resolve()));
  await fs.rm(dir,{recursive:true,force:true});
}
