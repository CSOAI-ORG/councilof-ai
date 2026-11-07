#!/usr/bin/env node
/**
 * Daily regulatory-clock projection. This is a source join, never a legal or
 * measurement assessment. No network, signing, model calls or paid delivery.
 *
 * node scripts/build-daily-signal.mjs --as-of 2026-11-04 [--check]
 *   [--board snapshot.json] [--crosswalk crosswalk.json] [--mappings mapping.json]
 *
 * A reviewed mapping declaration must bind event_sha256 (eventKey below), the
 * exact crosswalk file SHA-256, framework_id (or framework_sha256 for legacy
 * rows without IDs) and explicit provision_ids. Missing
 * declarations stay UNMAPPED; matching an instrument name is insufficient.
 * No stamped file may be overwritten. Outputs use the existing daily-signal
 * report schema; they are not evidence-fabric process events or signed cards.
 */
import { createHash } from 'node:crypto';
import { projectMaintenanceMetadata, readMetadataSourceBytes } from './daily-maintenance-metadata.mjs';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function ordered(value) {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, ordered(value[k])]));
  return value;
}
// Deterministic JSON for this report, not a claim to implement RFC 8785.
export const encode = value => JSON.stringify(ordered(value), null, 1) + '\n';
export const eventKey = event => sha256(encode(event));
const present = x => typeof x === 'string' && x.trim().length > 0;
const hex = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
function day(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) throw new Error(`${label}: expected YYYY-MM-DD`);
  const ms = Date.parse(value + 'T00:00:00Z');
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== value) throw new Error(`${label}: invalid date`);
  return ms;
}
function catalogState(board, axis) {
  if (board === null) return 'SOURCE_ABSENT';
  if (Array.isArray(board.cells)) {
    const cells = board.cells.filter(c => c.axis === axis || c.axis === `gspc-${axis}`);
    if (cells.some(c => present(c.card) || (c.card && typeof c.card === 'object'))) return 'CARD_REFERENCE_PRESENT';
    return cells.length ? 'NO_CARD_REFERENCE' : 'AXIS_NOT_LISTED';
  }
  const raw = board[axis];
  if (raw === 'MEASURED') return 'REPORTED_MEASURED';
  if (raw === 'UNMEASURED') return 'REPORTED_UNMEASURED';
  return raw === undefined ? 'AXIS_NOT_LISTED' : 'UNRECOGNISED_STATE';
}

