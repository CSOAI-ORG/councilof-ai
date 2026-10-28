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
 *
 * 2026-10-18: exclusions are loaded from deploy-exclusions.json automatically. Entries with
 * mirror_only=true are NOT excluded (they're synced to HF but kept in the bundle). The CLI flag
 * is still honoured for backwards compatibility.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { projection } from "./retired-proof-archive.mjs";

const LIMIT = 25 * 1024 * 1024;
const FILE_CAP = 20000;      // Cloudflare Pages: max files per deployment
const FILE_WARN = 19000;     // print loudly once headroom is under 1,000 files
const dist = process.argv[2] || "dist/client";
// `--exclude <top-level dir>[,dir…]`: directories that are NOT part of the deployment and must not
// count toward the cap. 2026-09-22 owner decision: public/proofs (3,993 .ots) leaves the site for the
// HF mirror (in-repo /proofs/* → 302 rule; scripts/drop-proofs-from-dist.mjs + the pod deploy pipeline
// remove it from dist/). Counting it here would fail every build on a directory that never uploads.
// 2026-09-28: cards/ too (`--exclude proofs,cards`), both served from HF csoai/councilof-ai-evidence.
const exArg = process.argv.indexOf("--exclude");
let EXCLUDE = exArg > 0 ? String(process.argv[exArg + 1] || "").split(",").filter(Boolean) : [];

// Auto-load exclusions from deploy-exclusions.json (the single source of truth for what leaves the
// Pages deploy). Entries with mirror_only=true are NOT excluded (synced to HF but kept in bundle).
const root = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(root, "deploy-exclusions.json");
if (existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const manifestDirs = (manifest.entries || [])
      .filter(e => e.kind === "dir" && !e.mirror_only)
      .map(e => e.path);
    EXCLUDE = [...new Set([...EXCLUDE, ...manifestDirs])];
  } catch (e) {
    console.warn(`pages-size-guard: failed to read deploy-exclusions.json: ${e.message}`);
  }
}
const over = [];
let files = 0;
let bytes = 0;
const byTop = {};

// Check if a relative path matches any exclusion (supports nested paths like interop/mill-cards-signed)
const isExcluded = (relPath) => EXCLUDE.some(ex => relPath === ex || relPath.startsWith(ex + "/"));
const loggedExclusions = new Set();

const walk = (d, top) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    const relPath = relative(dist, p);
    const t = top ?? (e.isDirectory() ? e.name : ".");
    if (e.isDirectory() && isExcluded(relPath)) {
      if (!loggedExclusions.has(relPath)) {
        console.log(`pages-size-guard: excluding ${relPath}/ (not deployed)`);
        loggedExclusions.add(relPath);
      }
      continue;
    }
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

if(process.argv.includes('--packed-history-projection')) {
  const projected=projection(dist,files);
  console.log('Historical evidence packaging projection:',JSON.stringify(projected));
  files=projected.projected;
}
const reportsFiles = byTop.reports || 0;
console.log(`pages-size-guard: ${dist} = ${files} ${process.argv.includes("--packed-history-projection") ? "projected deployment files" : "physical files"} · ${(bytes / 1048576).toFixed(1)} MiB (Pages cap ${FILE_CAP} files; reports/ = ${reportsFiles} files)`);
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
