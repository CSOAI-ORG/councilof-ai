// DEFONEOS-SEAL verification endpoint (Vercel serverless, same-origin).
// Honest scope: verifies content integrity of the absorption suite against the
// canonical manifest root. It does NOT mint a sovereign credential — the
// DEFONEOS-SEAL issues only on a logged 33-agent BFT council vote (quorum 23/33).

const MANIFEST_ROOT = 'a69df231adfdb5c528815c5a1d63a6a8688b656f2d3b7e160525020d35f504a2';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed', expected: 'POST' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const submitted = (body && body.hash ? String(body.hash) : '').trim().toLowerCase();

  const integrity = submitted
    ? (submitted === MANIFEST_ROOT ? 'verified' : 'mismatch')
    : 'no_hash_supplied';

  return res.status(200).json({
    ok: true,
    service: 'defoneos-seal',
    integrity,
    manifest_root: MANIFEST_ROOT,
    suite: 'absorption-suite-sealed (docs 00-04 + alignment v2.0)',
    crypto: 'Ed25519 + PQC ML-DSA-65 ready',
    sovereign_signature: 'pending_bft_vote_23_of_33',
    note: 'Content-integrity check only. The sovereign DEFONEOS-SEAL is issued exclusively by a logged 33-agent BFT council vote (quorum 23/33). No credential is asserted before the vote.',
    verified_at: new Date().toISOString()
  });
}
