// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { submitChat } from './chat-provider.mjs';

const cosmos = {
  MEOK_CHAT_BACKEND: 'cosmos',
  MEOK_CHAT_BASE_URL: 'https://cosmos.example',
  MEOK_CHAT_MODEL: 'configured-cosmos-model',
};
const reply = (content = 'An observed answer', extra = {}) => ({
  choices: [{ message: { role: 'assistant', content }, finish_reason: 'stop' }],
  ...extra,
});
const response = (value = reply(), init) => new Response(JSON.stringify(value), init);

test('default H.I.M. preserves the exact original envelope without Cosmos credentials', async () => {
  let calls = 0;
  const result = await submitChat({ text: 'hello', mode: 'council' }, {
    env: {
      MEOK_CHAT_BASE_URL: 'https://ignored.example', MEOK_CHAT_MODEL: 'ignored-model',
      MEOK_CHAT_API_KEY: 'secret-not-for-him',
    },
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url, 'http://127.0.0.1:8787/v1/chat/completions');
      assert.equal(options.headers.authorization, undefined);
      assert.equal(options.redirect, 'manual');
      const body = JSON.parse(options.body);
      assert.deepEqual(body, {
        model: 'meok-canonical-v1',
        messages: [{ role: 'user', content: 'hello' }],
        mode: 'council',
      });
      return response(reply('hello back', { meok_provenance: { claim: 'provider assertion' } }));
    },
  });
  assert.equal(calls, 1);
  assert.deepEqual(result, { answer: 'hello back', provenance: { claim: 'provider assertion' } });
});

test('explicit him ignores invalid Cosmos settings and preserves a LAN HIM_URL', async () => {
  const result = await submitChat({ prompt: 'hello' }, {
    env: { ...cosmos, MEOK_CHAT_BACKEND: 'him', HIM_URL: 'http://192.168.1.10:8787/',
      MEOK_CHAT_BASE_URL: 'bad', MEOK_CHAT_MODEL: '', MEOK_CHAT_API_KEY: '\r\ninvalid',
      MEOK_CHAT_MAX_TOKENS: 'invalid-and-unused-for-him' },
    fetchImpl: async (url, options) => {
      assert.equal(url, 'http://192.168.1.10:8787/v1/chat/completions');
      assert.equal(JSON.parse(options.body).mode, 'auto');
      assert.equal(options.headers.authorization, undefined);
      return response();
    },
  });
  assert.deepEqual(result, { answer: 'An observed answer', provenance: null });
});

test('H.I.M. accepts legacy error:false but still rejects errors, malformed answers and tool calls', async () => {
  const cases = [
    [reply('legacy answer', { error: false }), undefined, undefined],
    [reply('not an answer', { error: true }), 'UNCHECKABLE', 'HIM_RESPONSE_INVALID'],
    [{ error: false, choices: [] }, 'UNCHECKABLE', 'HIM_RESPONSE_INVALID'],
    [{ error: false, choices: [{ message: { content: 'pending action',
      tool_calls: [{ id: 'proposal', function: { name: 'unused', arguments: '{}' } }] } }] },
    'UNCHECKABLE', 'HIM_TOOL_CALLS_UNSUPPORTED'],
  ];
  for (const [payload, state, reason] of cases) {
    const result = await submitChat({ prompt: 'hello' }, { env: {}, fetchImpl: async () => response(payload) });
    assert.equal(result.state, state);
    assert.equal(result.reason, reason);
    if (state === undefined) assert.deepEqual(result, { answer: 'legacy answer', provenance: null });
    else assert.equal(Object.hasOwn(result, 'answer'), false);
  }
});

test('H.I.M. preserves deliberate empty strings and exactly the legacy success envelope', async () => {
  for (const answer of ['actual answer', '', ' \n ']) {
    const result = await submitChat({ prompt: 'fixture' }, {
      env: {},
      fetchImpl: async () => response(reply(answer, { meok_provenance: { reported: true } })),
    });
    assert.deepEqual(result, { answer, provenance: { reported: true } });
  }
});

