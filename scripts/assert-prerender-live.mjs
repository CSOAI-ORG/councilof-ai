#!/usr/bin/env node
/**
 * Assert a live host is the gated prerender, not a thin Vite shell.
 *
 *   node scripts/assert-prerender-live.mjs
 *   node scripts/assert-prerender-live.mjs --label immediate \
 *     --host https://councilof.ai --also https://councilof-ai.pages.dev
 *
 * Why this exists: custom domain + councilof-ai.pages.dev follow the Pages
 * PRODUCTION alias. A Vite-only Git/Mac deploy can overwrite that alias a
 * few minutes after the official wrangler upload. `/` is no-cache so it
 * flips immediately; `/os/` can stay fat for a week (directory indexes
 * missed the /*.html rule) and hide the clobber.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const canon = JSON.parse(readFileSync(join(ROOT, "canon.json"), "utf8"));
const MIN = Number(canon.min_homepage_bytes || 20000);
const UA = "CSOAI-assert-prerender/1.0";

const args = process.argv.slice(2);
const take = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : fallback;
};
const takeAll = (flag) => args.flatMap((a, i) => (a === flag ? [args[i + 1]] : []));

const label = take("--label", "assert");
const hosts = [take("--host", "https://councilof.ai"), ...takeAll("--also")]
  .filter(Boolean)
  .map((h) => h.replace(/\/$/, ""));

const fails = [];
const pass = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => {
  console.log(`  ✗ ${m}`);
  fails.push(m);
};

async function get(url) {
  try {
    const r = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
    const body = await r.text();
    return { status: r.status, body, bytes: body.length, error: null };
  } catch (err) {
    const msg = err instanceof Error ? (err.cause?.message || err.message) : String(err);
    return { status: 0, body: "", bytes: 0, error: msg };
  }
}

// getStable — retry a transient 404 on a route a few times before declaring failure.
// Cloudflare Pages propagates a fresh deployment across aliases over a short window; a single
// fetch right after deploy can catch a route mid-propagation and 404 transiently even though the
// gated tree is correct (and already 200 a few seconds later). This distinguishes a genuine
// persistent 404 (a real regression) from a propagation blip — it does NOT fabricate a 200.
const MAX_TRIES = 4;
const RETRY_MS = 4000;
async function getStable(url) {
  for (let i = 1; i <= MAX_TRIES; i++) {
    const r = await get(url);
    if (r.status >= 200 && r.status < 400) return r; // healthy or a redirect that resolves
    if (i < MAX_TRIES) await new Promise((res) => setTimeout(res, RETRY_MS));
  }
  return await get(url); // final authoritative result (likely a genuine persistent 404)
}

console.log(`ASSERT-PRERENDER [${label}] min_homepage_bytes=${MIN}`);

for (const host of hosts) {
  console.log(`\n${host}`);
  const home = await get(host + "/");
  const os = await get(host + "/os/");
  const verify = await get(host + "/gspc-verify/");
  const board = await get(host + "/gspc-scoreboard");

  if (home.error) fail(`${host}/ fetch failed: ${home.error}`);
  else if (home.status !== 200) fail(`${host}/ HTTP ${home.status}`);
  else if (home.bytes < MIN) {
    fail(`${host}/ is a thin Vite shell (${home.bytes} bytes; need ≥ ${MIN})`);
    if (os.status === 200 && os.bytes >= MIN) {
      fail(`${host}/os/ is still fat (${os.bytes} B) — likely a cached directory index hiding the clobber`);
    }
  } else {
    pass(`${host}/ ${home.bytes} bytes`);
  }

  if (!/data-testid="home-verify"|Check an AI claim in your browser/i.test(home.body)) {
    fail(`${host}/ is not verify (missing home-verify)`);
  } else {
    pass(`${host}/ is verify (home-verify)`);
  }

  if (os.error) fail(`${host}/os/ fetch failed: ${os.error}`);
  else if (os.status !== 200) fail(`${host}/os/ HTTP ${os.status}`);
  else pass(`${host}/os/ HTTP 200`);

  const sovos = await getStable(host + "/sov-os/");
  if (sovos.error) fail(`${host}/sov-os/ fetch failed: ${sovos.error}`);
  else if (sovos.status !== 200 || /404 — Not found/i.test(sovos.body)) fail(`${host}/sov-os/ HTTP ${sovos.status || "404"}`);
  else if (sovos.bytes < 8000) fail(`${host}/sov-os/ thin (${sovos.bytes} B — prerender missing?)`);
  else pass(`${host}/sov-os/ HTTP ${sovos.status} (${sovos.bytes} B)`);

  if (verify.error) fail(`${host}/gspc-verify/ fetch failed: ${verify.error} (often a 308 slash loop)`);
  else if (verify.status !== 200) fail(`${host}/gspc-verify/ HTTP ${verify.status}`);
  else pass(`${host}/gspc-verify/ HTTP 200`);

  if (board.error) fail(`${host}/gspc-scoreboard fetch failed: ${board.error}`);
  else if (board.status !== 200) fail(`${host}/gspc-scoreboard HTTP ${board.status}`);
  else if (board.bytes < MIN) {
    fail(`${host}/gspc-scoreboard is the leftover static HTML (${board.bytes} B), not the living React board`);
  } else {
    pass(`${host}/gspc-scoreboard ${board.bytes} bytes (living board)`);
  }

  for (const path of [
    "/gspc", "/verify", "/console", "/for/regulator", "/vs/vanta",
    "/gspc-verify", "/dashboard", "/about", "/library/regulation",
    "/honesty", "/watchdog", "/insurers", "/login",
  ]) {
    const r = await getStable(host + path);
    if (r.error) fail(`${host}${path} fetch failed: ${r.error}`);
    else if (r.status >= 400 || /404 — Not found/i.test(r.body)) fail(`${host}${path} HTTP ${r.status || "404"}`);
    else pass(`${host}${path} HTTP ${r.status}`);
  }

  try {
    const chat = await fetch(host + "/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": UA },
      body: JSON.stringify({ messages: [{ role: "user", content: "In plain words, what does the Council of AI actually measure?" }] }),
    });
    const j = await chat.json();
    if (j.state === "ungrounded" || /I won't answer this one/i.test(String(j.answer || ""))) {
      fail(`${host}/api/chat refused the public suggested ask`);
    } else {
      pass(`${host}/api/chat grounded (${j.state})`);
    }
  } catch (e) {
    fail(`${host}/api/chat ${String(e).slice(0, 80)}`);
  }
}

console.log("");
if (fails.length) {
  console.error(`ASSERT-PRERENDER [${label}]: FAIL — ${fails.length} check(s).`);
  console.error("Most likely: Pages Git auto-build or a Mac `wrangler pages deploy` overwrote production.");
  console.error("See DEPLOY-LOCK.md.");
  process.exit(1);
}
console.log(`ASSERT-PRERENDER [${label}]: PASS`);
