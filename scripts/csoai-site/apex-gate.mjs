#!/usr/bin/env node
// apex-gate - csoai.org serves only what a reviewed file says it serves.
//
// https://csoai.org is the did:web:csoai.org origin. Everything under /.well-known/ there is read by
// strangers who verify our signatures; everything else is a redirect to councilof.ai. This script is
// the gate csoai-site-deploy.yml runs before and after it writes to that host.
//
// WHY. On 13 Oct 2026 the origin still carried a custody note withdrawn on 25 Sep (C-2026-0925-01):
// the copy on councilof.ai had been corrected, the origin had not, and the only check comparing the
// two hosts compared key ids. The Actions deployer cloned a moving, unprotected branch of another
// repository, deployed to a preview by mistake, and would have shipped an open redirect and an older
// csoai-governance.json had it reached production.
//
// WHAT IT CHECKS, from scripts/csoai-site/apex-lock.json:
//   pin        the source checkout is exactly source.commit
//   did.json   built bytes equal this repository's public/.well-known/did.json: the same
//              verificationMethod entries, the same custody note (whose sha256 the lock pins), the
//              same bytes
//   well-known the built /.well-known tree is exactly the lock's list: nothing missing, nothing
//              changed, nothing extra, and no Pages control file (_redirects, _headers, ...) in the site
//   redirects  the middleware file answers every recorded request path as production did on
//              13 Oct 2026, and never redirects to a host other than councilof.ai
//   live       path by path against the live origin: production may only serve bytes the lock knows
//              (the bytes about to ship, or the bytes they replace). Unknown bytes mean someone wrote
//              production outside this route since the lock was reviewed: refuse, and list them.
//
//   node apex-gate.mjs --selftest
//   node apex-gate.mjs pin       [--lock f]                     print source.commit (validates the lock)
//   node apex-gate.mjs target                                   read-only: the Pages project's production branch
//                                                              must be the branch the lock deploys to
//                                                              (needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN)
//   node apex-gate.mjs predeploy --site d --source-head sha [--installed-middleware f] [--offline]
//   node apex-gate.mjs readback  --base https://host [--attempts 6] [--wait 10]
//   common: [--lock f] [--repo-root d] [--middleware f] [--origin https://csoai.org] [--json out.json]
//
// Exit 0 = pass. Exit 1 = refused, with every difference listed. It writes to no host: it reads files
// and sends GET requests. Only `target` uses a credential, to read one project's settings; the token is
// never printed. Node built-ins only.

import { createHash, randomBytes } from 'node:crypto';
import {
  appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync,
} from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const DEFAULT_LOCK = join(HERE, 'apex-lock.json');
const DEFAULT_MIDDLEWARE = join(HERE, 'apex-middleware.mjs');

export const LOCK_SCHEMA = 'csoai.apex-lock/0.1';
export const TARGET_ORIGIN = 'https://councilof.ai';
export const DID_ID = 'did:web:csoai.org';
// Files Cloudflare Pages reads as routing or header rules. The source may not ship one: it would
// change what /.well-known answers without changing a single hash in the lock.
export const CONTROL_FILES = ['_redirects', '_headers', '_routes.json', '_worker.js', '_worker.bundle', 'functions'];

const HEX64 = /^[0-9a-f]{64}$/;
const HEX40 = /^[0-9a-f]{40}$/;

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const short = (h) => (typeof h === 'string' ? h.slice(0, 12) : String(h));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------------------------
// The lock
// ---------------------------------------------------------------------------------------------

/** @returns {string[]} reasons this lock may not be used; empty = usable */
export function lockProblems(lock) {
  const p = [];
  if (!lock || typeof lock !== 'object' || Array.isArray(lock)) return ['lock is not a JSON object'];
  if (lock.schema !== LOCK_SCHEMA) p.push(`schema must be ${LOCK_SCHEMA}`);
  if (!/^[\w.-]+\/[\w.-]+$/.test(lock.source?.repository ?? '')) p.push('source.repository must be owner/name');
  if (!HEX40.test(lock.source?.commit ?? '')) p.push('source.commit must be a full 40-hex commit id, not a branch or a short id');
  const pages = lock.pages ?? {};
  if (!/^[a-z0-9-]+$/.test(pages.project ?? '')) p.push('pages.project missing');
  if (!/^[A-Za-z0-9._/-]+$/.test(pages.production_branch ?? '')) p.push('pages.production_branch missing');
  if (!/^[A-Za-z0-9._-]+$/.test(pages.candidate_branch ?? '')) p.push('pages.candidate_branch missing');
  if (pages.candidate_branch && pages.candidate_branch === pages.production_branch) p.push('pages.candidate_branch must differ from pages.production_branch');
  if (!/^https:\/\/[a-z0-9.-]+$/.test(pages.origin ?? '')) p.push('pages.origin must be an https origin with no path');

  const wk = lock.well_known;
  if (!wk || typeof wk !== 'object' || Array.isArray(wk) || Object.keys(wk).length === 0) {
    p.push('well_known must name at least one file');
  } else {
    for (const [name, entry] of Object.entries(wk)) {
      if (!/^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/.test(name) || name.split('/').includes('..')) p.push(`well_known "${name}": not a plain relative path`);
      const hasSha = typeof entry?.sha256 === 'string';
      const hasMirror = typeof entry?.mirror === 'string';
      if (hasSha === hasMirror) p.push(`well_known "${name}": needs exactly one of sha256 or mirror`);
      if (hasSha && !HEX64.test(entry.sha256)) p.push(`well_known "${name}": sha256 is not 64 lowercase hex`);
      if (hasMirror && !/^public\/\.well-known\/[A-Za-z0-9._/-]+$/.test(entry.mirror)) p.push(`well_known "${name}": mirror must be a file under public/.well-known/`);
      if (hasMirror && entry.mirror.split('/').includes('..')) p.push(`well_known "${name}": mirror may not contain ..`);
      for (const r of entry?.replaces ?? []) if (!HEX64.test(r)) p.push(`well_known "${name}": replaces holds a value that is not a sha256`);
    }
    const did = wk['did.json'];
    if (!did) p.push('well_known must name did.json');
    else {
      if (did.mirror !== 'public/.well-known/did.json') p.push('well_known "did.json": mirror must be public/.well-known/did.json (this repository is the producer of the DID document)');
      if (!HEX64.test(did.gspc_board_key_note_sha256 ?? '')) p.push('well_known "did.json": gspc_board_key_note_sha256 must pin the corrected custody note');
    }
  }
  for (const name of lock.well_known_absent ?? []) {
    if (wk && Object.prototype.hasOwnProperty.call(wk, name)) p.push(`well_known_absent "${name}" is also in well_known`);
  }

  const rd = lock.redirects ?? {};
  if (!Array.isArray(rd.exact) || rd.exact.length === 0) p.push('redirects.exact must hold at least one row');
  for (const row of rd.exact ?? []) {
    if (typeof row?.path !== 'string' || !row.path.startsWith('/')) p.push(`redirects.exact: path ${JSON.stringify(row?.path)} must start with /`);
    if (row?.status !== 308) p.push(`redirects.exact ${row?.path}: status must be 308`);
    if (isOffHost(row?.location)) p.push(`redirects.exact ${row?.path}: location must be on ${TARGET_ORIGIN}`);
  }
  for (const key of ['served_as_did_json', 'never_off_host']) {
    if (!Array.isArray(rd[key]) || rd[key].length === 0) p.push(`redirects.${key} must hold at least one path`);
    for (const path of rd[key] ?? []) if (typeof path !== 'string' || !path.startsWith('/')) p.push(`redirects.${key}: ${JSON.stringify(path)} must start with /`);
  }
  return p;
}

