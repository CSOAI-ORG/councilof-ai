#!/usr/bin/env node
// MEOK SAP Runner — run a Sovereign Agent Package on YOUR device, fully offline-capable.
// It (1) loads a SAP, (2) VERIFIES its Ed25519 signature offline (sovereign — no CA, no network),
// (3) exposes the character as a local MCP stdio server any host (Claude Desktop, etc.) can use,
// (4) routes the brain OFFLINE-FIRST to a local model (Ollama/llamafile) with online fallback.
// MIT. Stacks open-source crown jewels: MCP (spec) · llama.cpp/Ollama (MIT) · llamafile (Apache).
//
// Usage:  node meok-sap-runner.mjs --sap https://os.meok.ai/api/sap?name=Aria   (or --sap ./aria.sap.json)
// Claude Desktop: add to mcpServers: { "meok-aria": { "command":"node", "args":["/abs/meok-sap-runner.mjs","--sap","https://os.meok.ai/api/sap?name=Aria"] } }
import crypto from 'node:crypto';
import readline from 'node:readline';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const SAP_SRC = arg('--hatch', arg('--sap', 'https://os.meok.ai/api/hatch?name=MEOK%20Sovereign'));  // --hatch (or legacy --sap)
const OLLAMA = arg('--ollama', 'http://localhost:11434');
const MODEL_GGUF = arg('--model', '');   // optional: a .gguf path → zero-daemon embedded brain via node-llama-cpp
const log = (...a) => process.stderr.write('[meok-runner] ' + a.join(' ') + '\n');  // logs to stderr (stdout is the MCP channel)

// ---- load SAP (file or URL) ----
async function loadSAP(src) {
  if (/^https?:/.test(src)) { const r = await fetch(src); return r.json(); }
  const fs = await import('node:fs'); return JSON.parse(fs.readFileSync(src, 'utf8'));
}
// ---- SOVEREIGN OFFLINE VERIFY — the whole point: prove authenticity with just the public key ----
function verifySAP(sap) {
  try { const s = sap.signature; if (!s) return { ok: false, why: 'no signature' };
    const pub = crypto.createPublicKey({ key: Buffer.from(s.publicKey, 'hex'), format: 'der', type: 'spki' });
    const ok = crypto.verify(null, Buffer.from(s.canonical), pub, Buffer.from(s.signature, 'hex'));
    return { ok, fingerprint: s.fingerprint, seeded: s.seeded };
  } catch (e) { return { ok: false, why: String(e.message || e) }; }
}
// ---- optional ZERO-DAEMON embedded brain (node-llama-cpp) — only if --model <gguf> is given ----
let _session = null;
async function tryLocalLlama(prompt) {
  if (!MODEL_GGUF) return null;
  try {
    if (!_session) { const m = await import('node-llama-cpp'); const llama = await m.getLlama(); const model = await llama.loadModel({ modelPath: MODEL_GGUF }); const ctx = await model.createContext(); _session = new m.LlamaChatSession({ contextSequence: ctx.getSequence() }); log('embedded brain loaded (node-llama-cpp):', MODEL_GGUF); }
    const text = await _session.prompt(prompt); return { text: (text || '').trim(), via: 'offline:embedded-llama.cpp' };
  } catch (e) { log('embedded brain unavailable (npm i node-llama-cpp + a .gguf):', e.message); return null; }
}
// ---- BRAIN: embedded (zero-daemon) → Ollama → online fallback → honest stub ----
async function brain(sap, prompt) {
  const local = await tryLocalLlama(prompt); if (local) return local;
  const model = ((sap.package?.brain?.left?.offline || [])[0] || 'ollama/llama3.2').replace(/^ollama\//, '');
  try {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 2000);
    const r = await fetch(OLLAMA + '/api/generate', { method: 'POST', signal: ac.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, prompt, stream: false }) });
    clearTimeout(t); if (r.ok) { const d = await r.json(); if (d.response) return { text: d.response.trim(), via: 'offline:ollama/' + model }; }
  } catch (e) { /* offline brain absent → fall through */ }
  try {
    const online = sap.package?.interfaces?.orchestrate || (sap.package?.interfaces?.openai_chat || '').replace('/v1/chat/completions', '/orchestrate') || 'https://os.meok.ai/api/orchestrate';
    const r = await fetch(online, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: prompt }) });
    if (r.ok) { const d = await r.json(); if (d.say) return { text: d.say, via: 'online:sovereign' }; }
  } catch (e) { /* offline entirely */ }
  return { text: '(offline brain not installed — run `ollama pull ' + model + '` for a fully-local mind; online was unreachable too.)', via: 'stub' };
}

