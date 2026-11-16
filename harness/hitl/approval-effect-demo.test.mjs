import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { generateKeyPairSync, sign } from 'node:crypto';
import { fileURLToPath } from 'node:url';
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
  // The digest is checked before the record is parsed, so bytes that are not the pinned record are
  // refused the same way whatever they are. Deterministic: no second process, no timing.
  for (const [label, bytes] of [
    ['is not JSON', 'not json at all\n'],
    ['is two records back to back', null],
    ['is empty', ''],
  ]) {
    it(`refuses an authority file that ${label} without parsing it, and exits cleanly`, () => {
      const dir = mkdtempSync(join(tmpdir(), 'csoai-approval-effect-'));
      try {
        const at = Date.now();
        const pin = prepare(dir, at).authority_sha256;
        const authorityPath = join(dir, 'authority.json');
        const original = readFileSync(authorityPath, 'utf8');
        writeFileSync(authorityPath, bytes === null ? original + original : bytes);
        const harness = fileURLToPath(new URL('./approval-effect-demo.mjs', import.meta.url));
        const run = spawnSync(process.execPath, [harness, '--execute', dir, String(at), pin], { encoding: 'utf8', timeout: 10000 });
        assert.equal(run.status, 0, run.stderr);
        const result = JSON.parse(run.stdout);
        assert.equal(result.state, 'DENIED');
        assert.deepEqual(result.reasons, ['AUTHORITY_RECORD_NOT_PINNED_OR_CHANGED']);
        assert.equal(existsSync(join(dir, 'effects.jsonl')), false);
        assert.equal(execute(dir, at, pin).state, 'DENIED');
        assert.equal(observe(dir, pin).state, 'NO_EFFECT');
      } finally { rmSync(dir, { recursive: true, force: true }); }
    });
  }
  // Review of #4370: the first pinned version hashed a SECOND read of authority.json. A file that
  // answers two reads differently (a FIFO) then gave the parser an attacker-key record and the
  // digest the original one, and the effect was written. One read per operation closes it.
  // This test was timing-dependent as first written (found 2026-11-16 on run 43820988799): when the
  // feeder's second write landed before the reader saw end-of-file, the single read returned both
  // records back to back, the parse threw and the process exited 2 instead of reporting DENIED.
  // The effect was never written, but the test failed. With the digest checked before the parse,
  // every interleaving is the same refusal.
  it('hashes the authority bytes it parses: a file that answers two reads differently is refused', (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'csoai-approval-effect-'));
    const side = mkdtempSync(join(tmpdir(), 'csoai-approval-effect-side-'));
    let writer;
    try {
      const at = Date.now();
      const pin = prepare(dir, at).authority_sha256;
      const authorityPath = join(dir, 'authority.json');
      const original = readFileSync(authorityPath);
      const attacker = generateKeyPairSync('ed25519');
      const forged = { ...JSON.parse(original.toString('utf8')), trust: attacker.publicKey.export({ type: 'spki', format: 'pem' }).toString() };
      writeFileSync(join(side, 'forged.json'), JSON.stringify(forged, null, 2) + '\n');
      writeFileSync(join(side, 'original.json'), original);
      const approval = JSON.parse(readFileSync(join(dir, 'approval.json'), 'utf8'));
      approval.signature = sign(null, Buffer.from(JSON.stringify(approval.statement)), attacker.privateKey).toString('base64');
      writeFileSync(join(dir, 'approval.json'), JSON.stringify(approval, null, 2) + '\n');
      rmSync(authorityPath);
      if (process.platform === 'win32' || spawnSync('mkfifo', [authorityPath]).status !== 0) { t.skip('no mkfifo on this host'); return; }
      // First open gets the forged record, second open gets the original bytes the pin matches.
      const feed = "const fs=require('node:fs');const [a,b,f]=process.argv.slice(1);fs.writeFileSync(f,fs.readFileSync(a));fs.writeFileSync(f,fs.readFileSync(b));";
      writer = spawn(process.execPath, ['-e', feed, join(side, 'forged.json'), join(side, 'original.json'), authorityPath], { stdio: 'ignore' });
      const harness = fileURLToPath(new URL('./approval-effect-demo.mjs', import.meta.url));
      const run = spawnSync(process.execPath, [harness, '--execute', dir, String(at), pin], { encoding: 'utf8', timeout: 10000 });
      assert.equal(run.status, 0, run.stderr);
      const result = JSON.parse(run.stdout);
      assert.equal(result.state, 'DENIED');
      assert.deepEqual(result.reasons, ['AUTHORITY_RECORD_NOT_PINNED_OR_CHANGED']);
      assert.equal(existsSync(join(dir, 'effects.jsonl')), false);
    } finally {
      writer?.kill('SIGKILL');
      rmSync(dir, { recursive: true, force: true });
      rmSync(side, { recursive: true, force: true });
    }
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
