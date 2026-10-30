import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fetchBytes, inspectBytes, projectRecord, MAX_BYTES, SOURCE_URL } from './read-hf-cross-ledger.mjs';

const make = (overrides = {}) => Buffer.from(JSON.stringify({
  schema: 'csoai.cross-ledger-supply/0.2',
  asset: 'BENJI',
  as_of: '2026-09-25T11:12:21Z',
  reconciliation_state: 'UNRECONCILED_WITH_TRANSFER_AGENT',
  issuer_reported: [{ source: 'issuer', date: '2026-08-31', shares: '123' }],
  per_ledger: [{
    product: 'iBENJI', ledger: 'bsc',
    supply_decimal: '1524087437.202981538514940268',
    evidence_kind: 'STATE_PROOF_VERIFIED', two_operators_agree: 'true', height: 123939466,
  }],
  ...overrides,
}));
const artifact = readFileSync(new URL('../../public/interop/cross-ledger-benji-2026-09-25.json', import.meta.url));
const project = (bytes) => projectRecord(JSON.parse(bytes.toString('utf8')));

test('retains exact decimals and historical source date without promoting producer labels', () => {
  const b = make();
  const result = project(b);
  assert.equal(result.rows[0].supply_decimal, '1524087437.202981538514940268');
  assert.equal(result.record_as_of, '2026-09-25T11:12:21Z');
  assert.equal(result.rows[0].reported_evidence_kind, 'STATE_PROOF_VERIFIED');
  assert.equal(result.checks.ledger_proof, 'NOT_PERFORMED');
  assert.equal(result.checks.signature, 'NOT_PERFORMED');
  assert.equal(result.checks.issuer_authentication, 'NOT_PERFORMED');
  assert.equal(result.checks.bitcoin_anchor, 'NOT_PERFORMED');
  assert.equal(result.reported_reconciliation_state, 'UNRECONCILED_WITH_TRANSFER_AGENT');
  assert.equal(result.issuer_reported[0].shares, '123');
});

test('one-byte mutation fails the pinned digest check', () => {
  assert.equal(inspectBytes(artifact).artifact_sha256_check, 'MATCH');
  assert.throws(() => inspectBytes(Buffer.concat([artifact, Buffer.from(' ')])), /SHA256 mismatch/);
});

test('projection refuses unsupported schema without inventing fields', () => {
  const b = make({ schema: 'invented' });
  assert.throws(() => project(b), /Unsupported/);
});

test('numeric supply is rejected rather than silently rounded', () => {
  const b = make({ per_ledger: [{ supply_decimal: 100.123456789 }] });
  assert.throws(() => project(b), /decimal string/);
});

test('unknown supply and evidence stay null; an empty set is not a zero supply', () => {
  const b = make({ per_ledger: [{ supply_decimal: null }] });
  const result = project(b);
  assert.equal(result.rows[0].supply_decimal, null);
  assert.equal(result.rows[0].reported_evidence_kind, null);
  const empty = make({ per_ledger: [] });
  assert.deepEqual(project(empty).rows, []);
});

test('bounded reader fetches the immutable URL and does not issue ledger requests', async () => {
  const b = make();
  const calls = [];
  const got = await fetchBytes(async (url, options) => {
    calls.push(url);
    assert.ok(options.signal);
    return new Response(b);
  });
  assert.deepEqual(calls, [SOURCE_URL]);
  assert.deepEqual(got, b);
});

test('HTTP failure remains a failed read, not an empty record', async () => {
  await assert.rejects(fetchBytes(async () => new Response('missing', { status: 404 })), /HTTP 404/);
});

test('stream and local inspection enforce the same byte ceiling', async () => {
  const large = Buffer.alloc(MAX_BYTES + 1);
  await assert.rejects(fetchBytes(async () => new Response(large)), /512 KiB/);
  assert.throws(() => inspectBytes(large), /512 KiB/);
});
