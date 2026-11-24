#!/usr/bin/env node
/**
 * structured-data-gate — the three JSON-LD nodes answer engines actually read must EXIST,
 * PARSE, and say what the live artifacts say.
 *
 * WHY. Structured data is the one surface where a wrong number is repeated by machines at
 * scale and never re-checked, so it deserves the same treatment as any other published count:
 * derived, not typed. Three nodes are load-bearing here:
 *
 *   Organization  (/)          — who we are; must carry the real Companies House identifier
 *   Dataset       (/)          — the board as a citable dataset; must point at a URL that 200s
 *   FAQPage       (/honesty/)  — the page that exists to state what we have NOT measured
 *
 * It runs over a BUILT tree (dist/client) or the prerendered public/ tree, and it fails closed:
 * a node that is missing, unparseable, or points at a dead URL is a failure, never a skip.
 *
 *   node scripts/structured-data-gate.mjs [dir]        # default dist/client
 *   node scripts/structured-data-gate.mjs --selftest   # prove the checks can fail
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SELFTEST = process.argv.includes("--selftest");
const DIR = resolve(REPO, process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "dist/client");

const LD = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Every JSON-LD node on a page, flattened through @graph. Unparseable blocks are REPORTED. */
export function nodesIn(html, onBadBlock = () => {}) {
  const out = [];
  for (const m of html.matchAll(LD)) {
    let parsed;
    try { parsed = JSON.parse(m[1].trim()); }
    catch (e) { onBadBlock(e.message); continue; }
    for (const n of Array.isArray(parsed) ? parsed : [parsed]) {
      out.push(n);
      for (const g of n["@graph"] || []) out.push(g);
    }
  }
  return out;
}
const typesOf = (n) => (Array.isArray(n["@type"]) ? n["@type"] : [n["@type"]]).filter(Boolean);
export const hasType = (nodes, t) => nodes.filter((n) => typesOf(n).includes(t));

const ORIGIN = "https://councilof.ai";

/** Exact-source 3xx rules of a _redirects file: source path -> target. Splat rules are skipped. */
export function redirectSources(text) {
  const out = new Map();
  for (const raw of String(text).split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [from, to, code] = line.split(/\s+/);
    if (!from || !to || !from.startsWith("/") || from.includes("*") || from.includes(":")) continue;
    const c = Number(code || 302);
    if (c >= 300 && c < 400) out.set(from, to);
  }
  return out;
}

/**
 * Why the Dataset's `url` is not a page this site serves, or null when it is. The url must be a
 * councilof.ai page present in the built tree, and no 3xx rule may send that exact path elsewhere.
 * Measured 2026-11-17: the home-page Dataset named /gspc-scoreboard, which public/_redirects 308s
 * to /dashboard?tab=board — the header above promised "must point at a URL that 200s" and nothing
 * checked it.
 */
export function datasetUrlProblem(url, redirects, pageExists) {
  let u;
  try { u = new URL(url); } catch { return `Dataset url is not a URL: ${JSON.stringify(url)}`; }
  if (u.origin !== ORIGIN) return `Dataset url ${url} is not a ${ORIGIN} page`;
  const p = u.pathname;
  const to = redirects.get(p);
  if (to) return `Dataset url ${url} is redirected (${p} -> ${to}) by _redirects`;
  if (!pageExists(p)) return `Dataset url ${url} names no page in the built tree`;
  return null;
}

