// polish-audit.mjs — WCAG 2 A/AA accessibility audit across the funnel, live.
// Injects axe-core from CDN, runs on each key route, reports serious+ violations.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

// RETARGETED 2026-08-26. The default pointed at a host this repo does not deploy, so a
// local run measured somebody else's site (or, for the Vercel default, a host that has
// been 402-dead since July). This repo deploys the Cloudflare Pages project `councilof-ai`
// at https://councilof.ai, and nothing else. A test aimed elsewhere is not a weaker test —
// it is a test of a different system, reporting on this one.
const BASE = process.env.AUDIT_BASE || "https://councilof.ai";
const AXE = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js";
const ROUTES = ["/", "/intel", "/brief?id=jpmorgan", "/crosswalk?fw=eu-ai-act,dora", "/pricing", "/assess", "/os", "/tool-commons"];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
let total = 0; const summary = [];
for (const r of ROUTES) {
  const p = await ctx.newPage();
  try {
    await p.goto(BASE + r, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(2500);
    await p.addScriptTag({ url: AXE });
    const res = await p.evaluate(async () => await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] }));
    const v = (res.violations || []).filter((x) => x.impact === "serious" || x.impact === "critical");
    const n = v.reduce((s, x) => s + x.nodes.length, 0); total += n;
    summary.push({ r, n, top: v.slice(0, 4).map((x) => `${x.impact}:${x.id}(${x.nodes.length})`) });
    console.log(`${n === 0 ? "OK  " : "FLAG"} ${r} — ${n} serious/critical` + (v.length ? "\n     " + v.slice(0, 5).map((x) => `${x.impact} · ${x.id} · ${x.nodes.length}× · ${x.help}`).join("\n     ") : ""));
  } catch (e) { console.log(`ERR  ${r} — ${e.message.slice(0, 60)}`); }
  await p.close();
}
console.log(`\n=== ${total} serious/critical a11y issues across ${ROUTES.length} routes ===`);
await b.close();