export function buildDailySignal({clock, crosswalk = null, board = null, claims = null,
  mappings = null, asOf, horizon = 90, generatedFrom = {}}) {
  const today = day(asOf, 'as-of');
  if (!Number.isInteger(horizon) || horizon < 0 || horizon > 3660) throw new Error('horizon: expected integer 0..3660');
  if (!clock || !Array.isArray(clock.events)) throw new Error('clock.events must be an array');
  if (crosswalk !== null && !Array.isArray(crosswalk.frameworks)) throw new Error('crosswalk.frameworks must be an array');
  if (board !== null && (typeof board !== 'object' || Array.isArray(board))) throw new Error('board must be an object');
  if (mappings !== null && !Array.isArray(mappings.mappings)) throw new Error('mappings.mappings must be an array');

  const declarations = new Map();
  for (const m of mappings?.mappings ?? []) {
    if (!hex(m.event_sha256)) throw new Error('mapping event_sha256 must be 64 lowercase hex');
    if (declarations.has(m.event_sha256)) throw new Error('duplicate event mapping');
    declarations.set(m.event_sha256, m);
  }
  const signals = [], invalidEvents = [], excludedEvents = [];
  const seen = new Set();
  for (const [sourceIndex, ev] of clock.events.entries()) {
    if (!ev || typeof ev !== 'object' || Array.isArray(ev)) {
      invalidEvents.push({source_index: sourceIndex, reason: 'event must be an object'}); continue;
    }
    const key = eventKey(ev);
    if (seen.has(key)) throw new Error(`duplicate clock event ${key}`);
    seen.add(key);
    let deadline;
    try { deadline = day(ev.date, 'clock event date'); }
    catch (e) { invalidEvents.push({event_sha256: key, source_index: sourceIndex, date: ev.date ?? null, reason: e.message}); continue; }
    const daysUntil = (deadline - today) / 86400000;
    if (daysUntil < 0 || daysUntil > horizon) {
      excludedEvents.push({event_sha256: key, source_index: sourceIndex, date: ev.date, reason: daysUntil < 0 ? 'BEFORE_WINDOW' : 'AFTER_WINDOW'}); continue;
    }
    let mappingState = 'UNMAPPED', reason = 'No reviewed event-to-provision mapping declaration';
    let framework = null, provisions = [], declaration = null;
    const m = declarations.get(key);
    if (m) {
      if (m.status !== 'REVIEWED' || !present(m.reviewer) || !present(m.review_ref)) {
        mappingState = 'UNREVIEWED'; reason = 'Review declaration incomplete';
      } else if (!crosswalk || !hex(m.crosswalk_sha256) || m.crosswalk_sha256 !== generatedFrom.crosswalk?.sha256) {
        mappingState = 'STALE_OR_UNAVAILABLE'; reason = 'Exact crosswalk source digest does not match';
      } else {
        if (present(m.framework_id) === hex(m.framework_sha256)) throw new Error('mapping needs exactly one framework_id or framework_sha256');
        const matches = crosswalk.frameworks.filter(f => present(m.framework_id)
          ? present(f.id) && f.id === m.framework_id : sha256(encode(f)) === m.framework_sha256);
        if (matches.length !== 1) throw new Error('reviewed mapping framework_id is absent or ambiguous');
        const f = matches[0];
        if (!Array.isArray(m.provision_ids) || !m.provision_ids.length || new Set(m.provision_ids).size !== m.provision_ids.length) throw new Error('reviewed mapping needs unique explicit provision_ids');
        provisions = m.provision_ids.map(id => {
          const hits = (f.provisions ?? []).filter(p => present(p.id) && p.id === id);
          if (hits.length !== 1) throw new Error(`reviewed mapping provision ${id} is absent or ambiguous`);
          const p = hits[0];
          if (p.gspc_axes !== undefined && (!Array.isArray(p.gspc_axes) || p.gspc_axes.some(a => !present(a)))) throw new Error('provision axes must be nonempty strings');
          return {id: p.id, title: p.title ?? null, axes: [...new Set(p.gspc_axes ?? [])].sort()};
        }).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
        framework = {id: f.id ?? null, sha256: sha256(encode(f)), instrument: f.instrument ?? null, short_name: f.short_name ?? null, source_url: f.source_url ?? null};
        mappingState = 'REVIEWED_DECLARATION'; reason = 'Exact event and crosswalk bytes bound to explicit provisions';
        declaration = {reviewer: m.reviewer, review_ref: m.review_ref, identity_verified: false};
      }
    }
    const axes = [...new Set(provisions.flatMap(p => p.axes))].sort();
    signals.push({event_sha256: key, source_index: sourceIndex, date: ev.date, days_until: daysUntil,
      jurisdiction: ev.jur ?? null, instrument: ev.instrument ?? null, provision: ev.provision ?? null,
      binds: ev.binds ?? null, requires: ev.requires ?? null, confidence: ev.confidence ?? null,
      source_status: 'CLOCK_ASSERTION_NOT_REVALIDATED', mapping: {state: mappingState, reason, declaration},
      framework_matched: framework, mapped_provisions: provisions,
      gspc_axes: axes.map(axis => ({axis, catalog_state: catalogState(board, axis), evidence_assessment: 'NOT_ASSESSED'})),
      evidence_coverage: null,
      limitations: ['Mapping is not applicability or obligation satisfaction.', 'Board labels and card references are not verified measurement results.']});
  }
  const orphaned = [...declarations.keys()].filter(key => !seen.has(key)).sort();
  const unmapped = signals.filter(s => s.mapping.state !== 'REVIEWED_DECLARATION').map(s => ({event_sha256: s.event_sha256, date: s.date, instrument: s.instrument, reason: s.mapping.reason}));
  return {schema: 'csoai.daily-signal/0.1', as_of: asOf, horizon_days: horizon, generated_from: generatedFrom,
    maintenance_metadata: projectMaintenanceMetadata({board, claims, generatedFrom, asOf}),
    headline: {clock_events: clock.events.length, events_in_horizon: signals.length, mapped_events: signals.length - unmapped.length, unmapped_events: unmapped.length, invalid_events: invalidEvents.length, excluded_events: excludedEvents.length},
    signals: signals.sort((a, b) => a.days_until - b.days_until || (a.event_sha256 < b.event_sha256 ? -1 : a.event_sha256 > b.event_sha256 ? 1 : 0)),
    unmapped, invalid_events: invalidEvents, excluded_events: excludedEvents, orphaned_mapping_event_ids: orphaned,
    corrections: {register_state: claims === null ? 'ABSENT' : 'PRESENT', register_as_of: claims?.as_of ?? null,
      subjects_listed: Array.isArray(claims?.subjects) ? claims.subjects.length : null, delta_state: 'NOT_COMPUTED'},
    limitations: ['Only this clock snapshot and stated time window are covered; not a global regulatory census.',
      'Dates, legal assertions and review identities have not been independently validated by this builder.',
      'No legal conclusion, signing, payment, delivery or execution authority is established.']};
}

