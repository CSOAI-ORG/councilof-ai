import { expect, it } from 'vitest';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

// Isolated localhost fixtures only: no active coordinator, model or desktop tool executes.
async function callBridge(name: string, args: object, respond: (req: IncomingMessage, res: ServerResponse) => void, envOverride: Record<string, string> = {}) {
  const server = createServer((req, res) => { req.resume(); respond(req, res); });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  const endpoint = `http://127.0.0.1:${address.port}`;
  const child = spawn(process.execPath, [fileURLToPath(new URL('./server.mjs', import.meta.url))], {
    env: { ...process.env, HIM_URL: endpoint, DC_BRIDGE_URL: endpoint, ...envOverride }, stdio: ['pipe', 'pipe', 'pipe'],
  });
  const lines = createInterface({ input: child.stdout });
  try {
    const reply = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('fixture stdio timeout')), 3000);
      lines.once('line', line => { clearTimeout(timer); try { resolve(JSON.parse(line)); } catch (e) { reject(e); } });
      child.once('error', e => { clearTimeout(timer); reject(e); });
    });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) + '\n');
    return (await reply).result;
  } finally {
    lines.close(); child.kill();
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}
const jsonReply = (value: unknown, status = 200) => (_req: IncomingMessage, res: ServerResponse) => {
  res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(value));
};
const body = (result: any) => JSON.parse(result.content[0].text);

it.each(['him_say', 'meok_route_to_clan'])('%s exposes coordinator HTTP failure as an outer MCP error', async name => {
  const result = await callBridge(name, { text: 'fixture', prompt: 'fixture' }, jsonReply({ error: { message: 'private-provider-detail' } }, 503));
  expect(result.isError).toBe(true);
  expect(body(result)).toMatchObject({ state: 'UNCHECKABLE', reason: 'HIM_HTTP_ERROR', http_status: 503 });
  expect(body(result)).not.toHaveProperty('answer');
  expect(JSON.stringify(result)).not.toContain('private-provider-detail');
});

it.each([{ error: { message: 'provider error' } }, {}, { choices: [{ message: { content: null } }] }])('does not project an invalid successful HTTP body as an empty answer: %j', async value => {
  const result = await callBridge('him_say', { text: 'fixture' }, jsonReply(value));
  expect(result.isError).toBe(true);
  expect(body(result).reason).toBe('HIM_RESPONSE_INVALID');
});

it('surfaces malformed coordinator JSON as an execution error', async () => {
  const result = await callBridge('him_say', { text: 'fixture' }, (_req, res) => { res.end('{broken'); });
  expect(result.isError).toBe(true);
  expect(body(result).reason).toBe('HIM_REQUEST_FAILED');
});

it.each(['actual answer', ''])('preserves a successful provider answer including a deliberate empty string: %j', async answer => {
  const result = await callBridge('him_say', { text: 'fixture' }, jsonReply({ choices: [{ message: { content: answer } }], meok_provenance: { reported: true } }));
  expect(result.isError).not.toBe(true);
  expect(body(result)).toEqual({ answer, provenance: { reported: true } });
});

it('surfaces coordinator connection failure as an outer MCP error', async () => {
  const result = await callBridge('him_say', { text: 'fixture' }, req => { req.socket.destroy(); });
  expect(result.isError).toBe(true);
  expect(body(result).reason).toBe('HIM_REQUEST_FAILED');
});

it.each([true, false])('preserves downstream desktop tool isError=%s at the outer MCP boundary', async isError => {
  const downstream = { isError, content: [{ type: 'text', text: isError ? 'permission denied' : 'fixture output' }] };
  const result = await callBridge('zcode_desktop', { op: 'call', tool: 'list_devices' }, jsonReply({ jsonrpc: '2.0', id: 2, result: downstream }));
  expect(Boolean(result.isError)).toBe(isError);
  expect(body(result).result).toEqual(downstream);
});

it.each(['list', 'call'])('preserves desktop JSON-RPC errors for %s', async op => {
  const result = await callBridge('zcode_desktop', op === 'list' ? { op: 'list' } : { op: 'call', tool: 'list_devices' }, jsonReply({ jsonrpc: '2.0', id: 2, error: { code: -32000, message: 'private-desktop-detail' } }));
  expect(result.isError).toBe(true);
  expect(body(result).reason).toBe('DESKTOP_RPC_ERROR');
  expect(JSON.stringify(result)).not.toContain('private-desktop-detail');
});

