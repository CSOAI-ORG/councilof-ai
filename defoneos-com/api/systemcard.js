// DEFONEOS signed AI System Card — the JSP 936 assurance proof point.
// The Alan Turing Institute (CETaS, Jan 2026, "Growing the UK's AI Assurance Market in Defence and
// Security") finds there is "no authoritative, independent organisation ... with the legitimacy to
// inspect and approve AI systems in D&S contexts", and that vendor safety claims are seen as an effort
// to "mark their own homework". This endpoint issues the missing primitive: an INDEPENDENT,
// OFFLINE-VERIFIABLE record that a defence-AI system was governed — an Ed25519-signed System Card
// anyone can verify without trusting us.
//
// HONEST: the card CONTENT below is SYNTHETIC demo data (an illustrative ISR-triage decision). The
// SIGNING and VERIFICATION are REAL. Set DEFONEOS_SIGN_SK (32-byte Ed25519 seed, hex) in env for a
// stable sovereign public key; without it each issue uses an ephemeral key, flagged demo_key:true.
import crypto from 'crypto';

const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');

function keypair() {
  const seedHex = (process.env.DEFONEOS_SIGN_SK || '').trim();
  if (/^[0-9a-fA-F]{64}$/.test(seedHex)) {
    const der = Buffer.concat([PKCS8_ED25519_PREFIX, Buffer.from(seedHex, 'hex')]);
    const priv = crypto.createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
    return { priv, pub: crypto.createPublicKey(priv), demo: false };
  }
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  return { priv: privateKey, pub: publicKey, demo: true };
}
function rawPubHex(pub) { return Buffer.from(pub.export({ format: 'jwk' }).x, 'base64url').toString('hex'); }
// deterministic canonical JSON (sorted keys) so the signature is reproducible + independently checkable
function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v);
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  // POST {card} signs a caller's own fields; GET (or no body) issues the synthetic demo card.
  const supplied = body && body.card && typeof body.card === 'object' ? body.card : null;

  const card = supplied || {
    schema: 'defoneos.systemcard/v1',
    demo: true,
    system: 'ISR triage assistant (SYNTHETIC DEMO)',
    purpose: 'Prioritise sensor tracks for human review. Advisory only — no autonomous effect.',
    intended_use: 'Decision-support for a cleared human operator in a governed COP.',
    out_of_scope: ['autonomous engagement', 'target nomination', 'identification of individuals'],
    jsp936_assurance: {
      data: 'provenance recorded · synthetic training set · no personal data',
      model: 'documented architecture · versioned · reproducible build',
      evaluation: 'held-out eval · failure modes catalogued · red-team pass (demo)',
      deployment: 'signed release · rollback path · environment pinned',
      monitoring: 'drift + outcome logging to tamper-evident ledger',
      human_oversight: 'human-in-the-loop required · advisory output only',
      security: 'Ed25519 signing · air-gap-capable substrate',
      ethics: 'care-floor ≥ 0.30 · proportionality check · hard stops enforced'
    },
    hard_stops: ['no kinetic targeting', 'no personal surveillance', 'no un-voted sovereign action'],
    governance: { signing: 'Ed25519', council: 'BFT quorum 23/33 (illustrative)', care_floor: 0.3 },
    issuer: 'DEFONEOS · sovereign assurance layer',
    standards_referenced: ['JSP 936 (designed to align)', 'Alan Turing Institute System Card template'],
    issued_at: new Date().toISOString()
  };

  const canonical = canon(card);
  const kp = keypair();
  const sig = crypto.sign(null, Buffer.from(canonical, 'utf8'), kp.priv);
  const sha256 = crypto.createHash('sha256').update(canonical).digest('hex');

  return res.status(200).json({
    ok: true,
    card,
    canonical,
    signature: sig.toString('hex'),
    publicKey: rawPubHex(kp.pub),
    algorithm: 'Ed25519',
    sha256,
    demo_key: kp.demo,
    verify_hint: 'Verify offline: ed25519.verify(hex→bytes signature, utf8 bytes of `canonical`, hex→bytes publicKey). No server needed.',
    note: kp.demo
      ? 'Card content is SYNTHETIC; signing/verification are REAL. Ephemeral key — set DEFONEOS_SIGN_SK (32-byte hex seed) in env for a stable sovereign public key.'
      : 'Card content is SYNTHETIC; signing/verification are REAL, under the sovereign DEFONEOS key.'
  });
}
