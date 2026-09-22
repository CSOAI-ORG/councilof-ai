#!/usr/bin/env node
// Removes from dist/ what never deploys (scripts/deploy-exclusions.json): a directory or file leaves the
// upload only if public/_redirects carries a rule that keeps its URL resolving (302 to the HF mirror).
// Owner decisions 2026-09-22: proofs/ (Cloudflare Pages 20,000-file cap) and the axis-23 run artifact
// (signed-pinned bytes that the brand gate refuses on this surface). Runs AFTER vite build and BEFORE the
// gates that scan dist/. Nothing is removed from the repository.
import { existsSync, rmSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const dist = resolve(process.argv[2] || "dist/client");
const manifest = JSON.parse(readFileSync(resolve("scripts/deploy-exclusions.json"), "utf8"));
const redirectsPath = existsSync(resolve("public/_redirects")) ? resolve("public/_redirects") : resolve(dist, "_redirects");
const rules = readFileSync(redirectsPath, "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => l.split(/\s+/));

// A rule keeps the URL resolving when its source matches the excluded path (splat for a directory,
// exact for a file), its target is on the mirror, and its status is a redirect.
function covered(entry) {
  const src = "/" + entry.path.replace(/\/$/, "") + (entry.kind === "dir" ? "/*" : "");
  return rules.some(([from, to, status]) => from === src && /^https:\/\/huggingface\.co\//.test(to || "") && /^30[1278]$/.test(status || ""));
}

let fail = false;
for (const e of manifest.entries) {
  if (!covered(e)) {
    console.error(`✗ deploy-exclusions: refusing to drop ${e.path} — no mirror redirect for it in ${redirectsPath}`);
    fail = true;
    continue;
  }
  const target = resolve(dist, e.path);
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
    console.log(`✓ deploy-exclusions: dropped ${e.path} (${e.kind}; served via redirect from the mirror)`);
  } else {
    console.log(`· deploy-exclusions: ${e.path} not present in dist`);
  }
}
if (fail) process.exit(11);
