import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runTrial } from "../../harness/hitl/approval-effect-demo.mjs";
import { capsuleFromTrial } from "./oversight-measurement-capsule.mjs";

const trial = runTrial();
const variant = () => structuredClone(trial);

describe("candidate HITL process measurement capsule", () => {
  it("replays the actual owned-file trial, counts exact predeclared controls and refuses human-authority inflation", () => {
    const c = capsuleFromTrial(trial);
    assert.equal(c.population.attempted, 14);
    assert.equal(c.population.expected_positive, 1);
    assert.equal(c.population.expected_negative, 13);
    assert.equal(c.results.negative_controls_refused, 13);
    assert.equal(c.results.positive_effects_observed, 1);
    assert.equal(c.results.replay_prevented, true);
    assert.equal(c.results.tampered_effect_detected, true);
    assert.equal(c.effect_authority.actual_human_approval, "NOT_TESTED");
    assert.equal(c.effect_authority.human_identity, "NOT_ESTABLISHED");
    assert.equal(c.effect_authority.independent_review, "NOT_CONDUCTED");
    assert.equal(c.gspc.is_axis, false);
    assert.equal(c.gspc.actual_human_oversight_effectiveness, "UNMEASURED");
    assert.match(c.source.trial_source_sha256, /^[a-f0-9]{64}$/);
    assert.match(c.source.trial_receipt_sha256, /^[a-f0-9]{64}$/);
  });

  it("rejects positive effects with missing independent local readback", () => {
    const v = variant();
    v.cases.find(x => x.scenario === "pass").observer = "UNCHECKABLE";
    assert.throws(() => capsuleFromTrial(v), /positive or tamper/);
  });

  it("rejects non-discriminating negative controls, even when the outer trial claims pass", () => {
    const v = variant();
    v.cases.find(x => x.scenario === "wrong_scope").execution = "EXECUTED";
    assert.throws(() => capsuleFromTrial(v), /negative control/);
  });

  it("rejects duplicate, missing or added scenarios instead of changing the denominator", () => {
    const v = variant();
    v.cases[1].scenario = v.cases[0].scenario;
    assert.throws(() => capsuleFromTrial(v), /duplicate/);
    const v2 = variant();
    v2.cases.pop();
    assert.throws(() => capsuleFromTrial(v2), /denominator changed/);
  });

  it("rejects promoted human identity, production authority and invented independent review", () => {
    const v = variant(); v.human_approval = "AUTHENTICATED_HUMAN";
    assert.throws(() => capsuleFromTrial(v), /synthetic or human-authority/);
    const v2 = variant(); v2.production_authority = true;
    assert.throws(() => capsuleFromTrial(v2), /synthetic or human-authority/);
    const v3 = variant(); v3.independent_review = "CONDUCTED";
    assert.throws(() => capsuleFromTrial(v3), /synthetic or human-authority/);
  });

  it("rejects trials without immutable source digest or observation time", () => {
    const v = variant(); v.source_sha256 = "missing";
    assert.throws(() => capsuleFromTrial(v), /source digest/);
    const v2 = variant(); v2.observed_at = "not a date";
    assert.throws(() => capsuleFromTrial(v2), /observation time/);
  });
});
