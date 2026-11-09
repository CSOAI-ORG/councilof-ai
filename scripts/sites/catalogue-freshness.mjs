#!/usr/bin/env node
// catalogue-freshness.mjs — is the Busabase catalogue carrying the CURRENT observation, or an
// older one?
//
// WHY (2026-10-30). The N-site presence catalogue is a UPSERT: every publish rewrites each
// surface's row with the newest observation. If a publish fails part-way, the catalogue is
// left holding a MIX of observations — some rows from today's run, some from last week's — and
// nothing says so. That is exactly the failure the hunt's own staleness gate was written to
// catch, and the catalogue needed the same gate.
//
// It happened here, for a reason worth naming: the pod's RunPod network volume began losing
// every write, so four of five publish chunks failed with "Input validation failed" — a
// validation-shaped symptom of a filesystem that cannot persist the change. 1,203 rows held
// the 29 Oct observation and the rest held the 28 Oct one, with no indication in the catalogue
// that any of it was old.
//
// So: read every row's as_of, group them, and FAIL LOUDLY when they disagree.
//
// Usage:
//   node scripts/sites/catalogue-freshness.mjs [--base <id>] [--origin <url>] [--json]
//
// Exit: 0 = every row carries the newest observation; 1 = the catalogue is mixed or stale;
//       2 = the probe could not reach the catalogue (which is itself a finding).

import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const BASE = arg('base', 'bsemvrjypvy7jsct5i');
const ORIGIN = arg('origin', 'http://127.0.0.1:15430');
const AS_JSON = argv.includes('--json');

function get(url, timeout = 30) {
  const t0 = Date.now();
  try {
    const out = execFileSync('/usr/bin/curl', ['-s', '-m', String(timeout), url],
      { encoding: 'utf8', maxBuffer: 1 << 28, timeout: (timeout + 5) * 1000 });
    return { ok: true, body: out, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, body: '', ms: Date.now() - t0, error: String(e.message || e).slice(0, 160) };
  }
}

const tally = new Map();
let total = 0;
let cursor = '';
let pages = 0;
let unreachable = null;

while (true) {
  const url = `${ORIGIN}/api/v1/records?baseId=${BASE}&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
  const r = get(url);
  if (!r.ok) { unreachable = r.error || `http failed after ${r.ms}ms`; break; }
  let j;
  try { j = JSON.parse(r.body); } catch (e) { unreachable = 'unreadable body'; break; }
  pages += 1;
  for (const rec of j.records || []) {
    if (rec.status && rec.status !== 'active') continue;
    const asOf = rec.headCommit?.payload?.as_of || 'NO_AS_OF';
    tally.set(asOf, (tally.get(asOf) || 0) + 1);
    total += 1;
  }
  cursor = j.nextCursor || '';
  if (!cursor) break;
}

if (unreachable) {
  const msg = `catalogue UNREACHABLE at ${ORIGIN} (base ${BASE}): ${unreachable}`;
  if (AS_JSON) console.log(JSON.stringify({ state: 'UNREACHABLE', base: BASE, origin: ORIGIN, error: unreachable }, null, 2));
  else console.error(msg);
  process.exit(2);
}

const generations = [...tally.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
const newest = generations[0]?.[0] ?? null;
const stale = generations.filter(([asOf]) => asOf !== newest);
const mixed = generations.length > 1;
// An EMPTY catalogue is not a fresh catalogue. It usually means the base id belongs to the
// other store (the estate has two), and reading it from the wrong one returns nothing rather
// than an error - which would otherwise read as "everything is current".
const empty = total === 0;

const report = {
  state: empty ? 'EMPTY' : mixed ? 'MIXED' : 'CURRENT',
  base: BASE,
  rows: total,
  generations: generations.map(([as_of, rows]) => ({ as_of, rows })),
  newest_generation: newest,
  stale_rows: stale.reduce((a, [, n]) => a + n, 0),
  pages,
};

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`catalogue ${report.state}  base=${BASE}  rows=${total}  generations=${generations.length}`);
  for (const g of report.generations) {
    console.log(`  ${g.as_of}  ${g.rows} rows${g.as_of === newest ? '  (newest)' : '  <-- STALE'}`);
  }
  if (empty) {
    console.error(`\nThe base ${BASE} has NO rows in the store at ${ORIGIN}. Either the catalogue is empty,`);
    console.error('or that base lives in the other Busabase store — the estate runs two (15429 and 15430).');
  } else if (mixed) {
    console.error(`\nThe catalogue is MIXED: ${report.stale_rows} of ${total} rows hold an older observation than ${newest}.`);
    console.error('A publish failed part-way. Re-run the publisher once the store can persist writes.');
  }
}
process.exit(empty ? 1 : mixed ? 1 : 0);
