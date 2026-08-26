#!/usr/bin/env node
/**
 * pages-size-guard.mjs — fail the build if any file exceeds Cloudflare Pages' 25 MiB cap.
 *
 * WHY: a 32.7 MiB video reached `wrangler pages deploy` and the deploy died there, after a
 * full build and a 577-route prerender. Nothing in the pipeline knew the limit existed, so a
 * hard platform constraint surfaced at the last possible step with the least context and the
 * most wasted work. A constraint you cannot check is one you discover by breaking.
 */
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const LIMIT = 25 * 1024 * 1024;
const dist = process.argv[2] || "dist/client";
const over = [];

const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else {
      const { size } = statSync(p);
      if (size > LIMIT) over.push({ path: relative(dist, p), size });
    }
  }
};
walk(dist);

if (over.length) {
  console.error(`✗ pages-size-guard: ${over.length} file(s) exceed Cloudflare Pages' 25 MiB limit\n`);
  for (const f of over.sort((a, b) => b.size - a.size))
    console.error(`  ${f.path} — ${(f.size / 1048576).toFixed(1)} MiB`);
  console.error(`\nThe deploy WILL fail on these. Compress or remove them before shipping.`);
  process.exit(1);
}
console.log(`✓ pages-size-guard: every file under the 25 MiB Pages limit`);
