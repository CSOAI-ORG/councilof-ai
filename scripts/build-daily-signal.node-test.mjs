import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildDailySignal, encode, eventKey, main, sha256} from './build-daily-signal.mjs';

const event = {date: '2026-12-02', jur: 'EU', instrument: 'EU AI Act as amended', provision: 'Article 50(2)'};
const crosswalk = {frameworks: [{id: 'eu-ai-act', short_name: 'EU AI Act', provisions: [
  {id: 'art50', title: 'Marking', gspc_axes: ['marking']},
  {id: 'art54', title: 'Representative', gspc_axes: ['documentation']},
]}]};
const digest = sha256(encode(crosswalk));
const mapping = {event_sha256: eventKey(event), crosswalk_sha256: digest, framework_id: 'eu-ai-act', provision_ids: ['art50'], status: 'REVIEWED', reviewer: 'test-review-declaration', review_ref: 'fixture:review'};
const input = () => ({clock: {events: [structuredClone(event)]}, crosswalk: structuredClone(crosswalk),
  board: {marking: 'MEASURED', documentation: 'MEASURED'}, asOf: '2026-11-04',
  generatedFrom: {crosswalk: {path: 'fixture.json', sha256: digest}}});
const mapped = () => ({...input(), mappings: {mappings: [structuredClone(mapping)]}});

// A same-framework deadline must not inherit the other provisions' evidence.
test('exact reviewed provision mapping never fans out to whole framework', () => {
  const r = buildDailySignal(mapped());
  assert.deepEqual(r.signals[0].mapped_provisions.map(p => p.id), ['art50']);
  assert.deepEqual(r.signals[0].gspc_axes.map(a => a.axis), ['marking']);
  assert.equal(r.signals[0].gspc_axes[0].catalog_state, 'REPORTED_MEASURED');
  assert.equal(r.signals[0].gspc_axes[0].evidence_assessment, 'NOT_ASSESSED');
  assert.equal(r.signals[0].evidence_coverage, null);
  assert.equal(r.signals[0].mapping.declaration.identity_verified, false);
});
test('instrument substring and empty framework name cannot establish a mapping', () => {
  const a = input(); a.crosswalk.frameworks.unshift({id: 'blank', short_name: '', provisions: [{id: 'x', gspc_axes: ['wrong']}]});
  const r = buildDailySignal(a);
  assert.equal(r.headline.events_in_horizon, 1); assert.equal(r.headline.unmapped_events, 1);
  assert.equal(r.signals[0].mapping.state, 'UNMAPPED'); assert.deepEqual(r.signals[0].gspc_axes, []);
  assert.equal(r.signals[0].provision, event.provision);
});
test('changed crosswalk bytes invalidate mapping, even if names remain equal', () => {
  const a = mapped(); a.generatedFrom.crosswalk.sha256 = '0'.repeat(64);
  const r = buildDailySignal(a); assert.equal(r.signals[0].mapping.state, 'STALE_OR_UNAVAILABLE');
  assert.deepEqual(r.signals[0].gspc_axes, []);
});
test('changed event date requires a new exact mapping', () => {
  const a = mapped(); a.clock.events[0].date = '2026-12-03';
  const r = buildDailySignal(a); assert.equal(r.signals[0].mapping.state, 'UNMAPPED');
  assert.deepEqual(r.orphaned_mapping_event_ids, [mapping.event_sha256]);
});
test('pending declaration does not count as reviewed', () => {
  const a = mapped(); a.mappings.mappings[0].status = 'PROPOSED';
  assert.equal(buildDailySignal(a).signals[0].mapping.state, 'UNREVIEWED');
});
test('missing board is unknown, not unmeasured; card presence is not verification', () => {
  const a = mapped(); a.board = null;
  assert.equal(buildDailySignal(a).signals[0].gspc_axes[0].catalog_state, 'SOURCE_ABSENT');
  a.board = {cells: [{axis: 'gspc-marking', card: 'fixture:unsigned-or-unverified-card'}]};
  const r = buildDailySignal(a); assert.equal(r.signals[0].gspc_axes[0].catalog_state, 'CARD_REFERENCE_PRESENT');
  assert.equal(r.signals[0].evidence_coverage, null);
});
test('missing crosswalk preserves all event rows without evidence claims', () => {
  const a = mapped(); a.crosswalk = null;
  const r = buildDailySignal(a); assert.equal(r.headline.events_in_horizon, 1);
  assert.equal(r.signals[0].mapping.state, 'STALE_OR_UNAVAILABLE');
});
test('date parsing rejects rollover and ambiguous as-of input', () => {
  for (const asOf of ['2026-02-30', '2026-11-04T00:00:00Z', 'invalid', '../2026-11-04']) assert.throws(() => buildDailySignal({...input(), asOf}), /as-of/);
  for (const horizon of [-1, 1.5, NaN, 4000]) assert.throws(() => buildDailySignal({...input(), horizon}), /horizon/);
});
test('invalid and out-of-window dates remain accounted for', () => {
  const a = input(); a.clock.events.push({...event, date: '2026-02-30'}, {...event, date: '2026-10-01'}, {...event, date: '2027-12-01'});
  const r = buildDailySignal(a); assert.equal(r.headline.clock_events, 4);
  assert.equal(r.headline.events_in_horizon, 1); assert.equal(r.headline.invalid_events, 1); assert.equal(r.headline.excluded_events, 2);
  assert.equal(r.invalid_events[0].date, '2026-02-30');
});
test('duplicate or ambiguous records fail before output', () => {
  const a = mapped(); a.mappings.mappings.push(structuredClone(mapping));
  assert.throws(() => buildDailySignal(a), /duplicate event mapping/);
  const b = mapped(); b.crosswalk.frameworks.push(structuredClone(crosswalk.frameworks[0]));
  assert.throws(() => buildDailySignal(b), /ambiguous/);
  const c = mapped(); c.mappings.mappings[0].provision_ids = ['does-not-exist'];
  assert.throws(() => buildDailySignal(c), /absent or ambiguous/);
  const d = input(); d.clock.events.push(structuredClone(event)); assert.throws(() => buildDailySignal(d), /duplicate clock event/);
});
test('claims snapshot is not a corrections delta', () => {
  const a = input(); a.claims = {as_of: '2026-11-04', subjects: ['a', 'b']};
  const r = buildDailySignal(a); assert.equal(r.corrections.subjects_listed, 2); assert.equal(r.corrections.delta_state, 'NOT_COMPUTED');
});
test('determinism and input immutability', () => {
  const a = mapped(), before = encode(a);
  assert.equal(encode(buildDailySignal(a)), encode(buildDailySignal(a)));
  assert.equal(encode(a), before);
  assert.equal(eventKey({b: 2, a: 1}), eventKey({a: 1, b: 2}));
});
function fixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'daily-signal-'));
  mkdirSync(join(dir, 'public/signed'), {recursive: true});
  writeFileSync(join(dir, 'public/regulatory-clock.json'), encode({events: [event]}));
  writeFileSync(join(dir, 'public/signed/card-matrix.json'), encode({cells: [{axis: 'marking', card: 'fixture:default'}]}));
  try { fn(dir); } finally { rmSync(dir, {recursive: true, force: true}); }
}
test('CLI records exact custom board path and raw-byte digest, without default substitution', () => fixture(dir => {
  const bytes = '{ "marking": "UNMEASURED" }\n'; writeFileSync(join(dir, 'custom.json'), bytes);
  const out = main(['--as-of', '2026-11-04', '--board', 'custom.json'], dir);
  assert.equal(out.generated_from.board.path, 'custom.json'); assert.equal(out.generated_from.board.sha256, sha256(bytes));
  assert.equal(out.generated_from.crosswalk.state, 'ABSENT');
  assert.equal(main(['--as-of', '2026-11-04', '--board', 'custom.json', '--check'], dir).headline.events_in_horizon, 1);
}));
test('CLI explicit missing board fails closed and writes nothing', () => fixture(dir => {
  assert.throws(() => main(['--as-of', '2026-11-04', '--board', 'missing.json'], dir), /board: file missing/);
  assert.equal(existsSync(join(dir, 'public/reports/daily-signal/latest.json')), false);
}));
test('CLI requires reproducible date, validates flags and protects stamped files', () => fixture(dir => {
  assert.throws(() => main([], dir), /--as-of/);
  assert.throws(() => main(['--as-of'], dir), /invalid/);
  main(['--as-of', '2026-11-04'], dir);
  const file = join(dir, 'public/reports/daily-signal/2026-11-04.json'), before = readFileSync(file);
  writeFileSync(`${file}.ots`, 'fixture:proof');
  assert.throws(() => main(['--as-of', '2026-11-04'], dir), /stamped/);
  assert.deepEqual(readFileSync(file), before);
}));

