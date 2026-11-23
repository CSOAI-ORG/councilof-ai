import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const app = read('client/src/App.tsx');
const buyer = read('public/pay.html');
const redirects = read('public/_redirects');
const sitemap = read('public/sitemap.xml');

test('buyer page owns /pay and owner wallet tool owns /pay-all', () => {
  assert.match(buyer, /<link rel="canonical" href="https:\/\/councilof\.ai\/pay"/);
  assert.match(app, /<Route path="\/pay-all" component=\{PayEveryDoor\} \/>/);
  assert.doesNotMatch(app, /<Route path="\/pay" component=\{PayEveryDoor\} \/>/);
  assert.match(redirects, /^\/pay\/\s+\/pay\s+308$/m);
  assert.match(redirects, /^\/pay-all\s+\/pay-all\/\s+308$/m);
  assert.doesNotMatch(redirects, /^\/pay\s+\/pay\/\s+308$/m);
  assert.match(sitemap, /<loc>https:\/\/councilof\.ai\/pay<\/loc>/);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/councilof\.ai\/pay-all\/?<\/loc>/);
});

test('browser-side offer picker is valid JS and keeps payments behind a second wallet flow', async () => {
  const source = /<script>([\s\S]*?)<\/script>/.exec(buyer)?.[1];
  assert.ok(source, 'buyer page must contain its standalone offer picker');
  const script = new Script(source);
  assert.match(buyer, /fetch\("\/\.well-known\/x402\.json"/);
  assert.match(buyer, /credentials: "omit"/);
  assert.match(buyer, /response\.status !== 402/);
  assert.match(buyer, /wallet\.hidden = true/);
  assert.match(buyer, /\/pay-all\/\?door=/);
  assert.doesNotMatch(source, /\beth_sendTransaction\b|\bpersonal_sign\b|\bsignX402Challenge\b|\bX-PAYMENT\b\s*:/);

  const ids = ['x402-door', 'inspect-x402', 'copy-x402', 'wallet-x402', 'x402-offer'];
  const node = () => ({
    disabled: false, hidden: true, value: '', textContent: '', href: '',
    children: [], listeners: {},
    addEventListener(name, cb) { this.listeners[name] = cb; },
    replaceChildren() { this.children = []; },
    append(child) { this.children.push(child); },
  });
  const elements = Object.fromEntries(ids.map(id => [id, node()]));
  for (const id of ['x402-door', 'inspect-x402', 'copy-x402']) elements[id].disabled = true;
  const resource = 'https://councilof.ai/api/request-attestation?subject=qwen3';
  let probes = [];
  let shouldIncludeHeader = true;
  const fetchStub = async (url, options) => {
    probes.push({url: String(url), options});
    if (url === '/.well-known/x402.json') return {
      ok: true, json: async () => ({resources: [
        {method: 'GET', url: resource, paid_for: 'commission'},
        {method: 'GET', url: 'https://wrong.example/steal', paid_for: 'not allowed'},
        {method: 'POST', url: 'https://councilof.ai/api/signer', paid_for: 'not a GET offer'},
      ]}),
    };
    assert.equal(String(url), resource);
    assert.equal(options.method, 'GET');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.headers['X-PAYMENT'], undefined);
    return {
      status: 402,
      headers: {get: key => key === 'PAYMENT-REQUIRED' && shouldIncludeHeader ? 'signed-challenge' : null},
      json: async () => ({
        x402Version: 2,
        accepts: [{scheme: 'exact', network: 'eip155:8453',
          amount: '20000', payTo: '0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31',
          extra: {symbol: 'USDC', decimals: 6}}],
        extensions: {bazaar: {info: {}, schema: {}}},
      }),
    };
  };
  const document = {
    getElementById: id => elements[id],
    createElement: () => node(),
  };
  const context = createContext({
    document, window: {location: {origin: 'https://councilof.ai'}},
    fetch: fetchStub, navigator: {clipboard: {writeText: async () => {}}},
    URL, Number, BigInt,
  });
  script.runInContext(context);
  // The initial manifest is the only network call made on page load.
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(probes.length, 1);
  assert.equal(elements['x402-door'].children.length, 2, 'only same-origin GET offer listed');
  assert.equal(elements['wallet-x402'].hidden, true, 'no payment link before live verification');
  assert.equal(elements['inspect-x402'].disabled, true, 'no automatic selection');

  const picker = elements['x402-door'];
  picker.value = '0';
  picker.listeners.change();
  assert.equal(elements['inspect-x402'].disabled, false);
  assert.equal(elements['wallet-x402'].hidden, true);
  await elements['inspect-x402'].listeners.click();
  assert.equal(probes.length, 2, 'one safe GET for the explicit inspect click');
  assert.equal(elements['wallet-x402'].hidden, false);
  assert.equal(elements['wallet-x402'].href, '/pay-all/?door=' + encodeURIComponent(resource));
  assert.match(elements['x402-offer'].textContent, /Amount: 0\.02 USDC/);
  assert.match(elements['x402-offer'].textContent, /not yet paid/);

  shouldIncludeHeader = false;
  await elements['inspect-x402'].listeners.click();
  assert.equal(elements['wallet-x402'].hidden, true, 'missing payment header is a fail-closed offer');
  assert.match(elements['x402-offer'].textContent, /required x402 v2\/Bazaar fields are missing/);
});
