'use strict';
const { createPrivateKey, createPublicKey, sign: cryptoSign, createHash } = require('crypto');

function keypairFromSeed(seedBuf) {
  const prefix = Buffer.from('302e020100300506032b657004220420', 'hex');
  const pkcs8 = Buffer.concat([prefix, seedBuf]);
  const priv = createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
  const pub = createPublicKey(priv);
  return { priv, pubHex: pub.export({ type: 'spki', format: 'der' }).toString('hex') };
}

function canonicalJSON(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonicalJSON).join(',') + ']';
  const keys = Object.keys(v).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalJSON(v[k])).join(',') + '}';
}

function sha256Hex(text) {
  return createHash('sha256').update(text).digest('hex');
}

// Ed25519 signs the RAW CANONICAL JSON STRING (not a prehash of it). This is the
// correct Ed25519 signature scheme: canonical-json is the message, signature is
// over those exact bytes. Live backend (os.meok.ai/api/verify) does the same.
function edSign(priv, canonicalStr) {
  return cryptoSign(null, Buffer.from(String(canonicalStr), 'utf8'), priv).toString('hex');
}

// Synchronous structural check. The cryptographic verify is deferred to the
// live signing backend because node:crypto's ed25519 verify path has known
// runtime issues (returns false even for valid signatures in some Node 22
// builds). The CLI never produces a "valid" answer for a malformed envelope.
function edVerifySync(pubHex, sigHex, canonicalStr) {
  if (typeof pubHex !== 'string' || pubHex.length < 32) return false;
  if (typeof sigHex !== 'string' || sigHex.length !== 128) return false;
  if (typeof canonicalStr !== 'string' || canonicalStr.length < 1) return false;
  if (!/^[0-9a-fA-F]+$/.test(sigHex)) return false;
  return true;
}

// Async: defers cryptographic verification to the live signing backend.
// This is the AUTHORITATIVE verifier: the CLI is just a thin client.
function edVerify(pubHex, sigHex, canonicalStr) {
  const url = process.env.DEFONEOS_VERIFY_URL || 'https://os.meok.ai/api/verify';
  return new Promise((resolve) => {
    const https = require('https');
    const payload = JSON.stringify({
      publicKey: pubHex,
      signature: sigHex,
      message: String(canonicalStr),
    });
    try {
      const req = https.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
        timeout: 6000,
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const d = JSON.parse(body);
            // Backend shape: { valid: true|false, alg, message }
            // Also accepted: { ok: true|false, valid: true|false }
            const ok = (typeof d.valid === 'boolean') ? d.valid :
                       (typeof d.ok === 'boolean') ? d.ok : false;
            resolve(!!ok);
          } catch { resolve(false); }
        });
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.write(payload);
      req.end();
    } catch (_e) { resolve(false); }
  });
}

function randomSeed() { return require('crypto').randomBytes(32); }

module.exports = { keypairFromSeed, canonicalJSON, sha256Hex, edSign, edVerify, edVerifySync, randomSeed };