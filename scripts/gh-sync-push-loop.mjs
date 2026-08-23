#!/usr/bin/env node
/**
 * Emit one batch payload per line for agent-driven Github MCP push_files.
 * Usage: node scripts/gh-sync-push-loop.mjs [start] [end]
 * Agent reads /tmp/gh-sync-queue.jsonl and calls push_files for each line.
 */
import fs from "node:fs";
import path from "node:path";

const start = Number(process.argv[2] || 1);
const end = Number(process.argv[3] || 16);
const batchDir = "/tmp/gh-sync-final";
const out = "/tmp/gh-sync-queue.jsonl";

const lines = [];
for (let i = start; i <= end; i++) {
  const n = String(i).padStart(2, "0");
  const file = path.join(batchDir, `batch-${n}.json`);
  if (!fs.existsSync(file)) continue;
  const args = JSON.parse(fs.readFileSync(file, "utf8"));
  lines.push(JSON.stringify({
    batch: n,
    owner: args.owner,
    repo: args.repo,
    branch: args.branch,
    message: args.message,
    files: args.files.map((f) => ({ path: f.path, bytes: f.content.length })),
    payloadFile: file,
  }));
}
fs.writeFileSync(out, lines.join("\n") + "\n");
console.log(`Wrote ${lines.length} queue entries to ${out}`);
lines.forEach((l) => console.log(l));
