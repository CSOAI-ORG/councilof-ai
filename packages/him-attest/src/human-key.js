/** human-key.js — the HUMAN key: a distinct Ed25519 identity for human decisions.
 * Production: keystone-held. Local/test: a pem file. NEVER the machine card key.
 * Implements both the legacy H.I.M. ceremony helpers (ensureKey, signDecision) and
 * the csoai-attest v0.2 canonical signer / dual-sign COMPOSITE primitive (R1, R3). */
import crypto from 'node:crypto';
import fs from 'node:fs';

export function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = canon(v[k]);
    return o;
  }
  return v;
}

export const canonStr = (v) => JSON.stringify(canon(v));
export const sha256hex = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

export function ensureKey(p) {
  if (fs.existsSync(p)) {
    return {
      privateKey: crypto.createPrivateKey(fs.readFileSync(p)),
      publicKey: crypto.createPublicKey(fs.readFileSync(p + '.pub')),
    };
  }
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  fs.writeFileSync(p, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  fs.writeFileSync(p + '.pub', publicKey.export({ type: 'spki', format: 'pem' }));
  console.error(`[him-attest] generated human key at ${p} — production: replace with keystone-held key`);
  return { privateKey, publicKey };
}

export function signDecision(privateKey, { task_id, decision, note, ts }) {
  return crypto.sign(null, Buffer.from(JSON.stringify({ task_id, decision, note, ts })), privateKey).toString('base64');
}

/**
 * Create a csoai-attest compatible human-slot Ed25519 signer (actorClass='human').
 * Accepts either a filesystem key path (passed to ensureKey) or an existing { privateKey, publicKey } pair.
 */
export function createHumanSigner(keyPathOrPair, { kid } = {}) {
  const { privateKey, publicKey } = typeof keyPathOrPair === 'string'
    ? ensureKey(keyPathOrPair)
    : keyPathOrPair;
  const pubSpki = publicKey.export({ type: 'spki', format: 'der' });
  const publicKeyDerB64 = pubSpki.toString('base64');
  const resolvedKid = kid || `human-slot:${sha256hex(pubSpki).slice(0, 16)}`;
  return {
    alg: 'Ed25519',
    actorClass: 'human',
    kid: resolvedKid,
    publicKey,
    privateKey,
    publicKeyDerB64,
    sign(value) {
      const bytes = Buffer.from(canonStr(value));
      const sig = crypto.sign(null, bytes, privateKey);
      return {
        payload_sha256: sha256hex(bytes),
        alg: this.alg,
        actor_class: 'human',
        kid: this.kid,
        signature: sig.toString('base64url'),
        signed_bytes: 'canonical-json',
      };
    },
    verify(value, sigObj) {
      if (!sigObj || sigObj.alg !== 'Ed25519') return false;
      const bytes = Buffer.from(canonStr(value));
      return crypto.verify(null, bytes, publicKey, Buffer.from(sigObj.signature, 'base64url'));
    },
    signDecision(payload) {
      return signDecision(privateKey, payload);
    },
  };
}

/**
 * Build a dual-signed COMPOSITE receipt (R3: requires distinct machine + human Ed25519 keys).
 * Refuses if machineSigner and humanSigner share the same public key (machine-fake-blocked).
 */
export function buildDualSignedReceipt(payload, { machineSigner, humanSigner }) {
  if (!machineSigner || !humanSigner) {
    throw new Error('R3: dual-sign COMPOSITE requires both machineSigner and humanSigner');
  }
  if (machineSigner.publicKeyDerB64 && humanSigner.publicKeyDerB64 &&
      machineSigner.publicKeyDerB64 === humanSigner.publicKeyDerB64) {
    throw new Error('R1/R3 violation: machineSigner and humanSigner must not share the same key');
  }
  const machineSig = machineSigner.sign(payload);
  const humanSig = humanSigner.sign(payload);
  const verified = machineSigner.verify(payload, machineSig) && humanSigner.verify(payload, humanSig);
  if (!verified) {
    throw new Error('R3: dual-signature self-verification failed');
  }
  return {
    payload,
    payload_sha256: machineSig.payload_sha256,
    state: 'COMPOSITE',
    signatures: {
      machine: machineSig,
      human: humanSig,
    },
    verified,
  };
}

