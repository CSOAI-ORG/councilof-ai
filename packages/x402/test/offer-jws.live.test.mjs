import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyOfferJws } from '../src/offer-jws.js';
import { readFileSync } from 'node:fs';

// Live fixture: the real offer-receipt JWS served by councilof.ai's 402 on 2026-11-02.
const fixture = JSON.parse(readFileSync(new URL('./fixtures/offer-jws.json', import.meta.url), 'utf8'));

test('verifies the LIVE offer JWS from councilof.ai against the live DID doc', async () => {
  const v = await verifyOfferJws(fixture.jws);
  assert.equal(v.ok, true, 'live JWS should verify: ' + (v.reason || ''));
  assert.match(v.kid, /board-attestation-1/);
  // payload shape per x402 offer-receipt spec: flat offer terms
  assert.ok(v.payload?.payTo && v.payload?.amount, 'payload carries the signed offer terms (payTo + amount)');
  assert.equal(v.payload?.payTo, '0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31');
  assert.equal(v.payload?.amount, '10000');
});

test('rejects a mutated JWS (tamper check)', async () => {
  const [h, p, s] = fixture.jws.split('.');
  const v = await verifyOfferJws(`${h}.${p}.${s.slice(0, -4)}AAAA`);
  assert.equal(v.ok, false);
});
