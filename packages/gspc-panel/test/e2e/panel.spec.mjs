// Render tests in Chromium against the PUBLISHED bundle, under a strict CSP, with every
// councilof.ai request answered from bytes recorded live on 2026-09-30 (../replay.js).
import { test, expect } from "@playwright/test";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { replayFetch, fx, preflight } from "../replay.js";
import { onRequestPost as watchHandler, onRequestOptions as watchOptions } from "../../../../functions/api/claims/watch-request.ts";

const here = dirname(fileURLToPath(import.meta.url));
const SHOTS = process.env.SHOTS_DIR || resolve(here, "../../.shots");
mkdirSync(SHOTS, { recursive: true });
const AXE = process.env.AXE_PATH;
const CARD = "94b8831311c24df5e7d93e1f1dc989d24639bbe64abc4034a51d78a0306508e1";
const THREE = ["https://councilof.ai/mcp", "https://tandem.ac/mcp", CARD];

async function wire(page) {
  const seen = [];
  const { fetchFn } = replayFetch({ install: false });
  await page.route("**/*", async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    seen.push(u.origin);
    if (u.origin === "http://127.0.0.1:4817") return route.continue();
    if (u.origin !== "https://councilof.ai") return route.abort();
    if (req.method() === "OPTIONS") {
      // Recorded live preflights (2026-09-30): /api/agui/run 204, /mcp/free 403 (its Origin guard).
      // /api/claims/watch-request is new in this lane: answered by its own handler.
      if (u.pathname === "/api/claims/watch-request") {
        const r = await watchOptions({ request: new Request(req.url(), { method: "OPTIONS" }), env: {} });
        return route.fulfill({ status: r.status, headers: Object.fromEntries(r.headers) });
      }
      const p = preflight(u.pathname.replace(/\//g, "_"));
      return route.fulfill({ status: p.status, headers: p.headers });
    }
    if (u.pathname === "/api/claims/watch-request") {
      // Our own new endpoint, not yet deployed: answered by its real handler (no KV bound here).
      const res = await watchHandler({ request: new Request(req.url(), { method: "POST", body: req.postData() }), env: {} });
      seen.push("watch-request:" + req.postData());
      return route.fulfill({ status: res.status, headers: { "content-type": "application/json", "access-control-allow-origin": "*" }, body: await res.text() });
    }
    const res = await fetchFn(req.url(), { method: req.method(), body: req.postData() });
    return route.fulfill({ status: res.status, headers: { "content-type": res.headers.get("content-type"), "access-control-allow-origin": "*" }, body: await res.text() });
  });
  return seen;
}

const qs = (subjects, extra = "") => "/?" + subjects.map((s) => "subject=" + encodeURIComponent(s)).join("&") + extra;

async function panels(page, n) {
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll("gspc-evidence-panel")].filter((e) => e.shadowRoot?.querySelector("article")).length)).toBe(n);
}

const shadowText = (page, i, sel) =>
  page.evaluate(([i, sel]) => document.querySelectorAll("gspc-evidence-panel")[i].shadowRoot.querySelector(sel)?.textContent ?? null, [i, sel]);

test("three real subjects render with state, signature and attribution; only councilof.ai is contacted; no CSP violation", async ({ page }) => {
  const seen = await wire(page);
  await page.goto(qs(THREE));
  await panels(page, 3);
  const states = await page.evaluate(() => [...document.querySelectorAll("gspc-evidence-panel")].map((e) => e.shadowRoot.querySelector("article").dataset.state));
  expect(states).toEqual(["MEASURED", "MEASURED", "TIE"]);
  for (let i = 0; i < 3; i++) {
    expect(await shadowText(page, i, '[data-region="attribution"]')).toContain("Evidence by GSPC · Council of AI");
    expect(await page.evaluate((i) => document.querySelectorAll("gspc-evidence-panel")[i].shadowRoot.querySelector("[data-verify]").href, i)).toMatch(/^https:\/\/councilof\.ai\//);
    expect(await shadowText(page, i, "[data-signature]")).toBe("VALID");
  }
  expect(new Set(seen)).toEqual(new Set(["http://127.0.0.1:4817", "https://councilof.ai"]));
  expect(await page.evaluate(() => window.__csp)).toEqual([]);
  await page.setViewportSize({ width: 1280, height: 2400 });
  await page.screenshot({ path: resolve(SHOTS, "three-subjects-desktop.png"), fullPage: true });
});

test("UNMEASURED renders no number and keeps the attribution (fail-first twin of doctrine.test.js)", async ({ page }) => {
  await wire(page);
  await page.goto(qs(["https://councilof.ai/mcp/free", "no-such-model:1b"]));
  await panels(page, 2);
  for (let i = 0; i < 2; i++) {
    expect(await shadowText(page, i, "article[data-state]")).toBeTruthy();
    expect(await page.evaluate((i) => document.querySelectorAll("gspc-evidence-panel")[i].shadowRoot.querySelector("article").dataset.state, i)).toBe("UNMEASURED");
    expect(await shadowText(page, i, '[data-region="figures"]')).toBeNull();
    expect(await shadowText(page, i, '[data-region="state"]')).not.toMatch(/\d/);
    expect(await shadowText(page, i, '[data-region="attribution"]')).toContain("Evidence by GSPC · Council of AI");
  }
  await page.screenshot({ path: resolve(SHOTS, "unmeasured.png"), fullPage: true });
});

test("375 px: no horizontal overflow, host theme applies to the frame only", async ({ page }) => {
  await wire(page);
  await page.setViewportSize({ width: 375, height: 1600 });
  await page.goto(qs(THREE, "&theme=host"));
  await panels(page, 3);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over).toBeLessThanOrEqual(0);
  const chip = await page.evaluate(() => getComputedStyle(document.querySelector("gspc-evidence-panel").shadowRoot.querySelector(".chip[data-state]")).backgroundColor);
  expect(chip).toBe("rgb(218, 251, 225)"); // the state chip keeps its colour whatever the host sets
  await page.screenshot({ path: resolve(SHOTS, "three-subjects-375.png"), fullPage: true });
});