export function readLock(file) {
  let lock;
  try { lock = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { return { lock: null, problems: [`lock ${file}: unreadable (${e.message})`] }; }
  return { lock, problems: lockProblems(lock).map((m) => `lock: ${m}`) };
}

/**
 * What each /.well-known path must be, as bytes on disk.
 * @returns {{ expected: Map<string, {sha256:string, rule:string, replaces:string[], bytes?:Buffer}>, problems: string[] }}
 */
export function resolveExpected(lock, repoRoot) {
  const expected = new Map();
  const problems = [];
  for (const [name, entry] of Object.entries(lock.well_known)) {
    const replaces = entry.replaces ?? [];
    if (entry.mirror) {
      const file = join(repoRoot, entry.mirror);
      if (!existsSync(file)) { problems.push(`${name}: the repository copy ${entry.mirror} is missing from this checkout`); continue; }
      const bytes = readFileSync(file);
      expected.set(name, { sha256: sha256(bytes), rule: `= ${entry.mirror}`, replaces, bytes });
    } else {
      expected.set(name, { sha256: entry.sha256, rule: 'sha256 in lock', replaces });
    }
  }
  return { expected, problems };
}

// ---------------------------------------------------------------------------------------------
// did.json
// ---------------------------------------------------------------------------------------------

/**
 * Why the built DID document may not ship. The repository copy is the authority; the lock pins the
 * sha256 of the corrected custody note so that both would have to be changed, in review, to move it.
 * @returns {string[]}
 */
export function didProblems(builtBytes, mirrorBytes, noteSha256) {
  const p = [];
  let built; let mirror;
  try { mirror = JSON.parse(mirrorBytes.toString('utf8')); } catch (e) { return [`did.json: the repository copy is not JSON (${e.message})`]; }
  try { built = JSON.parse(builtBytes.toString('utf8')); } catch (e) { return [`did.json: the built file is not JSON (${e.message})`]; }

  // An absent field compares equal to an absent field. Refuse an authority that has nothing to say.
  const mVm = mirror.verificationMethod;
  if (mirror.id !== DID_ID) p.push(`did.json: the repository copy has id ${JSON.stringify(mirror.id)}, not ${DID_ID}`);
  if (!Array.isArray(mVm) || mVm.length === 0) p.push('did.json: the repository copy has no verificationMethod entries');
  const mNote = mirror._gspcBoardKeyNote;
  if (typeof mNote !== 'string' || mNote.length === 0) p.push('did.json: the repository copy has no _gspcBoardKeyNote');
  else if (sha256(Buffer.from(mNote, 'utf8')) !== noteSha256) {
    p.push(`did.json: the repository copy's _gspcBoardKeyNote (sha256 ${short(sha256(Buffer.from(mNote, 'utf8')))}) is not the corrected wording the lock pins (${short(noteSha256)})`);
  }
  if (p.length) return p;

  if (built.id !== mirror.id) p.push(`did.json: id is ${JSON.stringify(built.id)}, expected ${DID_ID}`);
  const ids = (vm) => (Array.isArray(vm) ? vm.map((m) => String(m?.id).split('#').pop()).join(', ') : 'none');
  if (JSON.stringify(built.verificationMethod) !== JSON.stringify(mVm)) {
    p.push(`did.json: verificationMethod differs from the repository copy (built: ${ids(built.verificationMethod)}; repository: ${ids(mVm)})`);
  }
  if (built._gspcBoardKeyNote !== mNote) {
    const b = typeof built._gspcBoardKeyNote === 'string' ? `sha256 ${short(sha256(Buffer.from(built._gspcBoardKeyNote, 'utf8')))}, ${Buffer.byteLength(built._gspcBoardKeyNote)} bytes` : 'absent';
    p.push(`did.json: the custody note _gspcBoardKeyNote is not the corrected wording (built: ${b}; corrected: sha256 ${short(noteSha256)}, ${Buffer.byteLength(mNote)} bytes)`);
  }
  if (!builtBytes.equals(mirrorBytes)) {
    p.push(`did.json: bytes differ from the repository copy (built sha256 ${sha256(builtBytes)}, ${builtBytes.length} bytes; repository sha256 ${sha256(mirrorBytes)}, ${mirrorBytes.length} bytes)`);
  }
  return p;
}

// ---------------------------------------------------------------------------------------------
// The built /.well-known tree
// ---------------------------------------------------------------------------------------------

function listFiles(dir, prefix = '') {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (statSync(full).isDirectory()) out.push(...listFiles(full, rel));
    else out.push(rel);
  }
  return out;
}

/** @returns {{ problems: string[], rows: object[] }} */
export function siteProblems(siteDir, expected) {
  const problems = [];
  const rows = [];
  for (const name of CONTROL_FILES) {
    if (existsSync(join(siteDir, name))) problems.push(`site: the build ships ${name}, a Cloudflare Pages control file; the lock does not allow one`);
  }
  const wkDir = join(siteDir, '.well-known');
  const built = new Set(listFiles(wkDir));
  for (const [name, want] of expected) {
    if (!built.has(name)) {
      rows.push({ path: name, built: null, expected: want.sha256, rule: want.rule, ok: false });
      problems.push(`/.well-known/${name}: missing from the build (lock expects sha256 ${short(want.sha256)}, ${want.rule})`);
      continue;
    }
    const bytes = readFileSync(join(wkDir, name));
    const got = sha256(bytes);
    const ok = got === want.sha256;
    rows.push({ path: name, built: got, size: bytes.length, expected: want.sha256, rule: want.rule, ok });
    if (!ok) problems.push(`/.well-known/${name}: built sha256 ${short(got)} (${bytes.length} bytes) is not the lock's ${short(want.sha256)} (${want.rule})`);
  }
  for (const name of built) {
    if (!expected.has(name)) {
      rows.push({ path: name, built: sha256(readFileSync(join(wkDir, name))), expected: null, rule: 'not in lock', ok: false });
      problems.push(`/.well-known/${name}: the build ships a file the lock does not name`);
    }
  }
  return { problems, rows };
}

// ---------------------------------------------------------------------------------------------
// Redirects
// ---------------------------------------------------------------------------------------------

/** True unless `location` is an absolute https URL on councilof.ai with no credentials. */
export function isOffHost(location) {
  if (typeof location !== 'string' || !location.startsWith(`${TARGET_ORIGIN}/`)) return true;
  let u;
  try { u = new URL(location); } catch { return true; }
  return u.protocol !== 'https:' || u.hostname !== 'councilof.ai' || u.port !== '' || u.username !== '' || u.password !== '';
}

