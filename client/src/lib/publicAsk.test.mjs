/* Actual retained HTTP bytes for happy paths; mutated/synthetic negatives explicitly local. No network. */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { webcrypto, createHash } from 'node:crypto';
import * as api from './publicAsk.mjs';
const raw = fs.readFileSync(new URL('./__fixtures__/publicAsk-20261012.sse', import.meta.url));
assert.equal(createHash('sha256').update(raw).digest('hex'), '8a080d70e098df0baf022158a268ba88cb4f5789768b1c5470dd13ef5f72c68a');
const question = 'What does the leaderboard show?', now = '2026-10-12T10:00:00Z';
const body = () => Uint8Array.from(raw);
const response = (bytes = body(), extras = {}) => ({ status: 200, redirected: false, url: api.PUBLIC_ASK_URL, headers: { get: name => name === 'content-type' ? 'text/event-stream; charset=utf-8' : null }, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), ...extras });
const make = (bytes = body()) => api.makePublicTranscript(question, bytes, now, webcrypto);
const events = () => api.parseSse(raw.toString()).events.map(value => value.data);
const encoded = values => new TextEncoder().encode(values.map(value => `event: ${value.type}\ndata: ${JSON.stringify(value)}\n\n`).join(''));
test('retained actual free stream derives exact tool card, server IDs and source bytes', async () => {
  const value = await make();
  assert.equal(value.run.status, 'done'); assert.equal(value.run.threadId, '9cced869-31fe-4eee-aa17-2d9c7a31f0a0'); assert.equal(value.run.runId, 'ddf5e8bf-bced-4912-948f-6eadff4dfc0f');
  assert.equal(value.run.tools.length, 1); assert.equal(value.run.tools[0].name, 'board_totals'); assert.equal(value.source.bytes, raw.length); assert.equal(value.source.sha256, createHash('sha256').update(raw).digest('hex'));
  assert.deepEqual(Buffer.from(value.source.raw_base64, 'base64'), raw); assert.equal(value.receipt.unsigned, true); assert.match(value.receipt.scope, /No trusted authorship\/time/);
});
test('fixed credential-free POST omits IDs, confirmation, forwarded private props, tools and payment', async () => {
  let calls = 0;
  const result = await api.streamPublicAsk({ question, cryptoImpl: webcrypto, now: () => now, endpoint: 'https://attacker.invalid', confirmTool: ['paid'], forwardedProps: { secret: 'private' }, fetchImpl: async (url, options) => {
    calls++; assert.equal(url, api.PUBLIC_ASK_URL); assert.equal(options.method, 'POST'); assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error'); assert.equal(options.referrerPolicy, 'no-referrer');
    assert.deepEqual(JSON.parse(options.body), { messages: [{ id: 'm1', role: 'user', content: question }] }); return response();
  } }); assert.equal(calls, 1); assert.equal(result.run.status, 'done');
});
test('full byte capture survives one-byte chunks including UTF-8 and CRLF framing', async () => {
  const changed = events(); changed.find(value => value.type === 'TEXT_MESSAGE_CONTENT').delta += ' café';
  const bytes = Buffer.from(new TextDecoder().decode(encoded(changed)).replace(/\n/g, '\r\n'));
  let offset = 0, released = false;
  const result = await api.streamPublicAsk({ question, cryptoImpl: webcrypto, now: () => now, fetchImpl: async () => response(bytes, { body: { getReader: () => ({ read: async () => offset < bytes.length ? { done: false, value: Uint8Array.from([bytes[offset++]]) } : { done: true }, releaseLock() { released = true; }, cancel: async () => {} }) } }) });
  assert.deepEqual(Buffer.from(result.source.raw_base64, 'base64'), bytes); assert.match(result.run.text, /café/); assert.equal(released, true);
});
test('reopen derives the actual result and ignores imported summary, IDs, HTML and status', async () => {
  const first = await make(), saved = JSON.parse(api.serializePublicTranscript(first)); saved.run = { status: 'done', runId: 'invented', html: '<img onerror=alert(1)>' }; saved.events = [];
  const result = await api.reopenPublicTranscript(JSON.stringify(saved), webcrypto, now); assert.deepEqual(result.run, first.run); assert.deepEqual(result.events, first.events); assert.equal(result.run.html, undefined);
});
for (const [name, change] of [
  ['wrong URL', value => value.source.url = 'https://attacker.invalid'], ['wrong method', value => value.source.method = 'GET'], ['signed claim', value => value.receipt.unsigned = false],
  ['digest', value => value.source.sha256 = '0'.repeat(64)], ['byte count', value => value.source.bytes++], ['base64', value => value.source.raw_base64 += '!'],
  ['future time', value => value.source.received_at_utc = '2099-01-01T00:00:00Z'], ['impossible time', value => value.source.received_at_utc = '2026-02-30T00:00:00Z'], ['unknown offset', value => value.source.received_at_utc = '2026-10-12T08:00:00-00:00'],
]) test('reopen refuses ' + name, async () => { const value = JSON.parse(api.serializePublicTranscript(await make())); change(value); await assert.rejects(api.reopenPublicTranscript(JSON.stringify(value), webcrypto, now)); });
test('saved question is explicitly viewer supplied, not cryptographically bound by response', async () => {
  const value = JSON.parse(api.serializePublicTranscript(await make())); value.question = 'A different viewer-supplied question';
  const reopened = await api.reopenPublicTranscript(JSON.stringify(value), webcrypto, now); assert.equal(reopened.question, value.question); assert.equal(reopened.source.sha256, value.source.sha256); assert.match(reopened.receipt.scope, /No trusted authorship\/time/);
});
test('paid request is held without confirmation or a second request', async () => {
  const source = events(), terminal = source.at(-1), held = [source[0], { type: 'CUSTOM', timestamp: source[0].timestamp, name: 'confirm_required', value: { tools: [{ tool: 'paid_fixture', args: {} }] } }, { ...terminal, result: { awaiting_confirmation: true } }];
  let calls = 0, last;
  const desk = api.createPublicAskController({ cryptoImpl: webcrypto, now: () => now, fetchImpl: async (_, options) => { calls++; assert.equal(JSON.parse(options.body).forwardedProps, undefined); return response(encoded(held)); }, onState: state => last = state });
  const result = await desk.ask('Synthetic paid-intent negative fixture'); assert.equal(calls, 1); assert.equal(result.run.status, 'held'); assert.equal(last.state, 'held'); assert.equal(desk.isBusy(), false);
});
for (const [name, mutate] of [
  ['missing start', value => value.shift()], ['duplicate start', value => value.splice(1, 0, value[0])], ['missing terminal', value => value.pop()], ['mismatched run', value => value.at(-1).runId = 'different'],
  ['mismatched thread', value => value.at(-1).threadId = 'different'], ['event after terminal', value => value.push(value[1])], ['missing recorded timestamp', value => delete value[1].timestamp],
  ['missing terminal result', value => delete value.at(-1).result], ['unfinished tool', value => value.splice(value.findIndex(event => event.type === 'TOOL_CALL_RESULT'), 1)],
]) test('protocol refuses ' + name, async () => { const value = events(); mutate(value); await assert.rejects(make(encoded(value))); });
test('RUN_ERROR is retained as an error, never completed success', async () => {
  const source = events(), bytes = encoded([source[0], { type: 'RUN_ERROR', timestamp: source[0].timestamp, message: 'Synthetic controlled error' }]); let last;
  const desk = api.createPublicAskController({ cryptoImpl: webcrypto, now: () => now, fetchImpl: async () => response(bytes), onState: state => last = state });
  const value = await desk.ask(question); assert.equal(value.run.status, 'error'); assert.equal(last.state, 'error'); assert.match(last.message, /controlled error/);
});
test('malformed UTF-8, JSON and incomplete framing cannot become a transcript', async () => {
  await assert.rejects(make(Uint8Array.from([0xff]))); await assert.rejects(make(new TextEncoder().encode('event: RUN_STARTED\ndata: {invalid}\n\n'))); await assert.rejects(make(body().slice(0, -1)));
});
test('UI/state/A2UI events remain inert records; consent-required is held', async () => {
  const source = events(), values = [source[0], { type: 'STATE_DELTA', timestamp: source[0].timestamp, delta: [{ op: 'add', path: '/__proto__/bad', value: true }] }, { type: 'CUSTOM', timestamp: source[0].timestamp, name: 'a2ui', value: { html: '<script>bad</script>' } }, { type: 'CUSTOM', timestamp: source[0].timestamp, name: 'consent_required', value: { intent: 'navigate' } }, source.at(-1)];
  const value = await make(encoded(values)); assert.equal(value.run.status, 'held'); assert.equal(value.run.state, undefined); assert.equal({}.bad, undefined); assert.equal(value.events.length, 5);
});
test('question/source/file/event caps refuse before success', async () => {
  let calls = 0; const f = async () => { calls++; return response(); };
  await assert.rejects(api.streamPublicAsk({ question: 'x'.repeat(1001), fetchImpl: f, cryptoImpl: webcrypto })); assert.equal(calls, 0);
  await assert.rejects(make(new Uint8Array(api.MAX_SSE_BYTES + 1))); await assert.rejects(api.reopenPublicTranscript(' '.repeat(api.MAX_TRANSCRIPT_BYTES + 1), webcrypto, now));
  const many = [{ type: 'RUN_STARTED', timestamp: 1, threadId: 'actual-fixture-thread', runId: 'actual-fixture-run' }, ...Array.from({ length: 2048 }, () => ({ type: 'UNKNOWN', timestamp: 1 }))]; await assert.rejects(make(encoded(many)));
});
for (const [name, extras] of [['redirect', { redirected: true }], ['wrong final URL', { url: 'https://attacker.invalid' }], ['non200', { status: 500 }], ['wrong type', { headers: { get: () => 'text/html' } }]]) test('transport refuses ' + name, async () => { await assert.rejects(api.streamPublicAsk({ question, cryptoImpl: webcrypto, fetchImpl: async () => response(body(), extras) })); });
test('byte overflow cancels and releases the reader', async () => {
  let cancelled = false, released = false;
  await assert.rejects(api.streamPublicAsk({ question, cryptoImpl: webcrypto, fetchImpl: async () => response(body(), { body: { getReader: () => ({ read: async () => ({ done: false, value: new Uint8Array(api.MAX_SSE_BYTES + 1) }), cancel: async () => cancelled = true, releaseLock: () => released = true }) } }) }));
  assert.equal(cancelled, true); assert.equal(released, true);
});
test('single flight, cancel and late response cannot replace cancellation', async () => {
  let calls = 0, resolve, last; const desk = api.createPublicAskController({ cryptoImpl: webcrypto, now: () => now, fetchImpl: () => { calls++; return new Promise(r => resolve = r); }, onState: state => last = state });
  const pending = desk.ask(question); await desk.ask(question); assert.equal(calls, 1); desk.cancel(); assert.equal(desk.isBusy(), false); resolve(response()); assert.equal(await pending, null); assert.equal(last.state, 'cancelled');
});
test('deadline during uncooperative fetch, body and digest restores nonbusy error state', async () => {
  for (const options of [{ fetchImpl: () => new Promise(() => {}), cryptoImpl: webcrypto }, { fetchImpl: async () => response(body(), { body: { getReader: () => ({ read: () => new Promise(() => {}), cancel: async () => {}, releaseLock() {} }) } }), cryptoImpl: webcrypto }, { fetchImpl: async () => response(), cryptoImpl: { subtle: { digest: () => new Promise(() => {}) } } }]) {
    let last; const desk = api.createPublicAskController({ ...options, timeoutMs: 10, now: () => now, onState: state => last = state });
    assert.equal(await desk.ask(question), null); assert.equal(last.state, 'error'); assert.match(last.message, /timed out/); assert.equal(desk.isBusy(), false);
  }
});
