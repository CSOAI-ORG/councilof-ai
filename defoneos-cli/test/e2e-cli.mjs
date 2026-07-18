#!/usr/bin/env node
/**
 * Round-trip CLI test:
 *  1. init → fresh sovereign keypair
 *  2. sign-system → issue sovereign System Card
 *  3. verify → VALID against saved signature
 *  4. tamper → flip one byte of message → REJECTED
 *  5. sign-model → issue sovereign Model Card
 *  6. fingerprint of pubkey matches across both
 */
import { mkdtempSync, readFileSync, writeFileSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';

const tmp = mkdtempSync(join(tmpdir(), 'defoneos-'));
const kdir = join(tmp, 'keys');
const card = join(tmp, 'syscard.json');
process.env.DEFONEOS_KEY_DIR = kdir;

function run(args) {
  return execSync('node ' + args, { encoding: 'utf8', env: { ...process.env, DEFONEOS_KEY_DIR: kdir }});
}

let pass = 0, fail = 0;
function ok(name) { console.log('  ✓ ' + name); pass++; }
function bad(name, m) { console.log('  ✗ ' + name + ' — ' + m); fail++; }

try {
  console.log('='.repeat(60));
  console.log('  @defoneos/registry · CLI E2E');
  console.log('='.repeat(60));
  const initOut = run('./bin/defoneos.js init');
  if (!/public_key_hex/.test(initOut)) bad('init', 'no public_key_hex');
  else ok('init · keypair generated');
  // capture the public key
  const pubMatch = initOut.match(/public_key_hex\s*:\s*([0-9a-f]+)/);
  const fpMatch = initOut.match(/sovereign_fp16\s*:\s*([0-9a-f]+)/);
  if (!pubMatch) { bad('init', 'could not parse pubkey'); process.exit(2); }
  const pub = pubMatch[1]; const fp = fpMatch[1];

  // sign-system
  const sysOut = run(`./bin/defoneos.js sign-system --out ${card} --framework jsp936`);
  if (!/wrote/.test(sysOut)) bad('sign-system', sysOut.slice(0, 120));
  else ok('sign-system · signed jssp936');
  const env = JSON.parse(readFileSync(card, 'utf8'));
  if (env.signature.length !== 128) bad('sign', 'sig hex not 128 chars');
  else ok('signature 128 hex chars (Ed25519)');
  if (env.signer_fingerprint !== fp) bad('sign', 'fp mismatch');
  else ok('signer_fingerprint matches init output');
  if (env.card.framework !== 'jsp936') bad('sign', 'framework field wrong');
  else ok('card.framework === "jsp936"');

  // verify
  const v1 = run(`./bin/defoneos.js verify --card ${card} --signature ${env.signature} --pubkey ${pub}`);
  if (!/"valid": true/.test(v1)) bad('verify', v1.slice(0, 120));
  else ok('verify returns VALID');

  // tamper — flip the canonical at offset 50
  const env2 = JSON.parse(readFileSync(card, 'utf8'));
  const c = env2.canonical; const tc = c.slice(0, 50) + 'X' + c.slice(51);
  const tmpCard = join(tmp, 'tampered.json');
  writeFileSync(tmpCard, JSON.stringify({ ...env2, canonical: tc }));
  // verify the tampered canonical - this should FAIL because the sig covers original canonical
  let tamperExit = 1;
  let tamperOut = '';
  try { tamperOut = run(`./bin/defoneos.js verify --card ${tmpCard} --message '${tc}' --signature ${env2.signature} --pubkey ${pub}`); }
  catch (e) { tamperExit = e.status; tamperOut = String(e.stdout||''); }
  if (tamperExit !== 0) ok('tamper rejection (non-zero exit)');
  else bad('tamper', 'tampered card was accepted');

  // sign-model
  const mcard = join(tmp, 'modelcard.json');
  const mOut = run(`./bin/defoneos.js sign-model --out ${mcard} --framework neurips2025`);
  if (!/wrote/.test(mOut)) bad('sign-model', mOut.slice(0, 120));
  else ok('sign-model · signed neurips2025');
  const envM = JSON.parse(readFileSync(mcard, 'utf8'));
  if (envM.signer_fingerprint !== fp) bad('sign-model fp', 'mismatch');
  else ok('sign-model fingerprint matches');

  console.log('');
  console.log('SUMMARY: ' + pass + ' passed, ' + fail + ' failed');
  console.log('Exit code: ' + (fail === 0 ? 0 : 1));
  process.exit(fail === 0 ? 0 : 1);
} catch (err) {
  console.error('THREW:', err.message);
  process.exit(2);
}
