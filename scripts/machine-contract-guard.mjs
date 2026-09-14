#!/usr/bin/env node
/**
 * machine-contract-guard.mjs — asserts the MACHINE-FACING contracts of the live site hold.
 *
 * WHY THIS EXISTS: the human pages have drift-guard and persona-gauntlet, but the machine
 * surfaces rot silently — llms.txt advertising dead links, did.json serviceEndpoints pointing
 * at 404s, banned internal names leaking into API JSON that no human ever reads. An external
 * audit found exactly that. This guard converts the audit into cron.
 *
 * Checks:
 *   1. /llms.txt — every absolute https:// URL it advertises must end HTTP 200 (redirects followed).
 *   2. /.well-known/did.json — every serviceEndpoint must end HTTP 200 (redirects followed).
 *   3. /api/gspc, /api/reported, /.well-known/agent.json, /.well-known/agent-card.json —
 *      raw JSON scanned case-insensitively for banned internal strings. The literal path
 *      string "sov-arena" is exempt (legacy alias kept for consumers).
 *   4. /api/feed.xml — must be 200 and well-formed (balanced <rss>/<channel>).
 *   5. did.json split-brain: csoai.org (authoritative) and the mirror carry the same keys.
 *   6. Publish verification (scripts/publish-freshness.mjs): sitemap count + sampled URLs 200,
 *      feed freshness, sampled signed-card URLs 200 with the indexed id, root.json as_of freshness.
 *
 * It reads NOTHING secret and changes NOTHING. It only fetches public URLs and asserts.
 *
 * Run: node scripts/machine-contract-guard.mjs [--host https://councilof.ai]
 * Exit 0 = contracts hold; exit 1 = at least one contract broken (details printed).
 */

import { runPublishChecks } from "./publish-freshness.mjs";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const HOST = (arg("host", "https://councilof.ai")).replace(/\/$/, "");
const CANON_ORIGIN = "https://councilof.ai";
const UA = "Mozilla/5.0 (machine-contract-guard; +https://councilof.ai)";

// Banned internal strings — none of these may appear in machine-readable JSON surfaces.
// " bft " is space-delimited on purpose (avoids false hits inside unrelated words).
const BANNED = ["sov3", "sov6", "sov34", "sovos", "sovereign", "ceasai", "byzantine", " bft ", "defoneos", "33-agent"];
// The literal path string "sov-arena" is a legacy alias kept for consumers — exempt it
// before scanning so /api/sov-arena/... path references never trip the sweep.
const EXEMPT = /sov-arena/gi;

/**
 * A URL carrying a placeholder is documentation, not a contract.
 * `/api/receipts?payer=0x…` is llms.txt telling a reader what shape to send; the ellipsis is
 * not an address, so the door correctly answers 400 and the guard read that as a dead link.
 * Fetching it asserts nothing about the live site.
 */
const PLACEHOLDER = /[\u2026<>{}]|\.\.\./;

const fails = [];
const pass = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => { console.log(`  ✗ ${m}`); fails.push(m); };

async function get(url) {
  // Transient upstream 5xx is not a broken contract. On 2026-09-10 a Zenodo HTTP 504
  // on https://doi.org/10.5281/zenodo.21991104 — alive and serving 200 minutes later —
  // turned this whole guard red. A third-party gateway blip says nothing about whether
  // the live site holds what it advertises, so retry with backoff and only fail when
  // every attempt fails. The assertion itself is unchanged: the link must still end at
  // HTTP 200 (or the paid door's 402). 4xx answers are authoritative and never retried.
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
      if (r.status < 500 || attempt === 2) {
        const body = await r.text();
        return { status: r.status, body };
      }
      await r.arrayBuffer(); // drain before retrying
    } catch (e) {
      lastErr = e;
      if (attempt === 2) throw e;
    }
    await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
  }
  throw lastErr;
}
// When --host points at staging, test the staging copy of canonical-origin URLs.
const rehost = (url) => url.startsWith(CANON_ORIGIN) ? HOST + url.slice(CANON_ORIGIN.length) : url;

console.log(`MACHINE-CONTRACT — ${HOST}\n`);

// 1. llms.txt: every advertised absolute link must resolve.
try {
  const { status, body } = await get(HOST + "/llms.txt");
  if (status !== 200) fail(`/llms.txt returned HTTP ${status}`);
  else {
    // The URL pattern stops at "<", so `?id=<pair>` would be read as `?id=` and fetched as a
    // real request (a correct 400). Keep the character that ended the match when it opens a
    // placeholder, so PLACEHOLDER below can see it and skip the documentation URL.
    const urls = [...new Set([...body.matchAll(/https:\/\/[^\s)\]"'<>]+/g)].map((m) => {
      const u = m[0].replace(/[.,;:]+$/, "");
      const next = body[m.index + m[0].length] || "";
      return u === m[0] && /[<{\u2026]/.test(next) ? u + next : u;
    }))];
    if (!urls.length) fail(`/llms.txt advertises no absolute https:// URLs (parse regression?)`);
    for (const u of urls) {
      if (PLACEHOLDER.test(u)) { pass(`/llms.txt placeholder, not fetched: ${u}`); continue; }
      try {
        const r = await get(rehost(u));
        if (r.status === 402) pass(`/llms.txt link ${u} → 402, the paid door issuing its challenge`);
        else if (r.status !== 200) fail(`/llms.txt link dead: ${u} → HTTP ${r.status}`);
        else pass(`/llms.txt link ${u}`);
      } catch (e) { fail(`/llms.txt link unreachable: ${u} — ${e.message}`); }
    }
  }
} catch (e) { fail(`/llms.txt fetch error: ${e.message}`); }