export async function loadMiddleware(file) {
  const mod = await import(pathToFileURL(resolve(file)).href);
  if (typeof mod.onRequest !== 'function') throw new Error(`${file} does not export onRequest`);
  return mod.onRequest;
}

/** Run the middleware for one request path, the way Pages Functions would call it. */
export async function simulate(onRequest, path, origin = 'https://csoai.org') {
  const NEXT = Symbol('next');
  let out;
  // A middleware that throws is a 500 on the live host. Report it; do not let it end the check.
  try { out = await onRequest({ request: new Request(origin + path), next: async () => NEXT }); } catch (e) {
    return { served: false, status: 500, location: null, error: e.message };
  }
  if (out === NEXT) return { served: true, status: 200, location: null };
  return { served: false, status: out.status, location: out.headers.get('location') };
}

// Request paths that have been, or could be, read as another host. Not rows of record: the only
// claim checked for these is that the answer never leaves councilof.ai.
export const HOSTILE_PATHS = [
  '//example.com', '//example.com/', '//example.com/x', '///example.com/x', '////example.com',
  '/\\example.com', '/\\example.com/x', '/\\\\example.com', '/\\/example.com', '//\\example.com', '/\\/\\example.com',
  '//example.com:443/x', '//user@example.com/x', '//user:pw@example.com/x', '//example.com?x=1', '//example.com#x',
  '//example.com/%2e%2e', '//example.com/..%2f', '//example.com%2f', '//example.com%5c',
  '/%2F%2Fexample.com', '/%5Cexample.com', '/%5C%5Cexample.com', '/%09//example.com', '/%0d%0aLocation:%20https://example.com',
  '/https://example.com', '/https:/example.com', '/https:example.com', '/http:%5C%5Cexample.com', '/javascript:alert(1)',
  '/.well-known', '/.well-knownX/did.json', '/.WELL-KNOWN/did.json', '/.well-known/../x', '/.well-known/%2e%2e/x',
  '/.well-known/..//example.com', '/.well-known/../\\example.com', '/x/../..//example.com', '/@example.com', '/?//example.com',
  '/x?next=//example.com', '/x?next=https://example.com', '//', '///', '/\\', '/\\\\',
];

/**
 * @param {(path: string) => Promise<{served?: boolean, status: number, location: string|null, sha256?: string}>} answer
 * @returns {Promise<string[]>} differences from the recorded redirect rules
 */
export async function redirectProblems(answer, lock, { didSha256 = null, hostile = [] } = {}) {
  const p = [];
  const rd = lock.redirects;
  for (const row of rd.exact) {
    const a = await answer(row.path);
    if (a.status !== row.status || a.location !== row.location) {
      p.push(`redirect ${row.path}: got ${a.status} ${a.location ?? '(no Location)'}; the rule is ${row.status} ${row.location}`);
    }
  }
  for (const path of rd.served_as_did_json) {
    const a = await answer(path);
    if (a.served === true) continue; // simulated: handed to the static files
    if (a.served === false || a.status !== 200 || (didSha256 && a.sha256 !== didSha256)) {
      p.push(`${path}: must be served as the DID document; got ${a.status}${a.location ? ` ${a.location}` : ''}${a.sha256 ? ` sha256 ${short(a.sha256)}` : ''}`);
    }
  }
  for (const path of [...rd.never_off_host, ...hostile]) {
    const a = await answer(path);
    const redirecting = a.status >= 300 && a.status < 400;
    if (a.error) p.push(`${JSON.stringify(path)}: the middleware threw (${a.error}); the live host would answer with an error page`);
    if (redirecting && isOffHost(a.location)) p.push(`OPEN REDIRECT ${JSON.stringify(path)}: ${a.status} ${a.location ?? '(no Location)'} leaves councilof.ai`);
  }
  return p;
}

// ---------------------------------------------------------------------------------------------
// Reading a host, path as written
// ---------------------------------------------------------------------------------------------

/** One GET. The path goes on the wire exactly as given: no dot-segment or slash normalisation. */
export function rawGet(base, path, { timeoutMs = 20000 } = {}) {
  const b = new URL(base);
  const lib = b.protocol === 'http:' ? httpRequest : httpsRequest;
  return new Promise((resolvePromise, reject) => {
    const req = lib({
      host: b.hostname,
      port: b.port || undefined,
      path,
      method: 'GET',
      headers: { 'user-agent': 'csoai-site-deploy apex-gate', 'cache-control': 'no-cache', accept: '*/*', connection: 'close' },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        resolvePromise({
          status: res.statusCode,
          location: res.headers.location ?? null,
          contentType: res.headers['content-type'] ?? null,
          size: body.length,
          sha256: sha256(body),
        });
      });
      res.on('error', reject);
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`no answer in ${timeoutMs} ms`)));
    req.on('error', reject);
    req.end();
  });
}

async function getRetry(base, path, { tries = 3, timeoutMs = 20000 } = {}) {
  let last;
  for (let i = 1; i <= tries; i += 1) {
    try { return await rawGet(base, path, { timeoutMs }); } catch (e) { last = e; if (i < tries) await sleep(1500 * i); }
  }
  throw new Error(`${base}${path}: ${last?.message ?? 'no answer'}`);
}

/** What the host answers for a /.well-known path it does not have (Pages: HTTP 200 and the HTML index). */
async function absentSignature(base, opts) {
  const a = await getRetry(base, `/.well-known/apex-gate-absent-${randomBytes(8).toString('hex')}`, opts);
  return { status: a.status, sha256: a.sha256 };
}

/** same | absent | replaces | unknown */
export function classifyLive(answer, want, absent) {
  if (answer.status === 200 && answer.sha256 === want.sha256) return 'same';
  if (answer.status === 404 || (answer.status >= 300 && answer.status < 400)) return 'absent';
  if (answer.status === absent.status && answer.sha256 === absent.sha256) return 'absent';
  if (answer.status === 200 && (want.replaces ?? []).includes(answer.sha256)) return 'replaces';
  return 'unknown';
}

/**
 * Path by path: what the live origin serves now against what is about to ship.
 * Blocking: bytes at a /.well-known path that the lock has never seen, or a file at a path the lock
 * says is absent. Everything else is a change this deploy makes, and is listed.
 */
