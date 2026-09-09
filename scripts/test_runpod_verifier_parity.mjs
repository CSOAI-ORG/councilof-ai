// Regression: Python/public/browser accepted the 9 Sep RunPod release while the
// packaged offline verifier refused its two explicitly integer error counters.
// No network, signing, production writes, or dependency installation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
import { createHash } from 'node:crypto';
import { verifyCard as packageVerify, defaultProfile, preimageBytes } from '../packages/gspc-card-verifier/src/index.mjs';
import { verifyCard as publicVerify } from '../public/signed/verify-card.mjs';
import { verifyCard as npmVerify } from '../mcp/gspc-server/verify-card.mjs';
import { verifyCard as bundleVerify, defaultProfile as bundleProfile } from '../public/verifier/gspc-verify.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dir = join(root, 'public/interop/mill-cards-signed');
const cards = readdirSync(dir).filter(f => /^signed-.*\.json$/.test(f))
  .map(f => ({ file: f, card: JSON.parse(readFileSync(join(dir, f), 'utf8')) }))
  .filter(({ card }) => card.body?.compute_evidence?.run_id?.startsWith('20260909T'));
const source = readFileSync(join(root, 'client/src/lib/cardVerify.ts'), 'utf8');
const { verifyCard: browserVerify } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`);
const profile = defaultProfile();
const checks = {
  package: card => packageVerify(card, profile),
  public: publicVerify,
  browser: card => browserVerify(card, null),
  npm: npmVerify,
  bundle: card => bundleVerify(card, bundleProfile()),
};

test('the RunPod corpus exercises both counter fields and both sample states', () => {
  assert.ok(cards.length >= 56, 'the 56-card release must be present, not silently skipped');
  for (const { card } of cards) {
    assert.equal(card.preimage_rule, 'sha256(canonical body)');
    for (const field of ['parse_errors_excluded', 'transport_errors_excluded']) {
      assert.equal(Number.isSafeInteger(card.body.compute_evidence[field]), true);
      assert.ok(card.body.compute_evidence[field] >= 0);
    }
  }
  assert.ok(cards.some(({ card }) => card.body.compute_evidence.parse_errors_excluded > 0));
  assert.ok(cards.filter(({ card }) => card.body.n >= 30).length >= 40);
  assert.ok(cards.filter(({ card }) => card.body.n < 30).length >= 16);
  console.log(`RunPod parity corpus: ${cards.length} cards; ${cards.filter(({ card }) => card.body.n >= 30).length} n>=30; ${cards.filter(({ card }) => card.body.n < 30).length} n<30`);
});

test('all RunPod cards are VALID in package, public, browser, npm and bundled verifiers', async () => {
  for (const { file, card } of cards) for (const [name, verify] of Object.entries(checks)) {
    const result = await verify(card);
    assert.equal(result.state, 'VALID', `${file} ${name}: ${result.code ?? ''} ${result.reason ?? ''}`);
  }
});

test('changed axis and either error counter are INVALID in every verifier', async () => {
  for (const { file, card } of cards) for (const field of ['axis', 'parse_errors_excluded', 'transport_errors_excluded']) {
    const changed = structuredClone(card);
    if (field === 'axis') changed.body.axis += '-tampered';
    else changed.body.compute_evidence[field] += 1;
    for (const [name, verify] of Object.entries(checks)) {
      assert.equal((await verify(changed)).state, 'INVALID', `${file} ${name} ${field}`);
    }
  }
});

test('recomputed ids cannot hide a changed counter from signature verification', async () => {
  const perRule = profile.ruleProfiles['sha256(canonical body)'];
  const effective = { ...profile, ...perRule, numbers: { ...profile.numbers, ...perRule.numbers } };
  for (const { file, card } of cards) {
    const changed = structuredClone(card);
    changed.body.compute_evidence.parse_errors_excluded += 1;
    changed.id = createHash('sha256').update(preimageBytes(changed.body, effective)).digest('hex');
    for (const [name, verify] of Object.entries(checks)) {
      assert.equal((await verify(changed)).state, 'INVALID', `${file} ${name} recomputed id`);
    }
    assert.equal((await packageVerify(changed, profile)).code, 'SIGNATURE_MISMATCH');
  }
});

test('undeclared integers and unknown key authority remain UNCHECKABLE', async () => {
  const changed = structuredClone(cards[0].card);
  changed.body.compute_evidence.future_error_budget = 7;
  assert.equal((await packageVerify(changed, profile)).code, 'OUT_OF_PROFILE_DOMAIN');
  for (const verify of Object.values(checks)) {
    assert.equal((await verify({ ...cards[0].card, did: 'did:web:unknown.invalid#k1' })).state, 'UNCHECKABLE');
  }
  assert.ok(!profile.numbers.intFields.includes('parse_errors_excluded'), 'do not broaden the legacy rule');
  assert.ok(!profile.numbers.intFields.includes('transport_errors_excluded'), 'do not broaden the legacy rule');
});

test('MCP prepack retains the canonical published verifier byte-for-byte', () => {
  assert.deepEqual(readFileSync(join(root, 'mcp/gspc-server/verify-card.mjs')), readFileSync(join(root, 'public/signed/verify-card.mjs')));
  assert.match(readFileSync(join(root, 'mcp/gspc-server/pack.mjs'), 'utf8'), /\.\.\/\.\.\/public\/signed\/verify-card\.mjs/);
});
