// Training sink — the demo/tour posts a structured trace of how the AI OS was driven
// (which apps opened/closed, in what order, where it flew, where the user interrupted).
// This is the signal SOV33 learns from to use the OS better. Here we accept + acknowledge
// (bounded); the master back-end consumes/forwards it out-of-band (owner-gated).
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(200).json({ ok: true, service: 'sov33-training-sink', hint: 'POST a {kind,trace[]} tour trace' });
  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    body = body || {};
    const trace = Array.isArray(body.trace) ? body.trace.slice(0, 500) : [];
    const kinds = {};
    trace.forEach((s) => { const k = (s && s.kind) || 'step'; kinds[k] = (kinds[k] || 0) + 1; });
    // Acknowledge with a summary the client can log; the master SOV33 ingests separately.
    return res.status(200).json({ ok: true, kind: body.kind || 'tour', received: trace.length, breakdown: kinds, at: Date.now() });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String((e && e.message) || e) });
  }
}
