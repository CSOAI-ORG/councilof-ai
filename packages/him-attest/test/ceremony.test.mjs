import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runCeremony, attachHumanDecision, finalize, sha256 } from '../src/ceremony.js';
import { ensureKey, signDecision, createHumanSigner, buildDualSignedReceipt } from '../src/human-key.js';

const DIR = new URL('../frameworks/', import.meta.url).pathname;

function mockFetch(responses) {
  return async (url) => ({
    ok: true,
    json: async () => (typeof responses[url] === 'function' ? responses[url]() : responses[url]),
  });
}

const CARD = (subject) => ({ subject, sha256: sha256({ subject }).slice(0, 16) + '…', as_of: '2026-11-01T00:00:00Z' });
const BUNDLE = (state, cards, relevant) => ({ state, cards, relevant_signed_cards: relevant ?? cards.length });

test('ceremony classifies machine vs human honestly (art50, mocked evidence)', async () => {
  const f = mockFetch({
    'https://councilof.ai/api/evidence-bundle?obligation=article-50&preview=true': BUNDLE('RELEVANT_CARDS_FOUND',
      [CARD('Art 50 generator content-marking census'), CARD('Anthropic — art50_marking: bytes changed 2026-10-25')]),
  });
  const { pack, tasks } = await runCeremony({ frameworkSlug: 'eu-ai-act-art50', frameworksDir: DIR, subject: 'acme-corp', fetchImpl: f });
  const byId = Object.fromEntries(pack.checkpoints.map(c => [c.id, c]));
  assert.equal(byId['art50.census-current'].status, 'MACHINE-EVIDENCED');
  assert.ok(byId['art50.marking-drift'].status === 'MACHINE-EVIDENCED'); // filter matches the anthropic card
  assert.equal(byId['art50.deployer-disclosure'].status, 'HUMAN-REQUIRED');
  assert.equal(tasks.length, 3); // deployer + deepfake + owner
  assert.ok(pack.ceremony_sha256);
});

test('NEVER FAKE: missing evidence → UNMEASURED declared, not passed, not failed', async () => {
  const f = mockFetch({
    'https://councilof.ai/api/evidence-bundle?obligation=article-50&preview=true': BUNDLE('RELEVANT_CARDS_FOUND', []),
  });
  const { pack } = await runCeremony({ frameworkSlug: 'eu-ai-act-art50', frameworksDir: DIR, subject: 'ghost', fetchImpl: f });
  const byId = Object.fromEntries(pack.checkpoints.map(c => [c.id, c]));
  assert.equal(byId['art50.census-current'].status, 'UNMEASURED');
  assert.match(byId['art50.census-current'].reason, /never fabricated/);
});

test('human decision: sign → attach → verified; wrong key → thrown; cert-language → thrown', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'him-'));
  const { privateKey, publicKey } = ensureKey(path.join(dir, 'k'));
  const { privateKey: wrong } = ensureKey(path.join(dir, 'w'));
  const ts = new Date().toISOString();
  const base = { task_id: 'f:cp', decision: 'SIGNED', note: 'policy URL + owner name on file', ts };
  const sig = signDecision(privateKey, base);
  const pack = { human_tasks: ['f:cp'], checkpoints: [], human_decisions: [] };
  attachHumanDecision(pack, { ...base, humanKeyPublic: publicKey, signatureB64: sig });
  assert.equal(pack.human_decisions.length, 1);
  // wrong key signed → invalid
  const badSig = signDecision(wrong, base);
  assert.throws(() => attachHumanDecision(pack, { ...base, humanKeyPublic: publicKey, signatureB64: badSig }), /invalid/);
  // certification language in note → rejected
  const sig2 = signDecision(privateKey, { ...base, decision: 'SIGNED', note: 'we are certified' });
  assert.throws(() => attachHumanDecision(pack, { task_id: 'f:cp', decision: 'SIGNED', note: 'we are certified', ts, humanKeyPublic: publicKey, signatureB64: sig2 }), /forbidden/);
});

test('finalize refuses while human tasks pending — we do not fake it', async () => {
  const pack = { human_tasks: ['t1', 't2'], human_decisions: [{ task_id: 't1' }], checkpoints: [{ status: 'HUMAN-REQUIRED' }, { status: 'MACHINE-EVIDENCED' }, { status: 'UNMEASURED' }] };
  assert.throws(() => finalize(pack), /do not fake it/);
  pack.human_decisions.push({ task_id: 't2' });
  const m = finalize(pack);
  assert.deepEqual(m.counts, { machine_evidenced: 1, human_signed: 1, unmeasured_declared: 1 });
  assert.match(m.doctrine, /never certification/);
});

test('board-backed checkpoint: MEASURED axis → MACHINE-EVIDENCED', async () => {
  const f = mockFetch({
    'https://councilof.ai/api/gspc': { axes: [{ axis: 'safety', status: 'MEASURED', as_of: { fetched_at: '2026-11-02' } }, { axis: 'provenance', status: 'UNMEASURED' }] },
    'https://councilof.ai/api/evidence-bundle?obligation=dora&preview=true': BUNDLE('RELEVANT_CARDS_FOUND', [CARD('vendor cards')]),
  });
  const { pack } = await runCeremony({ frameworkSlug: 'iso-42001-lite', frameworksDir: DIR, subject: 'lfx-project', fetchImpl: f });
  const byId = Object.fromEntries(pack.checkpoints.map(c => [c.id, c]));
  assert.equal(byId['iso.model-behaviour-measured'].status, 'MACHINE-EVIDENCED');
  assert.equal(byId['iso.model-behaviour-measured'].evidence[0].sha256, 'board:safety');
  assert.equal(byId['iso.provenance-measured'].status, 'UNMEASURED'); // declared, honest
});

test('csoai-attest × him-attest bridge: createHumanSigner + buildDualSignedReceipt (R1/R3 enforced)', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'him-dual-'));
  const humanSigner = createHumanSigner(path.join(dir, 'human'));
  const machineSigner = createHumanSigner(path.join(dir, 'machine'), { kid: 'machine-slot-1' });
  const payload = { b: 2, a: 1, task_id: 'art50:deployer-disclosure', decision: 'SIGNED' };
  const sigA = humanSigner.sign({ a: 1, b: 2, task_id: 'art50:deployer-disclosure', decision: 'SIGNED' });
  const sigB = humanSigner.sign(payload);
  assert.equal(sigA.payload_sha256, sigB.payload_sha256);
  assert.equal(humanSigner.verify(payload, sigA), true);

  const composite = buildDualSignedReceipt(payload, { machineSigner, humanSigner });
  assert.equal(composite.state, 'COMPOSITE');
  assert.equal(composite.verified, true);
  assert.notEqual(composite.signatures.machine.signature, composite.signatures.human.signature);

  // R1/R3: refusing same key for both machine and human slots
  assert.throws(
    () => buildDualSignedReceipt(payload, { machineSigner: humanSigner, humanSigner }),
    /must not share the same key/,
  );
});
