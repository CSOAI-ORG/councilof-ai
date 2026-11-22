/**
 * Council of AI — synthetic HITL v2 evidence-gap bank.
 * Adds two pre-registered *post-execution evidence-availability* controls
 * to the existing 14-case synthetic v1 authorization bank.
 *
 * It does not test an actual human, a remote agent, a payment, or GSPC quality.
 * RUN: node scripts/hitl/receipt-gap-bank-v2.mjs > v2-bank.json
 */
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, unlinkSync, existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { prepare, execute, observe, runTrial } from "../../harness/hitl/approval-effect-demo.mjs";

const THIS = fileURLToPath(import.meta.url);
const BASE = fileURLToPath(new URL("../../harness/hitl/approval-effect-demo.mjs", import.meta.url));
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const GAP_IDS = Object.freeze(["effect_present_receipt_missing", "receipt_present_effect_missing"]);
const refuse = reason => { throw Error("HITL v2 candidate rejected: " + reason); };

export function runEvidenceGap(id) {
  if (!GAP_IDS.includes(id)) refuse("unregistered gap case");
  const dir = mkdtempSync(join(tmpdir(), "csoai-hitl-gap-v2-"));
  try {
    const at = Date.now();
    const pin = prepare(dir, at).authority_sha256;
    if (execute(dir, at, pin).state !== "EXECUTED") refuse("fixture did not execute");
    const before = observe(dir, pin);
    if (before.state !== "EFFECT_READBACK_MATCHED") refuse("fixture was not observed before removal");
    const effectPath = join(dir, "effects.jsonl");
    const receiptPath = join(dir, "effect-receipt.json");
    const preserved = readFileSync(effectPath);
    const beforeDigest = sha256(preserved);
    if (id === "effect_present_receipt_missing") unlinkSync(receiptPath);
    else unlinkSync(effectPath);
    const after = observe(dir, pin);
    const expectedReason = id === "effect_present_receipt_missing" ? "EFFECT_PRESENT_RECEIPT_MISSING" : "RECEIPT_PRESENT_EFFECT_MISSING";
    const remainingEffect = existsSync(effectPath) ? readFileSync(effectPath) : null;
    if (after.state !== "UNCHECKABLE" || after.verified !== false ||
        after.reason !== expectedReason || after.effect_present !== Boolean(remainingEffect) ||
        after.receipt_present !== (id === "receipt_present_effect_missing") ||
        after.effect_sha256 !== (remainingEffect ? sha256(remainingEffect) : null) ||
        (remainingEffect && sha256(remainingEffect) !== beforeDigest)) refuse("partial evidence incorrectly classified");
    return {
      case_id: id,
      precondition: "SYNTHETIC_EXECUTED_AND_LOCAL_READBACK_MATCHED",
      expected_observation: "UNCHECKABLE",
      observed: after,
      original_effect_sha256: beforeDigest,
      remaining_effect_sha256: remainingEffect ? sha256(remainingEffect) : null,
      synthetic_only: true,
    };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

export function deriveV2(base, gaps, asOf = new Date().toISOString()) {
  if (!base || base.schema !== "csoai.approval-effect-trial/1" || base.passed !== true ||
      base.human_approval !== "SYNTHETIC_KEY_ONLY" ||
      base.independent_review !== "NOT_CONDUCTED" ||
      base.production_authority !== false ||
      !Array.isArray(base.cases) || base.cases.length !== 14 ||
      !/^[a-f0-9]{64}$/.test(base.source_sha256)) refuse("v1 precondition absent");
  if (!Array.isArray(gaps) || gaps.length !== 2 ||
      new Set(gaps.map(g => g?.case_id)).size !== 2 ||
      GAP_IDS.some(id => !gaps.some(g => g?.case_id === id))) refuse("wrong v2 gap denominator");
  const positives = base.cases.filter(c => c.scenario === "pass" && c.execution === "EXECUTED" && c.observer === "EFFECT_READBACK_MATCHED");
  const refusals = base.cases.filter(c => c.scenario !== "pass" && c.execution === "DENIED" && c.observer === "NO_EFFECT" && c.actual_effect_written === false);
  if (positives.length !== 1 || refusals.length !== 13) refuse("v1 control result changed");
  for (const id of GAP_IDS) {
    const g = gaps.find(g => g.case_id === id);
    const reason = id === "effect_present_receipt_missing" ? "EFFECT_PRESENT_RECEIPT_MISSING" : "RECEIPT_PRESENT_EFFECT_MISSING";
    if (!g || g.expected_observation !== "UNCHECKABLE" || g.observed?.state !== "UNCHECKABLE" ||
        g.observed.verified !== false || g.observed.reason !== reason ||
        g.observed.effect_present !== (id === "effect_present_receipt_missing") ||
        g.observed.receipt_present !== (id === "receipt_present_effect_missing") ||
        g.synthetic_only !== true || !/^[a-f0-9]{64}$/.test(g.original_effect_sha256) ||
        g.remaining_effect_sha256 !== (id === "effect_present_receipt_missing" ? g.original_effect_sha256 : null))
      refuse("gap control not discriminating " + id);
  }
  if (!Number.isFinite(Date.parse(asOf))) refuse("invalid observation time");
  const srcDigest=sha256(readFileSync(BASE));
  if (base.source_sha256 !== srcDigest) refuse("trial did not use current source bytes");
  return {
    schema: "csoai.hitl-synthetic-bank/2",
    state: "CANDIDATE_NOT_GSPC_AXIS",
    observed_at: asOf,
    experiment: "Owned local file authorization and incomplete-receipt observation",
    sources: {
      v1_source_sha256: srcDigest,
      v2_runner_sha256: sha256(readFileSync(THIS)),
      v1_trial_sha256: sha256(JSON.stringify(base)),
      no_external_human_review: true,
    },
    denominator: {
      all_cases: 16,
      synthetic_positive_authorization: 1,
      authorization_refusal_controls: 13,
      post_execution_evidence_gap_controls: 2,
      external_people_tested: 0,
      agentic_remote_actions: 0,
      missing_or_excluded: 0,
      note: "Different control classes; do not call all 15 negative cases authorization refusals",
    },
    outcomes: {
      synthetic_executed_and_observed: 1,
      synthetic_authorization_denied: 13,
      incomplete_evidence_UNCHECKABLE: 2,
      control_pass: true,
    },
    cases: [
      ...base.cases.map(c => ({ case_id: c.scenario, family: "v1_authority", expected: c.scenario === "pass" ? "EXECUTED" : "DENIED", observed: c.execution, effect_observation: c.observer })),
      ...gaps.map(g => ({ case_id: g.case_id, family: "v2_evidence_gap", expected: "UNCHECKABLE", observed: g.observed.state, evidence_reason: g.observed.reason, original_effect_sha256: g.original_effect_sha256, remaining_effect_sha256: g.remaining_effect_sha256 })),
    ],
    claim_limits: {
      human_identity: "NOT_ESTABLISHED",
      human_approval: "NOT_TESTED",
      professional_competence: "NOT_ASSESSED",
      independent_review: "NOT_CONDUCTED",
      production_effect: "NOT_TESTED",
      gspc_axis_admission: false,
      external_safe_adoption: false,
      public_certification: false,
    },
    provenance: "Public reviewer counterexample: https://github.com/CSOAI-ORG/councilof-ai/discussions/4605",
  };
}

export function runBankV2() {
  const base = runTrial();
  const gaps = GAP_IDS.map(runEvidenceGap);
  return deriveV2(base, gaps);
}

if (process.argv[1] && resolve(process.argv[1]) === THIS) {
  try { process.stdout.write(JSON.stringify(runBankV2(), null, 2) + "\n"); }
  catch (e) { console.error(e instanceof Error ? e.message : String(e)); process.exitCode = 1; }
}

