/**
 * The watcher compares like with like (spec v0.2 6.3.1). A recorded visible-text digest is
 * recomputed by the extractor that made it, so a page that has not changed is never reported as
 * changed merely because the reference extractor did. The page is served from localhost, so this
 * needs no network and reads no one's site.
 *
 *   node --test scripts/claims/reread-extractor.node-test.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EXTRACTOR_RULE_1, EXTRACTOR_RULE_2, extractVisibleText, extractVisibleTextRule1, sha256hex,
} from '../claim-capture.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REREAD = join(ROOT, 'scripts/claims/reread.mjs');
const PAGE = '<html><body><p>It&#x27;s the leading platform &mdash; 1,000 users</p></body></html>';
const digest = (fn, html) => sha256hex(Buffer.from(fn(html), 'utf8'));

function serve(body) {
  return new Promise((ok) => {
    const server = createServer((_, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(body); });
    server.listen(0, '127.0.0.1', () => ok(server));
  });
}

function reread(registry) {
  const dir = mkdtempSync(join(tmpdir(), 'csoai-reread-'));
  const file = join(dir, 'registry.json');
  writeFileSync(file, JSON.stringify(registry));
  return new Promise((ok, fail) => {
    const p = spawn(process.execPath, [REREAD, '--registry', file]);
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (code) => {
      rmSync(dir, { recursive: true, force: true });
      if (code !== 0) return fail(new Error(`reread exited ${code}: ${err}`));
      ok(JSON.parse(out).readings);
    });
  });
}

const registryFor = (url, hash) => ({
  registry_id: 'claimreg-test',
  claims: [{ claim_id: 'T-1', subject: { name: 'Test' }, source_url: url, state: 'UNMEASURED', source_content_hash: hash }],
});

test('the two rules really do disagree on this page, so the test below is not vacuous', () => {
  assert.notEqual(digest(extractVisibleTextRule1, PAGE), digest(extractVisibleText, PAGE));
});

test('a rule-1 digest (no extractor named) of an unchanged page is not a change', async () => {
  const server = await serve(PAGE);
  try {
    const url = `http://127.0.0.1:${server.address().port}/`;
    const [r] = await reread(registryFor(url, { alg: 'sha256', covers: 'visible-text', value: digest(extractVisibleTextRule1, PAGE) }));
    assert.equal(r.extractor, EXTRACTOR_RULE_1);
    assert.equal(r.changed, false, 'a change of reader was reported as a change of page');
    assert.equal(r.current_hash_current_extractor, digest(extractVisibleText, PAGE));
  } finally { server.close(); }
});

test('a rule-2 digest of an unchanged page is not a change', async () => {
  const server = await serve(PAGE);
  try {
    const url = `http://127.0.0.1:${server.address().port}/`;
    const [r] = await reread(registryFor(url, {
      alg: 'sha256', covers: 'visible-text', value: digest(extractVisibleText, PAGE), extractor: EXTRACTOR_RULE_2,
    }));
    assert.equal(r.extractor, EXTRACTOR_RULE_2);
    assert.equal(r.changed, false);
    assert.equal(r.current_hash_current_extractor, undefined);
  } finally { server.close(); }
});

test('a page that did change is still reported, under the rule that recorded it', async () => {
  const server = await serve(PAGE.replace('1,000', '2,000'));
  try {
    const url = `http://127.0.0.1:${server.address().port}/`;
    const [r] = await reread(registryFor(url, { alg: 'sha256', covers: 'visible-text', value: digest(extractVisibleTextRule1, PAGE) }));
    assert.equal(r.changed, true);
    assert.equal(r.current_hash, digest(extractVisibleTextRule1, PAGE.replace('1,000', '2,000')));
  } finally { server.close(); }
});

test('an extractor this reader does not hold yields no comparison, never a guessed one', async () => {
  const server = await serve(PAGE);
  try {
    const url = `http://127.0.0.1:${server.address().port}/`;
    const [r] = await reread(registryFor(url, {
      alg: 'sha256', covers: 'visible-text', value: digest(extractVisibleText, PAGE), extractor: 'csoai-visible-text/9',
    }));
    assert.equal(r.changed, null);
    assert.equal(r.current_hash, null);
    assert.match(r.reason, /unknown visible-text extractor/);
  } finally { server.close(); }
});
