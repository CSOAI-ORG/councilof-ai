import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findPins, classify, isConclusive, assessPins, assessManifest, rotateSample, probePin, DEFAULTS,
} from './published-pins-liveness.mjs';

const SAMPLE = [
  'https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/a25c4e6d4ad547ad8cdcd800bd8d61c6d129eba2/contributions/safe/x.md',
  'https://huggingface.co/datasets/csoai/jail-floor/tree/d8aa0e55b7ab5a4083490f7e8f8207b766fd1fed',
  'https://huggingface.co/api/resolve-cache/datasets/csoai/councilof-ai-mirror/c6021da678f886bf3c4eeb74a8b096661a03dfc0/interop__a.json',
  'https://github.com/CSOAI-ORG/councilof-ai/blob/281493d05d9185b3c8ab786ddbb27e3b36d0d8e8/public/spec/x.json',
  'https://github.com/CSOAI-ORG/councilof-ai/commit/8c939c37bfa016d4fc64fa06261a652ebba77045',
  'a content digest is not a pin: 2a61e0457b1637ccef5be67aaa652669715ce974df6427512e9a0899f8c074e4',
  'a moving path is not a pin: https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/main/x.md',
].join('\n');

test('finds the revision-shaped pins and nothing else', () => {
  const pins = findPins(SAMPLE);
  const revs = pins.map((p) => p.revision);
  assert.ok(revs.includes('a25c4e6d4ad547ad8cdcd800bd8d61c6d129eba2'), 'HF resolve pin');
  assert.ok(revs.includes('d8aa0e55b7ab5a4083490f7e8f8207b766fd1fed'), 'HF tree pin');
  assert.ok(revs.includes('c6021da678f886bf3c4eeb74a8b096661a03dfc0'), 'HF resolve-cache pin');
  assert.ok(revs.includes('281493d05d9185b3c8ab786ddbb27e3b36d0d8e8'), 'GitHub blob pin');
  assert.ok(revs.includes('8c939c37bfa016d4fc64fa06261a652ebba77045'), 'GitHub commit pin');
  assert.ok(!revs.includes('2a61e0457b1637ccef5be67aaa652669715ce974df6427512e9a0899f8c074e4'), 'a digest is not a pin');
  assert.ok(!pins.some((p) => p.url.includes('/resolve/main/')), 'a moving path is not a pin');
  assert.ok(!pins.some((p) => p.revision === 'main'));
});

test('a pin is only live when the host answers 200', () => {
  assert.equal(classify(200), 'LIVE');
  assert.equal(classify(401), 'PRIVATE_OR_GATED');
  assert.equal(classify(403), 'PRIVATE_OR_GATED');
  assert.equal(classify(404), 'REVISION_GONE');
  assert.ok(!isConclusive(classify(429)), 'a rate limit says nothing about the pin');
  assert.ok(!isConclusive(classify(503)), 'a host error says nothing about the pin');
});

test('the verdict fails closed on anything that is not a live pin', () => {
  assert.ok(assessPins([{ status: 'REVISION_GONE' }]).some((d) => !d.ok));
  assert.ok(assessPins([{ status: 'PRIVATE_OR_GATED' }]).some((d) => !d.ok));
  assert.ok(assessPins([{ status: 'UNANSWERED' }]).some((d) => !d.ok));
  assert.ok(assessPins([{ status: 'RATE_LIMITED' }]).some((d) => !d.ok));
  assert.ok(assessPins([{ status: 'LIVE' }, { status: 'LIVE' }]).every((d) => d.ok));
});

test('the manifest freshness check fails on a stale or unreadable as_of', () => {
  const now = Date.parse('2026-10-28T00:00:00Z');
  assert.ok(assessManifest({ as_of: '2026-10-20T00:00:00Z' }, now).every((d) => d.ok));
  assert.ok(assessManifest({ as_of: '2026-08-01T00:00:00Z' }, now).some((d) => !d.ok));
  assert.ok(assessManifest({ as_of: 'not-a-date' }, now).some((d) => !d.ok));
  assert.ok(assessManifest(null, now).every((d) => d.ok), 'no manifest is not a failure');
});

test('the rotating sample covers everything over time without repeating a pin', () => {
  const items = Array.from({ length: 100 }, (_, i) => ({ url: `u${i}` }));
  assert.equal(rotateSample(items, 40, 7).length, 40);
  assert.equal(new Set(rotateSample(items, 40, 7).map((p) => p.url)).size, 40);
  assert.notEqual(rotateSample(items, 5, 0)[0].url, rotateSample(items, 5, 1)[0].url);
  assert.equal(rotateSample(items, 500, 3).length, 100);
});

test('a rate-limited host is retried, not reported as dead', async () => {
  let calls = 0;
  const fake = async () => {
    calls += 1;
    return { status: calls < 3 ? 429 : 200 };
  };
  const result = await probePin({ url: 'https://example.invalid/x', host: 'h', target: 't', revision: 'r' },
    { ...DEFAULTS, delayMs: 0, retries: 3 }, fake);
  assert.equal(result.status, 'LIVE', 'the third attempt answered');
  assert.equal(calls, 3);
});

test('a pin that never answers is UNANSWERED, never LIVE', async () => {
  const fake = async () => { throw new Error('network down'); };
  const result = await probePin({ url: 'https://example.invalid/x', host: 'h', target: 't', revision: 'r' },
    { ...DEFAULTS, delayMs: 0, retries: 2 }, fake);
  assert.equal(result.status, 'UNANSWERED');
});
