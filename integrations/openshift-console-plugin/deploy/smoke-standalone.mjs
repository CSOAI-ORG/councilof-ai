// Smoke test of a served standalone page (local nginx or the live OpenShift Route), against LIVE
// councilof.ai: every panel reaches a state, carries the attribution, no CSP violation, and the
// page talks to no host but itself and councilof.ai.
//   node smoke-standalone.mjs <url> [screenshot.png] [width]
import { chromium } from "@playwright/test";

const [url, shot = "standalone.png", width = "1280"] = process.argv.slice(2);
if (!url) throw new Error("usage: node smoke-standalone.mjs <url> [screenshot.png] [width]");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
const hosts = new Set();
page.on("request", (r) => hosts.add(new URL(r.url()).host));
const csp = [];
page.on("console", (m) => /Content Security Policy/i.test(m.text()) && csp.push(m.text()));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForFunction(() => [...document.querySelectorAll("gspc-evidence-panel")].every((e) => e.shadowRoot?.querySelector("article")), null, { timeout: 60000 });
const panels = await page.evaluate(() =>
  [...document.querySelectorAll("gspc-evidence-panel")].map((e) => ({
    subject: e.getAttribute("subject"),
    state: e.shadowRoot.querySelector("article").dataset.state,
    signature: e.shadowRoot.querySelector("[data-signature]")?.textContent ?? null,
    attribution: e.shadowRoot.querySelector('[data-region="attribution"]').textContent.includes("Evidence by GSPC · Council of AI"),
  })),
);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
await page.screenshot({ path: shot, fullPage: true });
await browser.close();
const own = new URL(url).host;
const foreign = [...hosts].filter((h) => h !== own && h !== "councilof.ai");
const result = { url, panels, hosts: [...hosts], foreign, csp_violations: csp.length, horizontal_overflow_px: Math.max(0, overflow), screenshot: shot };
console.log(JSON.stringify(result, null, 1));
process.exit(panels.every((p) => p.attribution && p.state) && !foreign.length && !csp.length && overflow <= 0 ? 0 : 1);
