#!/usr/bin/env node
/**
 * NEXT_300 #287 — refuse Wilson claims on UNMEASURED labour/economy indices.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const bad = [];

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "sources") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(json|md|ts|tsx|mjs)$/.test(name)) acc.push(p);
  }
  return acc;
}

const rx = /wilson[^\n]{0,80}(labour|ai-economy|humanoid)|measured_score"\s*:\s*[0-9]/i;
for (const p of walk(join(ROOT, "scripts/index-fixtures")).concat(
  walk(join(ROOT, "datasets/labour-economy-unmeasured")),
  walk(join(ROOT, "datasets/rwa-testnet-unmeasured")),
)) {
  const t = readFileSync(p, "utf8");
  if (/measured_score"\s*:\s*[0-9]/.test(t)) bad.push(p + ": numeric measured_score");
  if (/wilson/i.test(t) && /UNMEASURED|labour-economy/i.test(t) && /interval|wilson_95/i.test(t)) {
    bad.push(p + ": Wilson on labour/UNMEASURED fixture");
  }
}

if (bad.length) {
  console.error("wilson-frozen-banks-lint FAIL:\n" + bad.join("\n"));
  process.exit(1);
}
console.log("wilson-frozen-banks-lint OK — no Wilson/MEASURED invention on index fixtures");