test('malformed H.I.M. JSON preserves the existing HIM_REQUEST_FAILED error mapping', async () => {
  const result = await submitChat({ text: 'fixture' }, {
    env: {}, fetchImpl: async () => new Response('{broken'),
  });
  assert.equal(result.state, 'UNCHECKABLE');
  assert.equal(result.reason, 'HIM_REQUEST_FAILED');
  assert.equal(Object.hasOwn(result, 'answer'), false);
});

test('Cosmos uses only its explicit model and bounded OpenAI body; claims remain separate', async () => {
  const wire = JSON.stringify(reply('  exact answer\n', {
    model: 'provider-claims-different-model', meok_provenance: { verified: true },
  }));
  let requestText;
  const result = await submitChat({ prompt: 'a prompt', mode: 'measure' }, {
    env: { ...cosmos, MEOK_CHAT_BASE_URL: 'https://cosmos.example/v1/',
      MEOK_CHAT_API_KEY: 'test-key', MEOK_CHAT_MAX_TOKENS: '400', MEOK_CHAT_TIMEOUT_MS: '5000' },
    fetchImpl: async (url, options) => {
      assert.equal(url, 'https://cosmos.example/v1/chat/completions');
      assert.equal(options.headers.authorization, 'Bearer test-key');
      requestText = options.body;
      const body = JSON.parse(requestText);
      assert.equal(body.model, cosmos.MEOK_CHAT_MODEL);
      assert.equal(Object.hasOwn(body, 'mode'), false);
      assert.equal(body.max_tokens, 400);
      return new Response(wire);
    },
  });
  assert.equal(result.answer, '  exact answer\n');
  assert.equal(result.observation.configured_model, cosmos.MEOK_CHAT_MODEL);
  assert.equal(result.provider_reported.model, 'provider-claims-different-model');
  assert.equal(result.observation.response_sha256, createHash('sha256').update(wire).digest('hex'));
  assert.equal(result.observation.request_sha256, createHash('sha256').update(requestText).digest('hex'));
  assert.equal(result.observation.response_bytes, Buffer.byteLength(wire));
  assert.equal(result.limits.model_identity_verified, false);
  assert.equal(result.limits.model_training, false);
  assert.equal(result.limits.memory_admission, false);
  assert.equal(JSON.stringify(result).includes('test-key'), false);
});

test('incomplete, insecure or malformed configuration fails before any request', async () => {
  const invalid = [
    { ...cosmos, MEOK_CHAT_BASE_URL: undefined },
    { ...cosmos, MEOK_CHAT_MODEL: undefined },
    { ...cosmos, MEOK_CHAT_MODEL: 'bad\nmodel' },
    { ...cosmos, MEOK_CHAT_BASE_URL: 'http://public.example' },
    { ...cosmos, MEOK_CHAT_BASE_URL: 'http://localhost.evil.example' },
    { ...cosmos, MEOK_CHAT_BASE_URL: 'https://user:secret@example.com' },
    { ...cosmos, MEOK_CHAT_BASE_URL: 'https://example.com?key=secret' },
    { ...cosmos, MEOK_CHAT_BASE_URL: 'https://example.com?' },
    { ...cosmos, MEOK_CHAT_BASE_URL: 'https://example.com#fragment' },
    { ...cosmos, MEOK_CHAT_BASE_URL: 'https://example.com/#' },
    { ...cosmos, MEOK_CHAT_BASE_URL: ' https://example.com' },
    { ...cosmos, MEOK_CHAT_BASE_URL: 'https://exam\nple.com' },
    { ...cosmos, MEOK_CHAT_BASE_URL: 'file:///tmp/model' },
    { ...cosmos, MEOK_CHAT_BASE_URL: 'https://example.com/v1/chat/completions' },
    { ...cosmos, MEOK_CHAT_API_KEY: 'secret\r\nX-Header: injected' },
    { ...cosmos, MEOK_CHAT_BACKEND: 'other' },
    { ...cosmos, MEOK_CHAT_TIMEOUT_MS: '90001' },
    { ...cosmos, MEOK_CHAT_TIMEOUT_MS: 'NaN' },
    { ...cosmos, MEOK_CHAT_MAX_TOKENS: '4097' },
    { ...cosmos, MEOK_CHAT_MAX_TOKENS: '0' },
  ];
  for (const env of invalid) {
    const result = await submitChat({ prompt: 'hello' }, { env, fetchImpl: () => assert.fail('must not fetch') });
    assert.equal(result.state, 'UNCHECKABLE');
    assert.equal(result.reason, 'CHAT_CONFIG_INVALID');
    assert.equal(result.request_attempted, false);
    assert.equal(JSON.stringify(result).includes('secret'), false);
  }
});

