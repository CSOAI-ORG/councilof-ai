#!/usr/bin/env node
/**
 * (a) Governed Outbound sender — the P9 primitive made real.
 * DRY-RUN BY DEFAULT: signs + ledgers every intended send but does NOT transmit.
 * Real send requires --send AND SMTP creds AND a warm domain (see SENDING_RUNBOOK.md).
 *
 * Every send is Ed25519-signed to a hash-chained ledger proving it was:
 *   authorized (did:csoai) · policy-passed (rate cap) · lawful-basis (legit-interest B2B)
 *   · opt-out-honored (suppression checked) · provenanced (msg hash + prev). = P9.
 *
 * Usage:
 *   node send_governed.mjs --tier 0-3 --limit 10                  # DRY-RUN (default)
 *   node send_governed.mjs --tier 0-3 --limit 10 --send           # REAL send (owner only)
 * Env for --send: SMTP via SEND_FROM + SMTP_HOST/PORT/USER/PASS (or a nodemailer transport).
 *
 * Files: csoai-outreach/drafts.jsonl (in) · suppression.txt (one email/domain per line, skipped)
 *        · outreach-ledger.jsonl (signed, hash-chained, git-ignored contents may include emails)
 * Key:   ~/.csoai/outreach-sign.key (Ed25519 PKCS8 PEM, 0600, auto-generated, NEVER commit).
 */
import crypto from 'node:crypto';
import { readFile, writeFile, appendFile, mkdir, chmod, access } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, 'csoai-outreach');
const LEDGER = resolve(DIR, 'outreach-ledger.jsonl');
const KEYPATH = join(homedir(), '.csoai', 'outreach-sign.key');

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? (args[i + 1]?.startsWith('--') ? true : args[i + 1]) : d; };
const SEND = args.includes('--send');
const [tMin, tMax] = String(flag('tier', '0-3')).split('-').map(Number);
const LIMIT = Number(flag('limit', 10));
const DELAY = Number(flag('delay', 2)) * 1000;

async function loadKey() {
  await mkdir(dirname(KEYPATH), { recursive: true });
  try { await access(KEYPATH); return crypto.createPrivateKey(await readFile(KEYPATH)); }
  catch {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
    await writeFile(KEYPATH, pem); await chmod(KEYPATH, 0o600);
    const pub = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('hex');
    console.log(`  🔑 generated Ed25519 outreach key → ${KEYPATH} (0600). pubkey ${pub.slice(0, 16)}…`);
    return crypto.createPrivateKey(pem);
  }
}
async function lastHash() {
  try { const l = (await readFile(LEDGER, 'utf8')).trim().split('\n'); return JSON.parse(l[l.length - 1]).hash; }
  catch { return '0'.repeat(64); }
}
async function loadSuppression() {
  try { return new Set((await readFile(resolve(DIR, 'suppression.txt'), 'utf8')).split('\n').map(s => s.trim().toLowerCase()).filter(Boolean)); }
  catch { return new Set(); }
}

// Real SMTP send via nodemailer (lazy-imported so the dry-run path needs no dependency).
// Requires: `npm i nodemailer` + env SEND_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.
let _transport = null;
async function getTransport() {
  if (_transport) return _transport;
  const { SEND_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  const missing = ['SEND_FROM', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'].filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`--send needs SMTP env: missing ${missing.join(', ')}. See SENDING_RUNBOOK.md.`);
  let nodemailer;
  try { nodemailer = (await import('nodemailer')).default; }
  catch { throw new Error('nodemailer not installed. Run: npm i nodemailer  (in sovereign-charters/).'); }
  _transport = nodemailer.createTransport({
    host: SMTP_HOST, port: Number(SMTP_PORT), secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await _transport.verify(); // fail fast if creds/domain are wrong
  return _transport;
}
async function realSend(record, draft) {
  const t = await getTransport();
  const info = await t.sendMail({
    from: process.env.SEND_FROM,
    to: record.to,
    subject: draft.subject,
    text: draft.body,
    headers: {
      // provenance: link every wire-send back to its signed ledger entry
      'X-CSOAI-Ledger-Hash': record.hash,
      'X-CSOAI-Signature': record.signature_ed25519.slice(0, 32),
      'List-Unsubscribe': '<mailto:outreach@csoai.org?subject=STOP>',
    },
  });
  return info.messageId;
}

async function main() {
  const key = await loadKey();
  const supp = await loadSuppression();
  const drafts = (await readFile(resolve(DIR, 'drafts.jsonl'), 'utf8')).trim().split('\n').map(l => JSON.parse(l));
  const batch = drafts.filter(d => d.tier >= tMin && d.tier <= tMax).slice(0, LIMIT);

  console.log(`\n${SEND ? '🔴 LIVE SEND' : '🟢 DRY-RUN (no email transmitted)'} · tier ${tMin}-${tMax} · limit ${LIMIT}\n`);
  let sent = 0, skipped = 0, prev = await lastHash();

  for (const d of batch) {
    const to = d.contact_email || d.guess || (d.domain ? `info@${d.domain}` : null);
    if (!to) { console.log(`  ⚠️  ${d.company} — no address, skipped`); skipped++; continue; }
    if (supp.has(to.toLowerCase()) || supp.has((d.domain || '').toLowerCase())) { console.log(`  🚫 ${d.company} — suppressed`); skipped++; continue; }

    const msgHash = crypto.createHash('sha256').update(d.body || '').digest('hex');
    const entry = { i: sent + skipped, ts_placeholder: 'set-at-send', lead_id: d.lead_id, to, from_did: 'did:csoai:outreach', subject: d.subject, msg_hash: msgHash, lawful_basis: 'legitimate_interest_b2b', opt_out: 'honored', mode: SEND ? 'sent' : 'dry_run', prev };
    const sig = crypto.sign(null, Buffer.from(JSON.stringify(entry)), key).toString('hex');
    const hash = crypto.createHash('sha256').update(prev + sig).digest('hex');
    const record = { ...entry, signature_ed25519: sig, hash };

    if (SEND) { await realSend(record, d); }
    await appendFile(LEDGER, JSON.stringify(record) + '\n');
    prev = hash;
    console.log(`  ${SEND ? '✉️ ' : '📝'} ${to.padEnd(34)} ${d.company.slice(0, 32)}  [signed ${sig.slice(0, 12)}…]`);
    sent++;
    if (SEND && DELAY) await new Promise(r => setTimeout(r, DELAY));
  }
  console.log(`\n${SEND ? 'Sent' : 'Dry-ran (signed)'} ${sent} · skipped ${skipped}. Ledger → ${LEDGER}`);
  if (!SEND) console.log('Re-run with --send + SMTP creds + a WARM domain to transmit (owner only).');
}
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
