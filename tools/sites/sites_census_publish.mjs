#!/usr/bin/env node
// sites_census_publish.mjs — publish the sites census into Busabase, the estate's storage substrate.
//
// Busabase is the single substrate: every row of the catalogue is a record in the `sites` base,
// so a site is addressable by other lanes (hives, the runpod engine check, the nsite puller)
// without a second file to keep in step.
//
// The census JSON is the source of truth for what was read. This script only moves it; it never
// invents a row, and it never edits a row that already exists (it updates in place).
//
// Usage:
//   node tools/sites/sites_census_publish.mjs \
//     --census evidence/sites-census/sites_census.json \
//     --base bsemvq82v196c7yylx \
//     --origin http://127.0.0.1:15430

import { readFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const arg = (k, d = null) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const CENSUS = arg('census', 'evidence/sites-census/sites_census.json');
const BASE = arg('base', 'bsemvq82v196c7yylx');
const ORIGIN = arg('origin', 'http://127.0.0.1:15430');

const census = JSON.parse(readFileSync(CENSUS, 'utf8'));

function toRecord(s) {
  const r = {
    title: s.name || s.id,
    site_id: s.id,
    class: s.class,
    state: s.state,
    endpoint: s.endpoint || '',
    probe: s.probe || '',
    as_of: census.as_of,
  };
  if (s.cpu_model) r.cpu_model = s.cpu_model;
  if (s.cpu_cores) r.cpu_cores = s.cpu_cores;
  if (s.ram_gib) r.ram_gib = s.ram_gib;
  if (s.gpu) r.gpu = s.gpu;
  if (s.population != null) r.population = s.population;

  const lines = [];
  if (s.cpu_quota_limited) {
    lines.push(`**CPU quota limited**: ${s.cpu_cores} usable of ${s.cpu_host_cores} host threads.`);
  }
  if (s.class === 'n_site') {
    lines.push(`**Lane ${s.state}** — this is the state of the N-site hunt, not a per-site result.`);
    lines.push(`- done: ${s.population ?? '—'}  joined: ${s.joined ?? '—'}  listed: ${s.listed ?? '—'}`);
    lines.push(`- queue remaining: ${s.queue_remaining ?? '—'}  log age: ${s.log_age_hours ?? '—'}h`);
    lines.push(`- Layer O registry rows: ${s.registry_rows ?? '—'}  evidence bundles: ${s.evidence_bundles ?? '—'}`);
  }
  if (s.detail) lines.push(String(s.detail));
  r.detail = lines.join('\n\n');
  return r;
}

const records = census.sites.map(toRecord);

// ---- upsert, not blind create -------------------------------------------------
// The catalogue is re-published on every census run. Re-creating would duplicate every row, so
// existing rows are located by site_id and updated in place; only genuinely new sites are
// created. A site that disappears from the census is NOT deleted here: absence from one run is
// not evidence of absence, and the row keeps its last observation with its own as_of.
const base = await fetch(`${ORIGIN}/api/v1/records?baseId=${BASE}&limit=100`).then((r) => r.json());
const existing = new Map();
for (const rec of base.records || []) {
  // field values live in headCommit.payload, not on a `fields` object
  const sid = rec.headCommit?.payload?.site_id;
  if (sid) existing.set(sid, rec.id);
}

const updates = [];
const creates = [];
for (const rec of records) {
  const id = existing.get(rec.site_id);
  if (id) updates.push({ recordId: id, fields: rec });
  else creates.push(rec);
}

const out = { as_of: census.as_of, updated: 0, created: 0, pending: 0, errors: [] };

if (updates.length) {
  const res = await fetch(`${ORIGIN}/api/v1/bases/${BASE}/records/bulk-update-change-request`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      updates,
      message: `Sites census ${census.as_of} — update ${updates.length} rows`,
      submittedBy: 'sites-census-publish',
      autoMerge: true,
    }),
  });
  const j = await res.json().catch(() => ({}));
  out.updated = updates.length;
  out.updateStatus = j.status ?? 'unknown';
  if (j.status && j.status !== 'merged') out.pending += 1;
  if (j.error) out.errors.push(String(j.error));
}

if (creates.length) {
  const res = await fetch(`${ORIGIN}/api/v1/bases/${BASE}/records/bulk-change-request`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      records: creates,
      message: `Sites census ${census.as_of} — create ${creates.length} new rows`,
      submittedBy: 'sites-census-publish',
      autoMerge: true,
      idempotencyKey: `sites-census-${census.as_of}`,
    }),
  });
  const j = await res.json().catch(() => ({}));
  out.created = creates.length;
  out.createStatus = j.status ?? 'unknown';
  if (j.status && j.status !== 'merged') out.pending += 1;
  if (j.error) out.errors.push(String(j.error));
}

console.log(JSON.stringify(out, null, 2));
if (out.pending) console.log('\nSome changes are PENDING REVIEW, not merged — a human must approve them.');