test('loopback HTTP accepts local IPv4, IPv6 and localhost without network calls', async () => {
  for (const base of ['http://127.0.0.1:8000', 'http://[::1]:8000/v1', 'http://localhost:8000']) {
    const result = await submitChat({ prompt: 'hello' }, { env: { ...cosmos, MEOK_CHAT_BASE_URL: base }, fetchImpl: async () => response() });
    assert.equal(result.state, 'ANSWER_RECEIVED');
  }
});

test('prompt size is bounded in UTF-8 bytes, including non-ASCII input', async () => {
  for (const prompt of ['', '   ', 'é'.repeat(32_001), { text: 'not a string' }]) {
    const result = await submitChat({ prompt }, { env: cosmos, fetchImpl: () => assert.fail('must not fetch') });
    assert.equal(result.state, 'UNCHECKABLE');
    assert.equal(result.request_attempted, false);
  }
  const result = await submitChat({ prompt: 'é'.repeat(32_000) }, { env: cosmos, fetchImpl: async () => response() });
  assert.equal(result.state, 'ANSWER_RECEIVED');
  assert.equal(result.observation.prompt_bytes, 64_000);
});

test('non-2xx, empty, malformed, invalid UTF-8 and provider errors are never answers', async () => {
  const cases = [
    [() => response(reply(), { status: 500 }), 'COSMOS_HTTP_ERROR'],
    [() => new Response(null, { status: 204 }), 'COSMOS_RESPONSE_INVALID'],
    [() => new Response('{broken'), 'COSMOS_RESPONSE_INVALID'],
    [() => new Response(new Uint8Array([0xc3, 0x28])), 'COSMOS_RESPONSE_INVALID'],
    [() => response(reply('')), 'COSMOS_RESPONSE_INVALID'],
    [() => response(reply(' \n ')), 'COSMOS_RESPONSE_INVALID'],
    [() => response(reply(null)), 'COSMOS_RESPONSE_INVALID'],
    [() => response({ choices: [] }), 'COSMOS_RESPONSE_INVALID'],
    [() => response(reply('text', { error: false })), 'COSMOS_RESPONSE_INVALID'],
    [() => response(reply('text', { error: { message: 'provider secret' } })), 'COSMOS_RESPONSE_INVALID'],
  ];
  for (const [makeResponse, expected] of cases) {
    let calls = 0;
    const result = await submitChat({ prompt: 'hello' }, { env: cosmos, fetchImpl: async () => { calls++; return makeResponse(); } });
    assert.equal(result.reason, expected);
    assert.equal(result.state, 'UNCHECKABLE');
    assert.equal(Object.hasOwn(result, 'answer'), false);
    assert.equal(calls, 1);
    assert.equal(JSON.stringify(result).includes('provider secret'), false);
  }
});

test('native tool proposals are not executed or reported as completed answers', async () => {
  for (const content of [null, 'I will call a tool']) {
    const result = await submitChat({ prompt: 'hello' }, {
      env: cosmos,
      fetchImpl: async () => response({ choices: [{ message: { content, tool_calls: [{ id: 'call1', function: { name: 'anything', arguments: '{}' } }] }, finish_reason: 'tool_calls' }] }),
    });
    assert.equal(result.reason, 'COSMOS_TOOL_CALLS_UNSUPPORTED');
    assert.equal(Object.hasOwn(result, 'answer'), false);
  }
});

