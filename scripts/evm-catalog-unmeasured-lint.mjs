#!/usr/bin/env node
/**
 * NEXT_300 #303–308 guard — EVM catalog cluster JSON stays REPORTED/unsigned.
 * Never invent MEASURED scores on Stage 3 breadth stubs.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const CATALOG_DIR = join(ROOT, "adapters/evm/catalog");
const bad = [];

for (const name of readdirSync(CATALOG_DIR)) {
  if (!name.endsWith(".json")) continue;
  const path = join(CATALOG_DIR, name);
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    bad.push(`${path}: invalid JSON — ${e.message}`);
    continue;
  }

  if (data.measured_score !== null) {
    bad.push(`${path}: manifest measured_score must be null`);
  }
  if (data.status !== "REPORTED") {
    bad.push(`${path}: status must be REPORTED`);
  }
  if (!Array.isArray(data.entries)) {
    bad.push(`${path}: missing entries array`);
    continue;
  }
  for (const entry of data.entries) {
    if (entry.measured_score !== null) {
      bad.push(`${path} entry ${entry.slug}: measured_score must be null`);
    }
    if (entry.signing_state !== "unsigned") {
      bad.push(`${path} entry ${entry.slug}: signing_state must be unsigned`);
    }
    if (typeof entry.public_id === "string" && /TBD|verify/i.test(entry.public_id)) {
      bad.push(`${path} entry ${entry.slug}: public_id must be null until verified (not TBD string)`);
    }
  }
}

if (bad.length) {
  console.error("evm-catalog-unmeasured-lint FAIL:\n" + bad.join("\n"));
  process.exit(1);
}
console.log("evm-catalog-unmeasured-lint OK — Stage 3 catalog batches stay unsigned/UNMEASURED");
