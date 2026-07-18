// LOOK · on-demand pixel vision for the Sovereign. The brain's default sight is SYMBOLIC (it knows the
// scene from getScreenContext) — cheap, exact, and the right tool for driving the globe. This adds narrow
// image understanding it can CHOOSE to invoke: describe a live camera or satellite frame. Keeping vision
// on-demand (a governed tool call) rather than an always-on VLM is what avoids a routing mess.
//   VLM_ENDPOINT — OpenAI-compatible base URL with vision (e.g. your node /v1, or a hosted VLM)
//   VLM_KEY      — bearer for it (optional)
//   VLM_MODEL    — vision model id (e.g. qwen2-vl / llava / gpt-4o-mini)
// Key stays server-side. Until set, returns gated:true so the Sovereign falls back to the symbolic scene.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const ep = process.env.VLM_ENDPOINT || '';
  const model = process.env.VLM_MODEL || 'vlm';
  if (req.method === 'GET') return res.status(200).json({ ok: !!ep, connected: !!ep, model: ep ? model : null, gated: !ep });
  if (!ep) return res.status(200).json({ ok: false, gated: true, reason: 'No VLM_ENDPOINT set — the Sovereign uses its symbolic sight (screen_context). Owner: set VLM_ENDPOINT + VLM_MODEL for on-demand image understanding.' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const imageUrl = body && body.imageUrl;
  const prompt = (body && body.prompt) || 'Describe this image concisely.';
  if (!imageUrl) return res.status(200).json({ ok: false, error: 'imageUrl required' });
  try {
    const hdr = { 'Content-Type': 'application/json' };
    if (process.env.VLM_KEY) hdr['Authorization'] = 'Bearer ' + process.env.VLM_KEY;
    const payload = {
      model,
      messages: [
        { role: 'system', content: 'You are the Sovereign’s vision. Describe images factually and concisely for a defence operator. NEVER identify individuals or infer identities — a Layer-0 hard stop.' },
        { role: 'user', content: [ { type: 'text', text: prompt }, { type: 'image_url', image_url: { url: imageUrl } } ] }
      ],
      temperature: 0.2, max_tokens: 220
    };
    const r = await fetch(ep.replace(/\/$/, '') + '/chat/completions', { method: 'POST', headers: hdr, body: JSON.stringify(payload), signal: AbortSignal.timeout(25000) });
    if (!r.ok) return res.status(200).json({ ok: false, error: 'VLM HTTP ' + r.status });
    const d = await r.json();
    const description = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content || '';
    return res.status(200).json({ ok: !!description, description, governed: true });
  } catch (e) { return res.status(200).json({ ok: false, error: String(e) }); }
}
