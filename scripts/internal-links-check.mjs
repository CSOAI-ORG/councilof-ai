#!/usr/bin/env node
/**
 * internal-links-check — list the internal links on a public surface that a reader cannot follow.
 *
 * WHY THIS EXISTS. On 2026-10-13 the outward gate (scripts/outward-gate/outward_gate.py, check
 * hygiene.internal_links) failed two surfaces for one reason: a URL TEMPLATE was published in link
 * form. /services/ rendered <a href="/api/wrapper?id=<wrapped-symbol:chain>&preview=1"> (HTTP 400)
 * and /llms.txt printed https://councilof.ai/mcp-servers/<host>/ and four more as bare URLs (404,
 * 400). A template is documentation. A link is a promise that the address answers. The gate reads
 * the deployed site, so it could only say so after the fact; this reads the producers' output
 * before it ships.
 *
 * TWO FINDINGS, never merged:
 *   PLACEHOLDER  the URL still carries a template slot: <…> or {…}, raw or percent-encoded.
 *                Decided from the bytes alone. No network, so it is safe in CI.
 *   DEAD         the URL was fetched and did not answer 200 (or 402, a paid door) within one
 *                redirect. That is the gate's own rule. It needs --live, and a link that could
 *                not be fetched counts as failing rather than passing.
 *
 * Internal means https://councilof.ai. Links are extracted the way the gate extracts them: bare
 * https://councilof.ai… tokens in a text surface, href="…" resolved against the origin in HTML.
 * The one difference is deliberate: a text token is kept through its <…> slot instead of being
 * cut at the first ">", so the report names the template that was written, not a stub of it.
 *
 *   node scripts/internal-links-check.mjs                 # public/llms.txt + public/llms-full.txt, PLACEHOLDER only
 *   node scripts/internal-links-check.mjs --live          # the same two files, and fetch every internal link in them
 *   node scripts/internal-links-check.mjs --live https://councilof.ai/services/ https://councilof.ai/llms.txt
 *   node scripts/internal-links-check.mjs --json …        # one JSON document instead of lines
 *   node scripts/internal-links-check.mjs --selftest
 *
 * Exit 0: zero failing links. Exit 1: at least one, each listed. Exit 2: a surface could not be
 * read, which is not a pass.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ORIGIN = "https://councilof.ai";
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** The llms producer (scripts/llms-txt.mjs) writes exactly these two files. */
export const DEFAULT_TARGETS = ["public/llms.txt", "public/llms-full.txt"];

/** A template slot left in a URL: angle brackets or braces, raw or percent-encoded. */
const SLOT = /[<>{}]|%3C|%3E|%7B|%7D/i;
export const isPlaceholderLink = (url) => SLOT.test(String(url));

/** Cut a token at the first ">" that closes nothing, so an autolink <https://…> ends where it should. */
function cutAtUnopenedClose(token) {
  let depth = 0;
  for (let i = 0; i < token.length; i++) {
    if (token[i] === "<") depth++;
    else if (token[i] === ">") {
      if (depth === 0) return token.slice(0, i);
      depth--;
    }
  }
  return token;
}

/** What the outward gate would request for this token: it stops at the first ">". */
export const gateForm = (url) => String(url).split(">")[0].replace(/[).,;]+$/, "");

/** Internal links in a text surface (llms.txt). Sorted, unique. */
export function linksInText(text, origin = ORIGIN) {
  const esc = origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(esc + "[^\\s)\\]\"'`]*", "g");
  const out = new Set();
  for (const m of String(text).matchAll(re)) {
    const url = cutAtUnopenedClose(m[0]).replace(/[).,;]+$/, "");
    // "https://councilof.ai.example" is another host, not this origin with a path.
    const next = url.charAt(origin.length);
    if (next === "" || next === "/" || next === "?" || next === "#") out.add(url);
  }
  return [...out].sort();
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };
const unescapeHtml = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name) => {
    const k = name.toLowerCase();
    if (k in ENTITIES) return ENTITIES[k];
    if (k.startsWith("#x")) return String.fromCodePoint(parseInt(k.slice(2), 16));
    if (k.startsWith("#")) return String.fromCodePoint(parseInt(k.slice(1), 10));
    return whole;
  });

