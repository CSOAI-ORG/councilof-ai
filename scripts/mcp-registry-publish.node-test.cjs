const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { run, detailPath } = require('./mcp-registry-publish.cjs');
const OFFICIAL = 'io.modelcontextprotocol.registry/official';
const server = { name: 'ai.councilof/gspc', version: '1.4.4', description: '52 tools',
  remotes: [{ type: 'streamable-http', url: 'https://councilof.ai/mcp/' }],
  _meta: { 'io.modelcontextprotocol.registry/publisher-provided': { fleet: ['free', 'paid'] } } };
const clone = (value) => JSON.parse(JSON.stringify(value));
const record = (s = server, status = 'active', isLatest = true) =>
  ({ server: clone(s), _meta: { [OFFICIAL]: { status, isLatest, publishedAt: '2026-10-29T00:00:00Z' } } });
const response = (value, status = 200) => ({ status, body: JSON.stringify(value) });
function fixture(replies, options = {}) {
  const calls = [];
  const send = async (...args) => { calls.push(args); assert.ok(replies.length, 'unexpected request'); return replies.shift(); };
  return { calls, promise: run({ server: clone(server), version: server.version,
    expectedName: server.name, mode: 'publish', token: 'test-only-token', send, ...options }) };
}
test('exact namespace and version are encoded; never query another alias', async () => {
  const f = fixture([response(record())]);
  assert.equal((await f.promise).state, 'MATCH');
  assert.deepEqual(f.calls, [['GET', '/v0.1/servers/ai.councilof%2Fgspc/versions/1.4.4?include_deleted=true']]);
});
test('version build metadata is URL encoded', () => {
  assert.match(detailPath({ ...server, version: '1.4.4+review' }), /1.4.4%2Breview/);
});
test('matching metadata permits a read-only check without credentials', async () => {
  const f = fixture([response(record())], { mode: 'check', token: undefined });
  assert.equal((await f.promise).state, 'MATCH');
  assert.equal(f.calls.length, 1);
});
test('missing read-only check performs no publish', async () => {
  const f = fixture([response({}, 404)], { mode: 'check', token: undefined });
  assert.equal((await f.promise).state, 'MISSING');
  assert.equal(f.calls.length, 1);
});
test('local validation makes no network call', async () => {
  const f = fixture([], { mode: 'validate', token: undefined });
  assert.equal((await f.promise).state, 'MANIFEST_VALID');
  assert.equal(f.calls.length, 0);
});
for (const [label, mutate] of [
  ['description', s => { s.description = '19 tools'; }],
  ['identity', s => { s.name = 'io.github.CSOAI-ORG/gspc'; }],
  ['version', s => { s.version = '1.4.3'; }],
  ['remote', s => { s.remotes[0].url = 'https://example.invalid/mcp'; }],
  ['publisher metadata', s => { s._meta['io.modelcontextprotocol.registry/publisher-provided'].fleet = []; }],
  ['extra package', s => { s.packages = [{ identifier: 'unexpected' }]; }],
]) {
  test('existing ' + label + ' mismatch refuses without POST', async () => {
    const changed = clone(server); mutate(changed);
    const f = fixture([response(record(changed))]);
    await assert.rejects(f.promise, /metadata differs/);
    assert.equal(f.calls.length, 1);
  });
}
for (const status of ['deprecated', 'deleted', undefined]) {
  test('non-active record refuses: ' + status, async () => {
    const r = record(); r._meta[OFFICIAL].status = status;
    const f = fixture([response(r)]);
    await assert.rejects(f.promise, /not confirmed active/);
    assert.equal(f.calls.length, 1);
  });
}
test('matching older version never claims latest', async () => {
  const f = fixture([response(record(server, 'active', false))]);
  assert.equal((await f.promise).is_latest, false);
});
for (const status of [401, 429, 500]) {
  test('preflight HTTP ' + status + ' fails closed', async () => {
    const f = fixture([response({}, status)]);
    await assert.rejects(f.promise, /preflight failed/);
    assert.equal(f.calls.length, 1);
  });
}
test('malformed JSON is not absence', async () => {
  const f = fixture([{ status: 200, body: 'not JSON' }]);
  await assert.rejects(f.promise, /invalid JSON/);
  assert.equal(f.calls.length, 1);
});
test('wrong local namespace refuses before network', async () => {
  const f = fixture([], { expectedName: 'io.github.CSOAI-ORG/gspc' });
  await assert.rejects(f.promise, /namespace mismatch/);
  assert.equal(f.calls.length, 0);
});
test('wrong dispatch version refuses before network', async () => {
  const f = fixture([], { version: '1.4.5' });
  await assert.rejects(f.promise, /version mismatch/);
  assert.equal(f.calls.length, 0);
});
for (const token of [undefined, '', 'null', 'undefined', ' token', 'a\nb']) {
  test('invalid publication credential refuses before network: ' + JSON.stringify(token), async () => {
    const f = fixture([], { token });
    await assert.rejects(f.promise, /token missing/);
    assert.equal(f.calls.length, 0);
  });
}
test('publication success requires independent active readback', async () => {
  const f = fixture([response({}, 404), response({}, 201), response(record())]);
  assert.equal((await f.promise).state, 'PUBLISHED_AND_READ_BACK');
  assert.deepEqual(f.calls.map(c => c[0]), ['GET', 'POST', 'GET']);
  assert.equal(f.calls[1][1], '/v0.1/publish');
  assert.equal(f.calls[1][3], 'test-only-token');
  assert.equal(f.calls[0].length, 2);
  assert.equal(f.calls[2].length, 2);
});
test('publish rejection does not leak response body', async () => {
  const f = fixture([response({}, 404), { status: 403, body: 'secret-looking-response' }]);
  await assert.rejects(f.promise, error => !error.message.includes('secret-looking') && /403/.test(error.message));
  assert.equal(f.calls.length, 2);
});
test('accepted POST with absent readback is not success', async () => {
  const f = fixture([response({}, 404), response({}, 201), response({}, 404)]);
  await assert.rejects(f.promise, /readback unconfirmed/);
  assert.equal(f.calls.length, 3);
});
test('accepted POST with stale readback is not success', async () => {
  const changed = { ...server, description: '19 tools' };
  const f = fixture([response({}, 404), response({}, 201), response(record(changed))]);
  await assert.rejects(f.promise, /metadata differs/);
});
test('object key order and registry-owned annotations do not change publisher metadata', async () => {
  const s = { ...server, _meta: { ...server._meta, [OFFICIAL]: { arbitrary: true } } };
  const f = fixture([response(record(s))]);
  assert.equal((await f.promise).state, 'MATCH');
});
test('legacy publisher negative control skips a different namespace with the same version', { skip: !process.env.LEGACY_PUBLISHER }, async () => {
  const { EventEmitter } = require('node:events');
  const logs = []; const paths = [];
  const fakeHttps = {
    get(url, cb) {
      paths.push(url);
      const res = new EventEmitter(); res.statusCode = 200;
      cb(res); queueMicrotask(() => { res.emit('data', JSON.stringify({ versions: [{ version: '1.4.4' }] })); res.emit('end'); });
      return new EventEmitter();
    },
    request() { throw new Error('unexpected legacy POST'); },
  };
  vm.runInNewContext(fs.readFileSync(process.env.LEGACY_PUBLISHER, 'utf8'), {
    require: name => name === 'fs' ? { readFileSync: () => JSON.stringify(server) } : fakeHttps,
    process: { env: { VER: '1.4.4', TOKEN: 'test-only-token' }, exit: code => { throw Error('exit ' + code); } },
    console: { log: value => logs.push(String(value)), error: value => logs.push(String(value)) },
    Buffer,
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(paths[0], /io.github.CSOAI-ORG%2Fgspc/);
  assert.ok(logs.some(x => /already published/.test(x)), 'old source must reproduce false success');
});
