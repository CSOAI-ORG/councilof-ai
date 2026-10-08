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
