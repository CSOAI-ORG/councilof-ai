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
 *     /                             200   11273 bytes   60 chars of visible text
 *     /pricing.html                 200   11273 bytes   60 chars   <- same document
 *     /certification.html           200   11273 bytes   60 chars   <- same document
 *     /this-page-does-not-exist...  200   11273 bytes   60 chars   <- same document, no 404
 *
 * (An earlier pass of mine reported 4777 chars for the homepage and concluded it rendered
 *  server-side. That was wrong: the strip did not remove <script> bodies, so it counted
 *  bundle source as prose. With scripts stripped it is 60 chars — the shell, on every route.)
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
 *   3. CANONICAL     — the SERVED html must self-canonical; a JS-set canonical is not one.
 *   4. HONEST 404    — a URL that does not exist must NOT return 200.
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

// Living documents a crawler should read. Leftover /pricing and /certification
// are 308 hops (Assess / honesty), not pages — do not demand they self-canonical.
const ROUTES = ["/", "/os", "/honesty", "/crosswalks", "/compare",
                "/article-50", "/about", "/eu-ai-act"];

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
  // Loop-safe fetch (2026-08-22): `redirect:"follow"` on a bare↔slash redirect loop
  // throws TypeError (max-redirect) which the post-upload assert turns into a generic
  // build failure. Use "manual" and classify the 3xx chain ourselves so a loop or an
  // asymmetric 308 is reported as a CLEAN status failure, never a crash.
  const res = await fetch(HOST + path, { headers: { "User-Agent": UA }, redirect: "manual" });
  // Note (2026-08-22 JEEVES audit): a bare→slash redirect (/pricing → /pricing/) is the
  // NORMAL trailing-slash canonicalization (Pages serves dist/<route>/index.html at the
  // slashed path). It is NOT a loop: a loop is when the redirect target redirects BACK.
  // The old check flagged path + "/" as a loop, which false-failed every PR whenever the
  // live site served the SPA catch-all. Only a self-bounce is a loop.
  // A 3xx that points back at the ORIGINAL path exactly (not the slash-form) is a loop.
  if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
    const loc = res.headers.get("location");
    if (loc === path) {
      return { status: res.status, html: "", text: "", key: "", loop: true, location: loc };
    }
  }
  // Still following one redirect is fine (thin link), but bound it: re-request the
  // resolved target once so the final document is what we measure, not a 30x body.
  let html = "";
  if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
    const target = new URL(res.headers.get("location"), HOST).toString();
    const final = await fetch(target, { headers: { "User-Agent": UA }, redirect: "error" });
    html = await final.text();
    return { status: final.status, html, text: visibleText(html), key: canonical(html) };
  }
  html = await res.text();
  return { status: res.status, html, text: visibleText(html), key: canonical(html), loop: false };
}