/** Internal links in an HTML surface: every href, entity-decoded, resolved against the origin. */
export function linksInHtml(html, origin = ORIGIN) {
  const host = new URL(origin).hostname;
  const out = new Set();
  for (const m of String(html).matchAll(/href=["']([^"'#]+)/gi)) {
    let u = unescapeHtml(m[1]).trim();
    if (/^(mailto:|tel:|javascript:|data:)/i.test(u) || u.includes("/cdn-cgi/")) continue;
    if (u.startsWith("//")) u = "https:" + u;
    let full;
    try {
      full = new URL(u, origin + "/");
    } catch {
      continue;
    }
    if (full.hostname !== host || !/^https?:$/.test(full.protocol)) continue;
    out.add(`https://${full.host}${full.pathname || "/"}${full.search}`);
  }
  return [...out].sort();
}

export const looksLikeHtml = (body) => /^\s*(<!doctype html|<html[\s>])/i.test(String(body).slice(0, 2000));
export const linksIn = (body, origin = ORIGIN) => (looksLikeHtml(body) ? linksInHtml(body, origin) : linksInText(body, origin));

/** The offline half: every internal link that is still a template. */
export function placeholderLinks(body, origin = ORIGIN) {
  return linksIn(body, origin).filter(isPlaceholderLink);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET with manual redirects so hops are counted, the way the gate counts them. */
async function fetchOnce(url, ua) {
  const hops = [];
  let cur = url;
  for (let i = 0; i < 8; i++) {
    const r = await fetch(cur, { redirect: "manual", headers: { "user-agent": ua, accept: "*/*" }, signal: AbortSignal.timeout(30000) });
    const loc = r.headers.get("location");
    try { await r.body?.cancel(); } catch { /* the status is all we read */ }
    if ([301, 302, 303, 307, 308].includes(r.status) && loc) {
      cur = new URL(loc, cur).href;
      hops.push(r.status);
      continue;
    }
    return { status: r.status, hops: hops.length, final: cur };
  }
  return { status: 0, hops: hops.length, final: cur, error: "more than 8 redirects" };
}

export async function fetchLink(url, ua) {
  let last;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      last = await fetchOnce(url, ua);
    } catch (e) {
      last = { status: 0, hops: 0, final: url, error: `${e.name}: ${e.message}` };
    }
    // One retry for an answer that says "not now" rather than "not here".
    if (last.status !== 0 && last.status !== 429 && last.status < 500) break;
    if (attempt === 0) await sleep(2000);
  }
  return last;
}

/** The gate's rule: 200, or 402 on a paid door, within one redirect. */
export const answers = (res) => (res.status === 200 || res.status === 402) && res.hops <= 1;

const describe = (res) => `${res.status || res.error}${res.hops ? ` after ${res.hops} redirect${res.hops === 1 ? "" : "s"}` : ""}`;

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
      await sleep(150);
    }
  }));
  return out;
}

