import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runFixture, runTrial } from './approval-effect-demo.mjs';

describe('bounded approval-to-effect demonstration', () => {
  it('actually writes one scoped effect under a synthetic signed approval, denies replay and detects tampering', () => {
    const result = runFixture('pass');
    assert.equal(result.execution, 'EXECUTED');
    assert.equal(result.observer, 'EFFECT_READBACK_MATCHED');
    assert.equal(result.replay, 'DENIED');
    assert.equal(result.replay_does_not_append, true);
    assert.equal(result.modified_effect_observer, 'EFFECT_READBACK_MISMATCH');
  });
  for (const scenario of ['revoked','unknown_revocation','stale_claim','expired','not_yet_valid','wrong_scope','tampered_request','invalid_signature','wrong_epoch','deny']) {
    it(`does not write any effect when ${scenario}`, () => {
      const result = runFixture(scenario);
      assert.equal(result.execution, 'DENIED');
      assert.equal(result.actual_effect_written, false);
      assert.equal(result.observer, 'NO_EFFECT');
    });
  }
  it('labels the trial scope and institutional-review state without promotional inference', () => {
    const t = runTrial();
    assert.equal(t.passed,true);
    assert.equal(t.production_authority,false);
    assert.equal(t.independent_review,'NOT_CONDUCTED');
    assert.equal(t.human_approval,'SYNTHETIC_KEY_ONLY');
    assert.equal(t.cases.length,11);
  });
});
