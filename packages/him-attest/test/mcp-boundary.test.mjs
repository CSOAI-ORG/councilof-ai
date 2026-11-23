import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCeremony } from '../src/ceremony.js';

const PROGRAM = fileURLToPath(new URL('../mcp/him-attest.mjs', import.meta.url));

function temporary(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'him-mcp-boundary-'));
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
function request(cwd, payload) {
  const input = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const result = spawnSync(process.execPath, [PROGRAM], {
    cwd, input: input + '\n', encoding: 'utf8', timeout: 3000,
  });
  assert.equal(result.status, 0, result.stderr || 'MCP process must exit normally');
  const lines = result.stdout.trim().split(/\r?\n/).filter(Boolean);
  assert.equal(lines.length, 1, 'one JSON-RPC response per request');
  return JSON.parse(lines[0]);
}

test('MCP discovers read-only research capabilities, not a human signer', () => temporary(dir => {
  const response = request(dir, { jsonrpc: '2.0', id: 1, method: 'tools/list' });
  assert.deepEqual(response.result.tools.map(t => t.name), ['him_attest_run', 'him_attest_queue']);
}));

test('legacy decision calls fail closed without generating a key or modifying a pack', () => temporary(dir => {
  const packName = 'case.eu-ai-act-art50.pack.json';
  const before = '{"human_tasks":["t1"],"human_decisions":[]}';
  fs.writeFileSync(path.join(dir, packName), before);
  const response = request(dir, { jsonrpc: '2.0', id: 2, method: 'tools/call',
    params: { name: 'him_attest_decide', arguments: { pack: packName, task: 't1', decision: 'SIGNED', key: './agent.key' } },
  });
  assert.match(response.error.message, /HUMAN_AUTHORITY_NOT_ENROLLED/);
  assert.equal(fs.readFileSync(path.join(dir, packName), 'utf8'), before);
  assert.equal(fs.existsSync(path.join(dir, 'agent.key')), false);
}));

test('run rejects traversal in subject and unknown framework before network or write', () => temporary(dir => {
  for (const args of [
    { subject: '../../unsafe', framework: 'eu-ai-act-art50' },
    { subject: 'safe', framework: '../../unsafe' },
  ]) {
    const response = request(dir, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'him_attest_run', arguments: args } });
    assert.match(response.error.message, /INVALID_(SUBJECT_SLUG|FRAMEWORK)/);
  }
  assert.deepEqual(fs.readdirSync(dir), []);
}));

test('queue refuses arbitrary paths and symlinks', () => temporary(dir => {
  const bad = request(dir, { jsonrpc: '2.0', id: 4, method: 'tools/call',
    params: { name: 'him_attest_queue', arguments: { pack: '../../outside.json' } } });
  assert.match(bad.error.message, /PACK_PATH_NOT_MANAGED/);
  const target = path.join(dir, 'target.json');
  fs.writeFileSync(target, '{"human_tasks":[],"human_decisions":[]}');
  fs.symlinkSync(target, path.join(dir, 'case.eu-ai-act-art50.pack.json'));
  const linked = request(dir, { jsonrpc: '2.0', id: 5, method: 'tools/call',
    params: { name: 'him_attest_queue', arguments: { pack: 'case.eu-ai-act-art50.pack.json' } } });
  assert.match(linked.error.message, /PACK_FILE_NOT_REGULAR/);
}));

test('queue still lists genuinely pending tasks from a managed regular pack', () => temporary(dir => {
  fs.writeFileSync(path.join(dir, 'case.eu-ai-act-art50.pack.json'),
    JSON.stringify({ human_tasks: ['t1', 't2'], human_decisions: [{ task_id: 't1' }] }));
  const response = request(dir, { jsonrpc: '2.0', id: 6, method: 'tools/call',
    params: { name: 'him_attest_queue', arguments: { pack: 'case.eu-ai-act-art50.pack.json' } } });
  assert.deepEqual(JSON.parse(response.result.content[0].text), ['t2']);
}));

test('malformed JSON is a refusal, not a process crash', () => temporary(dir => {
  const response = request(dir, '{');
  assert.equal(response.error.message, 'MALFORMED_JSON');
}));


test('core ceremony loader refuses framework traversal without reading files or making requests', async () => {
  await assert.rejects(() => runCeremony({ frameworkSlug: '../outside', frameworksDir: '/tmp', subject: 'case', fetchImpl: () => { throw new Error('network invoked'); } }), /INVALID_FRAMEWORK/);
});
