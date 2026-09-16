#!/usr/bin/env node
/**
 * seo-head-guard.mjs — read the PRERENDERED head of every route and refuse the ones a crawler
 * would misfile.
 *
 *   node scripts/seo-head-guard.mjs dist/client     # judge a prerendered dist
 *   node scripts/seo-head-guard.mjs --selftest      # prove the guard can fail
 *
 * WHY (2026-09-16, clean prerender): 14 routes carried the literal <title>undefined</title>,
 * 68 carried the bare shell title, 141 shared one withdrawal title and 14 had no meta
 * description. None of the existing gates read the <head>; brand-gate reads display strings,
 * facts-gate reads claims, check-prerender reads the report. A title is the most-read copy we
 * own and it had no gate.
 *
 * FAILS (exit 1) on any SPA-rendered page whose:
 *   · <title> is missing, empty, or the literal "undefined"/"null"/"[object Object]";
 *   · <title> is the bare shell title on a route other than "/";
 *   · <title> is the retired shared withdrawal title ("Evidence review in progress | …");
 *   · meta description is missing or empty.
 * PRINTS (never fails) the duplicate-title table and the count of pages still carrying the
 * shell's generic description — the next thing to fix, not a reason to block a deploy.
 * SKIPS (exit 0, says so) when the dist has no prerender output — a plain `vite build` tree has
 * one index.html and nothing to judge. Pages public/ owns (no `id="root"`) are reported, not
 * judged: this guard is about the SPA producer, and those files have their own authors.
 *
 * Exit 0 = clean or skipped. Exit 1 = a failing page. Exit 2 = the guard could not run.
 */
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SELFTEST = process.argv.includes("--selftest");
const DIST = resolve(ROOT, process.argv.find((a, i) => i >= 2 && !a.startsWith("--")) || "dist/client");

const RETIRED_SHARED_TITLE = "Evidence review in progress | Council of AI";

function readSite() {
  try {
    const j = JSON.parse(readFileSync(join(ROOT, "client/src/data/seo-head.json"), "utf8"));
    return { shellTitle: j.site?.shellTitle || "", shellDescription: j.site?.shellDescription || "" };
  } catch {
    return { shellTitle: "", shellDescription: "" };
  }
}

const decode = (s) => String(s)
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
  .replace(/\s+/g, " ").trim();

/** Head facts of one HTML file. Exported for the selftest and for anyone reading a single page. */
export function inspectHtml(html) {
  const head = String(html).slice(0, 65536);
  const titleM = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descM = head.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    || head.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  return {
    spa: /id=["']root["']/.test(html),
    hasTitleTag: !!titleM,
    title: titleM ? decode(titleM[1]) : "",
    hasDescTag: !!descM,
    description: descM ? decode(descM[1]) : "",
  };
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "assets" && e.name !== "functions") walk(f, out); }
    else if (e.name === "index.html") out.push(f);
  }
  return out;
}

/** Judge a dist directory. Returns { skipped, failures, warnings, dups, generic, pages }. */
export function judge(dist, site = readSite()) {
  const files = walk(dist);
  const pages = files.map((f) => {
    const route = "/" + relative(dist, dirname(f)).split("\\").join("/").replace(/^\.$/, "");
    return { file: f, route: route === "/." ? "/" : route, ...inspectHtml(readFileSync(f, "utf8")) };
  });
  const spa = pages.filter((p) => p.spa);
  if (spa.length < 2) return { skipped: true, pages, failures: [], warnings: [], dups: [], generic: 0 };

  const failures = [];
  const warnings = [];
  const byTitle = new Map();
  let generic = 0;
  for (const p of pages) {
    const t = p.title;
    if (p.spa) {
      if (!p.hasTitleTag || !t) failures.push(`${p.route}: no <title>`);
      else if (/^(undefined|null|\[object Object\])$/i.test(t) || /\bundefined\b/.test(t)) failures.push(`${p.route}: title is "${t}"`);
      else if (t === RETIRED_SHARED_TITLE) failures.push(`${p.route}: title is the retired shared withdrawal title`);
      else if (site.shellTitle && t === site.shellTitle && p.route !== "/") failures.push(`${p.route}: title is the bare shell title`);
      if (!p.hasDescTag || !p.description) failures.push(`${p.route}: no meta description`);
      else if (site.shellDescription && p.description === site.shellDescription && p.route !== "/") generic++;
      (byTitle.get(t) || byTitle.set(t, []).get(t)).push(p.route);
    } else {
      if (!p.hasDescTag || !p.description) warnings.push(`${p.route}: public/-owned page has no meta description`);
    }
  }
  const dups = [...byTitle.entries()].filter(([, v]) => v.length > 3).sort((a, b) => b[1].length - a[1].length);
  return { skipped: false, pages, failures, warnings, dups, generic };
}

