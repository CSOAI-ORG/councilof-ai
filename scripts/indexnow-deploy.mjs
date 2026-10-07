#!/usr/bin/env node
/**
 * IndexNow after a production deploy: announce only the HTML pages whose visible text changed.
 *
 * WHY THIS EXISTS. Change announcements came from a hook on the build pod
 * (scripts/pod-loops/indexnow-changed.py, run by auto-land.sh). The single-writer ruling of
 * 6 Oct 2026 moved production deploys to GitHub Actions, the pod hook lost its route, and the
 * last announcement was 2026-10-06T21:50:34Z. That hook also submitted capsule .json URLs, which
 * are not pages a search engine indexes. This runs as a deploy.yml post-step instead, on the
 * tree that was just uploaded.
 *
 * WHAT IT ANNOUNCES.
 *   - /sitemap.xml pages: the sitemap carries no <lastmod>, so a page counts as changed when the
 *     sha256 of its VISIBLE TEXT in the uploaded dist tree differs from the last deploy's. The
 *     normalisation is the one indexnow-changed.py v2 proved on 28 Sep 2026: scripts, styles and
 *     the per-build /api/momentum figures are stripped, as are relative ages and ISO stamps.
 *   - entity pages from the Function-generated sitemaps in /sitemaps/index.xml: their <lastmod> is
 *     the date of the signed observation behind the page, so a changed or new <lastmod> counts.
 *     Only HTML page URLs are kept (no .json, .xml or .txt), each confirmed to answer 200 first.
 * The previous deploy's fingerprints and lastmods are the only state. deploy.yml keeps them in the
 * Actions cache. With no state (the first run, or an evicted cache) this run SEEDS: it records
 * everything and submits nothing, so an existing site is never re-announced wholesale.
 *
 * WHAT IT CLAIMS. "submitted" and the HTTP status IndexNow returned (200 OK, 202 Accepted). Never
 * "indexed": that is the search engine's decision and nothing here observes it.
 *
 *   node scripts/indexnow-deploy.mjs --dist dist/client --state .indexnow-state/state.json
 *   node scripts/indexnow-deploy.mjs --dist dist/client --state s.json --dry-run   # submit nothing, write nothing
 *
 * Exit 0 when the run completed (including SEED and "nothing changed"); 1 when the key file is not
 * live or a submission was refused, so deploy.yml (continue-on-error) shows it without failing the deploy.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const HOST = "councilof.ai";
export const KEY = "97a1aa3163534fae954108d8941eb361";
export const ENDPOINT = "https://api.indexnow.org/indexnow";
export const BATCH = 10000; // IndexNow accepts at most 10,000 URLs per POST
export const ENTITY_CHECK_CAP = 2000; // live checks per run; the rest wait for the next deploy
export const SCHEMA = "csoai.indexnow-deploy-state/1";
const UA = "Mozilla/5.0 (compatible; csoai-indexnow/4; +https://councilof.ai)";

// Build-time reads of /api/momentum baked into prerendered HTML on every deploy (indexnow-changed.py,
// proven 28 Sep 2026: they alone made 300 of 440 sitemap URLs "change").
const SKIP_BLOCKS = /<(script|style|noscript|template)\b[\s\S]*?<\/\1\s*>/gi;
const VOLATILE = new RegExp(
  [
    String.raw`<section\b[^>]*\bdata-testid="footer-stats"[^>]*>[\s\S]*?<\/section>`,
    String.raw`<p\b[^>]*\bdata-testid="momentum-origin"[^>]*>[\s\S]*?<\/p>`,
    String.raw`<li\b[^>]*\bdata-testid="momentum-figure-[\w-]+"[^>]*>[\s\S]*?<\/li>`,
  ].join("|"),
  "gi",
);
const AGO = /\b\d+(?:\.\d+)?\s*(?:h|hours?)\s+ago\b/g; // recomputed at every prerender
const ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z?/g; // build and as-of stamps
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", middot: "·", mdash: "—", ndash: "–" };

function unescapeHtml(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });
}

/** The text a reader sees, with the parts that change on every build removed. */
export function visibleText(html) {
  let s = String(html).replace(SKIP_BLOCKS, " ");
  s = s.replace(VOLATILE, " ");
  s = s.replace(/<[^>]+>/g, " ");
  s = unescapeHtml(s);
  s = s.replace(AGO, "").replace(ISO, "");
  return s.replace(/\s+/g, " ").trim();
}

export const fingerprint = (html) => createHash("sha256").update(visibleText(html)).digest("hex");

