#!/usr/bin/env node
/**
 * defoneos-sign-mcp — the DEFONEOS signing MCP.
 *
 * Lets ANY Claude agent (Claude Science, Claude Code, a custom agent) hand over an
 * output and get back a SIGNED, offline-verifiable DEFONEOS artifact — the sovereign
 * "assurance layer on top" of AI outputs. The receipt drops straight into
 * defoneos.vercel.app/verify.html (same Ed25519 scheme as the dome's SIGIL ledger).
 *
 * Not a tenant of anyone's app — a supplier the ecosystem calls INTO.
 *
 * Zero external deps: Node's built-in crypto (Ed25519, RFC 8032) + a stable on-disk
 * sovereign key. Speaks MCP over stdio (newline-delimited JSON-RPC 2.0).
 *
 * Tools:
 *   defoneos_sign        — wrap {output, method, inputs} in signed provenance → receipt
 *   defoneos_verify      — verify a receipt offline (tamper-evident)
 *   defoneos_public_key  — the sovereign public key + fingerprint
 *
 * CSOAI Ltd (UK 16939677) · MIT + CC0.
 */
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PROTOCOL = 'defoneos-sign/1.0';
const CARE_FLOOR = 0.95;
const KEY_DIR = process.env.DEFONEOS_KEY_DIR || path.join(os.homedir(), '.defoneos');
const KEY_PATH = path.join(KEY_DIR, 'sign.key');           // PKCS8 PEM, sovereign, on-device
const VERIFY_URL = process.env.DEFONEOS_VERIFY_URL || 'https://defoneos.vercel.app/verify.html';
const SPKI_ED25519_PREFIX = '302a300506032b6570032100';    // strip → raw 32-byte pubkey

// ── sovereign key (generate once, persist) ──────────────────────────────────
function loadOrCreateKey() {
  try {
    const pem = fs.readFileSync(KEY_PATH, 'utf8');
    return crypto.createPrivateKey(pem);
  } catch (_) {
    const { privateKey } = crypto.generateKeyPairSync('ed25519');
    try { fs.mkdirSync(KEY_DIR, { recursive: true, mode: 0o700 }); } catch (_) {}
    try { fs.writeFileSync(KEY_PATH, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 }); } catch (_) {}
    return privateKey;
  }
}
const PRIV = loadOrCreateKey();
const PUB_RAW_HEX = (function () {
  const der = crypto.createPublicKey(PRIV).export({ type: 'spki', format: 'der' }).toString('hex');
  return der.startsWith(SPKI_ED25519_PREFIX) ? der.slice(SPKI_ED25519_PREFIX.length) : der.slice(-64);
})();
function fingerprint(hex) {
  const h = crypto.createHash('sha256').update(Buffer.from(hex, 'hex')).digest('hex').toUpperCase();
  return 'SOV:' + h.slice(0, 4) + '-' + h.slice(4, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16);
}
const FINGERPRINT = fingerprint(PUB_RAW_HEX);