if (SELFTEST) {
  let bad = 0;
  const must = (label, cond) => { if (!cond) { console.error(`✖ selftest: ${label}`); bad++; } };
  const page = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"CSOAI Ltd"}</script>`;
  must("finds a node it should find", hasType(nodesIn(page), "Organization").length === 1);
  must("does not invent a node that is absent", hasType(nodesIn(page), "FAQPage").length === 0);
  must("flattens @graph", hasType(nodesIn(`<script type="application/ld+json">{"@graph":[{"@type":"Dataset"}]}</script>`), "Dataset").length === 1);
  must("handles a combined @type array", hasType(nodesIn(`<script type="application/ld+json">{"@type":["SoftwareApplication","Dataset"]}</script>`), "Dataset").length === 1);
  let reported = 0;
  nodesIn(`<script type="application/ld+json">{ not json </script>`, () => reported++);
  must("REPORTS an unparseable block instead of swallowing it", reported === 1);
  const rules = redirectSources("/gspc-scoreboard  /dashboard?tab=board  308\n/board  /board/  308\n/x/*  /y/:splat  301\n");
  const exists = (p) => p === "/board/" || p === "/gspc-scoreboard";
  must("refuses a Dataset url that a _redirects rule sends elsewhere",
    /redirected/.test(datasetUrlProblem("https://councilof.ai/gspc-scoreboard", rules, exists) || ""));
  must("accepts the served slash form of a page whose bare form 308s to it",
    datasetUrlProblem("https://councilof.ai/board/", rules, exists) === null);
  must("refuses a Dataset url on another host or with no built page",
    datasetUrlProblem("https://example.org/board/", rules, exists) !== null &&
    datasetUrlProblem("https://councilof.ai/nope/", rules, exists) !== null);
  if (bad) { console.error(`✖ structured-data-gate selftest FAILED (${bad})`); process.exit(1); }
  console.log("✓ structured-data-gate selftest: 8/8 — it can find, can refuse, and can report");
  process.exit(0);
}

if (!existsSync(DIR)) {
  console.error(`structured-data-gate: no such tree ${DIR} — build first.`);
  process.exit(2);
}

const read = (rel) => {
  for (const c of [join(DIR, rel, "index.html"), join(DIR, `${rel}.html`), join(DIR, rel)]) {
    if (existsSync(c) && !c.endsWith("/")) { try { return readFileSync(c, "utf8"); } catch { /* dir */ } }
  }
  return null;
};

let faqSeen = 0;
const failures = [];
const fail = (where, why) => failures.push(`${where}: ${why}`);

// --- / : Organization + Dataset ---------------------------------------------
const home = read("index.html") || read("");
if (!home) fail("/", "no index.html in the built tree");
else {
  const nodes = nodesIn(home, (m) => fail("/", `unparseable ld+json block (${m})`));
  const org = hasType(nodes, "Organization")[0];
  if (!org) fail("/", "no Organization node");
  else if (!JSON.stringify(org).includes("16939677"))
    fail("/", "Organization carries no Companies House identifier (16939677)");

  const ds = hasType(nodes, "Dataset")[0];
  if (!ds) fail("/", "no Dataset node — the board is not offered as a citable dataset");
  else {
    const urls = JSON.stringify(ds).match(/https?:\/\/[^"\\ ]+/g) || [];
    if (!urls.some((u) => /\/(root\.json|api\/gspc)/.test(u)))
      fail("/", "Dataset points at neither /root.json nor /api/gspc — it cites no machine-readable board");
    const redirectsFile = [join(DIR, "_redirects"), join(REPO, "public/_redirects")].find((f) => existsSync(f));
    const redirects = redirectsFile ? redirectSources(readFileSync(redirectsFile, "utf8")) : new Map();
    const problem = datasetUrlProblem(ds.url, redirects, (p) => read(p.replace(/^\/+|\/+$/g, "")) !== null);
    if (problem) fail("/", problem);
  }
}

// --- /board/ : Dataset, /connect/ : WebAPI — REPORTED, not yet armed ----------
// Emitted by client/src/components/PageSchema.tsx from 2026-11-17: /board/ is the page the board
// Dataset names as its url, and /connect/ documents the free MCP door (client/src/lib/
// mcpServerSchema.ts). As with /honesty/ before 2026-09-05, these are reported rather than failed
// until a real prerender has been seen to carry them; then move them to fail().
const reports = [];
const board = read("board");
if (!board) reports.push("/board/: not present in the built tree");
else {
  const ds = hasType(nodesIn(board, (m) => fail("/board/", `unparseable ld+json block (${m})`)), "Dataset")[0];
  if (!ds) reports.push("/board/: no Dataset node");
  else if (ds.url !== `${ORIGIN}/board/`) reports.push(`/board/: Dataset url is ${ds.url}, not ${ORIGIN}/board/`);
}
const connect = read("connect");
if (!connect) reports.push("/connect/: not present in the built tree");
else {
  const api = hasType(nodesIn(connect, (m) => fail("/connect/", `unparseable ld+json block (${m})`)), "WebAPI")[0];
  if (!api) reports.push("/connect/: no WebAPI node for the MCP door");
  else if (api.url !== `${ORIGIN}/mcp/free`) reports.push(`/connect/: WebAPI url is ${api.url}, not ${ORIGIN}/mcp/free`);
}
// --- /gspc/<axis>/ : the axis's OWN Dataset — REPORTED, not yet armed ----------
// From 2026-11-22 every /gspc/<axis>/ page the sitemap lists carries a top-level Dataset for that
// axis (client/src/lib/datasetSchema.ts gspcAxisPageDataset): url = the page, a JSON distribution,
// isPartOf = the board. Until then each page carried only the board node. Reported, not failed,
// until a real prerender has been seen to carry them — then move this to fail().
let axisPagesChecked = 0;
let axisPagesOk = 0;
{
  const sitemapFile = [join(DIR, "sitemap.xml"), join(REPO, "public/sitemap.xml")].find((f) => existsSync(f));
  const listedAxisPages = sitemapFile
    ? [...readFileSync(sitemapFile, "utf8").matchAll(/<loc>https:\/\/councilof\.ai\/gspc\/([a-z0-9-]+)\/<\/loc>/g)].map((m) => m[1])
    : [];
  for (const axis of listedAxisPages) {
    axisPagesChecked++;
    const where = `/gspc/${axis}/`;
    const html = read(`gspc/${axis}`);
    if (!html) { reports.push(`${where}: listed in the sitemap but not present in the built tree`); continue; }
    const page = `${ORIGIN}${where}`;
    const own = hasType(nodesIn(html, (m) => fail(where, `unparseable ld+json block (${m})`)), "Dataset").find((n) => n.url === page);
    const problems = [];
    if (!own) problems.push("no Dataset whose url is this page");
    else {
      if (!own.name) problems.push("no name");
      if (!(typeof own.description === "string" && own.description.length >= 50 && own.description.length <= 5000)) problems.push("description not 50-5000 chars");
      if (!own.creator?.name) problems.push("no creator");
      if (!own.license) problems.push("no license");
      if (!(Array.isArray(own.distribution) && own.distribution.some((d) => d?.contentUrl))) problems.push("no distribution with a contentUrl");
      if (own.isPartOf?.["@id"] !== `${ORIGIN}/board/#dataset`) problems.push("isPartOf does not name the board Dataset");
    }
    if (problems.length) reports.push(`${where}: ${problems.join("; ")}`);
    else axisPagesOk++;
  }
}

