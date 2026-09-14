#!/usr/bin/env node
// One header for the static pages. The React app renders its brand from
// client/src/components/Header.tsx (the shield mark + "Council of AI" + PRIMARY_LINKS).
// Twenty hand-written public/*.html pages carried their own header — a green square with a
// "C" in it and a four-link nav that never existed in the app. This producer rewrites every
// <header class="site-header">…</header> block to the app's brand, from the same source
// strings, so the two cannot drift again. Run: node scripts/surface/static-shell.mjs [--check]
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PUBLIC = join(ROOT, "public");

// Same geometry as Header.tsx and public/csoai-icon.svg: flat green shield, measurement temple.
export const SHIELD_SVG =
  '<svg viewBox="0 0 100 100" width="34" height="34" role="img" aria-label="Council of AI" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M50 4 L91 19 V49 C91 74 50 96 50 96 C50 96 9 74 9 49 V19 Z" fill="#04624a"/>' +
  '<path d="M50 12 L84 24 V49 C84 69 50 88 50 88 C50 88 16 69 16 49 V24 Z" fill="#ffffff"/>' +
  '<rect x="26" y="66" width="48" height="6" fill="#04624a"/><rect x="30" y="61" width="40" height="4" fill="#04624a"/>' +
  '<rect x="33" y="38" width="6" height="22" fill="#04624a"/><rect x="44" y="38" width="6" height="22" fill="#04624a"/>' +
  '<rect x="55" y="38" width="6" height="22" fill="#04624a"/><rect x="66" y="38" width="6" height="22" fill="#04624a"/>' +
  '<rect x="28" y="33" width="44" height="5" fill="#04624a"/><path d="M50 20 L75 32 H25 Z" fill="#04624a"/></svg>';

// PRIMARY_LINKS from client/src/components/HeaderNav.tsx, read at run time so a nav change
// in the app propagates here on the next run instead of being retyped.
export function primaryLinks() {
  const src = readFileSync(join(ROOT, "client/src/components/HeaderNav.tsx"), "utf8");
  const block = src.match(/export const PRIMARY_LINKS[^=]*=\s*\[([\s\S]*?)\];/);
  if (!block) throw new Error("PRIMARY_LINKS not found in HeaderNav.tsx");
  const links = [...block[1].matchAll(/name:\s*"([^"]+)",\s*href:\s*"([^"]+)"/g)].map((m) => ({ name: m[1], href: m[2] }));
  if (links.length < 3) throw new Error("PRIMARY_LINKS parsed to fewer than 3 links");
  return links;
}

export function headerHtml(links = primaryLinks()) {
  const nav = links.map((l) => `      <a href="${l.href}">${l.name}</a>`).join("\n");
  return (
    `<header class="site-header" data-static-shell="brand-v1">\n` +
    `  <div class="site-header-inner">\n` +
    `    <a class="logo" href="/" aria-label="Council of AI — home">${SHIELD_SVG}<span class="logo-word">Council of AI</span></a>\n` +
    `    <nav class="nav" aria-label="Main navigation">\n${nav}\n    </nav>\n` +
    `  </div>\n</header>`
  );
}

export const SHELL_CSS =
  `  /* static-shell brand-v1: same mark, wordmark and links as client/src/components/Header.tsx */\n` +
  `  .site-header { border-bottom: 1px solid var(--border, #e5e7eb); position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,.95); backdrop-filter: blur(8px); }\n` +
  `  .site-header-inner { max-width: 1100px; margin: 0 auto; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }\n` +
  `  .logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }\n` +
  `  .logo-word { color: #047857; font-weight: 700; font-size: 20px; letter-spacing: -0.01em; white-space: nowrap; }\n` +
  `  .nav { display: flex; gap: 2px; flex-wrap: wrap; }\n` +
  `  .nav a { color: var(--muted, #6b7280); text-decoration: none; font-size: 14px; font-weight: 500; padding: 8px 12px; border-radius: 6px; }\n` +
  `  .nav a:hover { color: var(--fg, #1f2937); background: var(--card, #f9fafb); }\n`;

const HEADER_RE = /<header class="site-header"[^>]*>[\s\S]*?<\/header>/;
// The footer brand on the same pages: a "C" square + "CSOAI" wordmark. Same mark, same name.
const FOOTER_BRAND_RE = /<a href="\/" class="logo"([^>]*)>\s*<span class="logo-mark">C<\/span>\s*<span class="logo-text">[\s\S]*?<\/span>\s*<\/a>/g;
export function footerBrandHtml(attrs = "") {
  return `<a href="/" class="logo"${attrs} aria-label="Council of AI — home">${SHIELD_SVG}<span class="logo-word">Council of AI</span></a>`;
}
// The old rules, wherever the page put them (some pages wrote them on one line, some on many).
const OLD_CSS_RE = /^[ \t]*\.(site-header|site-header-inner|logo|logo-mark|nav a|nav a:hover|nav)\s*\{[^}]*\}[ \t]*\n?/gm;
const SHELL_CSS_RE = /[ \t]*\/\* static-shell brand-v1[\s\S]*?\.nav a:hover \{[^}]*\}\n/;

export function rewrite(html, links) {
  if (!HEADER_RE.test(html)) return null;
  let out = html.replace(HEADER_RE, headerHtml(links));
  out = out.replace(FOOTER_BRAND_RE, (_m, attrs) => footerBrandHtml(attrs));
  out = out.replace(SHELL_CSS_RE, "").replace(OLD_CSS_RE, "");
  out = out.replace(/(<style[^>]*>\n?)/, `$1${SHELL_CSS}`);
  return out;
}

export function staticPages() {
  return readdirSync(PUBLIC).filter((f) => f.endsWith(".html")).map((f) => join(PUBLIC, f)).sort();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  const links = primaryLinks();
  let changed = 0, stale = [];
  for (const p of staticPages()) {
    const html = readFileSync(p, "utf8");
    const next = rewrite(html, links);
    if (next === null || next === html) continue;
    if (check) stale.push(p.slice(ROOT.length + 1));
    else { writeFileSync(p, next); changed++; }
  }
  if (check && stale.length) { console.error("static-shell: stale header in\n  " + stale.join("\n  ")); process.exit(1); }
  console.log(check ? "static-shell: every static header matches the app brand" : `static-shell: rewrote ${changed} page(s)`);
}
