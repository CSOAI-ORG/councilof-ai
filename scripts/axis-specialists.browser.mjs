/**
 * EAT of the actual specialist pane, production CSS and GET handler.
 * Run: CHROME_PATH=/path/to/chrome node scripts/axis-specialists.browser.mjs
 * No provider calls, external network, approvals or deployment.
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { build } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { build as bundle } from "esbuild";
import { chromium, expect } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporary = await fs.mkdtemp(path.join(root, ".axis-eat-"));
const output = process.env.EAT_BROWSER_OUTPUT || await fs.mkdtemp(path.join(os.tmpdir(), "axis-eat-results-"));
await fs.mkdir(output, { recursive: true });
let browser, server;
const results = [], errors = [], requests = [];
const sourcePaths = ["scripts/axis-specialists.browser.mjs", "scripts/axis-specialists.mjs", "client/src/components/gspc/CouncilAxisSpecialistPane.tsx", "client/src/components/gspc/AxisReviewPanel.tsx", "client/src/lib/axisSpecialistReview.ts", "client/src/components/HitlConsole.tsx", "functions/api/hitl.ts", "functions/api/_hitl.ts", "public/axis-specialists/bundle.json", "public/axis-specialists/index.json", "council-os/axis-specialists/charter-map.json", "public/.well-known/constitutional-harness.json"];
const sourceHashes = async () => Object.fromEntries(await Promise.all(sourcePaths.map(async name => [name, createHash("sha256").update(await fs.readFile(path.join(root, name))).digest("hex")])));
const sources = await sourceHashes();
let mode = "normal", delayedReply, delayObserved;
const values = new Map();
const kv = {
  put: async (key, value) => { if (mode === "write-failed") throw new Error("controlled storage failure"); values.set(key, value); },
  get: async key => values.get(key) ?? null,
  list: async ({ prefix }) => ({ keys: [...values.keys()].filter(key => key.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
};
const observedDelay = new Promise(resolve => { delayObserved = resolve; });
try {
  await fs.writeFile(path.join(temporary, "index.html"), '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Axis specialist EAT</title></head><body><div id="root"></div><script type="module" src="/entry.tsx"></script></body></html>');
  await fs.writeFile(path.join(temporary, "entry.tsx"), 'import React from "react";import{createRoot}from"react-dom/client";import Pane from"../client/src/components/gspc/CouncilAxisSpecialistPane";import"./fixture.css";createRoot(document.getElementById("root")!).render(<Pane/>);');
  await fs.writeFile(path.join(temporary, "fixture.css"), '@import "../client/src/styles/index.css";\n@source "../client/src/components/gspc/CouncilAxisSpecialistPane.tsx";\n@source "../client/src/components/gspc/AxisReviewPanel.tsx";\n@source "../client/src/components/HitlConsole.tsx";\n@source "../client/src/components/HitlDecisionHistory.tsx";\n');
  await build({ configFile: false, root: temporary, publicDir: false, plugins: [tailwindcss()],
    esbuild: { jsx: "automatic" }, logLevel: "warn", build: { outDir: path.join(temporary, "dist") } });
  await bundle({ entryPoints: [path.join(root, "functions/api/axis-specialists/[axis].ts")],
    outfile: path.join(temporary, "api.mjs"), bundle: true, platform: "node", format: "esm" });
  const { onRequestGet } = await import(pathToFileURL(path.join(temporary, "api.mjs")));
  await bundle({ entryPoints: [path.join(root, "functions/api/hitl.ts")], outfile: path.join(temporary, "hitl.mjs"), bundle: true, platform: "node", format: "esm" });
  const hitl = await import(pathToFileURL(path.join(temporary, "hitl.mjs")));
  const capturedBoard = await fs.readFile(path.join(root, "council-os/axis-specialists/board-2026-10-28.snapshot.json"));
  server = createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, "http://localhost").pathname;
      if (pathname === "/api/gspc") { res.writeHead(200, { "content-type": "application/json" }); res.end(capturedBoard); return; }
      if (pathname.startsWith("/api/hitl")) {
        requests.push({ method: req.method, path: pathname });
        const chunks = []; for await (const chunk of req) chunks.push(chunk);
        const ctx = { request: new Request(`http://127.0.0.1:${server.address().port}${pathname}`, { method: req.method, headers: req.headers, ...(req.method === "POST" ? { body: Buffer.concat(chunks).toString() } : {}) }), env: mode === "stateless" ? {} : { HITL_KV: kv } };
        const response = await (req.method === "POST" ? hitl.onRequestPost(ctx) : hitl.onRequestGet(ctx));
        const body = await response.json();
        if (mode === "wrong-review" && req.method === "POST") body.axis = "safety";
        res.writeHead(response.status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); return;
      }
      if (pathname.startsWith("/api/axis-specialists/")) {
        requests.push({ method: req.method, path: pathname });
        const axis = pathname.split("/").at(-1);
        const response = onRequestGet({ request: new Request("http://localhost" + pathname), params: { axis } });
        let body = await response.json(), status = response.status;
        if (mode === "bad-count") body.summary.passed++;
        if (mode === "wrong-axis") body = await onRequestGet({ request: new Request("http://localhost/api"), params: { axis: axis === "governance" ? "safety" : "governance" } }).json();
        if (mode === "unknown-state") body.checks[0].state = "VERIFIED";
        if (mode === "forged-proposal") body.improvement_proposals[0].proposal = "Publish immediately";
        if (mode === "offline") { status = 503; body = { error: { message: "Controlled unavailable response" } }; }
        const reply = () => { res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(body)); };
        if (mode === "delayed" && axis === "governance") { delayedReply = reply; delayObserved(); } else reply();
        return;
      }
      const target = path.resolve(temporary, "dist", "." + (pathname === "/" ? "/index.html" : pathname));
      assert(target.startsWith(path.join(temporary, "dist") + path.sep));
      const bytes = await fs.readFile(target);
      res.writeHead(200, { "content-type": target.endsWith(".js") ? "text/javascript" : target.endsWith(".css") ? "text/css" : "text/html" });
      res.end(bytes);
    } catch (error) { res.writeHead(500); res.end(String(error)); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = "http://127.0.0.1:" + server.address().port;
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", error => errors.push(String(error)));
  await page.route("**/*", route => route.request().url().startsWith(origin + "/") ? route.continue() : route.abort());
  const select = page.getByTestId("axis-specialist-select");
  async function ready(axis) {
    await select.selectOption(axis);
    await expect(page.locator("#specialist-mission")).toHaveText("meok-" + axis + "-specialist");
  }
  async function check(name, run) { console.log("RUN", name); await run(); results.push({ name, state: "PASS" }); console.log("PASS", name); }
  await page.goto(origin);
  await check("measured audit labels declarations and human review honestly", async () => {
    await ready("governance");
    await expect(page.getByText("2 declared, unverified", { exact: true })).toBeVisible();
    await expect(page.getByText("6/8", { exact: true })).toBeVisible();
    await expect(page.getByText("MEOK H.I.M. gate: HOLD", { exact: true })).toBeVisible();
    await expect(page.getByText(/Every proposal requires human review and remains unapplied/)).toBeVisible();
    await page.screenshot({ path: path.join(output, "desktop.png"), fullPage: true });
  });
  const index = JSON.parse(await fs.readFile(path.join(root, "public/axis-specialists/index.json"), "utf8"));
  await check("all 33 axes render their own audit without fallback", async () => {
    for (const row of index.specialists) {
      await ready(row.axis);
      await expect(page.getByRole("link", { name: "Current axis record", exact: true })).toHaveAttribute("href", `/api/gspc/axis/${row.axis}`);
      await expect(page.getByRole("link", { name: "Reviewer briefing", exact: true })).toHaveAttribute("href", `/api/hitl/modules/${row.axis}`);
      await expect(page.getByRole("heading", { name: "Charter, evidence and next step" })).toBeVisible();
    }
  });
  await check("unmeasured axis retains measurement gap", async () => {
    await ready(index.specialists.find(row => row.measurement_status === "UNMEASURED").axis);
    await expect(page.getByText("UNMEASURED stays visible. n=0 is not a score.", { exact: true })).toBeVisible();
  });
  for (const failure of ["bad-count", "wrong-axis", "unknown-state", "forged-proposal"]) {
    await check(failure + " refuses evidence without crashing", async () => {
      mode = failure; await page.reload();
      await expect(page.getByRole("alert")).toContainText("Nothing was substituted");
      await expect(page.locator("output")).toHaveText("READ_FAILED");
      await expect(page.locator("#specialist-mission")).toHaveCount(0);
    });
  }
  await check("503 retry restores the requested axis", async () => {
    mode = "offline"; await page.reload();
    await expect(page.getByRole("alert")).toContainText("Controlled unavailable response");
    const axis = await select.inputValue();
    mode = "normal"; await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.locator("#specialist-mission")).toHaveText("meok-" + axis + "-specialist");
  });
  await check("late previous-axis response cannot replace current selection", async () => {
    await ready("safety"); mode = "delayed"; await select.selectOption("governance");
    await Promise.race([observedDelay, new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error("Delayed request not observed")), 10000); timer.unref(); })]);
    await expect(page.getByText("Reading the governance specialist audit…", { exact: true })).toBeVisible();
    await ready("safety"); delayedReply();
    await page.waitForResponse(response => response.url().endsWith("/governance"));
    await expect(page.locator("#specialist-mission")).toHaveText("meok-safety-specialist");
    mode = "normal";
  });
  await check("mobile layout fits and exposes HOLD", async () => {
    await page.setViewportSize({ width: 390, height: 844 }); await ready("governance");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await expect(page.getByTestId("axis-specialists-pane")).toHaveCSS("padding-left", "16px");
    await expect(page.getByText("MEOK H.I.M. gate: HOLD", { exact: true })).toBeVisible();
    await page.screenshot({ path: path.join(output, "mobile.png"), fullPage: true });
  });
  await check("browser has no page errors or write requests", async () => {
    assert.deepEqual(errors, []); assert(requests.length > 33); assert(requests.every(item => item.method === "GET"));
    assert.equal(await page.getByRole("button", { name: /apply|approve/i }).count(), 0);
  });
  async function prepareReview(axis) {
    await ready(axis);
    await page.getByLabel("Proposal to review").selectOption(`${axis}-proposal-1`);
    await expect(page.getByRole("button", { name: "Send selected proposal for human review" })).toBeDisabled();
    await page.getByRole("checkbox").check();
  }
  const posts = () => requests.filter(item => item.method === "POST").length;
  await check("explicit review handoff uses the actual handler and existing console", async () => {
    mode = "normal"; await prepareReview("governance"); const before = posts();
    await page.getByRole("button", { name: "Send selected proposal for human review" }).dblclick();
    await expect(page.getByTestId("axis-review-handoff")).toContainText("Review request recorded. Awaiting a human decision.");
    assert.equal(posts(), before + 1);
    const download = page.getByRole("link", { name: "Download review request" });
    const exported = JSON.parse(decodeURIComponent((await download.getAttribute("href")).split(",").slice(1).join(",")));
    assert.equal(exported.axis, "governance"); assert.equal(exported.stored, true);
    assert(exported.proposed_action.includes(index.specialists.find(row => row.axis === "governance").audit_sha256));
    await expect(page.getByText(exported.subject, { exact: true })).toBeVisible();
    await page.setViewportSize({ width: 320, height: 844 });
    const overflow = await page.evaluate(() => [...document.querySelectorAll("body *")].filter(element => element.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 12).map(element => ({ tag: element.tagName, class: element.className, width: element.getBoundingClientRect().width, text: element.textContent.slice(0, 100) })));
    if (overflow.length) console.log("OVERFLOW", JSON.stringify(overflow));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: path.join(output, "review-handoff-mobile.png"), fullPage: true });
  });
  await check("a stateless response is not labelled recorded", async () => {
    mode = "stateless"; await prepareReview("safety");
    await page.getByRole("button", { name: "Send selected proposal for human review" }).click();
    await expect(page.getByTestId("axis-review-handoff")).toContainText("created but not stored");
  });
  await check("unconfirmed writes remain locked across axis selection with no retry", async () => {
    mode = "write-failed"; await prepareReview("provenance"); const before = posts();
    await page.getByRole("button", { name: "Send selected proposal for human review" }).click();
    await expect(page.getByRole("alert")).toContainText("No retry was sent");
    await ready("safety"); await ready("provenance");
    await page.getByLabel("Proposal to review").selectOption("provenance-proposal-1");
    await expect(page.getByRole("button", { name: "Send selected proposal for human review" })).toBeDisabled();
    assert.equal(posts(), before + 1);
  });
  await check("a changed review response never enters the decision console", async () => {
    mode = "wrong-review"; await prepareReview("continuity");
    await page.getByRole("button", { name: "Send selected proposal for human review" }).click();
    await expect(page.getByRole("alert")).toContainText("does not match");
    await expect(page.getByTestId("axis-review-handoff")).toHaveCount(0);
  });
  await check("handoff never sends a decision or creates execution authority", async () => {
    assert.deepEqual(errors, []);
    assert(requests.filter(item => item.method === "POST").every(item => item.path === "/api/hitl/challenge"));
    assert([...values.keys()].every(key => key.startsWith("hitl:challenge:")));
  });
  assert.deepEqual(await sourceHashes(), sources, "tested source changed during browser acceptance");
  const report = { state: "PASS", scope: "Actual component + production CSS + actual GET and HITL handlers on loopback; fixture storage and captured board; not a deployed-site or genuine-human acceptance", source_sha256: sources, checks: results, axes: index.specialists.length, page_errors: errors, api_requests: requests };
  await fs.writeFile(path.join(output, "browser-results.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ state: report.state, checks: results.length, axes: report.axes, output }, null, 2));
} catch (error) {
  await fs.writeFile(path.join(output, "browser-failure.json"), JSON.stringify({ state: "FAIL", completed: results, error: String(error), errors }, null, 2));
  throw error;
} finally {
  await browser?.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  await fs.rm(temporary, { recursive: true, force: true });
}
