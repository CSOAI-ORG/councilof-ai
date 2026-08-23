#!/usr/bin/env node
/**
 * Build MCP push_files payloads from /tmp/mcp-batches for agent-driven sync.
 * Agent calls Github MCP push_files with each /tmp/mcp-batches/batch-NN.json sequentially.
 *
 * Usage:
 *   node scripts/gh-build-single-pushes.mjs
 *   node scripts/gh-mcp-push-batches.mjs
 *   # Then push each /tmp/mcp-batches/batch-*.json via Github MCP push_files
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = "/tmp/mcp-batches";
const BRANCH = "cursor/instruments-catalog-7fb8";

fs.mkdirSync(OUT, { recursive: true });

const priority = [
  "client/src/lib/positioning.ts",
  "client/src/components/lobby/tabs.ts",
  "e2e/tests/council-os-workspace.spec.ts",
  "functions/api/chat.ts",
  "functions/api/instruments.ts",
  "client/src/components/Header.tsx",
  "client/src/components/Footer.tsx",
  "client/src/components/home/GovernanceStackStrip.tsx",
  "client/src/components/GlobalSearch.tsx",
];

const files = execSync(`git diff --name-only origin/${BRANCH}..HEAD`, { cwd: ROOT, encoding: "utf8" })
  .trim()
  .split("\n")
  .filter((f) => f && !f.startsWith("test") && !f.startsWith(".origin") && !f.startsWith(".mcp"))
  .filter((f) => fs.existsSync(path.join(ROOT, f)));

const payloads = files.map((rel) => ({
  path: rel,
  content: fs.readFileSync(path.join(ROOT, rel), "utf8"),
}));

const byPath = new Map(payloads.map((p) => [p.path, p]));
const ordered = [];
for (const p of priority) if (byPath.has(p)) ordered.push(byPath.get(p));
for (const p of payloads) if (!priority.includes(p.path)) ordered.push(p);

let batches = [];
let current = { files: [], size: 0, paths: [] };
const MAX = 70000;

for (const f of ordered) {
  const size = f.content.length;
  if (size > MAX) {
    if (current.files.length) {
      batches.push(current);
      current = { files: [], size: 0, paths: [] };
    }
    batches.push({ files: [f], size, paths: [f.path] });
    continue;
  }
  if (current.size + size > MAX && current.files.length) {
    batches.push(current);
    current = { files: [], size: 0, paths: [] };
  }
  current.files.push(f);
  current.paths.push(f.path);
  current.size += size;
}
if (current.files.length) batches.push(current);

const manifest = [];
batches.forEach((b, i) => {
  const n = String(i + 1).padStart(2, "0");
  const payload = {
    owner: "CSOAI-ORG",
    repo: "councilof-ai",
    branch: BRANCH,
    message: `Council OS sync batch ${i + 1}/${batches.length}: ${b.paths.slice(0, 3).join(", ")}${b.paths.length > 3 ? ` +${b.paths.length - 3} more` : ""}`,
    files: b.files,
  };
  const file = path.join(OUT, `batch-${n}.json`);
  fs.writeFileSync(file, JSON.stringify(payload));
  manifest.push({ batch: n, file, files: b.paths.length, chars: b.size });
});

fs.writeFileSync("/tmp/mcp-batches-manifest.json", JSON.stringify({ total: batches.length, batches: manifest }, null, 2));
console.log(JSON.stringify({ total: batches.length, manifest: "/tmp/mcp-batches-manifest.json" }, null, 2));
manifest.forEach((m) => console.log(m.batch, m.files, "files", m.chars, "chars"));