export async function liveCompare(base, lock, expected, opts = {}) {
  const rows = [];
  const blocking = [];
  const changes = [];
  const absent = await absentSignature(base, opts);
  for (const [name, want] of expected) {
    const a = await getRetry(base, `/.well-known/${name}`, opts);
    const verdict = classifyLive(a, want, absent);
    rows.push({ path: `/.well-known/${name}`, live_status: a.status, live_sha256: verdict === 'absent' ? null : a.sha256, live_size: a.size, will_sha256: want.sha256, rule: want.rule, verdict });
    if (verdict === 'unknown') blocking.push(`/.well-known/${name}: production serves sha256 ${a.sha256} (${a.size} bytes, HTTP ${a.status}), which is neither what would ship (${short(want.sha256)}) nor bytes the lock says it replaces. Someone changed production outside this route.`);
    else if (verdict === 'absent') changes.push(`/.well-known/${name}: production does not serve it; the deploy adds it (sha256 ${short(want.sha256)})`);
    else if (verdict === 'replaces') changes.push(`/.well-known/${name}: production serves sha256 ${short(a.sha256)}; the deploy replaces it with ${short(want.sha256)}`);
  }
  for (const name of lock.well_known_absent ?? []) {
    const a = await getRetry(base, `/.well-known/${name}`, opts);
    const isAbsent = classifyLive(a, { sha256: '' }, absent) === 'absent';
    rows.push({ path: `/.well-known/${name}`, live_status: a.status, live_sha256: isAbsent ? null : a.sha256, live_size: a.size, will_sha256: null, rule: 'absent', verdict: isAbsent ? 'same' : 'unknown' });
    if (!isAbsent) blocking.push(`/.well-known/${name}: production serves a file here (sha256 ${a.sha256}, ${a.size} bytes); the deploy would remove it`);
  }
  const didWant = expected.get('did.json');
  const didOk = new Set([didWant?.sha256, ...(didWant?.replaces ?? [])]);
  const redirectDiffs = await redirectProblems(async (path) => {
    const a = await getRetry(base, path, opts);
    // For the "served as the DID document" rows production may still hold the document being replaced.
    return { status: a.status, location: a.location, sha256: didOk.has(a.sha256) ? didWant.sha256 : a.sha256 };
  }, lock, { didSha256: didWant?.sha256 });
  for (const d of redirectDiffs) changes.push(`production today: ${d}`);
  return { rows, blocking, changes, absent };
}

/** After a deploy: the host must serve exactly the lock, and the redirect rules, as real HTTP answers. */
export async function readbackOnce(base, lock, expected, opts = {}) {
  const p = [];
  const absent = await absentSignature(base, opts);
  for (const [name, want] of expected) {
    const a = await getRetry(base, `/.well-known/${name}`, opts);
    if (a.status !== 200 || a.sha256 !== want.sha256) p.push(`/.well-known/${name}: ${base} serves HTTP ${a.status} sha256 ${short(a.sha256)} (${a.size} bytes); expected ${short(want.sha256)} (${want.rule})`);
  }
  for (const name of lock.well_known_absent ?? []) {
    const a = await getRetry(base, `/.well-known/${name}`, opts);
    if (classifyLive(a, { sha256: '' }, absent) !== 'absent') p.push(`/.well-known/${name}: ${base} serves a file here (sha256 ${short(a.sha256)}); the lock says there is none`);
  }
  const did = expected.get('did.json');
  p.push(...await redirectProblems(async (path) => {
    const a = await getRetry(base, path, opts);
    return { status: a.status, location: a.location, sha256: a.sha256 };
  }, lock, { didSha256: did?.sha256 }));
  return p;
}

// ---------------------------------------------------------------------------------------------
// The Pages project: is the branch we deploy to the production branch?
// ---------------------------------------------------------------------------------------------

/**
 * `wrangler pages deploy --branch=X` is a production deploy only when X is the project's production
 * branch. Any other X makes a preview and exits 0. From 6 Oct 2026 this workflow deployed to "main"
 * while the project's production branch was "master": every run made a preview, then failed its
 * own check of csoai.org. Read the setting; do not assume it.
 * @returns {string[]}
 */
export function targetProblems(project, lock) {
  const p = [];
  if (!project || typeof project !== 'object') return ['target: Cloudflare returned no project'];
  if (project.name !== lock.pages.project) p.push(`target: Cloudflare returned project ${JSON.stringify(project.name)}, not ${lock.pages.project}`);
  if (project.production_branch !== lock.pages.production_branch) {
    p.push(`target: the Pages project ${lock.pages.project} has production branch ${JSON.stringify(project.production_branch ?? null)}; the lock deploys to ${JSON.stringify(lock.pages.production_branch)}. A deploy to any other branch is a preview and ${lock.pages.origin} would not change.`);
  }
  if (project.production_branch === lock.pages.candidate_branch) p.push(`target: the candidate branch ${lock.pages.candidate_branch} is the production branch; the candidate deploy would write production`);
  return p;
}

/** One GET of one project's settings. The token goes in the Authorization header and nowhere else. */
export async function readProject({ accountId, token, project, fetcher = fetch }) {
  if (!/^[a-f0-9]{32}$/i.test(accountId ?? '') || typeof token !== 'string' || token.length < 12) throw new Error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are required');
  const res = await fetcher(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${project}`, {
    method: 'GET', headers: { authorization: `Bearer ${token}`, accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Cloudflare answered HTTP ${res.status} for the project read`);
  const doc = await res.json();
  if (doc?.success !== true || !doc.result || typeof doc.result !== 'object') throw new Error('Cloudflare did not confirm the project read');
  return doc.result;
}

// ---------------------------------------------------------------------------------------------
// The pre-deploy decision
// ---------------------------------------------------------------------------------------------

export async function predeploy({ lockFile, repoRoot, siteDir, sourceHead, middlewareFile, installedMiddleware, origin, offline, getOpts, onRequest: loaded }) {
  const report = { mode: 'predeploy', at: new Date().toISOString(), problems: [], changes: [], well_known: [], live: [] };
  const { lock, problems: lp } = readLock(lockFile);
  report.problems.push(...lp);
  if (!lock || lp.length) return report;
  report.source = lock.source;

  if (sourceHead !== lock.source.commit) report.problems.push(`pin: the source checkout is at ${sourceHead || '(unknown)'}; the lock pins ${lock.source.commit}`);

  const { expected, problems: ep } = resolveExpected(lock, repoRoot);
  report.problems.push(...ep);

  const didWant = expected.get('did.json');
  const builtDid = join(siteDir, '.well-known', 'did.json');
  if (didWant?.bytes && existsSync(builtDid)) {
    report.problems.push(...didProblems(readFileSync(builtDid), didWant.bytes, lock.well_known['did.json'].gspc_board_key_note_sha256));
  } else if (didWant?.bytes) {
    report.problems.push('did.json: the build has no /.well-known/did.json');
  }

  const site = siteProblems(siteDir, expected);
  report.well_known = site.rows;
  // did.json is reported once, by the DID check above, with the reason.
  report.problems.push(...site.problems.filter((m) => !(m.startsWith('/.well-known/did.json:') && report.problems.some((x) => x.startsWith('did.json:')))));

  try {
    if (installedMiddleware) {
      if (!existsSync(installedMiddleware)) report.problems.push(`middleware: ${installedMiddleware} is missing from the deploy folder`);
      else if (!readFileSync(installedMiddleware).equals(readFileSync(middlewareFile))) report.problems.push('middleware: the file in the deploy folder is not byte-identical to scripts/csoai-site/apex-middleware.mjs');
    }
    const onRequest = loaded ?? await loadMiddleware(middlewareFile);
    report.problems.push(...(await redirectProblems((path) => simulate(onRequest, path, lock.pages.origin), lock, { hostile: HOSTILE_PATHS })).map((m) => `middleware: ${m}`));
  } catch (e) {
    report.problems.push(`middleware: could not be run (${e.message})`);
  }

  if (offline) {
    report.live_skipped = true;
  } else if (expected.size) {
    try {
      const live = await liveCompare(origin ?? lock.pages.origin, lock, expected, getOpts);
      report.live = live.rows;
      report.changes = live.changes;
      report.problems.push(...live.blocking);
    } catch (e) {
      report.problems.push(`live: could not read ${origin ?? lock.pages.origin} (${e.message}). Unchecked is not checked.`);
    }
  }
  return report;
}

