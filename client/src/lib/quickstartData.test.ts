import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseManifest, parseChallenge, readQuickstartJson, QUICKSTART_TIMEOUT_MS, QUICKSTART_MAX_BYTES } from './quickstartData';
const manifest = { resources: [{ url: 'https://councilof.ai/api/free-door', method: 'GET', description: 'Synthetic', paid_for: null }], mcp: { url: 'https://councilof.ai/mcp', free_tools: ['example'], paid_tools: [] }, verify: '/gspc-verify' };
const quote = { x402Version: 2, accepts: [{ scheme: 'exact', network: 'eip155:8453', asset: 'synthetic-asset', payTo: 'synthetic-payee', amount: '90071992547409930001' }] };
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Quickstart display projection', () => {
  it('preserves supported fields and null paid_for without guessing a charge', () => expect(parseManifest({ ...manifest, ignored: true })).toEqual(manifest));
  it('keeps a readable empty manifest distinct from missing data', () => { expect(parseManifest({ resources: [] })).toEqual({ resources: [] }); expect(parseManifest(null)).toBeNull(); });
  it.each([
    ['null resource', { resources: [null] }], ['missing URL', { resources: [{}] }],
    ['object description', { resources: [{ url: '/api/x', description: {} }] }],
    ['invalid method', { resources: [{ url: '/api/x', method: {} }] }],
    ['tool string', { resources: [], mcp: { free_tools: 'not-an-array' } }],
    ['tool object', { resources: [], mcp: { paid_tools: [{}] } }],
    ['wrong mcp shape', { resources: [], mcp: [] }],
    ['unsafe verification link', { resources: [], verify: 'javascript:alert(1)' }],
    ['unsafe MCP command URL', { resources: [], mcp: { url: "https://example.invalid/mcp';id" } }],
    ['protocol-relative link', { resources: [], verify: '//example.invalid/' }],
  ])('refuses %s without partially displaying a corpus', (_label, value) => expect(parseManifest(value)).toBeNull());
  it('accepts an unused structured verify declaration without converting it into a link', () => expect(parseManifest({ resources: [], verify: { offline: 'example' } })).toEqual({ resources: [] }));
  it('bounds the number of resources before rendering', () => expect(parseManifest({ resources: Array(1001).fill({ url: '/api/x' }) })).toBeNull());
  it('preserves large atomic-unit strings exactly', () => expect(parseChallenge(quote)?.accepts[0].amount).toBe('90071992547409930001'));
  it('supports a v1 display shape and maxAmountRequired', () => expect(parseChallenge({ x402Version: 1, accepts: [{ ...quote.accepts[0], amount: undefined, maxAmountRequired: '0' }] })?.accepts[0].maxAmountRequired).toBe('0'));
  it.each([
    ['empty options', { ...quote, accepts: [] }], ['null option', { ...quote, accepts: [null] }],
    ['object asset', { ...quote, accepts: [{ ...quote.accepts[0], asset: {} }] }],
    ['numeric amount', { ...quote, accepts: [{ ...quote.accepts[0], amount: 1 }] }],
    ['negative amount', { ...quote, accepts: [{ ...quote.accepts[0], amount: '-1' }] }],
    ['missing amount', { ...quote, accepts: [{ ...quote.accepts[0], amount: undefined }] }],
    ['unknown version', { ...quote, x402Version: 99 }],
  ])('refuses a %s preview', (_label, value) => expect(parseChallenge(value)).toBeNull());
});

