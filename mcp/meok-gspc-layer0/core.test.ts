import { afterEach, describe, expect, it, vi } from 'vitest';
import fs, { appendFileSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { prepareWorkStep, submitWorkStep, readCapabilitySnapshot } from './core.mjs';

const args = { platform: 'fixture-executor', task_summary: 'Isolated fixture command' };
const now = '2026-11-06T00:00:00Z';
const dirs: string[] = [];
const directory = () => { const p = mkdtempSync(join(tmpdir(), 'meok-source-fixture-')); dirs.push(p); return p; };
afterEach(() => { vi.restoreAllMocks(); for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe('Caller outcomes and transport are separate evidence', () => {
  it('keeps an omitted exit code unknown and a caller axis tag unvalidated', () => {
    expect(prepareWorkStep(args, now)).toMatchObject({ exit_code: null, verdict: 'UNCHECKABLE', axis: null, task_correctness: 'NOT_ASSESSED', measurement_state: 'UNMEASURED', signed: false });
    expect(prepareWorkStep({ ...args, axis: 'caller-private-tag', exit_code: 0 }, now)).toMatchObject({ verdict: 'PASS', verdict_scope: 'CALLER_REPORTED_COMMAND_EXIT_ONLY', axis_validation: 'NOT_PERFORMED', signature: null });
    expect(prepareWorkStep({ ...args, exit_code: 9 }, now).verdict).toBe('FAIL');
  });

  it.each([null, '0', false, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid exit code %s before any POST', async exit_code => {
    const fetchImpl = vi.fn();
    await expect(submitWorkStep({ ...args, exit_code }, { endpoint: 'https://example.test', fetchImpl, now })).rejects.toThrow('exit_code');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('requires real platform and summary fields before any POST', async () => {
    const fetchImpl = vi.fn();
    await expect(submitWorkStep({ platform: ' ', task_summary: 'x' }, { endpoint: 'https://example.test', fetchImpl })).rejects.toThrow('platform');
    await expect(submitWorkStep({ platform: 'x', task_summary: '' }, { endpoint: 'https://example.test', fetchImpl })).rejects.toThrow('task_summary');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('reports HTTP acceptance without trusting a receiver claim of persistence, signing or a different verdict', async () => {
    const fetchImpl = vi.fn(async () => Response.json({ persisted: true, signed: true, verdict: 'PASS' }, { status: 201 }));
    const value = await submitWorkStep({ ...args, exit_code: 7 }, { endpoint: 'https://example.test/prefix/', fetchImpl, now });
    expect(value.entry.verdict).toBe('FAIL');
    expect(value.entry.signed).toBe(false);
    expect(value.recording).toEqual({ state: 'HTTP_ACCEPTED', reason: 'DURABLE_STORAGE_NOT_VERIFIED', http_status: 201, persistence: 'UNVERIFIED', local_fallback: false });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, options] = fetchImpl.mock.calls[0] as any;
    expect(url.href).toBe('https://example.test/prefix/api/workstream-telemetry');
    expect(JSON.parse(options.body)).toMatchObject({ exit_code: 7, verdict: 'FAIL', measurement_state: 'UNMEASURED' });
  });

  it('does not mistake an HTTP error or a timeout after possible delivery for recorded or absent data', async () => {
    for (const fetchImpl of [vi.fn(async () => new Response('unavailable', { status: 503 })), vi.fn(async () => { throw new Error('request may have reached server: secret-url'); })]) {
      const value = await submitWorkStep({ ...args, exit_code: 0 }, { endpoint: 'https://example.test', fetchImpl, now });
      expect(value.recording).toMatchObject({ state: 'UNCONFIRMED', persistence: 'UNVERIFIED', local_fallback: false });
      expect(value.entry.verdict).toBe('PASS');
      expect(JSON.stringify(value)).not.toContain('secret-url');
      expect(fetchImpl).toHaveBeenCalledOnce(); // No retry or invented local append.
    }
  });

  it('never follows a telemetry redirect to a successful login page', async () => {
    const visited: string[] = [];
    const server = createServer((req, res) => {
      visited.push(`${req.method} ${req.url}`); req.resume();
      if (req.url === '/api/workstream-telemetry') { res.writeHead(302, { location: '/login' }); res.end(); }
      else { res.writeHead(200); res.end('login page'); }
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address() as { port: number };
      const result = await submitWorkStep({ ...args, exit_code: 0 }, { endpoint: `http://127.0.0.1:${address.port}`, now });
      expect(result.recording.state).toBe('UNCONFIRMED');
      expect(visited).toEqual(['POST /api/workstream-telemetry']);
    } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
  });
});

describe('Capability readers retain unavailable and static-snapshot states', () => {
  const filename = 'meok-fleet-fixture.json';
  const fields = { summary: 'summary', topology: 'cluster_topology' };
  it('returns null data for a missing artifact and creates no fallback report', () => {
    const dir = directory();
    expect(readCapabilitySnapshot(dir, filename, fields)).toMatchObject({ state: 'UNCHECKABLE', reason: 'ARTIFACT_NOT_FOUND', data: null, source: { declared_as_of: null, bytes_sha256: null } });
  });
  it.each(['{broken', 'null', '[]', '{}'])('keeps an invalid or unrelated snapshot uncheckable: %s', text => {
    const dir = directory(); writeFileSync(join(dir, filename), text);
    expect(readCapabilitySnapshot(dir, filename, fields)).toMatchObject({ state: 'UNCHECKABLE', data: null });
  });
  it('hashes the actual bytes and preserves the old declared epoch without treating it as live', () => {
    const dir = directory();
    const bytes = JSON.stringify({ as_of: '2020-01-01T00:00:00Z', summary: { declared: 7 }, ignored: 'not projected' });
    writeFileSync(join(dir, filename), bytes);
    const value = readCapabilitySnapshot(dir, filename, fields);
    expect(value).toMatchObject({ state: 'STATIC_OBSERVED', source: { declared_as_of: '2020-01-01T00:00:00Z', bytes_sha256: createHash('sha256').update(bytes).digest('hex') }, data: { summary: { declared: 7 }, topology: null } });
    expect(JSON.stringify(value)).not.toContain('not projected');
    expect(value.limitations.join(' ')).toContain('does not establish current workers');
    expect(readFileSync(join(dir, filename), 'utf8')).toBe(bytes);
  });
  it.skipIf(process.platform === 'win32')('rejects symlinks and a FIFO without blocking the MCP process', () => {
    const dir = directory(); const target = join(dir, 'real.json');
    writeFileSync(target, '{"summary":{}}'); symlinkSync(target, join(dir, filename));
    expect(readCapabilitySnapshot(dir, filename, fields).state).toBe('UNCHECKABLE');
    rmSync(join(dir, filename)); execFileSync('mkfifo', [join(dir, filename)]);
    const script = 'const m=await import(process.argv[1]);process.stdout.write(JSON.stringify(m.readCapabilitySnapshot(process.argv[2],process.argv[3],{summary:"summary"})));';
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', script, new URL('./core.mjs', import.meta.url).href, dir, filename], { timeout: 2000, encoding: 'utf8' });
    expect(child.error).toBeUndefined();
    expect(child.status).toBe(0);
    expect(JSON.parse(child.stdout)).toMatchObject({ state: 'UNCHECKABLE', reason: 'ARTIFACT_NOT_REGULAR_FILE', data: null });
  });
  it('caps a file that grows after its initial stat instead of reading to unbounded EOF', () => {
    const dir = directory(); const file = join(dir, filename); writeFileSync(file, '{"summary":{}}');
    const originalStat = fs.fstatSync.bind(fs);
    vi.spyOn(fs, 'fstatSync').mockImplementationOnce((fd: any) => {
      const before = originalStat(fd); appendFileSync(file, Buffer.alloc(4 * 1024 * 1024 + 100)); return before as any;
    });
    const reads = vi.spyOn(fs, 'readSync');
    expect(readCapabilitySnapshot(dir, filename, fields)).toMatchObject({ state: 'UNCHECKABLE', reason: 'ARTIFACT_TOO_LARGE', data: null });
    const bytesRead = reads.mock.results.reduce((sum, result) => sum + (result.type === 'return' ? Number(result.value) : 0), 0);
    expect(bytesRead).toBe(4 * 1024 * 1024 + 1);
  });
});

it('the candidate MCP entry preserves tool IDs and exposes unknown outcomes and missing artifacts over stdio', async () => {
  const requests: any[] = [];
  const http = createServer((req, res) => {
    let text = ''; req.on('data', chunk => text += chunk); req.on('end', () => {
      requests.push(JSON.parse(text)); res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"saved":true}');
    });
  });
  await new Promise<void>(resolve => http.listen(0, '127.0.0.1', resolve));
  const address = http.address() as { port: number };
  const child = spawn(process.execPath, [fileURLToPath(new URL('./server.mjs', import.meta.url))], {
    env: { ...process.env, HIM_URL: `http://127.0.0.1:${address.port}`, MEOK_CAPABILITY_DIR: directory() },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const pending = new Map<number | null, (reply: any) => void>();
  const lines = createInterface({ input: child.stdout });
  lines.on('line', line => { const reply = JSON.parse(line); pending.get(reply.id)?.(reply); pending.delete(reply.id); });
  let id = 0;
  const rpc = (method: string, params?: any) => new Promise<any>(resolve => {
    const key = ++id; pending.set(key, resolve); child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: key, method, params }) + '\n');
  });
  try {
    const invalidEnvelope = new Promise<any>(resolve => { pending.set(null, resolve); child.stdin.write('null\n'); });
    expect((await invalidEnvelope).error.code).toBe(-32600);
    const invalidJson = new Promise<any>(resolve => { pending.set(null, resolve); child.stdin.write('{broken\n'); });
    expect((await invalidJson).error.code).toBe(-32700);
    const invalidId = new Promise<any>(resolve => { pending.set(null, resolve); child.stdin.write('{"jsonrpc":"2.0","id":null,"method":"tools/list"}\n'); });
    expect((await invalidId).error.code).toBe(-32600);
    const list = (await rpc('tools/list')).result.tools;
    expect(list.map((tool: any) => tool.name)).toEqual(['meok_read_gspc_evidence', 'meok_gspc_evaluate_work_step', 'meok_route_to_clan', 'meok_workstream_benchmark_report', 'meok_layer0_flywheel_status', 'meok_fleet_catalog', 'him_say', 'zcode_desktop']);
    expect(JSON.stringify(list)).not.toMatch(/20,600|414 suites|77-artefact|3\.2 TB/);
    const submitted = await rpc('tools/call', { name: 'meok_gspc_evaluate_work_step', arguments: args });
    expect(JSON.parse(submitted.result.content[0].text)).toMatchObject({ entry: { exit_code: null, verdict: 'UNCHECKABLE' }, recording: { state: 'HTTP_ACCEPTED', persistence: 'UNVERIFIED' } });
    expect(requests).toHaveLength(1);
    expect(requests[0].exit_code).toBeNull();
    const invalid = await rpc('tools/call', { name: 'meok_gspc_evaluate_work_step', arguments: { ...args, exit_code: '0' } });
    expect(invalid.result.isError).toBe(true);
    expect(requests).toHaveLength(1);
    const missing = await rpc('tools/call', { name: 'meok_fleet_catalog', arguments: {} });
    expect(missing.result.isError).toBe(true);
    expect(JSON.parse(missing.result.content[0].text)).toMatchObject({ state: 'UNCHECKABLE', data: null });
  } finally {
    lines.close(); child.kill();
    await new Promise<void>(resolve => http.close(() => resolve()));
  }
});