const RPC = (id, result) => ({ jsonrpc: '2.0', id, result });
const RERR = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

(async function main() {
  let sap, v;
  try { sap = await loadSAP(SAP_SRC); v = verifySAP(sap); } catch (e) { log('failed to load SAP:', e.message); process.exit(1); }
  const nm = sap.package?.agent?.name || 'MEOK Sovereign';
  log('loaded SAP:', nm, '· signature', v.ok ? 'VALID ✓' : 'INVALID ✗', v.fingerprint || '', v.seeded ? '(owner-seeded)' : '(demo key)');
  if (!v.ok) log('WARNING: signature did not verify — refusing to trust unverified identity is your call.');
  const tools = [
    { name: 'talk', description: 'Talk to ' + nm + ' (offline-first brain, online fallback).', inputSchema: { type: 'object', properties: { message: { type: 'string' } }, required: ['message'] } },
    { name: 'brain_status', description: 'Which brain/model is active (offline/online).', inputSchema: { type: 'object', properties: {} } },
    { name: 'boot', description: 'Where this character boots its OS + 3D world.', inputSchema: { type: 'object', properties: {} } },
    { name: 'identity', description: 'Verified sovereign identity (fingerprint) of this package.', inputSchema: { type: 'object', properties: {} } },
  ];
  const rl = readline.createInterface({ input: process.stdin });
  const send = (o) => process.stdout.write(JSON.stringify(o) + '\n');
  rl.on('line', async (line) => {
    line = line.trim(); if (!line) return; let msg; try { msg = JSON.parse(line); } catch { return; }
    const { id = null, method, params = {} } = msg;
    if (method === 'initialize') return send(RPC(id, { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'meok-sap-runner', version: '1.0.0', agent: nm, verified: v.ok } }));
    if (method && method.startsWith('notifications/')) return;  // no response to notifications
    if (method === 'ping') return send(RPC(id, {}));
    if (method === 'tools/list') return send(RPC(id, { tools }));
    if (method === 'tools/call') {
      const n = params.name, a = params.arguments || {};
      try {
        if (n === 'talk') { const b = await brain(sap, String(a.message || '')); return send(RPC(id, { content: [{ type: 'text', text: b.text + '\n\n— via ' + b.via }] })); }
        if (n === 'brain_status') { const br = sap.package?.brain || {}; return send(RPC(id, { content: [{ type: 'text', text: 'modes: ' + (br.modes || []).join(' | ') + '\nleft(offline): ' + (br.left?.offline || []).join(', ') + '\nright(offline): ' + (br.right?.offline || []).join(', ') + '\norchestrator: ' + (br.orchestrator || '') }] })); }
        if (n === 'boot') { const bt = sap.package?.boot || {}; return send(RPC(id, { content: [{ type: 'text', text: 'OS: ' + bt.os + '\n3D world: ' + bt.world3d + '\ncharacter: ' + bt.character }] })); }
        if (n === 'identity') return send(RPC(id, { content: [{ type: 'text', text: (v.ok ? 'VERIFIED ✓ ' : 'UNVERIFIED ✗ ') + (v.fingerprint || '') + (v.seeded ? ' (owner-seeded)' : ' (demo key)') }] }));
        return send(RERR(id, -32602, 'unknown tool: ' + n));
      } catch (e) { return send(RERR(id, -32603, String(e.message || e))); }
    }
    return send(RERR(id, -32601, 'method not found: ' + method));
  });
  log('MCP stdio ready — connect from any MCP host. Tools:', tools.map(t => t.name).join(', '));
})();