export function main(argv = process.argv.slice(2), root = resolve(dirname(fileURLToPath(import.meta.url)), '..')) {
  const opts = {}, allowed = new Set(['as-of', 'horizon', 'board', 'crosswalk', 'mappings']);
  let check = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--check') { check = true; continue; }
    const name = argv[i].replace(/^--/, '');
    if (!argv[i].startsWith('--') || !allowed.has(name) || !argv[i + 1] || argv[i + 1].startsWith('--') || name in opts) throw new Error(`invalid or repeated option ${argv[i]}`);
    opts[name] = argv[++i];
  }
  if (!opts['as-of']) throw new Error('--as-of YYYY-MM-DD is required for reproducible output');
  day(opts['as-of'], 'as-of');
  const generatedFrom = {};
  const read = (role, file, required = false) => {
    if (!file || !existsSync(file)) {
      if (required) throw new Error(`${role}: file missing: ${file}`);
      generatedFrom[role] = {path: file ? relative(root, file) : null, sha256: null, state: 'ABSENT'}; return null;
    }
    const bytes = ['board','claims'].includes(role) ? readMetadataSourceBytes(file) : readFileSync(file);
    generatedFrom[role] = {path: relative(root, file), sha256: sha256(bytes), state: 'READ'};
    return JSON.parse(bytes.toString('utf8'));
  };
  const cwDir = join(root, 'tui3-crosswalk');
  const cwFiles = existsSync(cwDir) ? readdirSync(cwDir).filter(f => /^regulatory-crosswalk-.*\.json$/.test(f)).sort() : [];
  const cwPath = opts.crosswalk ? resolve(root, opts.crosswalk) : cwFiles.length ? join(cwDir, cwFiles.at(-1)) : null;
  const input = {
    clock: read('clock', join(root, 'public/regulatory-clock.json'), true),
    crosswalk: read('crosswalk', cwPath, Boolean(opts.crosswalk)),
    board: read('board', resolve(root, opts.board ?? 'public/signed/card-matrix.json'), Boolean(opts.board)),
    mappings: read('mappings', opts.mappings ? resolve(root, opts.mappings) : null, Boolean(opts.mappings)),
    claims: read('claims', join(root, 'public/spec/claim-maintenance/register.json')),
    asOf: opts['as-of'], horizon: Number(opts.horizon ?? 90), generatedFrom,
  };
  const out = buildDailySignal(input), bytes = encode(out);
  const outDir = join(root, 'public/reports/daily-signal');
  const targets = [join(outDir, `${out.as_of}.json`), join(outDir, 'latest.json')];
  if (check) {
    if (!targets.every(p => existsSync(p) && readFileSync(p, 'utf8') === bytes)) throw new Error('committed daily signal differs from source projection');
  } else {
    // Preflight both files before any write. Existing timestamp proofs are immutable.
    if (targets.some(p => existsSync(`${p}.ots`))) throw new Error('refusing to overwrite stamped daily signal');
    if (existsSync(targets[0]) && readFileSync(targets[0], 'utf8') !== bytes) {
      throw new Error('refusing to rewrite a retained daily report; preserve it and record a reviewed correction');
    }
    mkdirSync(outDir, {recursive: true});
    for (const file of targets) writeFileSync(file, bytes);
  }
  return out;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const out = main();
    console.log(`daily-signal: ${out.as_of}, ${out.headline.events_in_horizon} clock events, ${out.headline.unmapped_events} unmapped; evidence not assessed`);
  } catch (e) { console.error(`daily-signal: ${e.message}`); process.exitCode = 1; }
}
