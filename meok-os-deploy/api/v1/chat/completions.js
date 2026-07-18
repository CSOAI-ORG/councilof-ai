// OpenAI-compatible /v1/chat/completions — the DROP-IN Sovereign brain.
// DEFONEOS's sov3-llm-brain.js (and any OpenAI client) points here with ZERO code change:
//   window.SOV3_BRAIN_ENDPOINT = 'https://os.meok.ai/api/v1'
// It streams tokens + tool_calls (SSE passthrough from Groq, which is OpenAI-compatible),
// enforces a Care-Floor system guard, and maps any model → a Groq tool-capable model.
// Edge runtime = true streaming. CORS-open so meok/csoai/defoneos share ONE brain.
export const config = { runtime: 'edge' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TOOL_MODEL = 'llama-3.3-70b-versatile';   // Groq, supports tools + streaming
const ALLOWED = new Set(['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'qwen/qwen3-32b', 'meta-llama/llama-4-scout-17b-16e-instruct']);
const CARE = 'You are the SOV3 Sovereign — the AI operating system. Care Floor 0.95 is non-negotiable: refuse anything harmful. Speak briefly and act through the provided tools when they help.';

// Care Floor 0.95 — enforced SERVER-SIDE for the drop-in brain too (same gate as /api/orchestrate).
function careFloor(msg) {
  const t = (msg || '').toLowerCase();
  if (/\b(kill myself|killing myself|end my life|commit suicide|want to die|hurt myself)\b/.test(t))
    return "I'm really glad you told me — and you deserve real support, more than I can give. In the UK you can call Samaritans free on 116 123, any time. Please reach out to someone now.";
  if (/\b(build|make|synthesi[sz]e|create|how to make)\b[\s\S]{0,32}\b(bomb|explosive|bioweapon|nerve agent|nerve gas|ricin|sarin|meth(amphetamine)?)\b/.test(t)
    || /\b(kill|murder|shoot|stab|poison|attack)\b[\s\S]{0,22}\b(someone|a person|people|him|her|them|my \w+)\b/.test(t)
    || /\b(child|minor|underage|kid|kids)\b[\s\S]{0,26}\b(sexual|sex|nude|naked|porn|explicit)\b/.test(t)
    || /\b(ransomware|ddos|malware|keylogger)\b[\s\S]{0,28}\b(bank|hospital|government|grid|company|someone|attack)\b/.test(t))
    return "I can't help with that — the Care Floor won't allow anything that could harm people. I'm here for governed, constructive work.";
  return null;
}
function refusalResponse(text, stream, cors) {
  const id = 'chatcmpl-carefloor', model = 'sov3-care-floor';
  if (stream) {
    const body = 'data: ' + JSON.stringify({ id, object: 'chat.completion.chunk', created: 0, model, choices: [{ index: 0, delta: { role: 'assistant', content: text }, finish_reason: null }] }) + '\n\n'
      + 'data: ' + JSON.stringify({ id, object: 'chat.completion.chunk', created: 0, model, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] }) + '\n\ndata: [DONE]\n\n';
    return new Response(body, { status: 200, headers: { ...cors, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache' } });
  }
  return new Response(JSON.stringify({ id, object: 'chat.completion', created: 0, model, choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }], care_floor_refused: true }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
}
// only forward standard OpenAI chat params (Groq 400s on unknown fields like care_floor)
const KEEP = ['messages', 'tools', 'tool_choice', 'temperature', 'top_p', 'max_tokens', 'max_completion_tokens', 'stop', 'stream', 'response_format', 'seed', 'n', 'presence_penalty', 'frequency_penalty'];

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'POST only' }), { status: 405, headers: { ...CORS, 'Content-Type': 'application/json' } });

  const key = process.env.GROQ_API_KEY;
  if (!key || key.startsWith('REPLACE')) return new Response(JSON.stringify({ error: 'brain not configured (GROQ_API_KEY)' }), { status: 503, headers: { ...CORS, 'Content-Type': 'application/json' } });

  let body; try { body = await req.json(); } catch { body = {}; }

  // Care Floor 0.95 — gate the last user turn BEFORE proxying to the brain
  const lastUser = (Array.isArray(body.messages) ? body.messages.filter(m => m.role === 'user').pop() : null);
  const cf = careFloor(lastUser && (typeof lastUser.content === 'string' ? lastUser.content : ''));
  if (cf) return refusalResponse(cf, !!body.stream, CORS);

  const out = {};
  for (const k of KEEP) if (body[k] !== undefined) out[k] = body[k];

  // model mapping: any requested model → a Groq tool-capable model
  out.model = ALLOWED.has(body.model) ? body.model : TOOL_MODEL;

  // Care-Floor guard: prepend a sovereign system message if the caller didn't set one
  const msgs = Array.isArray(out.messages) ? out.messages.slice() : [];
  const hasSov = msgs.some(m => m.role === 'system' && /care floor|sovereign/i.test(String(m.content || '')));
  if (!hasSov) msgs.unshift({ role: 'system', content: CARE });
  out.messages = msgs;

  let upstream;
  try {
    upstream = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(out),
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'upstream unreachable', detail: String(e) }), { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  // stream (or JSON) passthrough — the body is already OpenAI-shaped (tokens + tool_calls)
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      ...CORS,
      'Content-Type': upstream.headers.get('content-type') || (out.stream ? 'text/event-stream; charset=utf-8' : 'application/json'),
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