function printReport(report) {
  const out = [];
  if (report.source) out.push(`source ${report.source.repository} @ ${report.source.commit}`);
  if (report.well_known?.length) {
    out.push('', 'built /.well-known against the lock:');
    for (const r of report.well_known) out.push(`  ${r.ok ? 'ok  ' : 'DIFF'}  ${r.path.padEnd(24)} built ${short(r.built ?? 'missing')}  lock ${short(r.expected ?? 'none')}  (${r.rule})`);
  }
  if (report.live?.length) {
    out.push('', 'live origin, path by path:');
    for (const r of report.live) out.push(`  ${r.verdict.padEnd(8)}  ${r.path.padEnd(38)} live ${r.live_sha256 ? short(r.live_sha256) : 'absent      '}  lock ${r.will_sha256 ? short(r.will_sha256) : 'absent'}`);
  }
  if (report.live_skipped) out.push('', 'live origin: not read (--offline)');
  if (report.changes?.length) {
    out.push('', `what a deploy would change on the live origin (${report.changes.length}):`);
    for (const c of report.changes) out.push(`  - ${c}`);
  }
  if (report.problems.length) {
    out.push('', `REFUSED: ${report.problems.length} difference(s). Nothing may be deployed.`);
    for (const m of report.problems) out.push(`  - ${m}`);
  } else if (report.mode === 'predeploy') {
    out.push('', report.changes?.length ? 'PASS: the build is exactly the lock. Deploy.' : 'PASS: the build is exactly the lock, and the live origin already serves it. Nothing to deploy.');
  }
  console.log(out.join('\n'));
}

function writeGithub(report) {
  const deploy = report.problems.length === 0 && (report.changes?.length ?? 0) > 0;
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `deploy=${deploy}\nchanges=${report.changes?.length ?? 0}\nproblems=${report.problems.length}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [`### csoai.org apex gate: ${report.problems.length ? 'REFUSED' : deploy ? 'pass, deploying' : 'pass, nothing to deploy'}`, ''];
    for (const m of report.problems) lines.push(`- **refused:** ${m}`);
    for (const c of report.changes ?? []) lines.push(`- change: ${c}`);
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
  }
}

// ---------------------------------------------------------------------------------------------
// Selftest: fixed cases. A gate that has never been seen failing is decoration.
// ---------------------------------------------------------------------------------------------