for (const r of reports) console.warn(`⚠ structured-data-gate (reported, not armed): ${r}`);

// --- /honesty/ : FAQPage -----------------------------------------------------
const honesty = read("honesty");
if (!honesty) fail("/honesty/", "not present in the built tree");
else {
  const nodes = nodesIn(honesty, (m) => fail("/honesty/", `unparseable ld+json block (${m})`));
  const faq = hasType(nodes, "FAQPage")[0];
  // ARMED 2026-09-05. The flip note that stood here said: arm this once the emitter has been
  // seen working through a real prerender. It has been. Deploy run 33967264133 ran this gate
  // against its prerendered dist/client and the shipped page carries the node —
  // GET https://councilof.ai/honesty/ returns an FAQPage with 5 questions, read off the live
  // page, whose text is the page's own section content. So a missing FAQPage is now a failure
  // rather than a warning: the thing exists, and its disappearance would be a regression.
  if (!faq) fail("/honesty/", "no FAQPage node — /honesty is the page that states what we have NOT measured; it had none before 2026-09-05 and losing it again is a regression");
  if (faq) {
    const qs = faq.mainEntity || [];
    faqSeen = qs.length;
    if (!qs.length) fail("/honesty/", "FAQPage has an empty mainEntity — a FAQ with no questions");
    for (const q of qs) {
      const a = q.acceptedAnswer && q.acceptedAnswer.text;
      if (!q.name || !a) fail("/honesty/", `FAQ entry missing a question or an answer: ${JSON.stringify(q).slice(0, 80)}`);
    }
  }
}

if (failures.length) {
  console.error(`\n✖ structured-data-gate: ${failures.length} problem(s)\n`);
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
// Say what was actually checked. The earlier wording claimed "FAQPage on /honesty/ — present"
// even on runs where the FAQ was absent and only warned, which is a success line asserting
// something the run did not establish.
console.log(`✓ structured-data-gate: Organization + Dataset on / present, parseable, citing a real board, and naming a page this tree serves; FAQPage on /honesty/ ${faqSeen ? `present (${faqSeen} question(s))` : "ABSENT — reported, not verified"}; /board/ Dataset, /connect/ WebAPI and ${axisPagesOk}/${axisPagesChecked} sitemap-listed /gspc/<axis>/ axis Datasets ${reports.length ? `— ${reports.length} reported problem(s), not armed` : "present"}`);
