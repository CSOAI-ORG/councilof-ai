import { afterAll as after, test } from 'vitest';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = mkdtempSync(join(tmpdir(), 'claim-partition-'));
after(() => rmSync(root, { recursive: true, force: true }));
for (const name of ['scripts/claim-maintenance-register.mjs', 'scripts/claims/maintenance-schedule-state.mjs',
  'public/interop/claim-maintenance/capture.json', 'public/interop/claim-maintenance/outcomes.jsonl',
  'public/spec/claim-maintenance/register.json']) {
  const dest = join(root, name); mkdirSync(dirname(dest), { recursive: true });
  cpSync(join(source, name), dest);
}
mkdirSync(join(root, 'public/claims'), { recursive: true });
for (const entry of readdirSync(join(source, 'public/claims'), { withFileTypes: true })) {
  if (entry.isFile() && (entry.name.endsWith('.json') || entry.name.endsWith('.json.ots'))) {
    cpSync(join(source, 'public/claims', entry.name), join(root, 'public/claims', entry.name));
  }
}
const output = join(root, 'public/spec/claim-maintenance/register.json');
const initial = readFileSync(output);
const pinnedLegacy = createHash('sha256').update(initial).digest('hex') ===
  'c5df622446f2fe164f8c47880e0fb8698d28080ae163fe4af1009865a67c6a80';
const run = (...args) => spawnSync(process.execPath, ['scripts/claim-maintenance-register.mjs', ...args],
  { cwd: root, encoding: 'utf8' });
const ok = (r) => assert.equal(r.status, 0, r.stderr || r.stdout);
const reject = (r) => assert.equal(r.status, 1, r.stderr || r.stdout);

test.skipIf(!pinnedLegacy)('exact pinned legacy snapshot still checks without rewriting', () => {
  ok(run('--check'));
  assert.deepEqual(readFileSync(output), initial);
});

test.skipIf(!pinnedLegacy)('a byte-altered legacy snapshot is not covered by the legacy pin', () => {
  try { writeFileSync(output, Buffer.concat([initial, Buffer.from(' ')])); reject(run('--check')); }
  finally { writeFileSync(output, initial); }
});

test.skipIf(!pinnedLegacy)('the legacy pin does not conceal changed registry inputs', () => {
  const path = join(root, 'public/claims/claimreg-ondo-chainlink-2026-09-22.json');
  const original = readFileSync(path);
  try { writeFileSync(path, Buffer.concat([original, Buffer.from(' ')])); reject(run('--check')); }
  finally { writeFileSync(path, original); }
});

test.skipIf(!pinnedLegacy)('historic reconstruction changes only two counters and its digest', () => {
  const old = JSON.parse(initial); const outputPath = join(root, 'rebuilt.json');
  ok(run('--as-of', old.as_of, '--out', outputPath));
  const generated = JSON.parse(readFileSync(outputPath));
  assert.equal(generated.totals.subjects_with_a_future_registry_named_read, 0);
  assert.equal(generated.totals.subjects_without_a_registry_named_read_schedule, 2);
  delete generated.totals.subjects_with_a_future_registry_named_read;
  delete generated.totals.subjects_without_a_registry_named_read_schedule;
  assert.notEqual(generated.register_digest, old.register_digest);
  delete generated.register_digest; delete old.register_digest;
  assert.deepEqual(generated, old);
  ok(run('--check', '--out', outputPath));
  const altered = JSON.parse(readFileSync(outputPath));
  altered.totals.subjects_without_a_registry_named_read_schedule = 99;
  writeFileSync(outputPath, JSON.stringify(altered));
  reject(run('--check', '--out', outputPath));
});

const fixture = join(root, 'synthetic-claims'); const checks = join(root, 'synthetic-checks');
mkdirSync(fixture); mkdirSync(checks);
const claim = (name, next) => ({ schema: 'csoai.claim-maintenance.artifact/0.2',
  claim_id: `${name}-1`, state: 'UNMEASURED',
  subject: { name, identifier: `${name.toLowerCase()}.example`, identifier_kind: 'domain' },
  source_url: `https://${name.toLowerCase()}.example/`, access_date: '2026-09-25T05:00:00Z',
  first_captured_utc: '2026-09-23T04:00:00Z', ...(next ? { next_read_utc: next } : {}) });
writeFileSync(join(fixture, 'claimreg-example.json'), JSON.stringify({ schema: 'csoai.claim-registry/0.3',
  registry_id: 'claimreg-example', created_utc: '2026-09-25T00:00:00Z',
  claims: [claim('Alpha', '2026-09-28T09:20:00Z'), claim('Beta'), claim('Gamma')] }));
const generated = join(root, 'synthetic-register.json');
const generate = (date) => run('--as-of', date, '--claims-dir', fixture, '--checks-dir', checks, '--out', generated);

for (const [date, scheduled, due] of [['2026-09-26T00:00:00Z', 1, 0], ['2026-10-13T07:00:00Z', 0, 1]]) {
  test(`five read states partition subjects at ${date}`, () => {
    ok(generate(date)); const { totals: t } = JSON.parse(readFileSync(generated));
    assert.equal(t.subjects_with_a_future_registry_named_read, scheduled);
    assert.equal(t.subjects_without_a_registry_named_read_schedule, 2);
    assert.equal(t.subjects_with_due_execution_unverified, due);
    assert.equal(t.subjects_with_a_scheduled_next_read, 3); // Includes day checks for unscheduled subjects.
    assert.equal(t.subjects_with_a_future_registry_named_read + t.subjects_without_a_registry_named_read_schedule +
      t.subjects_with_due_execution_unverified + t.subjects_with_a_completed_scheduled_read + t.subjects_with_a_retry_required, t.subjects);
  });
}

test('an unrecognized future read state fails closed', () => {
  const path = join(root, 'scripts/claims/maintenance-schedule-state.mjs'); const original = readFileSync(path, 'utf8');
  const needle = 'if (next > asOf) return { state: "SCHEDULED", evidence: null };';
  assert.ok(original.includes(needle));
  try { writeFileSync(path, original.replace(needle, needle.replace('SCHEDULED', 'ALIEN'))); reject(generate('2026-09-26T00:00:00Z')); }
  finally { writeFileSync(path, original); }
});
