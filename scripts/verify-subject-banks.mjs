#!/usr/bin/env node
/**
 * scripts/verify-subject-banks.mjs
 *
 * E4 Subject-Family Frozen Bank Audit (LANE-NEXT-WEEK-2026-11-09.md):
 *   Verifies all 11 subject-family axes (lab-practice, company-practice,
 *   measurer-integrity, harness-fidelity, interop-conformance,
 *   humanoid-deployment, regulator-transparency,
 *   interpretability-reproducibility, claim-maintenance,
 *   serving-fidelity, watchdog-ingest):
 *     1. Local frozen bank file exists under public/interop/.
 *     2. Recomputed SHA-256 over the local bank matches the pinned bank_sha256.
 *     3. Sample size n_valid >= 30 (Doctrine #9).
 *     4. Each axis has a 64-hex method_sha and applies_to subject class.
 *
 * Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

export const PINNED_SUBJECT_BANKS = [
  {
    axis: "lab-practice",
    applies_to: "ai-labs",
    n: 37,
    method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    bank_sha256: "b96d0879876f0e405a27a350dde8e0f5d2737e9b69876c4b3287951a69c37ec9",
    bank: "interop/axis-banks/lab-practice-20261102.json",
  },
  {
    axis: "company-practice",
    applies_to: "ai-companies-non-lab",
    n: 40,
    method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    bank_sha256: "23ba58453183dc1804cdb00e0e5b3445ddc53fa038782a9ecf0684566b185b34",
    bank: "interop/axis-banks/company-practice-20261102.json",
  },
  {
    axis: "measurer-integrity",
    applies_to: "evaluation-orgs",
    n: 40,
    method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    bank_sha256: "138a216a54e77949b582804e6179ab752ae7873bf3e67a7650f688a2b54253e3",
    bank: "interop/axis-banks/measurer-integrity-20261102.json",
  },
  {
    axis: "harness-fidelity",
    applies_to: "harnesses",
    n: 36,
    method_sha: "1ec4ee46eb119cae5832ed2ffeb1a203609e11c67523231d25be6240b3ff9ab4",
    bank_sha256: "3f10dc5f034f3ccf5e6522606cfdc3e4bd4ebcf1a86adc2a28420fba41822a3b",
    bank: "interop/axis-banks/harness-fidelity-20261102.json",
  },
  {
    axis: "interop-conformance",
    applies_to: "interop-standards-groups",
    n: 34,
    method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    bank_sha256: "d751a0373a7f6ec58c85b8b6f2ea24de7c73a240ed9ba081ce0086142d9aed0c",
    bank: "interop/axis-banks/interop-conformance-20261102.json",
  },
  {
    axis: "humanoid-deployment",
    applies_to: "humanoid-labs",
    n: 35,
    method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    bank_sha256: "edda7ffcf81d3ea863741aeb275304f581aa1f55792a68df7a9cb65b2a29b0ed",
    bank: "interop/axis-banks/humanoid-deployment-20261102.json",
  },
  {
    axis: "regulator-transparency",
    applies_to: "regulators",
    n: 41,
    method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    bank_sha256: "1a8667ca10ab9486b75daf460a680c12d2b4823ad3bbb9cfd6697143f882f6d5",
    bank: "interop/axis-banks/regulator-transparency-20261102.json",
  },
  {
    axis: "interpretability-reproducibility",
    applies_to: "interpretability-groups",
    n: 33,
    method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    bank_sha256: "d72980fd27f31ff6a2fa63287b4b018219b91785ba03078d8f841b8e581bdd2d",
    bank: "interop/axis-banks/interpretability-reproducibility-20261102.json",
  },
  {
    axis: "claim-maintenance",
    applies_to: "claimed-subjects",
    n: 174,
    method_sha: "32470d102112154b14a4d5530d71d7a30ecc2acdc5cd8c906c21f672b1deeef7",
    bank_sha256: "a62b017a9081b817613c03887c3c6690597a2016ea175f9d95c211d593db0877",
    bank: "public/interop/claim-maintenance-wave-2026-10-28.json",
  },
  {
    axis: "serving-fidelity",
    applies_to: "inference-endpoints-and-routers",
    n: 38,
    method_sha: "1c52eb8d023c452954a42465a5f54a70ebd44e116764a82acf1080c08cc5fdb7",
    bank_sha256: "68826b5e1c0b4539130aaef2113a3901147eec7bb908e263dc02361f589d2c3e",
    bank: "interop/axis-banks/serving-fidelity-20261102.json",
  },
  {
    axis: "watchdog-ingest",
    applies_to: "public-watchdog-and-incident-sources",
    n: 106,
    method_sha: "eeabfeb8a0515d719840d33c2a9320bd8279b7da7db17fc537acd23632509b5b",
    bank_sha256: "8c5a3438294a8dc56baf9fb879b6a336b90bccd5a5a45e3944016b834dff2e88",
    bank: "interop/axis-banks/watchdog-ingest-20261102.json",
  },
];

export function verifySubjectBanks({ repoRoot = REPO_ROOT, specs = PINNED_SUBJECT_BANKS } = {}) {
  const results = [];
  for (const s of specs) {
    const relPath = s.bank.startsWith("public/") ? s.bank : `public/${s.bank}`;
    const absPath = path.join(repoRoot, relPath);
    const exists = fs.existsSync(absPath);
    let actualSha = null;
    if (exists) {
      const bytes = fs.readFileSync(absPath);
      actualSha = crypto.createHash("sha256").update(bytes).digest("hex");
    }
    const shaMatch = actualSha === s.bank_sha256;
    const nValidOk = typeof s.n === "number" && s.n >= 30;
    const methodShaOk = /^[0-9a-f]{64}$/.test(s.method_sha || "");
    const pass = exists && shaMatch && nValidOk && methodShaOk;
    results.push({
      axis: s.axis,
      applies_to: s.applies_to,
      n: s.n,
      bank_path: relPath,
      expected_sha256: s.bank_sha256,
      actual_sha256: actualSha,
      method_sha: s.method_sha,
      status: pass ? "VERIFIED" : "FAIL",
    });
  }
  return {
    ok: results.length === 11 && results.every((r) => r.status === "VERIFIED"),
    count: results.length,
    results,
  };
}

function main() {
  const report = verifySubjectBanks();
  for (const r of report.results) {
    console.log(
      `[${r.status}] axis=${r.axis} n=${r.n} applies_to=${r.applies_to} sha_match=${r.actual_sha256 === r.expected_sha256} bank=${r.bank_path}`,
    );
  }
  if (!report.ok) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
