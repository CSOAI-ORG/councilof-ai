/**
 * x402 EIP-3009 payment signer for CSOAI request-attestation
 * Labels: INTERNAL_SELF_FUNDED — revenue remains zero
 */

const { ethers } = require('/tmp/node_modules/ethers');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// === CONFIG ===
const PRIVATE_KEY = '0xf3730e2b4c9b9a59ee94956f0e64a5fe310c4d4daf88ebd62c5ccdad89447f62';
const PAYER_ADDRESS = '0x6ea00613c15f2463bC10c7188215c4FA6f4943C6';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const PAY_TO = '0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31';
const CHAIN_ID = 8453;
const AMOUNT_ATOMIC = '10000'; // 0.01 USDC promo price
const RESOURCE_URL = 'https://councilof.ai/api/request-attestation';
const SUBJECT = 'llama3.2:3b';
const AXIS = 'governance';

const wallet = new ethers.Wallet(PRIVATE_KEY);
console.log(`[x402-signer] Wallet: ${wallet.address}`);
console.log(`[x402-signer] PayTo: ${PAY_TO}`);
console.log(`[x402-signer] Amount: ${AMOUNT_ATOMIC} atomic (${Number(AMOUNT_ATOMIC) / 1e6} USDC)`);
console.log(`[x402-signer] Chain: Base mainnet (${CHAIN_ID})`);
console.log(`[x402-signer] Subject: ${SUBJECT}, Axis: ${AXIS}`);

function httpGet(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(url, {
      method: opts.method || 'GET',
      headers: opts.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[x402-signer] HTTP ${res.statusCode} from ${new URL(url).pathname}`);
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    req.end(opts.body || undefined);
  });
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('x402 Payment Test — CSOAI request_attestation');
  console.log('Label: INTERNAL_SELF_FUNDED — revenue remains zero');
  console.log('='.repeat(70));

  // Step 1: Get 402 challenge
  const challengeUrl = `${RESOURCE_URL}?subject=${encodeURIComponent(SUBJECT)}&axis=${encodeURIComponent(AXIS)}`;
  console.log(`\n[x402-signer] Step 1: GET 402 challenge`);
  const challengeRes = await httpGet(challengeUrl);
  const challenge = JSON.parse(challengeRes.body);
  console.log(`[x402-signer] 402 received. Amount: ${challenge.accepts?.[0]?.amount} ${challenge.accepts?.[0]?.extra?.symbol}`);
  console.log(`[x402-signer] Offer JWS: ${!!challenge.extensions?.['offer-receipt']?.info?.offers?.[0]?.signature}`);

  // Step 2: Build EIP-3009 signature
  const nonce = ethers.hexlify(ethers.randomBytes(32));
  const validAfter = Math.floor(Date.now() / 1000) - 60;
  const validBefore = Math.floor(Date.now() / 1000) + 300;

  console.log(`\n[x402-signer] Step 2: Build EIP-3009 transferWithAuthorization`);
  console.log(`[x402-signer] Nonce: ${nonce}`);

  const domain = {
    name: 'USD Coin',
    version: '2',
    chainId: CHAIN_ID,
    verifyingContract: USDC_ADDRESS,
  };
  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  };
  const value = {
    from: PAYER_ADDRESS,
    to: PAY_TO,
    value: AMOUNT_ATOMIC,
    validAfter: validAfter,
    validBefore: validBefore,
    nonce: nonce,
  };

  const signature = await wallet.signTypedData(domain, types, value);
  console.log(`[x402-signer] Signature: ${signature}`);

  const recovered = ethers.verifyTypedData(domain, types, value, signature);
  console.log(`[x402-signer] Recovered: ${recovered}`);
  console.log(`[x402-signer] Signature valid: ${recovered.toLowerCase() === PAYER_ADDRESS.toLowerCase()}`);

  // Build x-payment header
  const xPayment = {
    x402Version: 2,
    scheme: 'exact',
    network: 'eip155:8453',
    payload: {
      signature: signature,
      authorization: {
        from: PAYER_ADDRESS,
        to: PAY_TO,
        value: AMOUNT_ATOMIC,
        validAfter: String(validAfter),
        validBefore: String(validBefore),
        nonce: nonce,
      },
    },
    resource: RESOURCE_URL,
  };
  const xPaymentB64 = Buffer.from(JSON.stringify(xPayment)).toString('base64');
  console.log(`[x402-signer] x-payment header: ${xPaymentB64.length} chars`);

  // Step 3: Submit paid request
  console.log(`\n[x402-signer] Step 3: POST with x-payment header`);
  const paidRes = await httpGet(challengeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-payment': xPaymentB64,
    },
  });
  let paidResponse;
  try {
    paidResponse = JSON.parse(paidRes.body);
  } catch (e) {
    paidResponse = { raw: paidRes.body, statusCode: paidRes.statusCode };
  }
  console.log(`[x402-signer] Paid response (HTTP ${paidRes.statusCode}):`);
  console.log(JSON.stringify(paidResponse, null, 2).slice(0, 2000));

  // Step 4: Check receipts
  console.log(`\n[x402-signer] Step 4: Check receipts`);
  const receiptsRes = await httpGet(`https://councilof.ai/api/receipts?payer=${PAYER_ADDRESS}`);
  let receipts;
  try {
    receipts = JSON.parse(receiptsRes.body);
  } catch (e) {
    receipts = { raw: receiptsRes.body };
  }
  console.log(JSON.stringify(receipts, null, 2).slice(0, 2000));

  // Write full evidence
  const evidence = {
    label: 'INTERNAL_SELF_FUNDED',
    timestamp: new Date().toISOString(),
    payer: PAYER_ADDRESS,
    payTo: PAY_TO,
    amount_atomic: AMOUNT_ATOMIC,
    amount_usdc: Number(AMOUNT_ATOMIC) / 1e6,
    subject: SUBJECT,
    axis: AXIS,
    step1_402_challenge: challenge,
    step2_signature: {
      nonce,
      signature,
      recovered,
      valid: recovered.toLowerCase() === PAYER_ADDRESS.toLowerCase(),
      domain,
      types,
      value,
    },
    step3_x_payment: xPayment,
    step3_response: {
      http_status: paidRes.statusCode,
      body: paidResponse,
    },
    step4_receipts: receipts,
    status: paidRes.statusCode === 200 ? 'PAID' : 'PAYMENT_FAILED',
  };

  fs.writeFileSync(path.join(__dirname, 'evidence-executed.json'), JSON.stringify(evidence, null, 2));
  console.log(`\n[x402-signer] Evidence written to evidence-executed.json`);
  console.log(`[x402-signer] Status: ${evidence.status}`);
}

main().catch(err => {
  console.error('[x402-signer] FATAL:', err.message);
  fs.writeFileSync(path.join(__dirname, 'evidence-error.json'), JSON.stringify({
    label: 'INTERNAL_SELF_FUNDED',
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
  }, null, 2));
  process.exit(1);
});
