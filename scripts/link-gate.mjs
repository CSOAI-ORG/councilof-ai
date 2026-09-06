#!/usr/bin/env node
/**
 * link-gate — a same-origin URL published in a machine surface must be a path we actually serve.
 *
 * WHY. On 2026-09-05 /interop/hf-badges-index.json advertised six badges, each with an `image`
 * of https://councilof.ai/badge/<id>.svg. All six were 404. The real endpoint is /api/badge, and
 * the /badge/*.svg paths had never existed. Every gate we run was green: brand-gate reads public
 * JSON *display* fields, facts-gate reads claims, signed-json-guard reads structure. Nothing read
 * a **link**. A dead URL in a machine surface is invisible to all of them, and a consumer that
 * follows it — the entire audience for a machine surface — gets nothing.
 *
 * OFFLINE BY DESIGN. It resolves each URL against the built tree and the Pages Functions routes
 * rather than fetching it. A network check in CI is slow, flaky, and cannot run before deploy;
 * this fails on the PR that introduces the dead link, which is the only moment it is cheap.
 *
 *   node scripts/link-gate.mjs [dir]        # default dist/client
 *   node scripts/link-gate.mjs --selftest   # prove it can catch and can pass
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SELFTEST = process.argv.includes("--selftest");
const DIR = resolve(REPO, process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "dist/client");

/** Every path Pages Functions serves, derived from the functions/ tree the way Pages routes it. */
export function functionRoutes(fnDir) {
  const out = new Set();
  const walk = (d, prefix = "") => {
    let ents = [];
    try { ents = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (e.name.startsWith("_") || /\.test\.(ts|js|mjs)$/.test(e.name)) continue;
      const full = join(d, e.name);
      if (e.isDirectory()) { walk(full, `${prefix}/${e.name}`); continue; }
      if (!/\.(ts|js|mjs)$/.test(e.name)) continue;
      const base = e.name.replace(/\.(ts|js|mjs)$/, "");
      // [[path]] is a catch-all: it serves the prefix AND everything under it. [id] is a single
      // dynamic segment. Recording the literal filename would make /mcp read as unserved while
      // functions/mcp/[[path]].ts serves it — the false positive that would sink this gate.
      if (/^\[\[.+\]\]$/.test(base)) { out.add(prefix || "/"); out.add(`${prefix}/*`); continue; }
      if (/^\[.+\]$/.test(base)) { out.add(`${prefix}/*`); continue; }
      out.add(base === "index" ? (prefix || "/") : `${prefix}/${base}`);
    }
  };
  walk(fnDir);
  return out;
}

/**
 * The app's own route list. pr-gates runs build:client WITHOUT the prerender, so a tree measured
 * there contains no prerendered route — and link-gate reported /library/company/ and /verify as
 * unserved while both serve real, distinct, titled pages (a nonsense path 404s, so that is not a
 * catch-all artefact). The gate was right about its tree and wrong about the site.
 *
 * route-manifest.ts is GENERATED from App.tsx by scripts/generate-route-manifest.mjs precisely so
 * something other than a browser can know what the app routes. Reading it makes the gate's model
 * of "served" match what the edge actually serves, in either tree.
 */
export function appRoutes(repo) {
  const out = new Set();
  try {
    const src = readFileSync(join(repo, "client/src/data/route-manifest.ts"), "utf8");
    for (const m of src.matchAll(/"path"\s*:\s*"([^"]+)"/g)) {
      const p = m[1].replace(/\/+$/, "") || "/";
      if (!p.includes(":")) out.add(p);   // a :param route is not a concrete path
    }
  } catch { /* no manifest: the gate simply keeps its previous, narrower model */ }
  return out;
}

const staticFiles = (root) => {
  const out = new Set();
  const walk = (d, prefix = "") => {
    let ents = [];
    try { ents = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const full = join(d, e.name);
      if (e.isDirectory()) { walk(full, `${prefix}/${e.name}`); continue; }
      out.add(`${prefix}/${e.name}`);
    }
  };
  walk(root);
  return out;
};

