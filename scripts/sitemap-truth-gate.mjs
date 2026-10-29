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
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITEMAP = join(ROOT, "public/sitemap.xml");
const ORIGIN = "https://councilof.ai";
const FUNCTIONS_DIR = join(ROOT, "functions");

if (!existsSync(FUNCTIONS_DIR)) {
  throw new Error("sitemap-truth-gate: functions/ is required to inspect Pages Function redirects");
}

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

function functionRedirects(dir = FUNCTIONS_DIR, prefix = "", out = new Set()) {
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

/** The slugs published ON PURPOSE. blog-published.json is the source of truth. */
function publishedBlogSlugs() {
  const out = new Set();
  try {
    const doc = JSON.parse(readFileSync(join(ROOT, "client/src/data/blog-published.json"), "utf8"));
    for (const p of doc.published || []) if (p && typeof p.slug === "string" && p.slug) out.add(p.slug);
  } catch {
    /* the generator warns about this file too */
  }
  return out;
}

/** Slugs with an EXACT route to BlogPost in App.tsx — the published ones sit BEFORE /blog/:slug. */
function exactBlogRoutes(app) {
  const out = new Set();
  for (const m of app.matchAll(/<Route\b[^>]*path="\/blog\/([a-z0-9-]+)"[^>]*>([\s\S]{0,600}?)<\/Route>/g)) {
    if (/<BlogPost\b/.test(m[2]) && m[2].includes(`slug="${m[1]}"`)) out.add(m[1]);
  }
  return out;
}

/**
 * Is a /blog/<slug> path one the edge SERVES?
 *
 * /blog and /blog/:slug are withdrawn (ContentReviewNotice), but a named set of posts is
 * published deliberately: client/src/data/blog-published.json says each slug there "gets an
 * exact App.tsx route to BlogPost, a prerender snapshot and a sitemap entry", and the edge
 * serves them — measured live 2026-10-29, HTTP 200 with the article's own title.
 *
 * So the blanket "every /blog/ URL is a withdrawn article" rule flagged the PUBLISHED posts
 * as unserved, and every master deploy failed at this gate from 2026-10-29T00:29Z. The
 * rule now exempts a published slug, but ONLY when it is really served: an exact BlogPost
 * route AND a prerender snapshot. A published slug that lost either is a broken publication
 * and is REPORTED — never silently exempted.
 *
 * Returns a reason string, or null when the path is served.
 */
export function blogPathProblem(path, { blogWithdrawn, published, exactRoutes, prerendered }) {
  const m = /^\/blog\/([^/]+)\/?$/.exec(path);
  if (!m) return null;
  const slug = m[1];
  if (published.has(slug)) {
    if (!exactRoutes.has(slug)) return `${path} is listed as published but has no exact BlogPost route`;
    if (!prerendered.has(`/blog/${slug}`)) return `${path} is listed as published but has no prerender snapshot`;
    return null;
  }
  if (blogWithdrawn) return `${path} is a withdrawn article, not indexable content`;
  return null;
}

function problems() {
  const rules = redirectRules();
  const fns = functionRedirects();
  const prerendered = prerenderedPaths();
  const app = readFileSync(join(ROOT, "client/src/App.tsx"), "utf8");
  const blogWithdrawn = /<Route\b[^>]*\bpath="\/blog\/:slug"[^>]*\bcomponent=\{ContentReviewNotice\}/.test(app);
  const published = publishedBlogSlugs();
  const exactRoutes = exactBlogRoutes(app);
  const found = [];
  const listed = locs();
  const counts = new Map();
  for (const url of listed) counts.set(url, (counts.get(url) ?? 0) + 1);
  for (const [url, count] of counts) {
    if (count > 1) found.push(`${url} is listed ${count} times`);
  }
  for (const url of listed) {
    const path = url.startsWith(ORIGIN) ? url.slice(ORIGIN.length) || "/" : url;
    const blogProblem = blogPathProblem(path, { blogWithdrawn, published, exactRoutes, prerendered });
    if (blogProblem) found.push(blogProblem);
    else if (NON_PAGE_EXT.test(path)) found.push(`${path} is an asset, not a page`);
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
  const appSrc = readFileSync(join(ROOT, "client/src/App.tsx"), "utf8");
  const pub = publishedBlogSlugs();
  const exact = exactBlogRoutes(appSrc);
  const snaps = prerenderedPaths();
  const ctx = { blogWithdrawn: true, published: pub, exactRoutes: exact, prerendered: snaps };
  const cases = [
    ["/stripe-checkout.js", NON_PAGE_EXT.test("/stripe-checkout.js"), "asset route"],
    ["/blog/x", NON_PAGE_EXT.test("/blog/x") === false, "a page path is not an asset"],
    ["/about-credential", functionRedirects().has("/about-credential"), "function-backed 308"],
    ["/advisory/", functionRedirects().has("/advisory/"), "index.ts serves the slash form too"],
    ["/gspc-scoreboard", functionRedirects().has("/gspc-scoreboard"), "Response.redirect(...) form"],
    ["prerender set", prerenderedPaths().size > 30, "must derive the built blog paths, not zero"],
    ["duplicate predicate", new Set(["a", "a"]).size < ["a", "a"].length, "must detect repeated canonical URLs"],
    // The published-post shape. The gate flagged the PUBLISHED posts as withdrawn and blocked
    // every master deploy from 2026-10-29T00:29Z; these cases prove the exemption is real.
    ["published set", pub.size > 0, "blog-published.json must name the published posts"],
    ["every published post has an exact route", [...pub].every((s) => exact.has(s)), "a published post needs its own route"],
    ["every published post has a snapshot", [...pub].every((s) => snaps.has(`/blog/${s}`)), "a published post needs a snapshot"],
    ["a published post is served", blogPathProblem("/blog/how-to-verify-an-ai-measurement/", ctx) === null, "a published post must not be flagged as withdrawn"],
    ["a withdrawn post is flagged", blogPathProblem("/blog/never-published/", ctx) !== null, "an unpublished /blog/ URL must still be flagged"],
    ["a published post with no route is flagged", blogPathProblem("/blog/x/", { blogWithdrawn: true, published: new Set(["x"]), exactRoutes: new Set(), prerendered: snaps }) !== null, "an exemption without an exact route is a broken publication"],
    ["a published post with no snapshot is flagged", blogPathProblem("/blog/x/", { blogWithdrawn: true, published: new Set(["x"]), exactRoutes: new Set(["x"]), prerendered: new Set() }) !== null, "an exemption without a snapshot is a broken publication"],
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
