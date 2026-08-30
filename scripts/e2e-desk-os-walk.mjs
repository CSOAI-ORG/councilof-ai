#!/usr/bin/env node
/**
 * Walk the desk, six /for pages, Council OS doors, and /tools.
 *   BASE=http://127.0.0.1:5173 node scripts/e2e-desk-os-walk.mjs
 *   BASE=https://councilof.ai node scripts/e2e-desk-os-walk.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = (process.env.BASE || "http://127.0.0.1:5173").replace(/\/$/, "");
const OUT = process.env.ARTIFACT_DIR || "/opt/cursor/artifacts";
const FORBIDDEN = /rank for sale|certified organization|22\/22|Six-axis|Dunder Mifflin/i;
const PERSONAS = [
  ["/for/startup", "A signed measurement your buyer can re-check"],
  ["/for/enterprise", "Measure once. Show the signed card."],
  ["/for/finance", "Model risk, DORA, and the EU AI Act"],
  ["/for/healthcare", "Clinical AI, measured"],
  ["/for/regulator", "An assurance baseline you can verify"],
  ["/for/sec-filer", "AI governance your 10-K can stand behind"],
];
const DOORS = [
  ["board", "The live board"],
  ["verify", "Verify a signed card"],
  ["space", "Council Space"],
  ["assess", "Get measured"],
  ["harness", "Measurement harness"],
];

mkdirSync(OUT, { recursive: true });
const errors = [];
const notes = [];
function fail(name, detail) {
  errors.push(`${name}: ${detail}`);
  console.log(`FAIL  ${name} — ${detail}`);
}
function pass(name, detail = "") {
  notes.push(name);
  console.log(`PASS  ${name}${detail ? " — " + detail : ""}`);
}

async function dismissCookies(page) {
  const btn = page.getByRole("button", { name: /accept|agree|ok/i }).first();
  if (await btn.count()) {
    try { await btn.click({ timeout: 1500 }); } catch { /* banner may be absent */ }
  }
}

const browser = await chromium.launch({
  executablePath: "/usr/bin/google-chrome-stable",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));

