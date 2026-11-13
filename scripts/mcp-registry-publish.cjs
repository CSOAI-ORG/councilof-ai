#!/usr/bin/env node
// Explicit --check is public/read-only. --publish requires a registry JWT.
// Registry metadata is discovery information, not proof of delivery or adoption.
const fs = require('node:fs');
const https = require('node:https');
const { isDeepStrictEqual } = require('node:util');

const ORIGIN = 'https://registry.modelcontextprotocol.io';
const OFFICIAL = 'io.modelcontextprotocol.registry/official';
const MAX_BYTES = 1024 * 1024;

function fail(message) { throw new Error(message); }
function nonempty(value) {
  return typeof value === 'string' && value.trim() === value &&
    value.length > 0 && !['null', 'undefined'].includes(value) && !/[\r\n]/.test(value);
}
function validate(server, version, expectedName) {
  if (!server || typeof server !== 'object' || Array.isArray(server)) fail('invalid manifest');
  if (!nonempty(expectedName) || server.name !== expectedName) fail('manifest namespace mismatch');
  if (!/^[A-Za-z0-9.-]+\/[A-Za-z0-9._-]+$/.test(server.name)) fail('invalid server name');
  if (!nonempty(version) || server.version !== version ||
      !/^[A-Za-z0-9._+-]+$/.test(version) || version === 'latest') fail('manifest version mismatch');
  return server;
}
function comparable(server) {
  const copy = JSON.parse(JSON.stringify(server));
  if (copy._meta) {
    delete copy._meta[OFFICIAL];
    if (!Object.keys(copy._meta).length) delete copy._meta;
  }
  return copy;
}
function parse(response) {
  try { return JSON.parse(response.body); } catch { fail('registry returned invalid JSON'); }
}
function verifyRecord(record, server) {
  if (!record || !record.server || !isDeepStrictEqual(comparable(record.server), comparable(server))) {
    fail('published metadata differs; use a reviewed new version, never overwrite history');
  }
  const official = record._meta?.[OFFICIAL];
  if (official?.status !== 'active' || typeof official.isLatest !== 'boolean') {
    fail('registry record is not confirmed active with a latest-version indicator');
  }
  return { is_latest: official.isLatest };
}
function detailPath(server) {
  return '/v0.1/servers/' + encodeURIComponent(server.name) + '/versions/' +
    encodeURIComponent(server.version) + '?include_deleted=true';
}
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const headers = { Accept: 'application/json' };
    if (data !== undefined) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    if (token) headers.Authorization = 'Bearer ' + token;
    const req = https.request(ORIGIN + path, { method, headers }, (res) => {
      const chunks = [];
      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_BYTES) req.destroy(new Error('registry response exceeds limit'));
        else chunks.push(chunk);
      });
      res.on('error', () => reject(new Error('registry response failed')));
      res.on('end', () => {
        clearTimeout(timer);
        if (size <= MAX_BYTES) resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') });
      });
    });
    const timer = setTimeout(() => req.destroy(new Error('registry request timed out')), 30000);
    req.on('error', () => {
      clearTimeout(timer);
      reject(new Error('registry transport failed or exceeded bounds'));
    });
    req.end(data);
  });
}
async function run({ server, version, expectedName, mode, token, send = request }) {
  validate(server, version, expectedName);
  if (!['validate', 'check', 'publish'].includes(mode)) fail('choose --validate, --check or --publish');
  if (mode === 'validate') return { state: 'MANIFEST_VALID', name: server.name, version };
  if (mode === 'publish' && !nonempty(token)) fail('registry token missing or invalid');

  const path = detailPath(server);
  const existing = await send('GET', path);
  if (existing.status === 200) {
    const state = verifyRecord(parse(existing), server);
    return { state: 'MATCH', name: server.name, version, ...state };
  }
  if (existing.status !== 404) fail('registry preflight failed: HTTP ' + existing.status);
  if (mode === 'check') return { state: 'MISSING', name: server.name, version };

  const posted = await send('POST', '/v0.1/publish', server, token);
  if (posted.status < 200 || posted.status >= 300) fail('registry publish rejected: HTTP ' + posted.status);
  // A successful POST is not enough. Retain uncertainty if this independent read fails.
  const readback = await send('GET', path);
  if (readback.status !== 200) fail('publish accepted but readback unconfirmed; inspect before retrying');
  const state = verifyRecord(parse(readback), server);
  return { state: 'PUBLISHED_AND_READ_BACK', name: server.name, version, ...state };
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !['--validate', '--check', '--publish'].includes(args[0])) {
    fail('usage: SERVER_JSON=path VER=version EXPECTED_NAME=name node scripts/mcp-registry-publish.cjs --validate|--check|--publish');
  }
  const server = JSON.parse(fs.readFileSync(process.env.SERVER_JSON || 'server.json', 'utf8'));
  const result = await run({
    server, version: process.env.VER, expectedName: process.env.EXPECTED_NAME,
    mode: args[0].slice(2), token: process.env.TOKEN,
  });
  console.log(JSON.stringify(result));
  if (result.state === 'MISSING') process.exitCode = 2;
}
module.exports = { run, validate, verifyRecord, detailPath };
if (require.main === module) main().catch((error) => {
  // Never print remote response bodies or tokens.
  console.error('FAIL-CLOSED:', error.message);
  process.exitCode = 1;
});
