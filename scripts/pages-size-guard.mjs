#!/usr/bin/env node
/**
 * pages-size-guard.mjs — fail the build if any file exceeds Cloudflare Pages' 25 MiB cap.
 *
 * WHY: a 32.7 MiB video reached `wrangler pages deploy` and the deploy died there, after a
 * full build and a 577-route prerender. Nothing in the pipeline knew the limit existed, so a
 * hard platform constraint surfaced at the last possible step with the least context and the
 * most wasted work. A constraint you cannot check is one you discover by breaking.
 *
 * 2026-09-16: the FILE COUNT is the other hard Pages limit (20,000 files per deployment).
 * scripts/build-axis-reports.mjs adds one JSON + one Markdown per (slot × subject) report under
 * public/reports/, so the count is now printed every run and the build fails past the cap. The
 * count of `public/` is a floor for dist/client (which adds prerendered HTML and Vite assets), so
 * FILE_WARN flags the headroom before the deploy step is the one to discover it.
 */
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const LIMIT = 25 * 1024 * 1024;
const FILE_CAP = 20000;      // Cloudflare Pages: max files per deployment
const FILE_WARN = 19000;     // print loudly once headroom is under 1,000 files
const dist = process.argv[2] || "dist/client";
const over = [];
let files = 0;
let bytes = 0;
const byTop = {};

const walk = (d, top) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    const t = top ?? (e.isDirectory() ? e.name : ".");
    if (e.isDirectory()) walk(p, t);
    else {
      const { size } = statSync(p);
      files += 1;
      bytes += size;
      byTop[t] = (byTop[t] || 0) + 1;
      if (size > LIMIT) over.push({ path: relative(dist, p), size });
    }
  }
};
walk(dist);

const reportsFiles = byTop.reports || 0;
console.log(`pages-size-guard: ${dist} = ${files} files · ${(bytes / 1048576).toFixed(1)} MiB (Pages cap ${FILE_CAP} files; reports/ = ${reportsFiles} files)`);
if (files > FILE_CAP) {
  console.error(`✗ pages-size-guard: ${files} files exceeds Cloudflare Pages' ${FILE_CAP}-file deployment limit`);
  const top = Object.entries(byTop).sort((a, b) => b[1] - a[1]).slice(0, 8);
  for (const [k, n] of top) console.error(`  ${k}/ — ${n} files`);
  process.exit(1);
}
if (files > FILE_WARN) console.warn(`! pages-size-guard: ${FILE_CAP - files} files of headroom left under the Pages cap`);

if (over.length) {
  console.error(`✗ pages-size-guard: ${over.length} file(s) exceed Cloudflare Pages' 25 MiB limit\n`);
  for (const f of over.sort((a, b) => b.size - a.size))
    console.error(`  ${f.path} — ${(f.size / 1048576).toFixed(1)} MiB`);
  console.error(`\nThe deploy WILL fail on these. Compress or remove them before shipping.`);
  process.exit(1);
}
console.log(`✓ pages-size-guard: every file under the 25 MiB Pages limit`);