test("AG-UI transport renders from the /api/agui/run stream", async ({ page }) => {
  const seen = [];
  await wire(page);
  page.on("request", (r) => seen.push(`${r.method()} ${new URL(r.url()).pathname}`));
  await page.goto(qs(["https://tandem.ac/mcp"], "&transport=agui"));
  await panels(page, 1);
  expect(seen).toContain("POST /api/agui/run");
  expect(await shadowText(page, 0, '[data-region="dvo"]')).toContain("CONSISTENT");
});

test("A2UI in: councilof.ai's own verify surface, and a foreign surface refused", async ({ page }) => {
  await wire(page);
  await page.goto("/?a2ui=1");
  await page.waitForFunction(() => customElements.get("gspc-evidence-panel"));
  await page.evaluate((jsonl) => document.getElementById("a2ui").renderA2ui(jsonl), fx("a2ui-verify.jsonl"));
  expect(await shadowText(page, 0, "[data-signature]")).toBe("VALID");
  const a2uiOut = await page.evaluate(() => document.getElementById("a2ui").a2ui);
  expect(a2uiOut[0].createSurface.catalogId).toBe("https://a2ui.org/specification/v0_9_1/catalogs/basic/catalog.json");
  await page.evaluate(() => document.getElementById("a2ui").renderA2ui([{ version: "v0.9.1", createSurface: { surfaceId: "ad", catalogId: "x" } }, { version: "v0.9.1", updateDataModel: { surfaceId: "ad", path: "/", value: { headline: "Rated #1" } } }]));
  expect(await page.evaluate(() => document.getElementById("a2ui").shadowRoot.querySelector("article").dataset.state)).toBe("UNCHECKABLE");
});

test("accessibility: axe-core finds no serious or critical WCAG 2.x A/AA violation", async ({ page }) => {
  test.skip(!AXE || !existsSync(AXE), "AXE_PATH not set");
  await wire(page);
  await page.goto(qs([...THREE, "https://councilof.ai/mcp/free"]));
  await panels(page, 4);
  await page.evaluate(readFileSync(AXE, "utf8"));
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
    return { violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length })), passes: r.passes.length };
  });
  console.log("axe", JSON.stringify(res));
  expect(res.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
});

test("copy citation button is keyboard reachable and names itself", async ({ page }) => {
  await wire(page);
  await page.goto(qs(["https://councilof.ai/mcp"]));
  await panels(page, 1);
  const name = await page.evaluate(() => document.querySelector("gspc-evidence-panel").shadowRoot.querySelector('[data-action="copy-citation"]').textContent);
  expect(name).toBe("Copy citation");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => document.querySelector("gspc-evidence-panel").shadowRoot.activeElement?.tagName ?? null);
  expect(focused).not.toBeNull();
});

const P = (page) => page.locator("gspc-evidence-panel").first();

test("white-label: Acme Assistant names the Ask box; the attribution and verify link stay", async ({ page }) => {
  await wire(page);
  const cfg = { assistantName: "Acme Assistant", theme: { "--gspc-accent": "#6d28d9", "--gspc-radius": "2px" }, connectors: { projectId: "proj-42", mcpServers: ["https://tandem.ac/mcp", "https://councilof.ai/mcp"] } };
  await page.goto(qs(["https://councilof.ai/mcp"], "&config=" + encodeURIComponent(JSON.stringify(cfg))));
  await panels(page, 1);
  await expect(P(page).locator('[data-region="ask"] h3')).toHaveText("Ask Acme Assistant");
  await expect(P(page).locator('[data-region="attribution"]')).toContainText("Evidence by GSPC · Council of AI");
  await expect(P(page).locator('[data-region="connectors"]')).toContainText("read-only");
  await page.screenshot({ path: resolve(SHOTS, "white-label-acme.png"), fullPage: true });
});

