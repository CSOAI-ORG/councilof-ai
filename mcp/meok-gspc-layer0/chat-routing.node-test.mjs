// SPDX-License-Identifier: Apache-2.0
// Exercise the actual stdio bridge against two local HTTP fixtures only.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const serverFile = fileURLToPath(new URL('./server.mjs', import.meta.url));
const answer = (content, model) => ({
  model,
  choices: [{ message: { role: 'assistant', content }, finish_reason: 'stop' }],
});

async function endpoint(t, respond) {
  const requests = [];
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    requests.push({ method: request.method, path: request.url,
      headers: request.headers, body: raw ? JSON.parse(raw) : null });
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(respond(requests.at(-1))));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });
  return { url: `http://127.0.0.1:${server.address().port}`, requests };
}

function bridge(t, settings) {
  // Do not inherit real provider keys, NODE_OPTIONS or operator runtime config.
  const child = spawn(process.execPath, [serverFile], {
    env: { PATH: process.env.PATH, MEOK_CHAT_TIMEOUT_MS: '1000', ...settings },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const exited = once(child, 'exit');
  let stderr = '';
  child.stderr.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-8000); });
  const pending = new Map();
  const lines = createInterface({ input: child.stdout });
  lines.on('line', line => {
    const response = JSON.parse(line);
    const awaiting = pending.get(response.id);
    if (awaiting) {
      pending.delete(response.id);
      clearTimeout(awaiting.timeout);
      awaiting.resolve(response);
    }
  });
  child.on('exit', code => {
    for (const awaiting of pending.values()) {
      clearTimeout(awaiting.timeout);
      awaiting.reject(new Error(`Bridge exited (${code}): ${stderr}`));
    }
    pending.clear();
  });
  t.after(async () => {
    child.stdin.end();
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    await exited;
    lines.close();
  });
  let nextId = 1;
  return async (name, args) => {
    const id = nextId++;
    const reply = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Bridge call ${name} timed out: ${stderr}`));
      }, 3000);
      pending.set(id, { resolve, reject, timeout });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call',
        params: { name, arguments: args } }) + '\n');
    });
    assert.equal(reply.error, undefined);
    return { rpc: reply.result, value: JSON.parse(reply.result.content[0].text) };
  };
}

test('stdio routing keeps Cosmos inference separate from coordinator chat and work telemetry', async t => {
  const cosmos = await endpoint(t, () => answer('cosmos text', 'provider-cosmos-model'));
  const him = await endpoint(t, request => request.path === '/api/workstream-telemetry'
    ? { saved: true } : answer('coordinator text', 'provider-him-model'));
  const call = bridge(t, {
    HIM_URL: him.url,
    MEOK_CHAT_BACKEND: 'cosmos', MEOK_CHAT_BASE_URL: cosmos.url,
    MEOK_CHAT_MODEL: 'configured-cosmos-model', MEOK_CHAT_API_KEY: 'cosmos-only-test-key',
  });

  const inference = await call('meok_route_to_clan', { prompt: 'reason about this', mode: 'council' });
  assert.equal(inference.rpc.isError, undefined);
  assert.equal(inference.value.answer, 'cosmos text');
  assert.equal(inference.value.observation.backend, 'cosmos');
  const coordinator = await call('him_say', { text: 'coordinate this' });
  assert.equal(coordinator.rpc.isError, undefined);
  assert.equal(coordinator.value.answer, 'coordinator text');
  assert.equal(coordinator.value.observation.backend, 'him');
  const telemetry = await call('meok_gspc_evaluate_work_step', {
    platform: 'fixture-platform', task_summary: 'fixture work step', exit_code: 0,
  });
  assert.equal(telemetry.rpc.isError, undefined);
  assert.equal(telemetry.value.recording.state, 'HTTP_ACCEPTED');
  assert.equal(telemetry.value.recording.persistence, 'UNVERIFIED');
  assert.equal(telemetry.value.entry.measurement_state, 'UNMEASURED');

  assert.equal(cosmos.requests.length, 1);
  assert.equal(cosmos.requests[0].path, '/v1/chat/completions');
  assert.equal(cosmos.requests[0].headers.authorization, 'Bearer cosmos-only-test-key');
  assert.equal(cosmos.requests[0].body.model, 'configured-cosmos-model');
  assert.equal(Object.hasOwn(cosmos.requests[0].body, 'mode'), false);
  assert.deepEqual(him.requests.map(request => request.path), ['/v1/chat/completions', '/api/workstream-telemetry']);
  assert.equal(him.requests[0].body.model, 'meok-canonical-v1');
  assert.equal(him.requests[0].body.mode, 'auto');
  assert.equal(him.requests[0].body.messages[0].content, 'coordinate this');
  assert.ok(him.requests.every(request => request.headers.authorization === undefined));
  assert.equal(JSON.stringify(him.requests).includes('cosmos-only-test-key'), false);
});

test('broken Cosmos configuration closes only the inference route and preserves coordinator access', async t => {
  const cosmos = await endpoint(t, () => answer('must not be reached'));
  const him = await endpoint(t, () => answer('coordinator remains available'));
  const call = bridge(t, {
    HIM_URL: him.url,
    MEOK_CHAT_BACKEND: 'cosmos', MEOK_CHAT_BASE_URL: cosmos.url,
    MEOK_CHAT_MODEL: '', MEOK_CHAT_API_KEY: 'must-not-reach-him',
  });
  const inference = await call('meok_route_to_clan', { prompt: 'reason about this' });
  assert.equal(inference.rpc.isError, true);
  assert.equal(inference.value.reason, 'CHAT_CONFIG_INVALID');
  assert.equal(inference.value.request_attempted, false);
  const coordinator = await call('him_say', { text: 'coordinate this' });
  assert.equal(coordinator.value.answer, 'coordinator remains available');
  assert.equal(cosmos.requests.length, 0);
  assert.equal(him.requests.length, 1);
  assert.equal(him.requests[0].headers.authorization, undefined);
});

test('pending native model tool calls propagate as MCP errors without another dispatch', async t => {
  const cosmos = await endpoint(t, () => ({ choices: [{ finish_reason: 'tool_calls',
    message: { role: 'assistant', content: null,
      tool_calls: [{ id: 'proposal-only', type: 'function', function: { name: 'zcode_desktop', arguments: '{}' } }] },
  }] }));
  const him = await endpoint(t, () => answer('must not be called'));
  const call = bridge(t, {
    HIM_URL: him.url, MEOK_CHAT_BACKEND: 'cosmos', MEOK_CHAT_BASE_URL: cosmos.url,
    MEOK_CHAT_MODEL: 'configured-cosmos-model',
  });
  const result = await call('meok_route_to_clan', { prompt: 'reason about this' });
  assert.equal(result.rpc.isError, true);
  assert.equal(result.value.reason, 'COSMOS_TOOL_CALLS_UNSUPPORTED');
  assert.equal(Object.hasOwn(result.value, 'answer'), false);
  assert.equal(cosmos.requests.length, 1);
  assert.equal(him.requests.length, 0);
});
