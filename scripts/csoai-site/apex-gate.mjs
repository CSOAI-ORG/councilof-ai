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
//   hold       the lock is not on hold (hold: "<why>" stops every upload until a reviewed change clears it)
//   pin        the source checkout is exactly source.commit
//   did.json   built bytes equal this repository's public/.well-known/did.json: the same
//              verificationMethod entries, the same custody note (whose sha256 the lock pins), the
//              same bytes. The lock also pins the sha256 of the whole document, so the repository
//              copy cannot change without the lock changing in the same pull request.
//   upload     the deploy folder is exactly the lock: every /.well-known file at its sha256, the
//              fallback page (index.html) at its sha256, the reviewed middleware, and nothing else.
//              No Pages control file, no symlink, no wrangler.toml / package.json / .npmrc beside it.
//   redirects  the middleware file answers every recorded request path as production did on
//              13 Oct 2026, and never redirects to a host other than councilof.ai
//   live       path by path against the live origin: production may only serve bytes the lock knows
//              (the bytes about to ship, or bytes listed under replaces). Unknown bytes are refused
//              and listed. That has two possible causes and the gate cannot tell them apart:
//              production was written outside this route, or a pinned file changed in a pull
//              request that did not add the sha256 it replaced to replaces.
//
//   node apex-gate.mjs --selftest
//   node apex-gate.mjs pin       [--field f]                    print source.commit (validates the lock)
//   node apex-gate.mjs target                                   read-only: the Pages project's production branch
//                                                              must be the branch the lock deploys to
//                                                              (needs CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN)
//   node apex-gate.mjs predeploy --site d --source-head sha [--deploy-root d] [--installed-middleware f] [--offline]
//   node apex-gate.mjs readback  --base https://host [--hostile] [--attempts 6] [--wait 10]
//   node apex-gate.mjs drift                                    pull-request check: this repository's DID
//                                                              document against the live origin (one GET)
//   common: [--lock f] [--repo-root d] [--middleware f] [--origin https://csoai.org] [--json out.json]
//
// Exit 0 = pass. Exit 1 = refused, with every difference listed. It writes to no host: it reads files
// and sends GET requests. Only `target` uses a credential, to read one project's settings; the token is
// never printed. Node built-ins only.

