#!/usr/bin/env node

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = "scripts/evidence-quarantine.json";
const ATOM_SOURCE_POLICY_PATH = "scripts/badger/atom-root-sources.json";
const QUARANTINED_SOURCE_PREFIXES = [
  "bft-council/vote-chain-",
  "cose-wrap/",
  "deep-mining/",
  "learn-loop/",
  "xrpl-settlement/",
];
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

function walkFiles(relativeDirectory, predicate = () => true) {
  const results = [];
  const visit = (relativePath) => {
    const absolutePath = path.join(REPO, relativePath);
    if (!fs.existsSync(absolutePath)) return;
    for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
      const child = path.posix.join(relativePath.replaceAll("\\", "/"), entry.name);
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile() && predicate(child)) results.push(child);
    }
  };
  visit(relativeDirectory);
  return results.sort();
}

function isQuarantinedSource(source) {
  const normalized = String(source ?? "").replaceAll("\\", "/");
  return QUARANTINED_SOURCE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function globMatches(value, pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/gu, "\\$&").replaceAll("*", ".*");
  return new RegExp(`^${escaped}$`, "u").test(value);
}

function sourceIsAdmitted(source, policy) {
  const normalized = String(source ?? "").replaceAll("\\", "/");
  const excludedByPrefix = (policy?.excluded_prefixes ?? []).some((prefix) =>
    normalized.startsWith(prefix),
  );
  const excludedByGlob = (policy?.excluded_globs ?? []).some((pattern) =>
    globMatches(normalized, pattern),
  );
  return !excludedByPrefix && !excludedByGlob && (policy?.allowed_sources ?? []).includes(normalized);
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

export function placeholderEvidenceIssues(record) {
  const issues = [];
  const council = record?.council_attestation;
  if (
    council?.council_size === 33 &&
    council?.yes_count === 33 &&
    council?.no_count === 0 &&
    council?.quorum_reached === true
  ) {
    issues.push("hard-coded 33/33 council result");
  }
  if (record?.yes === 33 && record?.no === 0 && record?.quorum_reached === true) {
    issues.push("hard-coded 33/33 vote row");
  }
  const signature = record?.sig ?? record?.sig_ed25519;
  if (typeof signature === "string" && /^[0-9a-f]{64}$/iu.test(signature)) {
    issues.push("32-byte digest represented as an Ed25519 signature");
  }
  if (record?.anchors && typeof record.anchors === "object") {
    for (const receipt of Object.values(record.anchors)) {
      if (!receipt || typeof receipt !== "object" || !["pending", "queued"].includes(String(receipt.status ?? "").toLowerCase())) continue;
      for (const key of ["stamp", "entry_uuid", "attestation_uid"]) {
        const value = receipt[key];
        if (typeof value === "string" && /^(?:0x)?[0-9a-f]{62,64}$/iu.test(value)) {
          issues.push(`hash-shaped ${key} placeholder`);
        }
      }
    }
  }
  return issues;
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

export function scittProfileIssues(profile) {
  const issues = [];
  if (profile?.implementation_status !== "PLANNED") issues.push("implementation is not PLANNED");
  if (profile?.verification?.scitt_receipt !== null) issues.push("SCITT receipt is not explicitly null");
  if (profile?.door?.evidence_pack !== null) issues.push("unsupported SCITT evidence pack is advertised");
  if (profile?.measurement?.status !== "UNMAPPED") issues.push("SCITT door borrows a measurement status");
  if (profile?.measurement?.axes_covered !== 0) issues.push("SCITT door borrows the global axis count");
  if (!Array.isArray(profile?.statements) || profile.statements.length !== 0) {
    issues.push("unregistered candidate statements are advertised");
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
  assert.equal(
    sourceIsAdmitted("safe/atom.jsonl", {
      allowed_sources: ["safe/atom.jsonl"],
      excluded_prefixes: ["learn-loop/"],
      excluded_globs: ["fake-*.jsonl"],
    }),
    true,
  );
  assert.equal(
    sourceIsAdmitted("learn-loop/fake.jsonl", {
      allowed_sources: ["learn-loop/fake.jsonl"],
      excluded_prefixes: ["learn-loop/"],
      excluded_globs: [],
    }),
    false,
  );
  assert.ok(
    placeholderEvidenceIssues({
      sig: "a".repeat(64),
      council_attestation: {
        council_size: 33,
        yes_count: 33,
        no_count: 0,
        quorum_reached: true,
      },
      anchors: {
        opentimestamps: { status: "pending", stamp: "b".repeat(64) },
        sigstore_rekor: { status: "queued", entry_uuid: "c".repeat(63) },
        eas_base: { status: "queued", attestation_uid: `0x${"d".repeat(62)}` },
      },
    }).length >= 5,
  );
  assert.deepEqual(
    placeholderEvidenceIssues({
      sig_ed25519: "a".repeat(128),
      council_attestation: { status: "UNCHECKABLE", yes_count: 0, no_count: 0 },
      anchors: { opentimestamps: { status: "verified", stamp: "opaque" } },
    }),
    [],
  );
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
  assert.deepEqual(
    scittProfileIssues({
      implementation_status: "PLANNED",
      verification: { scitt_receipt: null },
      door: { evidence_pack: null },
      measurement: { status: "UNMAPPED", axes_covered: 0 },
      statements: [],
    }),
    [],
  );
  assert.ok(
    scittProfileIssues({
      implementation_status: "LIVE",
      verification: { scitt_receipt: "NONE_PUBLISHED" },
      door: { evidence_pack: "/api/evidence-bundle?obligation=scitt" },
      measurement: { status: "BOARD_LIVE", axes_covered: 22 },
      statements: [{}],
    }).length >= 6,
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

function checkLearnLoopIncident(errors, quarantineManifest) {
  const manifestPath = quarantineManifest.learn_loop_incident_manifest;
  if (typeof manifestPath !== "string") {
    errors.push("learn-loop incident manifest is not registered");
    return;
  }
  const incident = readJson(manifestPath);
  const prefix = String(incident.quarantine_prefix ?? "");
  const absolute = path.join(REPO, prefix);
  const names = fs.existsSync(absolute) ? fs.readdirSync(absolute).sort() : [];
  const inventory = names.map((name) => {
    const bytes = fs.readFileSync(path.join(absolute, name));
    return { name, sha256: sha256(bytes), bytes: bytes.length };
  });
  const inventoryHash = sha256(Buffer.from(JSON.stringify(inventory)));
  if (names.length !== incident.file_count) errors.push(`learn-loop quarantine has ${names.length} files, expected ${incident.file_count}`);
  if (inventory.reduce((sum, entry) => sum + entry.bytes, 0) !== incident.total_bytes) {
    errors.push("learn-loop quarantine byte count changed");
  }
  if (inventoryHash !== incident.inventory_sha256) errors.push("learn-loop quarantine inventory changed");
  const rootScope = incident.contaminated_root ?? {};
  if (
    rootScope.invalid_or_derived_leaf_count !== 471 ||
    rootScope.learn_loop_leaf_count !== 240 ||
    rootScope.fabricated_bft_vote_chain_leaf_count !== 231 ||
    rootScope.fabricated_bft_vote_chain_batches !== 7
  ) {
    errors.push("learn-loop incident does not record the full 471-leaf combined root contamination");
  }

  let jsonlRecords = 0;
  const issueClasses = new Set();
  for (const name of names.filter((value) => value.endsWith(".jsonl"))) {
    const relative = `${prefix}${name}`;
    const records = jsonRecords(relative);
    jsonlRecords += records.length;
    for (const record of records) {
      for (const issue of placeholderEvidenceIssues(record)) issueClasses.add(issue);
    }
  }
  if (jsonlRecords !== incident.jsonl_records) errors.push(`learn-loop quarantine has ${jsonlRecords} JSONL records, expected ${incident.jsonl_records}`);
  for (const expected of [
    "hard-coded 33/33 council result",
    "hard-coded 33/33 vote row",
    "32-byte digest represented as an Ed25519 signature",
    "hash-shaped stamp placeholder",
    "hash-shaped entry_uuid placeholder",
    "hash-shaped attestation_uid placeholder",
  ]) {
    if (!issueClasses.has(expected)) errors.push(`learn-loop incident no longer demonstrates: ${expected}`);
  }

  const originalQueue = path.join(REPO, String(incident.original_queue_prefix ?? ""));
  if (fs.existsSync(originalQueue) && fs.readdirSync(originalQueue).length > 0) {
    errors.push("retired learn-loop queue contains active outputs");
  }
}

function checkQuarantineManifest(errors) {
  const manifest = readJson(MANIFEST_PATH);
  checkLearnLoopIncident(errors, manifest);
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
    if (typeof rootEntry.ots_target_match !== "boolean") {
      errors.push(`contaminated root lacks a recorded OTS target result: ${rootEntry.ots_path}`);
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
    const invalidGroups = Array.isArray(rootEntry.invalid_source_groups)
      ? rootEntry.invalid_source_groups
      : [];
    if (invalidGroups.length > 0 && fs.existsSync(path.join(REPO, rootEntry.path))) {
      const root = readJson(rootEntry.path);
      let groupedTotal = 0;
      for (const group of invalidGroups) {
        const prefix = String(group?.prefix ?? "");
        const expected = Number(group?.leaf_count);
        const actual = (root.leaves ?? []).filter((leaf) =>
          String(leaf?.source ?? "").startsWith(prefix),
        ).length;
        groupedTotal += actual;
        if (prefix === "" || !Number.isInteger(expected) || actual !== expected) {
          errors.push(`contaminated root source-group count changed: ${rootEntry.path} (${prefix || "<missing>"})`);
        }
      }
      if (groupedTotal !== rootEntry.invalid_leaf_count) {
        errors.push(`contaminated root combined invalid-leaf count changed: ${rootEntry.path}`);
      }
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
  for (const rootEntry of manifest.contaminated_public_roots) {
    const original = String(rootEntry.original_public_path ?? "");
    const originalOts = String(rootEntry.original_public_ots_path ?? "");
    for (const retiredPath of [original, originalOts]) {
      if (!retiredPath.startsWith("public/interop/")) continue;
      const publicUrl = `https://councilof.ai/${retiredPath.replace(/^public\//u, "")}`;
      if (indexedUrls.has(publicUrl)) {
        errors.push(`interop index still advertises contaminated root: ${retiredPath}`);
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
    "scripts/badger/csoai-learn-loop.py",
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
  if (
    /\(\s*["']com\.csoai\.learn-loop-5min["']/u.test(
      readText("scripts/badger/csoai-improvement-wave.py"),
    )
  ) {
    errors.push("retired learn-loop writer remains scheduled by csoai-improvement-wave.py");
  }

  for (const relativePath of walkFiles(
    "scripts/badger",
    (candidate) => /\/csoai-[^/]+\.py$/u.test(candidate),
  )) {
    const source = readText(relativePath);
    if (source.includes("QUARANTINED_GENERATOR = True")) continue;
    for (const pattern of [
      /["']yes_count["']\s*:\s*33/u,
      /["']yes["']\s*:\s*33/u,
      /\[\s*["'](?:sig|sig_ed25519|stamp|entry_uuid|attestation_uid)["']\s*\]\s*=\s*hashlib\.sha256/u,
      /["'](?:sig|sig_ed25519|stamp|entry_uuid|attestation_uid)["']\s*:\s*hashlib\.sha256/u,
    ]) {
      if (pattern.test(source)) {
        errors.push(`active producer contains a placeholder evidence constructor: ${relativePath}`);
        break;
      }
    }
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

  const learnLoopPlist = readText(
    "scripts/badger/_queue/launch-agents/com.csoai.learn-loop-5min.plist",
  );
  if (!/<key>Disabled<\/key>\s*<true\/>/u.test(learnLoopPlist)) {
    errors.push("learn-loop recurring writer plist is not disabled");
  }
  if (!/<key>RunAtLoad<\/key>\s*<false\/>/u.test(learnLoopPlist)) {
    errors.push("learn-loop recurring writer plist still runs at load");
  }
  if (/<key>StartInterval<\/key>|<key>StartCalendarInterval<\/key>/u.test(learnLoopPlist)) {
    errors.push("learn-loop recurring writer plist still has a recurring trigger");
  }

  const atomRootSource = readText("scripts/badger/atom-root.py");
  if (atomRootSource.includes("submit_ots")) {
    errors.push("atom-root producer can still submit OTS directly");
  }
  const otsJob = readText("scripts/badger/ots-anchor.sh");
  if (!otsJob.includes("atom-root.py --dry-run")) {
    errors.push("recurring OTS job does not keep atom-root generation in dry-run mode");
  }
  if (!otsJob.includes("ots_proof_inventory.py --null")) {
    errors.push("recurring OTS job does not use the quarantine-pruning proof inventory");
  }
  if (otsJob.includes("csoai-auto-ots.py")) {
    errors.push("recurring OTS job still invokes the retired bulk per-atom stamper");
  }
  const batchJob = readText("scripts/badger/csoai-batch-all.py");
  if (batchJob.includes('"csoai-auto-ots.py')) {
    errors.push("batch orchestrator still invokes the retired bulk per-atom stamper");
  }
  if (/find\s+\.\s+[^\n]*\.ots/u.test(otsJob)) {
    errors.push("recurring OTS job can traverse every .ots file with find");
  }
  const inventory = readText("scripts/badger/ots_proof_inventory.py");
  for (const required of [
    'Path("evidence/incidents")',
    "os.walk(root, topdown=True)",
    "dirnames[:] =",
  ]) {
    if (!inventory.includes(required)) {
      errors.push(`OTS proof inventory lost quarantine-pruning invariant: ${required}`);
    }
  }
}

function checkAtomSourcePolicy(errors) {
  const policy = readJson(ATOM_SOURCE_POLICY_PATH);
  if (policy.default !== "deny") errors.push("atom-root source policy is not default-deny");
  const allowed = Array.isArray(policy.allowed_sources) ? policy.allowed_sources : [];
  if (allowed.length === 0) errors.push("atom-root source policy has no reviewed source");
  if (new Set(allowed).size !== allowed.length) errors.push("atom-root source allowlist contains duplicates");

  for (const required of QUARANTINED_SOURCE_PREFIXES) {
    if (!(policy.excluded_prefixes ?? []).includes(required)) {
      errors.push(`atom-root source policy lost incident exclusion: ${required}`);
    }
  }
  if (!(policy.excluded_globs ?? []).includes("eat-more-atoms-*.jsonl")) {
    errors.push("atom-root source policy lost the eat-more placeholder exclusion");
  }

  for (const source of allowed) {
    if (!sourceIsAdmitted(source, policy)) {
      errors.push(`allowlisted atom source is excluded or malformed: ${source}`);
      continue;
    }
    const relativePath = `scripts/badger/_queue/${source}`;
    if (!fs.existsSync(path.join(REPO, relativePath))) {
      errors.push(`allowlisted atom source is missing: ${source}`);
      continue;
    }
    for (const [index, record] of jsonRecords(relativePath).entries()) {
      const issues = record?.__parse_error ? ["invalid JSON"] : placeholderEvidenceIssues(record);
      for (const issue of issues) {
        errors.push(`allowlisted atom source contains ${issue}: ${source}:${index + 1}`);
      }
    }
  }

  // Review every non-quarantined queue file, including files not yet admitted.
  // Explicitly quarantined incident classes remain preserved but cannot pass the
  // exact-path allowlist above.
  for (const relativePath of walkFiles(
    "scripts/badger/_queue",
    (candidate) => candidate.endsWith(".jsonl"),
  )) {
    const source = path.posix.relative("scripts/badger/_queue", relativePath);
    const explicitlyExcluded = (policy.excluded_prefixes ?? []).some((prefix) =>
      source.startsWith(prefix),
    ) || (policy.excluded_globs ?? []).some((pattern) => globMatches(source, pattern));
    if (explicitlyExcluded) continue;
    const text = readText(relativePath);
    if (!/["'](?:yes|yes_count|sig|sig_ed25519|anchors)["']/u.test(text)) continue;
    for (const [index, record] of jsonRecords(relativePath).entries()) {
      if (record?.__parse_error) continue;
      for (const issue of placeholderEvidenceIssues(record)) {
        errors.push(`active queue contains ${issue}: ${source}:${index + 1}`);
      }
    }
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
  if (scittProfileIssues(profile).length > 0) {
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
  const policy = readJson(ATOM_SOURCE_POLICY_PATH);
  const interopDir = path.join(REPO, "public/interop");
  const rootFiles = fs
    .readdirSync(interopDir)
    .filter((name) => /^atom-root-.+\.json$/u.test(name))
    .sort();
  for (const name of rootFiles) {
    const relativePath = `public/interop/${name}`;
    const root = readJson(relativePath);
    const invalidLeaves = (root.leaves ?? []).filter((leaf) =>
      !sourceIsAdmitted(leaf?.source, policy),
    );
    if (invalidLeaves.length > 0) {
      errors.push(
        `${relativePath} is still publishable and commits ${invalidLeaves.length} non-admitted leaves`,
      );
    }
  }
}

function runGate() {
  const errors = [];
  checkQuarantineManifest(errors);
  checkGenerators(errors);
  checkAtomSourcePolicy(errors);
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
