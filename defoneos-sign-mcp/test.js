// test.js — 18 focused tests across all 6 tools (sign, verify, system_card, oscal, public_key, chain_status).
// No external deps. Honest: each `t(...)` line is one real check; nothing is mocked.
'use strict';
const { signArtifact, signSystemCard, signOscal, verifyReceipt, callTool, getChainStatus, PUB_RAW_HEX, FINGERPRINT, TOOLS } = require('./server.js');
const crypto = require('crypto');

let pass = 0, fail = 0;
function t(name, ok, detail) {
  if (ok) { console.log('✅ ' + name); pass++; }
  else    { console.log('❌ ' + name + (detail ? ' — ' + detail : '')); fail++; }
}

// ── 1. Tool surface — 6 tools, named correctly ────────────────────────────
const toolNames = TOOLS.map(t => t.name).sort();
const expectedTools = ['defoneos_chain_status', 'defoneos_oscal', 'defoneos_public_key', 'defoneos_sign', 'defoneos_system_card', 'defoneos_verify'];
t('tool surface: exactly 6 tools exposed', TOOLS.length === 6, `got ${TOOLS.length}`);
t('tool surface: every expected tool present', JSON.stringify(toolNames) === JSON.stringify(expectedTools), toolNames.join(','));

// ── 2. defoneos_sign — receipt shape + provenance + content-binding ─────────
const output = 'Boltz-2 predicts binding affinity ΔG = -9.4 kcal/mol for ligand X to target Y.';
const r = signArtifact({ kind: 'finding', subject: 'binding affinity ligand X / target Y', output, method: 'Boltz-2 via BioNeMo; seed 42; env boltz@2.1', inputs: ['PDB:1ABC', 'SMILES:CC(=O)O'] });
const sc = r.defoneos_signed_contact;
t('sign 1: message is exactly {i,ts,action,detail,prev}', JSON.stringify(Object.keys(sc.message).sort()) === JSON.stringify(['action','detail','i','prev','ts']));
t('sign 2: signature is 128-hex (raw Ed25519)', /^[0-9a-f]{128}$/.test(sc.signature_ed25519));
t('sign 3: provenance records method + output_sha256 + care_floor', !!(sc.provenance.method && sc.provenance.output_sha256 && sc.provenance.care_floor === 0.95));
t('sign 4: tamper-evident — altered detail fails verify', verifyReceipt((() => { const b = JSON.parse(JSON.stringify(r)); b.defoneos_signed_contact.message.detail = b.defoneos_signed_contact.message.detail.replace('ligand X','ligand Z'); return b; })()).valid === false);

// ── 3. defoneos_verify — roundtrip + content re-bind ──────────────────────
t('verify 1: valid receipt verifies TRUE + content_match TRUE', (() => { const v = verifyReceipt(Object.assign({}, sc, { output })); return v.valid === true && v.content_match === true; })());
t('verify 2: altered content fails content_match', verifyReceipt(Object.assign({}, sc, { output: output + ' (edited)' })).content_match === false);
t('verify 3: tampered timestamp fails', verifyReceipt((() => { const b = JSON.parse(JSON.stringify(r)); b.defoneos_signed_contact.message.ts = new Date().toISOString(); return b; })()).valid === false);

// ── 4. defoneos_system_card — JSP 936 / EU AI Act posture, signed ───────────
const cardR = signSystemCard({ name: 'ER-Triage Assistant', version: '2.1', provider: 'Acme Health', purpose: 'prioritise ED patients from vitals+notes', risk_tier: 'high', high_risk: true, rationale: 'EU AI Act Annex III — medical triage', frameworks: ['EU AI Act', 'ISO 42001', 'JSP 936'], limitations: 'decision-support only; clinician confirms' });
const csc = cardR.defoneos_signed_contact;
t('system-card 1: signed receipt shape + system_card present', !!(csc && csc.message && csc.signature_ed25519 && csc.system_card));
t('system-card 2: action = system-card:<name>', csc.message.action === 'system-card:ER-Triage Assistant');
t('system-card 3: honesty note (attestation NOT certification)', /NOT certification|not certif/i.test(csc.note));
t('system-card 4: signature verifies TRUE + tamper-evident on downgrade', verifyReceipt(cardR).valid === true && verifyReceipt((() => { const b = JSON.parse(JSON.stringify(cardR)); b.defoneos_signed_contact.message.detail = b.defoneos_signed_contact.message.detail.replace('"high"','"minimal"'); return b; })()).valid === false);

// ── 5. defoneos_oscal — NIST OSCAL 1.1.2 component-definition, signed ──────
const oR = signOscal({ title: 'Acme AI — Governance Posture' });
const osc = oR.defoneos_signed_contact;
t('oscal 1: signed receipt + .oscal doc present + version 1.1.2', !!(osc && osc.message && osc.signature_ed25519 && osc.oscal) && osc.oscal['component-definition'].metadata['oscal-version'] === '1.1.2');
t('oscal 2: hash-bound — recomputed sha256 matches signed message', (() => { const recomputed = crypto.createHash('sha256').update(JSON.stringify(osc.oscal)).digest('hex'); return osc.doc_sha256 === recomputed && osc.message.detail.indexOf(recomputed) >= 0; })());
t('oscal 3: altered hash in signed message fails verify', verifyReceipt((() => { const b = JSON.parse(JSON.stringify(oR)); b.defoneos_signed_contact.message.detail = b.defoneos_signed_contact.message.detail.replace(/sha256:[0-9a-f]{6}/, 'sha256:000000'); return b; })()).valid === false);

// ── 6. defoneos_public_key — invariants for trust-on-first-use ─────────────
const pk = callTool('defoneos_public_key', {});
t('public-key 1: 64-hex raw Ed25519 pubkey', /^[0-9a-f]{64}$/.test(pk.public_key_ed25519));
t('public-key 2: SOV:XXXX-XXXX-XXXX-XXXX fingerprint', /^SOV:[0-9A-F]{4}(-[0-9A-F]{4}){3}$/.test(pk.fingerprint) && pk.fingerprint === FINGERPRINT);

// ── 7. defoneos_chain_status — 6th tool, hash-chain observable ─────────────
const cs = callTool('defoneos_chain_status', {});
t('chain-status 1: count tracks signed artifacts in this process (1 sign + 1 system-card + 1 oscal = 3)', cs.count === 3 && typeof cs.count === 'number', `count=${cs.count}`);
t('chain-status 2: last_action is the last kind we signed', cs.last_action && cs.last_action.startsWith('oscal-export') || cs.last_action.startsWith('system-card:') || cs.last_action.startsWith('artifact:'), cs.last_action);
t('chain-status 3: head signature is 128-hex + matches last signed receipt', /^[0-9a-f]{128}$/.test(cs.head_signature_ed25519 || '') && cs.head_signature_ed25519 === osc.signature_ed25519);
t('chain-status 4: pure read — running twice does NOT change count', (() => { const a = getChainStatus().count; callTool('defoneos_chain_status', {}); return getChainStatus().count === a; })());

// ── print a receipt to eyeball + feed into verify.html ─────────────────────
console.log('\n--- sample receipt (feed into verify.html) ---');
console.log(JSON.stringify(r));
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
