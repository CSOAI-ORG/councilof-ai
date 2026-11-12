import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

// CI runs this through the repository's existing tsx dependency. All transports
// and time are controlled fixtures; no request reaches a public service.
const source = process.env.FEED_HANDLER_FILE
  ? pathToFileURL(process.env.FEED_HANDLER_FILE).href
  : new URL('../functions/feed.ts', import.meta.url).href;
const originalFetch = globalThis.fetch;
const originalCaches = Object.getOwnPropertyDescriptor(globalThis, 'caches');
const originalNow = Date.now;
let serial = 0;

afterEach(() => {
  globalThis.fetch = originalFetch;
  Date.now = originalNow;
  if (originalCaches) Object.defineProperty(globalThis, 'caches', originalCaches);
  else delete globalThis.caches;
});

async function freshHandler() { return import(`${source}?feed-fixture=${++serial}`); }

function fixture() {
  const state = {
    now: 1_800_000_000_000, calls: [], rootStatus: 200,
    root: { card_sha256: ['1'.repeat(64), '2'.repeat(64), '3'.repeat(64)], as_of: '2026-11-11T00:00:00Z', card_count: 3 },
    publishedEntries: [], index: null, indexStatus: 200, values: new Map(), puts: 0,
  };
  for (const [index, sha] of state.root.card_sha256.entries()) {
    // Independently specified expected metadata, not built by the production producer.
    state.publishedEntries.push({
      sha256: sha, surface: index === 2 ? 'other' : 'alpha.child', subject: `Subject & <${index}>`,
      as_of: `2026-11-0${index + 1}T00:00:00Z`, tier: index === 2 ? 'free' : 'proof',
    });
  }
  publishIndex(state);
  state.cache = {
    async match(key) { return state.values.get(key.url)?.clone(); },
    async put(key, response) { state.puts++; state.values.set(key.url, response.clone()); },
  };
  Object.defineProperty(globalThis, 'caches', { configurable: true, writable: true, value: { default: state.cache } });
  Date.now = () => state.now;
  globalThis.fetch = async input => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    state.calls.push(url.href);
    if (url.pathname === '/root.json') return Response.json(state.root, { status: state.rootStatus });
    assert.equal(url.pathname, '/card-feed-index.json', `Unexpected offline request: ${url.pathname}`);
    if (state.index instanceof Error) throw state.index;
    if (state.indexRaw !== undefined) return new Response(state.indexRaw);
    return Response.json(state.index, { status: state.indexStatus });
  };
  return state;
}

function publishIndex(state) {
  const entries = state.root.card_sha256.map(sha => state.publishedEntries.find(entry => entry.sha256 === sha));
  state.index = {
    schema: 'csoai.card-feed-index/1',
    root_digest: createHash('sha256').update(JSON.stringify(state.root)).digest('hex'),
    root_card_count: state.root.card_count, tier_basis: 'published-metadata',
    entries: structuredClone(entries),
  };
}

async function call(handler, url = 'https://councilof.ai/feed', method = 'GET') {
  const pending = [];
  const context = { request: new Request(url, { method }), waitUntil: work => pending.push(work) };
  const response = await handler[method === 'HEAD' ? 'onRequestHead' : 'onRequestGet'](context);
  await Promise.all(pending);
  return response;
}

async function corrupt(state, edit) {
  const [key, response] = state.values.entries().next().value;
  const record = await response.json();
  edit(record);
  state.values.set(key, Response.json(record, { headers: { 'x-csoai-feed-cache': '1' } }));
}

test('fresh isolate reuses a completed load with one root fetch after a two-read cold load', async () => {
  const state = fixture();
  const first = await (await call(await freshHandler())).json();
  assert.deepEqual(state.calls, ['https://councilof.ai/root.json', 'https://councilof.ai/card-feed-index.json']);
  assert.equal(state.puts, 1);
  state.calls.length = 0;
  const second = await (await call(await freshHandler())).json();
  assert.deepEqual(second, first);
  assert.deepEqual(state.calls, ['https://councilof.ai/root.json']);
  assert.equal(state.puts, 1);
});

