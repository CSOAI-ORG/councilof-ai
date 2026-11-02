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
 * THE COUNTS ARE FLOORS PLUS A GRAMMAR (ruled 2026-10-30), not a frozen number.
 * This used to assert EQUALITY against 23/23/0 while the board had legitimately grown to
 * 33/23/10, so it was RED on a correct live board for 114 consecutive runs while its
 * self-heal re-triggered a deploy every 30 minutes — ~30 needless deploys a day for ~50
 * days, to fix a number no deploy can change. The rule is now the one
 * scripts/board-production-anchor.mjs already enforced at PR time:
 *   GROWTH IS PUBLISHED, SHRINKAGE IS DRIFT.
 * Floors, not targets: the board may carry MORE slots and MORE measurements than the
 * floor. It goes red if it carries fewer, if the gap count stops equalling axes minus
 * measured, or if the public count line stops agreeing with the numbers beside it.
 *
 * It reads NOTHING secret and changes NOTHING. It only fetches public URLs and compares.
 *
 * Run: node scripts/drift-guard.mjs [--host https://councilof.ai]
 *      node scripts/drift-guard.mjs --selftest   (prove the grammar can still go red)
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

if (process.argv.includes("--selftest")) { selftest(); process.exit(0); }

const fails = [];
const pass = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => { console.log(`  ✗ ${m}`); fails.push(m); };

/**
 * checkCounts(t, canonApi) — the COUNT GRAMMAR, as a pure function.
 *
 * Returns an array of {ok, msg}. The rules, in order:
 *
 *   1. axes_total_floor       — the board may not SHRINK below this floor. Growth is
 *                               PUBLISHED (a new declared slot becomes visible and the
 *                               guard stays green).
 *   2. measured_axes_floor    — the board may not carry FEWER measurements. A
 *                               measurement disappearing IS drift. Growth is fine.
 *   3. unmeasured derives     — totals.unmeasured_axes MUST equal axes − measured_axes,
 *                               read from the payload. The gap count is derived, never
 *                               ruled: a published slot is not a measurement.
 *   4. public copy agrees     — totals.public_count MUST carry the line composed from
 *                               the SAME live numbers. Copy that keeps a frozen number
 *                               while the data moves is exactly the drift to catch.
 *
 * Exported and pure so it can be unit-tested: a guard that cannot be proven able to
 * fail is a lamp, not a gate.
 */
export function checkCounts(t, canonApi = {}) {
  const out = [];
  const axesFloor = canonApi.axes_total_floor;
  const measuredFloor = canonApi.measured_axes_floor;

  if (typeof axesFloor === "number") {
    if (typeof t.axes !== "number") {
      out.push({ ok: false, msg: `totals.axes is not a number (got ${JSON.stringify(t.axes)})` });
    } else if (t.axes < axesFloor) {
      out.push({ ok: false, msg: `totals.axes ${t.axes} < floor ${axesFloor} — the board SHRANK; a slot disappeared` });
    } else {
      out.push({ ok: true, msg: `totals.axes ${t.axes} ≥ floor ${axesFloor}${t.axes > axesFloor ? " (growth is published, not drift)" : ""}` });
    }
  }

  if (typeof measuredFloor === "number") {
    if (typeof t.measured_axes !== "number") {
      out.push({ ok: false, msg: `totals.measured_axes is not a number (got ${JSON.stringify(t.measured_axes)})` });
    } else if (t.measured_axes < measuredFloor) {
      out.push({ ok: false, msg: `totals.measured_axes ${t.measured_axes} < floor ${measuredFloor} — a MEASUREMENT disappeared` });
    } else {
      out.push({ ok: true, msg: `totals.measured_axes ${t.measured_axes} ≥ floor ${measuredFloor}${t.measured_axes > measuredFloor ? " (growth is published, not drift)" : ""}` });
    }
  }

  if (typeof t.axes === "number" && typeof t.measured_axes === "number") {
    const derived = t.axes - t.measured_axes;
    if (typeof t.unmeasured_axes !== "number") {
      out.push({ ok: false, msg: `totals.unmeasured_axes is not a number (got ${JSON.stringify(t.unmeasured_axes)})` });
    } else if (t.unmeasured_axes !== derived) {
      out.push({ ok: false, msg: `totals.unmeasured_axes ${t.unmeasured_axes} ≠ axes − measured (${t.axes} − ${t.measured_axes} = ${derived}) — the two counts stopped travelling together` });
    } else {
      out.push({ ok: true, msg: `totals.unmeasured_axes ${t.unmeasured_axes} = axes − measured (${t.axes} − ${t.measured_axes})` });
    }
  }

  if (typeof t.axes === "number" && typeof t.measured_axes === "number") {
    const expected = `${t.axes} ${t.axes === 1 ? "axis" : "axes"} · ${t.measured_axes} measured`;
    const pc = String(t.public_count || "");
    if (!pc.includes(expected)) {
      out.push({ ok: false, msg: `public_count does not agree with the live numbers — expected it to carry "${expected}", got: ${pc.slice(0, 60)}` });
    } else {
      out.push({ ok: true, msg: `public_count agrees with the live numbers ("${expected}")` });
    }
  }

  return out;
}

/** Selftest: prove the grammar can still go RED. A guard that cannot fail protects nothing. */
export function selftest() {
  const api = { axes_total_floor: 33, measured_axes_floor: 23 };
  const live = { axes: 33, measured_axes: 23, unmeasured_axes: 10, public_count: "33 axes · 23 measured" };
  const cases = [
    ["live board as ruled", live, true],
    ["board GREW by a declared slot (34·23·11)", { ...live, axes: 34, unmeasured_axes: 11, public_count: "34 axes · 23 measured" }, true],
    ["a slot was MEASURED (33·24·9)", { ...live, measured_axes: 24, unmeasured_axes: 9, public_count: "33 axes · 24 measured" }, true],
    ["slots AND a measurement grew (35·24·11)", { axes: 35, measured_axes: 24, unmeasured_axes: 11, public_count: "35 axes · 24 measured" }, true],
    ["board SHRANK (22·23)", { axes: 22, measured_axes: 23, unmeasured_axes: -1, public_count: "22 axes · 23 measured" }, false],
    ["a MEASUREMENT disappeared (33·22·11)", { axes: 33, measured_axes: 22, unmeasured_axes: 11, public_count: "33 axes · 22 measured" }, false],
    ["the gap count stopped deriving (33·23·0)", { ...live, unmeasured_axes: 0 }, false],
    ["public copy froze at the old number", { ...live, public_count: "23 axes · 23 measured" }, false],
    ["public copy missing entirely", { ...live, public_count: "" }, false],
    ["axes is not a number", { ...live, axes: "33" }, false],
  ];
  let bad = 0;
  for (const [name, totals, ok] of cases) {
    const res = checkCounts(totals, api);
    const passed = res.every((r) => r.ok);
    if (passed !== ok) {
      bad++;
      console.error(`  ✗ selftest FAILED: ${name} — expected ${ok ? "green" : "red"}, got ${res.filter((r) => !r.ok).map((r) => r.msg).join("; ") || "green"}`);
    }
  }
  if (bad) {
    console.error(`drift-guard selftest FAILED: ${bad} case(s) wrong`);
    process.exit(1);
  }
  console.log(`drift-guard selftest OK (${cases.length} cases, ${cases.filter((c) => !c[2]).length} must-fail)`);
}

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

      // ── THE COUNT GRAMMAR ────────────────────────────────────────────────────
      // The counts here are FLOORS plus a GRAMMAR, not a frozen number.
      //
      // WHY (2026-10-30): this guard compared the live totals for EQUALITY against a
      // frozen 23/23/0. The board legitimately grew to 33 slots on 2026-10-16, so the
      // guard went red on a CORRECT live board and stayed red for 114 consecutive
      // runs — while its self-heal re-triggered deploy.yml every 30 minutes, ~30
      // needless deploys a day for ~50 days, to fix a number NO DEPLOY CAN CHANGE.
      // A gate red on a correct answer gets set to continue-on-error within a week,
      // and then it protects nothing: the same end state as a gate that cannot go red.
      //
      // The rule now, matching the PR-time gate scripts/board-production-anchor.mjs
      // already enforced ("only the count of unmeasured axes may grow"):
      //   GROWTH IS PUBLISHED, SHRINKAGE IS DRIFT.
      for (const r of checkCounts(t, canon.api)) {
        if (r.ok) pass(r.msg);
        else fail(r.msg);
      }
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