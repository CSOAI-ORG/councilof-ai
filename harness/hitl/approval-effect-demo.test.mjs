import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runFixture, runTrial, prepare, execute, observe } from './approval-effect-demo.mjs';

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
  // The authority record is trusted by a digest the caller holds, never by what the folder says.
  // Found 2026-11-16: with the key read from the folder, a swapped key plus a re-signed approval
  // executed and passed readback, and no control covered it.
  for (const scenario of ['substituted_trust_key','unrevoked_by_folder_writer','missing_pin']) {
    it(`does not write any effect when ${scenario}, and says the authority record is not the pinned one`, () => {
      const result = runFixture(scenario);
      assert.equal(result.execution, 'DENIED');
      assert.deepEqual(result.reasons, ['AUTHORITY_RECORD_NOT_PINNED_OR_CHANGED']);
      assert.equal(result.actual_effect_written, false);
      assert.equal(result.observer, 'NO_EFFECT');
    });
  }
  it('an effect written under one authority record does not read back under another pin', () => {
    const dir = mkdtempSync(join(tmpdir(), 'csoai-approval-effect-'));
    try {
      const at = Date.now();
      const pin = prepare(dir, at).authority_sha256;
      assert.equal(execute(dir, at, pin).state, 'EXECUTED');
      assert.equal(observe(dir, pin).state, 'EFFECT_READBACK_MATCHED');
      assert.equal(observe(dir, 'f'.repeat(64)).state, 'EFFECT_READBACK_MISMATCH');
      assert.equal(observe(dir).state, 'EFFECT_READBACK_MISMATCH');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('labels the trial scope and institutional-review state without promotional inference', () => {
    const t = runTrial();
    assert.equal(t.passed,true);
    assert.equal(t.production_authority,false);
    assert.equal(t.independent_review,'NOT_CONDUCTED');
    assert.equal(t.human_approval,'SYNTHETIC_KEY_ONLY');
    assert.equal(t.trust_anchor,'AUTHORITY_RECORD_SHA256_SUPPLIED_BY_CALLER');
    assert.equal(t.authority_pin_source,'TEST_RUNNER_NOT_AN_EXTERNAL_LEDGER');
    assert.equal(t.cases.length,14);
  });
});