/** [{loc, lastmod}] from a sitemap or sitemap index. */
export function sitemapEntries(xml) {
  const out = [];
  for (const block of String(xml).match(/<(?:url|sitemap)\b[\s\S]*?<\/(?:url|sitemap)>/g) || []) {
    const loc = (block.match(/<loc>\s*([^<]+?)\s*<\/loc>/) || [])[1];
    const lastmod = (block.match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/) || [])[1] || "";
    if (loc) out.push({ loc: unescapeHtml(loc), lastmod });
  }
  return out;
}

/** A page URL, not a data file: no extension, or .html/.htm. Capsule .json and feeds are dropped. */
export function isHtmlPage(url) {
  let p;
  try {
    p = new URL(url).pathname;
  } catch {
    return false;
  }
  const last = p.split("/").pop() || "";
  return !last.includes(".") || /\.html?$/i.test(last);
}

/** The prerendered file a sitemap URL is served from, or null when a Function renders it. */
export function distFileFor(distDir, url) {
  let p;
  try {
    p = decodeURIComponent(new URL(url).pathname);
  } catch {
    return null;
  }
  if (p.split("/").includes("..")) return null;
  const root = path.resolve(distDir);
  const rel = p.replace(/^\/+/, "");
  const tries = rel === "" ? ["index.html"]
    : rel.endsWith("/") ? [`${rel}index.html`]
    : [`${rel}/index.html`, `${rel}.html`, rel];
  for (const t of tries) {
    const f = path.resolve(root, t);
    if (!f.startsWith(root + path.sep) || !/\.html?$/i.test(f)) continue;
    try {
      if (fs.statSync(f).isFile()) return f;
    } catch {
      /* not this candidate */
    }
  }
  return null;
}

/**
 * Decide what to announce. prev is the last deploy's state (null when none). pages is
 * {url: fingerprint} for this deploy; entities is {url: lastmod} (null when unreadable this run,
 * which keeps the previous entity state untouched).
 */
export function plan(prev, pages, entities) {
  const seed = !prev || prev.schema !== SCHEMA;
  const prevPages = (!seed && prev.pages) || {};
  const prevEntities = (!seed && prev.entities) || {};
  const changedPages = seed ? [] : Object.keys(pages).filter((u) => prevPages[u] !== pages[u]).sort();
  // No entity baseline yet (first run, or the listing was unreadable when it ran): record, never
  // announce, or thousands of long-announced entity pages would all read as new at once.
  const entitySeed = !!entities && (seed || Object.keys(prevEntities).length === 0);
  const entityCandidates = entitySeed || !entities ? []
    : Object.keys(entities).filter((u) => isHtmlPage(u) && prevEntities[u] !== entities[u]).sort();
  return { seed, entitySeed, changedPages, entityCandidates };
}

/** POST urlList in batches; returns [{count, status}] (status 0 = no HTTP answer). */
export async function submit(urls, { fetchImpl = fetch, host = HOST, key = KEY } = {}) {
  const res = [];
  for (let i = 0; i < urls.length; i += BATCH) {
    const chunk = urls.slice(i, i + BATCH);
    let status = 0;
    try {
      const r = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8", "user-agent": UA },
        body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: chunk }),
      });
      status = r.status;
    } catch {
      status = 0;
    }
    res.push({ count: chunk.length, status });
  }
  return res;
}

const accepted = (status) => status === 200 || status === 202;

async function getText(fetchImpl, url, timeoutMs = 30000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetchImpl(url, { headers: { "user-agent": UA }, signal: ctl.signal });
    return { status: r.status, text: r.status === 200 ? await r.text() : "" };
  } catch {
    return { status: 0, text: "" };
  } finally {
    clearTimeout(t);
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}

/** Entity URL -> lastmod from the Function-generated sitemaps, or null when the index is unreadable. */
export async function liveEntities(fetchImpl, host = HOST) {
  const ix = await getText(fetchImpl, `https://${host}/sitemaps/index.xml`, 60000);
  if (ix.status !== 200) return null;
  const kids = sitemapEntries(ix.text).map((e) => e.loc).filter((u) => u.includes("/sitemaps/"));
  const out = {};
  for (const k of kids) {
    const r = await getText(fetchImpl, k, 90000);
    if (r.status !== 200) return null; // a partial listing would read as removals; keep last state
    for (const e of sitemapEntries(r.text)) out[e.loc] = e.lastmod;
  }
  return out;
}

