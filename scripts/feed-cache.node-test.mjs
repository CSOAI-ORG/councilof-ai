import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { pathToFileURL } from 'node:url';

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
    cards: new Map(), proofs: new Map(), values: new Map(), puts: 0,
  };
  for (const [index, sha] of state.root.card_sha256.entries()) {
    state.cards.set(sha.slice(0, 16), { card: {
      surface: index === 2 ? 'other' : 'alpha.child', subject: `Subject & <${index}>`,
      as_of: `2026-11-0${index + 1}T00:00:00Z`,
      product: { tier: index === 0 ? 'proof' : 'free' },
    } });
    state.proofs.set(sha.slice(0, 16), index === 1 ? { proof: ['fixture'] } : { proof: [] });
  }
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
    const match = url.pathname.match(/^\/(cards|proofs)\/([0-9a-f]{16})\.json$/);
    assert.ok(match, `Unexpected offline request: ${url.pathname}`);
    const body = (match[1] === 'cards' ? state.cards : state.proofs).get(match[2]);
    if (body instanceof Error) throw body;
    return body === undefined ? new Response('Missing', { status: 404 }) : Response.json(body);
  };
  return state;
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

test('fresh isolate reuses a completed load with one root fetch instead of per-card fan-out', async () => {
  const state = fixture();
  const first = await (await call(await freshHandler())).json();
  assert.equal(state.calls.length, 7); // One root, three mirrored cards and three mirrored proofs.
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
  assert.equal(state.calls.length, 7);
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
  assert.equal(state.calls.length, 7);
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
  assert.equal(state.calls.length, 7);
  assert.ok(state.calls.every(url => new URL(url).origin === 'https://councilof-ai.pages.dev'));
  assert.equal(state.values.size, 2);
});

test('changed root content and ordering cannot reuse an earlier edge record', async () => {
  const state = fixture();
  await call(await freshHandler());
  state.root.card_sha256.reverse();
  state.root.as_of = '2026-11-11T01:00:00Z';
  state.calls.length = 0;
  const changed = await (await call(await freshHandler())).json();
  assert.equal(state.calls.length, 7);
  assert.deepEqual(changed.cards.map(c => c.sha256), state.root.card_sha256);
  assert.equal(state.values.size, 2);
});

test('root as_of alone is part of the edge identity', async () => {
  const state = fixture();
  await call(await freshHandler());
  state.root.as_of = '2026-11-11T02:00:00Z';
  state.calls.length = 0;
  await call(await freshHandler());
  assert.equal(state.calls.length, 7);
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
    assert.equal(state.calls.length, 7);
  }
});

test('malformed, duplicate, reordered, foreign and extra-field cache entries are refused', async () => {
  for (const edit of [
    x => { x.entries = null; }, x => { x.entries = []; },
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
    assert.equal(state.calls.length, 7);
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
    assert.equal(state.calls.length, 7);
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
    assert.equal(state.calls.length, 7);
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

test('unreadable cards and proofs retain existing skip and tier fallback semantics', async () => {
  const state = fixture();
  state.cards.delete('3'.repeat(16));
  state.proofs.set('1'.repeat(16), new Error('proof unavailable'));
  state.proofs.delete('2'.repeat(16));
  const cold = await (await call(await freshHandler())).json();
  assert.deepEqual(cold.cards.map(x => x.tier), ['proof', 'free']);
  assert.equal(cold.count, 2);
  state.calls.length = 0;
  const cached = await (await call(await freshHandler())).json();
  assert.deepEqual(cached, cold);
  assert.equal(state.calls.length, 1);
});

test('empty source results remain503 and are never retained in the edge cache', async () => {
  const state = fixture();
  state.cards.clear();
  const response = await call(await freshHandler());
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'empty_index');
  assert.equal(state.puts, 0);
});

test('cached JSON, family/tier filters, limits, RSS escaping and HEAD keep their contract', async () => {
  const state = fixture();
  await call(await freshHandler());
  const filtered = await (await call(await freshHandler(), 'https://councilof.ai/feed?family=alpha&tier=proof&limit=1')).json();
  assert.equal(filtered.count, 2);
  assert.equal(filtered.returned, 1);
  assert.equal(filtered.as_of, '2026-11-03T00:00:00Z');
  assert.equal(filtered.cards[0].sha256, '1'.repeat(64));
  const rss = await call(await freshHandler(), 'https://councilof.ai/feed?format=rss');
  assert.match(rss.headers.get('content-type'), /^application\/rss\+xml/);
  assert.match(await rss.text(), /Subject &amp; &lt;0&gt;/);
  const head = await call(await freshHandler(), 'https://councilof.ai/feed', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal(head.headers.get('cache-control'), 'public, max-age=300');
});

test('the stored record contains only derived public metadata and the original timestamp', async () => {
  const state = fixture();
  state.cards.get('1'.repeat(16)).card.payload = { private_token: 'fixture-not-a-secret' };
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
