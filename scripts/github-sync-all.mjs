#!/usr/bin/env node
/**
 * github-sync-all.mjs — emit push manifest for GitHub MCP create_or_update_file.
 * Usage: node scripts/github-sync-all.mjs [baseRef]
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2] || "origin/cursor/instruments-catalog-7fb8";

const files = execSync(`git diff --name-only ${base}..HEAD`, { cwd: ROOT, encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);

const manifest = files.map((rel, i) => ({
  index: i,
  path: rel,
  bytes: fs.statSync(path.join(ROOT, rel)).size,
}));

fs.writeFileSync("/tmp/github-sync-manifest.json", JSON.stringify({
  owner: "CSOAI-ORG",
  repo: "councilof-ai",
  branch: "cursor/instruments-catalog-7fb8",
  total: manifest.length,
  files: manifest,
}, null, 2));

console.log(JSON.stringify({ total: manifest.length, manifest: "/tmp/github-sync-manifest.json" }));
