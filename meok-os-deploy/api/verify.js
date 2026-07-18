// Offline signature verification — anyone can check a MEOK-signed action with just the public
// key. This is the "don't trust our dashboard, verify it yourself" moat, working. CORS-open.
import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const message = body.message ?? body.canonical;   // accept /sign's `canonical` directly (integrator-friendly)
  const { signature, publicKey } = body;
  if (!message || !signature || !publicKey) return res.status(400).json({ error: 'pass {message (or canonical), signature, publicKey}' });
  try {
    const pub = crypto.createPublicKey({ key: Buffer.from(publicKey, 'hex'), format: 'der', type: 'spki' });
    const valid = crypto.verify(null, Buffer.from(message), pub, Buffer.from(signature, 'hex'));
    return res.status(200).json({ valid, alg: 'ed25519', message: valid ? 'signature verified — authentic & untampered' : 'signature does NOT match — reject' });
  } catch (e) { return res.status(200).json({ valid: false, error: String(e.message || e) }); }
}
