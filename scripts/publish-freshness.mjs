#!/usr/bin/env node
/**
 * publish-freshness.mjs — is what we publish actually being published?
 *
 * machine-contract-guard proves the machine surfaces are REACHABLE and WELL-FORMED. That is
 * not the same as FRESH: a feed that stopped two months ago is still well-formed, and a
 * root.json whose signer silently stopped (09-06 → 09-14, observed in /receipts/root-history.json)
 * still answers 200. This module adds the publish-verification checks, run as section 6 of
 * machine-contract-guard (drift-guard.yml, every 30 min) — no new cron.
 *
 *   a. /sitemap.xml   200, <loc> count >= floor, and a rotating sample of listed URLs answer 200
 *   b. /api/feed.xml  newest <pubDate>/<lastBuildDate>/<updated> no older than feedMaxAgeDays
 *   c. card URLs      /signed/card_index.json n_cards == cards.length; a rotating sample of
 *                     card_url answer 200, parse, and carry the id the index lists
 *   d. /root.json     as_of parses, is not in the future, and is no older than rootMaxAgeHours
 *
 * The floor guards truncation, not identity (a count can hide swaps — sitemap-truth-gate checks
 * names at build). The sample rotates by UTC hour so every URL is visited over a day without
 * fetching all of them every run.
 *
 * Run:  node scripts/publish-freshness.mjs [--host https://councilof.ai]   (standalone)
 *       node scripts/publish-freshness.mjs --selftest                     (offline; proves each check can fail)
 * Exit: 0 fresh · 1 stale or broken.
 */

export const DEFAULTS = Object.freeze({
  sitemapFloor: 350,      // 518 <loc> live on 2026-09-14
  sitemapSample: 8,
  cardSample: 5,
  feedMaxAgeDays: 21,     // newest item 2026-09-12 when written
  rootMaxAgeHours: 72,    // public-root publishes hourly when healthy
  futureSkewMinutes: 10,
});

