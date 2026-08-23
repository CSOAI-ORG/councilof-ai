#!/usr/bin/env node
/**
 * Build per-file Github MCP push_files payloads from workspace disk.
 * Usage: node scripts/gh-build-single-pushes.mjs [file1 file2 ...]
 *        node scripts/gh-build-single-pushes.mjs --batch 05
 * Output: /tmp/single-push/<path-with-slashes-replaced>.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = "/tmp/single-push";
const OWNER = "CSOAI-ORG";
const REPO = "councilof-ai";
const BRANCH = "cursor/instruments-catalog-7fb8";

fs.mkdirSync(OUT, { recursive: true });

function filesFromBatch(n) {
  const batch = JSON.parse(
    fs.readFileSync(`/tmp/gh-sync-final/batch-${String(n).padStart(2, "0")}.json`, "utf8"),
  );
  return batch.files.map((f) => f.path);
}

function filesFromDiff() {
  return execSync(`git diff --name-only origin/${BRANCH}..HEAD`, { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((f) => f && !f.startsWith("test") && !f.startsWith(".origin") && !f.startsWith(".mcp"));
}

const args = process.argv.slice(2);
let files = [];
if (args[0] === "--batch" && args[1]) {
  files = filesFromBatch(args[1]);
} else if (args.length) {
  files = args;
} else {
  files = filesFromDiff();
}

let n = 0;
for (const rel of files) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    console.warn("skip missing", rel);
    continue;
  }
  const content = fs.readFileSync(abs, "utf8");
  const payload = {
    owner: OWNER,
    repo: REPO,
    branch: BRANCH,
    message: `Council OS sync: ${rel}`,
    files: [{ path: rel, content }],
  };
  const outName = rel.replace(/\//g, "__") + ".json";
  fs.writeFileSync(path.join(OUT, outName), JSON.stringify(payload));
  console.log(++n, rel, content.length, "->", outName);
}
console.log("done", n, "payloads in", OUT);
