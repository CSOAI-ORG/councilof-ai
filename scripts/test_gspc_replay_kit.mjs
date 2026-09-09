import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { capture, replay, publicCardURL } from './gspc-replay-kit.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixture = readFileSync(join(root, 'packages/gspc-card-verifier/test/fixtures/01-genuine.json'));
const id = JSON.parse(fixture).id;
const url = `https://councilof.ai/signed/cards/${id}.json`;
const commit = 'bbb50e8d5ebdf5c2719b711cb7a933633508afed';
async function kit() {
  const out = join(mkdtempSync(join(tmpdir(), 'gspc-replay-test-')), 'kit');
  const result = await capture({ out, commit, urls: [url], repo: root, fetcher: async () => new Response(fixture) });
  return { dir: out, expectedManifestSha: result.manifest_sha256 };
}
test('offline replay uses existing verifier and rejects tampering control', async () => {
  const k = await kit(); const result = await replay(k);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].original, 'VALID');
  assert.equal(result.records[0].tampered, 'INVALID');
  assert.equal(result.bitcoin_anchor, 'NOT_TESTED');
  const buyer = JSON.parse(readFileSync(join(k.dir, 'buyer-evidence.json')));
  assert.deepEqual(buyer.records[0].measurement_body, JSON.parse(fixture).body);
  assert.equal(buyer.records[0].sample_size_as_declared, null);
  assert.equal(buyer.decision, 'NOT_ASSESSED');
});
test('record, verifier and export modifications fail before replay success', async () => {
  for (const name of [`cards/${id}.json`, 'verifier/src/verify.mjs', 'buyer-evidence.json']) {
    const k = await kit(); writeFileSync(join(k.dir, name), '{}');
    await assert.rejects(replay(k), /File digest mismatch/);
  }
});
test('manifest needs separately retained digest', async () => {
  const k = await kit();
  await assert.rejects(replay({ ...k, expectedManifestSha: '0'.repeat(64) }), /Manifest digest/);
  await assert.rejects(replay({ dir: k.dir }), /Supply the manifest/);
});
test('rejects non-public/credentialed URLs, duplicates and unpinned revision', async () => {
  for (const u of [url.replace('https:', 'http:'), url.replace('councilof.ai', 'localhost'), `${url}?token=secret`, url.replace('https://', 'https://user:pass@')]) assert.throws(() => publicCardURL(u));
  await assert.rejects(capture({ commit: 'master', urls: [url] }), /full reviewed/);
  await assert.rejects(capture({ commit, urls: [url, url] }), /Duplicate/);
});
test('refuses overwrite and invalid input card', async () => {
  const k = await kit();
  await assert.rejects(capture({ out: k.dir, commit, urls: [url], repo: root, fetcher: async () => new Response(fixture) }), /EEXIST/);
  const altered = JSON.parse(fixture); altered.body.axis = 'altered';
  const out = join(mkdtempSync(join(tmpdir(), 'gspc-replay-invalid-')), 'kit');
  await assert.rejects(capture({ out, commit, urls: [url], repo: root, fetcher: async () => new Response(JSON.stringify(altered)) }), /Card INVALID/);
});
test('network errors, oversized responses and URL/id mismatch fail closed', async () => {
  const fresh = () => join(mkdtempSync(join(tmpdir(), 'gspc-replay-network-')), 'kit');
  await assert.rejects(capture({ out: fresh(), commit, urls: [url], repo: root, fetcher: async (_, options) => {
    assert.equal(options.redirect, 'error'); assert.equal(options.credentials, 'omit');
    return new Response('no', { status: 503 });
  } }), /HTTP 503/);
  await assert.rejects(capture({ out: fresh(), commit, urls: [url], repo: root, fetcher: async () => new Response('x'.repeat(1024 * 1024 + 1)) }), /1 MiB/);
  await assert.rejects(capture({ out: fresh(), commit, urls: [url.replace(id, '0'.repeat(64))], repo: root, fetcher: async () => new Response(fixture) }), /content id differs/);
});
test('uncheckable card does not become an accepted buyer record', async () => {
  const card = JSON.parse(fixture); delete card.signature;
  const out = join(mkdtempSync(join(tmpdir(), 'gspc-replay-uncheckable-')), 'kit');
  await assert.rejects(capture({ out, commit, urls: [url], repo: root, fetcher: async () => new Response(JSON.stringify(card)) }), /Card UNCHECKABLE/);
});
