#!/usr/bin/env node
/**
 * Emit remaining sync batches as individual JSON payloads for GitHub MCP push_files.
 * Run: node scripts/mcp-push-remaining.mjs
 */
import fs from "node:fs";

const batches = JSON.parse(fs.readFileSync("/tmp/gh-push-batches.json", "utf8"));
for (let i = 0; i < batches.batches.length; i++) {
  const payload = {
    owner: batches.owner,
    repo: batches.repo,
    branch: batches.branch,
    message: `Council OS final sync batch ${i + 1}/${batches.batches.length}`,
    files: batches.batches[i],
  };
  const out = `/tmp/mcp-push-${String(i + 1).padStart(2, "0")}.json`;
  fs.writeFileSync(out, JSON.stringify(payload));
  const bytes = batches.batches[i].reduce((s, f) => s + f.content.length, 0);
  console.log(out, batches.batches[i].length, "files", bytes, "bytes");
}
