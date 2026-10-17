/** Offline checks execute the real rereader; no public page is contacted. */
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { EXTRACTOR_RULE_1, EXTRACTOR_RULE_2, extractorFor, sha256hex } from '../claim-capture.mjs';
import { locateClaim } from './claim-presence.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const QUOTE = 'Our platform supports signed receipts.';
const BEFORE = '<html><body><p>' + QUOTE + '</p><aside>Old banner</aside></body></html>';
const hash = (page, extractor = EXTRACTOR_RULE_2) => sha256hex(Buffer.from(extractorFor(extractor)(page)));

async function serve(body, status = 200) {
  let requests = 0;
  const server = createServer((_, res) => { requests++; res.writeHead(status, { 'content-type': 'text/html' }); res.end(body); });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return { server, url: 'http://127.0.0.1:' + server.address().port + '/', count: () => requests };
}
const claim = (id, url, quote = QUOTE, before = BEFORE, extractor = EXTRACTOR_RULE_2) => ({
  claim_id: id, claim_verbatim: quote, subject: { name: 'Fixture' }, source_url: url,
  state: 'UNMEASURED', source_content_hash: { alg: 'sha256', covers: 'visible-text', value: hash(before, extractor), extractor },
});
async function reread(claims) {
  const dir = mkdtempSync(join(tmpdir(), 'csoai-presence-'));
  const path = join(dir, 'registry.json');
  writeFileSync(path, JSON.stringify({ registry_id: 'fixture', claims }));
  try {
    return await new Promise((ok, fail) => {
      const p = spawn(process.execPath, [join(ROOT, 'scripts/claims/reread.mjs'), '--registry', path]);
      let out = '', err = '';
      p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { err += d; });
      p.on('close', (code) => code === 0 ? ok(JSON.parse(out).readings) : fail(new Error(err)));
    });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
function classification(first, second) {
  const script = [
    'import importlib.util,json,sys',
    's=importlib.util.spec_from_file_location("m",sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)',
    'a,b=json.load(sys.stdin);print(json.dumps(m.classify(a,{r["claim_id"]:r for r in b})))',
  ].join('\n');
  const p = spawnSync('python3', ['-c', script, join(ROOT, 'scripts/claims/maintenance_due.py')], {
    input: JSON.stringify([first, second]), encoding: 'utf8',
  });
  assert.equal(p.status, 0, p.stderr);
  return JSON.parse(p.stdout);
}

test('an unrelated page edit keeps the quote present and cannot become a claim-absence candidate', async () => {
  const s = await serve(BEFORE.replace('Old banner', 'New banner'));
  try {
    const first = await reread([claim('A', s.url)]);
    const second = await reread([claim('A', s.url)]);
    assert.equal(first[0].changed, true);
    assert.equal(first[0].claim_present, true);
    assert.equal(first[0].claim_presence.mode, 'EXACT');
    const [outcome, changes] = classification(first, second);
    assert.equal(outcome, 'CHANGED_CONFIRMED');
    assert.equal(changes[0].claim_absence_confirmed, false);
  } finally { s.server.close(); }
});

test('the same literal quote miss on both comparable reads is eligible for a bounded review candidate', async () => {
  const s = await serve('<html><body><p>A different statement.</p></body></html>');
  try {
    const first = await reread([claim('A', s.url)]);
    const second = await reread([claim('A', s.url)]);
    assert.equal(first[0].claim_present, false);
    assert.equal(second[0].claim_present, false);
    assert.equal(first[0].claim_presence.mode, 'NOT_LOCATED');
    assert.match(first[0].claim_presence.boundary, /does not establish retraction/);
    const [outcome, changes] = classification(first, second);
    assert.equal(outcome, 'CHANGED_CONFIRMED');
    assert.equal(changes[0].claim_absence_confirmed, true);
  } finally { s.server.close(); }
});

test('a failed response is inconclusive, never quote absence', async () => {
  const s = await serve('Unavailable', 503);
  try {
    const [r] = await reread([claim('A', s.url)]);
    assert.equal(r.http_status, 503);
    assert.equal(r.changed, null);
    assert.equal(r.claim_present, null);
    assert.equal(r.claim_presence.mode, 'READ_INCONCLUSIVE');
  } finally { s.server.close(); }
});

test('two claims on one page share exactly one fetch but retain separate quote evidence', async () => {
  const s = await serve(BEFORE);
  try {
    const rows = await reread([claim('A', s.url), claim('B', s.url, 'Old banner')]);
    assert.equal(s.count(), 1);
    assert.deepEqual(rows.map((r) => r.claim_present), [true, true]);
    assert.equal(rows[0].source_read_at_utc, rows[1].source_read_at_utc);
    assert.notEqual(rows[0].claim_presence.claim_sha256, rows[1].claim_presence.claim_sha256);
  } finally { s.server.close(); }
});

test('a legacy page digest keeps its extractor while current quote location decodes entities', async () => {
  const page = '<html><body><p>It&#x27;s our platform.</p></body></html>';
  const s = await serve(page);
  try {
    const [r] = await reread([claim('A', s.url, "It's our platform.", page, EXTRACTOR_RULE_1)]);
    assert.equal(r.changed, false);
    assert.equal(r.extractor, EXTRACTOR_RULE_1);
    assert.equal(r.claim_present, true);
    assert.equal(r.claim_presence.extractor, EXTRACTOR_RULE_2);
  } finally { s.server.close(); }
});

test('a missing quote or an unsearchable document cannot manufacture absence', async () => {
  const s = await serve('%PDF-1.7 document without a supplied text layer');
  try {
    const [missing] = await reread([claim('A', s.url, null)]);
    assert.equal(missing.claim_present, null);
    assert.equal(missing.claim_presence.mode, 'NO_VERBATIM');
    const [document] = await reread([claim('B', s.url)]);
    assert.equal(document.claim_present, null);
    assert.equal(document.claim_presence.mode, 'NOT_SEARCHABLE_AS_BYTES');
  } finally { s.server.close(); }
});

test('the existing locator reports its normalization mode and does not normalize case', () => {
  assert.equal(locateClaim('Our platform[1] supports signed receipts .', QUOTE), 'MATCHED_AFTER_NORMALISING_EXTRACTOR_ARTEFACTS');
  assert.equal(locateClaim('OUR PLATFORM SUPPORTS SIGNED RECEIPTS.', QUOTE), 'NOT_LOCATED');
});