// The middleware csoai-site-deploy.yml shipped until this gate existed. Kept as the negative control.
const WITHDRAWN_MIDDLEWARE = async (context) => {
  const url = new URL(context.request.url);
  const p = url.pathname;
  if (p === '/.well-known' || p.startsWith('/.well-known/')) return context.next();
  const dest = new URL(url.pathname + url.search + url.hash, 'https://councilof.ai');
  return Response.redirect(dest.toString(), 308);
};

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'apex-gate-'));
  const repo = join(dir, 'repo');
  const site = join(dir, 'site');
  mkdirSync(join(repo, 'public', '.well-known'), { recursive: true });
  mkdirSync(join(site, '.well-known', 'mcp'), { recursive: true });
  const note = 'The corrected note.';
  const did = { id: DID_ID, verificationMethod: [{ id: `${DID_ID}#k1`, type: 'JsonWebKey2020', publicKeyJwk: { kty: 'OKP', crv: 'Ed25519', x: 'AAAA' } }], _gspcBoardKeyNote: note };
  const didBytes = Buffer.from(`${JSON.stringify(did, null, 2)}\n`);
  const keys = Buffer.from('{"we_operate_a_ts":false,"keys":[1]}\n');
  const card = Buffer.from('{"card":1}\n');
  writeFileSync(join(repo, 'public', '.well-known', 'did.json'), didBytes);
  writeFileSync(join(repo, 'public', '.well-known', 'scitt-keys'), keys);
  writeFileSync(join(site, '.well-known', 'did.json'), didBytes);
  writeFileSync(join(site, '.well-known', 'scitt-keys'), keys);
  writeFileSync(join(site, '.well-known', 'mcp', 'server-card.json'), card);
  writeFileSync(join(site, 'index.html'), '<!doctype html><title>fallback</title>\n');
  const lock = {
    schema: LOCK_SCHEMA,
    source: { repository: 'o/r', commit: 'a'.repeat(40) },
    pages: { project: 'p', production_branch: 'master', candidate_branch: 'apex-candidate', origin: 'https://csoai.org' },
    well_known: {
      'did.json': { mirror: 'public/.well-known/did.json', gspc_board_key_note_sha256: sha256(Buffer.from(note)), replaces: ['b'.repeat(64)] },
      'scitt-keys': { mirror: 'public/.well-known/scitt-keys' },
      'mcp/server-card.json': { sha256: sha256(card) },
    },
    well_known_absent: ['scitt.json'],
    redirects: {
      exact: [
        { path: '/', status: 308, location: 'https://councilof.ai/' },
        { path: '/a?x=1', status: 308, location: 'https://councilof.ai/a?x=1' },
        { path: '//example.com/x', status: 308, location: 'https://councilof.ai/example.com/x' },
        { path: '/.well-known', status: 308, location: 'https://councilof.ai/.well-known' },
      ],
      served_as_did_json: ['/.well-known/did.json', '//.well-known/did.json'],
      never_off_host: ['/\\example.com/x'],
    },
  };
  const lockFile = join(dir, 'lock.json');
  writeFileSync(lockFile, JSON.stringify(lock));
  return { dir, repo, site, lock, lockFile, did, didBytes, note, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/** A local stand-in for a Pages deployment: the middleware, then static files, then the HTML fallback. */
async function serve(siteDir, onRequest) {
  const server = createServer(async (req, res) => {
    try {
      const NEXT = Symbol('next');
      const out = await onRequest({ request: new Request(`http://127.0.0.1${req.url}`), next: async () => NEXT });
      if (out !== NEXT) { res.writeHead(out.status, Object.fromEntries(out.headers)); res.end(); return; }
      const path = new URL(`http://127.0.0.1${req.url}`).pathname.replace(/\/+/g, '/');
      const file = join(siteDir, path);
      if (file.startsWith(siteDir) && existsSync(file) && statSync(file).isFile()) { res.writeHead(200); res.end(readFileSync(file)); return; }
      res.writeHead(200, { 'content-type': 'text/html' }); res.end(readFileSync(join(siteDir, 'index.html')));
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) };
}

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const mentions = (list, re) => list.some((m) => re.test(m));

/**
 * @param {{ onRequest?: Function }} [given] the middleware, when the caller has already imported it
 *   (the vitest wrapper imports it statically); otherwise it is loaded from the committed file.
 */
export function selftestCases(given = {}) {
  const middleware = async () => given.onRequest ?? loadMiddleware(DEFAULT_MIDDLEWARE);
  const offline = async (f, over = {}) => predeploy({ lockFile: f.lockFile, repoRoot: f.repo, siteDir: f.site, sourceHead: f.lock.source.commit, middlewareFile: DEFAULT_MIDDLEWARE, offline: true, onRequest: await middleware(), ...over });
  const withFixture = (fn) => async () => { const f = fixture(); try { await fn(f); } finally { f.cleanup(); } };
  return [
    ['a build that is exactly the lock passes', withFixture(async (f) => {
      const r = await offline(f);
      must(r.problems.length === 0, `expected no problems, got: ${r.problems.join(' | ')}`);
    })],
    ['a custody note that is not the corrected wording is refused', withFixture(async (f) => {
      const old = { ...f.did, _gspcBoardKeyNote: 'An earlier note.' };
      writeFileSync(join(f.site, '.well-known', 'did.json'), `${JSON.stringify(old, null, 2)}\n`);
      const r = await offline(f);
      must(mentions(r.problems, /custody note _gspcBoardKeyNote is not the corrected wording/), 'note difference not reported');
      must(mentions(r.problems, /did\.json: bytes differ/), 'byte difference not reported');
      must(!mentions(r.problems, /verificationMethod differs/), 'keys were equal but reported as different');
    })],
    ['a changed, added or removed verification method is refused', withFixture(async (f) => {
      for (const vm of [[{ ...f.did.verificationMethod[0], publicKeyJwk: { kty: 'OKP', crv: 'Ed25519', x: 'BBBB' } }], [...f.did.verificationMethod, { id: `${DID_ID}#k2` }], []]) {
        writeFileSync(join(f.site, '.well-known', 'did.json'), `${JSON.stringify({ ...f.did, verificationMethod: vm }, null, 2)}\n`);
        const r = await offline(f);
        must(mentions(r.problems, /verificationMethod differs/), `verificationMethod change not reported for ${JSON.stringify(vm).slice(0, 60)}`);
      }
    })],
    ['the same DID document in other bytes is refused', withFixture(async (f) => {
      writeFileSync(join(f.site, '.well-known', 'did.json'), JSON.stringify(f.did));
      const r = await offline(f);
      must(r.problems.length === 1 && /did\.json: bytes differ/.test(r.problems[0]), `expected only a byte difference, got: ${r.problems.join(' | ')}`);
    })],
    ['a repository copy whose note is not the pinned wording is refused, even when the build matches it', withFixture(async (f) => {
      const drift = Buffer.from(`${JSON.stringify({ ...f.did, _gspcBoardKeyNote: 'A third note.' }, null, 2)}\n`);
      writeFileSync(join(f.repo, 'public', '.well-known', 'did.json'), drift);
      writeFileSync(join(f.site, '.well-known', 'did.json'), drift);
      const r = await offline(f);
      must(mentions(r.problems, /is not the corrected wording the lock pins/), 'pinned note not enforced');
    })],
    ['a repository copy with no keys or no note cannot be the authority', withFixture(async (f) => {
      for (const strip of ['verificationMethod', '_gspcBoardKeyNote']) {
        const d = { ...f.did }; delete d[strip];
        const bytes = Buffer.from(JSON.stringify(d));
        must(didProblems(bytes, bytes, f.lock.well_known['did.json'].gspc_board_key_note_sha256).length > 0, `an authority without ${strip} was accepted`);
      }
    })],
    ['a changed, missing or extra well-known file is refused and named', withFixture(async (f) => {
      writeFileSync(join(f.site, '.well-known', 'mcp', 'server-card.json'), '{"card":2}\n');
      rmSync(join(f.site, '.well-known', 'scitt-keys'));
      writeFileSync(join(f.site, '.well-known', 'surprise.json'), '{}');
      const r = await offline(f);
      must(mentions(r.problems, /mcp\/server-card\.json: built sha256/), 'changed file not named');
      must(mentions(r.problems, /scitt-keys: missing from the build/), 'missing file not named');
      must(mentions(r.problems, /surprise\.json: the build ships a file the lock does not name/), 'extra file not named');
    })],
    ['a Pages control file in the build is refused', withFixture(async (f) => {
      writeFileSync(join(f.site, '_redirects'), '/.well-known/did.json https://example.com/did.json 302\n');
      must(mentions((await offline(f)).problems, /ships _redirects/), '_redirects not refused');
    })],
    ['a source checkout that is not the pinned commit is refused', withFixture(async (f) => {
      must(mentions((await offline(f, { sourceHead: 'c'.repeat(40) })).problems, /^pin: /), 'pin mismatch not reported');
      must(mentions((await offline(f, { sourceHead: '' })).problems, /^pin: /), 'empty head accepted');
    })],
    ['a deploy-folder middleware that is not the reviewed file is refused', withFixture(async (f) => {
      const other = join(f.dir, '_middleware.js');
      writeFileSync(other, 'export async function onRequest(c) { return c.next(); }\n');
      must(mentions((await offline(f, { installedMiddleware: other })).problems, /not byte-identical/), 'altered middleware accepted');
      must(mentions((await offline(f, { installedMiddleware: join(f.dir, 'nope.js') })).problems, /missing from the deploy folder/), 'missing middleware accepted');
    })],
    ['a lock that pins a branch, drops the DID rule or records an off-host redirect is not usable', async () => {
      const f = fixture();
      try {
        const bad = (mutate) => { const l = JSON.parse(JSON.stringify(f.lock)); mutate(l); return lockProblems(l); };
        must(lockProblems(f.lock).length === 0, `fixture lock rejected: ${lockProblems(f.lock).join(' | ')}`);
        must(bad((l) => { l.source.commit = 'main'; }).length > 0, 'branch name accepted as a pin');
        must(bad((l) => { l.source.commit = 'abc1234'; }).length > 0, 'short id accepted as a pin');
        must(bad((l) => { l.well_known['did.json'] = { sha256: 'd'.repeat(64) }; }).length > 0, 'did.json without the repository rule accepted');
        must(bad((l) => { delete l.well_known['did.json'].gspc_board_key_note_sha256; }).length > 0, 'did.json without a pinned note accepted');
        must(bad((l) => { l.redirects.exact[0].location = 'https://example.com/'; }).length > 0, 'off-host rule accepted');
        must(bad((l) => { l.redirects.exact[0].location = 'https://councilof.ai.example.com/'; }).length > 0, 'look-alike host accepted');
        must(bad((l) => { l.well_known['../x'] = { sha256: 'd'.repeat(64) }; }).length > 0, 'path escape accepted');
        must(bad((l) => { l.pages.candidate_branch = 'master'; }).length > 0, 'candidate branch equal to production accepted');
      } finally { f.cleanup(); }
    }],
    ['the reviewed middleware never leaves councilof.ai; the withdrawn one does', async () => {
      const onRequest = await middleware();
      const f = fixture();
      try {
        const good = await redirectProblems((p) => simulate(onRequest, p), f.lock, { hostile: HOSTILE_PATHS });
        must(good.length === 0, `reviewed middleware: ${good.join(' | ')}`);
        const bad = await redirectProblems((p) => simulate(WITHDRAWN_MIDDLEWARE, p), f.lock, { hostile: HOSTILE_PATHS });
        must(mentions(bad, /OPEN REDIRECT "\/\/example\.com\/x"/) || mentions(bad, /redirect \/\/example\.com\/x: got 308 https:\/\/example\.com\/x/), 'the withdrawn middleware was not caught on //example.com/x');
        must(mentions(bad, /OPEN REDIRECT "\/\\\\example\.com\/x"/), 'the withdrawn middleware was not caught on /\\example.com/x');
      } finally { f.cleanup(); }
      for (const loc of ['https://example.com/', 'https://councilof.ai.example.com/', 'https://councilof.ai@example.com/', 'https://user@councilof.ai/', 'http://councilof.ai/', 'https://councilof.ai:8443/', '//councilof.ai/', '/x', '', null]) {
        must(isOffHost(loc), `isOffHost accepted ${JSON.stringify(loc)}`);
      }
      must(!isOffHost('https://councilof.ai/'), 'isOffHost refused the target origin');
      must(!isOffHost('https://councilof.ai/example.com/x?next=//example.com'), 'isOffHost refused an on-host path');
    }],
    ['live bytes are classed as same, absent, replaced or unknown', async () => {
      const absent = { status: 200, sha256: 'f'.repeat(64) };
      const want = { sha256: 'a'.repeat(64), replaces: ['b'.repeat(64)] };
      must(classifyLive({ status: 200, sha256: 'a'.repeat(64) }, want, absent) === 'same', 'same');
      must(classifyLive({ status: 200, sha256: 'f'.repeat(64) }, want, absent) === 'absent', 'fallback');
      must(classifyLive({ status: 404, sha256: 'e'.repeat(64) }, want, absent) === 'absent', '404');
      must(classifyLive({ status: 308, sha256: 'e'.repeat(64) }, want, absent) === 'absent', 'redirect');
      must(classifyLive({ status: 200, sha256: 'b'.repeat(64) }, want, absent) === 'replaces', 'replaces');
      must(classifyLive({ status: 200, sha256: 'c'.repeat(64) }, want, absent) === 'unknown', 'unknown');
      must(classifyLive({ status: 500, sha256: 'a'.repeat(64) }, want, absent) === 'unknown', 'a 500 is not a pass');
    }],
    ['over real HTTP: a faithful host passes; other bytes, a stray file or the withdrawn middleware fail', withFixture(async (f) => {
      const onRequest = await middleware();
      const { expected } = resolveExpected(f.lock, f.repo);
      const opts = { tries: 1, timeoutMs: 5000 };
      let s = await serve(f.site, onRequest);
      try {
        const ok = await readbackOnce(s.base, f.lock, expected, opts);
        must(ok.length === 0, `faithful host: ${ok.join(' | ')}`);
        const live = await liveCompare(s.base, f.lock, expected, opts);
        must(live.blocking.length === 0 && live.changes.length === 0, `faithful host, live compare: ${[...live.blocking, ...live.changes].join(' | ')}`);

        writeFileSync(join(f.site, '.well-known', 'did.json'), `${JSON.stringify({ ...f.did, _gspcBoardKeyNote: 'An earlier note.' }, null, 2)}\n`);
        must(mentions(await readbackOnce(s.base, f.lock, expected, opts), /\/\.well-known\/did\.json: .* expected/), 'readback missed other DID bytes');
        must(mentions((await liveCompare(s.base, f.lock, expected, opts)).blocking, /Someone changed production outside this route/), 'unknown live bytes did not block');

        const replaced = Buffer.from('the document being replaced\n');
        writeFileSync(join(f.site, '.well-known', 'did.json'), replaced);
        const lock2 = JSON.parse(JSON.stringify(f.lock));
        lock2.well_known['did.json'].replaces = [sha256(replaced)];
        const exp2 = resolveExpected(lock2, f.repo).expected;
        const live2 = await liveCompare(s.base, lock2, exp2, opts);
        must(live2.blocking.length === 0 && mentions(live2.changes, /did\.json: production serves .* the deploy replaces it/), `bytes the lock replaces must be a listed change, not a block: ${[...live2.blocking, ...live2.changes].join(' | ')}`);

        writeFileSync(join(f.site, '.well-known', 'did.json'), f.didBytes);
        rmSync(join(f.site, '.well-known', 'scitt-keys'));
        const live3 = await liveCompare(s.base, f.lock, expected, opts);
        must(live3.blocking.length === 0 && mentions(live3.changes, /scitt-keys: production does not serve it; the deploy adds it/), 'a missing file must be a listed change');

        writeFileSync(join(f.site, '.well-known', 'scitt.json'), '{"stray":true}\n');
        must(mentions((await liveCompare(s.base, f.lock, expected, opts)).blocking, /scitt\.json: production serves a file here/), 'a stray file did not block');
      } finally { await s.close(); }

      rmSync(join(f.site, '.well-known', 'scitt.json'));
      writeFileSync(join(f.site, '.well-known', 'scitt-keys'), readFileSync(join(f.repo, 'public', '.well-known', 'scitt-keys')));
      s = await serve(f.site, WITHDRAWN_MIDDLEWARE);
      try {
        const bad = await readbackOnce(s.base, f.lock, expected, opts);
        must(mentions(bad, /OPEN REDIRECT/) && mentions(bad, /redirect \/\/example\.com\/x: got 308 https:\/\/example\.com\/x/), `withdrawn middleware over HTTP not caught: ${bad.join(' | ')}`);
      } finally { await s.close(); }
    })],
    ['a Pages project whose production branch is not the branch we deploy is refused', async () => {
      const f = fixture();
      try {
        const ok = { name: 'p', production_branch: 'master' };
        must(targetProblems(ok, f.lock).length === 0, 'matching target refused');
        must(mentions(targetProblems({ ...ok, production_branch: 'main' }, f.lock), /is a preview/), 'branch mismatch accepted');
        must(targetProblems({ name: 'p' }, f.lock).length > 0, 'absent production_branch accepted');
        must(targetProblems({ ...ok, name: 'other' }, f.lock).length > 0, 'another project accepted');
        must(targetProblems(null, f.lock).length > 0, 'no project accepted');
        must(mentions(targetProblems({ name: 'p', production_branch: 'apex-candidate' }, f.lock), /candidate deploy would write production/), 'candidate branch as production accepted');
        const seen = [];
        const fetcher = async (url, init) => { seen.push([url, init.method, init.headers.authorization]); return { ok: true, status: 200, json: async () => ({ success: true, result: ok }) }; };
        const got = await readProject({ accountId: 'a'.repeat(32), token: 't'.repeat(40), project: 'p', fetcher });
        must(got.production_branch === 'master' && seen.length === 1 && seen[0][1] === 'GET' && seen[0][0].endsWith('/pages/projects/p'), 'project read is not one GET of the named project');
        for (const bad of [{ ok: false, status: 403, json: async () => ({}) }, { ok: true, status: 200, json: async () => ({ success: false }) }]) {
          let threw = '';
          try { await readProject({ accountId: 'a'.repeat(32), token: 't'.repeat(40), project: 'p', fetcher: async () => bad }); } catch (e) { threw = e.message; }
          must(threw !== '' && !threw.includes('t'.repeat(12)), 'a failed project read must throw, without the token');
        }
        let threw = false;
        try { await readProject({ accountId: '', token: '', project: 'p', fetcher }); } catch { threw = true; }
        must(threw, 'a project read with no credentials must throw');
      } finally { f.cleanup(); }
    }],
    ['the committed lock is usable, and its rules hold for the committed middleware and DID document', async () => {
      const { lock, problems } = readLock(DEFAULT_LOCK);
      must(problems.length === 0, problems.join(' | '));
      const onRequest = await middleware();
      const diffs = await redirectProblems((p) => simulate(onRequest, p, lock.pages.origin), lock, { hostile: HOSTILE_PATHS });
      must(diffs.length === 0, diffs.join(' | '));
      const { expected, problems: ep } = resolveExpected(lock, REPO_ROOT);
      must(ep.length === 0, ep.join(' | '));
      const did = expected.get('did.json');
      const own = didProblems(did.bytes, did.bytes, lock.well_known['did.json'].gspc_board_key_note_sha256);
      must(own.length === 0, `this repository's did.json is not the document the lock pins: ${own.join(' | ')}`);
      for (const r of did.replaces) must(r !== did.sha256, 'the lock lists the corrected DID document as one it replaces');
    }],
  ];
}

async function selftest() {
  let failed = 0;
  for (const [name, run] of selftestCases()) {
    try { await run(); console.log(`ok    ${name}`); } catch (e) { failed += 1; console.log(`FAIL  ${name}\n      ${e.message}`); }
  }
  console.log(failed ? `\nselftest: ${failed} case(s) FAILED` : '\nselftest: all cases pass');
  return failed === 0;
}

// ---------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) { args._.push(a); continue; }
    const key = a.slice(2);
    if (['selftest', 'offline'].includes(key)) args[key] = true;
    else { args[key] = argv[i + 1]; i += 1; }
  }
  return args;
}

