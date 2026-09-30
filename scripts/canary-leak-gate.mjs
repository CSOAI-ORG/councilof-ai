#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// canary-leak-gate — fail if any PRIVATE canary token appears in a public surface.
// Apache-2.0.
//
// The private canaries (harness/instrument-guard) live only in the private calibration store.
// This gate never holds them. It holds the published leak-scan digests from the signed bank
// commitments record — sha256("csoai-canary-leakscan/v1:" + lower(token)) for every canary GUID
// and code phrase — extracts every token of those two shapes from the scanned tree, hashes each
// the same way, and fails on any match. A hit prints the file and the DIGEST, never the token.
//
// Usage:
//   node scripts/canary-leak-gate.mjs [--record <commitments.json>]... [dir ...]   (default dir: public;
//   default records: every public/interop/instrument-guard/bank-commitments-*.json)
//   node scripts/canary-leak-gate.mjs --selftest
// Exit: 0 clean · 1 leak found · 2 UNCHECKABLE (no/invalid record — an unread list is not a clean scan)
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const DOMAIN = 'csoai-canary-leakscan/v1:';
const UUID4 = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
const CODE = /\b[A-Z2-7]{4}-[A-Z2-7]{4}-[A-Z2-7]{4}\b/gi;
const RECORD_DIR = 'public/interop/instrument-guard';
const RECORD_RE = /^bank-commitments-.*\.json$/;
// Every commitments record ever published is read: an old epoch's canaries stay secret forever.
const defaultRecords = () => existsSync(RECORD_DIR)
  ? readdirSync(RECORD_DIR).filter((f) => RECORD_RE.test(f) && !f.endsWith('.signed.json')).map((f) => join(RECORD_DIR, f))
  : [];
const SKIP_DIRS = new Set(['node_modules', '.git']);
const MAX_BYTES = 64 * 1024 * 1024;

export const digest = (tok) => createHash('sha256').update(DOMAIN + tok.trim().toLowerCase(), 'utf8').digest('hex');

export function loadDigests(recordPaths) {
  const paths = [].concat(recordPaths);
  if (!paths.length) return { error: `no commitments record (looked in ${RECORD_DIR})` };
  const set = new Set();
  let expected = 0;
  for (const recordPath of paths) {
  if (!existsSync(recordPath)) return { error: `no commitments record at ${recordPath}` };
  let rec;
  try { rec = JSON.parse(readFileSync(recordPath, 'utf8')); } catch (e) { return { error: `unreadable record ${basename(recordPath)}: ${e.message}` }; }
  for (const b of rec.banks || []) {
    const cs = b.canary_set;
    if (!cs) continue;
    expected += 2 * (cs.k || 0);
    for (const d of cs.leakscan_digests || []) if (/^[0-9a-f]{64}$/.test(d)) set.add(d);
  }
  }
  if (expected === 0) return { error: 'record lists no canary sets: nothing to scan for would make this gate vacuous' };
  if (set.size !== expected) return { error: `record lists ${set.size} leak-scan digests, expected ${expected} (2 per canary)` };
  return { set, records: paths };
}

export function scanText(text, set) {
  const hits = [];
  for (const rx of [UUID4, CODE]) {
    rx.lastIndex = 0;
    for (const m of text.matchAll(rx)) { const d = digest(m[0]); if (set.has(d)) hits.push(d); }
  }
  return hits;
}

function* walk(p) {
  let st; try { st = statSync(p); } catch { return; }
  if (st.isDirectory()) {
    for (const e of readdirSync(p)) if (!SKIP_DIRS.has(e)) yield* walk(join(p, e));
  } else if (st.isFile() && st.size <= MAX_BYTES) yield p;
}

export function scanPaths(paths, set) {
  const found = []; let files = 0;
  for (const root of paths) for (const f of walk(root)) {
    files++;
    const hits = scanText(readFileSync(f, 'latin1'), set);
    if (hits.length) found.push({ file: f, digests: [...new Set(hits)] });
  }
  return { files, found };
}

function selftest() {
  // Proves the gate can fail and can pass. Uses throwaway tokens minted here, never real canaries.
  const guid = '3f2c9a1e-7b4d-4c2a-9e8f-0a1b2c3d4e5f';
  const code = 'QX7M-4KD2-ZP3A';
  const set = new Set([digest(guid), digest(code)]);
  const cases = [
    ['guid leaked in JSON', `{"note":"ref ${guid}"}`, 1],
    ['code phrase leaked, lower-cased', `phrase ${code.toLowerCase()} here`, 1],
    ['guid upper-cased still caught', guid.toUpperCase(), 1],
    ['unrelated uuid4 not flagged', '{"id":"0e6f1c52-2b1a-4d3e-8f00-112233445566"}', 0],
    ['public GSPC canary marker not flagged', '{"_canary":"GSPC-CANARY-GUID gov-csoai-2026"}', 0],
    ['a digest of a canary is not a leak', `{"d":"${digest(guid)}"}`, 0],
  ];
  let bad = 0;
  for (const [name, text, want] of cases) {
    const got = scanText(text, set).length ? 1 : 0;
    const ok = got === want; bad += ok ? 0 : 1;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  }
  const vac = (() => { const r = loadDigests('/nonexistent/record.json'); return r.error ? 1 : 0; })();
  console.log(`${vac ? 'ok  ' : 'FAIL'} missing record is UNCHECKABLE, not clean`); bad += vac ? 0 : 1;
  console.log(bad ? `selftest FAILED (${bad})` : 'selftest ok');
  return bad ? 1 : 0;
}

function main(argv) {
  if (argv.includes('--selftest')) return selftest();
  const records = []; const dirs = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--record') records.push(argv[++i]); else dirs.push(argv[i]);
  }
  if (!dirs.length) dirs.push('public');
  const d = loadDigests(records.length ? records : defaultRecords());
  if (d.error) { console.error(`canary-leak-gate UNCHECKABLE: ${d.error}`); return 2; }
  const { files, found } = scanPaths(dirs, d.set);
  if (found.length) {
    console.error(`canary-leak-gate FAIL: private canary token(s) in ${found.length} public file(s)`);
    for (const f of found.slice(0, 20)) console.error(`  FILE ${f.file}  DIGEST ${f.digests.join(',')}`);
    console.error('  Remove the file content, rotate the affected bank (docs/operations/INSTRUMENT-GUARD-POLICY.md §4).');
    return 1;
  }
  console.log(`canary-leak-gate OK: ${files} files scanned, ${d.set.size} canary digests from ${d.records.length} record(s), 0 leaks`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