// 2. did.json: every serviceEndpoint must resolve.
try {
  const { status, body } = await get(HOST + "/.well-known/did.json");
  if (status !== 200) fail(`/.well-known/did.json returned HTTP ${status}`);
  else {
    let did; try { did = JSON.parse(body); } catch { did = null; }
    if (!did) fail(`/.well-known/did.json is not JSON`);
    else {
      const eps = (did.service || []).map((s) => s.serviceEndpoint).filter(Boolean);
      if (!eps.length) fail(`did.json declares no serviceEndpoints (contract shrank?)`);
      for (const ep of eps) {
        try {
          const r = await get(rehost(ep));
          if (r.status === 402) pass(`did.json serviceEndpoint ${ep} → 402, the paid door issuing its challenge`);
          else if (r.status !== 200) fail(`did.json serviceEndpoint dead: ${ep} → HTTP ${r.status}`);
          else pass(`did.json serviceEndpoint ${ep}`);
        } catch (e) { fail(`did.json serviceEndpoint unreachable: ${ep} — ${e.message}`); }
      }
    }
  }
} catch (e) { fail(`/.well-known/did.json fetch error: ${e.message}`); }

// 3. Banned-string sweep over the machine JSON surfaces.
for (const path of ["/api/gspc", "/api/reported", "/api/regulation", "/api/corrections", "/api/cross", "/.well-known/agent.json", "/.well-known/agent-card.json", "/.well-known/scitt.json"]) {
  try {
    const { status, body } = await get(HOST + path);
    if (status !== 200) { fail(`${path} returned HTTP ${status}`); continue; }
    const scan = body.replace(EXEMPT, "\0alias\0").toLowerCase();
    const hits = BANNED.filter((s) => scan.includes(s));
    if (hits.length) fail(`${path} carries banned string(s): ${hits.map((h) => JSON.stringify(h)).join(", ")}`);
    else pass(`${path} clean of banned strings`);
  } catch (e) { fail(`${path} fetch error: ${e.message}`); }
}

// 4. feed.xml: 200 + well-formed (balanced <rss>/<channel>).
try {
  const { status, body } = await get(HOST + "/api/feed.xml");
  if (status !== 200) fail(`/api/feed.xml returned HTTP ${status}`);
  else {
    const count = (re) => (body.match(re) || []).length;
    const rssOpen = count(/<rss[\s>]/g), rssClose = count(/<\/rss>/g);
    const chOpen = count(/<channel[\s>]/g), chClose = count(/<\/channel>/g);
    if (!rssOpen || rssOpen !== rssClose) fail(`/api/feed.xml malformed: <rss> ${rssOpen} open / ${rssClose} close`);
    else if (!chOpen || chOpen !== chClose) fail(`/api/feed.xml malformed: <channel> ${chOpen} open / ${chClose} close`);
    else pass(`/api/feed.xml 200 and well-formed (<rss>/<channel> balanced)`);
  }
} catch (e) { fail(`/api/feed.xml fetch error: ${e.message}`); }

// 5. DID split-brain check: did:web:csoai.org is ANCHORED at csoai.org — that copy is
// authoritative. The councilof.ai mirror must carry the same verificationMethod set.
// (2026-08-19: the mirror was green while the authoritative root served an orphan doc
// for hours — signing correctly fail-closed. This check makes that split loud.)
try {
  const kids = async (host) => {
    const { status, body } = await get(host + "/.well-known/did.json");
    if (status !== 200) throw new Error(`HTTP ${status}`);
    return JSON.parse(body).verificationMethod.map((m) => m.id).sort().join(",");
  };
  const root = await kids("https://csoai.org");
  const mirror = await kids(HOST === "https://csoai.org" ? "https://councilof.ai" : HOST);
  if (root !== mirror) fail(`DID split-brain: csoai.org keys [${root}] != mirror keys [${mirror}] — the authoritative root disagrees with the mirror`);
  else pass(`did.json consistent across csoai.org (authoritative) and the mirror: ${root}`);
} catch (e) { fail(`DID consistency check error: ${e.message}`); }

// 6. Publish verification: reachable is not the same as FRESH. A well-formed feed can have
// stopped weeks ago and a signed root.json can still answer 200 after its publisher stopped.
console.log("\n  — publish verification —");
try {
  await runPublishChecks({ get, host: HOST, rehost, pass, fail });
} catch (e) { fail(`publish verification error: ${e.message}`); }

console.log("");
if (fails.length) {
  console.error(`MACHINE-CONTRACT: FAIL — ${fails.length} broken contract(s). The machine surfaces do not hold what they advertise.`);
  process.exit(1);
}
console.log(`MACHINE-CONTRACT: PASS — llms.txt links, did.json endpoints, JSON surfaces, feed, and publish freshness all hold.`);