function evaluate(pages, absent, sec = null, scitt = null) {
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
    if (p.loop) { failures.push(`${route}: REDIRECT LOOP (HTTP ${p.status} -> ${p.location ?? "self"}) — bare↔slash fight, must be a clean 200 or a single canonical redirect`); continue; }
    if (p.status !== 200) { failures.push(`${route}: HTTP ${p.status} to a crawler UA`); continue; }
    if (p.text.length < MIN_TEXT_CHARS) {
      failures.push(
        `${route}: only ${p.text.length} chars of crawler-visible text (need >= ${MIN_TEXT_CHARS}). ` +
        `The route shell loads but its content paints only after hydration, which no crawler does.`);
    }
  }

  // 3. CRAWLER-VISIBLE CANONICAL — client/index.html carries a per-route self-canonical
  // script (line ~186), but it is JavaScript: a crawler never runs it, so every route keeps
  // canonical="https://csoai.org". councilof.ai does the same and thereby tells search
  // engines it is not the original of its own pages. A canonical that only resolves after
  // hydration is not a canonical.
  for (const [route, p] of pages) {
    if (route === "/") continue;
    const m = /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i.exec(p.html);
    if (m && !m[1].replace(/\/$/, "").endsWith(route.replace(/\/$/, ""))) {
      failures.push(
        `${route}: canonical points at ${m[1]} in the SERVED html. The per-route canonical is ` +
        `set by JavaScript, which crawlers do not run — so this route declares itself a ` +
        `duplicate of the root. Emit the correct canonical at build time.`);
    }
  }

  // 4. security.txt VALIDITY — RFC 9116 §2.5.5 requires Expires < 1 year from publication,
  // and RFC 3339 requires an uppercase 'Z'. Ours sat at 16.9 months with a lowercase 'z'
  // until 2026-08-04. An expired or malformed security.txt is worse than none: it advertises
  // a disclosure channel that a strict parser will reject, on a domain selling conformance.
  // Checked here because this gate already runs daily against PRODUCTION — fixing the source
  // file does not prove the deployed one changed.
  if (sec !== null) {
    if (sec.status !== 200) {
      failures.push(`/.well-known/security.txt: HTTP ${sec.status}`);
    } else {
      const m = /^Expires:\s*(\S+)/im.exec(sec.html);
      if (!m) {
        failures.push("/.well-known/security.txt: no Expires field (RFC 9116 requires one)");
      } else {
        const raw = m[1];
        const months = (Date.parse(raw.replace(/z$/, "Z")) - Date.now()) / 2.628e9;
        if (!(months > 0)) {
          failures.push(`security.txt Expires ${raw} is unparseable or in the past`);
        } else if (months > 12) {
          failures.push(
            `security.txt Expires ${raw} is ${months.toFixed(1)} months out — RFC 9116 §2.5.5 ` +
            `requires less than 12.`);
        }
        if (/z$/.test(raw)) {
          failures.push(
            `security.txt Expires ends in lowercase 'z'; RFC 3339 specifies uppercase 'Z' — ` +
            `strict parsers may reject the field.`);
        }
      }
    }
  }

  // 5. HONEST 404
  if (absent.status === 200) {
    failures.push(
      `${ABSENT_URL} returned HTTP 200. A catch-all that answers 200 for every path tells ` +
      `crawlers that every URL in the 350-entry sitemap is a real page. Serve a real 404.`);
  }

  // 6. SCITT PROFILE SURFACE — /.well-known/scitt.json must serve JSON (the
  // RFC 9943 statement mapping is itself a machine contract; a soft-404 or
  // stale document silently breaks agent discovery of the signed surfaces).
  if (scitt !== null) {
    if (scitt.status !== 200) {
      failures.push(`/.well-known/scitt.json: HTTP ${scitt.status}`);
    } else {
      try {
        const j = JSON.parse(scitt.html);
        if (!Array.isArray(j.statements) || !Array.isArray(j.trust_anchor?.signing_keys)) {
          failures.push("/.well-known/scitt.json: missing statements[] / trust_anchor.signing_keys[]");
        }
      } catch {
        failures.push("/.well-known/scitt.json: not valid JSON");
      }
    }
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
    ["security.txt expiry",
                     [["/a", mk(rich + '<link rel="canonical" href="https://x.test/a"/>')]],
                     mk("", 404), /requires less than 12/,
                     {status: 200, html: "Contact: mailto:x@y\nExpires: 2030-01-01T00:00:00Z\n"}],
    ["canonical",    [["/pricing", mk(rich + '<link rel="canonical" href="https://csoai.org"/>')]],
                     mk("", 404), /canonical points at/],
    ["scitt surface", [["/a", mk(rich)]], mk("", 404), /scitt.json/,
                     null, {status: 200, html: "not json"}],
  ];
  let ok = true;
  console.log("SELFTEST — each rule must fire on a seeded violation:");
  for (const [name, pages, absent, want, sec, scitt] of cases) {
    const fs = evaluate(pages, absent, sec ?? null, scitt ?? null);
    const fired = fs.some((f) => want.test(f));
    ok &&= fired;
    console.log(`  ${fired ? "OK  " : "FAIL"} ${name}`);
  }
  // and must NOT fire on a clean sample
  const clean = evaluate(
    [["/a", mk(rich + '<link rel="canonical" href="https://x.test/a"/>')],
     ["/b", mk(rich + '<p>distinct</p><link rel="canonical" href="https://x.test/b"/>')]],
    mk("", 404));
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

  const sec = await get("/.well-known/security.txt").catch(() => null);
  const scitt = await get("/.well-known/scitt.json").catch(() => null);
  const failures = evaluate(pages, absent, sec, scitt);
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