test('oversized declared and streamed bodies are cancelled without unbounded read', async () => {
  let cancelled = false;
  const declared = await submitChat({ prompt: 'hello' }, {
    env: cosmos,
    fetchImpl: async () => new Response(new ReadableStream({ cancel() { cancelled = true; } }), { headers: { 'content-length': String(2 * 1024 * 1024 + 1) } }),
  });
  assert.equal(declared.reason, 'COSMOS_RESPONSE_TOO_LARGE');
  assert.equal(cancelled, true);
  let chunks = 0;
  cancelled = false;
  const streamed = await submitChat({ prompt: 'hello' }, {
    env: cosmos,
    fetchImpl: async () => new Response(new ReadableStream({
      pull(controller) { chunks++; controller.enqueue(new Uint8Array(256 * 1024)); },
      cancel() { cancelled = true; },
    })),
  });
  assert.equal(streamed.reason, 'COSMOS_RESPONSE_TOO_LARGE');
  assert.equal(cancelled, true);
  assert.ok(chunks <= 10, `bounded stream reads, observed ${chunks}`);
});

test('deadline covers a fetch that never settles and a stalled response body', async () => {
  let signal;
  const waitingFetch = await submitChat({ prompt: 'hello' }, {
    env: { ...cosmos, MEOK_CHAT_TIMEOUT_MS: '20' },
    fetchImpl: (_url, options) => { signal = options.signal; return new Promise(() => {}); },
  });
  assert.equal(waitingFetch.reason, 'COSMOS_TIMEOUT');
  assert.equal(signal.aborted, true);
  let cancelled = false;
  const waitingBody = await submitChat({ prompt: 'hello' }, {
    env: { ...cosmos, MEOK_CHAT_TIMEOUT_MS: '20' },
    fetchImpl: async () => new Response(new ReadableStream({ cancel() { cancelled = true; } })),
  });
  assert.equal(waitingBody.reason, 'COSMOS_TIMEOUT');
  assert.equal(cancelled, true);
});

test('transport failure is one attempt with no fallback, retry or exception disclosure', async () => {
  let calls = 0;
  const result = await submitChat({ prompt: 'hello' }, {
    env: { ...cosmos, MEOK_CHAT_API_KEY: 'secret-key' },
    fetchImpl: async () => { calls++; throw new Error('secret-key https://user:pass@example.com'); },
  });
  assert.equal(calls, 1);
  assert.equal(result.reason, 'COSMOS_REQUEST_FAILED');
  assert.equal(result.request_attempted, true);
  assert.equal(JSON.stringify(result).includes('secret-key'), false);
  assert.equal(JSON.stringify(result).includes('user:pass'), false);
});

test('H.I.M. retains its existing error family', async () => {
  const result = await submitChat({ prompt: 'hello' }, { env: {}, fetchImpl: async () => response({}, { status: 503 }) });
  assert.equal(result.reason, 'HIM_HTTP_ERROR');
  assert.equal(result.http_status, 503);
});

async function localServer(t, handler) {
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test('real loopback HTTP redirect cannot forward the API key to a second origin', async t => {
  let targetCalls = 0;
  const target = await localServer(t, (_request, res) => { targetCalls++; res.end(JSON.stringify(reply())); });
  let originalCalls = 0;
  const original = await localServer(t, (request, res) => {
    originalCalls++;
    assert.equal(request.headers.authorization, 'Bearer only-original');
    request.resume();
    res.writeHead(307, { location: `${target}/leak` });
    res.end();
  });
  const result = await submitChat({ prompt: 'hello' }, {
    env: { ...cosmos, MEOK_CHAT_BASE_URL: original, MEOK_CHAT_API_KEY: 'only-original', MEOK_CHAT_TIMEOUT_MS: '2000' },
  });
  assert.equal(result.reason, 'COSMOS_REDIRECT_REFUSED');
  assert.equal(originalCalls, 1);
  assert.equal(targetCalls, 0);
});