// ── the signed artifact (verify.html-compatible: message = {i,ts,action,detail,prev}) ──
let CHAIN_PREV = '';   // hash-chain like the dome's ledger
let CHAIN_COUNT = 0;   // how many artifacts signed in this process
let CHAIN_LAST_ACTION = null;
let CHAIN_LAST_TS = null;
function _recordChain(action, ts, sig) { CHAIN_PREV = sig; CHAIN_COUNT += 1; CHAIN_LAST_ACTION = action; CHAIN_LAST_TS = ts; }
function sha256(s) { return crypto.createHash('sha256').update(typeof s === 'string' ? s : JSON.stringify(s)).digest('hex'); }
function signArtifact({ kind, subject, output, method, inputs, i }) {
  const output_str = typeof output === 'string' ? output : JSON.stringify(output);
  const detailObj = {
    subject: String(subject || '').slice(0, 200),
    method: method ? String(method).slice(0, 800) : undefined,          // "how it was made" (the Claude-Science reproducibility parallel)
    inputs: inputs != null ? inputs : undefined,                         // provenance of inputs
    output_sha256: sha256(output_str),                                   // binds the exact content
    output_bytes: Buffer.byteLength(output_str, 'utf8'),
    care_floor: CARE_FLOOR,                                              // governance floor recorded in the envelope
    care_note: 'signed for assurance only — no kinetic/surveillance tasking (Layer-0 hard stop)'
  };
  // message must be EXACTLY {i,ts,action,detail,prev} so defoneos verify.html recomputes the same bytes
  const message = {
    i: (typeof i === 'number' ? i : 0),
    ts: new Date().toISOString(),
    action: 'artifact:' + String(kind || 'output'),
    detail: JSON.stringify(detailObj),
    prev: CHAIN_PREV
  };
  const bytes = Buffer.from(JSON.stringify(message), 'utf8');
  const sig = crypto.sign(null, bytes, PRIV).toString('hex');           // raw Ed25519, RFC 8032
  _recordChain(message.action, message.ts, sig);
  return {
    defoneos_signed_contact: {
      message,
      signature_ed25519: sig,
      public_key_ed25519: PUB_RAW_HEX,
      fingerprint: FINGERPRINT,
      algorithm: 'Ed25519 (RFC 8032) over utf8(JSON.stringify(message))',
      provenance: detailObj,                                            // decoded convenience copy
      verify: 'Drop this into ' + VERIFY_URL + ' — every signature re-checked offline, no server.',
      issued_by: 'DEFONEOS signing MCP · CSOAI Ltd (UK 16939677)'
    }
  };
}
// ── SIGNED SYSTEM CARD · the JSP 936 / EU-AI-Act assurance primitive, as a signed artifact ──
// The gap Turing/CETaS named: "no authoritative, independent organisation … to inspect and approve AI systems."
// This doesn't approve — it produces a SIGNED, offline-verifiable declaration a buyer/auditor can check with no server.
function signSystemCard(p) {
  p = p || {};
  const card = {
    '@type': 'DEFONEOS-SystemCard',
    system: { name: String(p.name || 'unnamed system').slice(0, 160), version: p.version ? String(p.version).slice(0, 40) : undefined, provider: p.provider ? String(p.provider).slice(0, 160) : undefined, purpose: String(p.purpose || '').slice(0, 800) },
    classification: { risk_tier: p.risk_tier || 'unclassified', rationale: p.rationale ? String(p.rationale).slice(0, 600) : undefined, eu_ai_act_annex_iii: !!p.high_risk },
    frameworks: Array.isArray(p.frameworks) && p.frameworks.length ? p.frameworks : ['EU AI Act', 'ISO 42001', 'ISO 27001', 'NIST AI RMF', 'SOC 2', 'DORA', 'Cyber Essentials', 'OWASP Agentic Top 10', 'JSP 936'],
    controls: {
      human_oversight: p.human_oversight != null ? p.human_oversight : 'human-in-the-loop for high-risk actions (Article 14)',
      transparency_art50: p.transparency != null ? p.transparency : 'AI-generated outputs marked (EU AI Act Art 50)',
      data_governance: p.data_governance || 'documented; lawful basis recorded',
      logging: p.logging || 'every governed action Ed25519-signed to an offline-verifiable ledger',
      robustness: p.robustness || 'documented eval + care-floor ' + CARE_FLOOR
    },
    limitations: p.limitations ? String(p.limitations).slice(0, 800) : 'this card attests declared posture + is cryptographically signed; it does NOT certify or approve the system — assurance, not accreditation.',
    care_floor: CARE_FLOOR,
    issued: new Date().toISOString()
  };
  const message = { i: 0, ts: card.issued, action: 'system-card:' + card.system.name, detail: JSON.stringify(card), prev: CHAIN_PREV };
  const bytes = Buffer.from(JSON.stringify(message), 'utf8');
  const sig = crypto.sign(null, bytes, PRIV).toString('hex');
  _recordChain(message.action, message.ts, sig);
  return {
    defoneos_signed_contact: {
      message, signature_ed25519: sig, public_key_ed25519: PUB_RAW_HEX, fingerprint: FINGERPRINT,
      algorithm: 'Ed25519 (RFC 8032) over utf8(JSON.stringify(message))',
      system_card: card,
      verify: 'Drop this into ' + VERIFY_URL + ' — signature re-checked offline, no server.',
      issued_by: 'DEFONEOS signing MCP · CSOAI Ltd (UK 16939677)',
      note: 'Signed assurance declaration (JSP 936 / EU AI Act shape). Attestation of declared posture — NOT certification/approval.'
    }
  };
}
// ── SIGNED OSCAL EXPORT · NIST OSCAL component-definition, signed — the auditor's lingua-franca ──
function signOscal(p) {
  p = p || {};
  const uuid = () => crypto.randomUUID();
  const CTRLS = Array.isArray(p.controls) && p.controls.length ? p.controls.map(c => [c.id || c['control-id'] || 'ctrl', c.description || c.desc || '']) : [
    ['eu-ai-act/art-14', 'Human oversight — a human confirms high-risk actions (Article 14).'],
    ['eu-ai-act/art-50', 'Transparency — AI-generated outputs are marked (Article 50).'],
    ['eu-ai-act/art-12', 'Record-keeping — every governed action Ed25519-signed to an offline-verifiable ledger.'],
    ['iso-42001/A.9', 'AI risk management — documented risk classification + care-floor ' + CARE_FLOOR + '.'],
    ['nist-ai-rmf/GOVERN', 'Govern — sensitive actions gated; hard-stops on kinetic/surveillance.'],
    ['dora/ict-risk', 'DORA — ICT risk management, incident reporting + resilience testing (financial entities).'],
    ['owasp-agentic/ASI04', 'Supply-chain integrity — signed provenance + SHA-pinned dependencies (registry-poisoning defence).'],
    ['jsp-936/assurance', 'Deployment assurance — signed, offline-verifiable System Card + action ledger.']
  ];
  const title = String(p.title || 'DEFONEOS — Sovereign Governance Posture (declared)').slice(0, 200);
  const oscal = { 'component-definition': { uuid: uuid(),
    metadata: { title, 'last-modified': new Date().toISOString(), version: String(p.version || '1.0.0'), 'oscal-version': '1.1.2', remarks: 'Declared posture, cryptographically signed. Attestation — NOT a passed assessment or certification.' },
    components: [{ uuid: uuid(), type: 'software', title: String(p.component || 'DEFONEOS Sovereign Governance Layer').slice(0, 160), description: String(p.description || 'Signed, offline-verifiable AI-governance layer.').slice(0, 600),
      'control-implementations': [{ uuid: uuid(), source: String(p.source || 'https://defoneos.vercel.app/#frameworks'), description: 'Framework alignment.',
        'implemented-requirements': CTRLS.map(c => ({ uuid: uuid(), 'control-id': c[0], description: c[1] })) }] }] } };
  const docStr = JSON.stringify(oscal), hash = sha256(docStr);
  const message = { i: 0, ts: oscal['component-definition'].metadata['last-modified'], action: 'oscal-export', detail: 'OSCAL component-definition · ' + CTRLS.length + ' controls · sha256:' + hash, prev: CHAIN_PREV };
  const sig = crypto.sign(null, Buffer.from(JSON.stringify(message), 'utf8'), PRIV).toString('hex');
  _recordChain(message.action, message.ts, sig);
  return { defoneos_signed_contact: { message, signature_ed25519: sig, public_key_ed25519: PUB_RAW_HEX, fingerprint: FINGERPRINT, doc_sha256: hash, oscal,
    algorithm: 'Ed25519 (RFC 8032) over utf8(JSON.stringify(message)); OSCAL bound by doc_sha256',
    verify: 'Drop into ' + VERIFY_URL + ' (checks the signature). OSCAL component-definition is under .oscal — ingest into any OSCAL tool.',
    issued_by: 'DEFONEOS signing MCP · CSOAI Ltd (UK 16939677)', note: 'Declared posture — attestation, not certification.' } };
}
function verifyReceipt(receipt) {
  const r = receipt && (receipt.defoneos_signed_contact || receipt);
  if (!r || !r.message || !r.signature_ed25519 || !r.public_key_ed25519)
    return { valid: false, reason: 'not a DEFONEOS signed artifact (need message + signature_ed25519 + public_key_ed25519)' };
  try {
    const m = r.message;
    const bytes = Buffer.from(JSON.stringify({ i: m.i, ts: m.ts, action: m.action, detail: m.detail, prev: m.prev }), 'utf8');
    const der = Buffer.concat([Buffer.from(SPKI_ED25519_PREFIX, 'hex'), Buffer.from(r.public_key_ed25519, 'hex')]);
    const pub = crypto.createPublicKey({ key: der, format: 'der', type: 'spki' });
    const ok = crypto.verify(null, bytes, pub, Buffer.from(r.signature_ed25519, 'hex'));
    // if the artifact carries the output, re-bind it
    let contentOk = null;
    try { const d = JSON.parse(m.detail); if (d && d.output_sha256 && receipt.output != null) contentOk = (sha256(String(receipt.output)) === d.output_sha256); } catch (_) {}
    return { valid: ok, content_match: contentOk, fingerprint: fingerprint(r.public_key_ed25519), action: m.action, ts: m.ts,
      reason: ok ? 'signature cryptographically valid — sovereign, offline, no server' : 'signature INVALID — tampered or wrong key' };
  } catch (e) { return { valid: false, reason: 'verify error: ' + e.message }; }
}

