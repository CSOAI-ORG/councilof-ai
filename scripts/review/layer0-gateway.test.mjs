import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  L0_KID_DEFAULT,
  anchor,
  decideGate,
  episodeHash,
  kid,
  l0Canon,
  l0CanonBytes,
  loadKey,
  makeEnvelope,
  verifyBytes,
} from '../../functions/_lib/layer0.ts';
import { canonicalBytes } from '../../functions/_lib/cardSign.ts';

test('the canonical form is the ONE canonical form the estate uses', () => {
  // layer0's canonical form and cardSign's canonicalBytes must agree for every JSON-safe value,
  // because a reader who can verify a card must be able to verify an envelope with the same rule.
  const samples = [
    { a: 1, b: 'x' },
    { z: 1, a: [1, 2, { y: null }] },
    { nested: { deep: { deeper: [true, false, 0.5, 'ü'] } } },
    [],
    {},
    { 'key with "quotes"': 'v', 'key,with,commas': [1] },
  ];
  for (const s of samples) {
    assert.equal(l0Canon(s), new TextDecoder().decode(canonicalBytes(s)), JSON.stringify(s));
  }
});

test('the canonical form sorts keys at every depth', () => {
  assert.equal(l0Canon({ b: 1, a: { d: 2, c: 3 } }), '{"a":{"c":3,"d":2},"b":1}');
});

test('a decision needs an identity', () => {
  const d = decideGate({ action: 'evidence.collect' });
  assert.equal(d.state, 'deny');
  assert.match(d.reason || '', /no identity/);
});

test('the G-block floor is non-derogable', () => {
  const below = decideGate({ action: 'x', identity: 'did:csoai:a', g_score: 0.49 });
  const at = decideGate({ action: 'x', identity: 'did:csoai:a', g_score: 0.5 });
  assert.equal(below.state, 'deny');
  assert.match(below.reason || '', /G-Block/);
  assert.equal(at.state, 'allow');
});

test('a statutory prohibition is denied and an Annex III domain escalates', () => {
  assert.equal(decideGate({ action: 'art5.social_scoring', identity: 'did:csoai:a' }).state, 'deny');
  assert.equal(decideGate({ action: 'x', identity: 'did:csoai:a', domain: 'healthcare' }).state, 'escalate');
  assert.equal(decideGate({ action: 'evidence.collect', identity: 'did:csoai:a' }).state, 'allow');
});

test('with no signing key the loader refuses and says why - it never generates one', async () => {
  const loaded = await loadKey({});
  assert.equal(loaded.ok, false);
  assert.equal(loaded.keys, null);
  assert.match(loaded.reason || '', /LAYER0_SIGN_KEY_PKCS8_B64/);
});

test('an envelope signs and verifies, and a tampered envelope does not', async () => {
  // A throwaway key, generated here for the test only. It is never published and never reused.
  const kp = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
  const pubB64 = btoa(String.fromCharCode(...new Uint8Array(spki)));

  const decision = decideGate({ action: 'evidence.collect', identity: 'did:csoai:a' });
  const env = await makeEnvelope({
    from: { endpoint: 'tool://local', party: 'did:csoai:a' },
    to: { endpoint: 'csoai://ledger' },
    intent: 'attestation',
    action: 'evidence.collect',
    payload: { inputsHash: 'sha256:abc' },
    decision,
    privateKey: kp.privateKey,
    signKid: L0_KID_DEFAULT,
    episodeAnchor: anchor({}),
    id: '00000000-0000-4000-8000-000000000000',
    now: '2026-10-29T00:00:00.000Z',
  });

  assert.equal(env.sig.alg, 'Ed25519');
  assert.equal(env.sig.kid, L0_KID_DEFAULT);
  assert.match(env.episode.hash, /^sha256:[0-9a-f]{64}$/);

  const unsigned = { ...env };
  delete unsigned.sig;
  assert.equal(await verifyBytes(l0CanonBytes(unsigned), env.sig.value, pubB64), true);

  // The signature covers the envelope WITHOUT its sig field, so moving one byte breaks it.
  const tampered = { ...unsigned, payload: { inputsHash: 'sha256:tampered' } };
  assert.equal(await verifyBytes(l0CanonBytes(tampered), env.sig.value, pubB64), false);
});

test('a PKCS8 secret loads, and the public half it publishes verifies its own signature', async () => {
  // The whole point of deriving the public key from the secret is that they cannot drift.
  const kp = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
  const pkcs8b64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8)));

  const loaded = await loadKey({ LAYER0_SIGN_KEY_PKCS8_B64: pkcs8b64 });
  assert.equal(loaded.ok, true);
  assert.ok(loaded.keys, 'the key pair must be present');
  assert.match(loaded.keys.publicKeyPem, /^-----BEGIN PUBLIC KEY-----/);

  // The published public key must verify what the loaded private key signs.
  const decision = decideGate({ action: 'evidence.collect', identity: 'did:csoai:a' });
  const env = await makeEnvelope({
    from: { party: 'did:csoai:a' },
    to: { endpoint: 'csoai://ledger' },
    intent: 'attestation',
    action: 'evidence.collect',
    payload: { inputsHash: 'sha256:abc' },
    decision,
    privateKey: loaded.keys.privateKey,
    signKid: L0_KID_DEFAULT,
    episodeAnchor: anchor({}),
    id: '00000000-0000-4000-8000-000000000000',
    now: '2026-10-29T00:00:00.000Z',
  });
  const unsigned = { ...env };
  delete unsigned.sig;
  assert.equal(await verifyBytes(l0CanonBytes(unsigned), env.sig.value, loaded.keys.publicKeyB64), true);
});

test('the episode hash separates different payloads and repeats the same one', async () => {
  const a = await episodeHash({ from: { a: 1 }, to: { b: 2 }, action: 'x', payload: { h: '1' } });
  const b = await episodeHash({ from: { a: 1 }, to: { b: 2 }, action: 'x', payload: { h: '2' } });
  const a2 = await episodeHash({ from: { a: 1 }, to: { b: 2 }, action: 'x', payload: { h: '1' } });
  assert.notEqual(a, b);
  assert.equal(a, a2);
});

test('the kid and the anchor have defaults and can be set', () => {
  assert.equal(kid({}), L0_KID_DEFAULT);
  assert.equal(kid({ LAYER0_SIGN_KID: 'did:x#k1' }), 'did:x#k1');
  assert.equal(anchor({}), 'bitcoin:block/954857');
  assert.equal(anchor({ SOV_ANCHOR: 'bitcoin:block/1' }), 'bitcoin:block/1');
});
