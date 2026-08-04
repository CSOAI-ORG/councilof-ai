#!/usr/bin/env node
/**
 * crawler-view-gate.mjs — assert that AI crawlers see real, DISTINCT content per route.
 *
 * WHY THIS EXISTS
 * ---------------
 * On 2026-08-04 commit 91a56c7 added waitForHydration() to Gate-1 so the content checks
 * read the hydrated body instead of the shell. That is the correct fix for testing what a
 * USER sees, and its diagnosis was exactly right: csoai.org is a client-rendered SPA whose
 * route content only paints after the JS bundle hydrates.
 *
 * But it left nothing testing what a CRAWLER sees. GPTBot, ClaudeBot and PerplexityBot do
 * not run JavaScript. Measured the same day, with no JS:
 *
 *     /                             200   11273 bytes   4777 chars of text
 *     /pricing.html                 200   11273 bytes   4777 chars   <- same document
 *     /certification.html           200   11273 bytes   4777 chars   <- same document
 *     /this-page-does-not-exist...  200   11273 bytes   4777 chars   <- same document, no 404
 *
 * The only byte that differs between routes is the Cloudflare challenge nonce. sitemap.xml
 * advertises 350 URLs and llms.txt advertises named routes (/start, /sov-space, /graph,
 * /plans, /hive, /system-card, /protect); to a crawler every one of them is the SAME PAGE.
 *
 * For a site whose stated purpose is AEO/GEO — being answerable BY AI engines — that is the
 * whole product surface reduced to one document. A hydration-aware gate cannot see it,
 * because hydrating is precisely the thing the crawler will not do.
 *
 * WHAT THIS GATE ASSERTS (no JS, plain fetch, crawler UA)
 *   1. DISTINCTNESS  — advertised routes must not all serve one identical document.
 *   2. SUBSTANCE     — each route must carry enough non-boilerplate text to answer with.
 *   3. HONEST 404    — a URL that does not exist must NOT return 200.
 *
 * DESIGN NOTE, learned the hard way elsewhere in this estate: a gate that cannot fail is
 * indistinguishable from no gate. `--selftest` seeds each violation class and asserts the
 * gate fires on it. Run it in CI alongside the real check.
 *
 *   node scripts/crawler-view-gate.mjs [--host https://csoai.org] [--selftest]
 */

const HOST = (() => {
  const i = process.argv.indexOf("--host");
  return (i > -1 ? process.argv[i + 1] : process.env.GATE_HOST || "https://csoai.org").replace(/\/$/, "");
})();

// A real crawler UA. The point is to be seen as one, not to evade anything.
const UA = "Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)";

// Routes the site itself advertises via llms.txt / sitemap / nav.
const ROUTES = ["/", "/pricing.html", "/certification.html", "/about.html", "/verify.html",
                "/article-50-kit.html", "/security.html", "/charter.html"];

const ABSENT_URL = "/this-route-should-not-exist-crawler-gate-probe";
const MIN_TEXT_CHARS = 900;   // below this a page cannot answer a question about itself

