import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, checkPerDay, daySpent } from '../src/policy.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const POLICY = {
  allowlist: {
    payTo: ['0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31'],
    resourcePrefixes: ['https://councilof.ai/api/'],
    subjects: ['*'],
    networks: ['eip155:8453'],
    assets: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'],
  },
  caps: { perCallAtomic: '5000', perDayAtomic: '50000' },
};
const GOOD = {
  url: 'https://councilof.ai/api/request-attestation?subject=x',
  subject: 'mistral:7b',
  accepts: [{ payTo: '0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31', amount: '10000',
    network: 'eip155:8453', asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }],
};

test('allows a clean in-policy challenge', () => {
  const r = evaluate(POLICY, GOOD);
  assert.deepEqual(r, ['amount 10000 exceeds per-call cap 5000']); // amount over cap is the ONLY issue here
});

test('refuses foreign payTo', () => {
  const r = evaluate(POLICY, { ...GOOD, accepts: [{ ...GOOD.accepts[0], amount: '1000', payTo: '0x0000000000000000000000000000000000000001' }] });
  assert.ok(r.some(x => x.includes('not in allowlist')));
});

test('refuses out-of-prefix resource', () => {
  const r = evaluate(POLICY, { ...GOOD, url: 'https://evil.example/api/pay' });
  assert.ok(r.some(x => x.includes('outside allowed prefixes')));
});

test('refuses subject not allowlisted', () => {
  const p = structuredClone(POLICY); p.allowlist.subjects = ['a', 'b'];
  const r = evaluate(p, { ...GOOD, subject: 'c' });
  assert.ok(r.some(x => x.includes('not allowlisted')));
});

test('refuses wrong network or asset', () => {
  const r = evaluate(POLICY, { ...GOOD, accepts: [{ ...GOOD.accepts[0], amount: '1000', network: 'eip155:1' }] });
  assert.ok(r.some(x => x.includes('network')));
  const r2 = evaluate(POLICY, { ...GOOD, accepts: [{ ...GOOD.accepts[0], amount: '1000', asset: '0x' + 'ab'.repeat(20) }] });
  assert.ok(r2.some(x => x.includes('asset')));
});

test('per-day cap counts today’s ledger spend', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'csoai-led-'));
  const led = path.join(dir, 'l.jsonl');
  fs.writeFileSync(led, JSON.stringify({ ts: new Date().toISOString(), decision: 'BOUGHT', amount_atomic: '4000' }) + '\n'
    + JSON.stringify({ ts: '2020-01-01T00:00:00Z', decision: 'BOUGHT', amount_atomic: '999999' }) + '\n');
  assert.equal(daySpent(led), 4000n);
  assert.match(checkPerDay(POLICY, '46001', led) || '', /day cap/); // 4000+46001 > 50000
  assert.equal(checkPerDay(POLICY, '46000', led), null);            // 4000+46000 <= 50000
});
