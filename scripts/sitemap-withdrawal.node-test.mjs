import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('./generate-sitemap.mjs', import.meta.url), 'utf8');
const loop = source.slice(source.indexOf('let blogSkipped = 0;'), source.indexOf('// The AEO answer explainers.'));
assert.ok(loop.includes('for (const slug of blogSlugs)'));
function enumerate(withdrawn) {
  const state = {
    blogSlugs: ['built', 'redirected', 'unbuilt'],
    builtBlog: new Set(['built', 'redirected']),
    redirectRules: new Map([['/blog/redirected', '/blog/']]),
    reviewNoticePaths: new Set(withdrawn ? ['/blog/:slug'] : []),
    seen: new Set(['/services/']), paths: ['/services/'],
  };
  vm.runInNewContext(loop, state);
  return state.paths;
}
test('withdrawn dynamic articles stay out even when their snapshots exist', () => {
  assert.deepEqual([...enumerate(true)], ['/services/']);
});
test('restored articles regain canonical discovery without unbuilt or redirected slugs', () => {
  assert.deepEqual([...enumerate(false)], ['/services/', '/blog/built/']);
});
