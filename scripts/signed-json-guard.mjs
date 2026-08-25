#!/usr/bin/env node
/**
 * signed-json-guard — fail closed unless card_index is:
 *   - honest-150 (exact 34171B), OR
 *   - verified-335 (sha256 12f5122df916c1f165281e6453d8673ffc52992513e218c62f354337091d8ccb)
 * Rejects stubs, path-pointers, truncated boards, and any other 335.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const HONEST_150_BYTES = 34171;
const VERIFIED_335_SHA =
  '12f5122df916c1f165281e6453d8673ffc52992513e218c62f354337091d8ccb';
const STUB_MARKERS = [
  '__LOAD_FROM__',
  'PLACEHOLDER_WILL_REPLACE',
  'LOAD_FROM__',
  'LOAD_FROM_FILE',
  '__CURSOR_LOAD__',
  '__FULL_CONTENT_FROM_',
  '$load:',
  '@file:',
  '@file://',
  'file://',
  'data:application',
  'test data uri',
];

const root = process.argv[2] ? resolve(process.argv[2]) : resolve('public/signed');
const target = resolve(root, 'card_index.json');

if (!existsSync(target)) {
  console.error(`signed-json-guard: missing ${target}`);
  process.exit(1);
}

const buf = readFileSync(target);
const text = buf.toString('utf8');
for (const m of STUB_MARKERS) {
  if (text.includes(m)) {
    console.error(`signed-json-guard: stub marker ${JSON.stringify(m)} in card_index.json`);
    process.exit(1);
  }
}

let json;
try {
  json = JSON.parse(text);
} catch (e) {
  console.error(`signed-json-guard: invalid JSON: ${e.message}`);
  process.exit(1);
}

const n = json.n_cards;
const cards = Array.isArray(json.cards) ? json.cards : [];
const sha = createHash('sha256').update(buf).digest('hex');
const isHonest150 = n === 150 && cards.length === 150 && buf.length === HONEST_150_BYTES;
const isVerified335 = n === 335 && cards.length === 335 && sha === VERIFIED_335_SHA;

if (!isHonest150 && !isVerified335) {
  console.error(
    `signed-json-guard: REJECT n=${n} len=${cards.length} bytes=${buf.length} sha=${sha.slice(0, 16)}… ` +
      `(need honest-150 ${HONEST_150_BYTES}B OR verified-335 ${VERIFIED_335_SHA.slice(0, 16)}…)`
  );
  process.exit(1);
}

console.log(
  `signed-json-guard: OK ${isVerified335 ? 'verified-335' : 'honest-150'} n=${n} bytes=${buf.length} sha=${sha.slice(0, 16)}…`
);