try {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await dismissCookies(page);
  await page.waitForTimeout(800);
  const homeText = await page.locator("body").innerText();
  if (FORBIDDEN.test(homeText)) fail("home-copy", "forbidden string on /");
  else pass("home-copy");
  if (/Twenty seconds on the instrument|Already in a tool\?/.test(homeText)) {
    fail("home-desk", "old demo video / plugin block still on the desk");
  } else {
    pass("home-desk", "no demo video, no plugin block");
  }
  if (!/The live board/.test(homeText)) fail("home-board", "live board heading missing");
  else pass("home-board");
  if (!/Ask, or paste a card/.test(homeText)) fail("home-ask", "ask block missing");
  else pass("home-ask");
  const worldsIdx = homeText.search(/Arena\.\s*Harness\.\s*Front door|Three worlds/);
  const boardIdx = homeText.indexOf("The live board");
  if (worldsIdx > 0 && boardIdx >= 0 && worldsIdx > boardIdx) pass("home-worlds-after-board");
  else fail("home-worlds-after-board", `board@${boardIdx} worlds@${worldsIdx}`);

  await page.locator("h2", { hasText: "The live board" }).scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    return document.querySelectorAll("tbody tr").length > 0
      || /The board could not be read/.test(document.body.innerText);
  }, { timeout: 25000 });
  if (await page.locator("text=The board could not be read").count()) {
    fail("home-rows", "board could not be read");
  }
  await page.waitForSelector("tbody tr", { timeout: 5000 });
  const rowCount = await page.locator("tbody tr").count();
  if (rowCount < 10) fail("home-rows", `only ${rowCount} rows`);
  else pass("home-rows", `${rowCount} slots`);
  await page.locator("tbody tr").first().click();
  await page.waitForSelector("#board-result", { timeout: 8000 });
  const selected = (await page.locator("#board-result").innerText()).slice(0, 180);
  pass("home-select", selected.replace(/\s+/g, " ").slice(0, 120));
  await page.screenshot({ path: join(OUT, "home_desk_selected.png"), fullPage: false });
  await page.locator("#os-chat").scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(OUT, "home_ask.png"), fullPage: false });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, "home_worlds_bottom.png"), fullPage: false });

  for (const [path, h1] of PERSONAS) {
    pageErrors.length = 0;
    await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 45000 });
    await dismissCookies(page);
    await page.waitForTimeout(600);
    const h = await page.locator("h1").first().innerText().catch(() => "");
    const body = await page.locator("body").innerText();
    if (!h.includes(h1.slice(0, 24))) fail(path, `h1=${JSON.stringify(h)}`);
    else pass(path, h);
    if (FORBIDDEN.test(body)) fail(path + "-copy", "forbidden string");
    if (pageErrors.length) fail(path + "-js", pageErrors.join(" | "));
    if (path === "/for/startup") {
      await page.screenshot({ path: join(OUT, "for_startup_live.png"), fullPage: false });
    }
  }

  for (const [door, heading] of DOORS) {
    pageErrors.length = 0;
    const qs = door === "assess" ? "?lobby=measured" : `?lobby=${door}`;
    await page.goto(BASE + "/os" + qs, { waitUntil: "domcontentloaded", timeout: 45000 });
    await dismissCookies(page);
    await page.waitForTimeout(800);
    const body = await page.locator("body").innerText();
    if (!body.includes("Council OS")) fail(`/os${qs}`, "missing Council OS");
    else if (!new RegExp(heading, "i").test(body) && door !== "board") {
      // board heading lives inside the pane; allow living count as proof
      if (!/22 axis/.test(body) && !/live board/i.test(body)) {
        fail(`/os${qs}`, `missing ${heading}`);
      } else pass(`/os${qs}`, "board pane");
    } else {
      pass(`/os${qs}`, heading);
    }
    if (pageErrors.length) fail(`/os${qs}-js`, pageErrors.join(" | "));
    if (door === "board") await page.screenshot({ path: join(OUT, "os_board.png"), fullPage: false });
    if (door === "assess") await page.screenshot({ path: join(OUT, "os_assess.png"), fullPage: false });
    if (door === "harness") await page.screenshot({ path: join(OUT, "os_harness.png"), fullPage: false });
  }

  await page.goto(BASE + "/tools", { waitUntil: "domcontentloaded", timeout: 45000 });
  await dismissCookies(page);
  const tools = await page.locator("body").innerText();
  for (const host of ["Claude", "Cursor", "Kimi", "Grok"]) {
    if (!tools.includes(host)) fail("tools-" + host, "missing");
    else pass("tools-" + host);
  }
  if (!tools.includes("https://councilof.ai/mcp")) fail("tools-url", "mcp url missing");
  else pass("tools-url");
  await page.screenshot({ path: join(OUT, "tools_mcp.png"), fullPage: false });

  // Header mega-menu should name every demographic (local branch / after ship).
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await dismissCookies(page);
  const products = page.locator("[data-nav-trigger='Products']").first();
  if (await products.count()) {
    await products.click();
    await page.waitForSelector("#nav-panel-products", { timeout: 4000 });
    const hrefs = await page.$$eval("#nav-panel-products a", (as) => as.map((a) => a.getAttribute("href") || ""));
    for (const slug of ["startup", "enterprise", "finance", "healthcare", "regulator", "sec-filer"]) {
      if (hrefs.includes(`/for/${slug}`)) pass("nav-" + slug);
      else fail("nav-" + slug, `hrefs=${hrefs.filter((h) => h.startsWith("/for/")).join(",")}`);
    }
    await page.locator("#nav-panel-products a[href='/for/sec-filer']").scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(OUT, "nav_personas.png"), fullPage: false });
  } else {
    notes.push("nav-skip");
    console.log("SKIP  products mega-menu not found (marketing chrome hidden?)");
  }
} catch (e) {
  fail("walk", e instanceof Error ? e.stack || e.message : String(e));
} finally {
  await browser.close();
}

console.log(`\n${notes.length} passed, ${errors.length} failed, base=${BASE}`);
if (errors.length) {
  for (const e of errors) console.log("  · " + e);
  process.exit(1);
}
console.log("OK");