async function readTarget(target, ua) {
  if (/^https?:\/\//i.test(target)) {
    const r = await fetch(target, { headers: { "user-agent": ua, accept: "*/*" }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  }
  return fs.readFileSync(path.isAbsolute(target) ? target : path.join(REPO, target), "utf8");
}

/** Check one surface. `live` adds the DEAD half. */
export async function checkSurface(target, { live = false, ua = "CSOAI-internal-links-check/0.1", origin = ORIGIN, concurrency = 4 } = {}) {
  const body = await readTarget(target, ua);
  const links = linksIn(body, origin);
  const failing = [];
  const templates = links.filter(isPlaceholderLink);
  const real = links.filter((u) => !isPlaceholderLink(u));
  let gateReads = new Map();
  if (live) {
    // Reported beside the template so the finding can be matched to the gate's own line.
    const fetched = await pool(templates, concurrency, (u) => fetchLink(gateForm(u), ua));
    gateReads = new Map(templates.map((u, i) => [u, fetched[i]]));
  }
  for (const u of templates) {
    const g = gateReads.get(u);
    failing.push({ url: u, finding: "PLACEHOLDER", detail: "a template slot is published as a link" + (g ? `; the gate requests ${gateForm(u)} -> ${describe(g)}` : "") });
  }
  let fetched = 0;
  if (live) {
    const results = await pool(real, concurrency, (u) => fetchLink(u, ua));
    fetched = results.length;
    results.forEach((res, i) => {
      if (!answers(res)) failing.push({ url: real[i], finding: "DEAD", detail: describe(res) });
    });
  }
  return { target, kind: looksLikeHtml(body) ? "html" : "text", links: links.length, fetched, live, failing };
}

const SELFTEST = [
  // [name, body, expected placeholder links]
  ["the five the gate named in /llms.txt",
    "- MCP servers: https://councilof.ai/mcp-servers/ — https://councilof.ai/mcp-servers/<host>/\n" +
    "- A2A: https://councilof.ai/agent-cards/<host>/\n- x402: https://councilof.ai/x402/<door-or-host>/\n" +
    "- assets: https://councilof.ai/stablecoins/<asset>/<chain>/\n" +
    "  - [Wrapper](https://councilof.ai/api/wrapper?id=usdc.e:arbitrum) · free preview: https://councilof.ai/api/wrapper?id=<wrapped-symbol:chain>&preview=1",
    ["https://councilof.ai/agent-cards/<host>/", "https://councilof.ai/api/wrapper?id=<wrapped-symbol:chain>&preview=1",
      "https://councilof.ai/mcp-servers/<host>/", "https://councilof.ai/stablecoins/<asset>/<chain>/", "https://councilof.ai/x402/<door-or-host>/"]],
  ["a slot with spaces is still a slot (the gate fetched it and got a 200, so it never named it)",
    "free preview: https://councilof.ai/api/measurement/fresh-capsule?endpoint=<https MCP URL>&dimension=TOOLS&preview=1",
    ["https://councilof.ai/api/measurement/fresh-capsule?endpoint=<https"]],
  ["the same templates as code text are not links",
    "- one page each: https://councilof.ai/mcp-servers/ — pattern `/mcp-servers/<host>/`\n  free preview (template): `GET /api/wrapper?id=<wrapped-symbol:chain>&preview=1`",
    []],
  ["an autolink and a markdown link are whole links, not templates",
    "See <https://councilof.ai/census/> and [Verify](https://councilof.ai/gspc-verify). Also https://councilof.ai/api/gspc?axis=a%2Fb, then prose.",
    []],
  ["braces count, and so does an encoded slot",
    "https://councilof.ai/axis/{axis} and https://councilof.ai/api/rwa/evidence?asset=%3Csymbol%3E&preview=1",
    ["https://councilof.ai/api/rwa/evidence?asset=%3Csymbol%3E&preview=1", "https://councilof.ai/axis/{axis}"]],
  ["HTML: the href /services/ rendered, entity-encoded as the edge serves it",
    '<!doctype html><html><body><a href="https://councilof.ai/api/wrapper?id=&lt;wrapped-symbol:chain&gt;&amp;preview=1">Free preview →</a>' +
    '<a href="/gspc-verify/">ok</a><a href="mailto:x@councilof.ai">m</a><a href="https://example.org/<x>">ext</a></body></html>',
    ["https://councilof.ai/api/wrapper?id=%3Cwrapped-symbol:chain%3E&preview=1"]],
  ["HTML: the same template shown as code text is not a link",
    "<!doctype html><html><body><code>https://councilof.ai/api/wrapper?id=&lt;wrapped-symbol:chain&gt;&amp;preview=1</code><a href=\"/api/wrapper?id=usdc.e:arbitrum&amp;preview=1\">Free preview →</a></body></html>",
    []],
];

export function selftest() {
  const bad = [];
  for (const [name, body, want] of SELFTEST) {
    const got = placeholderLinks(body);
    if (JSON.stringify(got) !== JSON.stringify([...want].sort())) bad.push(`${name}\n    want ${JSON.stringify(want)}\n    got  ${JSON.stringify(got)}`);
  }
  if (gateForm("https://councilof.ai/mcp-servers/<host>/") !== "https://councilof.ai/mcp-servers/<host") bad.push("gateForm must stop at the first '>'");
  if (!answers({ status: 402, hops: 1 }) || answers({ status: 200, hops: 2 }) || answers({ status: 404, hops: 0 }) || answers({ status: 0, hops: 0 })) bad.push("answers() is not the gate's rule");
  return bad;
}

async function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const args = argv.filter((a) => !a.startsWith("--"));
  if (flags.has("--selftest")) {
    const bad = selftest();
    for (const b of bad) console.error(`✖ ${b}`);
    console.log(bad.length ? `selftest: ${bad.length} failing` : `selftest: ${SELFTEST.length + 2} cases pass`);
    return bad.length ? 1 : 0;
  }
  const live = flags.has("--live");
  const targets = args.length ? args : DEFAULT_TARGETS;
  const reports = [];
  let unread = 0;
  for (const target of targets) {
    try {
      reports.push(await checkSurface(target, { live }));
    } catch (e) {
      unread++;
      reports.push({ target, unread: `${e.name}: ${e.message}` });
    }
  }
  const failing = reports.reduce((n, r) => n + (r.failing ? r.failing.length : 0), 0);
  if (flags.has("--json")) {
    console.log(JSON.stringify({ schema: "csoai.internal-links-check/1", checked_at: new Date().toISOString(), origin: ORIGIN, live, failing, unread, surfaces: reports }, null, 2));
  } else {
    for (const r of reports) {
      if (r.unread) {
        console.log(`UNREAD ${r.target}: ${r.unread}. Not checked; this is not a pass.`);
        continue;
      }
      const scope = r.live ? `${r.fetched} fetched` : "placeholders only, nothing fetched";
      console.log(`${r.failing.length ? "✖" : "✓"} ${r.target} (${r.kind}): ${r.links} internal links, ${scope}, ${r.failing.length} failing`);
      for (const f of r.failing) console.log(`    ${f.finding}  ${f.url}  — ${f.detail}`);
    }
    console.log(`${failing} failing internal link${failing === 1 ? "" : "s"} across ${reports.length} surface${reports.length === 1 ? "" : "s"}` +
      (live ? "" : " (offline: add --live to fetch each link)") + (unread ? `; ${unread} surface${unread === 1 ? "" : "s"} unread` : ""));
  }
  return unread ? 2 : failing ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main(process.argv.slice(2)));
}