/** Pull same-origin URLs out of every string value, remembering where each came from. */
export function linksIn(node, at = "", out = []) {
  if (typeof node === "string") {
    const m = node.match(/https?:\/\/(?:www\.)?councilof\.ai\/[^\s"'<>)\],]*/gi);
    // Prose ends sentences: "see https://councilof.ai/api/gspc." must not become a path with a
    // full stop in it. Trailing sentence punctuation is never part of a URL we publish.
    for (const u of m || []) out.push({ at, url: u.replace(/[.,;:!?]+$/, "") });
  } else if (Array.isArray(node)) node.forEach((v, i) => linksIn(v, `${at}[${i}]`, out));
  else if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) linksIn(v, at ? `${at}.${k}` : k, out);
  return out;
}

export function isServed(pathname, files, routes, redirects = new Map()) {
  const p = pathname.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/";
  if (p === "/") return true;
  if (files.has(p)) return true;                 // exact file
  if (files.has(`${p}.html`)) return true;       // prerendered page
  if (files.has(`${p}/index.html`)) return true; // directory page
  if (routes.has(p)) return true;                // Pages Function or app route
  // A canonical redirect is a served path, not a dead one: /gspc-verify 308s to /gspc-verify/,
  // which is exactly the retirement/canonicalisation pattern the sitemap generator already
  // honours. Follow one hop and judge the target.
  const to = redirects.get(p) || redirects.get(`${p}/`);
  if (to) {
    const t = to.replace(/^https?:\/\/(?:www\.)?councilof\.ai/i, "").replace(/\/+$/, "") || "/";
    if (t !== p) return isServed(t, files, routes);
    return true;
  }
  // Catch-all function: functions/mcp/[[path]].ts serves /mcp and everything beneath it.
  for (const r of routes) {
    if (r.endsWith("/*") && (p === r.slice(0, -2) || p.startsWith(r.slice(0, -1)))) return true;
  }
  return false;
}

export function readRedirects(root) {
  const m = new Map();
  try {
    for (const line of readFileSync(join(root, "public/_redirects"), "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const [from, to] = t.split(/\s+/);
      if (from && to && !m.has(from)) m.set(from.replace(/\/+$/, "") || "/", to);
    }
  } catch { /* no redirects file: every path is judged on its own */ }
  return m;
}

if (SELFTEST && process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let bad = 0, CASES = 0;
  const must = (label, cond) => { CASES++; if (!cond) { console.error(`✖ selftest: ${label}`); bad++; } };
  const files = new Set(["/a.svg", "/page.html", "/dir/index.html"]);
  const routes = new Set(["/api/badge", "/feeds/corrections.xml"]);
  must("catches the badge-index defect", !isServed("/badge/csoai-22axis.svg", files, routes));
  must("passes an exact file", isServed("/a.svg", files, routes));
  must("passes a prerendered page", isServed("/page", files, routes));
  must("passes a directory page", isServed("/dir/", files, routes));
  must("passes a Pages Function route", isServed("/api/badge", files, routes));
  must("ignores query strings", isServed("/api/badge?card=x&subject=y", files, routes));
  must("finds a link nested in an array of objects",
    linksIn({ badges: [{ image: "https://councilof.ai/badge/x.svg" }] })[0]?.at === "badges[0].image");
  must("ignores third-party urls", linksIn({ a: "https://example.com/x" }).length === 0);
  must("counts a real app route as served", isServed("/library/company/", new Set(), new Set(["/library/company"])));
  must("does not accept a :param route as a concrete path", !appRoutes("/nonexistent-repo").has("/x/:id"));
  must("strips a sentence's full stop off a url",
    linksIn({ a: "see https://councilof.ai/api/gspc." })[0].url === "https://councilof.ai/api/gspc");
  must("follows a canonical redirect", isServed("/gspc-verify", new Set(["/gspc-verify/index.html"]), routes, new Map([["/gspc-verify", "/gspc-verify/"]])));
  must("honours a catch-all function route", isServed("/mcp", files, new Set(["/mcp", "/mcp/*"])));
  if (bad) { console.error(`✖ link-gate selftest FAILED (${bad})`); process.exit(1); }
  console.log(`✓ link-gate selftest: ${CASES}/${CASES} — catches the dead link it was written for, passes what we serve`);
  process.exit(0);
}

// Importing this file must be side-effect free: the selftest above and the sweep below both run
// only when this is the process entry point. Without this guard a test that wants isServed()
// gets the whole sweep — and an exit(2) — the moment it imports, which is what happened the
// first time anything tried.
const IS_MAIN = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (!IS_MAIN) { /* imported for its helpers */ } else {

if (!existsSync(DIR)) { console.error(`link-gate: no such tree ${DIR} — build first.`); process.exit(2); }

const files = staticFiles(DIR);
const routes = new Set([...functionRoutes(join(REPO, "functions")), ...appRoutes(REPO)]);
const redirects = readRedirects(REPO);
const failures = [];
let scanned = 0, links = 0;

for (const f of files) {
  if (!f.endsWith(".json")) continue;
  if (f.startsWith("/signed/cards/") || f.startsWith("/cards/")) continue; // signed bodies are evidence, never edited
  let parsed;
  try { parsed = JSON.parse(readFileSync(join(DIR, f), "utf8")); } catch { continue; }
  scanned++;
  for (const { at, url } of linksIn(parsed)) {
    links++;
    const path = url.replace(/^https?:\/\/(?:www\.)?councilof\.ai/i, "") || "/";
    if (!isServed(path, files, routes, redirects)) failures.push(`${f} -> ${at}\n      ${url}`);
  }
}

// RATCHET, not a cliff. This gate found ~1,035 dead same-origin links already published on the
// day it was written — /schema/card-v1.json alone is referenced 941 times by mill cards and is
// 404. Arming it outright would fail every build for a debt no single PR created, and a gate
// that blocks everyone gets switched off. So: the known-dead TARGETS are listed in a dated
// baseline, and the gate fails on any target NOT in it. New dead links are blocked the day they
// appear; the existing set is a named number that may only go down.
const BASELINE = join(REPO, "scripts/link-gate-baseline.json");
let baseline = { targets: [] };
try { baseline = JSON.parse(readFileSync(BASELINE, "utf8")); } catch { /* none yet */ }
const known = new Set(baseline.targets || []);
const isNew = (line) => {
  const u = (line.match(/https?:\/\/[^\s]+/) || [])[0] || "";
  return !known.has(u.replace(/^https?:\/\/(?:www\.)?councilof\.ai/i, "") || "/");
};
const fresh = failures.filter(isNew);
const stale = failures.length - fresh.length;

if (fresh.length) {
  console.error(`\n✖ link-gate: ${fresh.length} NEW same-origin URL(s) published in a machine surface that we do not serve:\n`);
  for (const f of fresh) console.error("  " + f);
  console.error(`\n  A consumer that follows one of these gets nothing. Point it at the path that exists, or remove the field.`);
  console.error(`  (${stale} known-dead references are carried in scripts/link-gate-baseline.json and are not counted here.)`);
  process.exit(1);
}
if (stale) {
  console.log(`✓ link-gate: no NEW dead links. ${stale} reference(s) to ${known.size} known-dead target(s) remain — see scripts/link-gate-baseline.json; the list may only shrink.`);
  process.exit(0);
}
console.log(`✓ link-gate: ${links} same-origin link(s) across ${scanned} published JSON file(s) all resolve to something we serve`);

}
