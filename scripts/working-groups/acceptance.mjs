#!/usr/bin/env node
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { chromium, expect } from "@playwright/test";
import { createServer as httpServer } from "node:http";
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
const {values}=parseArgs({options:{output:{type:"string"},chromium:{type:"string"}}});
if(!values.output||!path.isAbsolute(values.output))throw Error("--output requires an absolute path");
const repo=process.cwd(),root=await mkdtemp(path.join(tmpdir(),"council-wg-infra-"));
const require=createRequire(import.meta.url),axe=await readFile(require.resolve("axe-core/axe.min.js"),"utf8");
const checks=[],violations=[],errors=[],external=[],captures=[];
let vite,browser,staticServer,lab;
const outDir=path.dirname(values.output);await mkdir(outDir,{recursive:true});
async function audit(page,label,selector){
  await page.evaluate(axe);
  const rows=await page.evaluate(async selector=>window.axe.run(selector?{include:[selector]}:document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]}}),selector);
  violations.push(...rows.violations.map(v=>({surface:label,id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})));
  expect(rows.violations,label+" axe violations").toEqual([]);
  checks.push(label+" automated WCAG-tagged checks");
}
async function capture(page,name){const file=path.join(outDir,name+".png");await page.screenshot({path:file});captures.push(file);}
try{
  await writeFile(path.join(root,"index.html"),'<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Council working-group acceptance</title></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
  await writeFile(path.join(root,"main.tsx"),'import React from "react";import {createRoot} from "react-dom/client";import Watchdog from "@/pages/Watchdog";import "./style.css";createRoot(document.getElementById("root")).render(<Watchdog/>);');
  await writeFile(path.join(root,"style.css"),'@import "'+path.join(repo,"client/src/styles/index.css")+'"; @source "'+path.join(repo,"client/src")+'";');
  vite=await createServer({configFile:false,root,plugins:[react(),tailwindcss()],resolve:{alias:{"@":path.join(repo,"client/src"),react:path.join(repo,"node_modules/react"),"react-dom":path.join(repo,"node_modules/react-dom")}},server:{host:"127.0.0.1",port:0,fs:{allow:[root,repo]}},logLevel:"error"});
  await vite.listen();const origin="http://127.0.0.1:"+vite.httpServer.address().port;
  staticServer=httpServer(async(req,res)=>{
    const file={"/":"index.html","/catalog.json":"catalog.json"}[req.url];
    if(!file){res.writeHead(404);return res.end();}
    res.setHeader("Content-Type",file.endsWith("json")?"application/json":"text/html; charset=utf-8");
    res.end(await readFile(path.join(repo,"public/working-groups",file)));
  });staticServer.listen(0,"127.0.0.1");await once(staticServer,"listening");
  const staticOrigin="http://127.0.0.1:"+staticServer.address().port;
  lab=spawn("python3",[path.join(repo,"tools/working-group-lab/server.py"),"--db",path.join(root,"lab.sqlite")],{stdio:["ignore","pipe","pipe"]});
  const labInfo=await new Promise((resolve,reject)=>{
    let data="";const timer=setTimeout(()=>reject(Error("Lab failed to start")),15000);
    lab.stdout.on("data",chunk=>{data+=chunk;if(data.includes("\n")){clearTimeout(timer);try{resolve(JSON.parse(data.split("\n")[0]));}catch(e){reject(e);}}});
    lab.on("error",reject);lab.on("exit",code=>{if(!data)reject(Error("Lab exited "+code));});
  });
  browser=await chromium.launch({headless:true,...(values.chromium?{executablePath:values.chromium}:{})});
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce"});
  await context.route("**/*",route=>{
    const url=new URL(route.request().url());
    if(![origin,staticOrigin,labInfo.url].includes(url.origin)){external.push(url.origin+url.pathname);return route.abort();}
    return route.continue();
  });
  const page=await context.newPage();page.on("pageerror",e=>errors.push(e.message));
  await page.route("**/spec/claim-maintenance/register.json",route=>route.fulfill({json:{registries:[],totals:{subjects:0,claims:0}}}));
  await page.goto(origin+"/watchdog/?view=groups&groupview=tracker");
  const tracker=page.locator("#working-group-tracker");
  await expect(tracker).toBeVisible();
  await page.getByRole("button",{name:"Start a task",exact:true}).click();
  await expect(tracker).toHaveCount(0);await expect(page.locator("article")).toHaveCount(7);
  await page.getByRole("button",{name:"Track documents",exact:true}).click();
  expect(new URL(page.url()).searchParams.get("groupview")).toBe("tracker");
  await expect(tracker.getByRole("status")).toHaveText("7 documents shown");
  await page.locator("#wg-query").fill("effect-binding");
  await expect(tracker.getByRole("status")).toHaveText("1 document shown");
  await expect(tracker.getByRole("heading",{name:"Measure delegation revocation and halt latency"})).toBeVisible();
  await page.locator("#wg-status").selectOption("published");
  await expect(tracker.getByRole("status")).toHaveText("0 documents shown");
  await tracker.getByRole("button",{name:"Clear filters"}).click();
  await expect(page.locator("#wg-query")).toHaveValue("");
  checks.push("real Watchdog search, axis filter, authoritative empty state and recovery");
  await tracker.getByRole("button",{name:/Prepare review draft.*COAI-WG-002/}).click();
  await expect(page.locator("#wg-observation")).toBeFocused();
  await page.locator("#wg-observation").fill("Synthetic <script>window.injected=true</script> review.");
  await page.locator("#wg-conflicts").fill("Local acceptance fixture only.");
  await tracker.getByRole("button",{name:"Prepare download"}).click();
  const downloaded=page.waitForEvent("download");await tracker.getByRole("link",{name:/Download unsent/}).click();
  const file=await downloaded,text=await readFile(await file.path(),"utf8");
  expect(text).toContain("UNSENT DRAFT");expect(text).toContain("COAI-WG-002");expect(text).toContain("19ccbd406714");expect(text).toContain("<script>");
  expect(await page.evaluate(()=>window.injected)).toBeUndefined();
  await page.locator("#wg-observation").fill("Changed unsent review.");
  await expect(tracker.getByRole("link",{name:/Download unsent/})).toHaveCount(0);
  checks.push("review focus, safe literal text, pinned download and stale-download invalidation");
  await tracker.evaluate(el=>el.scrollIntoView({block:"start",behavior:"instant"}));await capture(page,"tracker-desktop");await audit(page,"native tracker","#working-group-tracker");
  for(const width of [390,320]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await tracker.evaluate(el=>el.scrollIntoView({block:"start",behavior:"instant"}));
  }
  await capture(page,"tracker-mobile");
  await page.locator("#wg-query").focus();await page.keyboard.press("Tab");await expect(page.locator("#wg-group")).toBeFocused();
  checks.push("320px and 390px layout, keyboard order and reduced-motion rendering");
  await page.setViewportSize({width:1280,height:900});await page.goto(staticOrigin);
  await page.locator("#search").fill("effect-binding");await expect(page.locator("#count")).toHaveText("1 document shown");
  await expect(page.getByRole("link",{name:"Charter source register",exact:true})).toHaveAttribute("href","https://councilof.ai/charter-register/");
  await page.getByText("Use with an AI client", {exact:true}).click();
  await expect(page.locator("#ai-client code")).toHaveText("working_group_review");
  await expect(page.locator("#ai-client a")).toHaveAttribute("href","https://councilof.ai/mcp/free");
  await page.setViewportSize({width:320,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await expect(page.locator("#ai-client")).toContainText("unsent review");
  checks.push("expanded AI-client instructions, canonical endpoint and 320px layout");
  await page.setViewportSize({width:1280,height:900});
  await audit(page,"portable static tracker");await capture(page,"static-tracker-desktop");
  const offline=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}});
  const plain=await offline.newPage();await plain.goto(staticOrigin);await expect(plain.locator("#documents>li")).toHaveCount(7);
  expect(await plain.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await offline.close();checks.push("portable export is readable without JavaScript at 320px");
  await page.goto(labInfo.url);await expect(page.locator("#status")).toContainText("Ready");
  await page.locator("#document").selectOption("COAI-WG-002");
  await page.locator("#body").fill("Synthetic late effect. <img src=x onerror=alert(1)>");
  await page.getByRole("button",{name:"Save local lab comment"}).click();
  await expect(page.locator("#comments")).toContainText("Synthetic late effect.");
  expect(await page.locator("#comments img").count()).toBe(0);
  await page.reload();await expect(page.locator("#status")).toContainText("Ready");await page.locator("#document").selectOption("COAI-WG-002");
  await expect(page.locator("#comments")).toContainText("Synthetic late effect.");
  await page.locator("#comment-id").selectOption("1");await page.locator("#reason").fill("Synthetic moderation drill");
  await page.getByRole("button",{name:"Record local hide"}).click();
  await expect(page.locator("#comments")).toContainText("hidden in lab: Synthetic moderation drill");
  await expect(page.locator("#history li")).toHaveCount(2);
  const logDownload=page.waitForEvent("download");await page.getByRole("button",{name:"Download lab event log"}).click();
  const eventFile=await logDownload,log=JSON.parse(await readFile(await eventFile.path(),"utf8"));
  expect(log.authenticatedHuman).toBe(false);expect(log.authority).toBe("none");expect(log.events.map(e=>e.kind)).toEqual(["comment","hide"]);
  checks.push("SQLite lab persists comments, escapes markup, records moderation and exports original events");
  await audit(page,"local discussion lab");await page.evaluate(()=>scrollTo(0,0));await capture(page,"lab-desktop");
  await page.setViewportSize({width:320,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.evaluate(()=>scrollTo(0,0));await capture(page,"lab-mobile");checks.push("local discussion lab mobile layout");
  expect(errors).toEqual([]);expect(external).toEqual([]);
  const sourcePaths=["council-os/working-groups.json","council-os/working-group-tracker.json","council-os/working-groups/core.mjs","client/src/components/WorkingGroups.tsx","client/src/components/WorkingGroupTracker.tsx","client/src/pages/Watchdog.tsx","client/src/styles/index.css","package-lock.json","scripts/working-groups/render-kit.mjs","scripts/working-groups/acceptance.mjs","public/working-groups/index.html","public/working-groups/catalog.json","tools/working-group-lab/server.py","tools/working-group-lab/app.js","tools/working-group-lab/index.html"];
  const sources=[];for(const file of sourcePaths)sources.push({path:file,sha256:createHash("sha256").update(await readFile(path.join(repo,file))).digest("hex")});
  await writeFile(values.output,JSON.stringify({checked_at:new Date().toISOString(),checks,passed:checks.length,axe_violations:violations,errors,external_requests:external,screenshots:captures,sources,scope:"Local real components, static export and synthetic SQLite lab. Automated WCAG-tagged checks are not full accessibility certification or representative human usability testing. No publishing, invitations, private cases or authority actions."},null,2)+"\n");
  console.log(JSON.stringify({passed:checks.length,axe_violations:violations.length,output:values.output}));
}finally{
  await browser?.close();await vite?.close();await new Promise(resolve=>staticServer?staticServer.close(resolve):resolve());
  if(lab&&lab.exitCode===null){lab.kill("SIGTERM");await once(lab,"exit");}
  await rm(root,{recursive:true,force:true});
}
