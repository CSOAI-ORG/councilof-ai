import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { inspectExport, compareExports, verifySavedReport, LIMITS } from './reader.mjs';
import { CATALOG_EXAMPLE_TEXT as C, DISCLOSURE_EXAMPLE_TEXT as D } from './examples.mjs';

const encode = value => typeof value === 'string' ? value : JSON.stringify(value);
const mutated = (text, change) => { const x = JSON.parse(text); change(x); return JSON.stringify(x); };
const dc = change => mutated(D, d => change(d.disclosure_export));
const cc = change => mutated(C, c => change(c.catalog_export));
const state = (report, id) => report.checks.find(c => c.id === id).state;
const refused = async (text, code) => {
  const r = await inspectExport(text);
  assert.equal(r.report.accepted_for_reading, false);
  assert.equal(r.document, null);
  assert.equal(r.report.findings.at(-1).code, code);
  assert.deepEqual(r.report.permissions, { execute: false, submit: false, publish: false });
  return r.report;
};
const nextDisclosure = () => {
  const d = JSON.parse(D);
  Object.assign(d.disclosure_export, { version: 3, latest_version: 3, version_id: 'aaaaaaaa-bbbb-4ccc-8ddd-000000000003', purpose: 'Changed synthetic scope' });
  d.disclosure_export.approval.id = 'cccccccc-dddd-4eee-8fff-000000000010';
  return JSON.stringify(d);
};

