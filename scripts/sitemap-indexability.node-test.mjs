import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { noindexPatterns, noindexRuleFor, patternToRegExp } from './surface/headers-noindex.mjs';

// Anonymous full-sitemap crawl, 2026-09-24: all 449 served 200, but these
// 36 pages contradicted their sitemap entry through noindex or a different
// canonical. This tests the generated artifact, not the filter implementation.
const observedNoindex = [
  '/compliance-training-world/bond-quest', '/compliance-training-world/insurance-quest',
  '/embed/spray-demo', '/embed/verify', '/grants/ford-foundation', '/grants/ngi-zero',
  '/grants/nlnet-ngi0-entrust', '/grants/sloan-foundation', '/gspc-leaderboard',
  '/livecam', '/mcpbench', '/ossbench', '/paper-district', '/pqcbench',
  '/regulator-console', '/swarmbench', '/visual-board', '/visual-verify',
];
const observedCrossCanonical = [
  '/legal/terms/', '/terms/',
  ...['asset-benji', 'asset-jmwh', 'network-xrp-ledger', 'networks', 'platform-franklin-benji']
    .map((s) => `/interop/rwa-reconciliation-2026-09/mirrors/rwa-xyz-${s}`),
  ...['118', '120', '129', '14', '195', '2', '246', '250', '262', '286', '347']
    .map((s) => `/interop/stablecoin-deep-2026-09/mirrors/${s}`),
];
// Full sitemap crawl, 2026-11-17 (browser user agent, no JavaScript): all 540 listed URLs
// answered 200, but these 22 contradicted their entry. The 13 mirrors are captured copies of
// third-party pages, each answering `X-Robots-Tag: noindex, nofollow` from the public/_headers
// rule /interop/:report/mirrors/*; the other nine declare a canonical elsewhere.
const observedNoindex20261117 = [
  '/interop/benji-onchain-supply-2026-09/mirrors/benji-contracts',
  '/interop/rwa-reconciliation-2026-09/mirrors/franklintempleton-benji-platform',
  '/interop/rwa-reconciliation-2026-09/mirrors/franklintempleton-fobxx-fund',
  ...['1', '5', '146', '173', '221', '237', '272', '336']
    .map((s) => `/interop/stablecoin-deep-2026-09/mirrors/${s}`),
  '/interop/xrpl-impersonation-2026-09/mirrors/audd-xrp-ledger-toml-probe',
  '/interop/xrpl-impersonation-2026-09/mirrors/straitsx-xrp-ledger-toml-404',
];
const observedCanonicalElsewhere20261117 = [
  '/assess/', '/assessment/', '/library/axes/', '/measure/',
  '/vs/credo-ai/', '/vs/drata/', '/vs/onetrust/', '/vs/vanta/',
];
const xml = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
const listed = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
const listedPaths = [...listed].map((u) => u.replace(/^https:\/\/councilof\.ai/, '') || '/');
const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');

test('measured non-indexable and cross-canonical pages are absent', () => {
  assert.equal(observedNoindex.length, 18);
  assert.equal(observedCrossCanonical.length, 18);
  for (const path of [...observedNoindex, ...observedCrossCanonical]) {
    assert.ok(!listed.has(`https://councilof.ai${path}`), `delist ${path}`);
  }
});

test('2026-11-17 crawl: noindex mirrors and canonical-elsewhere pages are absent', () => {
  assert.equal(observedNoindex20261117.length, 13);
  assert.equal(observedCanonicalElsewhere20261117.length, 8);
  for (const path of [...observedNoindex20261117, ...observedCanonicalElsewhere20261117]) {
    assert.ok(!listed.has(`https://councilof.ai${path}`), `delist ${path}`);
  }
  // The canonical twin of /measure/ stays listed.
  assert.ok(listed.has('https://councilof.ai/measure'), 'retain /measure');
});

test('no listed URL is one public/_headers marks noindex at the edge', () => {
  const rules = noindexPatterns(headers);
  // Not vacuous: the rule that covers the evidence mirrors must be read from the file.
  assert.ok(rules.some((r) => r.pattern === '/interop/:report/mirrors/*'), 'mirrors noindex rule read from _headers');
  const hits = listedPaths.filter((p) => noindexRuleFor(rules, p));
  assert.deepEqual(hits, []);
});

test('_headers pattern matching: a placeholder is one segment, a splat is the rest', () => {
  const re = patternToRegExp('/interop/:report/mirrors/*');
  assert.ok(re.test('/interop/stablecoin-deep-2026-09/mirrors/1'));
  assert.ok(re.test('/interop/r/mirrors/a/b.html'));
  assert.ok(!re.test('/interop/a/b/mirrors/x'), 'a placeholder never spans a slash');
  assert.ok(!re.test('/interop/stablecoin-deep-2026-09/'), 'the report page itself stays indexable');
  const rules = noindexPatterns('/a/*\n  X-Robots-Tag: noindex\n/b/*\n  X-Robots-Tag: all\nhttps://x.pages.dev/*\n  X-Robots-Tag: noindex\n');
  assert.deepEqual(rules.map((r) => r.pattern), ['/a/*']);
});

test('sitemap omits ungrounded build-date lastmod values', () => {
  assert.doesNotMatch(xml, /<lastmod>/);
});
