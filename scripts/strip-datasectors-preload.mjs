#!/usr/bin/env node
/**
 * strip-datasectors-preload.mjs — post-build step.
 *
 * Removes the eager `modulepreload` hint for the ~955KB `data-sectors-*` chunk
 * from dist/client/index.html. The chunk still loads on demand via the import
 * graph; we only stop preloading it on every first page load.
 *
 * Run automatically at the end of `npm run build:client`.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HTML = join(ROOT, "dist/client/index.html");

if (!existsSync(HTML)) {
  console.warn(`[strip-preload] ${HTML} not found — skipping (build output missing?)`);
  process.exit(0);
}

const html = readFileSync(HTML, "utf8");
const re = /^[ \t]*<link rel="modulepreload"[^>]*data-sectors-[^>]*>\s*\n?/m;

if (!re.test(html)) {
  console.log("[strip-preload] no data-sectors modulepreload found — nothing to do");
  process.exit(0);
}

writeFileSync(HTML, html.replace(re, ""));
console.log("[strip-preload] removed data-sectors modulepreload from dist/client/index.html");
