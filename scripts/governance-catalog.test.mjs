import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { catalogResult } from '../mcp/csoai-governance/catalog.mjs';

const ok = (json) => ({ ok: true, status: 200, json });
const zero = JSON.parse(readFileSync(new URL('../mcp/csoai-governance/fixtures/catalog-zero.json', import.meta.url), 'utf8'));

// The retained public 200 response was read on 2026-10-08. Its probe_finished remains
// 2026-09-30: transport freshness does not make that historical probe a new measurement.
describe('Governance MCP published catalogue search contract', () => {
  it('preserves the retained zero-match search without returning global tool names', async () => {
    expect(await catalogResult(ok(zero))).toEqual({ total: 0, showing: 0, matches: [] });
  });
  it('keeps zero total separate from catalogue_total and distinct_tools', async () => {
    expect(await catalogResult(ok({ total: 0, tools: [], catalogue_total: 38, distinct_tools: ['unrelated'] })))
      .toEqual({ total: 0, showing: 0, matches: [] });
  });
  it('returns canonical nonzero matches and keeps server-tool row counts', async () => {
    expect(await catalogResult(ok({ total: 2, tools: [{ name: 'board_totals', server: 'http' }, { name: 'board_totals', server: 'stdio' }], distinct_tool_names: 1 })))
      .toEqual({ total: 2, showing: 2, matches: [{ name: 'board_totals' }, { name: 'board_totals' }] });
  });
  it('caps displayed matches at 25 while preserving the complete query total', async () => {
    const tools = Array.from({ length: 26 }, (_, i) => ({ name: `tool-${i}` }));
    const result = await catalogResult(ok({ total: 26, tools }));
    expect(result).toEqual({ total: 26, showing: 25, matches: tools.slice(0, 25) });
  });
  it('rejects a non-OK JSON response rather than presenting success', async () => {
    await expect(async () => catalogResult({ ok: false, status: 503, json: { total: 0, tools: [] } })).rejects.toThrow('unreachable (status 503)');
  });
  it('rejects a non-JSON response', async () => {
    await expect(async () => catalogResult({ ok: true, status: 200, json: null })).rejects.toThrow('unreachable (status 200)');
  });
  for (const [label, json] of [
    ['missing tools with inventory present', { total: 0, distinct_tools: ['unrelated'] }],
    ['missing total', { tools: [] }],
    ['legacy matches-only payload', { total: 1, matches: [{ name: 'unsupported' }] }],
    ['tools object', { total: 0, tools: {} }],
    ['array payload', []],
    ['string payload', 'not a catalogue'],
    ['string total', { total: '0', tools: [] }],
    ['negative total', { total: -1, tools: [] }],
    ['non-finite total', { total: Infinity, tools: [] }],
    ['fractional total', { total: 0.5, tools: [] }],
    ['total-row disagreement', { total: 0, tools: [{ name: 'unexpected' }] }],
    ['nameless row', { total: 1, tools: [{}] }],
    ['null row', { total: 1, tools: [null] }],
    ['string row', { total: 1, tools: ['unsupported'] }],
    ['blank name', { total: 1, tools: [{ name: '  ' }] }],
  ]) {
    it(`rejects malformed ${label} without inventing a result`, async () => {
      await expect(async () => catalogResult(ok(json))).rejects.toThrow('malformed');
    });
  }
  it('ships its mapper in the published package files', () => {
    const packageJson = JSON.parse(readFileSync(new URL('../mcp/csoai-governance/package.json', import.meta.url), 'utf8'));
    expect(packageJson.files).toContain('catalog.mjs');
  });
});

// Exercise the exact registered callback and its out/err serialization without
// loading the SDK, connecting a transport, or calling a remote endpoint. This
// is handler-level acceptance, not a claim of SDK/wire or installed-client use.
const handlerSource = readFileSync(new URL('../mcp/csoai-governance/index.mjs', import.meta.url), 'utf8');
const registered = 'server.setRequestHandler(CallToolRequestSchema, async (req) => {';
const handlerStart = handlerSource.indexOf(registered);
const handlerEnd = handlerSource.indexOf('\n});\n\nconst transport', handlerStart);
if (handlerStart < 0 || handlerEnd < 0) throw new Error('Registered CallTool callback boundary unavailable');
const callbackBody = handlerSource.slice(handlerStart + registered.length, handlerEnd);
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const callback = new AsyncFunction('req', 'api', 'out', 'err', 'catalogResult', 'GW', 'BAD', callbackBody);
const sourceArrow = (name) => {
  const match = handlerSource.match(new RegExp(`^const ${name} = (.+);$`, 'm'));
  if (!match) throw new Error(`Actual ${name} serialization unavailable`);
  return Function(`return (${match[1]});`)();
};
const actualOut = sourceArrow('out');
const actualErr = sourceArrow('err');
const callCatalog = (response, query = 'eu ai act') => {
  const paths = [];
  const api = async (path, body) => { paths.push({ path, body }); return response; };
  return callback({ params: { name: 'csoai_catalog', arguments: { query } } }, api,
    actualOut, actualErr, catalogResult, 'https://councilof.ai/api', /never-match-test/)
    .then((result) => ({ result, paths }));
};

describe('Governance MCP actual catalogue callback and serialization', () => {
  it('serializes the retained zero-match result and sends only the encoded catalog GET path', async () => {
    const { result, paths } = await callCatalog(ok(zero));
    expect(paths).toEqual([{ path: '/tools?q=eu%20ai%20act', body: undefined }]);
    expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify({ total: 0, showing: 0, matches: [] }, null, 2) }] });
    expect(result.isError).toBeUndefined();
  });
  it('serializes positive matches with the existing text envelope', async () => {
    const { result } = await callCatalog(ok({ total: 1, tools: [{ name: 'board_totals' }] }), 'board');
    expect(JSON.parse(result.content[0].text)).toEqual({ total: 1, showing: 1, matches: [{ name: 'board_totals' }] });
    expect(result.isError).toBeUndefined();
  });
  it('serializes a non-OK JSON response as isError rather than an empty success', async () => {
    const { result } = await callCatalog({ ok: false, status: 503, json: { total: 0, tools: [] } });
    expect(result).toEqual({ isError: true, content: [{ type: 'text', text: 'CSOAI MCP error: catalog gateway unreachable (status 503)' }] });
  });
  it('serializes malformed search data through the existing error boundary', async () => {
    const { result } = await callCatalog(ok({ total: 0, distinct_tools: ['unrelated'] }));
    expect(result).toEqual({ isError: true, content: [{ type: 'text', text: 'CSOAI MCP error: catalog gateway returned malformed tools/total search result' }] });
  });
  it('keeps server identity consistent with its existing package and corrects network wording', () => {
    const packageJson = JSON.parse(readFileSync(new URL('../mcp/csoai-governance/package.json', import.meta.url), 'utf8'));
    const version = handlerSource.match(/new Server\(\{ name: "csoai-governance", version: "([^"]+)" \}/)?.[1];
    expect(version).toBe(packageJson.version);
    expect(packageJson.description).not.toMatch(/verify seals offline/i);
    const verifier = handlerSource.slice(handlerSource.indexOf('name: "csoai_verify"'), handlerSource.indexOf('name: "csoai_govern"'));
    expect(verifier).toContain('network request');
    expect(verifier).not.toMatch(/seal offline/i);
  });
});
