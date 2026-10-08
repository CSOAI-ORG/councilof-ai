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
import { readFileSync, existsSync, readdirSync, lstatSync } from "node:fs";
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
      if (e.isFile()) out.add(`${prefix}/${e.name}`);
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

const MIRROR = "https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main/";

/** Only retained source files from the explicitly excluded deploy paths may qualify a mirror URL.
 * This proves a source-backed route contract, never that HF currently publishes the bytes.
 */
export function mirrorSourcePaths(repo) {
  const out = new Set();
  let manifest;
  try { manifest = JSON.parse(readFileSync(join(repo, "scripts/deploy-exclusions.json"), "utf8")); }
  catch { return out; }
  if (!manifest || manifest.schema !== "csoai.deploy-exclusions/0.1" || !Array.isArray(manifest.entries)) return out;
  for (const entry of manifest.entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const path = entry.path;
    if (typeof path !== "string" || !path || path.startsWith("/") ||
        path.split("/").some((part) => !part || part === "." || part === "..") ||
        /[\\%{}:*?#]/.test(path)) continue;
    const full = join(repo, "public", path);
    if (entry.kind === "dir") {
      try { if (!lstatSync(full).isDirectory()) continue; } catch { continue; }
      for (const child of staticFiles(full)) out.add("/" + path + child);
    } else if (entry.kind === "file") {
      // A directory/symlink must not be mistaken for an excluded source file.
      try { if (lstatSync(full).isFile()) out.add("/" + path); } catch { /* absent source stays unresolved */ }
    }
  }
  return out;
}

const normalPath = (path) => path.replace(/\/+$/, "") || "/";
const routeMatches = (path, routes) => {
  const p = normalPath(path);
  if (routes.has(p)) return true;
  for (const route of routes) {
    if (route.endsWith("/*") && (p === route.slice(0, -2) || p.startsWith(route.slice(0, -1)))) return true;
  }
  return false;
};

/** Match supported 3xx/200 rules in their file order, including a single greedy splat or named segments.
 * Keep trailing slashes here: /page -> /page/ is one redirect, not a cycle.
 */
export function redirectTarget(path, redirects, withStatus = false) {
  for (const [from, to] of redirects) {
    let pattern = "^", offset = 0, splats = 0;
    const names = [];
    const escape = (part) => part.replace(/[.*+?^{}()|[\]\\$]/g, "\\$&");
    for (const token of from.matchAll(/\*|:[A-Za-z]\w*/g)) {
      pattern += escape(from.slice(offset, token.index));
      const name = token[0] === "*" ? "splat" : token[0].slice(1);
      if (name === "splat") splats++;
      names.push(name);
      pattern += token[0] === "*" ? "(.*)" : "([^/]+)";
      offset = token.index + token[0].length;
    }
    if (splats > 1 || new Set(names).size !== names.length) continue;
    pattern += escape(from.slice(offset)) + "$";
    const match = path.match(new RegExp(pattern));
    if (!match) continue;
    const captures = new Map(names.map((name, index) => [name, match[index + 1]]));
    const target = to.replace(/:[A-Za-z]\w*/g, (name) => captures.get(name.slice(1)) ?? name);
    return withStatus ? { to: target, status: redirects.statuses?.get(from) ?? "302" } : target;
  }
  return null;
}

const physicalAsset = (path, files) => {
  const p = normalPath(path);
  if (files.has(p)) return p;
  if (files.has(p + ".html")) return p + ".html";
  const index = (p === "/" ? "" : p) + "/index.html";
  return files.has(index) ? index : null;
};

export function isServed(pathname, files, routes, redirects = new Map(), options = {}) {
  const { mirrorFiles = new Set(), functionPaths = routes, appPaths = new Set() } = options;
  const visited = new Set();
  let path = pathname.replace(/[?#].*$/, "") || "/";
  for (let hop = 0; hop < 32; hop++) {
    if (!path.startsWith("/") || path.startsWith("//") || /[{}]/.test(path) || visited.has(path)) return false;
    visited.add(path);
    const p = normalPath(path);
    // _redirects does not apply to a request served by a Pages Function. A known function route
    // is served by that function; this gate does not claim that its response is a mirror response.
    if (routeMatches(path, functionPaths)) return true;
    const rule = redirectTarget(path, redirects, true);
    if (rule?.status === "200") {
      // A proxy renders only its selected relative target; neither another rule nor the
      // original asset can establish the body. Never follow a later 200/3xx from this target.
      if (!rule.to.startsWith("/") || rule.to.startsWith("//")) return false;
      const target = rule.to.replace(/[?#].*$/, "") || "/";
      if (/[{}:*]/.test(target)) return false;
      const body = physicalAsset(target, files);
      if (body === null) return false;
      // The actual declared SPA rule may render a concrete route from the generated app
      // manifest, provided its index asset exists. Index HTML cannot stand in for a missing
      // card, unknown page, or another physical asset just because the catch-all matches.
      if (body === "/index.html") return p === "/index.html" || (target === "/index.html" && appPaths.has(p));
      const expected = p.match(/\.(?:json|jsonl|ndjson|svg|js|mjs|css|xml|txt|md|pdf|png|jpe?g|webp|ico|wasm|ots|zip|csv)$/i)?.[0];
      return !expected || body.toLowerCase().endsWith(expected.toLowerCase());
    }
    if (rule !== null) {
      const to = rule.to;
      if (/^https?:\/\//i.test(to)) {
        let target;
        try { target = new URL(to); } catch { return false; }
        if (target.protocol === "https:" || target.protocol === "http:") {
          if (target.hostname === "councilof.ai" || target.hostname === "www.councilof.ai") {
            if (target.port || target.username || target.password) return false;
            path = target.pathname;
            continue;
          }
          // Broad or arbitrary external redirects do not prove a concrete asset is served.
          // Require the exact approved dataset and same source-relative path, without a query,
          // fragment, encoded path, unresolved placeholder, or a source file invented by the URL.
          return !/[%{}:*]/.test(path) && mirrorFiles.has(path) && to === MIRROR + path.slice(1);
        }
        return false;
      }
      if (!to.startsWith("/") || to.startsWith("//")) return false;
      path = to.replace(/[?#].*$/, "") || "/";
      continue;
    }
    // A selected rule was judged above before physical assets or app routes. With no rule,
    // retain the existing direct-path model.
    if (p === "/" || files.has(p) || files.has(p + ".html") || files.has(p + "/index.html")) return true;
    return routeMatches(path, routes);
  }
  return false; // an excessive chain or cycle is not evidence of service
}

export function readRedirects(root, contents) {
  const redirects = new Map();
  redirects.statuses = new Map();
  try {
    for (const line of (contents ?? readFileSync(join(root, "public/_redirects"), "utf8")).split("\n")) {
      const text = line.trim();
      if (!text || text.startsWith("#")) continue;
      const [from, to, status = "302", extra] = text.split(/\s+/);
      // Keep 200 rewrites in order: they obstruct later rules, but cannot establish service.
      // Unsupported/malformed lines are not evidence.
      if (!from || !to || extra || !/^(?:30[12378]|200)$/.test(status) || !from.startsWith("/") ||
          from.startsWith("//") || from.includes("?") || from.includes("#")) continue;
      // Pages uses the default HTML handling: relative index targets with a wildcard
      // or trailing-slash source are rejected as loops before matching or duplicate checks.
      // Match the upstream parser against the raw destination; a query changes this rule.
      if (to.startsWith("/") && !to.startsWith("//") && /\/index(.html)?$/.test(to) &&
          (from.endsWith("/*") || from.endsWith("/"))) continue;
      if (!redirects.has(from)) {
        redirects.set(from, to);
        redirects.statuses.set(from, status);
      }
    }
  } catch { /* absent redirects leave each path judged on its own */ }
  return redirects;
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
  const splat = new Map([["/cards/*", MIRROR + "cards/:splat"], ["/old/*", "/a.svg"], ["/gone/*", "/nowhere/:splat"]]);
  must("serves an excluded source file through the exact approved mirror rule", isServed("/cards/0123456789abcdef.json", files, routes, splat, { mirrorFiles: new Set(["/cards/0123456789abcdef.json"]) }));
  must("judges a same-origin splat target", isServed("/old/anything", files, routes, splat));
  must("still catches a splat whose same-origin target is dead", !isServed("/gone/x.json", files, routes, splat));
  must("a splat does not serve paths outside its prefix", !isServed("/cardsx/1.json", files, routes, splat));
  must("a SPA200 splat cannot establish an unknown asset path", !isServed("/unknown-asset.json", new Set(["/index.html"]), new Set(), readRedirects(REPO)));
  const asset = "/cards/0123456789abcdef.json";
  const mirrorOptions = { mirrorFiles: new Set([asset]), functionPaths: new Set() };
  must("missing source does not qualify a mirror redirect", !isServed("/cards/ffffffffffffffff.json", files, routes, splat, mirrorOptions));
  must("literal card template is not a concrete served path", !isServed("/cards/{sha16}.json", files, routes, splat, mirrorOptions));
  must("encoded template is not a concrete mirrored source", !isServed("/cards/%7Bsha16%7D.json", files, routes, splat, mirrorOptions));
  must("arbitrary external splat is not evidence", !isServed(asset, files, routes, new Map([["/cards/*", "https://example.com/cards/:splat"]]), mirrorOptions));
  must("other HF dataset is not the approved mirror", !isServed(asset, files, routes, new Map([["/cards/*", "https://huggingface.co/datasets/x/resolve/main/cards/:splat"]]), mirrorOptions));
  must("mirror must preserve the exact source-relative path", !isServed(asset, files, routes, new Map([["/cards/*", MIRROR + "proofs/:splat"]]), mirrorOptions));
  must("credentials or host suffix cannot impersonate the mirror", !isServed(asset, files, routes, new Map([["/cards/*", "https://huggingface.co.example.com/datasets/csoai/councilof-ai-evidence/resolve/main/cards/:splat"]]), mirrorOptions));
  must("query or fragment does not qualify another mirror contract", !isServed(asset, files, routes, new Map([["/cards/*", MIRROR + "cards/:splat?download=1"]]), mirrorOptions));
  must("redirect overrides a physical file", !isServed("/a.svg", files, routes, new Map([["/a.svg", "/missing.svg"]])));
  must("redirect overrides an app route", !isServed("/app", files, new Set(["/app"]), new Map([["/app", "/missing"]]), { functionPaths: new Set() }));
  must("first matching splat precedes a later exact rule", !isServed("/old/x", files, routes, new Map([["/old/*", "/missing"], ["/old/x", "/a.svg"]])));
  must("first matching exact rule precedes a later splat", isServed("/old/x", files, routes, new Map([["/old/x", "/a.svg"], ["/old/*", "/missing"]])));
  must("multi-hop redirects retain all rules", isServed("/hop-a", files, routes, new Map([["/hop-a", "/hop-b"], ["/hop-b", "/a.svg"]])));
  must("redirect cycle cannot be hidden by a physical file", !isServed("/a.svg", files, routes, new Map([["/a.svg", "/hop-b"], ["/hop-b", "/a.svg"]])));
  must("exact mirror rule requires retained source too", isServed(asset, files, routes, new Map([[asset, MIRROR + asset.slice(1)]]), mirrorOptions));
  must("same-origin authority suffix is not accepted", !isServed("/old/x", files, routes, new Map([["/old/*", "https://councilof.ai.evil.example/a.svg"]])));
  must("named segment is substituted", isServed("/old/a.svg", files, routes, new Map([["/old/:name", "/:name"]])));
  must("named segment does not consume multiple segments", !isServed("/old/deep/a.svg", files, routes, new Map([["/old/:name", "/:name"]])));
  must("protocol-relative destination is not accepted", !isServed("/old/x", files, routes, new Map([["/old/*", "//example.com/a.svg"]])));
  must("function route is served by the function, not its redirect", isServed("/api/badge", files, routes, new Map([["/api/badge", "/missing"]])));
  must("same-origin redirect reaches a function route", isServed("/old-badge", files, routes, new Map([["/old-badge", "https://councilof.ai/api/badge"]])));
  must("self redirect is unresolved rather than served", !isServed("/a.svg", files, routes, new Map([["/a.svg", "/a.svg"]])));
  const obstructed = new Map([["/cards/:name", "/index.html"], ["/cards/*", MIRROR + "cards/:splat"]]);
  obstructed.statuses = new Map([["/cards/:name", "200"], ["/cards/*", "302"]]);
  must("earlier matching200 blocks a later approved mirror redirect", !isServed(asset, new Set(["/index.html"]), routes, obstructed, mirrorOptions));
  must("earlier matching200 does not invent a generic SPA asset", !isServed("/cards/missing.json", new Set(["/index.html"]), routes, obstructed, mirrorOptions));
  must("a matching200 cannot fall back to the original physical asset", !isServed(asset, new Set([asset]), routes, obstructed, mirrorOptions));
  must("a SPA200 requires its index asset and a declared app route", isServed("/cards/known-page", new Set(["/index.html"]), new Set(["/cards/known-page"]), obstructed, { ...mirrorOptions, appPaths: new Set(["/cards/known-page"]) }));
  const rewrite = new Map([["/a.svg", "/b.svg"], ["/b.svg", "/missing.svg"]]);
  rewrite.statuses = new Map([["/a.svg", "200"], ["/b.svg", "200"]]);
  must("a200 missing target fails even when the original asset exists", !isServed("/b.svg", new Set(["/b.svg"]), new Set(), rewrite));
  must("a200 proxy judges its target without following a later200", isServed("/a.svg", new Set(["/b.svg"]), new Set(), rewrite));
  const redirectAfterProxy = new Map([["/a.svg", "/b.svg"], ["/b.svg", "/missing.svg"]]);
  redirectAfterProxy.statuses = new Map([["/a.svg", "200"], ["/b.svg", "302"]]);
  must("a200 proxy does not follow a later3xx either", isServed("/a.svg", new Set(["/b.svg"]), new Set(), redirectAfterProxy));
  const externalRewrite = new Map([["/a.svg", "https://councilof.ai/a.svg"]]);
  externalRewrite.statuses = new Map([["/a.svg", "200"]]);
  must("a200 proxy accepts no absolute URL", !isServed("/a.svg", new Set(["/a.svg"]), new Set(), externalRewrite));
  const wrongBody = new Map([["/a.svg", "/body.html"]]);
  wrongBody.statuses = new Map([["/a.svg", "200"]]);
  must("a200 HTML body cannot qualify a published SVG asset", !isServed("/a.svg", new Set(["/a.svg", "/body.html"]), new Set(), wrongBody));
  const spa = new Map([["/*", "/index.html"]]);
  spa.statuses = new Map([["/*", "200"]]);
  must("a SPA200 rejects an unknown JSON path even if its original asset exists", !isServed("/missing.json", new Set(["/index.html", "/missing.json"]), new Set(), spa));
  must("a SPA200 rejects an undeclared page", !isServed("/unknown-page", new Set(["/index.html"]), new Set(), spa));
  must("a SPA200 cannot render a declared app page without its index", !isServed("/known-page", new Set(), new Set(["/known-page"]), spa, { functionPaths: new Set(), appPaths: new Set(["/known-page"]) }));

  const rejectedIndexes = readRedirects(REPO, [
    "/* /index.html 200", "/nested/* /target/index 302", "/slash/ /target/index.html 308",
  ].join("\n"));
  must("parser ignores wildcard-to-index HTML rewrites", !rejectedIndexes.has("/*"));
  must("parser ignores nested wildcard-to-index redirects", !rejectedIndexes.has("/nested/*"));
  must("parser ignores trailing-slash-to-index under Pages HTML handling", !rejectedIndexes.has("/slash/"));
  must("the configured inert catch-all is ignored by the parser", !readRedirects(REPO).has("/*"));
  const validIndexes = readRedirects(REPO, [
    "/exact /index.html 200", "/named/:name /index.html 200",
    "/query/* /index.html?spa=1 200", "/external/* https://example.com/index.html 302",
  ].join("\n"));
  must("parser preserves exact, named, query and external index destinations",
    validIndexes.size === 4 && validIndexes.get("/named/:name") === "/index.html" &&
    validIndexes.get("/query/*") === "/index.html?spa=1" &&
    validIndexes.get("/external/*") === "https://example.com/index.html");
  const publishedAssets = new Set(["/index.html", "/schema/card-v1.json", "/llms.txt", "/root.json"]);
  for (const path of ["/schema/card-v1.json", "/llms.txt", "/root.json"]) {
    must(`a rejected index rule cannot mask the published asset ${path}`,
      isServed(path, publishedAssets, new Set(), rejectedIndexes));
  }
  must("ignoring an invalid rewrite does not invent a missing JSON asset",
    !isServed("/absent.json", publishedAssets, new Set(), rejectedIndexes));
  const validAssetRedirect = readRedirects(REPO, "/schema/card-v1.json /missing.json 302");
  must("a valid redirect still overrides an existing JSON asset",
    !isServed("/schema/card-v1.json", publishedAssets, new Set(), validAssetRedirect));
  must("an accepted query rewrite still cannot replace a JSON asset with HTML",
    !isServed("/query/card.json", new Set(["/index.html", "/query/card.json"]), new Set(), validIndexes));
  const rejectedBeforeMirror = readRedirects(REPO,
    `/cards/* /index.html 200\n/cards/* ${MIRROR}cards/:splat 302`);
  must("a rejected rule does not consume the source before an approved mirror rule",
    isServed(asset, files, routes, rejectedBeforeMirror, mirrorOptions));
  const validBeforeMirror = readRedirects(REPO,
    `/cards/:name /index.html 200\n/cards/* ${MIRROR}cards/:splat 302`);
  must("an accepted first rewrite still blocks a later approved mirror rule",
    !isServed(asset, new Set(["/index.html"]), routes, validBeforeMirror, mirrorOptions));
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
const functionPaths = functionRoutes(join(REPO, "functions"));
const appPaths = appRoutes(REPO);
const routes = new Set([...functionPaths, ...appPaths]);
const mirrorFiles = mirrorSourcePaths(REPO);
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
    if (!isServed(path, files, routes, redirects, { mirrorFiles, functionPaths, appPaths })) failures.push(`${f} -> ${at}\n      ${url}`);
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
