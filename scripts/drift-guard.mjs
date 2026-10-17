#!/usr/bin/env node
/**
 * drift-guard.mjs — asserts the LIVE councilof.ai matches canon.json (the ruled public invariants).
 *
 * WHY THIS EXISTS: production is a Cloudflare Pages project. If any lane runs a direct
 * `wrangler pages deploy` it silently overwrites the gated CI build — that is how an ungated
 * 17-axis /api/gspc and a de-branded regression shipped over what was then the ruled build.
 * This guard runs on a schedule (and on demand) and goes RED the moment the live site drifts
 * from canon, so a clobber is visible within minutes instead of at diligence.
 *
 * Board counts are NOT typed anywhere: the expected board is this commit's own /api/gspc, computed
 * offline (Measure, 16 Oct 2026). Other expected values (title, routes, banned strings) live in canon.json.
 * (Historical:) The expected counts lived in canon.json and NOWHERE ELSE — a guard must name the number it
 * checks for, but no rendered surface may type one (ADR-001). If a ruling moves the count,
 * move it in canon.json, read off the signed board, and the guard follows.
 *
 * It reads NOTHING secret and changes NOTHING. It only fetches public URLs and compares.
 *
 * Run: node scripts/drift-guard.mjs [--host https://councilof.ai]
 * Exit 0 = live matches canon; exit 1 = drift detected (details printed).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { commitBoard } from "./surface/commit-board.mjs";
import { judge, loadSignedSnapshots, selftest } from "./surface/board-drift.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
if (process.argv.includes("--selftest")) { console.log(selftest()); process.exit(0); }
const canon = JSON.parse(readFileSync(join(ROOT, "canon.json"), "utf8"));
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const HOST = (arg("host", "https://councilof.ai")).replace(/\/$/, "");
const UA = "Mozilla/5.0 (drift-guard; +https://councilof.ai)";

const fails = [];
const pass = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => { console.log(`  ✗ ${m}`); fails.push(m); };

async function get(path) {
  // Loop-safe fetch. `redirect:"follow"` on a genuine bare↔slash fight throws TypeError
  // (max-redirect) — a generic crash with no actionable body — so the chain is walked here
  // and a repeat visit is reported as a clean `loop:true`.
  //
  // FIXED 2026-08-26: this used to call a redirect a LOOP whenever the Location merely
  // added or removed a trailing slash. /library and /honesty answer 308 → /library/ and
  // serve 200 there, which is correct behaviour, and the guard reported both as broken on
  // a healthy site. A gate that goes red on a correct answer gets set to continue-on-error
  // within a week and stops protecting anything — the same end state as a gate that cannot
  // go red at all. A loop is a URL VISITED TWICE, and nothing else.
  const visited = new Set();
  let url = new URL(path, HOST).toString();
  for (let hop = 0; hop < 8; hop++) {
    if (visited.has(url)) return { status: 310, body: "", loop: true, location: url };
    visited.add(url);
    const r = await fetch(url, { headers: { "user-agent": UA }, redirect: "manual" });
    const loc = r.headers.get("location");
    if (r.status >= 300 && r.status < 400 && loc) { url = new URL(loc, url).toString(); continue; }
    return { status: r.status, body: await r.text(), loop: false };
  }
  return { status: 310, body: "", loop: true, location: url };
}

console.log(`DRIFT-GUARD — ${HOST} vs canon.json`);
console.log(`ruling: ${canon.ruling}\n`);

// 1. Homepage title
try {
  const { status, body } = await get("/");
  const title = (body.match(/<title>(.*?)<\/title>/s) || [, ""])[1];
  if (status !== 200) fail(`/ returned HTTP ${status}`);
  else if (!title.toLowerCase().includes(canon.title_contains.toLowerCase())) fail(`/ title lost "${canon.title_contains}" — got: ${title.slice(0, 80)}`);
  else pass(`/ title carries "${canon.title_contains}"`);
} catch (e) { fail(`/ fetch error: ${e.message}`); }

// 2. The board contract. EXPECTED is this commit's own board (commit-board.mjs, the same
// derivation prerender freezes for facts-gate), never live totals — a guard derived from live
// only compares live with itself. Judged with the production-anchor rules in board-drift.mjs.
try {
  const { status, body } = await get(canon.api.path);
  if (status !== 200) { fail(`${canon.api.path} returned HTTP ${status}`); }
  else {
    let d; try { d = JSON.parse(body); } catch { d = null; }
    if (!d) fail(`${canon.api.path} is not JSON (an SPA/HTML build clobbered the Function?)`);
    else {
      const cb = await commitBoard(ROOT);
      if (cb.status !== 200) fail(`this commit's ${canon.api.path} answered HTTP ${cb.status} offline`);
      else {
        const expected = JSON.parse(cb.raw.toString("utf8"));
        console.log(`  expected (commit board): ${expected.totals?.public_count}`);
        console.log(`  live:                    ${d.totals?.public_count}`);
        const { errors, notes } = judge(d, expected, loadSignedSnapshots(ROOT));
        for (const n of notes) console.log(`  · ${n}`);
        if (errors.length) errors.forEach(fail);
        else pass(`live board agrees with this commit's board (production-anchor rules)`);
      }
    }
  }
} catch (e) { fail(`${canon.api.path} check error: ${e.message}`); }

// 3. Required routes still present (Library / honesty gate)
for (const [route, marker] of Object.entries(canon.required_routes)) {
  try {
    const { status, body, loop, location } = await get(route);
    if (loop) fail(`${route}: REDIRECT LOOP (HTTP ${status} -> ${location ?? "self"}) — bare↔slash fight`);
    else if (status !== 200) fail(`${route} returned HTTP ${status}`);
    else if (!body.includes(marker)) fail(`${route} lost its content marker "${marker}"`);
    else pass(`${route} present`);
  } catch (e) { fail(`${route} fetch error: ${e.message}`); }
}

// 4. No forbidden display string leaked into the homepage visible text
try {
  const { body } = await get("/");
  const visible = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
  const hit = canon.forbidden_display_strings.find((s) => new RegExp(s, "i").test(visible));
  if (hit) fail(`homepage visible text carries a forbidden string: /${hit}/i`);
  else pass(`no forbidden display strings on /`);
} catch (e) { fail(`/ forbidden-scan error: ${e.message}`); }

console.log("");
if (fails.length) {
  console.error(`DRIFT-GUARD: FAIL — ${fails.length} drift(s). The live site does not match the ruled canon.`);
  console.error(`Most likely cause: a direct 'wrangler pages deploy' overwrote the gated CI build. See DEPLOY-LOCK.md.`);
  process.exit(1);
}
console.log(`DRIFT-GUARD: PASS — live site matches canon.json.`);
