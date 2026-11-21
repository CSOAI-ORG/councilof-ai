// Discriminating-power tests for csoai.subject-axis-presence/2.0.
//   node --test scripts/measurements/subject-axis-presence-v2.node-test.mjs
// The builders run at import time (they fetch), so their PATTERNS objects are read
// from source text here rather than imported.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  compileClass, compileAxis, presence, presenceCorpus, extractText,
  discriminatingSelfTest, BENIGN_CORPUS, extractHrefs,
} from '../subject-axis/presence-v2.mjs';

const ROOT = path.resolve(new URL('../../', import.meta.url).pathname);
function readPatterns(rel) {
  const s = readFileSync(path.join(ROOT, rel), 'utf8');
  const i = s.indexOf('const PATTERNS = {');
  assert.ok(i >= 0, 'PATTERNS not found in ' + rel);
  let d = 0, j = i + 'const PATTERNS = '.length;
  for (; j < s.length; j++) { if (s[j] === '{') d++; if (s[j] === '}' && --d === 0) break; }
  return new Function('return (' + s.slice(i + 'const PATTERNS = '.length, j + 1) + ');')();
}
const LIVE = readPatterns('scripts/subject-axis/subject-axis-live-run.mjs');
const MISSING = readPatterns('scripts/subject-axis/build_missing_axes.mjs');
const HARNESS = { 'harness-fidelity': readPatterns('scripts/subject-axis/build_harness_fidelity.mjs') };
const ALL = { ...LIVE, ...MISSING, ...HARNESS };

test('short alternatives no longer match inside ordinary words', () => {
  const cases = [['act', 'contact impact fact'], ['sla', 'legislation translate island'], ['api', 'capital rapid'],
    ['itl', 'title subtitle'], ['sse', 'assessment possess'], ['imu', 'simulation maximum'],
    ['eval*', 'retrieval medieval'], ['rsp', 'perspective'], ['acl', 'oracle miracle']];
  for (const [alt, text] of cases) assert.equal(compileClass(alt).test(text), false, `${alt} matched "${text}"`);
});

test('the same alternatives still match as words, plurals and declared stems', () => {
  assert.ok(compileClass('act').test('the ai act applies'));
  assert.ok(compileClass('sla').test('our sla is 99.9%'));
  assert.ok(compileClass('api').test('public api docs'));
  assert.ok(compileClass('benchmark').test('benchmarks published'));
  assert.ok(compileClass('regulation').test('regulations and guidance'));
  assert.ok(compileClass('eval*').test('evaluation suite'));
  assert.ok(compileClass('reproduc*').test('reproducibility'));
  assert.ok(compileClass('\\.json\\b').test('download results.json now'));
  assert.ok(compileClass('/api/').test('see /api/v1'));
  assert.ok(compileClass('within \\d+ (business )?days').test('we reply within 5 business days'));
});

test('the detector reads visible text and link targets, never script or style', () => {
  const html = '<html><head><script>const api = fetch("/x.json"); React.act()</script><style>.sse{}</style></head>' +
    '<body><p>Hello bakery</p><a href="/.well-known/security.txt">Security</a></body></html>';
  const corpus = presenceCorpus(html);
  assert.ok(!corpus.includes('fetch'), 'script text leaked into the corpus');
  assert.ok(corpus.includes('/.well-known/security.txt'), 'link target missing from the corpus');
  assert.equal(extractText('<p>a<script>b</script>c</p>'), 'a c');
});

test('benign text meets the disclosure bar on no axis (must-FAIL)', () => {
  for (const [axis, pats] of Object.entries(ALL)) {
    const hits = Object.values(presence(BENIGN_CORPUS, compileAxis(pats))).filter(Boolean).length;
    assert.ok(hits < 3, `${axis}: benign corpus hit ${hits} of 5 classes`);
  }
});

test('every axis passes its discriminating self-test in both directions', () => {
  const st = discriminatingSelfTest(ALL, 3);
  for (const [axis, r] of Object.entries(st.results)) {
    assert.equal(r.benign_meets_bar, false, `${axis} benign`);
    assert.equal(r.positive_meets_bar, true, `${axis} positive (${r.positive_classes_hit} of 5)`);
  }
  assert.equal(st.ok, true);
});

test('the self-test fails closed when a pattern cannot discriminate', () => {
  const broken = { 'broken-axis': { a: 'bread*', b: 'cake*', c: 'bakery', d: 'zzzz', e: 'yyyy' } };
  assert.equal(discriminatingSelfTest(broken, 3).ok, false);
});

test('anchors inside script strings, comments and templates are not link targets', () => {
  const bakery = '<p>Our bakery recipe blog. Contact the team for catering.</p>';
  const inert = bakery
    + '<!-- <a href="/security.txt">report</a> <a href="/api/incidents.json">feed</a> -->'
    + '<script>const t = \'<a href="/.well-known/security.txt">disclose</a>\';</script>'
    + '<template><a href="/dispute/">appeal</a></template>'
    + '<!-- unterminated <a href="/api/report">';
  assert.equal(extractHrefs(inert), '');
  assert.equal(presenceCorpus(inert), presenceCorpus(bakery));
  assert.equal(extractHrefs(bakery + '<a href="/dispute/">appeal</a>'), '/dispute/');
});

test('out-of-range and surrogate numeric references decode to U+FFFD, not a throw', () => {
  let s;
  assert.doesNotThrow(() => { s = extractText('a &#1114112; b &#x110000; c &#xD800; d &#65; &#x42;'); });
  assert.equal(s, 'a \uFFFD b \uFFFD c \uFFFD d A B');
  assert.doesNotThrow(() => presenceCorpus('<p>&#99999999999;</p>'));
});
