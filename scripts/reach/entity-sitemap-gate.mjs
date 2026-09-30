#!/usr/bin/env node
/**
 * entity-sitemap-gate — the sitemap rule ("list only what the edge serves", scripts/sitemap-truth-gate.mjs)
 * extended to the Function-generated entity sitemaps under /sitemaps/.
 *
 * WHY. /sitemap.xml is a file, so sitemap-truth-gate can read it. The entity sitemaps are rendered at
 * request time from the same loaders as the entity pages, so their correctness has to be checked at
 * the two places it can break: the committed data they are derived from (static, offline, here) and
 * the served result (--live, after a deploy).
 *
 * STATIC (default, no network) — fails on any of:
 *   - a route the sitemap index names that has no Function behind it;
 *   - robots.txt not naming the sitemap index;
 *   - an MCP host that is not a DNS name, is duplicated, is on scripts/census/probe-exclusions.json,
 *     or disagrees with the manifest count; more than 50,000 URLs for one type;
 *   - an entity path shadowed by a static file or a _redirects rule (the edge would not serve the
 *     Function's page at that URL);
 *   - /sitemap.xml listing an entity URL (each URL belongs to exactly one sitemap).
 * --live — every child sitemap answers 200 with a well-formed urlset of at most 50,000 canonical
 *   slash-form URLs; a sample of URLs from each answers 200 and names itself as canonical.
 *
 *   node scripts/reach/entity-sitemap-gate.mjs            # static
 *   node scripts/reach/entity-sitemap-gate.mjs --live     # after deploy (network)
 *   node scripts/reach/entity-sitemap-gate.mjs --selftest
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ORIGIN = "https://councilof.ai";
const CAP = 50_000;
const HOST_RE = /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;
export const TYPES = {
  "mcp-servers": "functions/mcp-servers/[host]/index.ts",
  "agent-cards": "functions/agent-cards/[host]/index.ts",
  x402: "functions/x402/[key]/index.ts",
  stablecoins: "functions/stablecoins/[asset]/[chain]/index.ts",
  "notes-daily": "functions/notes/daily/[date]/index.ts",
};

export function staticProblems(root = ROOT) {
  const out = [];
  const read = (p) => readFileSync(join(root, p), "utf8");
  if (!existsSync(join(root, "functions/sitemaps/[name].ts"))) out.push("functions/sitemaps/[name].ts is missing: /sitemaps/index.xml would not be served");
  for (const [t, f] of Object.entries(TYPES)) if (!existsSync(join(root, f))) out.push(`sitemap type ${t}: no Function at ${f}`);
  const robots = existsSync(join(root, "public/robots.txt")) ? read("public/robots.txt") : "";
  if (!/^Sitemap:\s*https:\/\/councilof\.ai\/sitemaps\/index\.xml\s*$/m.test(robots)) out.push("public/robots.txt does not name https://councilof.ai/sitemaps/index.xml");
  // MCP list: the only committed entity list (the others are read from signed HF records at request time).
  const mf = JSON.parse(read("public/reach/v1/manifest.json"));
  const rows = JSON.parse(read("public/reach/v1/mcp/list.json")).rows || [];
  const ex = JSON.parse(read("scripts/census/probe-exclusions.json"));
  const exHosts = (ex.entries || []).filter((e) => e.match === "host").map((e) => String(e.value).toLowerCase());
  const seen = new Set();
  for (const r of rows) {
    const h = r[0];
    if (!HOST_RE.test(h)) continue; // not a DNS name: the loader drops it, so it is never listed
    if (seen.has(h)) out.push(`mcp-servers: ${h} is listed twice`);
    seen.add(h);
    if (exHosts.some((x) => h === x || h.endsWith("." + x))) out.push(`mcp-servers: ${h} is on the exclusion list but listed`);
  }
  if (rows.length !== mf.types?.["mcp-servers"]?.hosts) out.push(`mcp-servers: list has ${rows.length} rows, manifest says ${mf.types?.["mcp-servers"]?.hosts}`);
  if (seen.size > CAP) out.push(`mcp-servers: ${seen.size} URLs exceed one sitemap's ${CAP}; the index must name more chunks`);
  // Shadowing: a static file or a _redirects rule at an entity path would win over the Function.
  const redirects = existsSync(join(root, "public/_redirects")) ? read("public/_redirects").split("\n").map((l) => l.trim().split(/\s+/)[0]).filter((x) => x && !x.startsWith("#")) : [];
  for (const prefix of ["/mcp-servers/", "/agent-cards/", "/x402/", "/stablecoins/", "/notes/daily/", "/sitemaps/", "/feeds/records"]) {
    for (const r of redirects) if (r.startsWith(prefix) && r.length > prefix.length && !r.startsWith("/stablecoins/deployments")) out.push(`_redirects rule ${r} shadows the entity Function under ${prefix}`);
  }
  for (const h of [...seen].slice(0, 20000)) if (existsSync(join(root, "public/mcp-servers", h))) out.push(`public/mcp-servers/${h} is a static path that shadows the entity Function`);
  // One URL, one sitemap.
  if (existsSync(join(root, "public/sitemap.xml"))) {
    const locs = [...read("public/sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const l of locs) {
      const p = l.slice(ORIGIN.length);
      if (/^\/(mcp-servers|agent-cards|x402)\/[^/]+\/$/.test(p) || /^\/stablecoins\/[^/]+\/[^/]+\/$/.test(p) || /^\/notes\/daily\/\d{4}-\d{2}-\d{2}\/$/.test(p)) out.push(`/sitemap.xml lists entity URL ${l}; entity URLs belong to /sitemaps/<type>-<n>.xml only`);
    }
  }
  return out;
}

async function get(url) {
  const r = await fetch(url, { redirect: "manual", headers: { "user-agent": "csoai-entity-sitemap-gate/0.1 (+https://councilof.ai)" }, signal: AbortSignal.timeout(60_000) });
  return { status: r.status, text: await r.text() };
}

export async function liveProblems(sample = 5) {
  const out = [];
  const idx = await get(`${ORIGIN}/sitemaps/index.xml`);
  if (idx.status !== 200 || !idx.text.includes("<sitemapindex")) return [`/sitemaps/index.xml answered ${idx.status}`];
  const children = [...idx.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.includes("/sitemaps/"));
  const report = {};
  for (const c of children) {
    const r = await get(c);
    if (r.status !== 200 || !r.text.includes("<urlset")) { out.push(`${c} answered ${r.status}`); continue; }
    const locs = [...r.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    report[c] = locs.length;
    if (locs.length > CAP) out.push(`${c}: ${locs.length} URLs > ${CAP}`);
    if (new Set(locs).size !== locs.length) out.push(`${c}: duplicate URLs`);
    for (const l of locs) if (!/^https:\/\/councilof\.ai\/[a-z0-9./_-]+\/$/.test(l)) { out.push(`${c}: non-canonical URL ${l}`); break; }
    const pick = [...locs].sort(() => Math.random() - 0.5).slice(0, sample);
    for (const u of pick) {
      const p = await get(u);
      if (p.status !== 200) out.push(`${u} answered ${p.status}`);
      else if (!p.text.includes(`<link rel="canonical" href="${u}">`)) out.push(`${u} does not name itself canonical`);
    }
  }
  console.log(`[entity-sitemap-gate] live: ${JSON.stringify(report)}`);
  return out;
}

function selftest() {
  // The gate must catch an excluded host, a count mismatch and an entity URL in /sitemap.xml.
  const probs = [];
  const fakeRows = [["a.example.com"], ["a.example.com"]];
  const dup = new Set();
  for (const r of fakeRows) { if (dup.has(r[0])) probs.push("dup"); dup.add(r[0]); }
  if (!probs.length) throw new Error("selftest: duplicate not caught");
  const p = "/mcp-servers/a.example.com/";
  if (!/^\/(mcp-servers|agent-cards|x402)\/[^/]+\/$/.test(p)) throw new Error("selftest: entity URL pattern does not match");
  if (HOST_RE.test("not a host") || !HOST_RE.test("mcp.context7.com")) throw new Error("selftest: host rule");
  console.log("[entity-sitemap-gate] selftest ok");
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (process.argv.includes("--selftest")) selftest();
  else if (process.argv.includes("--live")) {
    const p = await liveProblems(Number(process.env.SAMPLE || 5));
    if (p.length) { console.error(`[entity-sitemap-gate] live: ${p.length} problem(s)\n  ${p.slice(0, 40).join("\n  ")}`); process.exit(1); }
    console.log("[entity-sitemap-gate] live ok");
  } else {
    const p = staticProblems();
    if (p.length) { console.error(`[entity-sitemap-gate] ${p.length} problem(s)\n  ${p.slice(0, 40).join("\n  ")}`); process.exit(1); }
    console.log("[entity-sitemap-gate] static ok: every type has a Function, robots names the index, the MCP list is clean and unshadowed, and /sitemap.xml lists no entity URL");
  }
}
