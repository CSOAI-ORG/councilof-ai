/**
 * Emit GitHub push_files batches as JSON lines for MCP / manual push.
 * Usage: node scripts/gh-push-batches.mjs [baseRef]
 */
import { execSync } from "node:child_process";
import fs from "node:fs";

const base = process.argv[2] || "origin/cursor/instruments-catalog-7fb8";
const files = execSync(`git diff --name-only ${base}..HEAD`, { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);

const BATCH = 12;
const batches = [];
for (let i = 0; i < files.length; i += BATCH) {
  const slice = files.slice(i, i + BATCH);
  batches.push(
    slice.map((path) => ({
      path,
      content: fs.readFileSync(path, "utf8"),
    })),
  );
}

const out = {
  owner: "CSOAI-ORG",
  repo: "councilof-ai",
  branch: "cursor/instruments-catalog-7fb8",
  totalFiles: files.length,
  batchCount: batches.length,
  batches: batches.map((files, i) => ({
    index: i,
    message: `Council OS live sync batch ${i + 1}/${batches.length}`,
    files,
  })),
};

fs.writeFileSync("/tmp/gh-push-batches.json", JSON.stringify(out));
console.log(JSON.stringify({ totalFiles: files.length, batchCount: batches.length }));