export function sitemapLocs(xml) {
  return [...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

export function newestFeedDate(xml) {
  const ts = [...String(xml).matchAll(/<(pubDate|lastBuildDate|updated|published)>\s*([^<]+?)\s*<\/\1>/g)]
    .map((m) => Date.parse(m[2]))
    .filter((t) => Number.isFinite(t));
  return ts.length ? Math.max(...ts) : null;
}

export function rotatingSample(items, n, seed) {
  if (!items.length || n <= 0) return [];
  const k = Math.min(n, items.length);
  const start = ((seed % items.length) + items.length) % items.length;
  const step = Math.max(1, Math.floor(items.length / k));
  return Array.from({ length: k }, (_, i) => items[(start + i * step) % items.length]);
}

/** Pure staleness verdicts. Every field that is missing is a failure, never a pass. */
export function assessFreshness({ now, sitemapCount, feedNewest, rootAsOf, opts = DEFAULTS }) {
  const out = [];
  const o = { ...DEFAULTS, ...opts };
  if (!Number.isFinite(sitemapCount)) out.push({ ok: false, msg: "sitemap <loc> count unreadable" });
  else if (sitemapCount < o.sitemapFloor) out.push({ ok: false, msg: `sitemap lists ${sitemapCount} URLs, below the floor ${o.sitemapFloor} (truncated build?)` });
  else out.push({ ok: true, msg: `sitemap lists ${sitemapCount} URLs (floor ${o.sitemapFloor})` });

  if (!Number.isFinite(feedNewest)) out.push({ ok: false, msg: "feed carries no parseable item date" });
  else {
    const days = (now - feedNewest) / 86_400_000;
    if (days > o.feedMaxAgeDays) out.push({ ok: false, msg: `feed newest item is ${days.toFixed(1)} days old (max ${o.feedMaxAgeDays}) — STALE` });
    else out.push({ ok: true, msg: `feed newest item ${days.toFixed(1)} days old (max ${o.feedMaxAgeDays})` });
  }

  const asOf = Date.parse(rootAsOf ?? "");
  if (!Number.isFinite(asOf)) out.push({ ok: false, msg: `root.json as_of unparseable: ${JSON.stringify(rootAsOf)}` });
  else if (asOf - now > o.futureSkewMinutes * 60_000) out.push({ ok: false, msg: `root.json as_of ${rootAsOf} is in the future` });
  else {
    const hours = (now - asOf) / 3_600_000;
    if (hours > o.rootMaxAgeHours) out.push({ ok: false, msg: `root.json as_of ${rootAsOf} is ${hours.toFixed(1)} h old (max ${o.rootMaxAgeHours}) — STALE: the root publisher has stopped` });
    else out.push({ ok: true, msg: `root.json as_of ${rootAsOf} (${hours.toFixed(1)} h old, max ${o.rootMaxAgeHours})` });
  }
  return out;
}

/**
 * Network half. `get(url)` → {status, body} (machine-contract-guard's retrying fetch).
 * `rehost` maps canonical-origin URLs onto --host. Reports through pass/fail.
 */
export async function runPublishChecks({ get, host, rehost = (u) => u, pass, fail, now = Date.now(), opts = {} }) {
  const o = { ...DEFAULTS, ...opts };
  const seed = Math.floor(now / 3_600_000);
  let sitemapCount = NaN, feedNewest = null, rootAsOf = null;

  try {
    const { status, body } = await get(host + "/sitemap.xml");
    if (status !== 200) fail(`/sitemap.xml returned HTTP ${status}`);
    else {
      const locs = sitemapLocs(body);
      sitemapCount = locs.length;
      for (const u of rotatingSample(locs, o.sitemapSample, seed)) {
        try {
          const r = await get(rehost(u));
          if (r.status !== 200) fail(`sitemap URL not served: ${u} → HTTP ${r.status}`);
          else pass(`sitemap sample ${u}`);
        } catch (e) { fail(`sitemap URL unreachable: ${u} — ${e.message}`); }
      }
    }
  } catch (e) { fail(`/sitemap.xml fetch error: ${e.message}`); }

  try {
    const { status, body } = await get(host + "/api/feed.xml");
    if (status === 200) feedNewest = newestFeedDate(body);
    else fail(`/api/feed.xml returned HTTP ${status} (freshness unreadable)`);
  } catch (e) { fail(`/api/feed.xml fetch error: ${e.message}`); }

  try {
    const { status, body } = await get(host + "/signed/card_index.json");
    if (status !== 200) fail(`/signed/card_index.json returned HTTP ${status}`);
    else {
      const idx = JSON.parse(body);
      const cards = Array.isArray(idx.cards) ? idx.cards : [];
      if (!cards.length) fail(`/signed/card_index.json lists no cards`);
      else if (idx.n_cards !== cards.length) fail(`/signed/card_index.json n_cards ${idx.n_cards} != cards[] ${cards.length}`);
      else pass(`/signed/card_index.json n_cards == cards[] == ${cards.length}`);
      for (const e of rotatingSample(cards, o.cardSample, seed)) {
        const url = host + e.card_url;
        try {
          const r = await get(url);
          if (r.status !== 200) { fail(`card URL not served: ${e.card_url} → HTTP ${r.status}`); continue; }
          let card; try { card = JSON.parse(r.body); } catch { card = null; }
          if (!card) fail(`card URL is not JSON: ${e.card_url}`);
          else if (card.id !== e.card) fail(`card URL ${e.card_url} carries id ${card.id}, index lists ${e.card}`);
          else pass(`card sample ${e.card_url}`);
        } catch (err) { fail(`card URL unreachable: ${e.card_url} — ${err.message}`); }
      }
    }
  } catch (e) { fail(`/signed/card_index.json error: ${e.message}`); }

  try {
    const { status, body } = await get(host + "/root.json");
    if (status !== 200) fail(`/root.json returned HTTP ${status}`);
    else rootAsOf = JSON.parse(body).as_of ?? null;
  } catch (e) { fail(`/root.json error: ${e.message}`); }

  for (const v of assessFreshness({ now, sitemapCount, feedNewest, rootAsOf, opts: o })) (v.ok ? pass : fail)(v.msg);
}

function selftest() {
  const now = Date.parse("2026-09-14T12:00:00Z");
  const fresh = { now, sitemapCount: 518, feedNewest: Date.parse("2026-09-12T13:30:00Z"), rootAsOf: "2026-09-14T03:12:56Z" };
  const bad = (patch) => assessFreshness({ ...fresh, ...patch }).filter((v) => !v.ok).length;
  const cases = [
    ["all fresh passes", assessFreshness(fresh).every((v) => v.ok)],
    ["truncated sitemap fails", bad({ sitemapCount: 12 }) === 1],
    ["unreadable sitemap fails", bad({ sitemapCount: NaN }) === 1],
    ["stale feed fails", bad({ feedNewest: Date.parse("2026-07-01T00:00:00Z") }) === 1],
    ["dateless feed fails", bad({ feedNewest: null }) === 1],
    ["root stale 7 days fails (the 09-06→09-14 gap)", bad({ rootAsOf: "2026-09-06T23:49:21Z" }) === 1],
    ["root as_of missing fails", bad({ rootAsOf: undefined }) === 1],
    ["root as_of in the future fails", bad({ rootAsOf: "2026-09-15T12:00:00Z" }) === 1],
    ["feed date parse", newestFeedDate("<rss><channel><item><pubDate>Sat, 12 Sep 2026 13:30:00 GMT</pubDate></item><item><pubDate>Fri, 11 Sep 2026 10:50:00 GMT</pubDate></item></channel></rss>") === Date.parse("2026-09-12T13:30:00Z")],
    ["loc parse", sitemapLocs("<urlset><url><loc>https://a/x</loc></url><url><loc> https://a/y </loc></url></urlset>").join() === "https://a/x,https://a/y"],
    ["rotating sample is bounded and in range", (() => { const s = rotatingSample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4, 123457); return s.length === 4 && s.every((x) => x >= 1 && x <= 10); })()],
    ["rotating sample moves with the seed", rotatingSample([...Array(100).keys()], 3, 1).join() !== rotatingSample([...Array(100).keys()], 3, 2).join()],
  ];
  let failed = 0;
  for (const [name, ok] of cases) { console.log(`  ${ok ? "✓" : "✗"} ${name}`); if (!ok) failed++; }
  if (failed) { console.error(`publish-freshness selftest: FAIL (${failed})`); process.exit(1); }
  console.log(`publish-freshness selftest: PASS (${cases.length} cases)`);
}

const isMain = import.meta.url === new URL(process.argv[1] ?? "", "file://").href;
if (isMain) {
  if (process.argv.includes("--selftest")) selftest();
  else {
    const i = process.argv.indexOf("--host");
    const host = (i > 0 ? process.argv[i + 1] : "https://councilof.ai").replace(/\/$/, "");
    const fails = [];
    const get = async (url) => { const r = await fetch(url, { headers: { "user-agent": "publish-freshness (+https://councilof.ai)" }, redirect: "follow" }); return { status: r.status, body: await r.text() }; };
    await runPublishChecks({
      get, host,
      rehost: (u) => (u.startsWith("https://councilof.ai") ? host + u.slice("https://councilof.ai".length) : u),
      pass: (m) => console.log(`  ✓ ${m}`),
      fail: (m) => { console.log(`  ✗ ${m}`); fails.push(m); },
    });
    if (fails.length) { console.error(`PUBLISH-FRESHNESS: FAIL — ${fails.length}`); process.exit(1); }
    console.log("PUBLISH-FRESHNESS: PASS");
  }
}
