#!/usr/bin/env node
/**
 * did-json-guard — the permanent fix for the recurring root did.json leak.
 * The estate serves did.json via a 301 to /.well-known/did.json (real artifact).
 * A root public/did.json or dist/client/did.json STATIC FILE beats the 301 and
 * leaks the SPA shell to machines. Fail the build if either exists.
 *
 * Usage: node scripts/did-json-guard.mjs [dist/client]   (default dist/client)
 * Exit 1 on any root did.json file.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.resolve(REPO, process.argv[2] || "dist/client");

let bad = 0;
for (const p of [path.join(REPO, "public", "did.json"), path.join(DIST, "did.json")]) {
  if (fs.existsSync(p)) {
    console.error(`did-json-guard: FORBIDDEN root file exists at ${p} — remove it; did.json must 301 to /.well-known/did.json`);
    bad++;
  }
}
if (bad) {
  console.error("did-json-guard: FAIL — a root did.json would serve the SPA shell to machines.");
  process.exit(1);
}
console.log("did-json-guard: OK — no root did.json (the 301 serves the real DID doc).");
