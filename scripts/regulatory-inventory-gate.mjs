#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INVENTORY_PATH = path.join(ROOT, "public/interop/regulatory-inventory.json");
const BOARD_PATH = path.join(ROOT, "public/signed/gspc-board.signed.json");
const INTOTO_INDEX_PATH = path.join(ROOT, "public/interop/crosswalk/intoto/index.json");
const EAST_WEST_PATH = path.join(ROOT, "public/crosswalk/east-west-v1.json");
const FROZEN_MANIFEST_PATH = path.join(ROOT, "public/interop/frozen-provision-hashes.json");

const INSTRUMENTS_BY_CELEX = {
  "32016R0679": "GDPR",
  "32022L2464": "CSRD",
  "32022L2555": "NIS2",
  "32022R2554": "DORA",
  "32024R1689": "EU AI Act",
  "32024R2847": "Cyber Resilience Act",
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function provisionRoot(anchors) {
  const hash = crypto.createHash("sha256");
  for (const key of Object.keys(anchors).sort()) {
    hash.update(key);
    hash.update(anchors[key]);
  }
  return hash.digest("hex");
}

function validate(
  inventory,
  { root = ROOT, board, intotoIndex, eastWest, frozenManifest, frozenManifestBytes } = {},
) {
  const errors = [];
  const expect = (condition, message) => {
    if (!condition) errors.push(message);
  };

  expect(inventory?.schema === "csoai.regulatory-inventory/0.1", "unexpected inventory schema");
  expect(inventory?.counts?.frozen_provision_counter === 417, "frozen provision counter must be 417");
  expect(inventory?.frozen_provisions?.value === 417, "frozen provision record must agree with the 417 counter");
  expect(
    inventory?.frozen_provisions?.state === "HASH_MANIFEST_VERIFIED_SOURCE_BYTES_UNRESOLVED",
    "417 must distinguish a verified hash manifest from unresolved source bytes",
  );

  const anchors = frozenManifest?.anchors ?? {};
  const anchorEntries = Object.entries(anchors);
  expect(frozenManifest?.provisions === 417, "frozen manifest must declare 417 provisions");
  expect(anchorEntries.length === 417, `frozen manifest has ${anchorEntries.length} rows, expected 417`);
  expect(new Set(anchorEntries.map(([key]) => key)).size === 417, "frozen provision ids must be unique");
  expect(
    frozenManifest?.normaliser_version === inventory?.frozen_provisions?.normaliser_version,
    "normaliser version must agree with the inventory",
  );
  expect(
    typeof frozenManifest?.watcher === "string" && frozenManifest.watcher.startsWith("NOT BUILT"),
    "frozen manifest must retain the no-authority-watcher limitation",
  );

  const manifestInstrumentCounts = {};
  let annexes = 0;
  for (const [id, digest] of anchorEntries) {
    const match = /^(\d{5}[RL]\d{4}):(-?\d+)$/.exec(id);
    expect(Boolean(match), `${id}: malformed frozen provision id`);
    expect(/^[0-9a-f]{64}$/.test(digest), `${id}: malformed provision SHA-256`);
    if (!match) continue;
    const instrument = INSTRUMENTS_BY_CELEX[match[1]];
    expect(Boolean(instrument), `${id}: unknown CELEX instrument`);
    if (!instrument) continue;
    manifestInstrumentCounts[instrument] = (manifestInstrumentCounts[instrument] ?? 0) + 1;
    if (Number(match[2]) < 0) annexes += 1;
  }
  expect(annexes === 13, `frozen manifest has ${annexes} annex rows, expected 13`);

  const recomputedRoot = provisionRoot(anchors);
  expect(
    recomputedRoot === frozenManifest?.corpus_root,
    `frozen manifest root does not recompute: ${recomputedRoot}`,
  );
  expect(
    frozenManifest?.corpus_root === inventory?.frozen_provisions?.corpus_root,
    "frozen manifest root must agree with the inventory",
  );
  expect(
    inventory?.frozen_provisions?.evidence_source === "public/interop/frozen-provision-hashes.json",
    "inventory must point to the public 417-row hash manifest",
  );
  if (frozenManifestBytes) {
    expect(
      sha256(frozenManifestBytes) === inventory?.frozen_provisions?.evidence_sha256,
      "frozen manifest file SHA-256 must agree with the inventory",
    );
  }

  const instrumentTotal = Object.values(inventory?.frozen_provisions?.instruments ?? {}).reduce(
    (sum, value) => sum + Number(value),
    0,
  );
  expect(instrumentTotal === 417, `frozen instrument counts sum to ${instrumentTotal}, expected 417`);
  for (const [instrument, expectedCount] of Object.entries(inventory?.frozen_provisions?.instruments ?? {})) {
    expect(
      manifestInstrumentCounts[instrument] === expectedCount,
      `${instrument}: manifest has ${manifestInstrumentCounts[instrument] ?? 0}, expected ${expectedCount}`,
    );
  }

  const adapters = inventory?.authority_adapters ?? [];
  expect(adapters.length === 17, `authority adapter manifest has ${adapters.length}, expected 17`);
  expect(inventory?.counts?.regulator_authority_adapters === adapters.length, "authority counter does not derive from manifest");
  expect(new Set(adapters.map((row) => row.id)).size === adapters.length, "authority adapter ids must be unique");
  for (const row of adapters) {
    expect(typeof row.source_url === "string" && row.source_url.startsWith("https://"), `${row.id}: missing primary https source`);
    expect(row.output_mode !== "COMPLIANCE_VERDICT", `${row.id}: an adapter cannot emit a compliance verdict`);
    if (row.binding_type === "VOLUNTARY_FRAMEWORK") {
      expect(row.output_mode === "ALIGNMENT_ONLY", `${row.id}: voluntary framework must be alignment-only`);
      expect(row.actor_type !== "REGULATOR", `${row.id}: voluntary framework owner mislabeled as regulator`);
    }
  }

  const assets = inventory?.crosswalk_assets ?? [];
  expect(assets.length === 25, `crosswalk asset manifest has ${assets.length}, expected 25`);
  expect(inventory?.counts?.crosswalk_assets === assets.length, "crosswalk counter does not derive from manifest");
  expect(new Set(assets.map((row) => row.id)).size === assets.length, "crosswalk asset ids must be unique");
  expect(new Set(assets.map((row) => row.path)).size === assets.length, "crosswalk asset paths must be unique");
  for (const row of assets) {
    expect(fs.existsSync(path.join(root, row.path)), `${row.id}: missing path ${row.path}`);
  }

  const derived = assets.filter((row) => row.asset_type === "DERIVED_MEASUREMENT_STATEMENT");
  expect(derived.length === 14, `measurement-derived statement count is ${derived.length}, expected 14`);
  const indexedFiles = new Set((intotoIndex?.statements ?? []).map((row) => row.file));
  for (const row of derived) {
    expect(indexedFiles.has(path.basename(row.path)), `${row.id}: statement is absent from the in-toto index`);
  }

  const axes = board?.axes ?? [];
  const axisIds = axes.map((row) => row.axis);
  expect(axes.length === 22, `signed board has ${axes.length} axes, expected 22`);
  expect(new Set(axisIds).size === axes.length, "signed board axis ids must be unique");
  expect(board?.totals?.axes === axes.length, "signed board total does not derive from axis array");
  expect(inventory?.counts?.gspc_axes === axes.length, "inventory GSPC count does not derive from signed board");

  const jurisdictions = eastWest?.jurisdictions ?? [];
  expect(jurisdictions.length === 4, `published east-west crosswalk has ${jurisdictions.length} regimes, expected 4`);
  expect(
    inventory?.counts?.published_crosswalk_regimes === jurisdictions.length,
    "published regime counter does not derive from east-west crosswalk",
  );

  return errors;
}

function selftest() {
  const base = readJson(INVENTORY_PATH);
  const board = readJson(BOARD_PATH);
  const intotoIndex = readJson(INTOTO_INDEX_PATH);
  const eastWest = readJson(EAST_WEST_PATH);
  const frozenManifest = readJson(FROZEN_MANIFEST_PATH);
  const frozenManifestBytes = fs.readFileSync(FROZEN_MANIFEST_PATH);
  const cleanErrors = validate(base, {
    board,
    intotoIndex,
    eastWest,
    frozenManifest,
    frozenManifestBytes,
  });
  if (cleanErrors.length) throw new Error(`selftest fixture is invalid: ${cleanErrors.join("; ")}`);
  const broken = structuredClone(base);
  const brokenManifest = structuredClone(frozenManifest);
  broken.counts.frozen_provision_counter = 418;
  broken.frozen_provisions.evidence_sha256 = "0".repeat(64);
  broken.authority_adapters[1].actor_type = "REGULATOR";
  broken.authority_adapters[1].output_mode = "COMPLIANCE_VERDICT";
  broken.crosswalk_assets[0].path = "public/interop/crosswalk/intoto/does-not-exist.json";
  const firstProvision = Object.keys(brokenManifest.anchors).sort()[0];
  brokenManifest.anchors[firstProvision] = "not-a-sha256";
  const errors = validate(broken, {
    board,
    intotoIndex,
    eastWest,
    frozenManifest: brokenManifest,
    frozenManifestBytes,
  });
  if (errors.length < 7) throw new Error(`selftest expected at least 7 failures, got ${errors.length}`);
  console.log(`regulatory-inventory-gate selftest: PASS (${errors.length} deliberate failures caught)`);
}

if (process.argv.includes("--selftest")) {
  selftest();
} else {
  const inventory = readJson(INVENTORY_PATH);
  const errors = validate(inventory, {
    board: readJson(BOARD_PATH),
    intotoIndex: readJson(INTOTO_INDEX_PATH),
    eastWest: readJson(EAST_WEST_PATH),
    frozenManifest: readJson(FROZEN_MANIFEST_PATH),
    frozenManifestBytes: fs.readFileSync(FROZEN_MANIFEST_PATH),
  });
  if (errors.length) {
    for (const error of errors) console.error(`regulatory-inventory-gate: ${error}`);
    process.exit(1);
  }
  console.log("regulatory-inventory-gate: PASS — 417 provision hashes + reproducible root · 17 authority adapters · 25 crosswalk assets · 22 GSPC axes · 4 published regimes");
}
