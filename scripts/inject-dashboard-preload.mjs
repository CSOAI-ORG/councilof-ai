#!/usr/bin/env node
/**
 * inject-dashboard-preload.mjs — post-build step (council-os-watch lane, 30 Sep 2026).
 *
 * WHY. A Council OS deep link (/dashboard/?tab=route) painted its largest element after THREE
 * sequential network waves: the main bundle, then the Dashboard chunk and its ~30 static deps
 * (Vite's preload helper only starts those when the main bundle runs), then the pane chunk.
 * Measured on a throttled phone (4x CPU, 150 ms RTT, 1.6 Mbps): LCP 3.5–4.8 s.
 *
 * WHAT. Reads Vite's build manifest and writes ONE small inline script into dist/client/index.html
 * (the template every prerendered page inherits). On /dashboard only, it adds <link rel=modulepreload>
 * for the Dashboard chunk's static import closure and for the pane the URL names (?tab=), so those
 * download in parallel with the main bundle instead of after it. Elsewhere it does nothing.
 * Then it deletes the manifest from dist so it is not published.
 *
 *   node scripts/inject-dashboard-preload.mjs [dist/client]        write
 *   node scripts/inject-dashboard-preload.mjs [dist/client] --check   verify the marker is present exactly once
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const DIST = resolve(args.find((a) => !a.startsWith("--")) ?? "dist/client");
const CHECK = args.includes("--check");
const HTML = join(DIST, "index.html");
const MANIFEST = join(DIST, ".vite", "manifest.json");
const MARK = "data-dashboard-preload";

if (CHECK) {
  const html = readFileSync(HTML, "utf8");
  const n = html.split(MARK).length - 1;
  if (n !== 1) {
    console.error(`[dashboard-preload] expected the preload script once in ${HTML}, found ${n}`);
    process.exit(1);
  }
  if (existsSync(MANIFEST)) {
    console.error(`[dashboard-preload] ${MANIFEST} would be published; run without --check first`);
    process.exit(1);
  }
  console.log("[dashboard-preload] ok");
  process.exit(0);
}

if (!existsSync(MANIFEST)) {
  console.error(`[dashboard-preload] no Vite manifest at ${MANIFEST} (client/vite.config.ts build.manifest must be true)`);
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

/** The static import closure of one source module, as /assets/ URLs, excluding the entry (already loading). */
function closure(src) {
  const out = new Set();
  const walk = (key) => {
    const m = manifest[key];
    if (!m || m.isEntry) return;
    const url = `/${m.file}`;
    if (out.has(url)) return;
    out.add(url);
    for (const k of m.imports ?? []) walk(k);
  };
  walk(src);
  if (!out.size) throw new Error(`[dashboard-preload] ${src} is not in the Vite manifest`);
  return [...out];
}

// Same sources as client/src/lib/panePrefetch.ts and components/DashboardPane.tsx.
const PANES = {
  board: "src/components/home/HomeGspcBoard.tsx",
  results: "src/components/home/HomeGspcBoard.tsx",
  route: "src/components/gspc/RoutePane.tsx",
  connect: "src/components/gspc/ConnectPane.tsx",
  corrections: "src/components/gspc/CorrectionsPane.tsx",
  verify: "src/components/lobby/LobbyVerifyPane.tsx",
  cards: "src/components/lobby/LobbyCardsPane.tsx",
};
const base = closure("src/pages/Dashboard.tsx");
const baseSet = new Set(base);
const panes = {};
for (const [tab, src] of Object.entries(PANES)) panes[tab] = closure(src).filter((u) => !baseSet.has(u));

const map = JSON.stringify({ base, panes });
const script =
  `<script ${MARK}>(function(){try{var p=location.pathname;if(p!=="/dashboard"&&p.indexOf("/dashboard/")!==0)return;` +
  `var M=${map};var t=new URLSearchParams(location.search).get("tab")||"";` +
  `M.base.concat(M.panes[t]||[]).forEach(function(h){if(document.querySelector('link[rel=modulepreload][href="'+h+'"]'))return;` +
  `var l=document.createElement("link");l.rel="modulepreload";l.href=h;document.head.appendChild(l);});}catch(e){}})();</script>`;

let html = readFileSync(HTML, "utf8");
html = html.replace(new RegExp(`\\s*<script ${MARK}>[\\s\\S]*?</script>`), "");
if (!/<\/head>/i.test(html)) throw new Error(`[dashboard-preload] no </head> in ${HTML}`);
html = html.replace(/<\/head>/i, `  ${script}\n</head>`);
writeFileSync(HTML, html);
rmSync(join(DIST, ".vite"), { recursive: true, force: true });
console.log(`[dashboard-preload] base ${base.length} chunks; panes ${Object.entries(panes).map(([k, v]) => `${k}:${v.length}`).join(" ")}`);
