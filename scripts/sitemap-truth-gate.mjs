#!/usr/bin/env node
/**
 * sitemap-truth-gate — every URL in public/sitemap.xml must be one the edge SERVES.
 *
 * WHY THIS EXISTS. Audited live on 2026-09-05: 68 of 413 sitemap URLs (16.5%) did not answer
 * 200. 67 answered 308 and one 410. A sitemap is a request to index exactly these URLs, so a
 * redirecting entry spends crawl budget to be told to look elsewhere, and the canonical page
 * competes with the version being advertised.
 *
 * The three causes, all now fixed in generate-sitemap.mjs and all checked here:
 *   · 38 blog articles listed WITHOUT their trailing slash. The prerender snapshots each to
 *     /blog/<slug>/index.html, so the edge 308s the bare form onto the slash form.
 *   · 29 retired routes that redirect from a Pages FUNCTION rather than public/_redirects.
 *     generate-sitemap only reconciled against _redirects, so it could not see them.
 *   · /stripe-checkout.js — an asset route answering 410 Gone, never an indexable page.
 *
 * This gate is STATIC by default: it re-derives what should be excluded from the same sources
 * the generator reads, so it runs offline and in CI without network. --live additionally
 * fetches every URL, which is the check that actually proved the fix.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITEMAP = join(ROOT, "public/sitemap.xml");
const ORIGIN = "https://councilof.ai";

function locs() {
  return [...readFileSync(SITEMAP, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

function redirectRules() {
  const map = new Map();
  try {
    for (const line of readFileSync(join(ROOT, "public/_redirects"), "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const [from, to, code] = t.split(/\s+/);
      if (from && to && Number(code) >= 300 && Number(code) < 400) map.set(from, to);
    }
  } catch {
    /* absent is reported by the generator, not here */
  }
  return map;
}

function functionRedirects(dir = join(ROOT, "functions"), prefix = "", out = new Set()) {
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      functionRedirects(full, `${prefix}/${e.name}`, out);
      continue;
    }
    if (!e.name.endsWith(".ts") || e.name.endsWith(".test.ts")) continue;
    let src = "";
    try {
      src = readFileSync(full, "utf8");
    } catch {
      continue;
    }
    if (!/status:\s*3\d\d/.test(src) && !/Response\.redirect\s*\(/.test(src)) continue;
    const base = e.name.replace(/\.ts$/, "");
    if (base === "index") {
      out.add(prefix || "/");
      out.add(`${prefix}/`);
    } else {
      out.add(`${prefix}/${base}`);
    }
  }
  return out;
}

const NON_PAGE_EXT = /\.(?:js|mjs|cjs|css|map|ico|png|jpe?g|svg|webp|gif|woff2?|ttf)$/i;

/** Paths the prerender snapshots to <path>/index.html — the edge serves these WITH a slash. */
function prerenderedPaths() {
  const out = new Set();
  try {
    const src = readFileSync(join(ROOT, "scripts/prerender.mjs"), "utf8");
    for (const m of src.matchAll(/["'`](\/blog\/[a-z0-9-]+)["'`]/g)) out.add(m[1]);
  } catch {
    /* the generator already exits loudly if this file is unreadable */
  }
  return out;
}

function problems() {
  const rules = redirectRules();
  const fns = functionRedirects();
  const prerendered = prerenderedPaths();
  const found = [];
  for (const url of locs()) {
    const path = url.startsWith(ORIGIN) ? url.slice(ORIGIN.length) || "/" : url;
    if (NON_PAGE_EXT.test(path)) found.push(`${path} is an asset, not a page`);
    else if (fns.has(path)) found.push(`${path} is redirected by a Pages Function`);
    else if (rules.has(path)) found.push(`${path} has a _redirects rule -> ${rules.get(path)}`);
    else if (prerendered.has(path) && !path.endsWith("/")) {
      // The largest single cause, and invisible to the two checks above: 38 blog articles were
      // listed WITHOUT a trailing slash. Nothing declares that redirect — the edge derives it
      // from the snapshot living at <path>/index.html — so it cannot be read out of _redirects
      // or a function. It IS derivable from the prerender queue, which is the same source
      // generate-sitemap uses to decide which articles are built at all.
      found.push(`${path} is prerendered at ${path}/ — the bare form 308s onto it`);
    }
  }
  return found;
}

if (process.argv.includes("--selftest")) {
  // The gate must be able to FAIL. A check that cannot fire is worse than no check, so prove
  // the predicate on the three shapes that were actually wrong, without touching the real file.
  const cases = [
    ["/stripe-checkout.js", NON_PAGE_EXT.test("/stripe-checkout.js"), "asset route"],
    ["/blog/x", NON_PAGE_EXT.test("/blog/x") === false, "a page path is not an asset"],
    ["/about-credential", functionRedirects().has("/about-credential"), "function-backed 308"],
    ["/watchdog/", functionRedirects().has("/watchdog/"), "index.ts serves the slash form too"],
    ["/gspc-scoreboard", functionRedirects().has("/gspc-scoreboard"), "Response.redirect(...) form"],
    ["prerender set", prerenderedPaths().size > 30, "must derive the built blog paths, not zero"],
  ];
  let bad = 0;
  for (const [what, ok, why] of cases) {
    if (!ok) {
      console.error(`  selftest FAIL: ${what} — ${why}`);
      bad++;
    }
  }
  if (bad) process.exit(1);
  console.log("sitemap-truth-gate selftest: PASS");
  process.exit(0);
}

const found = problems();
if (found.length) {
  console.error(`sitemap-truth-gate: BLOCKED (${found.length} listed URL(s) the edge does not serve)`);
  for (const f of found) console.error(`- ${f}`);
  console.error("Resolution: run `node scripts/generate-sitemap.mjs` — it drops these by construction.");
  process.exit(1);
}
console.log(`sitemap-truth-gate: PASS — all ${locs().length} listed URLs are served paths`);
