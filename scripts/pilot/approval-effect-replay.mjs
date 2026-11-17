#!/usr/bin/env node
// Synthetic only. Acceptance wrapper around the existing HITL approval-to-effect demo.
import { runTrial } from "../../harness/hitl/approval-effect-demo.mjs";
import { writeFileSync } from "node:fs";

const trial = runTrial();
const positives = trial.cases.filter(c => c.scenario === "pass");
const negatives = trial.cases.filter(c => c.scenario !== "pass");
const pass = positives.length === 1 && positives[0].execution === "EXECUTED" &&
  positives[0].observer === "EFFECT_READBACK_MATCHED" &&
  positives[0].replay === "DENIED" && positives[0].replay_does_not_append &&
  positives[0].modified_effect_observer === "EFFECT_READBACK_MISMATCH";
const deny = negatives.length === 13 &&
  negatives.every(c => c.execution === "DENIED" && c.observer === "NO_EFFECT" && c.actual_effect_written === false);
const scope = trial.independent_review === "NOT_CONDUCTED" &&
  trial.human_approval === "SYNTHETIC_KEY_ONLY" &&
  trial.production_authority === false &&
  trial.authority_pin_source === "TEST_RUNNER_NOT_AN_EXTERNAL_LEDGER";
const report = {
  schema: "csoai.pilot-demo/0.1",
  ran_at: trial.observed_at,
  source_sha256: trial.source_sha256,
  fixture_count: trial.cases.length,
  results: { authorised_effect_and_readback: Boolean(pass), negative_controls: deny,
    honest_scope: scope, upstream_trial_passed: trial.passed },
  outcome: trial.passed && pass && deny && scope ? "PASS" : "FAIL",
  independent_review: "NOT_CONDUCTED", human_approval: "SYNTHETIC_KEY_ONLY",
  production_authority: false, gspc_measurement_admission: false,
  limitations: ["Owned temporary files only", "No authenticated human or customer data",
    "Authority trust anchor supplied by local test runner", "Not a model benchmark, certification or outside review"],
  cases: trial.cases.map(c => ({ scenario:c.scenario,execution:c.execution,
    observer:c.observer,actual_effect_written:c.actual_effect_written })),
};
const output = JSON.stringify(report, null, 2) + "\n";
if (process.argv.length === 2) process.stdout.write(output);
else if (process.argv[2] === "--out" && process.argv.length === 4)
  writeFileSync(process.argv[3], output, { flag: "wx" });
else throw Error("Usage: node scripts/pilot/approval-effect-replay.mjs [--out UNCREATED_PATH]");
if (report.outcome !== "PASS") process.exitCode = 1;