test('the same pending load is retained early while the response still awaits it', async () => {
  const state = fixture();
  const reader = globalThis.fetch;
  let release;
  globalThis.fetch = input => new URL(input).pathname === '/root.json'
    ? new Promise(resolve => { release = () => resolve(reader(input)); })
    : reader(input);
  const handler = await freshHandler();
  const retained = [];
  let settled = false;
  const response = handler.onRequestGet({
    request: new Request('https://councilof.ai/feed'),
    waitUntil: work => retained.push(work),
  });
  response.then(() => { settled = true; });
  assert.equal(retained.length, 1);
  await Promise.resolve();
  assert.equal(settled, false);
  assert.equal(typeof release, 'function');
  release();
  assert.equal((await response).status, 200);
  await Promise.all(retained);
  assert.equal(state.calls.length, 2);
  assert.equal(state.puts, 1);
});

test('edge hits and subsequent memory hits never renew the original 300-second age', async () => {
  const state = fixture();
  await call(await freshHandler());
  const originalTs = state.now;
  state.now += 299_999;
  const handler = await freshHandler();
  state.calls.length = 0;
  await call(handler);
  assert.equal(state.calls.length, 1);
  assert.equal(state.puts, 1);
  state.now += 1;
  state.calls.length = 0;
  await call(handler);
  assert.equal(state.calls.length, 2);
  assert.equal(state.puts, 2);
  const saved = await state.values.values().next().value.clone().json();
  assert.equal(saved.ts, originalTs + 300_000);
});

test('memory caching keeps the existing lifetime and is scoped to the requesting origin', async () => {
  const state = fixture();
  const handler = await freshHandler();
  await call(handler);
  state.calls.length = 0;
  await call(handler, 'https://councilof.ai/feed?limit=1');
  assert.equal(state.calls.length, 0);
  await call(handler, 'https://councilof-ai.pages.dev/feed');
  assert.equal(state.calls.length, 2);
  assert.ok(state.calls.every(url => new URL(url).origin === 'https://councilof-ai.pages.dev'));
  assert.equal(state.values.size, 2);
});

test('changed root content and ordering cannot reuse an earlier edge record', async () => {
  const state = fixture();
  await call(await freshHandler());
  state.root.card_sha256.reverse();
  state.root.as_of = '2026-11-11T01:00:00Z';
  publishIndex(state);
  state.calls.length = 0;
  const changed = await (await call(await freshHandler())).json();
  assert.equal(state.calls.length, 2);
  assert.deepEqual(changed.cards.map(c => c.sha256), state.root.card_sha256);
  assert.equal(state.values.size, 2);
});

test('root as_of alone is part of the edge identity', async () => {
  const state = fixture();
  await call(await freshHandler());
  state.root.as_of = '2026-11-11T02:00:00Z';
  publishIndex(state);
  state.calls.length = 0;
  await call(await freshHandler());
  assert.equal(state.calls.length, 2);
  assert.equal(state.values.size, 2);
});

test('wrong origin, root digest, schema, future and expired records are cache misses', async () => {
  for (const edit of [
    x => { x.origin = 'https://other.invalid'; }, x => { x.root_digest = '0'.repeat(64); },
    x => { x.schema = 'unknown'; }, x => { x.ts += 1; }, x => { x.ts -= 300_000; },
  ]) {
    const state = fixture();
    await call(await freshHandler());
    await corrupt(state, edit);
    state.calls.length = 0;
    assert.equal((await call(await freshHandler())).status, 200);
    assert.equal(state.calls.length, 2);
  }
});

test('malformed, duplicate, reordered, foreign and extra-field cache entries are refused', async () => {
  for (const edit of [
    x => { x.entries = null; }, x => { x.entries = []; }, x => { x.entries.pop(); },
    x => { x.entries[1] = x.entries[0]; }, x => { x.entries.reverse(); },
    x => { x.entries[0].sha256 = '9'.repeat(64); }, x => { x.entries[0].tier = 'certified'; },
    x => { x.entries[0].subject = 123; }, x => { x.entries[0].private_data = 'sentinel'; },
  ]) {
    const state = fixture();
    await call(await freshHandler());
    await corrupt(state, edit);
    state.calls.length = 0;
    const response = await call(await freshHandler());
    assert.equal(response.status, 200);
    assert.equal(state.calls.length, 2);
    assert.ok(!(await response.text()).includes('sentinel'));
  }
});

