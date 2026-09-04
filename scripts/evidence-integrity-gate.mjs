#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = "scripts/evidence-quarantine.json";
const QUARANTINED_SOURCE_PREFIXES = ["cose-wrap/", "xrpl-settlement/"];
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const REDACTION_PROFILES = {
  INTERNAL_INFRASTRUCTURE_HOSTNAME: {
    fields: ["compute.oracle.host"],
    replacement: "[redacted-internal-hostname]",
    metadata: {
      quarantine_notice:
        "Historical invalid public artifact retained for incident analysis only. Runtime and witness claims below were not verified and must not be republished.",
      redaction_notice:
        "An internal infrastructure hostname was removed from this quarantined copy.",
    },
  },
};

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

function valueAtPath(document, fieldPath) {
  return fieldPath.split(".").reduce((value, key) => value?.[key], document);
}

function deleteAtPath(document, fieldPath) {
  const keys = fieldPath.split(".");
  const finalKey = keys.pop();
  const parent = keys.reduce((value, key) => value?.[key], document);
  if (parent !== null && typeof parent === "object" && finalKey !== undefined) {
    delete parent[finalKey];
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function redactionProjectionSha256(document, profile) {
  const projected = JSON.parse(JSON.stringify(document));
  for (const fieldPath of profile.fields) deleteAtPath(projected, fieldPath);
  for (const fieldPath of Object.keys(profile.metadata)) deleteAtPath(projected, fieldPath);
  return sha256(Buffer.from(JSON.stringify(canonicalize(projected))));
}

export function artifactIntegrityIssues(artifact, storedBytes) {
  const issues = [];
  const expectedHash = String(artifact?.sha256 ?? "");
  if (!SHA256_PATTERN.test(expectedHash)) {
    issues.push("has an invalid stored sha256");
  } else if (sha256(storedBytes) !== expectedHash) {
    issues.push("stored bytes do not match the manifest sha256");
  }

  const hasRedactionProvenance =
    artifact?.redacted_from_sha256 !== undefined || artifact?.redaction !== undefined;
  if (!hasRedactionProvenance) return issues;

  const originalHash = String(artifact?.redacted_from_sha256 ?? "");
  if (!SHA256_PATTERN.test(originalHash)) {
    issues.push("has an invalid redacted_from_sha256");
  } else if (originalHash === expectedHash) {
    issues.push("uses the same digest for the original and redacted bytes");
  }

  const redaction = artifact?.redaction;
  if (redaction === null || typeof redaction !== "object" || Array.isArray(redaction)) {
    issues.push("lacks structured redaction provenance");
    return issues;
  }
  const profile = REDACTION_PROFILES[redaction.profile];
  if (!profile) {
    issues.push(`uses unsupported redaction profile: ${String(redaction.profile ?? "<missing>")}`);
    return issues;
  }
  if (JSON.stringify(redaction.fields) !== JSON.stringify(profile.fields)) {
    issues.push("redaction fields do not match the approved profile");
  }
  if (redaction.replacement !== profile.replacement) {
    issues.push("redaction replacement does not match the approved profile");
  }
  if (
    JSON.stringify(redaction.metadata_fields_added) !== JSON.stringify(Object.keys(profile.metadata))
  ) {
    issues.push("redaction metadata additions do not match the approved profile");
  }
  if (typeof redaction.reason !== "string" || redaction.reason.trim() === "") {
    issues.push("redaction reason is missing");
  }
  if (typeof redaction.provenance !== "string" || redaction.provenance.trim() === "") {
    issues.push("redaction provenance is missing");
  }
  if (redaction.original_bytes_preserved !== false) {
    issues.push("redaction must state that the original bytes are not preserved in the incident copy");
  }

  let document;
  try {
    document = JSON.parse(storedBytes.toString("utf8"));
  } catch {
    issues.push("redacted incident copy is not valid JSON");
    return issues;
  }
  for (const fieldPath of profile.fields) {
    if (valueAtPath(document, fieldPath) !== profile.replacement) {
      issues.push(`approved redaction is absent at ${fieldPath}`);
    }
  }
  for (const [fieldPath, expectedValue] of Object.entries(profile.metadata)) {
    if (valueAtPath(document, fieldPath) !== expectedValue) {
      issues.push(`approved redaction metadata is absent at ${fieldPath}`);
    }
  }
  const projectionHash = String(redaction.projection_sha256 ?? "");
  if (!SHA256_PATTERN.test(projectionHash)) {
    issues.push("redaction projection_sha256 is invalid");
  } else if (redactionProjectionSha256(document, profile) !== projectionHash) {
    issues.push("redacted semantic projection does not match the pre-redaction projection");
  }
  return issues;
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

export function incidentArtifacts(incident) {
  const explicit = Array.isArray(incident?.artifacts) ? incident.artifacts : [];
  const placeholders = Array.isArray(incident?.plain_text_placeholders)
    ? incident.plain_text_placeholders.map(([name, digest]) => ({
        original_public_path: `public/interop/${name}`,
        path: `evidence/incidents/2026-09-04-public-proof-audit/interop/${name}`,
        sha256: digest,
        classification: "PLAIN_TEXT_PLACEHOLDER_NOT_OTS",
      }))
    : [];
  return [...explicit, ...placeholders];
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
  assert.deepEqual(
    incidentArtifacts({ plain_text_placeholders: [["fake.ots", "ab"]] }),
    [
      {
        original_public_path: "public/interop/fake.ots",
        path: "evidence/incidents/2026-09-04-public-proof-audit/interop/fake.ots",
        sha256: "ab",
        classification: "PLAIN_TEXT_PLACEHOLDER_NOT_OTS",
      },
    ],
  );
  const redactedValue = {
    quarantine_notice:
      "Historical invalid public artifact retained for incident analysis only. Runtime and witness claims below were not verified and must not be republished.",
    redaction_notice:
      "An internal infrastructure hostname was removed from this quarantined copy.",
    evidence: "preserved",
    compute: { oracle: { host: "[redacted-internal-hostname]" } },
  };
  const redactedDocument = Buffer.from(JSON.stringify(redactedValue));
  const redactedArtifact = {
    sha256: sha256(redactedDocument),
    redacted_from_sha256: "1".repeat(64),
    redaction: {
      profile: "INTERNAL_INFRASTRUCTURE_HOSTNAME",
      reason: "Remove a confidential infrastructure identifier.",
      provenance: "The pre-redaction digest was recorded before the field was replaced.",
      fields: ["compute.oracle.host"],
      replacement: "[redacted-internal-hostname]",
      metadata_fields_added: ["quarantine_notice", "redaction_notice"],
      projection_sha256: redactionProjectionSha256(
        redactedValue,
        REDACTION_PROFILES.INTERNAL_INFRASTRUCTURE_HOSTNAME,
      ),
      original_bytes_preserved: false,
    },
  };
  assert.deepEqual(artifactIntegrityIssues(redactedArtifact, redactedDocument), []);
  assert.ok(
    artifactIntegrityIssues(
      redactedArtifact,
      Buffer.from(JSON.stringify({ compute: { oracle: { host: "unexpected" } } })),
    ).includes("approved redaction is absent at compute.oracle.host"),
  );
  assert.ok(
    artifactIntegrityIssues(
      { ...redactedArtifact, redacted_from_sha256: redactedArtifact.sha256 },
      redactedDocument,
    ).includes("uses the same digest for the original and redacted bytes"),
  );
  const unrelatedMutation = Buffer.from(
    JSON.stringify({ ...redactedValue, evidence: "changed" }),
  );
  assert.ok(
    artifactIntegrityIssues(
      { ...redactedArtifact, sha256: sha256(unrelatedMutation) },
      unrelatedMutation,
    ).includes("redacted semantic projection does not match the pre-redaction projection"),
  );
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
    for (const originalPath of [rootEntry.original_public_path, rootEntry.original_public_ots_path]) {
      if (!String(originalPath ?? "").startsWith("public/")) {
        errors.push(`contaminated root lacks its original public path: ${rootEntry.path}`);
      } else if (fs.existsSync(path.join(REPO, originalPath))) {
        errors.push(`contaminated root remains in the served tree: ${originalPath}`);
      }
    }
    if (String(rootEntry.path ?? "").startsWith("public/") || String(rootEntry.ots_path ?? "").startsWith("public/")) {
      errors.push(`contaminated root incident is still served: ${rootEntry.path}`);
    }
  }

  const incidentManifestPath = manifest.public_proof_incident_manifest;
  if (typeof incidentManifestPath !== "string" || incidentManifestPath.startsWith("public/")) {
    errors.push("public proof incident manifest is absent or remains in the served tree");
    return;
  }
  let incident;
  try {
    incident = readJson(incidentManifestPath);
  } catch {
    errors.push(`public proof incident manifest unreadable: ${incidentManifestPath}`);
    return;
  }
  const artifacts = incidentArtifacts(incident);
  if (artifacts.length !== 32) {
    errors.push(`public proof incident inventory has ${artifacts.length} artifacts, expected 32`);
  }
  for (const artifact of artifacts) {
    const stored = String(artifact.path ?? "");
    const original = String(artifact.original_public_path ?? "");
    if (!stored.startsWith("evidence/incidents/") || original === "" || !original.startsWith("public/")) {
      errors.push(`invalid public proof incident paths: ${stored || "<missing>"}`);
      continue;
    }
    const replacementIsDiscoveryPointer =
      artifact.classification === "OVERSTATED_ANCHOR_STATUS" &&
      original === "public/interop/layer0-ceremony.json";
    if (fs.existsSync(path.join(REPO, original)) && !replacementIsDiscoveryPointer) {
      errors.push(`quarantined public proof remains served: ${original}`);
    }
    if (!fs.existsSync(path.join(REPO, stored))) {
      errors.push(`quarantined public proof is missing: ${stored}`);
    } else {
      for (const issue of artifactIntegrityIssues(artifact, read(stored))) {
        errors.push(`quarantined public proof ${issue}: ${stored}`);
      }
    }
  }

  const layer0Discovery = readJson("public/interop/layer0-ceremony.json");
  if (
    layer0Discovery.status !== "DISCOVERY_POINTER" ||
    layer0Discovery.claim_boundary?.is_a_receipt !== false ||
    layer0Discovery.claim_boundary?.is_a_bitcoin_anchor !== false
  ) {
    errors.push("Layer 0 discovery path presents itself as a receipt or Bitcoin anchor");
  }

  const interopIndex = readJson("public/interop/index.json");
  const indexedUrls = new Set(
    (Array.isArray(interopIndex.formats) ? interopIndex.formats : [])
      .map((entry) => entry?.url)
      .filter((url) => typeof url === "string"),
  );
  for (const artifact of artifacts) {
    const original = String(artifact.original_public_path ?? "");
    if (!original.startsWith("public/interop/")) continue;
    if (artifact.classification === "OVERSTATED_ANCHOR_STATUS") continue;
    const publicUrl = `https://councilof.ai/${original.replace(/^public\//u, "")}`;
    if (indexedUrls.has(publicUrl)) {
      errors.push(`interop index still advertises quarantined proof: ${original}`);
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
