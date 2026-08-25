#!/usr/bin/env node
/**
 * Value Ledger publishedCount must stay 0 until real stranger-checkable receipts
 * are bound on the edge. Empty is honesty (docs/EAT_PLAYBOOK.md owner gate #4).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const LEDGER = join("client/src/lib/eastWestLedger.ts");
const API = join("functions/api/east-west/[[path]].ts");

function assertPublishedZero(path, src) {
  const bad = [];
  // Hardcoded publishedCount: 0 in source of truth
  if (!/publishedCount:\s*0\b/.test(src)) {
    bad.push(`${path}: missing publishedCount: 0`);
  }
  // Reject non-zero literals near publishedCount
  const nonzero = src.match(/publishedCount:\s*([1-9]\d*)/g);
  if (nonzero) bad.push(`${path}: non-zero publishedCount — ${nonzero.join(", ")}`);
  // publishedRows must be empty array literal in publishedLedger / GET ledger
  if (path.includes("eastWestLedger") && !/publishedRows:\s*\[\]\s*as\s*LedgerRow\[\]/.test(src) && !/publishedRows:\s*\[\]/.test(src)) {
    bad.push(`${path}: publishedRows must be empty []`);
  }
  return bad;
}

const errs = [
  ...assertPublishedZero(LEDGER, readFileSync(LEDGER, "utf8")),
  ...assertPublishedZero(API, readFileSync(API, "utf8")),
];

if (errs.length) {
  console.error("value-ledger-lint FAIL:\n" + errs.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log("value-ledger-lint OK — publishedCount locked at 0");