test('legacy framework rows without IDs require an exact object digest selector', () => {
  const a = mapped(); delete a.crosswalk.frameworks[0].id;
  const m = a.mappings.mappings[0]; delete m.framework_id;
  m.framework_sha256 = sha256(encode(a.crosswalk.frameworks[0]));
  a.generatedFrom.crosswalk.sha256 = sha256(encode(a.crosswalk));
  m.crosswalk_sha256 = a.generatedFrom.crosswalk.sha256;
  const r = buildDailySignal(a);
  assert.equal(r.signals[0].mapping.state, 'REVIEWED_DECLARATION');
  assert.deepEqual(r.signals[0].mapped_provisions.map(p => p.id), ['art50']);
  assert.equal(r.signals[0].framework_matched.id, null);
  m.framework_sha256 = '0'.repeat(64);
  assert.throws(() => buildDailySignal(a), /absent or ambiguous/);
});

test('retained dated reports cannot be silently rewritten or move latest on conflict', () => fixture(dir => {
  main(['--as-of', '2026-11-04'], dir);
  const file = join(dir, 'public/reports/daily-signal/2026-11-04.json');
  const latest = join(dir, 'public/reports/daily-signal/latest.json');
  const before = readFileSync(file), latestBefore = readFileSync(latest);
  writeFileSync(join(dir, 'public/regulatory-clock.json'), encode({events: [{...event, date: '2026-12-03'}]}));
  assert.throws(() => main(['--as-of', '2026-11-04'], dir), /retained daily report/);
  assert.deepEqual(readFileSync(file), before);
  assert.deepEqual(readFileSync(latest), latestBefore);
}));
