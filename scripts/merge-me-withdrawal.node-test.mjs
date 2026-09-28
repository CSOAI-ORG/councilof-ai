import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseRedirects } from './redirects-guard.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

test('retired Merge Me links reach one indexed explanation', () => {
  const parsed = parseRedirects(read('public/_redirects'));
  assert.equal(parsed.invalid.filter(({ line }) => line.includes('/merge-me')).length, 0);
  assert.equal(parsed.truncatedAtLine, null);
  for (const from of ['/merge-me', '/merge-me/']) {
    const matches = parsed.rules.filter((rule) => rule.from === from);
    assert.equal(matches.length, 1, `${from} must have exactly one redirect`);
    assert.equal(matches[0].to, '/how-we-work');
    assert.equal(matches[0].status, 308);
  }
});

test('retired route is withdrawn from generated discovery and app routing', () => {
  assert.doesNotMatch(read('public/sitemap.xml'), /<loc>https:\/\/councilof\.ai\/merge-me\/?<\/loc>/);
  assert.doesNotMatch(read('client/src/App.tsx'), /MergeMe|path="\/merge-me"/);
  assert.doesNotMatch(read('client/src/data/route-manifest.ts'), /"path": "\/merge-me"/);
  assert.equal(JSON.parse(read('client/src/data/seo-head.json'))['/merge-me'], undefined);
  assert.doesNotMatch(read('client/src/data/facts.json'), /"merge_me_train"/);
});