it('discovery never advertises ungranted host execution or file access', async () => {
  const result = await callBridge('zcode_desktop', { op: 'list' },
    jsonReply({ jsonrpc: '2.0', id: 1, result: { tools: [
      { name: 'start_process' }, { name: 'read_file' }, { name: 'list_devices' },
    ] } }));
  expect(result.isError).not.toBe(true);
  expect(body(result)).toMatchObject({ tools: ['list_devices'], authority: 'READ_ONLY_METADATA' });
  expect(JSON.stringify(result)).not.toContain('start_process');
  expect(JSON.stringify(result)).not.toContain('read_file');
});

it.each([
  'http://example.test/mcp',
  'http://localhost.evil.test/mcp',
  'http://127.0.0.1:8765/not-mcp',
  'http://user:pass@127.0.0.1:8765/mcp',
  'http://127.0.0.1:8765/mcp?tool=call',
])('refuses an unqualified desktop bridge origin: %s', async badOrigin => {
  let contacted = false;
  const result = await callBridge('zcode_desktop', { op: 'call', tool: 'list_devices' },
    (_req, res) => { contacted = true; res.end('{}'); }, { DC_BRIDGE_URL: badOrigin });
  expect(result.isError).toBe(true);
  expect(body(result).error).toBe('desktop_bridge_origin_not_qualified');
  expect(contacted).toBe(false);
});

it('empty desktop discovery fails closed rather than advertising a capability', async () => {
  const result = await callBridge('zcode_desktop', { op: 'list' },
    jsonReply({ jsonrpc: '2.0', id: 1, result: { tools: [] } }));
  expect(result.isError).toBe(true);
  expect(body(result).reason).toBe('DESKTOP_READ_ONLY_TOOL_UNAVAILABLE');
});

it('oversized desktop response fails closed without exposing payload', async () => {
  const result = await callBridge('zcode_desktop', { op: 'list' },
    (_req, res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end('x'.repeat(1_048_577)); });
  expect(result.isError).toBe(true);
  expect(body(result).reason).toBe('DESKTOP_REQUEST_FAILED');
  expect(JSON.stringify(result).length).toBeLessThan(1000);
});

it('does not treat an HTTP desktop failure containing result-shaped JSON as successful execution', async () => {
  const result = await callBridge('zcode_desktop', { op: 'call', tool: 'list_devices' }, jsonReply({ result: { content: [] } }, 503));
  expect(result.isError).toBe(true);
  expect(body(result)).toMatchObject({ reason: 'DESKTOP_HTTP_ERROR', http_status: 503 });
});

it('rejects a desktop response with no result', async () => {
  const result = await callBridge('zcode_desktop', { op: 'call', tool: 'list_devices' }, jsonReply({ jsonrpc: '2.0', id: 2 }));
  expect(result.isError).toBe(true);
  expect(body(result).reason).toBe('DESKTOP_RESPONSE_INVALID');
});

it.each([
  { op: 'call' },
  { op: 'call', tool: 'start_process', arguments: { command: 'some command' } },
  { op: 'call', tool: 'read_file', arguments: { path: '/private' } },
  { op: 'call', tool: 'list_devices', arguments: { extra: true } },
  { op: 'call', tool: 'list_devices', arguments: null },
  { op: 'list', tool: 'start_process' },
  { op: 'call', tool: 'list_devices', grant: 'asserted-by-model' },
])('refuses unqualified desktop call before contacting the host: %j', async args => {
  let requested = false;
  const result = await callBridge('zcode_desktop', args, (_req, res) => { requested = true; res.end('{}'); });
  expect(result.isError).toBe(true);
  expect(body(result).state).toBe('REFUSED');
  expect(requested).toBe(false);
});

it('never echoes private caller-selected identifiers from an unexpected tool exception', async () => {
  const marker = 'private-caller-secret-marker';
  const result = await callBridge(marker, {}, (_req, res) => { res.end('{}'); });
  expect(result.isError).toBe(true);
  expect(body(result)).toEqual({ state: 'UNCHECKABLE', reason: 'TOOL_EXECUTION_ERROR' });
  expect(JSON.stringify(result)).not.toContain(marker);
});

it('surfaces a desktop connection failure as an outer MCP error', async () => {
  const result = await callBridge('zcode_desktop', { op: 'call', tool: 'list_devices' }, req => { req.socket.destroy(); });
  expect(result.isError).toBe(true);
  expect(body(result).reason).toBe('DESKTOP_REQUEST_FAILED');
});
