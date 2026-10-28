import { test } from 'vitest';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

// Exercise the complete canonical stdio handler with fixture-only SDK/fetch boundaries.
// No SDK installation, network request, real stdio client, source write or package publication.
const source = fs.readFileSync(new URL('../mcp/csoai-governance/index.mjs', import.meta.url), 'utf8');
const isolatedHandler = String.raw`
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
assert.equal(typeof input.source, 'string');
assert(input.source.length < 128 * 1024);
const fixture = input.fixture, handlers = new Map(), requests = [];
class Server {
  setRequestHandler(schema, callback) { assert(['call', 'list'].includes(schema)); handlers.set(schema, callback); }
  async connect() {} // SDK boundary only; no actual stdio consumer.
}
class StdioServerTransport {}
const context = vm.createContext({
  process: { env: {} }, console: { error() {} },
  fetch: async (url, options) => {
    assert.equal(url, 'https://councilof.ai/api/tools?q=' + encodeURIComponent(fixture.query));
    assert.deepEqual(Object.keys(options).sort(), ['body', 'headers', 'method']);
    assert.equal(options.method, 'GET'); assert.equal(options.body, undefined);
    assert.equal(JSON.stringify(options.headers), JSON.stringify({ 'content-type': 'text/plain', 'user-agent': 'csoai-governance-mcp/0.1' }));
    requests.push({ url, method: options.method, body_absent: options.body === undefined });
    return { ok: fixture.status === 200, status: fixture.status, text: async () => fixture.nonJson ? 'not JSON' : JSON.stringify(fixture.body) };
  },
});
const dependencies = new Map([
  ['@modelcontextprotocol/sdk/server/index.js', { Server }],
  ['@modelcontextprotocol/sdk/server/stdio.js', { StdioServerTransport }],
  ['@modelcontextprotocol/sdk/types.js', { CallToolRequestSchema: 'call', ListToolsRequestSchema: 'list' }],
]);
const module = new vm.SourceTextModule(input.source, { context });
await module.link(specifier => {
  assert(dependencies.has(specifier), 'Only three fixture SDK modules permitted');
  const values = dependencies.get(specifier);
  return new vm.SyntheticModule(Object.keys(values), function () {
    for (const [name, value] of Object.entries(values)) this.setExport(name, value);
  }, { context });
});
await module.evaluate();
assert.equal(handlers.size, 2); assert(handlers.has('call'));
const result = await handlers.get('call')({ params: { name: 'csoai_catalog', arguments: { query: fixture.query } } });
assert.equal(requests.length, 1, 'Exactly one fixture GET per catalog call');
const output = result.isError === true ? result.content[0].text : JSON.parse(result.content[0].text);
process.stdout.write(JSON.stringify({ output, isError: result.isError === true, requests }));
`;

const fixtures = [
  { name: 'authoritative_no_match_does_not_return_unfiltered_catalogue', query: 'no-such-governance-tool', status: 200, body: { total: 0, catalogue_total: 2, distinct_tools: ['board_totals', 'get_axis'], tools: [] }, expected: { total: 0, showing: 0, matches: [] } },
  { name: 'authoritative_nonempty_filter_preserves_projection', query: 'get_axis', status: 200, body: { total: 1, catalogue_total: 2, distinct_tools: ['board_totals', 'get_axis'], tools: [{ name: 'get_axis', clusterLabel: 'Evidence', tools: 3, connect: 'retained-install-hint' }] }, expected: { total: 1, showing: 1, matches: [{ name: 'get_axis', cluster: 'Evidence', tools: 3, install: 'retained-install-hint' }] } },
  { name: 'empty_authoritative_array_wins_over_populated_legacy_fields', query: 'no-match', status: 200, body: { total: 0, tools: [], matches: ['legacy-unfiltered'], mcps: ['legacy-mcp'], distinct_tools: ['legacy-distinct'] }, expected: { total: 0, showing: 0, matches: [] } },
  { name: 'nonempty_authoritative_array_wins_over_populated_legacy_fields', query: 'filtered', status: 200, body: { total: 1, tools: ['filtered-tool'], matches: ['unfiltered-legacy'] }, expected: { total: 1, showing: 1, matches: [{ name: 'filtered-tool' }] } },
  { name: 'numeric_zero_total_is_preserved_independently_of_array_fix', query: 'none', status: 200, body: { total: 0, catalogue_total: 2, matches: [] }, expected: { total: 0, showing: 0, matches: [] } },
  { name: 'legacy_matches_response_still_supported', query: 'legacy', status: 200, body: { total: 7, matches: [{ name: 'legacy', cluster: 'Recorded' }] }, expected: { total: 7, showing: 1, matches: [{ name: 'legacy', cluster: 'Recorded' }] } },
  { name: 'legacy_mcps_response_still_supported', query: 'legacy', status: 200, body: { catalogue_total: 2, mcps: ['legacy-a', 'legacy-b'] }, expected: { total: 2, showing: 2, matches: [{ name: 'legacy-a' }, { name: 'legacy-b' }] } },
  { name: 'legacy_distinct_names_response_still_supported', query: '', status: 200, body: { catalogue_total: 2, distinct_tools: ['board_totals', 'get_axis'] }, expected: { total: 2, showing: 2, matches: [{ name: 'board_totals' }, { name: 'get_axis' }] } },
  { name: 'legacy_array_without_count_uses_existing_length_fallback', query: '', status: 200, body: ['legacy-a'], expected: { total: 1, showing: 1, matches: [{ name: 'legacy-a' }] } },
  { name: 'existing_twenty_five_result_cap_and_full_total_preserved', query: '', status: 200, body: { total: 30, tools: Array.from({ length: 30 }, (_, i) => 'fixture-' + i) }, expected: { total: 30, showing: 25, matches: Array.from({ length: 25 }, (_, i) => ({ name: 'fixture-' + i })) } },
  { name: 'non_json_gateway_response_remains_explicit_error', query: 'unavailable', status: 503, nonJson: true, expectedError: 'CSOAI MCP error: catalog gateway unreachable (status 503)' },
];

for (const fixture of fixtures) {
  test('csoai_catalog: ' + fixture.name, () => {
    const child = spawnSync(process.execPath,
      ['--experimental-vm-modules', '--input-type=module', '-e', isolatedHandler],
      { input: JSON.stringify({ source, fixture }), encoding: 'utf8', env: {}, timeout: 5000, maxBuffer: 128 * 1024 });
    assert.ifError(child.error);
    assert.equal(child.signal, null, 'Isolated handler terminated: ' + child.stderr);
    assert.equal(child.status, 0, 'Isolated handler failed: ' + child.stderr);
    const actual = JSON.parse(child.stdout);
    assert.equal(actual.requests.length, 1);
    assert.deepEqual(actual.requests[0], { url: 'https://councilof.ai/api/tools?q=' + encodeURIComponent(fixture.query), method: 'GET', body_absent: true });
    if (fixture.expectedError) {
      assert.equal(actual.isError, true); assert.equal(actual.output, fixture.expectedError);
    } else {
      assert.equal(actual.isError, false); assert.deepEqual(actual.output, fixture.expected);
    }
  });
}