function report(dist, r) {
  const spa = r.pages.filter((p) => p.spa).length;
  console.log(`seo-head-guard: ${r.pages.length} html file(s) in ${relative(ROOT, dist) || dist} — ${spa} SPA-rendered, ${r.pages.length - spa} public/-owned`);
  if (r.skipped) {
    console.log("seo-head-guard: no prerender output (fewer than 2 SPA pages) — nothing to judge, skipped.");
    return 0;
  }
  if (r.dups.length) {
    console.log(`\nDuplicate <title> across routes (shared by more than 3):`);
    for (const [t, routes] of r.dups.slice(0, 12)) console.log(`  ${String(routes.length).padStart(4)}×  "${t.slice(0, 70)}"  e.g. ${routes.slice(0, 4).join(", ")}${routes.length > 4 ? ", …" : ""}`);
  } else {
    console.log("\nNo <title> is shared by more than 3 routes.");
  }
  if (r.generic) console.log(`\n${r.generic} SPA page(s) still carry the shell's generic description (not failing; the next thing to fix).`);
  if (r.warnings.length) {
    console.log(`\n${r.warnings.length} warning(s) on public/-owned pages (not judged here):`);
    for (const w of r.warnings.slice(0, 10)) console.log(`  ${w}`);
    if (r.warnings.length > 10) console.log(`  … and ${r.warnings.length - 10} more`);
  }
  if (r.failures.length) {
    console.error(`\n✗ seo-head-guard: ${r.failures.length} failing page(s):`);
    for (const f of r.failures.slice(0, 40)) console.error(`  ${f}`);
    if (r.failures.length > 40) console.error(`  … and ${r.failures.length - 40} more`);
    return 1;
  }
  console.log("\n✓ seo-head-guard: every SPA page has a specific <title> and a meta description.");
  return 0;
}

function selftest() {
  const site = { shellTitle: "Shell Title", shellDescription: "Shell description." };
  const dir = mkdtempSync(join(tmpdir(), "seo-head-guard-"));
  const page = (title, desc) => `<!doctype html><html><head>${title === null ? "" : `<title>${title}</title>`}${desc === null ? "" : `<meta name="description" content="${desc}" />`}</head><body><div id="root"><p>x</p></div></body></html>`;
  const put = (route, html) => { const d = join(dir, route.replace(/^\//, "")); mkdirSync(d, { recursive: true }); writeFileSync(join(d, "index.html"), html); };
  let ok = true;
  const expect = (name, cond) => { console.log(`${cond ? "ok  " : "FAIL"} ${name}`); if (!cond) ok = false; };
  try {
    // 1. A shell-only tree (one SPA page) is skipped, not judged.
    put("/", page("Shell Title", "Shell description."));
    expect("skips a tree with no prerender output", judge(dir, site).skipped === true);
    // 2. A clean prerender passes and reports no duplicates.
    put("/about", page("About | X", "About description."));
    put("/faq", page("FAQ | X", "FAQ description."));
    let r = judge(dir, site);
    expect("clean pages pass", !r.skipped && r.failures.length === 0 && r.dups.length === 0);
    // 3. Each failure class is caught by name.
    put("/undef", page("undefined", "d"));
    put("/nodesc", page("No desc | X", null));
    put("/notitle", page(null, "d"));
    put("/shell", page("Shell Title", "d"));
    put("/retired", page(RETIRED_SHARED_TITLE, "d"));
    r = judge(dir, site);
    expect("catches the literal undefined title", r.failures.some((f) => f.startsWith("/undef:") && /undefined/.test(f)));
    expect("catches a missing description", r.failures.some((f) => f === "/nodesc: no meta description"));
    expect("catches a missing title tag", r.failures.some((f) => f === "/notitle: no <title>"));
    expect("catches the bare shell title off the root", r.failures.some((f) => f.startsWith("/shell:")));
    expect("catches the retired shared withdrawal title", r.failures.some((f) => f.startsWith("/retired:")));
    expect("the root may keep the shell title", !r.failures.some((f) => f.startsWith("/:")));
    // 4. Duplicates are tabled; generic descriptions are counted, not failed.
    for (const n of [1, 2, 3, 4]) put(`/dup${n}`, page("Same | X", "Shell description."));
    r = judge(dir, site);
    expect("tables a title shared by more than 3 routes", r.dups.some(([t, v]) => t === "Same | X" && v.length === 4));
    expect("counts generic descriptions without failing them", r.generic === 4 && !r.failures.some((f) => /dup\d/.test(f)));
    // 5. public/-owned pages (no root div) are warned, never failed.
    mkdirSync(join(dir, "static"), { recursive: true });
    writeFileSync(join(dir, "static", "index.html"), "<html><head><title>Static</title></head><body><p>no root</p></body></html>");
    r = judge(dir, site);
    expect("public/-owned page without description is a warning only", r.warnings.some((w) => w.startsWith("/static:")) && !r.failures.some((f) => f.startsWith("/static:")));
    // 6. Decoding: an escaped description is read back as text.
    put("/esc", page("Esc | X", "Says &quot;q&quot; &amp; more"));
    expect("decodes entities in the head", judge(dir, site).pages.find((p) => p.route === "/esc").description === 'Says "q" & more');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(ok ? "✓ seo-head-guard selftest: the guard can fail, and does so for the right reasons." : "✗ seo-head-guard selftest FAILED");
  return ok ? 0 : 1;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (SELFTEST) process.exit(selftest());
  if (!existsSync(DIST)) { console.error(`seo-head-guard: ${DIST} does not exist — build first.`); process.exit(2); }
  process.exit(report(DIST, judge(DIST)));
}
