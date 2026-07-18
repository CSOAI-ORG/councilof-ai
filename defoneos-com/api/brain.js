// Server-side Sovereign brain proxy — connects the dome chat to a real LLM with ONE
// set of Vercel env vars, and keeps the API key SERVER-SIDE (never shipped to the browser).
//   SOV3_BRAIN_ENDPOINT  — OpenAI-compatible base URL, e.g. https://your-gcp-vm/v1  or  https://api.groq.com/openai/v1
//   SOV3_BRAIN_KEY       — bearer key for that endpoint (optional for a keyless local node)
//   SOV3_BRAIN_MODEL     — model id, e.g. sov3-sovereign-v2 / llama-3.3-70b-versatile
// The browser POSTs {messages, tools} and executes any tool_calls locally (it drives the globe),
// looping back through here each turn. Until the env is set this returns ok:false/gated so the
// front-end falls back to the honest rule-based router — it never fabricates an LLM.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const ep = process.env.SOV3_BRAIN_ENDPOINT || '';
  const key = process.env.SOV3_BRAIN_KEY || '';
  const model = process.env.SOV3_BRAIN_MODEL || 'sov3-sovereign-v2';
  // GET = capability probe (front-end asks "is a real brain connected?")
  if (req.method === 'GET') return res.status(200).json({ ok: !!ep, connected: !!ep, model: ep ? model : null, gated: !ep });
  if (!ep) return res.status(200).json({ ok: false, gated: true, reason: 'No SOV3_BRAIN_ENDPOINT env set — running the honest rule-based dock. Owner: point it at your GCP-VM SOV3 node (or any OpenAI-compatible endpoint) + SOV3_BRAIN_KEY to reason with the real brain.' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const messages = (body && body.messages) || [];
  const tools = (body && body.tools) || undefined;
  if (!messages.length) return res.status(200).json({ ok: false, error: 'messages required' });
  try {
    const hdr = { 'Content-Type': 'application/json' };
    if (key) hdr['Authorization'] = 'Bearer ' + key;
    const payload = { model, messages, temperature: 0.4 };
    if (tools) { payload.tools = tools; payload.tool_choice = 'auto'; }
    const r = await fetch(ep.replace(/\/$/, '') + '/chat/completions', { method: 'POST', headers: hdr, body: JSON.stringify(payload), signal: AbortSignal.timeout(30000) });
    const txt = await r.text();
    if (!r.ok) return res.status(200).json({ ok: false, error: 'brain HTTP ' + r.status, detail: txt.slice(0, 240) });
    let d; try { d = JSON.parse(txt); } catch { return res.status(200).json({ ok: false, error: 'brain returned non-JSON' }); }
    return res.status(200).json({ ok: true, completion: d, governed: true });
  } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
}
