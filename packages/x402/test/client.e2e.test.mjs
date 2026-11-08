import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ethers } from 'ethers';
import { X402Client } from '../src/client.js';

// ---- mock world: a facilitator-shaped server + our own DID doc ----
let server, baseUrl, tmp, ledger, testWallet, didDoc;

function jwsSign(payloadObj, priv) {
  const enc = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const h = enc({ alg: 'EdDSA', kid: 'did:web:test#board-attestation-1' });
  const p = enc(payloadObj);
  const sig = crypto.sign(null, Buffer.from(`${h}.${p}`), priv);
  return `${h}.${p}.${sig.toString('base64url')}`;
}

beforeEach(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'csoai-e2e-'));
  ledger = path.join(tmp, 'ledger.jsonl');
  testWallet = ethers.Wallet.createRandom();
  // test ed25519 key for offer JWS + did doc
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const jwk = publicKey.export({ format: 'jwk' });
  didDoc = { verificationMethod: [{ id: 'did:web:test#board-attestation-1', publicKeyJwk: jwk }] };
  const POLICY = {
    allowlist: {
      payTo: ['0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31'],
      resourcePrefixes: [baseUrl || 'http://x/'], subjects: ['*'],
      networks: ['eip155:8453'], assets: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'],
    },
    caps: { perCallAtomic: '10000', perDayAtomic: '50000' }, ledger,
    requireOfferJws: true,
  };
  global.__policy = POLICY;

  server = http.createServer((req, res) => {
    const url = new URL(req.url, baseUrl);
    if (url.pathname === '/did.json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(didDoc));
    }
    const paid = !!req.headers['x-payment'];
    const body = paid ? JSON.parse(Buffer.from(req.headers['x-payment'], 'base64').toString()) : null;
    if (!paid) {
      const offer = jwsSign({ accepts: [{ payTo: '0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31', amount: '10000' }] }, privateKey);
      res.writeHead(402, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        x402Version: 2, error: 'Payment required',
        accepts: [{ scheme: 'exact', network: 'eip155:8453', amount: '10000',
          payTo: '0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31', asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          extra: { name: 'USD Coin', version: '2', decimals: 6 } }],
        extensions: { 'offer-receipt': { info: { offers: [{ format: 'jws', acceptIndex: 0, signature: offer }] } } },
      }));
    }
    // paid path: validate shape loosely, settle
    const okShape = body?.payload?.authorization?.from?.toLowerCase() === testWallet.address.toLowerCase();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'COMMISSIONED', sig_ed25519: okShape ? 'aa'.repeat(32) : null,
      delivery_state: 'DELIVERED', settlement_state: 'SETTLED' }));
  });
  await new Promise(r => { server.listen(0, '127.0.0.1', r); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  global.__policy.allowlist.resourcePrefixes = [baseUrl + '/'];
});

afterEach(() => new Promise(r => server.close(r)));

const CLIENT_URL = () => `${baseUrl}/api/request-attestation?subject=mistral:7b`;

function mkClient(over = {}) {
  return new X402Client({
    privateKey: testWallet.privateKey,
    policy: global.__policy,
    didUrl: `${baseUrl}/did.json`,
    ledgerPath: ledger,
    ...over,
  });
}

test('E2E: route BUY → 402 → policy → JWS verify → sign → settle → BOUGHT + ledger', async () => {
  const routeCalls = [];
  const client = mkClient({ route: { async decide(a) { routeCalls.push(a); return { decision: 'BUY', basis: 'gspc.route → test' }; } } });
  const rec = await client.buy({ url: CLIENT_URL(), subject: 'mistral:7b' });
  assert.equal(rec.decision, 'BOUGHT', JSON.stringify(rec));
  assert.equal(rec.amount_atomic, '10000');
  assert.equal(rec.offer_verified, true);
  assert.equal(rec.receipt_signed, true);
  assert.equal(routeCalls.length, 1);
  const lines = fs.readFileSync(ledger, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].decision, 'BOUGHT');
  assert.ok(lines[0].route_basis.includes('gspc.route'));
});

test('E2E: route SKIP → refused before any signature', async () => {
  const client = mkClient({ route: { async decide() { return { decision: 'SKIP', basis: 'UNMEASURED subject' }; } } });
  const rec = await client.buy({ url: CLIENT_URL(), subject: 'unmeasured-model' });
  assert.equal(rec.decision, 'REFUSED');
  assert.match(rec.reason, /route/);
  assert.equal(fs.existsSync(ledger) && fs.readFileSync(ledger, 'utf8').includes('BOUGHT'), false);
});

test('E2E: tampered offer JWS → refused, nothing settled', async () => {
  didDoc = { verificationMethod: [{ id: 'did:web:test#board-attestation-1',
    publicKeyJwk: crypto.generateKeyPairSync('ed25519').publicKey.export({ format: 'jwk' }) }] }; // different key!
  const client = mkClient();
  const rec = await client.buy({ url: CLIENT_URL(), subject: 'mistral:7b' });
  assert.equal(rec.decision, 'REFUSED');
  assert.match(rec.reason, /offer JWS/);
});

test('E2E: day cap trips on second buy', async () => {
  global.__policy.caps = { perCallAtomic: '10000', perDayAtomic: '10000' };
  const client = mkClient();
  const r1 = await client.buy({ url: CLIENT_URL(), subject: 'a' });
  assert.equal(r1.decision, 'BOUGHT');
  const r2 = await client.buy({ url: CLIENT_URL(), subject: 'b' });
  assert.equal(r2.decision, 'REFUSED');
  assert.match(r2.reason, /day cap/);
});
