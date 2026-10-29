// Fixture-only ceremony rehearsal tests — fail-closed behavior.
// Run: node --test tools/release-ceremony-rehearsal.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rehearse, fixtureSigner, CeremonyError } from './release-ceremony-rehearsal.mjs';

const fixtureWorkdir = () => {
  const dir = mkdtempSync(join(tmpdir(), 'csoai-rehearsal-'));
  writeFileSync(join(dir, 'a.bin'), 'fixture release bytes A\n');
  writeFileSync(join(dir, 'b.bin'), 'fixture release bytes B\n');
  return dir;
};
const okTimestamp = { stamp: () => ({ state: 'PENDING', ref: null, binding_note: 'rehearsal stamp; pending, never confirmed' }) };

test('happy path: signed manifest, mirrors pushed, readbacks VALID, timestamp PENDING stays pending', () => {
  const work = fixtureWorkdir();
  const mirrors = [mkdtempSync(join(tmpdir(), 'csoai-mirror-a-')), mkdtempSync(join(tmpdir(), 'csoai-mirror-b-'))];
  const m = rehearse({ workDir: work, mirrorDirs: mirrors, signer: fixtureSigner(), timestamp: okTimestamp });
  assert.equal(m.schema, 'csoai.signed-release-manifest/0.1');
  assert.equal(m.files.length, 2);
  assert.ok(m.signer.sig && m.signer.sig.length === 128, 'Ed25519 hex signature present');
  assert.deepEqual(m.mirrors.map((x) => x.state), ['PUSHED', 'PUSHED']);
  assert.deepEqual(m.readbacks.map((r) => r.state), ['VALID', 'VALID']);
  assert.equal(m.proof_state.ots, 'PENDING', 'a pending timestamp remains pending');
  rmSync(work, { recursive: true, force: true });
});

test('fail-closed: unavailable signer aborts, no manifest, mirrors untouched', () => {
  const work = fixtureWorkdir();
  const mirror = mkdtempSync(join(tmpdir(), 'csoai-mirror-c-'));
  assert.throws(() => rehearse({ workDir: work, mirrorDirs: [mirror], signer: null, timestamp: okTimestamp }),
    (e) => e instanceof CeremonyError && e.message.startsWith('SIGNER_UNAVAILABLE'));
  assert.deepEqual(readdirSync(mirror), [], 'nothing published without a signer');
  rmSync(work, { recursive: true, force: true });
});

test('fail-closed: unavailable mirror yields no VALID readback and the ceremony aborts', () => {
  const work = fixtureWorkdir();
  const badMirror = join('/nonexistent-parent-that-cannot-be-created-\u0000', 'mirror'); // mkdir must fail
  assert.throws(() => rehearse({ workDir: work, mirrorDirs: [badMirror], signer: fixtureSigner(), timestamp: okTimestamp }),
    (e) => e instanceof CeremonyError && e.message.startsWith('NO_VALID_READBACK'));
  rmSync(work, { recursive: true, force: true });
});

test('fail-closed on the claim: unavailable transparency service records UNCHECKABLE, never a proof', () => {
  const work = fixtureWorkdir();
  const mirror = mkdtempSync(join(tmpdir(), 'csoai-mirror-d-'));
  const downTimestamp = { stamp: () => { throw new Error('service down'); } };
  const m = rehearse({ workDir: work, mirrorDirs: [mirror], signer: fixtureSigner(), timestamp: downTimestamp });
  assert.equal(m.proof_state.ots, 'UNCHECKABLE');
  assert.match(m.proof_state.binding_note, /no proof claimed/);
  assert.ok(!existsSync(join(work, 'manifest.json')), 'rehearsal writes no manifest file itself');
  rmSync(work, { recursive: true, force: true });
});

test('signature verifies against the throwaway key and fails on tampered bytes', () => {
  const work = fixtureWorkdir();
  const mirror = mkdtempSync(join(tmpdir(), 'csoai-mirror-e-'));
  const signer = fixtureSigner();
  const m = rehearse({ workDir: work, mirrorDirs: [mirror], signer, timestamp: okTimestamp });
  const preimage = Buffer.from(JSON.stringify(JSON.parse(canonicalOf(m))));
  assert.ok(signer.verify(preimage, m.signer.sig), 'signature verifies');
  assert.ok(!signer.verify(Buffer.from('tampered'), m.signer.sig), 'tampered bytes INVALID');
  rmSync(work, { recursive: true, force: true });
});

// helper mirroring the rehearsal canonical form (sorted keys, sig nulled)
function canonicalOf(m) {
  const sortKeys = (o) => Array.isArray(o) ? o.map(sortKeys)
    : (o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortKeys(o[k])])) : o);
  return JSON.stringify(sortKeys({ ...m, signer: { ...m.signer, sig: null } }));
}
