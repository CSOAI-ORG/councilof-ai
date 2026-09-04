#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const CREDENTIAL_PATTERNS = [
  {
    name: "EVM private-key field",
    regex: /["'](?:private[_-]?key|wallet[_-]?key|burner[_-]?key)["']?\s*[:=]\s*["']0x[0-9a-f]{64}["']/giu,
  },
  {
    name: "BURNER_KEY assignment",
    regex: /\bBURNER_KEY\s*=\s*["']?0x[0-9a-f]{64}\b/giu,
  },
];

function findingsFor(text) {
  const findings = [];
  for (const pattern of CREDENTIAL_PATTERNS) {
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(text)) findings.push(pattern.name);
  }
  return findings;
}

function selftest() {
  const credential = `0x${"a".repeat(64)}`;
  const unsafe = [
    `{"private_key":"${credential}"}`,
    `BURNER_KEY='${credential}'`,
  ];
  const safe = [
    `{"private_key":null}`,
    `BURNER_KEY=0x...`,
    `address=0x${"b".repeat(40)}`,
  ];
  if (unsafe.some((value) => findingsFor(value).length === 0)) return 1;
  if (safe.some((value) => findingsFor(value).length !== 0)) return 1;
  console.log("wallet-credential-gate selftest: OK");
  return 0;
}

if (process.argv.includes("--selftest")) process.exit(selftest());

const tracked = execFileSync("git", ["ls-files", "-z"])
  .toString("utf8")
  .split("\0")
  .filter(Boolean);

const failures = [];
for (const file of tracked) {
  const bytes = readFileSync(file);
  if (bytes.includes(0)) continue;
  const findings = findingsFor(bytes.toString("utf8"));
  if (findings.length) failures.push({ file, findings });
}

if (failures.length) {
  console.error("wallet-credential-gate: BLOCKED — wallet credential material is tracked");
  for (const failure of failures) {
    console.error(`  ${failure.file}: ${failure.findings.join(", ")}`);
  }
  process.exit(1);
}

console.log(`wallet-credential-gate: OK — ${tracked.length} tracked paths checked`);