test('invalid JSON, missing cache marker and unsuccessful cache response are misses', async () => {
  for (const replacement of [
    () => new Response('{', { headers: { 'x-csoai-feed-cache': '1' } }),
    body => Response.json(body),
    body => Response.json(body, { status: 503, headers: { 'x-csoai-feed-cache': '1' } }),
  ]) {
    const state = fixture();
    await call(await freshHandler());
    const [key, response] = state.values.entries().next().value;
    state.values.set(key, replacement(await response.json()));
    state.calls.length = 0;
    assert.equal((await call(await freshHandler())).status, 200);
    assert.equal(state.calls.length, 2);
  }
});

test('cache API absence, read failure and write rejection preserve source behavior', async () => {
  for (const mode of ['absent', 'read', 'write', 'sync-write']) {
    const state = fixture();
    if (mode === 'absent') delete globalThis.caches;
    if (mode === 'read') state.cache.match = async () => { throw new Error('cache unavailable'); };
    if (mode === 'write') state.cache.put = async () => { throw new Error('cache write unavailable'); };
    if (mode === 'sync-write') state.cache.put = () => { throw new Error('sync cache failure'); };
    const response = await call(await freshHandler());
    assert.equal(response.status, 200);
    assert.equal((await response.json()).count, 3);
    assert.equal(state.calls.length, 2);
  }
});

test('root failure cannot be hidden by an edge record in a fresh isolate', async () => {
  const state = fixture();
  await call(await freshHandler());
  state.rootStatus = 503;
  const response = await call(await freshHandler());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'upstream_failure');
  assert.equal(state.puts, 1);
});

test('the feed describes the complete publication without probing card or proof mirror availability', async () => {
  const state = fixture();
  const cold = await (await call(await freshHandler())).json();
  assert.deepEqual(cold.cards.map(x => x.tier), ['proof', 'proof', 'free']);
  assert.equal(cold.count, state.root.card_count);
  assert.deepEqual(state.calls.map(url => new URL(url).pathname), ['/root.json', '/card-feed-index.json']);
  state.calls.length = 0;
  const cached = await (await call(await freshHandler())).json();
  assert.deepEqual(cached, cold);
  assert.equal(state.calls.length, 1);
});

test('missing, failed or malformed index reads return 503 without caching or per-card fallback', async () => {
  for (const edit of [
    s => { s.indexStatus = 404; }, s => { s.indexStatus = 503; },
    s => { s.index = new Error('index transport failure'); },
    s => { s.indexRaw = '{'; }, s => { s.index = null; },
  ]) {
    const state = fixture();
    edit(state);
    const response = await call(await freshHandler());
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, 'upstream_failure');
    assert.equal(state.calls.length, 2);
    assert.equal(state.puts, 0);
  }
});

test('stale, incomplete, reordered or invalid projection data fails as a whole and can recover', async () => {
  for (const edit of [
    x => { x.schema = 'unknown'; }, x => { x.tier_basis = 'mirror-availability'; },
    x => { x.root_digest = '0'.repeat(64); }, x => { x.root_card_count++; },
    x => { x.entries = []; }, x => { x.entries.pop(); },
    x => { x.entries.push(x.entries[0]); }, x => { x.entries[1] = x.entries[0]; },
    x => { x.entries.reverse(); }, x => { x.entries[0].sha256 = '9'.repeat(64); },
    x => { x.entries[0].subject = 7; }, x => { x.entries[0].tier = 'certified'; },
    x => { x.entries[0].payload = 'not part of the feed'; },
  ]) {
    const state = fixture();
    edit(state.index);
    const handler = await freshHandler();
    const response = await call(handler);
    assert.equal(response.status, 503);
    assert.equal(state.calls.length, 2);
    assert.equal(state.puts, 0);
    publishIndex(state);
    state.calls.length = 0;
    assert.equal((await call(handler)).status, 200);
    assert.equal(state.calls.length, 2);
    assert.equal(state.puts, 1);
  }
});

test('invalid, duplicate or count-mismatched root leaves fail before reading the index', async () => {
  for (const edit of [
    x => { x.card_sha256 = []; }, x => { x.card_sha256[0] = 'bad'; },
    x => { x.card_sha256[1] = x.card_sha256[0]; }, x => { x.card_count++; },
    x => { delete x.card_count; },
  ]) {
    const state = fixture();
    edit(state.root);
    assert.equal((await call(await freshHandler())).status, 503);
    assert.equal(state.calls.length, 1);
    assert.equal(state.puts, 0);
  }
});

