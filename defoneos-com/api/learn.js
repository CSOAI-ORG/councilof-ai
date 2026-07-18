// Learning-queue export → the SOV3 sovereign node. The browser accumulates + signs the prompts the
// rule-based dock couldn't action (the real training signal); this ships that batch to the node's
// ingest so RL / fine-tune can happen THERE (BFT-gated on-node). Honest: this endpoint FORWARDS and
// issues a content-addressed receipt — it does not train, and it never fabricates a result.
//   SOV3_LEARN_ENDPOINT  — POST target on your node that ingests {intents:[...]} (optional; falls back to none)
//   SOV3_BRAIN_KEY       — reused as the bearer for the node if set
import crypto from 'crypto';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const ep = process.env.SOV3_LEARN_ENDPOINT || '';
  if (req.method === 'GET') return res.status(200).json({ ok: !!ep, connected: !!ep, gated: !ep });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const intents = (body && body.intents) || [];
  if (!Array.isArray(intents) || !intents.length) return res.status(200).json({ ok: false, error: 'intents[] required' });
  // content-addressed receipt (SHA-256 of the batch) — the client Ed25519-signs it into its SIGIL chain
  const digest = crypto.createHash('sha256').update(JSON.stringify(intents)).digest('hex');
  const receipt = { count: intents.length, sha256: digest, ts: new Date().toISOString() };
  if (!ep) return res.status(200).json({
    ok: false, gated: true, forwarded: false, receipt,
    reason: 'No SOV3_LEARN_ENDPOINT set — the batch is receipted but not shipped. Owner: point it at your node’s ingest (POST {intents}) to feed RL/fine-tune on-node.'
  });
  try {
    const hdr = { 'Content-Type': 'application/json' };
    if (process.env.SOV3_BRAIN_KEY) hdr['Authorization'] = 'Bearer ' + process.env.SOV3_BRAIN_KEY;
    const r = await fetch(ep, { method: 'POST', headers: hdr, body: JSON.stringify({ intents, receipt, source: 'defoneos-mirror' }), signal: AbortSignal.timeout(15000) });
    return res.status(200).json({ ok: r.ok, forwarded: r.ok, status: r.status, receipt, governed: true });
  } catch (e) { return res.status(200).json({ ok: false, forwarded: false, error: String(e), receipt }); }
}
