#!/usr/bin/env node
// Removes from dist/ the paths listed in scripts/withdrawn-from-deploy.json: kept in the repository,
// never served. Unlike drop-proofs-from-dist.mjs these are NOT mirrored anywhere and need no redirect.
// Runs AFTER vite build and BEFORE the gates that scan dist/. Nothing is removed from the repository.
import { existsSync, rmSync, readFileSync } from "node:fs";
import { resolve, relative, isAbsolute } from "node:path";

const dist = resolve(process.argv[2] || "dist/client");
const manifest = JSON.parse(readFileSync(resolve("scripts/withdrawn-from-deploy.json"), "utf8"));
let fail = false;
for (const e of manifest.entries || []) {
  const target = resolve(dist, e.path || "");
  const rel = relative(dist, target);
  if (!e.path || rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    console.error(`✗ withdrawn-from-deploy: refusing unsafe path ${JSON.stringify(e.path)}`);
    fail = true;
    continue;
  }
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
    console.log(`✓ withdrawn-from-deploy: dropped ${e.path} (${e.kind}; withdrawn ${e.since})`);
  } else {
    console.log(`· withdrawn-from-deploy: ${e.path} not present in dist`);
  }
}
if (fail) process.exit(12);