describe('Quickstart bounded, one-attempt read', () => {
  it('returns validated data and leaves no timer', async () => {
    vi.useFakeTimers(); const fetcher = vi.fn(async () => response(manifest)); vi.stubGlobal('fetch', fetcher);
    expect(await readQuickstartJson('/manifest', new AbortController().signal, parseManifest)).toEqual(manifest);
    expect(fetcher).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
  });
  it('accepts 402 only when explicitly requested', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response(quote, 402)));
    expect(await readQuickstartJson('/preview', new AbortController().signal, parseChallenge, 402)).toEqual(quote);
    expect(await readQuickstartJson('/preview', new AbortController().signal, parseChallenge)).toBeNull();
  });
  it.each(['text/html', 'application/json-fake'])('rejects %s instead of interpreting it as JSON', async type => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(manifest), { headers: { 'content-type': type } })));
    expect(await readQuickstartJson('/manifest', new AbortController().signal, parseManifest)).toBeNull();
  });
  it('keeps HTTP failure distinct from an empty manifest and does not retry', async () => {
    const f = vi.fn(async () => response({ resources: [] }, 503)); vi.stubGlobal('fetch', f);
    expect(await readQuickstartJson('/manifest', new AbortController().signal, parseManifest)).toBeNull(); expect(f).toHaveBeenCalledTimes(1);
  });
  it('refuses invalid UTF-8', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([0xc3, 0x28]), { headers: { 'content-type': 'application/json' } })));
    expect(await readQuickstartJson('/manifest', new AbortController().signal, parseManifest)).toBeNull();
  });
  it('refuses malformed JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{', { headers: { 'content-type': 'application/json' } })));
    expect(await readQuickstartJson('/manifest', new AbortController().signal, parseManifest)).toBeNull();
  });
  it('enforces the actual streamed-byte limit rather than Content-Length', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(' '.repeat(QUICKSTART_MAX_BYTES + 1), { headers: { 'content-type': 'application/json', 'content-length': '1' } })));
    expect(await readQuickstartJson('/manifest', new AbortController().signal, parseManifest)).toBeNull();
  });
  it('ends a stalled fetch at the declared deadline', async () => {
    vi.useFakeTimers(); const f = vi.fn(() => new Promise<Response>(() => {})); vi.stubGlobal('fetch', f);
    const read = readQuickstartJson('/manifest', new AbortController().signal, parseManifest);
    await vi.advanceTimersByTimeAsync(QUICKSTART_TIMEOUT_MS); expect(await read).toBeNull(); expect(f).toHaveBeenCalledTimes(1); expect(vi.getTimerCount()).toBe(0);
  });
  it('also bounds a stalled response body', async () => {
    vi.useFakeTimers(); let streamControl: ReadableStreamDefaultController<Uint8Array> | undefined;
    const body = new ReadableStream<Uint8Array>({ start(c) { streamControl = c; } });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(body, { headers: { 'content-type': 'application/json' } })));
    const read = readQuickstartJson('/manifest', new AbortController().signal, parseManifest);
    await vi.advanceTimersByTimeAsync(QUICKSTART_TIMEOUT_MS); expect(await read).toBeNull(); streamControl!.close(); expect(vi.getTimerCount()).toBe(0);
  });
  it('does not request an already-aborted read', async () => {
    const f = vi.fn(); vi.stubGlobal('fetch', f); const c = new AbortController(); c.abort();
    expect(await readQuickstartJson('/manifest', c.signal, parseManifest)).toBeNull(); expect(f).not.toHaveBeenCalled();
  });
  it('resolves cancellation even if a test transport ignores abort', async () => {
    vi.useFakeTimers(); vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
    const c = new AbortController(); const read = readQuickstartJson('/manifest', c.signal, parseManifest); c.abort();
    expect(await read).toBeNull(); expect(vi.getTimerCount()).toBe(0);
  });
  it('does not parse a delayed response after cancellation', async () => {
    let finish: (v: Response) => void = () => {}; const parse = vi.fn(parseManifest);
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { finish = resolve; })));
    const c = new AbortController(); const read = readQuickstartJson('/manifest', c.signal, parse); c.abort();
    expect(await read).toBeNull(); finish(response(manifest)); await Promise.resolve(); await Promise.resolve(); expect(parse).not.toHaveBeenCalled();
  });
});
