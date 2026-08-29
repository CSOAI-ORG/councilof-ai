#!/usr/bin/env node
/**
 * Live / local smoke for councilof.ai end-user surfaces.
 *
 *   node scripts/e2e-live-council.mjs
 *   E2E_BASE=https://councilof.ai node scripts/e2e-live-council.mjs
 *
 * Checks:
 *   1. public/_redirects carries the guessed-URL aliases (so the honest 404
 *      catch-all cannot hide /legal, /gspc, /lobby, …).
 *   2. Against E2E_BASE (default https://councilof.ai): key pages 200, aliases
 *      308 to the right place, /api/gspc is JSON, homepage HTML references a
 *      CouncilLobby module, and that module does not lazy-import a second
 *      LobbyOverlay chunk (the mid-deploy 404 that white-screened the AG UI).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.E2E_BASE || "https://councilof.ai";
const SKIP_LIVE = process.env.E2E_SKIP_LIVE === "1";

const ALIASES = [
  ["/vulnerability", "/vulnerability-disclosure"],
  ["/sov-os", "/os?lobby=home"],
  ["/ag-ui", "/os?lobby=home"],
  ["/agui", "/os?lobby=home"],
  ["/chat", "/os?lobby=home"],
];
// Aliases that MUST resolve for a stranger (308 or a real 200 page — never the
// honest-404 catch-all). /gspc and /console 404'd on production 2026-08-22.
const MUST_RESOLVE = [
  "/sov-os",
  "/gspc",
  "/scoreboard",
  "/gspc-scoreboard",
  "/console",
  "/council-os",
  "/lobby",
  "/chat",
  "/ag-ui",
  "/models",
  "/tools",
  "/rankings",
  "/library",
  "/workbench",
  "/instrument",
  "/legal",
  "/for/regulator",
  "/vs/vanta",
  "/industries/insurance",
];

const PAGES = [
  "/",
  "/os",
  "/sov-os/",
  "/gspc-scoreboard",
  "/gspc-verify",
  "/gspc-arena",
  "/assess",
  "/watchdog",
  "/academy",
  "/privacy-policy",
  "/vulnerability-disclosure",
  "/disclaimers",
];

// Functions-first leftover hops (not necessarily in public/_redirects).
const LIVE_HOPS = [
  ["/pricing", "/os?lobby=assess&task=pricing-overview"],
  ["/plans", "/os?lobby=assess&task=pricing-overview"],
  ["/enterprise-plans", "/os?lobby=assess&task=pricing-overview"],
  ["/enterprise", "/os?lobby=assess&task=enterprise-start"],
  ["/get-measured", "/os?lobby=assess&task=get-measured"],
  ["/overlay", "/os?lobby=home"],
  ["/certification", "/honesty/"],
  ["/claimguard", "/honesty/"],
];

let failed = 0;
function pass(name, detail = "") {
  console.log(`PASS  ${name}${detail ? " — " + detail : ""}`);
}
function fail(name, detail = "") {
  failed += 1;
  console.log(`FAIL  ${name}${detail ? " — " + detail : ""}`);
}

const redirects = readFileSync(join(ROOT, "public/_redirects"), "utf8");
for (const [from, to] of ALIASES) {
  const ok = redirects.includes(from) && redirects.includes(to);
  (ok ? pass : fail)(`_redirects ${from} → ${to}`);
}

if (SKIP_LIVE) {
  if (failed) process.exit(1);
  console.log("\nOK (local redirects only)");
  process.exit(0);
}

const UA = { "User-Agent": "CSOAI-e2e-live-council/1.0" };

async function fetchHead(path) {
  const res = await fetch(BASE + path, { redirect: "manual", headers: UA });
  return res;
}

async function fetchText(path) {
  const res = await fetch(BASE + path, { headers: UA });
  const text = await res.text();
  return { res, text };
}

for (const path of PAGES) {
  try {
    const { res, text } = await fetchText(path);
    const title = (text.match(/<title>([^<]+)/i) || [])[1] || "";
    if (res.status >= 400 || /404 — Not found/i.test(title)) {
      fail(`${path} HTTP ${res.status}`, title);
    } else {
      pass(`${path} HTTP ${res.status}`, title.slice(0, 70));
    }
  } catch (e) {
    fail(`${path} fetch`, String(e).slice(0, 120));
  }
}

for (const [from, to] of ALIASES) {
  try {
    const res = await fetchHead(from);
    const loc = res.headers.get("location") || "";
    const destOk = loc.includes(to.replace(/^\//, "")) || loc.endsWith(to) || loc.includes(to);
    if ((res.status === 301 || res.status === 302 || res.status === 308) && destOk) {
      pass(`${from} ${res.status} → ${loc}`);
    } else {
      fail(`${from} expected 308 ${to}`, `${res.status} ${loc}`);
    }
  } catch (e) {
    fail(`${from} redirect`, String(e).slice(0, 120));
  }
}

for (const [from, to] of LIVE_HOPS) {
  try {
    const res = await fetchHead(from);
    const loc = res.headers.get("location") || "";
    const destOk = loc.includes(to) || loc.endsWith(to);
    if ((res.status === 301 || res.status === 302 || res.status === 308) && destOk) {
      pass(`live hop ${from} ${res.status} → ${loc}`);
    } else {
      fail(`live hop ${from} expected 308 ${to}`, `${res.status} ${loc}`);
    }
  } catch (e) {
    fail(`live hop ${from}`, String(e).slice(0, 120));
  }
}

for (const path of MUST_RESOLVE) {
  try {
    const { res, text } = await fetchText(path);
    const title = (text.match(/<title>([^<]+)/i) || [])[1] || "";
    if (res.status >= 400 || /404 — Not found/i.test(title)) {
      fail(`${path} must resolve for a stranger`, `HTTP ${res.status} ${title}`);
    } else if (path.includes("gspc") && /13 axes\s*[x×]\s*19/i.test(text)) {
      fail(`${path} leftover static table`, "hardcoded 13×19");
    } else {
      pass(`${path} resolves`, `HTTP ${res.status} ${text.length} B`);
    }
  } catch (e) {
    fail(`${path} resolve`, String(e).slice(0, 120));
  }
}

try {
  const { res, text } = await fetchText("/api/gspc");
  const json = JSON.parse(text);
  if (res.ok && json?.totals) pass("/api/gspc JSON", json.totals.public_count || "totals present");
  else fail("/api/gspc JSON", `status ${res.status}`);
} catch (e) {
  fail("/api/gspc JSON", String(e).slice(0, 120));
}

try {
  const { text: home } = await fetchText("/");
  if (home.length < 20000) {
    fail("homepage is prerendered (not a thin Vite shell)", `${home.length} bytes`);
  } else {
    pass("homepage is prerendered", `${home.length} bytes`);
  }
  if (!/data-testid="home-verify"|Check an AI claim in your browser/i.test(home)) {
    fail("homepage is verify (home-verify)");
  } else {
    pass("homepage is verify", "home-verify");
  }
} catch (e) {
  fail("lobby chunk check", String(e).slice(0, 120));
}

try {
  const { res, text } = await fetchText("/sitemap.xml");
  if (!res.ok) fail("sitemap.xml", `HTTP ${res.status}`);
  else {
    const hasOs = text.includes("<loc>https://councilof.ai/os</loc>") || text.includes("<loc>https://councilof.ai/os/</loc>");
    const hasHonesty = text.includes("councilof.ai/honesty");
    const hasCloud = /<loc>https:\/\/councilof\.ai\/cloud\/?<\/loc>/.test(text);
    (hasOs ? pass : fail)("sitemap lists /os");
    (hasHonesty ? pass : fail)("sitemap lists /honesty");
    (hasCloud ? fail : pass)("sitemap does not list leftover /cloud 404", hasCloud ? "flagship 404" : "absent");
  }
} catch (e) {
  fail("sitemap.xml", String(e).slice(0, 120));
}

try {
  const { text: osHtml } = await fetchText("/os");
  if (!/data-testid="os-directory"|\/gspc-verify|\/assess/i.test(osHtml)) {
    fail("/os is a directory of real pages");
  } else {
    pass("/os is a directory", "os-directory");
  }
} catch (e) {
  fail("/os directory", String(e).slice(0, 120));
}

if (failed) {
  console.log(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log("\nOK");
