// jspace_canvas.js — 6 J-Space primitives wired to /api/jspace/* endpoints
let JSTATE = null;

async function js_run(op, payload) {
  const url = `/api/jspace/${op}`;
  const init = { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload || {}) };
  const r = await fetch(url, init);
  return await r.json();
}

async function j_read() {
  const d = await js_run('read', {prompt: 'sovereign state'});
  JSTATE = d;
  document.getElementById('j-result').textContent = JSON.stringify(d, null, 2).slice(0, 5000);
  return d;
}

async function j_write() {
  const concept = (document.getElementById('j-concept') || {}).value || 'care';
  const strength = parseFloat((document.getElementById('j-strength') || {}).value || 0.9);
  const d = await js_run('write', {concept, strength, source: 'user'});
  document.getElementById('j-result').textContent = JSON.stringify(d, null, 2).slice(0, 2400);
}

async function j_ask() {
  const question = (document.getElementById('j-question') || {}).value || 'what concept dominates?';
  const d = await js_run('ask', {question});
  document.getElementById('j-result').textContent = JSON.stringify(d, null, 2).slice(0, 2400);
}

async function j_control() {
  const directive = (document.getElementById('j-directive') || {}).value || 'focus';
  const target = (document.getElementById('j-target') || {}).value || 'charter';
  const d = await js_run('control', {directive, target});
  document.getElementById('j-result').textContent = JSON.stringify(d, null, 2).slice(0, 2400);
}

async function j_swap() {
  const original = (document.getElementById('j-from') || {}).value || 'harm';
  const replacement = (document.getElementById('j-to') || {}).value || 'care';
  const d = await js_run('swap', {original, replacement});
  document.getElementById('j-result').textContent = JSON.stringify(d, null, 2).slice(0, 2400);
}

async function j_detect() {
  const d = await js_run('detect', {});
  document.getElementById('j-result').textContent = JSON.stringify(d, null, 2).slice(0, 2400);
}

window.j_read = j_read; window.j_write = j_write; window.j_ask = j_ask;
window.j_control = j_control; window.j_swap = j_swap; window.j_detect = j_detect;

// Auto-run read on load
window.addEventListener('load', () => setTimeout(() => j_read(), 800));
