/**
 * Live behaviour gate: external evidence must agree with the actual HTTP handlers.
 * Non-mutating GET/HEAD only; does not buy, authenticate, sign or submit anything.
 * Source: docs/research/RELEASE_BENCHMARK_MATRIX_2026-11-23.md
 *
 * node scripts/live-behaviour-guard.mjs --selftest
 * node scripts/live-behaviour-guard.mjs [--base https://councilof.ai]
 */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 12000;
const PATHS = Object.freeze({
  institutions: '/api/institutions',
  artifact: '/interop/institutions-register.json',
  gspc: '/api/gspc',
  absent: '/api/__csoai_release_probe_unimplemented__',
});

function fail(message) { throw new Error(message); }
function assertJsonType(response, path) {
  if (!/application\/json/i.test(response.headers.get('content-type') || '')) {
    fail(path + ': not JSON (possibly a SPA fallback or proxy error)');
  }
}
async function readBounded(response, path) {
  const length = response.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES)) fail(path + ': response too large');
  const reader = response.body?.getReader();
  if (!reader) fail(path + ': no response body');
  const chunks = []; let bytes = 0; let done = false;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) { done = true; break; }
      bytes += next.value.byteLength;
      if (bytes > MAX_BYTES) fail(path + ': response too large');
      chunks.push(Buffer.from(next.value));
    }
  } finally {
    if (done) reader.releaseLock();
    else await reader.cancel().catch(() => {});
  }
  return Buffer.concat(chunks, bytes).toString('utf8');
}
async function getJson(base, path, fetchImpl) {
  const r = await fetchImpl(new URL(path, base), {
    method: 'GET',
    headers: { accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (r.status !== 200) fail(path + ': HTTP ' + r.status + ', expected 200');
  assertJsonType(r, path);
  const raw = await readBounded(r, path);
  let data;
  try { data = JSON.parse(raw); } catch { fail(path + ': invalid JSON'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail(path + ': JSON object required');
  return { raw, data };
}
async function getAbsent(base, fetchImpl) {
  const r = await fetchImpl(new URL(PATHS.absent, base), {
    method: 'GET', redirect: 'error', signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (r.status !== 404) fail(PATHS.absent + ': expected 404; got ' + r.status);
  await r.body?.cancel().catch(() => {});
}
async function checkHead(base, fetchImpl) {
  const r = await fetchImpl(new URL(PATHS.institutions, base), {
    method: 'HEAD', redirect: 'error', signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (r.status !== 200) fail(PATHS.institutions + ': HEAD HTTP ' + r.status + ', expected 200');
  await r.body?.cancel().catch(() => {});
}

export async function verifyLiveBehaviour(base, fetchImpl = fetch) {
  const url = new URL(base);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
    fail('base origin must be HTTPS, or localhost for fixtures');
  }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/') fail('base origin must be bare');
  const api = await getJson(url, PATHS.institutions, fetchImpl);
  const artifact = await getJson(url, PATHS.artifact, fetchImpl);
  const gspc = await getJson(url, PATHS.gspc, fetchImpl);
  const repeated = await getJson(url, PATHS.institutions, fetchImpl);

  assert.equal(api.data.schema, 'csoai.institutions/0.1', 'wrong institutions schema');
  assert.equal(api.data.status, 'PUBLISHED', 'institutions source is not published');
  assert.equal(api.data.source, 'public/interop/institutions-register.json', 'institutions source path differs');
  assert.equal(artifact.data.schema, 'csoai.institutions-register/0.1', 'wrong register artifact schema');
  assert.equal(api.data.artifact_schema, artifact.data.schema, 'source schema disagreement');
  assert.equal(api.data.as_of, artifact.data.as_of, 'source freshness disagreement');
  assert.ok(Array.isArray(artifact.data.rows), 'source rows not an array');
  assert.ok(Array.isArray(api.data.rows), 'API rows not an array');
  assert.equal(api.data.row_count, artifact.data.rows.length, 'row_count disagrees with source');
  assert.deepEqual(api.data.rows, artifact.data.rows, 'API rows differ from published source');
  assert.equal(api.raw, repeated.raw, 'institutions is not deterministic across two GETs');

  assert.match(gspc.data.schema || '', /^csoai\.gspc-axes\//, 'wrong GSPC schema');
  assert.ok(Array.isArray(gspc.data.axes), 'GSPC axes missing');
  assert.ok(gspc.data.totals && typeof gspc.data.totals === 'object', 'GSPC totals missing');
  assert.equal(gspc.data.totals.axes, gspc.data.axes.length, 'GSPC total disagrees with axes');
  assert.equal(
    gspc.data.totals.measured_axes + gspc.data.totals.unmeasured_axes,
    gspc.data.axes.length, 'GSPC measured/unmeasured totals inconsistent'
  );

  await checkHead(url, fetchImpl);
  await getAbsent(url, fetchImpl);
  return {
    status: 'PASS',
    checked: [
      'API GET and HEAD', 'published source GET', 'source-payload equality',
      'deterministic repeat GET', 'GSPC source-to-totals check', 'missing-route negative control',
    ],
    sample: { institution_rows: api.data.row_count, gspc_axes: gspc.data.totals.axes },
    limits: 'Public read-only observations; no authenticated flow, payment, signing or external acceptance tested',
  };
}

function fixture(overrides = {}) {
  const rows = [{ actor: 'fixture', kind: 'listing' }];
  const artifact = { schema: 'csoai.institutions-register/0.1', as_of: '2026-11-23', rows };
  const institutions = {
    schema: 'csoai.institutions/0.1', status: 'PUBLISHED',
    source: 'public/interop/institutions-register.json', artifact_schema: artifact.schema,
    as_of: artifact.as_of, row_count: 1, rows,
  };
  const gspc = {
    schema: 'csoai.gspc-axes/0.5',
    totals: { axes: 1, measured_axes: 1, unmeasured_axes: 0 }, axes: [{ axis: 'fixture' }],
  };
  let hits = 0;
  return async function fetchFixture(url, { method = 'GET' } = {}) {
    const path = new URL(url).pathname;
    if (method === 'HEAD') {
      return new Response(null, { status: overrides.headStatus || 200, headers: { 'content-type': 'application/json' } });
    }
    if (path === PATHS.absent) {
      return new Response('{}', { status: overrides.absentStatus || 404, headers: { 'content-type': 'application/json' } });
    }
    let data;
    if (path === PATHS.institutions) {
      hits++;
      data = structuredClone(institutions);
      if (overrides.rowCount) data.row_count = 2;
      if (overrides.drift && hits > 1) data.as_of = 'changed';
    } else if (path === PATHS.artifact) {
      data = structuredClone(artifact);
      if (overrides.sourceMismatch) data.rows[0].actor = 'other';
    } else if (path === PATHS.gspc) {
      data = structuredClone(gspc);
      if (overrides.totals) data.totals.axes = 2;
    } else throw new Error('unexpected fixture request: ' + path);
    if (overrides.badSchema && path === PATHS.institutions) data.schema = 'wrong';
    const raw = overrides.badJson && path === PATHS.gspc ? '{bad' : JSON.stringify(data);
    return new Response(raw, {
      status: overrides.notFound && path === PATHS.institutions ? 404 : 200,
      headers: { 'content-type': 'application/json' },
    });
  };
}
async function selftest() {
  const base = 'https://example.test/';
  const good = await verifyLiveBehaviour(base, fixture());
  assert.equal(good.status, 'PASS');
  const bad = [
    ['missing live endpoint', { notFound: true }],
    ['malformed JSON', { badJson: true }],
    ['wrong schema', { badSchema: true }],
    ['wrong count', { rowCount: true }],
    ['source/handler disagreement', { sourceMismatch: true }],
    ['wrong GSPC totals', { totals: true }],
    ['nondeterministic response', { drift: true }],
    ['missing route falsely returns 200', { absentStatus: 200 }],
    ['HEAD broken', { headStatus: 404 }],
  ];
  for (const [label, change] of bad) {
    await assert.rejects(() => verifyLiveBehaviour(base, fixture(change)), undefined, label);
  }
  console.log('live-behaviour-guard selftest: PASS 10/10 (1 positive, 9 negative controls)');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--selftest')) await selftest();
  else {
    try {
      const i = process.argv.indexOf('--base');
      const base = i >= 0 ? process.argv[i + 1] : 'https://councilof.ai';
      console.log(JSON.stringify(await verifyLiveBehaviour(base), null, 2));
    } catch (error) {
      console.error('live-behaviour-guard: FAIL — ' + String(error?.message || error));
      process.exitCode = 1;
    }
  }
}
