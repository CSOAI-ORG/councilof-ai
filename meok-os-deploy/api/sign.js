// Ed25519 sovereign signing — the SIGIL moat, working. Signs any governed action so it can
// be verified offline by anyone with the public key (no account, no vendor). Node crypto,
// seed-stable key (owner overrides with SIGIL_SEED). CORS-open.
import crypto from 'crypto';

function canonical(v) {
  if (typeof v === 'string') return v;
  const sort = (x) => Array.isArray(x) ? x.map(sort)
    : (x && typeof x === 'object') ? Object.keys(x).sort().reduce((o, k) => (o[k] = sort(x[k]), o), {}) : x;
  return JSON.stringify(sort(v));
}

function keypair() {
  const seed = crypto.createHash('sha256').update(process.env.SIGIL_SEED || 'meok-sovereign-demo-key-2026').digest();
  const pkcs8 = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]); // Ed25519 PKCS8 header + 32b seed
  const priv = crypto.createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
  const pub = crypto.createPublicKey(priv);
  return { priv, pubHex: pub.export({ type: 'spki', format: 'der' }).toString('hex') };
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const payload = body.action || body.payload || body.message;
  if (payload == null) return res.status(400).json({ error: 'pass {action} or {payload} to sign' });
  try {
    const { priv, pubHex } = keypair();
    const msg = canonical(payload).slice(0, 8000);   // bound the signed payload
    const signature = crypto.sign(null, Buffer.from(msg), priv).toString('hex');
    const fingerprint = 'SOV:' + crypto.createHash('sha256').update(pubHex).digest('hex').slice(0, 32).match(/.{1,4}/g).join('-').toUpperCase();
    return res.status(200).json({
      ok: true, alg: 'ed25519', canonical: msg, signature, publicKey: pubHex, fingerprint,
      note: 'Verify offline at /api/verify with {message, signature, publicKey} — no account needed. (PQC ML-DSA-65 is provided by the SOV33 substrate.)',
      seeded: !!process.env.SIGIL_SEED,
    });
  } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e) }); }
}
