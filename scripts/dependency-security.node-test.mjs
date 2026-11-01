// Behavioural regressions for the published DOMPurify, shell-quote and proxy-addr advisories.
// No shell command or template expression is executed by these cases.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const shellQuote = require('shell-quote');
const apiRequire = createRequire(new URL('../api-server/package.json', import.meta.url));
const proxyCopies = [
  ['application', require('proxy-addr')],
  ['API server', apiRequire('proxy-addr')],
];
assert.match(apiRequire.resolve('proxy-addr'), /api-server[/\\]node_modules[/\\]/,
  'Install the API server lockfile as well; root fallback would leave its dependency untested');

for (const [name, terminator] of [['LF', '\n'], ['CR', '\r'], ['line separator', '\u2028'], ['paragraph separator', '\u2029']]) {
  test(`shell quoting rejects ${name} after a comment token`, () => {
    assert.throws(() => shellQuote.quote(['printf', 'sample', { comment: 'note' }, `before${terminator}after`]), TypeError);
  });
}
test('ordinary shell arguments still round-trip without execution', () => {
  const values = ['printf', 'two words', "owner's text", '$literal'];
  assert.deepEqual(shellQuote.parse(shellQuote.quote(values)), values);
});

for (const [name, proxyAddr] of proxyCopies) {
  test(`${name}: IPv6-only or malformed mapped trust ranges do not trust arbitrary IPv4 clients`, () => {
    for (const subnet of ['::ffff:10.0.0.0/8', '::/1']) {
      const trust = proxyAddr.compile(subnet);
      assert.equal(trust('203.0.113.9', 0), false);
      const request = { socket: { remoteAddress: '203.0.113.9' }, headers: { 'x-forwarded-for': '10.1.2.3' } };
      assert.equal(proxyAddr(request, trust), '203.0.113.9');
    }
  });
  test(`${name}: valid IPv4 and mapped IPv6 proxy subnets retain their boundaries`, () => {
    for (const subnet of ['10.0.0.0/8', '::ffff:10.0.0.0/104']) {
      const trust = proxyAddr.compile(subnet);
      assert.equal(trust('10.1.2.3', 0), true);
      assert.equal(trust('203.0.113.9', 0), false);
    }
  });
}

test('template safety also removes fragments joined inside an attached shadow root', () => {
  const dom = new JSDOM('<!doctype html>');
  try {
    const document = dom.window.document;
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.append(document.createTextNode('$'), document.createElement('object'), document.createTextNode('{7*7}'));
    createDOMPurify(dom.window).sanitize(host, { IN_PLACE: true, SAFE_FOR_TEMPLATES: true });
    assert.doesNotMatch(shadow.textContent, /\$\{7\*7\}/);
  } finally {
    dom.window.close();
  }
});
test('ordinary sanitization preserves allowed formatting and strips event attributes', () => {
  const dom = new JSDOM('<!doctype html>');
  try {
    const clean = createDOMPurify(dom.window).sanitize('<p>Hello <strong>reader</strong><img src="x" onerror="ignored()"></p>');
    assert.match(clean, /<strong>reader<\/strong>/);
    assert.doesNotMatch(clean, /onerror|ignored/);
  } finally {
    dom.window.close();
  }
});