export async function run({ dist, statePath, dryRun = false, fetchImpl = fetch, log = console.log, host = HOST, key = KEY }) {
  const keyFile = path.join(dist, `${key}.txt`);
  if (!fs.existsSync(keyFile) || fs.readFileSync(keyFile, "utf8").trim() !== key) {
    log(`indexnow: SKIP key file ${key}.txt is not in the uploaded tree; submitted=0`);
    return 1;
  }
  const liveKey = await getText(fetchImpl, `https://${host}/${key}.txt`);
  if (liveKey.status !== 200 || liveKey.text.trim() !== key) {
    log(`indexnow: SKIP key file not live (HTTP ${liveKey.status}); submitted=0`);
    return 1;
  }

  const sitemapFile = path.join(dist, "sitemap.xml");
  const listed = fs.existsSync(sitemapFile) ? sitemapEntries(fs.readFileSync(sitemapFile, "utf8")).map((e) => e.loc) : [];
  const pages = {};
  let functionRendered = 0;
  for (const u of listed) {
    if (!isHtmlPage(u)) continue;
    const f = distFileFor(dist, u);
    if (!f) {
      functionRendered++;
      continue;
    }
    pages[u] = fingerprint(fs.readFileSync(f, "utf8"));
  }
  const entities = await liveEntities(fetchImpl, host);

  let prev = null;
  try {
    prev = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    prev = null;
  }
  const p = plan(prev, pages, entities);
  const nextPages = { ...pages };
  const nextEntities = entities ? {} : { ...((prev && prev.entities) || {}) };
  if (entities) {
    // carry forward only what is still listed; a candidate is recorded once it is submitted
    const prevEntities = (prev && prev.schema === SCHEMA && prev.entities) || {};
    for (const [u, lm] of Object.entries(entities)) {
      if (p.entitySeed) nextEntities[u] = lm;
      else if (u in prevEntities && !p.entityCandidates.includes(u)) nextEntities[u] = prevEntities[u];
    }
  }

  let rc = 0;
  let pageNote = "";
  let entityNote = !entities ? " entity_sitemaps=UNREADABLE(state kept)" : p.entitySeed && !p.seed ? " entities=SEEDED(no baseline)" : "";
  if (p.seed) {
    log(`indexnow: SEED no previous state; recorded pages=${Object.keys(pages).length} entities=${entities ? Object.keys(entities).length : 0}; submitted=0`);
  } else {
    if (p.changedPages.length) {
      const r = dryRun ? [] : await submit(p.changedPages, { fetchImpl, host, key });
      if (!dryRun && !r.every((b) => accepted(b.status))) {
        rc = 1;
        // Not accepted: keep the previous fingerprint (or none), so the next deploy retries them.
        for (const u of p.changedPages) {
          if (u in (prev.pages || {})) nextPages[u] = prev.pages[u];
          else delete nextPages[u];
        }
      }
      pageNote = dryRun ? " pages_status=DRY-RUN" : ` pages_status=${r.map((b) => b.status).join(",")}`;
    }
    const toCheck = p.entityCandidates.slice(0, ENTITY_CHECK_CAP);
    const checked = await mapLimit(toCheck, 8, async (u) => ({ u, status: (await getText(fetchImpl, u, 30000)).status }));
    const live = checked.filter((c) => c.status === 200).map((c) => c.u);
    if (live.length) {
      const r = dryRun ? [] : await submit(live, { fetchImpl, host, key });
      if (dryRun || r.every((b) => accepted(b.status))) {
        if (!dryRun) for (const u of live) nextEntities[u] = entities[u];
      } else rc = 1;
      entityNote += dryRun ? " entities_status=DRY-RUN" : ` entities_status=${r.map((b) => b.status).join(",")}`;
    }
    log(
      `indexnow: pages listed=${listed.length} fingerprinted=${Object.keys(pages).length} function_rendered=${functionRendered}` +
      ` changed=${p.changedPages.length} submitted=${dryRun ? 0 : p.changedPages.length}${pageNote}` +
      ` | entities listed=${entities ? Object.keys(entities).length : "?"} new_or_changed=${p.entityCandidates.length}` +
      ` checked=${toCheck.length} live=${live.length} submitted=${dryRun ? 0 : live.length}${entityNote}` +
      (p.changedPages.length ? ` first=${p.changedPages.slice(0, 3).join(" ")}` : ""),
    );
  }
  if (!dryRun) {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    const state = { schema: SCHEMA, updated_at: new Date().toISOString(), host, pages: nextPages, entities: nextEntities };
    fs.writeFileSync(statePath, JSON.stringify(state) + "\n");
  }
  return rc;
}

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const dist = arg("--dist", "dist/client");
  const statePath = arg("--state", ".indexnow-state/state.json");
  run({ dist, statePath, dryRun: process.argv.includes("--dry-run") })
    .then((rc) => process.exit(rc))
    .catch((e) => {
      console.log(`indexnow: FAILED ${e && e.message ? e.message : e}; submitted=0`);
      process.exit(1);
    });
}