/** Strip markup, scripts, styles and the Cloudflare challenge blob; return visible text. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Remove per-request noise so two documents can be compared for real equality. */
function canonical(html) {
  return html
    .replace(/__CF\$cv\$params=\{[^}]*\}/g, "")   // Cloudflare challenge nonce
    .replace(/nonce="[^"]*"/g, "")
    .replace(/[0-9a-f]{16,}/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function get(path) {
  const res = await fetch(HOST + path, { headers: { "User-Agent": UA }, redirect: "follow" });
  const html = await res.text();
  return { status: res.status, html, text: visibleText(html), key: canonical(html) };
}

function evaluate(pages, absent) {
  const failures = [];

  // 1. DISTINCTNESS
  const groups = new Map();
  for (const [route, p] of pages) {
    if (!groups.has(p.key)) groups.set(p.key, []);
    groups.get(p.key).push(route);
  }
  for (const dupes of groups.values()) {
    if (dupes.length > 1) {
      failures.push(
        `IDENTICAL DOCUMENT served to a non-JS crawler for ${dupes.length} routes: ${dupes.join(", ")}. ` +
        `An AI answer engine sees one page here, not ${dupes.length}. Prerender or statically ` +
        `generate these routes so the HTML differs before hydration.`);
    }
  }

  // 2. SUBSTANCE
  for (const [route, p] of pages) {
    if (p.status !== 200) { failures.push(`${route}: HTTP ${p.status} to a crawler UA`); continue; }
    if (p.text.length < MIN_TEXT_CHARS) {
      failures.push(
        `${route}: only ${p.text.length} chars of crawler-visible text (need >= ${MIN_TEXT_CHARS}). ` +
        `The route shell loads but its content paints only after hydration, which no crawler does.`);
    }
  }

  // 3. HONEST 404
  if (absent.status === 200) {
    failures.push(
      `${ABSENT_URL} returned HTTP 200. A catch-all that answers 200 for every path tells ` +
      `crawlers that every URL in the 350-entry sitemap is a real page. Serve a real 404.`);
  }
  return failures;
}

async function selftest() {
  // Prove each rule fires. A rule that never fires is not a rule.
  const shell = "<html><head><title>x</title></head><body>short</body></html>";
  const rich = "<html><body>" + "governance measurement evidence ".repeat(60) + "</body></html>";
  const mk = (h, status = 200) => ({ status, html: h, text: visibleText(h), key: canonical(h) });

  const cases = [
    ["distinctness", [["/a", mk(rich)], ["/b", mk(rich)]], mk("", 404), /IDENTICAL DOCUMENT/],
    ["substance",    [["/a", mk(shell)]],                  mk("", 404), /crawler-visible text/],
    ["honest 404",   [["/a", mk(rich)]],                   mk(rich, 200), /returned HTTP 200/],
  ];
  let ok = true;
  console.log("SELFTEST — each rule must fire on a seeded violation:");
  for (const [name, pages, absent, want] of cases) {
    const fs = evaluate(pages, absent);
    const fired = fs.some((f) => want.test(f));
    ok &&= fired;
    console.log(`  ${fired ? "OK  " : "FAIL"} ${name}`);
  }
  // and must NOT fire on a clean sample
  const clean = evaluate([["/a", mk(rich)], ["/b", mk(rich + "<p>distinct</p>")]], mk("", 404));
  const quiet = clean.length === 0;
  ok &&= quiet;
  console.log(`  ${quiet ? "OK  " : "FAIL"} clean sample stays silent`);
  console.log(`SELFTEST: ${ok ? "PASS" : "FAIL"}`);
  return ok ? 0 : 1;
}

async function main() {
  if (process.argv.includes("--selftest")) process.exit(await selftest());

  console.log(`CRAWLER-VIEW GATE — ${HOST} as GPTBot, no JavaScript\n`);
  const pages = [];
  for (const r of ROUTES) {
    try {
      const p = await get(r);
      pages.push([r, p]);
      console.log(`  ${String(p.status).padEnd(4)} ${String(p.text.length).padStart(6)} chars  ${r}`);
    } catch (e) {
      console.log(`  ERR  ${r}: ${e.message}`);
      pages.push([r, { status: 0, html: "", text: "", key: `err:${r}` }]);
    }
  }
  const absent = await get(ABSENT_URL).catch(() => ({ status: 0, html: "", text: "", key: "" }));
  console.log(`  ${String(absent.status).padEnd(4)} ${String(absent.text.length).padStart(6)} chars  ${ABSENT_URL} (should be 404)\n`);

  const failures = evaluate(pages, absent);
  if (failures.length) {
    console.log("CRAWLER-VIEW GATE: FAIL");
    for (const f of failures) console.log(" - " + f);
    console.log(
      `\nThis gate exists because Gate-1 waits for hydration (91a56c7) — correct for testing ` +
      `users, blind to crawlers. Both views need a check.`);
    process.exit(1);
  }
  console.log("CRAWLER-VIEW GATE: PASS — routes are distinct, substantive, and 404 is honest");
}

main();