test('exact upstream synthetic catalog is readable, with declared results separated', async () => {
  const { report, document } = await inspectExport(C);
  assert.equal(report.accepted_for_reading, true);
  assert.equal(report.counts.entries, 2);
  assert.equal(report.counts.versions, 3);
  assert.equal(report.counts.declared_pass, 1);
  assert.equal(state(report, 'schema'), 'CHECKED');
  assert.equal(state(report, 'effect'), 'NOT_OBSERVED');
  assert.equal(state(report, 'freshness'), 'UNCONFIRMED');
  assert.equal(document.catalog_export.entries[0].status, 'superseded');
});
test('disclosure approves no authority and cannot recompute the package even with matching digests', async () => {
  const { report } = await inspectExport(D);
  assert.equal(report.accepted_for_reading, true);
  assert.equal(state(report, 'package_integrity'), 'NOT_PROVIDED');
  assert.equal(state(report, 'producer_identity'), 'NOT_AUTHENTICATED');
  assert.equal(state(report, 'human_authority'), 'NOT_ESTABLISHED');
  assert.equal(report.counts.withheld_items, 1);
  assert.ok(report.findings.some(f => f.code === 'WITHHELD_NOT_ASSESSED'));
  assert.ok(!JSON.stringify(report).includes('VALID'));
});
test('raw-byte digest agrees with independent Node hashing and input is not mutated', async () => {
  const bytes = new TextEncoder().encode(D); const before = Uint8Array.from(bytes);
  const { report } = await inspectExport(bytes);
  assert.equal(report.input.sha256, createHash('sha256').update(bytes).digest('hex'));
  assert.deepEqual(bytes, before);
  assert.notEqual(report.input.sha256, JSON.parse(D).disclosure_export.digest);
});
test('fully visible export still cannot recompute omitted canonical package fields', async () => {
  const { report } = await inspectExport(dc(d => { d.items = d.items.filter(i => !i.withheld); d.withheld_count = 0; }));
  assert.equal(report.accepted_for_reading, true);
  assert.equal(state(report, 'package_integrity'), 'NOT_PROVIDED');
});
test('unknown version is refused before later schema contents are interpreted', async () => {
  await refused('{"catalog_export_schema_version":"99.0.0","catalog_export":{"unexpected":"PRIVATE"}}', 'UNSUPPORTED_VERSION');
});
test('both document discriminators are refused', async () => {
  await refused(mutated(C, x => { x.disclosure_export_schema_version = '0.1.0'; }), 'UNKNOWN_DOCUMENT');
});
test('missing discriminator is refused', async () => { await refused('{}', 'UNKNOWN_DOCUMENT'); });
test('unknown top-level fields refuse without echoing names or values', async () => {
  const report = await refused(mutated(C, x => { x.PRIVATE_PERSON_EMAIL = 'secret@example.test'; }), 'SCHEMA_MISMATCH');
  assert.ok(!JSON.stringify(report).includes('PRIVATE_PERSON_EMAIL'));
  assert.ok(!JSON.stringify(report).includes('secret@example.test'));
});
test('unknown nested field is refused', async () => { await refused(dc(d => { d.approval.signature = 'invented'; }), 'SCHEMA_MISMATCH'); });
test('missing required approval is refused', async () => { await refused(dc(d => { delete d.approval; }), 'SCHEMA_MISMATCH'); });
test('invalid UUID is refused, UUIDs are not restricted to version 4', async () => {
  await refused(dc(d => { d.approval.id = 'not-a-uuid'; }), 'SCHEMA_MISMATCH');
  const { report } = await inspectExport(dc(d => { d.approval.id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'; }));
  assert.equal(report.accepted_for_reading, true);
});
test('duplicate decoded object members, including escaped spelling, refuse', async () => {
  await refused('{"catalog_export_schema_version":"0.1.0","catalog_export_schema_version":"0.1.0"}', 'DUPLICATE_MEMBER');
  await refused('{"a":1,"\\u0061":2}', 'DUPLICATE_MEMBER');
});
test('prototype-bearing JSON keys refuse and do not alter prototypes', async () => {
  await refused('{"__proto__":{"polluted":true}}', 'UNSAFE_MEMBER');
  assert.equal({}.polluted, undefined);
});
test('duplicate catalog IDs are compared case-insensitively', async () => {
  await refused(cc(c => { const copy = structuredClone(c.entries[0]); copy.id = copy.id.toUpperCase(); c.entries.push(copy); }), 'DUPLICATE_ENTRY_ID');
});
test('catalog history must agree with current version and status', async () => {
  await refused(cc(c => { c.entries[0].version = 3; }), 'HISTORY_INCONSISTENT');
  await refused(cc(c => { c.entries[0].status = 'active'; }), 'HISTORY_INCONSISTENT');
});
test('catalog history order, gap and repeated create are refused', async () => {
  await refused(cc(c => { c.entries[0].versions.reverse(); }), 'HISTORY_INCONSISTENT');
  await refused(cc(c => { c.entries[0].versions[1].version = 3; c.entries[0].version = 3; }), 'HISTORY_INCONSISTENT');
  await refused(cc(c => { c.entries[0].versions[1].operation = 'create'; }), 'HISTORY_INCONSISTENT');
});
test('catalog transition reason and replacement relationships are checked', async () => {
  await refused(cc(c => { c.entries[0].versions[1].reason = null; }), 'TRANSITION_INCONSISTENT');
  await refused(cc(c => { c.entries[0].versions[1].replacement_entry_id = c.entries[0].id; }), 'TRANSITION_INCONSISTENT');
  await refused(cc(c => { c.entries[1].versions[0].replacement_entry_id = c.entries[0].id; }), 'TRANSITION_INCONSISTENT');
});
test('source-declared inconclusive stays distinct from pass and fail', async () => {
  const { report } = await inspectExport(cc(c => { c.entries[0].versions[0].verification.result = 'inconclusive'; }));
  assert.equal(report.accepted_for_reading, true);
  assert.equal(report.counts.declared_inconclusive, 1);
  assert.equal(report.counts.declared_pass, 0);
  assert.equal(report.counts.declared_fail, 0);
});
test('schema lengths count Unicode code points, not UTF-16 units', async () => {
  const { report } = await inspectExport(cc(c => { c.entries[1].versions[0].title = '🌍'.repeat(200); }));
  assert.equal(report.accepted_for_reading, true);
  await refused(cc(c => { c.entries[1].versions[0].title = '🌍'.repeat(201); }), 'SCHEMA_MISMATCH');
});
test('false calendar dates and leap seconds refuse', async () => {
  await refused(dc(d => { d.approval.approved_at = '2026-02-30T10:00:00Z'; }), 'INVALID_TIMESTAMP');
  await refused(dc(d => { d.approval.approved_at = '2026-11-02T10:00:60Z'; }), 'INVALID_TIMESTAMP');
});
test('wall-clock reversal requires review without pretending clocks establish causal order', async () => {
  const { report } = await inspectExport(cc(c => { c.entries[0].versions[1].created_at = '2026-10-01T10:00:00Z'; }));
  assert.equal(report.accepted_for_reading, true);
  assert.ok(report.findings.some(f => f.code === 'TIMESTAMP_ORDER_ANOMALY'));
});
test('producer operation/status and terminal history relationships must agree', async () => {
  await refused(cc(c => { c.entries[1].status = 'withdrawn'; c.entries[1].versions[0].status = 'withdrawn'; }), 'TRANSITION_INCONSISTENT');
  await refused(cc(c => {
    const e = c.entries[0], v = structuredClone(e.versions[0]);
    Object.assign(v, { version: 3, operation: 'version', created_at: '2026-11-04T10:00:00Z' });
    e.versions.push(v); e.version = 3; e.status = 'active';
  }), 'TRANSITION_INCONSISTENT');
});
test('valid leap date and offset timestamp are accepted without authenticating time', async () => {
  const { report } = await inspectExport(dc(d => { d.approval.approved_at = '2024-02-29T10:20:30.123+01:00'; }));
  assert.equal(report.accepted_for_reading, true);
  assert.equal(state(report, 'freshness'), 'UNCONFIRMED');
});
test('disclosure status/version contradictions refuse', async () => {
  await refused(dc(d => { d.latest_version = 3; }), 'VERSION_INCONSISTENT');
  await refused(dc(d => { d.status = 'superseded'; }), 'VERSION_INCONSISTENT');
});
test('superseded disclosure is readable historical evidence, never current permission', async () => {
  const { report } = await inspectExport(dc(d => { d.status = 'superseded'; d.latest_version = 3; }));
  assert.equal(report.accepted_for_reading, true);
  assert.equal(state(report, 'freshness'), 'SUPERSEDED_AS_DECLARED');
  assert.deepEqual(report.permissions, { execute: false, submit: false, publish: false });
});
test('approval digest disagreement refuses; equality alone is not authentication', async () => {
  await refused(dc(d => { d.approval.digest = '0'.repeat(64); }), 'APPROVAL_DIGEST_MISMATCH');
});
test('withheld placeholder cannot smuggle extra evidence or a fabricated count', async () => {
  await refused(dc(d => { d.items[1].evidence_id = d.items[0].evidence_id; }), 'SCHEMA_MISMATCH');
  await refused(dc(d => { d.withheld_count = 0; }), 'WITHHELD_COUNT_MISMATCH');
});
test('visible derivative and manifest IDs cannot repeat', async () => {
  await refused(dc(d => { d.items.push({ ...d.items[0], evidence_id: d.items[0].evidence_id.toUpperCase() }); }), 'DUPLICATE_ITEM_ID');
  await refused(dc(d => { d.manifest.items.push(structuredClone(d.manifest.items[0])); }), 'DUPLICATE_MANIFEST_ID');
});
test('manifest must match visible item identities exactly', async () => {
  await refused(dc(d => { d.manifest.items = []; }), 'MANIFEST_ID_MISMATCH');
  await refused(dc(d => { d.manifest.items[0].evidence_id = '99999999-9999-4999-8999-999999999999'; }), 'MANIFEST_ID_MISMATCH');
});
test('invalid, overlapping and miscounted redaction ranges refuse', async () => {
  await refused(dc(d => { d.manifest.items[0].removed[0].lines = 2; }), 'RANGE_INCONSISTENT');
  await refused(dc(d => { d.manifest.items[0].removed[0].to_line = 5; }), 'RANGE_INCONSISTENT');
  await refused(dc(d => { d.manifest.items[0].removed.push({ from_line: 3, to_line: 4, lines: 2 }); d.manifest.items[0].removed_lines = 3; }), 'RANGE_INCONSISTENT');
  await refused(dc(d => { d.manifest.items[0].removed_lines = 2; }), 'RANGE_INCONSISTENT');
});
test('altered derivative checksum cannot be verified without the bytes', async () => {
  const { report } = await inspectExport(dc(d => { d.items[0].sha256_plaintext = 'f'.repeat(64); }));
  assert.equal(report.accepted_for_reading, true);
  assert.equal(state(report, 'package_integrity'), 'NOT_PROVIDED');
});
test('1 MiB, depth, node, and string budgets are enforced', async () => {
  await refused(new Uint8Array(LIMITS.bytes + 1), 'INPUT_TOO_LARGE');
  await refused('['.repeat(50) + '0' + ']'.repeat(50), 'RESOURCE_LIMIT');
  await refused('[' + Array(50_001).fill('0').join(',') + ']', 'RESOURCE_LIMIT');
  await refused('"' + 'a'.repeat(LIMITS.string + 1) + '"', 'RESOURCE_LIMIT');
});
test('invalid UTF-8 and BOM refuse', async () => {
  await refused(new Uint8Array([0xc3, 0x28]), 'INVALID_UTF8');
  await refused(new Uint8Array([0xef, 0xbb, 0xbf, 0x7b, 0x7d]), 'BOM_UNSUPPORTED');
});
test('invalid JSON, trailing documents and isolated surrogate refuse', async () => {
  for (const text of ['{}{}', '{"x":}', '[1,]', 'true false', '"\\ud800"']) await refused(text, 'INVALID_JSON');
});
test('literal unpaired UTF-16 surrogates are rejected before lossy string encoding', async () => {
  await refused(D.replace('text/plain', 'text/\ud800plain'), 'INVALID_UTF8');
  await refused(D.replace('text/plain', 'text/\udc00plain'), 'INVALID_UTF8');
});
test('unsafe numeric coercion is refused', async () => {
  await refused('9007199254740993', 'UNSAFE_NUMBER');
  await refused('1e999', 'UNSAFE_NUMBER');
});
test('fraction rounding and exponent underflow cannot become accepted schema integers', async () => {
  for (const token of ['58.00000000000000001', '1e-999', '0.99999999999999999999', '-1e-999']) {
    await refused(D.replace('"size_bytes": 58', `"size_bytes": ${token}`), 'UNSAFE_NUMBER');
  }
});
test('mathematically exact decimal and exponent integer forms remain supported', async () => {
  for (const token of ['58.0', '5.8e1', '580e-1', '0.00058e5', '58e+0']) {
    const { report } = await inspectExport(D.replace('"size_bytes": 58', `"size_bytes": ${token}`));
    assert.equal(report.accepted_for_reading, true, token);
  }
});
test('reports omit attacker-controlled content and identifiers, even with valid source data', async () => {
  const secret = 'PRIVATE-SENTINEL-recipient@example.test';
  const { report } = await inspectExport(dc(d => { d.recipient = secret; d.purpose = '<img src=x onerror=alert(1)>'; }));
  const output = JSON.stringify(report);
  assert.equal(report.accepted_for_reading, true);
  for (const text of [secret, '<img', JSON.parse(D).disclosure_export.case_id, JSON.parse(D).disclosure_export.approval.approved_by]) assert.ok(!output.includes(text));
});
test('reader uses no fetch', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('unexpected network'); };
  try { assert.equal((await inspectExport(D)).report.accepted_for_reading, true); }
  finally { globalThis.fetch = old; }
});
test('same bytes and representation-only changes do not renew authority', async () => {
  const exact = await compareExports(D, D);
  assert.equal(exact.relationship, 'IDENTICAL_BYTES');
  assert.equal(exact.decision, 'NO_DOCUMENT_CHANGE');
  const compact = await compareExports(D, JSON.stringify(JSON.parse(D)));
  assert.equal(compact.relationship, 'REPRESENTATION_CHANGED');
  assert.notEqual(compact.previous_sha256, compact.current_sha256);
  assert.deepEqual(compact.permissions, { execute: false, submit: false, publish: false });
});
test('new disclosure requires reassessment and identifies changed scope without leaking it', async () => {
  const result = await compareExports(D, nextDisclosure());
  assert.equal(result.decision, 'REASSESSMENT_REQUIRED');
  assert.ok(result.changes.includes('NEW_VERSION'));
  assert.ok(result.changes.includes('PURPOSE_CHANGED'));
  assert.ok(!JSON.stringify(result).includes('Changed synthetic scope'));
});
test('same-version altered content is a conflict', async () => {
  const result = await compareExports(D, dc(d => { d.recipient = 'someone else'; }));
  assert.equal(result.decision, 'CONFLICT');
  assert.ok(result.changes.includes('SAME_VERSION_CONTENT_CHANGED'));
});
test('same-version caller visibility change requires reassessment without inventing immutable change', async () => {
  const result = await compareExports(D, dc(d => {
    d.items[0] = { withheld: true }; d.withheld_count++;
    d.manifest.items = [];
  }));
  assert.equal(result.decision, 'REASSESSMENT_REQUIRED');
  assert.ok(result.changes.includes('EVIDENCE_PROJECTION_CHANGED'));
  assert.deepEqual(result.permissions, { execute: false, submit: false, publish: false });
});
test('same-version changed jointly visible evidence and changed total count conflict', async () => {
  const altered = await compareExports(D, dc(d => { d.items[0].sha256_plaintext = 'f'.repeat(64); }));
  assert.equal(altered.decision, 'CONFLICT');
  const missing = await compareExports(D, dc(d => { d.items.pop(); d.withheld_count--; }));
  assert.equal(missing.decision, 'CONFLICT');
});
test('new visible identities need prior withheld capacity, never invent matching hidden evidence', async () => {
  const visibleOnly = dc(d => { d.items.pop(); d.withheld_count = 0; });
  const changedIdentity = mutated(visibleOnly, x => {
    x.disclosure_export.items[0].evidence_id = '99999999-9999-4999-8999-999999999999';
    x.disclosure_export.manifest.items[0].evidence_id = x.disclosure_export.items[0].evidence_id;
  });
  assert.equal((await compareExports(visibleOnly, changedIdentity)).decision, 'CONFLICT');
  const newlyVisible = dc(d => {
    d.items[1] = { ...d.items[0], evidence_id: '99999999-9999-4999-8999-999999999999' };
    d.manifest.items.push({ ...d.manifest.items[0], evidence_id: d.items[1].evidence_id });
    d.withheld_count = 0;
  });
  const comparison = await compareExports(D, newlyVisible);
  assert.equal(comparison.decision, 'REASSESSMENT_REQUIRED');
  assert.ok(comparison.limits.some(x => x.includes('Omitted evidence remains unknown')));
});
test('same-version supersession metadata is historical change rather than fresh approval', async () => {
  const result = await compareExports(D, dc(d => { d.status = 'superseded'; d.latest_version = 3; }));
  assert.equal(result.decision, 'REASSESSMENT_REQUIRED');
  assert.ok(result.changes.includes('PREVIOUSLY_CURRENT_NOW_HISTORICAL'));
});
test('rollback and reuse of approval identity for a newer version are conflicts', async () => {
  assert.equal((await compareExports(nextDisclosure(), D)).decision, 'CONFLICT');
  const reused = mutated(nextDisclosure(), x => { x.disclosure_export.approval.id = JSON.parse(D).disclosure_export.approval.id; });
  assert.ok((await compareExports(D, reused)).changes.includes('VERSION_OR_APPROVAL_ID_REUSED'));
});
test('different case/package and different types are unrelated', async () => {
  const other = dc(d => { d.case_id = '99999999-9999-4999-8999-999999999999'; });
  assert.equal((await compareExports(D, other)).decision, 'UNRELATED');
  assert.equal((await compareExports(C, D)).decision, 'UNRELATED');
});
test('malformed input cannot be compared', async () => { assert.equal((await compareExports(D, '{}')).decision, 'NOT_COMPARABLE'); });
test('rewritten catalog history conflicts', async () => {
  const after = cc(c => { c.entries[0].versions[0].body = 'Changed historical claim'; });
  assert.equal((await compareExports(C, after)).decision, 'CONFLICT');
});
test('new catalog history requires reassessment', async () => {
  const after = cc(c => {
    const e = c.entries[1]; const v = structuredClone(e.versions[0]);
    Object.assign(v, { version: 2, operation: 'version', created_at: '2026-11-03T09:30:00Z', body: 'Changed recommendation' });
    e.versions.push(v); e.version = 2;
  });
  const result = await compareExports(C, after);
  assert.equal(result.decision, 'REASSESSMENT_REQUIRED');
  assert.ok(result.changes.includes('HISTORY_APPENDED'));
});
test('missing catalog entry is not silently treated as withdrawn or resolved', async () => {
  const result = await compareExports(C, cc(c => { c.entries.pop(); }));
  assert.equal(result.decision, 'REASSESSMENT_REQUIRED');
  assert.ok(result.changes.includes('ENTRY_NO_LONGER_EXPORTED'));
});
test('diagnostic save/reopen requires the original and detects edited conclusions', async () => {
  const { report } = await inspectExport(D); const saved = JSON.stringify(report);
  assert.equal((await verifySavedReport(D, saved)).matches, true);
  report.checks.find(c => c.id === 'human_authority').state = 'AUTHORISED';
  assert.equal((await verifySavedReport(D, JSON.stringify(report))).matches, false);
  assert.equal((await verifySavedReport(D + '\n', saved)).matches, false);
  assert.equal((await verifySavedReport(D, '{}')).matches, false);
  assert.equal((await verifySavedReport(D, '{"x":1,"x":1}')).matches, false);
});
test('pinned schema module matches retained upstream schema JSON', async () => {
  const { CATALOG_SCHEMA, DISCLOSURE_SCHEMA, SCHEMA_HASHES } = await import('./schemas.mjs');
  for (const [name, schema] of [['catalog', CATALOG_SCHEMA], ['disclosure', DISCLOSURE_SCHEMA]]) {
    const bytes = await readFile(new URL(`./vendor/schemas/${name}-export.v0.json`, import.meta.url));
    assert.deepEqual(schema, JSON.parse(bytes));
    assert.equal(SCHEMA_HASHES[name], createHash('sha256').update(bytes).digest('hex'));
  }
});
test('an import consumer cannot relax a pinned rule while the diagnostic keeps its old schema hash', async () => {
  const { CATALOG_SCHEMA } = await import('./schemas.mjs');
  const titleRule = CATALOG_SCHEMA.$defs.version.properties.title;
  const originalMaximum = titleRule.maxLength;
  const input = cc(c => { c.entries[1].versions[0].title = 'x'.repeat(201); });
  const before = await inspectExport(input);
  let changed, after;
  try {
    changed = Reflect.set(titleRule, 'maxLength', 201);
    after = await inspectExport(input);
  } finally {
    // Also leaves the dependency unchanged when this regression runs against
    // the vulnerable implementation as a negative control.
    if (changed) Reflect.set(titleRule, 'maxLength', originalMaximum);
  }
  assert.equal(before.report.accepted_for_reading, false);
  assert.equal(after.report.accepted_for_reading, false, 'dependency mutation must not turn a refused export into an accepted one');
  assert.equal(changed, false, 'nested schema rule must refuse mutation');
  assert.equal(after.report.reader.schema_sha256, before.report.reader.schema_sha256);
  assert.equal(after.report.findings.at(-1).code, 'SCHEMA_MISMATCH');
});
test('schemas and hash metadata are deeply immutable before any reader import', () => {
  const schemaURL = new URL('./schemas.mjs', import.meta.url).href;
  const script = `
    import assert from 'node:assert/strict';
    const { CATALOG_SCHEMA, DISCLOSURE_SCHEMA, SCHEMA_HASHES } = await import(${JSON.stringify(schemaURL)});
    function check(value) {
      if (value === null || typeof value !== 'object') return;
      assert.equal(Object.isFrozen(value), true);
      for (const child of Object.values(value)) check(child);
    }
    for (const value of [CATALOG_SCHEMA, DISCLOSURE_SCHEMA, SCHEMA_HASHES]) check(value);
    assert.throws(() => CATALOG_SCHEMA.$defs.status.enum.push('invented'), TypeError);
    assert.equal(Reflect.set(SCHEMA_HASHES, 'catalog', '0'.repeat(64)), false);
    assert.equal(Reflect.deleteProperty(DISCLOSURE_SCHEMA.$defs.export, 'required'), false);
    assert.equal(Reflect.setPrototypeOf(CATALOG_SCHEMA, {}), false);
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
});
test('CLI reads only bounded files and communicates refusal through exit status', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'safe-companion-test-'));
  const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
  const good = join(dir, 'input.json'), bad = join(dir, 'bad.json');
  try {
    await writeFile(good, D); await writeFile(bad, '{}');
    const passed = spawnSync(process.execPath, [cli, 'inspect', good], { encoding: 'utf8' });
    assert.equal(passed.status, 0, passed.stderr);
    assert.equal(JSON.parse(passed.stdout).accepted_for_reading, true);
    const failed = spawnSync(process.execPath, [cli, 'inspect', bad], { encoding: 'utf8' });
    assert.equal(failed.status, 2);
    const missing = spawnSync(process.execPath, [cli, 'inspect', join(dir, 'private-name.json')], { encoding: 'utf8' });
    assert.equal(missing.status, 1);
    assert.ok(!missing.stderr.includes('private-name'));
    assert.equal((await readFile(good, 'utf8')), D);
    const directory = spawnSync(process.execPath, [cli, 'inspect', dir], { encoding: 'utf8', timeout: 2_000 });
    assert.equal(directory.status, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('CLI refuses a FIFO without blocking or reading it', { skip: process.platform === 'win32' }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'safe-companion-fifo-'));
  const fifo = join(dir, 'selected-pipe');
  const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
  try {
    const made = spawnSync('mkfifo', [fifo], { encoding: 'utf8' });
    assert.equal(made.status, 0);
    const result = spawnSync(process.execPath, [cli, 'inspect', fifo], { encoding: 'utf8', timeout: 2_000 });
    assert.equal(result.status, 1);
    assert.equal(result.error, undefined);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
