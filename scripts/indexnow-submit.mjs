#!/usr/bin/env node
/**
 * indexnow-submit.mjs — tell the search index about URLs that CHANGED, and nothing else.
 *
 *   node scripts/indexnow-submit.mjs <url> [<url> …]
 *   node scripts/indexnow-submit.mjs --file urls.txt
 *   node scripts/indexnow-submit.mjs --dry-run <url> …
 *
 * TWO RULES, BOTH ENFORCED HERE RATHER THAN REMEMBERED.
 *
 * 1. NEVER SUBMIT A URL THAT IS NOT LIVE. Every URL is fetched first and only a 200 is submitted.
 *    A submission is a statement that this URL has content worth re-reading; submitting one that
 *    answers 404 or 308 teaches the crawler the opposite, and it is a claim we cannot back. This
 *    script reports the URLs it REFUSED and why, so "0 submitted" is a visible result rather than
 *    a silent one. A gate that fails open is a gate nobody notices.
 *
 * 2. NEVER SUBMIT THE WHOLE SITEMAP, AND NEVER SUBMIT A URL THAT HAS NOT CHANGED *AT THE HOST*.
 *    IndexNow is for changes. There is no `--all`, deliberately. Liveness (rule 1) and change are
 *    two different tests and only the first can be checked from here: a URL can answer 200 all day
 *    while the change you made to it is still sitting unmerged on a branch. That happened on the
 *    first run of this script — /llms.txt and /llms-full.txt were submitted because they were live,
 *    when what had changed was the copy in the working tree. Harmless, but not what a submission
 *    means. So `--changed` is now REQUIRED and is the caller asserting, deliberately, that the
 *    DEPLOYED bytes at these URLs have changed. The flag exists because of that run.
 *
 * THE KEY. Three IndexNow key files are already committed under public/ and served. This script
 * picks one off disk and verifies it is being served from the host before it submits anything —
 * it does NOT mint a fourth. A new key file is how a working verification quietly stops working.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const HOST = process.env.INDEXNOW_HOST || "councilof.ai";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const DRY = process.argv.includes("--dry-run");
const CHANGED = process.argv.includes("--changed");

const argUrls = () => {
  const out = [];
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--dry-run" || argv[i] === "--changed") continue;
    if (argv[i] === "--file") {
      const f = argv[++i];
      out.push(...readFileSync(f, "utf8").split("\n").map((s) => s.trim()).filter((s) => s && !s.startsWith("#")));
      continue;
    }
    out.push(argv[i]);
  }
  return out;
};

/** A committed key file is <key>.txt at the public root whose body is the key itself. */
function committedKeys() {
  return readdirSync(PUBLIC)
    .filter((f) => /^[0-9a-f]{32}\.txt$/.test(f))
    .map((f) => ({ file: f, key: f.replace(/\.txt$/, ""), body: readFileSync(join(PUBLIC, f), "utf8").trim() }))
    .filter((k) => k.body === k.key);
}

async function status(url) {
  try {
    const r = await fetch(url, { method: "GET", redirect: "manual", headers: { "user-agent": "CSOAI-indexnow/1.0" } });
    return r.status;
  } catch (err) {
    return `ERR ${err.message}`;
  }
}

const urls = argUrls();
if (!urls.length) {
  console.error("usage: node scripts/indexnow-submit.mjs --changed <url> [...]   |   --file urls.txt   [--dry-run]");
  process.exit(2);
}

if (!CHANGED && !DRY) {
  console.error(
    "[indexnow] refusing to submit without --changed. Pass it only when the DEPLOYED bytes at these " +
      "URLs have changed — a live URL whose change is still on a branch has not changed at the host.",
  );
  process.exit(2);
}

const keys = committedKeys();
if (!keys.length) {
  console.error("[indexnow] no committed key file found under public/ — do NOT mint one here");
  process.exit(1);
}

let chosen = null;
for (const k of keys) {
  const s = await status(`https://${HOST}/${k.file}`);
  console.log(`[indexnow] key ${k.key} served from ${HOST}: HTTP ${s}`);
  if (s === 200 && !chosen) chosen = k;
}
if (!chosen) {
  console.error(`[indexnow] none of the ${keys.length} committed keys is being served from ${HOST} — refusing to submit`);
  process.exit(1);
}

const live = [];
const refused = [];
for (const u of urls) {
  let parsed;
  try {
    parsed = new URL(u);
  } catch {
    refused.push([u, "not a URL"]);
    continue;
  }
  if (parsed.hostname !== HOST) {
    refused.push([u, `host ${parsed.hostname} is not ${HOST} — IndexNow submissions must be for the verified host`]);
    continue;
  }
  const s = await status(u);
  if (s === 200) live.push(u);
  else refused.push([u, `HTTP ${s} — only a 200 is submitted`]);
}

console.log("");
for (const [u, why] of refused) console.log(`  REFUSED   ${u}\n            ${why}`);
for (const u of live) console.log(`  LIVE      ${u}`);
console.log("");

if (!live.length) {
  console.log(`[indexnow] 0 of ${urls.length} URL(s) submitted — nothing was live. Nothing was sent.`);
  process.exit(0);
}

if (DRY) {
  console.log(`[indexnow] --dry-run: would submit ${live.length} URL(s) with key ${chosen.key}`);
  process.exit(0);
}

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: chosen.key, keyLocation: `https://${HOST}/${chosen.file}`, urlList: live }),
});
const text = await res.text();
console.log(`[indexnow] POST ${ENDPOINT} -> HTTP ${res.status} ${text.slice(0, 200)}`);
// 200 and 202 both mean accepted. Acceptance is not indexing, and this script never says it is.
console.log(
  res.status === 200 || res.status === 202
    ? `[indexnow] ${live.length} URL(s) ACCEPTED for ${HOST}. Accepted is not indexed — it is a queue receipt.`
    : `[indexnow] NOT accepted (HTTP ${res.status}). ${live.length} URL(s) were not submitted.`,
);
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