test('the previous mirror-based cache namespace cannot supply a projection result', async () => {
  const state = fixture();
  await call(await freshHandler());
  const [key, response] = state.values.entries().next().value;
  const saved = await response.json();
  state.values.clear();
  saved.schema = 'csoai.card-feed-cache/1';
  saved.entries.pop();
  state.values.set(key.replace('/v2/', '/v1/'), Response.json(saved, { headers: { 'x-csoai-feed-cache': '1' } }));
  state.calls.length = 0;
  const fresh = await (await call(await freshHandler())).json();
  assert.equal(fresh.count, 3);
  assert.equal(state.calls.length, 2);
  assert.equal(state.puts, 2);
});

test('a warm isolate retains the prior complete publication only until its original TTL', async () => {
  const state = fixture();
  const handler = await freshHandler();
  const first = await (await call(handler)).json();
  state.root.card_sha256.reverse();
  publishIndex(state);
  state.calls.length = 0;
  assert.deepEqual(await (await call(handler)).json(), first);
  assert.equal(state.calls.length, 0);
  state.now += 300_000;
  const renewed = await (await call(handler)).json();
  assert.deepEqual(renewed.cards.map(card => card.sha256), state.root.card_sha256);
  assert.equal(state.calls.length, 2);
});

test('cold fetch count stays two for one, 442 and 500 cards while the result limit stays 303', async () => {
  for (const size of [1, 442, 500]) {
    const state = fixture();
    state.root.card_sha256 = Array.from({ length: size }, (_, i) => (i + 1).toString(16).padStart(64, '0'));
    state.root.card_count = size;
    state.publishedEntries = state.root.card_sha256.map(sha => ({
      sha256: sha, surface: 'scale', subject: sha, as_of: '2026-11-12T00:00:00Z', tier: 'free',
    }));
    publishIndex(state);
    const response = await call(await freshHandler(), 'https://councilof.ai/feed?limit=999');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.count, size);
    assert.equal(body.returned, Math.min(size, 303));
    assert.equal(state.calls.length, 2);
    assert.equal(state.puts, 1);
  }
});

test('cached JSON, family/tier filters, limits, RSS escaping and HEAD keep their contract', async () => {
  const state = fixture();
  await call(await freshHandler());
  const json = await call(await freshHandler(), 'https://councilof.ai/feed?family=alpha&tier=proof&limit=1');
  assert.equal(json.headers.get('x-csoai-feed-tier-basis'), 'published-metadata');
  assert.equal(json.headers.get('access-control-expose-headers'), 'X-CSOAI-Feed-Tier-Basis');
  const filtered = await json.json();
  assert.equal(filtered.count, 2);
  assert.equal(filtered.returned, 1);
  assert.equal(filtered.as_of, '2026-11-03T00:00:00Z');
  assert.equal(filtered.cards[0].sha256, '1'.repeat(64));
  const rss = await call(await freshHandler(), 'https://councilof.ai/feed?format=rss');
  assert.equal(rss.headers.get('x-csoai-feed-tier-basis'), 'published-metadata');
  assert.equal(rss.headers.get('access-control-expose-headers'), 'X-CSOAI-Feed-Tier-Basis');
  assert.match(rss.headers.get('content-type'), /^application\/rss\+xml/);
  assert.match(await rss.text(), /Subject &amp; &lt;0&gt;/);
  const head = await call(await freshHandler(), 'https://councilof.ai/feed', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('x-csoai-feed-tier-basis'), 'published-metadata');
  assert.equal(head.headers.get('access-control-expose-headers'), 'X-CSOAI-Feed-Tier-Basis');
  assert.equal(await head.text(), '');
  assert.equal(head.headers.get('cache-control'), 'public, max-age=300');
});

test('the stored record contains only derived public metadata and the original timestamp', async () => {
  const state = fixture();
  state.index.unused_payload = { private_token: 'fixture-not-a-secret' };
  await call(await freshHandler());
  const response = state.values.values().next().value;
  const text = await response.clone().text();
  const saved = JSON.parse(text);
  assert.deepEqual(Object.keys(saved).sort(), ['entries', 'origin', 'root_digest', 'schema', 'ts']);
  assert.ok(!text.includes('fixture-not-a-secret'));
  assert.ok(!text.includes('product'));
  assert.equal(saved.ts, state.now);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=300');
});