import { createHash, randomBytes } from 'node:crypto';
import {
  appendFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const DEFAULT_LOCK = join(HERE, 'apex-lock.json');
const DEFAULT_MIDDLEWARE = join(HERE, 'apex-middleware.mjs');

export const LOCK_SCHEMA = 'csoai.apex-lock/0.2';
export const TARGET_ORIGIN = 'https://councilof.ai';
export const DID_ID = 'did:web:csoai.org';
// Files Cloudflare Pages reads as routing or header rules. The source may not ship one: it would
// change what /.well-known answers without changing a single hash in the lock.
export const CONTROL_FILES = ['_redirects', '_headers', '_routes.json', '_worker.js', '_worker.bundle', 'functions'];
// The one page the upload may hold outside /.well-known. Pages answers a path that has no file with
// it (HTTP 200) when the upload holds no 404.html, so its bytes are what every unknown
// /.well-known/<name> serves. The lock pins them, or says there is none.
export const FALLBACK_FILE = 'index.html';

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
  // hold: null = not held. A sentence = every upload is refused until a reviewed change clears it.
  if (!Object.prototype.hasOwnProperty.call(lock, 'hold')) p.push('hold must be present: null, or a sentence saying why the route is held');
  else if (lock.hold !== null && (typeof lock.hold !== 'string' || lock.hold.trim().length < 8)) p.push('hold must be null, or a sentence (8 characters or more) saying why the route is held');
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
      // Every file is pinned by sha256. A mirror entry also names the file in this repository that
      // must hold those bytes, so a change to that file without a change here fails before merge.
      const hasMirror = Object.prototype.hasOwnProperty.call(entry ?? {}, 'mirror');
      if (!HEX64.test(entry?.sha256 ?? '')) p.push(`well_known "${name}": sha256 must be 64 lowercase hex (mirror entries pin the repository copy's sha256 too)`);
      if (hasMirror && !/^public\/\.well-known\/[A-Za-z0-9._/-]+$/.test(String(entry.mirror))) p.push(`well_known "${name}": mirror must be a file under public/.well-known/`);
      if (hasMirror && String(entry.mirror).split('/').includes('..')) p.push(`well_known "${name}": mirror may not contain ..`);
      if (entry?.replaces !== undefined && !Array.isArray(entry.replaces)) p.push(`well_known "${name}": replaces must be a list of sha256 values`);
      for (const r of Array.isArray(entry?.replaces) ? entry.replaces : []) {
        if (!HEX64.test(r)) p.push(`well_known "${name}": replaces holds a value that is not a sha256`);
        else if (r === entry.sha256) p.push(`well_known "${name}": replaces lists the sha256 the entry pins; a file cannot replace itself`);
      }
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
  // fallback_page: {sha256} = the upload holds index.html with these bytes, and an unknown
  // /.well-known path answers HTTP 200 with them. null = no index.html, and such a path answers 404.
  if (!Object.prototype.hasOwnProperty.call(lock, 'fallback_page')) p.push('fallback_page must be present: {"sha256": ...} or null');
  else if (lock.fallback_page !== null && !HEX64.test(lock.fallback_page?.sha256 ?? '')) p.push('fallback_page must be null or pin the sha256 of index.html');

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

/** A mirrored file and the lock must move together, in one pull request. Says exactly what to edit. */
export function mirrorPinMessage(name, entry, got, size) {
  return `${name}: the repository copy ${entry.mirror} is sha256 ${got} (${size} bytes); the lock pins ${entry.sha256}. `
    + `A change to this file needs the lock changed in the same pull request: set well_known["${name}"].sha256 to ${got} `
    + `and add ${entry.sha256} to its replaces (production serves the old bytes until the next deploy, and the gate refuses to write over bytes the lock does not list).`;
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
      const got = sha256(bytes);
      if (got !== entry.sha256) problems.push(mirrorPinMessage(name, entry, got, bytes.length));
      expected.set(name, { sha256: entry.sha256, rule: `= ${entry.mirror}`, replaces, bytes, mirror: entry.mirror });
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
// The upload: /.well-known, the fallback page, and nothing else
// ---------------------------------------------------------------------------------------------

/** Every entry under dir: {rel, kind}. kind is file, dir or other; a symlink is other, never followed. */
function walk(dir, prefix = '') {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    const st = lstatSync(full);
    if (st.isSymbolicLink() || (!st.isDirectory() && !st.isFile())) out.push({ rel, kind: 'other' });
    else if (st.isDirectory()) { out.push({ rel, kind: 'dir' }); out.push(...walk(full, rel)); } else out.push({ rel, kind: 'file' });
  }
  return out;
}

/**
 * The upload must be exactly the lock: each /.well-known file at its sha256, the fallback page at
 * its sha256 (or absent, when the lock says there is none), and no other file of any kind.
 * @returns {{ problems: string[], rows: object[] }}
 */
export function siteProblems(siteDir, expected, lock = {}) {
  const problems = [];
  const rows = [];
  if (!existsSync(siteDir) || lstatSync(siteDir).isSymbolicLink() || !lstatSync(siteDir).isDirectory()) {
    return { problems: [`upload: ${siteDir} is not a plain directory`], rows };
  }
  for (const name of CONTROL_FILES) {
    if (existsSync(join(siteDir, name))) problems.push(`site: the build ships ${name}, a Cloudflare Pages control file; the lock does not allow one`);
  }
  const entries = walk(siteDir);
  for (const e of entries) if (e.kind === 'other') problems.push(`upload: ${e.rel} is a symlink or a special file; only regular files may be uploaded`);
  const files = new Set(entries.filter((e) => e.kind === 'file').map((e) => e.rel));
  const wkDir = join(siteDir, '.well-known');
  const built = new Set([...files].filter((f) => f.startsWith('.well-known/')).map((f) => f.slice('.well-known/'.length)));
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
  // The fallback page: what Pages serves, with HTTP 200, for every /.well-known path that has no file.
  const fb = lock.fallback_page ?? null;
  if (fb) {
    if (!files.has(FALLBACK_FILE)) {
      rows.push({ path: `/${FALLBACK_FILE}`, built: null, expected: fb.sha256, rule: 'fallback page', ok: false });
      problems.push(`/${FALLBACK_FILE}: missing from the upload (the lock pins the fallback page at sha256 ${short(fb.sha256)})`);
    } else {
      const bytes = readFileSync(join(siteDir, FALLBACK_FILE));
      const got = sha256(bytes);
      rows.push({ path: `/${FALLBACK_FILE}`, built: got, size: bytes.length, expected: fb.sha256, rule: 'fallback page', ok: got === fb.sha256 });
      if (got !== fb.sha256) problems.push(`/${FALLBACK_FILE}: sha256 ${short(got)} (${bytes.length} bytes) is not the fallback page the lock pins (${short(fb.sha256)}). These bytes are what every /.well-known path with no file would serve.`);
    }
  } else if (files.has(FALLBACK_FILE)) {
    problems.push(`/${FALLBACK_FILE}: the upload holds a fallback page; the lock says there is none`);
  }
  for (const f of files) {
    if (f.startsWith('.well-known/') || f === FALLBACK_FILE || CONTROL_FILES.includes(f.split('/')[0])) continue;
    problems.push(`upload: ${f} is not named by the lock; the upload may hold only /.well-known and ${FALLBACK_FILE}`);
  }
  return { problems, rows };
}

/**
 * The folder wrangler runs in. wrangler holds the Cloudflare token and reads its settings from its
 * working directory (wrangler.toml, wrangler.jsonc, package.json, .npmrc, .env, node_modules), so
 * anything beside the upload is an instruction to it. Allowed: the site folder and
 * functions/_middleware.js. Run before the first upload; wrangler writes its own cache there later.
 * @returns {string[]}
 */
export function deployRootProblems(rootDir, siteDir) {
  const root = resolve(rootDir);
  const site = resolve(siteDir);
  if (dirname(site) !== root) return [`deploy folder: the site ${siteDir} must be a direct child of ${rootDir}`];
  if (!existsSync(root) || lstatSync(root).isSymbolicLink() || !lstatSync(root).isDirectory()) return [`deploy folder: ${rootDir} is not a plain directory`];
  const siteName = basename(site);
  const p = [];
  for (const e of walk(root)) {
    if (e.rel === siteName && e.kind === 'dir') continue;
    if (e.rel.startsWith(`${siteName}/`)) continue; // file by file in siteProblems
    if (e.rel === 'functions' && e.kind === 'dir') continue;
    if (e.rel === 'functions/_middleware.js' && e.kind === 'file') continue;
    if (e.kind === 'other') p.push(`deploy folder: ${e.rel} is a symlink or a special file`);
    else p.push(`deploy folder: holds ${e.rel}, which is not part of the deploy. Only ${siteName}/ and functions/_middleware.js may be there: the tool that holds the Cloudflare token reads its settings from this folder.`);
  }
  return p;
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
          body,
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
  return { status: a.status, sha256: a.sha256, size: a.size };
}

/** Does the host answer a /.well-known path with no file the way the lock says? */
export function fallbackMatches(absent, lock) {
  const fb = lock.fallback_page ?? null;
  return fb ? (absent.status === 200 && absent.sha256 === fb.sha256) : absent.status === 404;
}
const fallbackWords = (lock) => (lock.fallback_page ? `HTTP 200 with the pinned fallback page (sha256 ${short(lock.fallback_page.sha256)})` : 'HTTP 404');
const answerWords = (a) => `HTTP ${a.status}${a.status === 200 ? ` sha256 ${short(a.sha256)}${a.size === undefined ? '' : ` (${a.size} bytes)`}` : ''}`;

/** same | absent | replaces | unknown */
export function classifyLive(answer, want, absent) {
  if (answer.status === 200 && answer.sha256 === want.sha256) return 'same';
  if (answer.status === 404 || (answer.status >= 300 && answer.status < 400)) return 'absent';
  if (answer.status === absent.status && answer.sha256 === absent.sha256) return 'absent';
  if (answer.status === 200 && (want.replaces ?? []).includes(answer.sha256)) return 'replaces';
  return 'unknown';
}

/** Says what was measured, both possible causes, and the two ways out. */
export function unknownLiveMessage(name, a, want) {
  const entry = `well_known["${name}"]`;
  return `/.well-known/${name}: production serves sha256 ${a.sha256} (${a.size} bytes, HTTP ${a.status}), which is neither what would ship (${short(want.sha256)}) `
    + `nor a sha256 the lock lists under replaces. Two possible causes: production was written outside this route, or ${want.mirror ?? 'this pinned file'} changed in a pull request `
    + `that did not add the sha256 it replaced to ${entry}.replaces. Nothing is uploaded and nothing is repaired until one of two things happens: `
    + `a reviewed pull request adds ${a.sha256} to ${entry}.replaces (first find out where those bytes came from), or production is put back to bytes the lock lists.`;
}

/**
 * Path by path: what the live origin serves now against what is about to ship.
 * Blocking: bytes at a /.well-known path that the lock does not list, or a file at a path the lock
 * says is absent. Everything else is a change this deploy makes, and is listed.
 *
 * A block here also means the route repairs nothing: if someone holding the Cloudflare token
 * replaces a file on csoai.org, every run goes red and names the path, and production stays as
 * that write left it until a reviewed pull request lists the hash under replaces or the account
 * holder rolls back. That is deliberate. The gate cannot tell an outside write from a pinned file
 * that changed without its old sha256 being listed, so it does not guess.
 */
export async function liveCompare(base, lock, expected, opts = {}) {
  const rows = [];
  const blocking = [];
  const changes = [];
  const absent = await absentSignature(base, opts);
  const fbSame = fallbackMatches(absent, lock);
  rows.push({ path: '/.well-known/(a name with no file)', live_status: absent.status, live_sha256: absent.status === 200 ? absent.sha256 : null, live_size: absent.size, will_sha256: lock.fallback_page?.sha256 ?? null, rule: 'fallback page', verdict: fbSame ? 'same' : 'differs' });
  if (!fbSame) changes.push(`a /.well-known path with no file: production answers ${answerWords(absent)}; after the deploy it answers ${fallbackWords(lock)}`);
  for (const [name, want] of expected) {
    const a = await getRetry(base, `/.well-known/${name}`, opts);
    const verdict = classifyLive(a, want, absent);
    rows.push({ path: `/.well-known/${name}`, live_status: a.status, live_sha256: verdict === 'absent' ? null : a.sha256, live_size: a.size, will_sha256: want.sha256, rule: want.rule, verdict });
    if (verdict === 'unknown') blocking.push(unknownLiveMessage(name, a, want));
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

/**
 * After a deploy: the host must serve exactly the lock, and the redirect rules, as real HTTP answers.
 * hostile: also send every path in HOSTILE_PATHS (used on the candidate, the first time the
 * middleware runs on Cloudflare; all 46 were answered by csoai.org over HTTP on 13 Oct 2026).
 */
export async function readbackOnce(base, lock, expected, opts = {}, { hostile = false } = {}) {
  const p = [];
  const absent = await absentSignature(base, opts);
  if (!fallbackMatches(absent, lock)) p.push(`a /.well-known path with no file: ${base} answers ${answerWords(absent)}; the lock says ${fallbackWords(lock)}`);
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
  }, lock, { didSha256: did?.sha256, hostile: hostile ? HOSTILE_PATHS : [] }));
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
// Pull-request check: this repository's DID document against the live origin
// ---------------------------------------------------------------------------------------------

const stable = (v) => {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
  return JSON.stringify(v) ?? 'null';
};

/** id and every verification method, whatever the list order and the key order inside an entry. */
export function didKeyView(doc) {
  const vms = Array.isArray(doc?.verificationMethod) ? doc.verificationMethod : [];
  const methods = vms.map((m) => [String(m?.id), stable(m)]).sort((a, b) => (a.join('\u0000') < b.join('\u0000') ? -1 : 1));
  return { id: doc?.id ?? null, methods };
}

function keyDifferences(liveView, committedView) {
  const kid = (id) => String(id).split('#').pop();
  const live = new Map(liveView.methods);
  const mine = new Map(committedView.methods);
  const out = [];
  if (liveView.id !== committedView.id) out.push(`id: origin ${JSON.stringify(liveView.id)}, committed ${JSON.stringify(committedView.id)}`);
  for (const [id] of mine) if (!live.has(id)) out.push(`added (committed, not at the origin): #${kid(id)}`);
  for (const [id] of live) if (!mine.has(id)) out.push(`removed (at the origin, not committed): #${kid(id)}`);
  for (const [id, v] of mine) if (live.has(id) && live.get(id) !== v) out.push(`changed: #${kid(id)}`);
  if (out.length === 0) out.push('the same entries, with one of them listed twice on one side');
  return out;
}

/**
 * WHY. The required `gates` check used to run `verify-estate.mjs --did-drift`, which fails any pull
 * request whose committed id or keys differ from the live origin. A key change therefore had to
 * reach https://csoai.org first, from outside this repository, and be copied here afterwards. The
 * deploy route now ships only bytes equal to this repository's copy, so that order is closed; with
 * the old check left in place nothing could change a key at all. The copy could not go first and
 * the origin could not go first.
 *
 * THE RULE. The committed document must be the one the lock pins (whole-document sha256). Then:
 *   pass        the origin serves the same bytes;
 *   pass        the origin serves other bytes with the same id and verification methods (some other
 *               field differs). A warning is printed when the lock does not list those bytes;
 *   pass        id or verification methods differ AND the lock lists the origin's document under
 *               replaces: a planned change, named by both hashes in one reviewed pull request;
 *   fail        id or verification methods differ and the lock does not name the origin's document;
 *   cannot-run  the origin did not answer with a DID document. Neither a pass nor a failure.
 * @param {{lock: object, committedBytes: Buffer, live: {status?: number, body?: Buffer, error?: string}, origin?: string}} input
 * @returns {{verdict: 'pass'|'fail'|'cannot-run', lines: string[], warnings: string[]}}
 */
export function driftVerdict({ lock, committedBytes, live, origin = lock?.pages?.origin }) {
  const url = `${origin}/.well-known/did.json`;
  const entry = lock.well_known['did.json'];
  const mine = sha256(committedBytes);
  const out = (verdict, lines, warnings = []) => ({ verdict, lines, warnings });
  if (mine !== entry.sha256) return out('fail', [`FAIL: ${mirrorPinMessage('did.json', entry, mine, committedBytes.length)}`]);
  let committed;
  try { committed = JSON.parse(committedBytes.toString('utf8')); } catch (e) { return out('fail', [`FAIL: ${entry.mirror} is not JSON (${e.message})`]); }

  if (live?.error) return out('cannot-run', [`CANNOT-RUN: ${url} is unreachable (${live.error}). Nothing was compared.`]);
  if (live?.status !== 200 || !Buffer.isBuffer(live.body)) return out('cannot-run', [`CANNOT-RUN: ${url} answered HTTP ${live?.status}. Nothing was compared.`]);
  let liveDoc;
  try { liveDoc = JSON.parse(live.body.toString('utf8')); } catch { liveDoc = null; }
  if (!liveDoc || typeof liveDoc !== 'object' || Array.isArray(liveDoc)) return out('cannot-run', [`CANNOT-RUN: ${url} answered HTTP 200 with ${live.body.length} bytes that are not a JSON object. Nothing was compared.`]);

  const theirs = sha256(live.body);
  if (theirs === mine) return out('pass', [`DID origin: ${url} is byte-identical to ${entry.mirror} (sha256 ${mine}).`]);

  const listed = (entry.replaces ?? []).includes(theirs);
  const a = didKeyView(liveDoc);
  const b = didKeyView(committed);
  const sameKeys = JSON.stringify(a) === JSON.stringify(b);
  const both = `origin sha256 ${theirs} (${live.body.length} bytes); committed sha256 ${mine} (${committedBytes.length} bytes)`;
  if (sameKeys) {
    const lines = [`DID origin: same id and the same ${b.methods.length} verification methods as ${entry.mirror}; another field differs. ${both}.`];
    if (listed) return out('pass', [...lines, 'The lock lists the origin\'s document under replaces: the next deploy of csoai.org replaces it.']);
    return out('pass', lines, [`${url} serves sha256 ${theirs}, which scripts/csoai-site/apex-lock.json does not list under well_known["did.json"].replaces. The keys are equal, so this check passes, but the deploy route will refuse to write csoai.org until a reviewed pull request lists that sha256 or production is put back.`]);
  }
  const diffs = keyDifferences(a, b);
  if (listed) {
    return out('pass', [
      `DID origin: PLANNED CHANGE of id or verification methods, named by hash in the lock. ${both}.`,
      ...diffs.map((d) => `  - ${d}`),
      'The lock pins the committed document and lists the origin\'s document under replaces. The merge of this pull request is what changes the keys at the origin: review it as that.',
    ]);
  }
  return out('fail', [
    `FAIL: ${entry.mirror} and ${url} disagree on id or verification methods, and the lock does not name the origin's document. ${both}.`,
    ...diffs.map((d) => `  - ${d}`),
    `A planned key change is one pull request that changes ${entry.mirror}, sets well_known["did.json"].sha256 in scripts/csoai-site/apex-lock.json to its sha256, and adds the origin's sha256 (${theirs}) to well_known["did.json"].replaces.`,
    'If nobody planned a change, the origin was written outside this route: find out by whom before changing the lock.',
  ]);
}

// ---------------------------------------------------------------------------------------------
// The pre-deploy decision
// ---------------------------------------------------------------------------------------------

export async function predeploy({ lockFile, repoRoot, siteDir, deployRoot, sourceHead, middlewareFile, installedMiddleware, origin, offline, getOpts, onRequest: loaded }) {
  const report = { mode: 'predeploy', at: new Date().toISOString(), problems: [], changes: [], well_known: [], live: [] };
  const { lock, problems: lp } = readLock(lockFile);
  report.problems.push(...lp);
  if (!lock || lp.length) return report;
  report.source = lock.source;

  // A hold is checked first and reported with everything else, so a held run still shows the state.
  if (lock.hold) report.problems.push(`hold: the lock is on hold: ${JSON.stringify(lock.hold)}. Nothing is uploaded until a reviewed pull request sets hold back to null.`);

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

  const site = siteProblems(siteDir, expected, lock);
  report.well_known = site.rows;
  // did.json is reported once, by the DID check above, with the reason.
  report.problems.push(...site.problems.filter((m) => !(m.startsWith('/.well-known/did.json:') && report.problems.some((x) => x.startsWith('did.json:')))));

  if (deployRoot) {
    report.problems.push(...deployRootProblems(deployRoot, siteDir));
    installedMiddleware = installedMiddleware ?? join(deployRoot, 'functions', '_middleware.js');
  }

  try {
    if (installedMiddleware) {
      if (!existsSync(installedMiddleware)) report.problems.push(`middleware: ${installedMiddleware} is missing from the deploy folder`);
      else if (lstatSync(installedMiddleware).isSymbolicLink() || !readFileSync(installedMiddleware).equals(readFileSync(middlewareFile))) report.problems.push('middleware: the file in the deploy folder is not byte-identical to scripts/csoai-site/apex-middleware.mjs');
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
  // The deploy folder as the workflow assembles it: apex/_site and apex/functions/_middleware.js.
  const root = join(dir, 'apex');
  const site = join(root, '_site');
  mkdirSync(join(repo, 'public', '.well-known'), { recursive: true });
  mkdirSync(join(site, '.well-known', 'mcp'), { recursive: true });
  mkdirSync(join(root, 'functions'), { recursive: true });
  writeFileSync(join(root, 'functions', '_middleware.js'), readFileSync(DEFAULT_MIDDLEWARE));
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
  const page = Buffer.from('<!doctype html><title>fallback</title>\n');
  writeFileSync(join(site, 'index.html'), page);
  const lock = {
    schema: LOCK_SCHEMA,
    hold: null,
    source: { repository: 'o/r', commit: 'a'.repeat(40) },
    pages: { project: 'p', production_branch: 'master', candidate_branch: 'apex-candidate', origin: 'https://csoai.org' },
    fallback_page: { sha256: sha256(page) },
    well_known: {
      'did.json': { mirror: 'public/.well-known/did.json', sha256: sha256(didBytes), gspc_board_key_note_sha256: sha256(Buffer.from(note)), replaces: ['b'.repeat(64)] },
      'scitt-keys': { mirror: 'public/.well-known/scitt-keys', sha256: sha256(keys) },
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
  // relock: write the lock again after a test changed it (or a mirrored file it pins).
  const relock = (mutate) => { mutate(lock); writeFileSync(lockFile, JSON.stringify(lock)); };
  return { dir, repo, root, site, lock, lockFile, relock, did, didBytes, note, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
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
  const offline = async (f, over = {}) => predeploy({ lockFile: f.lockFile, repoRoot: f.repo, siteDir: f.site, deployRoot: f.root, sourceHead: f.lock.source.commit, middlewareFile: DEFAULT_MIDDLEWARE, offline: true, onRequest: await middleware(), ...over });
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
        must(bad((l) => { delete l.well_known['scitt-keys'].sha256; }).length > 0, 'a mirrored file without a pinned sha256 accepted');
        must(bad((l) => { delete l.well_known['did.json'].sha256; }).length > 0, 'did.json without a whole-document sha256 accepted');
        must(bad((l) => { l.well_known['did.json'].replaces = [l.well_known['did.json'].sha256]; }).length > 0, 'a file listed as replacing itself accepted');
        must(bad((l) => { l.well_known['did.json'].replaces = 'b'.repeat(64); }).length > 0, 'replaces that is not a list accepted');
        must(bad((l) => { delete l.hold; }).length > 0, 'a lock with no hold field accepted');
        must(bad((l) => { l.hold = ''; }).length > 0, 'an empty hold accepted');
        must(bad((l) => { l.hold = true; }).length > 0, 'a hold that says nothing accepted');
        must(bad((l) => { l.hold = 'Rolled back by hand on 14 Oct; cause not yet known.'; }).length === 0, 'a lock on hold must still be a usable lock');
        must(bad((l) => { delete l.fallback_page; }).length > 0, 'a lock with no fallback_page field accepted');
        must(bad((l) => { l.fallback_page = { sha256: 'zz' }; }).length > 0, 'a fallback page without a sha256 accepted');
        must(bad((l) => { l.fallback_page = null; }).length === 0, 'fallback_page: null (no page, 404) must be allowed');
      } finally { f.cleanup(); }
    }],
    ['a lock on hold refuses every upload, whatever else is true', withFixture(async (f) => {
      f.relock((l) => { l.hold = 'Rolled back by hand on 14 Oct; cause not yet known.'; });
      const r = await offline(f);
      must(r.problems.length === 1 && /^hold: the lock is on hold: "Rolled back by hand/.test(r.problems[0]), `expected only the hold, got: ${r.problems.join(' | ')}`);
      f.relock((l) => { l.hold = null; });
      must((await offline(f)).problems.length === 0, 'a cleared hold still refused');
    })],
    ['a mirrored file that changed without the lock is refused, and the message says what to edit', withFixture(async (f) => {
      const oldKeys = f.lock.well_known['scitt-keys'].sha256;
      const newKeys = Buffer.from('{"we_operate_a_ts":false,"keys":[1,2]}\n');
      writeFileSync(join(f.repo, 'public', '.well-known', 'scitt-keys'), newKeys);
      writeFileSync(join(f.site, '.well-known', 'scitt-keys'), newKeys);
      const r = await offline(f);
      must(mentions(r.problems, new RegExp(`scitt-keys: the repository copy public/\\.well-known/scitt-keys is sha256 ${sha256(newKeys)} .* set well_known\\["scitt-keys"\\]\\.sha256 to ${sha256(newKeys)} and add ${oldKeys} to its replaces`)), `mirror pin not enforced: ${r.problems.join(' | ')}`);
      // The same pull request edits the lock: new sha256, old one under replaces. Then it passes.
      f.relock((l) => { l.well_known['scitt-keys'].sha256 = sha256(newKeys); l.well_known['scitt-keys'].replaces = [oldKeys]; });
      must((await offline(f)).problems.length === 0, 'a mirror change made together with the lock was refused');

      const newDid = Buffer.from(`${JSON.stringify({ ...f.did, verificationMethod: [...f.did.verificationMethod, { id: `${DID_ID}#k2`, type: 'JsonWebKey2020', publicKeyJwk: { kty: 'OKP', crv: 'Ed25519', x: 'CCCC' } }] }, null, 2)}\n`);
      writeFileSync(join(f.repo, 'public', '.well-known', 'did.json'), newDid);
      writeFileSync(join(f.site, '.well-known', 'did.json'), newDid);
      must(mentions((await offline(f)).problems, /did\.json: the repository copy public\/\.well-known\/did\.json is sha256 .* the lock pins/), 'a DID document that changed without the lock was accepted');
    })],
    ['the upload holds only what the lock names: a stray page, another fallback page or a symlink is refused', withFixture(async (f) => {
      writeFileSync(join(f.site, 'portal.html'), '<p>not in the lock</p>');
      must(mentions((await offline(f)).problems, /upload: portal\.html is not named by the lock/), 'a stray page was accepted');
      rmSync(join(f.site, 'portal.html'));

      const page = readFileSync(join(f.site, 'index.html'));
      writeFileSync(join(f.site, 'index.html'), '<p>another page for every unknown /.well-known path</p>');
      must(mentions((await offline(f)).problems, /\/index\.html: sha256 .* is not the fallback page the lock pins/), 'a changed fallback page was accepted');
      rmSync(join(f.site, 'index.html'));
      must(mentions((await offline(f)).problems, /\/index\.html: missing from the upload/), 'a missing fallback page was accepted');
      f.relock((l) => { l.fallback_page = null; });
      must((await offline(f)).problems.length === 0, 'fallback_page: null with no index.html must pass');
      writeFileSync(join(f.site, 'index.html'), page);
      must(mentions((await offline(f)).problems, /the upload holds a fallback page; the lock says there is none/), 'a fallback page the lock rules out was accepted');
      f.relock((l) => { l.fallback_page = { sha256: sha256(page) }; });

      symlinkSync(join(f.repo, 'public', '.well-known', 'scitt-keys'), join(f.site, '.well-known', 'link.json'));
      must(mentions((await offline(f)).problems, /upload: \.well-known\/link\.json is a symlink or a special file/), 'a symlink in the upload was accepted');
    })],
    ['the folder wrangler runs in holds the upload and the middleware, and nothing that could steer it', withFixture(async (f) => {
      must(deployRootProblems(f.root, f.site).length === 0, `clean deploy folder refused: ${deployRootProblems(f.root, f.site).join(' | ')}`);
      for (const stray of ['wrangler.toml', 'wrangler.jsonc', 'package.json', '.npmrc', '.env', 'functions/api.js']) {
        writeFileSync(join(f.root, stray), 'x');
        must(mentions((await offline(f)).problems, new RegExp(`deploy folder: holds ${stray.replace(/[.]/g, '\\.')}, which is not part of the deploy`)), `${stray} beside the upload was accepted`);
        rmSync(join(f.root, stray));
      }
      mkdirSync(join(f.root, 'node_modules', 'wrangler'), { recursive: true });
      must(mentions(deployRootProblems(f.root, f.site), /deploy folder: holds node_modules/), 'node_modules beside the upload was accepted');
      rmSync(join(f.root, 'node_modules'), { recursive: true });
      must(deployRootProblems(f.dir, f.site).length === 1, 'a site that is not a direct child of the deploy folder was accepted');
      rmSync(join(f.root, 'functions', '_middleware.js'));
      must(mentions((await offline(f)).problems, /middleware: .* is missing from the deploy folder/), 'a deploy folder with no middleware was accepted');
    })],
    ['a pull request changes a key at the DID origin only by naming both documents in the lock', withFixture(async (f) => {
      const lock = JSON.parse(JSON.stringify(f.lock));
      const entry = lock.well_known['did.json'];
      const doc = (d) => Buffer.from(`${JSON.stringify(d, null, 2)}\n`);
      const at = (bytes, status = 200) => ({ status, body: bytes });
      const run = (committedBytes, live, l = lock) => driftVerdict({ lock: l, committedBytes, live });

      let v = run(f.didBytes, at(f.didBytes));
      must(v.verdict === 'pass' && /byte-identical/.test(v.lines[0]) && v.warnings.length === 0, 'identical documents did not pass');

      // A note differs, keys equal: passes as it always did. Listed under replaces: no warning.
      const oldNote = doc({ ...f.did, _gspcBoardKeyNote: 'An earlier note.' });
      entry.replaces = [sha256(oldNote)];
      v = run(f.didBytes, at(oldNote));
      must(v.verdict === 'pass' && v.warnings.length === 0 && mentions(v.lines, /lists the origin's document under replaces/), `note-only difference, listed: ${JSON.stringify(v)}`);
      entry.replaces = [];
      v = run(f.didBytes, at(oldNote));
      must(v.verdict === 'pass' && v.warnings.length === 1 && /does not list under well_known\["did\.json"\]\.replaces/.test(v.warnings[0]), 'note-only difference the lock does not list must pass with a warning');

      // The same keys in another list order, and another key order inside an entry, are the same keys.
      const k2 = { id: `${DID_ID}#k2`, type: 'JsonWebKey2020', publicKeyJwk: { kty: 'OKP', crv: 'Ed25519', x: 'CCCC' } };
      const two = { ...f.did, verificationMethod: [f.did.verificationMethod[0], k2] };
      const twoBytes = doc(two);
      const reordered = doc({ ...f.did, verificationMethod: [{ publicKeyJwk: { x: 'CCCC', crv: 'Ed25519', kty: 'OKP' }, type: 'JsonWebKey2020', id: `${DID_ID}#k2` }, f.did.verificationMethod[0]] });
      const lock2 = JSON.parse(JSON.stringify(lock));
      lock2.well_known['did.json'].sha256 = sha256(twoBytes);
      must(run(twoBytes, at(reordered), lock2).verdict === 'pass', 'the same keys in another order were read as a key change');

      // Branch 1 of the rule: a key is added here and the lock does not name the origin's document.
      v = run(twoBytes, at(f.didBytes), lock2);
      must(v.verdict === 'fail' && mentions(v.lines, /added \(committed, not at the origin\): #k2/) && mentions(v.lines, new RegExp(`adds the origin's sha256 \\(${sha256(f.didBytes)}\\) to well_known\\["did\\.json"\\]\\.replaces`)), `an unplanned key change did not fail with the instruction: ${JSON.stringify(v)}`);
      // Branch 2: the same change, with the origin's document listed under replaces.
      lock2.well_known['did.json'].replaces = [sha256(f.didBytes)];
      v = run(twoBytes, at(f.didBytes), lock2);
      must(v.verdict === 'pass' && /PLANNED CHANGE/.test(v.lines[0]) && mentions(v.lines, /added \(committed, not at the origin\): #k2/), `a key change named by both hashes did not pass: ${JSON.stringify(v)}`);
      // Removal and rotation are named too.
      lock2.well_known['did.json'].replaces = [];
      const rotated = doc({ ...f.did, verificationMethod: [{ ...f.did.verificationMethod[0], publicKeyJwk: { kty: 'OKP', crv: 'Ed25519', x: 'BBBB' } }, k2] });
      v = run(twoBytes, at(rotated), lock2);
      must(v.verdict === 'fail' && mentions(v.lines, /changed: #k1/), 'a rotated key was not named');
      v = run(f.didBytes, at(twoBytes));
      must(v.verdict === 'fail' && mentions(v.lines, /removed \(at the origin, not committed\): #k2/), 'a removed key was not named');
      v = run(f.didBytes, at(doc({ ...f.did, id: 'did:web:example.com' })));
      must(v.verdict === 'fail' && mentions(v.lines, /id: origin "did:web:example\.com"/), 'another DID at the origin was not named');

      // The committed copy must be the document the lock pins, whatever the origin serves.
      v = run(twoBytes, at(twoBytes));
      must(v.verdict === 'fail' && /the lock pins/.test(v.lines[0]), 'a committed document the lock does not pin was accepted');

      // An origin that does not answer with a DID document is neither a pass nor a failure.
      for (const live of [{ error: 'no answer in 20000 ms' }, at(Buffer.from('<!doctype html>'), 200), at(Buffer.from(''), 404), at(Buffer.from('[]'), 200), at(f.didBytes, 503)]) {
        v = run(f.didBytes, live);
        must(v.verdict === 'cannot-run' && /^CANNOT-RUN: /.test(v.lines[0]), `expected cannot-run for ${JSON.stringify({ ...live, body: live.body?.toString().slice(0, 20) })}, got ${v.verdict}`);
      }
    })],
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
        const unknown = (await liveCompare(s.base, f.lock, expected, opts)).blocking;
        must(mentions(unknown, /nor a sha256 the lock lists under replaces\. Two possible causes: production was written outside this route, or public\/\.well-known\/did\.json changed in a pull request/), `unknown live bytes did not block with both causes named: ${unknown.join(' | ')}`);
        must(mentions(unknown, /adds [0-9a-f]{64} to well_known\["did\.json"\]\.replaces/), 'the block does not say which sha256 to list');

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
        rmSync(join(f.site, '.well-known', 'scitt.json'));
        writeFileSync(join(f.site, '.well-known', 'scitt-keys'), readFileSync(join(f.repo, 'public', '.well-known', 'scitt-keys')));

        // All 46 hostile paths over HTTP: a faithful host sends none of them off councilof.ai.
        const hard = await readbackOnce(s.base, f.lock, expected, opts, { hostile: true });
        must(hard.length === 0, `faithful host, hostile paths over HTTP: ${hard.join(' | ')}`);

        // Another page behind every unknown /.well-known path: readback fails; before a deploy it is a listed change.
        const page = readFileSync(join(f.site, 'index.html'));
        writeFileSync(join(f.site, 'index.html'), '<p>another page</p>');
        must(mentions(await readbackOnce(s.base, f.lock, expected, opts), /a \/\.well-known path with no file: .* the lock says HTTP 200 with the pinned fallback page/), 'readback missed another fallback page');
        const live4 = await liveCompare(s.base, f.lock, expected, opts);
        must(live4.blocking.length === 0 && mentions(live4.changes, /a \/\.well-known path with no file: production answers HTTP 200 sha256/), 'another fallback page on the host must be a listed change');
        writeFileSync(join(f.site, 'index.html'), page);
      } finally { await s.close(); }

      s = await serve(f.site, WITHDRAWN_MIDDLEWARE);
      try {
        const bad = await readbackOnce(s.base, f.lock, expected, opts);
        must(mentions(bad, /OPEN REDIRECT/) && mentions(bad, /redirect \/\/example\.com\/x: got 308 https:\/\/example\.com\/x/), `withdrawn middleware over HTTP not caught: ${bad.join(' | ')}`);
        const worse = await readbackOnce(s.base, f.lock, expected, opts, { hostile: true });
        must(worse.filter((m) => /OPEN REDIRECT/.test(m)).length > bad.filter((m) => /OPEN REDIRECT/.test(m)).length, 'the hostile paths found nothing more on the withdrawn middleware');
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
      // This is the pre-merge check for the mirrored files: public/.well-known/did.json and
      // public/.well-known/scitt-keys must hash to what the lock pins, so a pull request that
      // changes one without the lock fails the required `gates` check with the edit to make.
      const { expected, problems: ep } = resolveExpected(lock, REPO_ROOT);
      must(ep.length === 0, ep.join(' | '));
      must([...expected.values()].filter((e) => e.mirror).length >= 2, 'the committed lock mirrors fewer than two files');
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
    if (['selftest', 'offline', 'hostile'].includes(key)) args[key] = true;
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
    const fields = {
      'candidate-branch': lock.pages.candidate_branch,
      'production-branch': lock.pages.production_branch,
      project: lock.pages.project,
      repository: lock.source.repository,
      'fallback-page': lock.fallback_page ? lock.fallback_page.sha256 : 'none',
      commit: lock.source.commit,
    };
    const field = args.field ?? 'commit';
    if (!Object.prototype.hasOwnProperty.call(fields, field)) { console.error(`pin: unknown --field ${field}`); return 1; }
    console.log(fields[field]);
    return 0;
  }

  if (mode === 'drift') {
    const { lock, problems } = readLock(lockFile);
    if (problems.length) { for (const m of problems) console.log(`FAIL: ${m}`); return 1; }
    const entry = lock.well_known['did.json'];
    const file = join(repoRoot, entry.mirror);
    if (!existsSync(file)) { console.log(`FAIL: ${entry.mirror} is missing from this checkout`); return 1; }
    const origin = args.origin ?? lock.pages.origin;
    let live;
    try { const a = await getRetry(origin, '/.well-known/did.json'); live = { status: a.status, body: a.body }; } catch (e) { live = { error: e.message }; }
    const v = driftVerdict({ lock, committedBytes: readFileSync(file), live, origin });
    for (const l of v.lines) console.log(l);
    for (const w of v.warnings) console.log(process.env.GITHUB_ACTIONS ? `::warning title=csoai.org DID document::${w}` : `WARNING: ${w}`);
    if (v.verdict === 'pass') return 0;
    // Same convention as scripts/verify-estate.mjs (E-T5-01): an unreachable input is CANNOT-RUN,
    // which does not fail a pull request for a network fault and is never printed as a pass.
    if (v.verdict === 'cannot-run') return process.env.CI ? 0 : 2;
    return 1;
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
      deployRoot: args['deploy-root'] ? resolve(args['deploy-root']) : null,
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
      try { last = await readbackOnce(args.base, lock, expected, {}, { hostile: Boolean(args.hostile) }); } catch (e) { last = [`could not read ${args.base} (${e.message})`]; }
      if (last.length === 0) {
        console.log(`readback ${args.base}: PASS on attempt ${i}. ${expected.size} /.well-known files match the lock (did.json sha256 ${expected.get('did.json').sha256}); a path with no file answers ${fallbackWords(lock)}; ${lock.redirects.exact.length} redirect rules match; ${args.hostile ? `${HOSTILE_PATHS.length} hostile paths sent, ` : ''}no path leaves councilof.ai.`);
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

  console.error('usage: apex-gate.mjs --selftest | pin | target | predeploy --site <dir> --source-head <sha> | readback --base <origin> | drift');
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (e) => { console.error(e); process.exitCode = 1; });
}
