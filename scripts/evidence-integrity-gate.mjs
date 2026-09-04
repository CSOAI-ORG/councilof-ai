#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = "scripts/evidence-quarantine.json";
const QUARANTINED_SOURCE_PREFIXES = ["cose-wrap/", "xrpl-settlement/"];

function read(relativePath) {
  return fs.readFileSync(path.join(REPO, relativePath));
}

function readText(relativePath) {
  return read(relativePath).toString("utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function jsonRecords(relativePath) {
  const text = readText(relativePath);
  try {
    return [JSON.parse(text)];
  } catch {
    return text
      .split(/\r?\n/u)
      .filter((line) => line.trim().length > 0)
      .map((line, index) => {
        try {
          return JSON.parse(line);
        } catch {
          return { __parse_error: index + 1 };
        }
      });
  }
}

function isQuarantinedSource(source) {
  const normalized = String(source ?? "").replaceAll("\\", "/");
  return QUARANTINED_SOURCE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function findQuarantinedLeaves(root) {
  if (!Array.isArray(root?.leaves)) return [];
  return root.leaves.filter((leaf) => isQuarantinedSource(leaf?.source));
}

export function legacyXrplCardIssues(card) {
  const issues = [];
  if (
    card?.kind === "gspc.measurement-card" &&
    card?.subject?.chain === "xrpl" &&
    card?.measurement?.status === "MEASURED"
  ) {
    issues.push("public-ledger observation promoted to MEASURED");
  }
  if (
    card?.signed === false &&
    typeof card?.sig_ed25519 === "string" &&
    /^[0-9a-f]{64}$/iu.test(card.sig_ed25519)
  ) {
    issues.push("unsigned digest represented as an Ed25519 signature");
  }
  return issues;
}

export function legacyCoseIssues(envelope) {
  const issues = [];
  if (envelope?._kind === "COSE_Sign1") {
    issues.push("legacy hand-built COSE_Sign1 requires quarantine");
  }
  if (
    typeof envelope?.signature_hex === "string" &&
    /^0+$/u.test(envelope.signature_hex)
  ) {
    issues.push("zero-filled placeholder signature");
  }
  if (envelope?.scitt_compliant === true) {
    issues.push("unverified SCITT conformance claim");
  }
  return issues;
}

function runSelftest() {
  assert.deepEqual(
    legacyXrplCardIssues({
      kind: "gspc.measurement-card",
      subject: { chain: "xrpl" },
      measurement: { status: "MEASURED" },
      signed: false,
      sig_ed25519: "a".repeat(64),
    }),
    [
      "public-ledger observation promoted to MEASURED",
      "unsigned digest represented as an Ed25519 signature",
    ],
  );
  assert.deepEqual(
    legacyXrplCardIssues({
      kind: "gspc.measurement-card",
      subject: { chain: "xrpl" },
      measurement: { status: "PROBED" },
      signed: false,
      sig_ed25519: null,
    }),
    [],
  );
  assert.equal(
    findQuarantinedLeaves({ leaves: [{ source: "cose-wrap/old.jsonl" }] }).length,
    1,
  );
  assert.equal(findQuarantinedLeaves({ leaves: [{ source: "safe/atom.jsonl" }] }).length, 0);
  assert.ok(
    legacyCoseIssues({
      _kind: "COSE_Sign1",
      signature_hex: "0".repeat(128),
      scitt_compliant: true,
    }).length >= 3,
  );
  console.log("evidence-integrity-gate selftest: PASS");
}

function queueInventory() {
  const files = [];
  const coseDir = path.join(REPO, "scripts/badger/_queue/cose-wrap");
  const xrplDir = path.join(REPO, "scripts/badger/_queue/xrpl-settlement");
  for (const name of fs.readdirSync(coseDir)) {
    if (name.endsWith(".jsonl")) files.push(`scripts/badger/_queue/cose-wrap/${name}`);
  }
  for (const name of fs.readdirSync(xrplDir)) {
    if (/^xrpl-(?:cards|receipts)-.+\.jsonl$/u.test(name)) {
      files.push(`scripts/badger/_queue/xrpl-settlement/${name}`);
    }
  }
  return files.sort();
}

function checkQuarantineManifest(errors) {
  const manifest = readJson(MANIFEST_PATH);
  const expectedPaths = manifest.quarantined_files.map((entry) => entry.path).sort();
  const actualPaths = queueInventory();
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
    const expected = new Set(expectedPaths);
    const actual = new Set(actualPaths);
    for (const item of actualPaths.filter((item) => !expected.has(item))) {
      errors.push(`new unreviewed quarantine output: ${item}`);
    }
    for (const item of expectedPaths.filter((item) => !actual.has(item))) {
      errors.push(`quarantine history missing: ${item}`);
    }
  }

  for (const entry of manifest.quarantined_files) {
    const absolute = path.join(REPO, entry.path);
    if (!fs.existsSync(absolute)) continue;
    const digest = sha256(read(entry.path));
    if (digest !== entry.sha256) errors.push(`quarantine history changed: ${entry.path}`);
    const rows = jsonRecords(entry.path);
    if (rows.length !== entry.rows) errors.push(`quarantine row count changed: ${entry.path}`);
    for (const [index, value] of rows.entries()) {
      if (value?.__parse_error) {
        errors.push(`invalid JSON record in quarantine history: ${entry.path}:${value.__parse_error}`);
        continue;
      }
      if (entry.reason === "false-xrpl-measured" && legacyXrplCardIssues(value).length === 0) {
        errors.push(`quarantine incident class no longer matches: ${entry.path}:${index + 1}`);
      }
      if (entry.reason === "invalid-cose-sign1" && legacyCoseIssues(value).length === 0) {
        errors.push(`quarantine incident class no longer matches: ${entry.path}:${index + 1}`);
      }
    }
  }

  for (const rootEntry of manifest.contaminated_public_roots) {
    if (rootEntry.ots_target_match !== false) {
      errors.push(`mismatched adjacent OTS is not marked invalid: ${rootEntry.ots_path}`);
    }
    for (const [relativePath, expectedHash] of [
      [rootEntry.path, rootEntry.sha256],
      [rootEntry.ots_path, rootEntry.ots_sha256],
    ]) {
      if (!fs.existsSync(path.join(REPO, relativePath))) {
        errors.push(`anchored incident history missing: ${relativePath}`);
      } else if (sha256(read(relativePath)) !== expectedHash) {
        errors.push(`anchored incident history changed: ${relativePath}`);
      }
    }
  }
}

function checkGenerators(errors) {
  for (const relativePath of [
    "scripts/badger/csoai-cose-wrap.py",
    "scripts/badger/csoai-scitt-vectors.py",
    "scripts/badger/csoai-xrpl-settlement.py",
    "scripts/badger/csoai-xrpl-settlement-v2.py",
  ]) {
    if (!readText(relativePath).includes("QUARANTINED_GENERATOR = True")) {
      errors.push(`generator is not fail-closed: ${relativePath}`);
    }
  }

  if (/\(\s*\d+\s*,\s*["']COSE["']/u.test(readText("scripts/badger/csoai-batch-all.py"))) {
    errors.push("retired COSE wrapper remains active in csoai-batch-all.py");
  }
  if (/\(\s*["']COSE-WRAP["']/u.test(readText("scripts/badger/csoai-keep-going.py"))) {
    errors.push("retired COSE wrapper remains active in csoai-keep-going.py");
  }
  if (
    /\(\s*["']com\.csoai\.xrpl-settlement-30min["']/u.test(
      readText("scripts/badger/csoai-improvement-wave.py"),
    )
  ) {
    errors.push("retired XRPL writer remains scheduled by csoai-improvement-wave.py");
  }

  const plist = readText(
    "scripts/badger/_queue/launch-agents/com.csoai.xrpl-settlement-30min.plist",
  );
  if (!/<key>Disabled<\/key>\s*<true\/>/u.test(plist)) {
    errors.push("XRPL recurring writer plist is not disabled");
  }
  if (!/<key>RunAtLoad<\/key>\s*<false\/>/u.test(plist)) {
    errors.push("XRPL recurring writer plist still runs at load");
  }
}

function checkPublicClaims(errors) {
  const cose = readJson("public/interop/gsr-cose-evidence.json");
  if (cose.status !== "QUARANTINED_PLACEHOLDER" || cose.claim_boundary?.is_cose_sign1 !== false) {
    errors.push("public COSE placeholder still presents itself as evidence");
  }
  const scitt = readJson("public/interop/gsr-scitt-statement.json");
  if (
    scitt.status !== "QUARANTINED_PLACEHOLDER" ||
    scitt.claim_boundary?.is_transparent_statement !== false
  ) {
    errors.push("public SCITT placeholder still presents itself as a statement");
  }
  const spec = readJson("public/interop/fin7-skeletons/scitt_wrap_spec.json");
  if (spec.status !== "QUARANTINED_DESIGN_SKETCH") {
    errors.push("legacy SCITT wrap design sketch is not visibly quarantined");
  }
  const profile = readJson("public/.well-known/scitt.json");
  if (profile.implementation_status !== "PLANNED" || profile.verification?.scitt_receipt !== "NONE_PUBLISHED") {
    errors.push("SCITT discovery document overstates implementation or receipt status");
  }

  const publicCopy = [
    readText("public/interop/transparency-anchors.json"),
    readText("client/src/data/blog-content.ts"),
    readText("client/src/data/answers.json"),
  ].join("\n");
  for (const phrase of [
    "estate's 210 COSE-SCITT chain + OTS remain the current anchors",
    "every per-axis board card can be registered as a SCITT claim",
    "each signed measurement run is recorded as a signed statement",
    "SCITT-registered claim",
    "IETF SCITT transparency ledgers, and ISO/IEC 22128-1",
    "RFC 9424 defines the architecture",
    "RFC 9485 (CO SE)",
  ]) {
    if (publicCopy.includes(phrase)) errors.push(`forbidden public conformance claim remains: ${phrase}`);
  }
}

function checkPublishedRoots(errors) {
  const interopDir = path.join(REPO, "public/interop");
  const rootFiles = fs
    .readdirSync(interopDir)
    .filter((name) => /^atom-root-.+\.json$/u.test(name))
    .sort();
  for (const name of rootFiles) {
    const relativePath = `public/interop/${name}`;
    const invalidLeaves = findQuarantinedLeaves(readJson(relativePath));
    if (invalidLeaves.length > 0) {
      errors.push(
        `${relativePath} is still publishable and commits ${invalidLeaves.length} quarantined leaves`,
      );
    }
  }
}

function runGate() {
  const errors = [];
  checkQuarantineManifest(errors);
  checkGenerators(errors);
  checkPublicClaims(errors);
  checkPublishedRoots(errors);

  if (errors.length > 0) {
    console.error(`evidence-integrity-gate: BLOCKED (${errors.length} issue${errors.length === 1 ? "" : "s"})`);
    for (const error of errors) console.error(`- ${error}`);
    console.error(
      "Resolution: preserve the contaminated roots as audit history outside the deploy tree, regenerate a clean root with quarantined sources excluded, independently verify it, then obtain a new OTS witness.",
    );
    process.exitCode = 1;
    return;
  }
  console.log("evidence-integrity-gate: PASS");
}

if (process.argv.includes("--selftest")) runSelftest();
else runGate();
