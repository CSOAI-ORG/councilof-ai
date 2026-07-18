// DEFONEOS Signed Card Registry — the product answer to the MOD guidance gap: there is "no
// central store" for system cards (teams keep them locally). This is a shareable, searchable
// index whose MANIFEST is itself Ed25519-signed (tamper-evident), and every entry links to an
// independently-verifiable signed card. No trust required — verify the index AND each card.
import crypto from 'crypto';

function canonical(v) {
  if (typeof v === 'string') return v;
  const sort = (x) => Array.isArray(x) ? x.map(sort)
    : (x && typeof x === 'object') ? Object.keys(x).sort().reduce((o, k) => (o[k] = sort(x[k]), o), {}) : x;
  return JSON.stringify(sort(v));
}
function keypair() {
  const seed = crypto.createHash('sha256').update(process.env.SIGIL_SEED || 'meok-sovereign-demo-key-2026').digest();
  const pkcs8 = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]);
  const priv = crypto.createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
  const pub = crypto.createPublicKey(priv);
  return { priv, pubHex: pub.export({ type: 'spki', format: 'der' }).toString('hex') };
}

const ENTRIES = [
  { id: 'sc-isr-triage-1.4.0', type: 'system', framework: 'JSP 936 (defence)', name: 'ISR Image-Triage Decision Support', supplier: 'Illustrative Prime Ltd (synthetic)', issued: '2026-07-01', source: '/api/systemcard?type=system', view: '/systemcard.html' },
  { id: 'sc-credit-risk-2.1.0', type: 'system', framework: 'EU AI Act · ISO 42001 (civilian)', name: 'Credit-Risk Decisioning Assistant', supplier: 'Illustrative Ltd (synthetic)', issued: '2026-07-01', source: '/api/systemcard?framework=eu-ai-act', view: '/systemcard.html?framework=eu-ai-act' },
  { id: 'mc-isr-classifier-1.4.0', type: 'model', framework: 'DAIC model card', name: 'ISR-Triage Vision Classifier', supplier: 'Illustrative Prime Ltd (synthetic)', issued: '2026-07-01', source: '/api/systemcard?type=model', view: '/registry.html?card=model' },
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const manifest = { registry: 'DEFONEOS Signed Card Registry (demo)', issued: '2026-07-01', count: ENTRIES.length, entries: ENTRIES };
    const { priv, pubHex } = keypair();
    const message = canonical(manifest).slice(0, 8000);
    const signature = crypto.sign(null, Buffer.from(message), priv).toString('hex');
    const sha256 = crypto.createHash('sha256').update(message).digest('hex');
    const fingerprint = 'SOV:' + crypto.createHash('sha256').update(pubHex).digest('hex').slice(0, 32).match(/.{1,4}/g).join('-').toUpperCase();
    return res.status(200).json({
      ok: true, alg: 'ed25519', manifest, canonical: message, sha256, signature, publicKey: pubHex,
      fingerprint, seeded: !!process.env.SIGIL_SEED,
      note: 'The registry manifest is Ed25519-signed (verify at /api/verify). Each entry links to its own independently-verifiable signed card. Data is SYNTHETIC.',
    });
  } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e) }); }
}
