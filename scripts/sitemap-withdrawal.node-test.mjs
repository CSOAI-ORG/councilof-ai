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

// 2026-09-14: the sitemap reconciles against public/_redirects, so the redirects generator has to
// have written THIS build's file first. package.json ran them the other way round; every route
// added since the last committed _redirects was listed bare and answered 308 live
// (/quickstart, /stablecoins, /wrappers).
test('build:client regenerates _redirects before the sitemap reads it', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const build = pkg.scripts['build:client'];
  const redirects = build.indexOf('scripts/generate-redirects.mjs');
  const sitemap = build.indexOf('scripts/generate-sitemap.mjs');
  assert.ok(redirects >= 0 && sitemap >= 0, 'both generators must be in build:client');
  assert.ok(redirects < sitemap, 'generate-redirects.mjs must run before generate-sitemap.mjs');
});

test('client-side <Redirect> aliases are excluded unless a reviewed static page owns the path', () => {
  const xml = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../client/src/App.tsx', import.meta.url), 'utf8');
  const redirectsSource = readFileSync(new URL('./generate-redirects.mjs', import.meta.url), 'utf8');
  const marker = 'const REVIEWED_PUBLIC_HTML_APP_ROUTES = new Set([';
  const start = redirectsSource.indexOf(marker);
  const reviewedBlock = redirectsSource.slice(start, redirectsSource.indexOf(']);', start) + 3);
  const reviewedStatic = new Set([...reviewedBlock.matchAll(/"([^"]+)"/g)].map((x) => x[1]));
  const aliases = [...app.matchAll(/<Route\b[^>]*?\bpath="([^":]+)"[^>]*>\s*\{\s*\(\)\s*=>\s*<Redirect\b/g)].map((x) => x[1]);
  assert.ok(aliases.includes('/lookup'), 'alias detector must see the known /lookup alias');
  assert.ok(reviewedStatic.has('/governance'), 'reviewed static ownership must include /governance');
  assert.ok(xml.includes('<loc>https://councilof.ai/governance/</loc>'), '/governance static front should remain discoverable');
  for (const a of aliases) {
    if (reviewedStatic.has(a)) continue;
    const listed = xml.includes(`<loc>https://councilof.ai${a}</loc>`) || xml.includes(`<loc>https://councilof.ai${a}/</loc>`);
    assert.ok(!listed, `${a} is a client-side alias`);
  }
});