// ── MCP tool surface ────────────────────────────────────────────────────────
const TOOLS = [
  { name: 'defoneos_sign',
    description: 'Wrap an AI/scientific output in DEFONEOS signed provenance and return an offline-verifiable receipt (Ed25519). Use to make any result auditable + reproducible + independently checkable — the sovereign assurance layer on top of an output. The receipt verifies at defoneos.vercel.app/verify.html with no server.',
    inputSchema: { type: 'object', required: ['output'], properties: {
      output: { type: 'string', description: 'The result/output/claim to sign (text, JSON, a figure caption, a finding).' },
      kind: { type: 'string', description: 'Artifact kind, e.g. finding | figure | dataset | analysis | decision | system-card. Default output.' },
      subject: { type: 'string', description: 'What the artifact is about (short).' },
      method: { type: 'string', description: 'How it was made — code, tool, model, pipeline steps (the reproducibility record).' },
      inputs: { description: 'Inputs/sources used (array or object) — data provenance.' } } } },
  { name: 'defoneos_verify',
    description: 'Verify a DEFONEOS signed artifact offline (tamper-evident). Returns whether the Ed25519 signature is valid and, if the original output is supplied, whether the content still matches its hash.',
    inputSchema: { type: 'object', required: ['receipt'], properties: {
      receipt: { type: 'object', description: 'A receipt from defoneos_sign (the full object or its defoneos_signed_contact).' },
      output: { type: 'string', description: 'Optional: the original output, to re-bind content to its signed hash.' } } } },
  { name: 'defoneos_system_card',
    description: 'Produce a SIGNED, offline-verifiable AI System Card (JSP 936 / EU AI Act shape) for an AI system — the sovereign assurance primitive the Turing/CETaS gap named. Declares purpose, risk tier, frameworks, controls (human-oversight, Art-50 transparency, logging, robustness) and limitations, then Ed25519-signs it. Attestation of declared posture, NOT certification. Verifies at defoneos.vercel.app/verify.html.',
    inputSchema: { type: 'object', required: ['name', 'purpose'], properties: {
      name: { type: 'string', description: 'System name.' }, version: { type: 'string' }, provider: { type: 'string' },
      purpose: { type: 'string', description: 'What the system does / intended use.' },
      risk_tier: { type: 'string', description: 'e.g. high | limited | minimal (EU AI Act) or your scheme.' },
      high_risk: { type: 'boolean', description: 'EU AI Act Annex III high-risk?' },
      rationale: { type: 'string', description: 'Why that risk tier.' },
      frameworks: { type: 'array', items: { type: 'string' }, description: 'Frameworks it aligns to (defaults EU AI Act/ISO 42001/NIST AI RMF/JSP 936).' },
      human_oversight: { type: 'string' }, transparency: { type: 'string' }, data_governance: { type: 'string' }, logging: { type: 'string' }, robustness: { type: 'string' }, limitations: { type: 'string' } } } },
  { name: 'defoneos_oscal',
    description: 'Produce a SIGNED NIST OSCAL 1.1.2 component-definition of an AI system\'s governance posture — the auditor\'s lingua-franca. An OSCAL tool ingests the .oscal doc directly; the Ed25519 signature verifies offline. Declared posture, NOT a passed assessment.',
    inputSchema: { type: 'object', properties: {
      title: { type: 'string', description: 'Component-definition title.' }, component: { type: 'string' }, description: { type: 'string' }, version: { type: 'string' }, source: { type: 'string' },
      controls: { type: 'array', description: 'Optional [{id, description}] control implementations; defaults to the EU AI Act/ISO 42001/NIST/JSP 936 set.', items: { type: 'object' } } } } },
  { name: 'defoneos_public_key',
    description: 'Return the sovereign Ed25519 public key + fingerprint used to sign artifacts (so a verifier can trust-on-first-use / pin it).',
    inputSchema: { type: 'object', properties: {} } },
  { name: 'defoneos_chain_status',
    description: 'Read the local SIGIL-style hash chain head: how many artifacts this sovereign key has signed in this process lifetime, the last message.action + ts + sig, and the chain head (prev-pointing signature). Pure read — never signs anything new. Use to confirm a host can talk to the dome’s ledger shape.',
    inputSchema: { type: 'object', properties: {} } }
];
function callTool(name, args) {
  args = args || {};
  if (name === 'defoneos_sign') return signArtifact({ kind: args.kind, subject: args.subject, output: args.output, method: args.method, inputs: args.inputs });
  if (name === 'defoneos_system_card') return signSystemCard(args);
  if (name === 'defoneos_oscal') return signOscal(args);
  if (name === 'defoneos_verify') return verifyReceipt(Object.assign({}, args.receipt, args.output != null ? { output: args.output } : {}));
  if (name === 'defoneos_public_key') return { public_key_ed25519: PUB_RAW_HEX, fingerprint: FINGERPRINT, algorithm: 'Ed25519 (RFC 8032)', verify_url: VERIFY_URL, protocol: PROTOCOL };
  if (name === 'defoneos_chain_status') return getChainStatus();
  throw new Error('unknown tool: ' + name);
}
function getChainStatus() {
  return {
    protocol: PROTOCOL,
    fingerprint: FINGERPRINT,
    count: CHAIN_COUNT,
    head_signature_ed25519: CHAIN_PREV || null,
    last_action: CHAIN_LAST_ACTION || null,
    last_ts: CHAIN_LAST_TS || null,
    care_floor: CARE_FLOOR,
    verify_url: VERIFY_URL,
    note: 'In-process head only — for a persisted ledger use defoneos.vercel.app/verify.html or the SIGIL chain (Ed25519 hash-chained, Bitcoin OP_RETURN anchored).'
  };
}

