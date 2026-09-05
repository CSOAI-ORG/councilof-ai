#!/usr/bin/env node

import { execFileSync } from "node:child_process";

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

// Scan the INDEX, not the working tree. `git ls-files` lists every tracked path,
// including the ones a sparse checkout leaves off disk; readFileSync threw ENOENT
// on the first of those, and the pre-push hook — which discards this gate's
// output — reported that crash as "wallet credential material is tracked"
// (2026-09-05, lane/e2e-visual, a sparse worktree). The index is what a push
// actually sends, so reading blobs from it is also the more honest scan: a
// sparse checkout is checked in full instead of being skipped.
const entries = execFileSync("git", ["ls-files", "-z", "--stage"], { maxBuffer: 1 << 28 })
  .toString("utf8")
  .split("\0")
  .filter(Boolean)
  .map((line) => {
    const tab = line.indexOf("\t");
    const [mode, sha] = line.slice(0, tab).split(" ");
    return { mode, sha, file: line.slice(tab + 1) };
  })
  // 160000 is a gitlink (submodule pointer): there is no blob to read.
  .filter((entry) => entry.mode !== "160000");

/** Yield [entry, bytes] for a chunk of index entries via one `git cat-file --batch`. */
function* blobsOf(chunk) {
  const out = execFileSync("git", ["cat-file", "--batch"], {
    input: chunk.map((entry) => entry.sha).join("\n") + "\n",
    maxBuffer: 1 << 30,
  });
  let offset = 0;
  for (const entry of chunk) {
    const nl = out.indexOf(10, offset);
    const header = out.subarray(offset, nl).toString("utf8");
    offset = nl + 1;
    if (header.endsWith(" missing")) {
      throw new Error(`wallet-credential-gate: ${entry.file} (${entry.sha}) is not in the object store`);
    }
    const size = Number(header.split(" ")[2]);
    yield [entry, out.subarray(offset, offset + size)];
    offset += size + 1; // the trailing newline cat-file appends after each object
  }
}

const CHUNK = 400;
const failures = [];
let scanned = 0;
for (let i = 0; i < entries.length; i += CHUNK) {
  for (const [entry, bytes] of blobsOf(entries.slice(i, i + CHUNK))) {
    scanned += 1;
    if (bytes.includes(0)) continue;
    const findings = findingsFor(bytes.toString("utf8"));
    if (findings.length) failures.push({ file: entry.file, findings });
  }
}
const tracked = entries;

if (failures.length) {
  console.error("wallet-credential-gate: BLOCKED — wallet credential material is tracked");
  for (const failure of failures) {
    console.error(`  ${failure.file}: ${failure.findings.join(", ")}`);
  }
  process.exit(1);
}

console.log(`wallet-credential-gate: OK — ${scanned} of ${tracked.length} tracked paths checked from the index`);
