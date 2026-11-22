/**
 * Reproduce the owned-file HITL authority→effect controls as a candidate
 * cross-group measurement capsule. NOT a GSPC axis, real human approval,
 * production test, certification, or independent institutional review.
 *
 * Usage: node scripts/hitl/oversight-measurement-capsule.mjs > capsule.json
 * No remote calls, signing keys, customer data or external effects.
 */
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runTrial } from "../../harness/hitl/approval-effect-demo.mjs";

const ownFile = fileURLToPath(import.meta.url);
const sha = (v) => createHash("sha256").update(v).digest("hex");
const NEGATIVE_SCENARIOS = Object.freeze([
  "revoked", "unknown_revocation", "stale_claim", "expired",
  "not_yet_valid", "wrong_scope", "tampered_request", "invalid_signature",
  "wrong_epoch", "deny", "substituted_trust_key", "unrevoked_by_folder_writer", "missing_pin",
]);

function fail(why) { throw Error("HITL measurement refused: " + why); }

/** Fail closed if the trial does not contain exactly the predeclared scenarios and outcomes. */
export function capsuleFromTrial(trial) {
  if (!trial || trial.schema !== "csoai.approval-effect-trial/1" || trial.passed !== true) fail("unaccepted trial");
  if (!/^[a-f0-9]{64}$/.test(trial.source_sha256 ?? "")) fail("missing source digest");
  if (!Number.isFinite(Date.parse(trial.observed_at))) fail("invalid observation time");
  if (trial.production_authority !== false ||
      trial.human_approval !== "SYNTHETIC_KEY_ONLY" ||
      trial.independent_review !== "NOT_CONDUCTED" ||
      trial.actual_effect !== "LOCAL_OWNED_FILE_ONLY" ||
      trial.authority_pin_source !== "TEST_RUNNER_NOT_AN_EXTERNAL_LEDGER") {
    fail("synthetic or human-authority boundary altered");
  }
  if (!Array.isArray(trial.cases) || trial.cases.length !== NEGATIVE_SCENARIOS.length + 1) fail("denominator changed");
  const cases = new Map();
  for (const c of trial.cases) {
    if (!c || typeof c.scenario !== "string" || cases.has(c.scenario)) fail("malformed or duplicate case");
    cases.set(c.scenario, c);
  }
  if (cases.size !== 14 || !cases.has("pass") || NEGATIVE_SCENARIOS.some(s => !cases.has(s))) fail("missing/unregistered controls");
  const positive = cases.get("pass");
  if (positive.execution !== "EXECUTED" ||
      positive.observer !== "EFFECT_READBACK_MATCHED" ||
      positive.actual_effect_written !== true ||
      positive.replay !== "DENIED" ||
      positive.replay_does_not_append !== true ||
      positive.modified_effect_observer !== "EFFECT_READBACK_MISMATCH") fail("positive or tamper control not discriminating");
  for (const id of NEGATIVE_SCENARIOS) {
    const c = cases.get(id);
    if (c.execution !== "DENIED" || c.observer !== "NO_EFFECT" || c.actual_effect_written !== false) fail("negative control did not refuse " + id);
  }

  const serial = JSON.stringify(trial);
  return {
    schema: "csoai.hitl-cross-group-process-measurement/0.1",
    stage: "CANDIDATE_UNPUBLISHED",
    measured_on: trial.observed_at,
    construct: "Synthetic scoped authorization, local invocation, effect readback, replay/tamper denial",
    source: {
      trial_schema: trial.schema,
      trial_source_sha256: trial.source_sha256,
      trial_receipt_sha256: sha(serial),
      runner: "harness/hitl/approval-effect-demo.mjs --run-fixtures",
      derivation: "scripts/hitl/oversight-measurement-capsule.mjs",
    },
    population: {
      population: "owned local synthetic fixture scenarios only",
      attempted: 14,
      expected_positive: 1,
      expected_negative: 13,
      excluded: 0,
      timeouts: 0,
      independent_real_human_reviews: null,
      note: "Expected fixture cases, not real humans, providers, customers or separate organisations",
    },
    results: {
      approved_fixture_execution_and_readback: "PASS",
      negative_controls_refused: 13,
      positive_effects_observed: 1,
      replay_prevented: true,
      tampered_effect_detected: true,
      trial_control_pass: true,
    },
    effect_authority: {
      human_identity: "NOT_ESTABLISHED",
      human_presence: "NOT_ESTABLISHED",
      professional_competence: "NOT_ASSESSED",
      actual_human_approval: "NOT_TESTED",
      executive_or_regulatory_authority: false,
      independent_review: "NOT_CONDUCTED",
      public_approved_decisions: 0,
      note: "Synthetic test principal. A successful cryptographic test does not establish that a real person approved.",
    },
    gspc: {
      is_axis: false,
      added_to_published_board: false,
      actual_human_oversight_effectiveness: "UNMEASURED",
      requires_pre_registered_bank_and_separate_reviewer: true,
    },
    known_limits: [
      "Local owned-file effect only; no agent/payment/network transaction",
      "Fixture source uses a synthetic signer, not authenticated reviewer identity",
      "One-process stages do not establish distributed revocation or operator response time",
      "Exact source commit, independent rerun and public admission not established by this capsule alone",
      "No production SLA, product safety rating, compliance determination or institutional review",
    ],
  };
}

if (process.argv[1] && resolve(process.argv[1]) === ownFile) {
  try {
    const capsule = capsuleFromTrial(runTrial());
    process.stdout.write(JSON.stringify(capsule, null, 2) + "\n");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
