import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
const xml = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
const listed = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));

test('measured non-indexable and cross-canonical pages are absent', () => {
  assert.equal(observedNoindex.length, 18);
  assert.equal(observedCrossCanonical.length, 18);
  for (const path of [...observedNoindex, ...observedCrossCanonical]) {
    assert.ok(!listed.has(`https://councilof.ai${path}`), `delist ${path}`);
  }
});

test('original evidence mirrors remain discoverable', () => {
  for (const path of [
    '/interop/benji-onchain-supply-2026-09/mirrors/benji-contracts',
    '/interop/rwa-reconciliation-2026-09/mirrors/franklintempleton-benji-platform',
    '/interop/stablecoin-deep-2026-09/mirrors/1',
  ]) assert.ok(listed.has(`https://councilof.ai${path}`), `retain ${path}`);
});

test('sitemap omits ungrounded build-date lastmod values', () => {
  assert.doesNotMatch(xml, /<lastmod>/);
});
