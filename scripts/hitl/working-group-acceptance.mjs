#!/usr/bin/env node
// Local real-component acceptance. No email sends, production requests or real memberships.
// node scripts/hitl/working-group-acceptance.mjs --output /absolute/path/result.json
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { chromium, expect } from "@playwright/test";
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { parseArgs } from "node:util";
import { createHash } from "node:crypto";
import path from "node:path";

const { values } = parseArgs({ options: { output: { type: "string" }, chromium: { type: "string" } } });
if (!values.output || !path.isAbsolute(values.output)) throw new Error("--output must be an absolute file path");
const repo = process.cwd();
const root = await mkdtemp(path.join(tmpdir(), "council-working-groups-"));
const checks = [], errors = [], externalRequests = [];
const sourcePaths = [
  "council-os/working-groups.json", "client/src/components/WorkingGroups.tsx",
  "client/src/lib/workingGroups.ts", "client/src/lib/pilotEnquiry.ts",
  "client/src/pages/Watchdog.tsx", "client/src/pages/Contact.tsx",
  "client/src/styles/index.css", "scripts/hitl/working-group-acceptance.mjs",
];
const sources = [];
for (const file of sourcePaths) {
  const bytes = await readFile(path.join(repo, file));
  sources.push({path:file, sha256:createHash("sha256").update(bytes).digest("hex")});
}
const registry = JSON.parse(await readFile(path.join(repo, "council-os/working-groups.json"), "utf8"));
let server, browser;
try {
  await writeFile(path.join(root,"index.html"), '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
  await writeFile(path.join(root,"main.tsx"), 'import React from "react";import {createRoot} from "react-dom/client";import Watchdog from "@/pages/Watchdog";import Contact from "@/pages/Contact";import "./style.css";createRoot(document.getElementById("root")).render(location.pathname.startsWith("/contact") ? <Contact/> : <Watchdog/>);');
  await writeFile(path.join(root,"style.css"), `@import "${path.join(repo,"client/src/styles/index.css")}"; @source "${path.join(repo,"client/src")}";`);
  server = await createServer({ configFile:false, root, plugins:[react(),tailwindcss()],
    resolve:{alias:{"@":path.join(repo,"client/src"),react:path.join(repo,"node_modules/react"),"react-dom":path.join(repo,"node_modules/react-dom")}},
    server:{host:"127.0.0.1",port:0,fs:{allow:[root,repo]}},logLevel:"error" });
  await server.listen();
  const origin = "http://127.0.0.1:" + server.httpServer.address().port;
  browser = await chromium.launch({headless:true,...(values.chromium ? {executablePath:values.chromium} : {})});
  const context = await browser.newContext({viewport:{width:1280,height:900},permissions:["clipboard-read","clipboard-write"]});
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) {
      externalRequests.push(url.origin + url.pathname);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", e => errors.push(e.message));
  await page.route("**/spec/claim-maintenance/register.json",route=>route.fulfill({json:{registries:[],totals:{subjects:0,claims:0}}}));
  await page.goto(origin+"/watchdog/?view=groups");
  await expect(page.getByRole("heading",{name:"Public Watchdog working groups",exact:true})).toBeVisible();
  await expect(page.locator("article")).toHaveCount(registry.groups.length);
  if (await page.getByRole("button",{name:"Working groups",exact:true}).evaluate(el=>parseFloat(getComputedStyle(el).minHeight)) < 44) throw new Error("Application CSS not loaded");
  checks.push("deep link, seven groups and actual application stylesheet");

  for (const group of registry.groups) {
    const card = page.locator("#"+group.id);
    const downloaded = page.waitForEvent("download");
    await card.getByRole("link",{name:/Download task brief/}).click();
    const file = await downloaded;
    expect(file.suggestedFilename()).toBe(`council-${group.id}-task-brief.md`);
    const brief = await readFile(await file.path(),"utf8");
    expect(brief).toContain(group.name);
    expect(brief).toContain(group.firstTask);
    for (const output of group.reviewOutputs) expect(brief).toContain(output);
    expect(brief).toContain("no appointment implied");
    if (group.id === "agent-control") {
      const protocol = await card.getByRole("link",{name:"Open the runnable revocation trial"}).getAttribute("href");
      expect(brief).toContain(protocol);
      expect(brief).toContain("non-cancellable FAIL");
      expect(brief).toContain("unknown-effect INCONCLUSIVE");
    }
  }
  checks.push("all seven actual downloads retain task, evidence checklist and return route");
  const summary=page.locator("#agent-control summary");
  await summary.focus();await page.keyboard.press("Enter");
  await expect(page.locator('#agent-control a[href="/gspc/safety/"]')).toBeVisible();
  checks.push("keyboard opens axis list");
  await page.getByRole("button",{name:"Claims",exact:true}).click();
  await expect(page).toHaveURL(origin+"/watchdog/");
  await page.goBack();
  await expect(page.getByRole("button",{name:"Working groups",exact:true})).toHaveAttribute("aria-pressed","true");
  checks.push("claims navigation and browser back");
  await page.locator("#agent-control").getByRole("link",{name:/Prepare participation enquiry/}).click();
  await expect(page.locator("#contact-subject")).toHaveValue("Working group enquiry — Agent authority and stopping");
  await expect(page.locator("#contact-message")).toHaveValue(/require separate agreement/);
  checks.push("participation enquiry reaches actual Contact form");

  for (const group of registry.groups) {
    await page.goto(origin+"/watchdog/?view=groups");
    await page.locator("#"+group.id).getByRole("link",{name:/Prepare contribution email/}).click();
    await expect(page.locator("#contact-subject")).toHaveValue(`Working group contribution — ${group.name}`);
    expect(await page.locator("#contact-message").inputValue()).toContain(group.firstTask);
    await page.getByTestId("contact-copy-button").click();
    await expect(page.getByRole("status")).toContainText("Nothing has been sent");
    const copied = await page.evaluate(()=>navigator.clipboard.readText());
    expect(copied).toContain(group.name);
    expect(copied).toContain("Public evidence or reproducible result link:");
    expect(copied).toContain("not an accepted appointment");
  }
  checks.push("all seven contribution handoffs and copy recovery preserve scope without sending");
  await page.setViewportSize({width:390,height:844});
  await page.goto(origin+"/watchdog/?view=groups");
  await expect(page.locator("#working-groups-heading")).toBeVisible();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error("mobile horizontal overflow");
  checks.push("390px layout has no horizontal overflow");
  for (const query of ["group=__proto__","group=agent-control&stage=approved"]) {
    await page.goto(origin+"/contact/?arm=working-group&"+query);
    await expect(page.locator("#contact-subject")).toHaveValue("");
  }
  checks.push("unknown group and unsupported review stage are not prefilled");
  if(errors.length)throw new Error(errors.join("\n"));
  if(externalRequests.length)throw new Error("Unexpected external requests: "+externalRequests.join(", "));
  const receipt={checked_at:new Date().toISOString(),passed:checks.length,checks,sources,
    scope:"Local real Watchdog and Contact components, application stylesheet and fixture claim register. External requests blocked. No send, upload, membership, human decision or production release.",
    external_requests:externalRequests};
  await mkdir(path.dirname(values.output),{recursive:true});
  await writeFile(values.output,JSON.stringify(receipt,null,2)+"\n");
  console.log(JSON.stringify({passed:checks.length,output:values.output}));
} finally {
  await browser?.close();await server?.close();await rm(root,{recursive:true,force:true});
}