test("a config that tries to hide the attribution is rejected and the attribution still renders", async ({ page }) => {
  await wire(page);
  await page.goto(qs(["https://councilof.ai/mcp"], "&configAttr=" + encodeURIComponent(JSON.stringify({ assistantName: "Acme Assistant", hideAttribution: true }))));
  await panels(page, 1);
  await expect(P(page).locator(".config-error")).toContainText("Host configuration rejected");
  await expect(P(page).locator('[data-region="attribution"]')).toContainText("Evidence by GSPC · Council of AI");
  await expect(P(page).locator('[data-region="ask"] h3')).toHaveText("Ask GSPC");
});

test("Ask: explain this evidence — cited answer, attribution on the answer, the panel highlights what it cites", async ({ page }) => {
  await wire(page);
  await page.goto(qs(["https://tandem.ac/mcp"]));
  await panels(page, 1);
  await P(page).locator("#ask-q").fill("explain this evidence");
  await P(page).locator('[data-action="ask-submit"]').click();
  await expect(P(page).locator('[data-answer="grounded"]')).toBeVisible();
  await expect(P(page).locator('[data-answer="grounded"] [data-attribution-line]')).toContainText("Evidence by GSPC · Council of AI");
  await expect(P(page).locator('[data-region="dvo"].is-highlighted')).toBeVisible({ timeout: 5000 });
  await expect(P(page).locator('[data-region="activity"]')).toContainText("highlight_evidence dvo · done · by panel");
  await P(page).locator('[data-action="undo"]').click();
  await expect(P(page).locator('[data-region="dvo"].is-highlighted')).toHaveCount(0);
  await expect(P(page).locator('[data-region="activity"]')).toContainText("undo");
  await page.screenshot({ path: resolve(SHOTS, "ask-explain.png"), fullPage: true });
});

test("Ask: watch it monthly — the form is filled, it pauses at Confirm, nothing is sent until the click", async ({ page }) => {
  const seen = await wire(page);
  await page.goto(qs(["https://tandem.ac/mcp"]));
  await panels(page, 1);
  await P(page).locator("#ask-q").fill("watch it monthly");
  await P(page).locator('[data-action="ask-submit"]').click();
  await expect(P(page).locator('[data-action="confirm-watch"]')).toBeVisible({ timeout: 5000 });
  await expect(P(page).locator("#watch-s")).toHaveValue("https://tandem.ac/mcp");
  await expect(P(page).locator('[data-region="activity"]')).toContainText("waiting for confirm");
  expect(seen.filter((s) => s.startsWith("watch-request:"))).toEqual([]);
  await page.screenshot({ path: resolve(SHOTS, "ask-watch-confirm.png"), fullPage: true });
  await P(page).locator('[data-action="confirm-watch"]').click();
  await expect(P(page).locator('[data-region="ask"] [role="status"]')).toContainText("NOT_RECORDED");
  const sent = seen.filter((s) => s.startsWith("watch-request:")).map((s) => JSON.parse(s.slice(14)));
  expect(sent).toEqual([{ schema: "csoai.watch-request/0.1", subject: "https://tandem.ac/mcp", cadence: "monthly", confirmed: true, requested_via: "gspc-panel" }]);
  await expect(P(page).locator('[data-region="activity"]')).toContainText("confirm_watch_request");
});

test("Ask: connect GSPC to my project — exact steps, no network call", async ({ page }) => {
  await wire(page);
  const posts = [];
  page.on("request", (r) => r.method() === "POST" && posts.push(new URL(r.url()).pathname));
  await page.goto(qs(["https://councilof.ai/mcp"]));
  await panels(page, 1);
  const before = posts.length;
  await P(page).locator("#ask-q").fill("connect GSPC to my project");
  await P(page).locator('[data-action="ask-submit"]').click();
  await expect(P(page).locator(".steps")).toContainText("https://councilof.ai/mcp/free");
  await expect(P(page).locator(".steps")).toContainText("helm upgrade -i gspc-evidence");
  expect(posts.length).toBe(before);
});

test("the panel never POSTs the MCP door from a browser (its Origin guard answers a cross-origin preflight 403)", async ({ page }) => {
  await wire(page);
  const posts = [];
  page.on("request", (r) => r.method() !== "GET" && posts.push(`${r.method()} ${new URL(r.url()).pathname}`));
  await page.goto(qs(["https://councilof.ai/mcp", "https://tandem.ac/mcp", "94b8831311c24df5e7d93e1f1dc989d24639bbe64abc4034a51d78a0306508e1"]));
  await panels(page, 3);
  expect(posts.filter((p) => p.includes("/mcp/free"))).toEqual([]);
  const sig = await page.evaluate(() => [...document.querySelectorAll("gspc-evidence-panel")].map((e) => e.shadowRoot.querySelector("[data-signature]").textContent + " " + e.shadowRoot.querySelector('[data-region="signature"]').textContent.includes("in this browser")));
  expect(sig).toEqual(["VALID true", "VALID true", "VALID true"]);
});
