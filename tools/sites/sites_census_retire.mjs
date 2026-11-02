#!/usr/bin/env node
// sites_census_retire.mjs — retire catalogue rows whose site_id no longer exists, by APPENDING
// a retirement to the row. It never deletes, and it never guesses.
//
// WHY THIS EXISTS (2026-11-02). The census re-keyed its rows: a surface used to be identified
// by its host alias (`compute:rp-3090-now`, `edge:this-mac`) and is now identified by its ROLE
// (`compute:runpod-main-engine`, `edge:owner-workstation`). The role is the better key — the
// alias `rp-3090-now` points at a pod that no longer exists, while the role survives pod
// replacement — but the re-key orphaned every row written before it.
//
// The result was a catalogue that was MIXED: 34 rows at one as_of and 16 at another, for the
// same 50 surfaces, because the publisher upserts by site_id and never deletes ("absence from
// one run is not evidence of absence"). Those 16 rows were not stale observations of dead
// surfaces; they were the same surfaces under their previous keys.
//
// So this script retires them properly: the row keeps its original observation, gains
// `state: RETIRED`, `superseded_by` (the current key for the same surface), `retired_at` and
// `retired_reason`, and stays in the base as dated evidence of what the surface was and when
// its key changed.
//
// FAIL CLOSED. A row whose old key is not in MIGRATION (below) is NOT retired. It is reported
// as UNMAPPED and left exactly as it is. A surface that appears in no current census run may
// simply be absent from this run; that is not evidence that it is gone, and it is not this
// script's call.
//
// Usage:
//   node tools/sites/sites_census_retire.mjs \
//     --census evidence/sites-census/sites_census.json \
//     --base bsemvq82v196c7yylx \
//     --origin http://127.0.0.1:15430 \
//     [--dry-run]

import { readFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const arg = (k, d = null) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const CENSUS = arg('census', 'evidence/sites-census/sites_census.json');
const BASE = arg('base', 'bsemvq82v196c7yylx');
const ORIGIN = arg('origin', 'http://127.0.0.1:15430');
const DRY = argv.includes('--dry-run');

// MIGRATION — dated, explicit, one row per key that changed.
// source: sites_census.mjs SSH_HOSTS (host -> role). Read from the census source on
// 2026-11-02; the two named hosts are in the same order there as the rows they replace.
const MIGRATION = {
  'compute:m2': 'compute:owner-lan-workstation',
  'edge:this-mac': 'edge:owner-workstation',
  'compute:rp-3090-now': 'compute:runpod-main-engine',
  'compute:meok-backend': 'compute:runpod-meok-backend',
  'compute:oracle-micro-2': 'compute:oracle-micro-control',
  'compute:sov-brain-2': 'compute:sovereign-node-brain-2',
  'compute:redblue-pod': 'compute:sovereign-node-redblue',
  'compute:sovos-light-a100': 'compute:sovereign-node-light-a100',
  'compute:sovos-agent-vm': 'compute:sovereign-node-agent-vm',
  'compute:csoai-backend-vm': 'compute:sovereign-node-csoai-backend',
  'compute:sovos-volume-sink': 'compute:sovereign-node-volume-sink',
  'compute:sov-r4090-a': 'compute:sovereign-node-r4090-a',
  'compute:sov-r4090-b': 'compute:sovereign-node-r4090-b',
  'compute:sov-r4090-c': 'compute:sovereign-node-r4090-c',
  'compute:0i7oa4ptfow4jj.runpod.io': 'compute:runpod-named-host-a',
  'compute:4gjzysaeqfy3j9.runpod.io': 'compute:runpod-named-host-b',
};

const census = JSON.parse(readFileSync(CENSUS, 'utf8'));
const currentIds = new Set((census.sites || []).map((s) => s.id));
const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

// The records API REJECTS a limit above 100 (it answers with an error object, not a short
// page), and pages with ?cursor= when it has more than the page size. Ask for 100 and walk
// the cursor, or a big base silently reads as an empty one.
async function fetchAllRecords(baseId) {
  const all = [];
  let cursor = null;
  for (let page = 0; page < 200; page++) {
    const url = new URL(`${ORIGIN}/api/v1/records`);
    url.searchParams.set('baseId', baseId);
    url.searchParams.set('limit', '100');
    if (cursor) url.searchParams.set('cursor', cursor);
    const body = await fetch(url).then((r) => r.json());
    if (body.error) throw new Error(`records read failed: ${body.error}`);
    all.push(...(body.records || []));
    cursor = body.nextCursor || null;
    if (!cursor) break;
  }
  return all;
}

const rows = await fetchAllRecords(BASE);

const retire = [];
const unmapped = [];
const already = [];

for (const rec of rows) {
  const p = rec.headCommit?.payload || {};
  const sid = p.site_id;
  if (!sid) continue;
  if (currentIds.has(sid)) continue;                 // a live surface: nothing to do
  // A row already retired WITH its metadata is done. A row that is retired but MISSING the
  // metadata is repaired here: the base has a fixed field schema, and an update that carries
  // a field the schema does not have is silently dropped — so the first retirement pass set
  // `state` and lost `superseded_by`. Repairing is idempotent and appends what was missing.
  const alreadyRetired = p.state === 'RETIRED' && p.superseded_by;
  if (alreadyRetired) { already.push(sid); continue; }
  const target = MIGRATION[sid];
  if (!target) { unmapped.push({ site_id: sid, as_of: p.as_of, state: p.state }); continue; }
  if (!currentIds.has(target)) {
    unmapped.push({ site_id: sid, as_of: p.as_of, state: p.state, why: 'target not in current census' });
    continue;
  }
  retire.push({
    recordId: rec.id,
    fields: {
      ...p,
      state: 'RETIRED',
      superseded_by: target,
      retired_at: now,
      retired_reason:
        'The census re-keyed this surface from its host alias to its role. Same surface, '
        + 'current key is the role. The original observation is kept in this row and in the '
        + 'base history.',
    },
  });
}

const out = {
  as_of: now,
  base: BASE,
  census_as_of: census.as_of,
  rows_seen: rows.length,
  current_site_ids: currentIds.size,
  to_retire: retire.length,
  already_retired: already.length,
  unmapped: unmapped.length,
  dry_run: DRY,
  unmapped_rows: unmapped,
  retired: retire.map((r) => ({ recordId: r.recordId, site_id: r.fields.site_id, superseded_by: r.fields.superseded_by })),
  errors: [],
};

if (!DRY && retire.length) {
  const res = await fetch(`${ORIGIN}/api/v1/bases/${BASE}/records/bulk-update-change-request`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      updates: retire.map((r) => ({ recordId: r.recordId, fields: r.fields })),
      message: `Sites census retirement ${now} — retire ${retire.length} rows re-keyed to role ids`,
      submittedBy: 'sites-census-retire',
      autoMerge: true,
    }),
  });
  const j = await res.json().catch(() => ({}));
  out.status = j.status ?? 'unknown';
  if (j.error) out.errors.push(String(j.error));
}

console.log(JSON.stringify(out, null, 2));
if (out.unmapped) {
  console.log('\nUNMAPPED rows were left untouched: their old key is not in the migration table.');
}
if (out.status && out.status !== 'merged') console.log('\nNot merged yet — a human must approve.');