async function main(argv) {
  const args = parseArgs(argv);
  if (args.selftest) return (await selftest()) ? 0 : 1;
  const mode = args._[0];
  const lockFile = resolve(args.lock ?? DEFAULT_LOCK);
  const repoRoot = resolve(args['repo-root'] ?? REPO_ROOT);
  const middlewareFile = resolve(args.middleware ?? DEFAULT_MIDDLEWARE);

  if (mode === 'pin') {
    const { lock, problems } = readLock(lockFile);
    if (problems.length) { for (const m of problems) console.error(m); return 1; }
    console.log(args.field === 'candidate-branch' ? lock.pages.candidate_branch : args.field === 'production-branch' ? lock.pages.production_branch : args.field === 'project' ? lock.pages.project : args.field === 'repository' ? lock.source.repository : lock.source.commit);
    return 0;
  }

  if (mode === 'target') {
    const { lock, problems } = readLock(lockFile);
    if (problems.length) { for (const m of problems) console.error(m); return 1; }
    let project;
    try {
      project = await readProject({ accountId: process.env.CLOUDFLARE_ACCOUNT_ID, token: process.env.CLOUDFLARE_API_TOKEN, project: lock.pages.project });
    } catch (e) {
      console.log(`REFUSED: target: could not read the Pages project ${lock.pages.project} (${e.message}). Unchecked is not checked.`);
      return 1;
    }
    const tp = targetProblems(project, lock);
    console.log(`Pages project ${project.name}: production branch ${JSON.stringify(project.production_branch)}; domains ${JSON.stringify(project.domains ?? [])}; Git source connected: ${project.source ? 'yes' : 'no'}`);
    if (tp.length) { console.log(`REFUSED: ${tp.length} difference(s). Nothing may be deployed.`); for (const m of tp) console.log(`  - ${m}`); return 1; }
    console.log(`PASS: a deploy to branch ${lock.pages.production_branch} is a production deploy; a deploy to ${lock.pages.candidate_branch} is a preview.`);
    return 0;
  }

  if (mode === 'predeploy') {
    if (!args.site) { console.error('predeploy needs --site <built site dir>'); return 1; }
    const report = await predeploy({
      lockFile, repoRoot, siteDir: resolve(args.site), sourceHead: String(args['source-head'] ?? ''), middlewareFile,
      installedMiddleware: args['installed-middleware'] ? resolve(args['installed-middleware']) : null,
      origin: args.origin, offline: Boolean(args.offline),
    });
    printReport(report);
    writeGithub(report);
    if (args.json) writeFileSync(args.json, `${JSON.stringify(report, null, 2)}\n`);
    return report.problems.length ? 1 : 0;
  }

  if (mode === 'readback') {
    if (!/^https?:\/\/[^/]+$/.test(args.base ?? '')) { console.error('readback needs --base <origin with no path>'); return 1; }
    const { lock, problems } = readLock(lockFile);
    if (problems.length) { for (const m of problems) console.error(m); return 1; }
    const { expected, problems: ep } = resolveExpected(lock, repoRoot);
    if (ep.length) { for (const m of ep) console.error(m); return 1; }
    const attempts = Math.max(1, Number(args.attempts ?? 6));
    const wait = Math.max(0, Number(args.wait ?? 10));
    let last = [];
    for (let i = 1; i <= attempts; i += 1) {
      try { last = await readbackOnce(args.base, lock, expected); } catch (e) { last = [`could not read ${args.base} (${e.message})`]; }
      if (last.length === 0) {
        console.log(`readback ${args.base}: PASS on attempt ${i}. ${expected.size} /.well-known files match the lock (did.json sha256 ${expected.get('did.json').sha256}); ${lock.redirects.exact.length} redirect rules match; no path leaves councilof.ai.`);
        if (args.json) writeFileSync(args.json, `${JSON.stringify({ mode: 'readback', base: args.base, at: new Date().toISOString(), problems: [] }, null, 2)}\n`);
        return 0;
      }
      console.log(`readback ${args.base}: attempt ${i} of ${attempts}: ${last.length} difference(s)`);
      if (i < attempts) await sleep(wait * 1000);
    }
    console.log(`\nreadback ${args.base}: FAIL. ${last.length} difference(s):`);
    for (const m of last) console.log(`  - ${m}`);
    if (args.json) writeFileSync(args.json, `${JSON.stringify({ mode: 'readback', base: args.base, at: new Date().toISOString(), problems: last }, null, 2)}\n`);
    return 1;
  }

  console.error('usage: apex-gate.mjs --selftest | pin | target | predeploy --site <dir> --source-head <sha> | readback --base <origin>');
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (e) => { console.error(e); process.exitCode = 1; });
}
