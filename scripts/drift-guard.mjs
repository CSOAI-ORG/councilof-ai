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
 * The expected counts live in canon.json and NOWHERE ELSE — a guard must name the number it
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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const canon = JSON.parse(readFileSync(join(ROOT, "canon.json"), "utf8"));
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const HOST = (arg("host", "https://councilof.ai")).replace(/\/$/, "");
const UA = "Mozilla/5.0 (drift-guard; +https://councilof.ai)";

const fails = [];
const pass = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => { console.log(`  ✗ ${m}`); fails.push(m); };

async function get(path) {
  // Loop-safe fetch (2026-08-22): `redirect:"follow"` on the bare↔slash /verify fight
  // throws TypeError (max-redirect) — a generic crash with no actionable body. Detect a
  // self-referential 3xx and return a clean `loop:"true"` so the guard FAILS legibly.
  const r = await fetch(HOST + path, { headers: { "user-agent": UA }, redirect: "manual" });
  if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
    const loc = r.headers.get("location");
    if (loc === path || loc === path + "/" || loc === path.replace(/\/$/, "")) {
      return { status: r.status, body: "", loop: true, location: loc };
    }
    const target = new URL(loc, HOST).toString();
    const final = await fetch(target, { headers: { "user-agent": UA }, redirect: "error" });
    return { status: final.status, body: await final.text(), loop: false };
  }
  const body = await r.text();
  return { status: r.status, body, loop: false };
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

// 2. The API contract (the number that keeps drifting)
try {
  const { status, body } = await get(canon.api.path);
  if (status !== 200) { fail(`${canon.api.path} returned HTTP ${status}`); }
  else {
    let d; try { d = JSON.parse(body); } catch { d = null; }
    if (!d) fail(`${canon.api.path} is not JSON (an SPA/HTML build clobbered the Function?)`);
    else {
      const t = d.totals || {};
      if (d.schema !== canon.api.schema) fail(`schema ${d.schema} ≠ ruled ${canon.api.schema}`);
      else pass(`schema ${d.schema}`);
      if (t.axes !== canon.api.axes_total) fail(`totals.axes ${t.axes} ≠ ruled ${canon.api.axes_total} (the axis-count drift)`);
      else pass(`totals.axes ${t.axes}`);
      if (t.measured_axes !== canon.api.measured_axes) fail(`totals.measured_axes ${t.measured_axes} ≠ ruled ${canon.api.measured_axes}`);
      else pass(`totals.measured_axes ${t.measured_axes}`);
      // UNMEASURED is a first-class published value, not a leftover. Guarding it
      // stops the one failure that would matter most: an unmeasured slot quietly
      // being promoted to close a gap in the measured count.
      if (typeof canon.api.unmeasured_axes === "number") {
        if (t.unmeasured_axes !== canon.api.unmeasured_axes) fail(`totals.unmeasured_axes ${t.unmeasured_axes} ≠ ruled ${canon.api.unmeasured_axes} (an axis was promoted or dropped)`);
        else pass(`totals.unmeasured_axes ${t.unmeasured_axes}`);
      }
      const pc = String(t.public_count || "");
      if (!pc.includes(canon.api.public_count_contains)) fail(`public_count lost "${canon.api.public_count_contains}" — got: ${pc.slice(0, 60)}`);
      else pass(`public_count carries the ruling`);
    }
  }
} catch (e) { fail(`${canon.api.path} fetch error: ${e.message}`); }

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