// ── MCP stdio server (newline-delimited JSON-RPC 2.0) ────────────────────────
function main() {
  let buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
      if (!line) continue;
      let msg; try { msg = JSON.parse(line); } catch (_) { continue; }
      handle(msg);
    }
  });
  function send(obj) { process.stdout.write(JSON.stringify(obj) + '\n'); }
  function ok(id, result) { send({ jsonrpc: '2.0', id, result }); }
  function err(id, code, message) { send({ jsonrpc: '2.0', id, error: { code, message } }); }
  function handle(m) {
    if (m.method === 'initialize') {
      return ok(m.id, { protocolVersion: '2024-11-05', serverInfo: { name: 'defoneos-sign', version: '1.0.0' }, capabilities: { tools: {} } });
    }
    if (m.method === 'notifications/initialized' || (m.method && m.method.indexOf('notifications/') === 0)) return; // no response to notifications
    if (m.method === 'tools/list') return ok(m.id, { tools: TOOLS });
    if (m.method === 'tools/call') {
      try {
        const out = callTool(m.params && m.params.name, m.params && m.params.arguments);
        return ok(m.id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      } catch (e) { return err(m.id, -32000, e.message); }
    }
    if (m.method === 'ping') return ok(m.id, {});
    if (m.id != null) return err(m.id, -32601, 'method not found: ' + m.method);
  }
  process.stderr.write('[defoneos-sign] up · key ' + FINGERPRINT + ' · verify ' + VERIFY_URL + '\n');
}

module.exports = { signArtifact, signSystemCard, signOscal, verifyReceipt, callTool, getChainStatus, PUB_RAW_HEX, FINGERPRINT, TOOLS };
if (require.main === module) main();
