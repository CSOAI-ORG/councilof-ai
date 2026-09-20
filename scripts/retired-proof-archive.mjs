/** Pack build replicas of retired proof files while retaining originals outside the serving tree. */
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readdirSync, readFileSync, mkdirSync, writeFileSync, renameSync, realpathSync } from 'node:fs';
import { resolve, join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
export const ARCHIVE_PATH = 'archive/retired-proof-bytes-v1.json';
export const ARCHIVE_SCHEMA = 'csoai.retired-proof-bytes/0.1';
const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export const eligiblePath = name => /^interop\/[A-Za-z0-9_./-]+\.invalid$/.test(name) && !name.split('/').some(p => p === '..' || p === '.' || p === '');
export function entries(root) {
  root = resolve(root); const start = join(root, 'interop'), results = [];
  if (!existsSync(start)) return results;
  const walk = dir => { for (const name of readdirSync(dir).sort()) {
    const file = join(dir, name), stat = lstatSync(file);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) walk(file);
    else if (stat.isFile() && eligiblePath(relative(root, file).split('\\').join('/'))) {
      if (stat.size > 65536) throw new Error('Retired evidence member exceeds 64 KiB bound');
      results.push({ path: relative(root, file).split('\\').join('/'), file });
    }
  } }; walk(start); return results;
}
export function makeArchive(root) {
  const members = {};
  for (const {path, file} of entries(root)) { const bytes = readFileSync(file); members['/' + path] = {sha256: sha(bytes), bytes: bytes.length, body_base64: bytes.toString('base64')}; }
  const doc = {schema: ARCHIVE_SCHEMA, evidence_state: 'RETIRED_OR_INVALID_HISTORICAL_BYTES_ONLY', note: 'Exact archived bytes, not a valid proof, new signature or endorsed claim. Original URL and digest remain available.', members};
  const bytes = Buffer.from(JSON.stringify(doc));
  if (bytes.length > 4_000_000) throw new Error('Retired evidence archive exceeds 4 MB bound');
  return {doc, bytes};
}
export function verifyArchive(doc, originals = []) {
  if (!doc || doc.schema !== ARCHIVE_SCHEMA || !doc.members || typeof doc.members !== 'object' || Array.isArray(doc.members)) throw new Error('Archive schema mismatch');
  for (const [url, member] of Object.entries(doc.members)) {
    if (!eligiblePath(url.slice(1)) || !/^[a-f0-9]{64}$/.test(member.sha256) || !Number.isSafeInteger(member.bytes)) throw new Error('Invalid archive member');
    const bytes = Buffer.from(member.body_base64, 'base64');
    if (bytes.length > 65536 || bytes.length !== member.bytes || bytes.toString('base64') !== member.body_base64 || sha(bytes) !== member.sha256) throw new Error('Archive member digest mismatch');
  }
  for (const {path,file} of originals) { const bytes = readFileSync(file), member = doc.members['/'+path]; if (!member || sha(bytes) !== member.sha256 || !bytes.equals(Buffer.from(member.body_base64,'base64'))) throw new Error('Original evidence mismatch'); }
  return Object.keys(doc.members).length;
}
export function pack(root) {
  root = resolve(root);
  if (realpathSync(root) === realpathSync(resolve(REPO, 'public'))) throw new Error('Refusing canonical public input; only generated build replicas may be relocated');
  const archiveFile = join(root, ARCHIVE_PATH), original = entries(root);
  if (!original.length && existsSync(archiveFile)) return {state:'ALREADY_PACKED',members:verifyArchive(JSON.parse(readFileSync(archiveFile,'utf8')))};
  const proposed = makeArchive(root);
  if (existsSync(archiveFile)) {
    const prior=JSON.parse(readFileSync(archiveFile,'utf8'));verifyArchive(prior);
    for(const [path,member] of Object.entries(prior.members)) {
      const fresh=proposed.doc.members[path];
      if(fresh && fresh.sha256!==member.sha256)throw new Error('Existing historical path changed; explicit evidence reconciliation required');
      proposed.doc.members[path]=member;
    }
  }
  const doc=proposed.doc,bytes=Buffer.from(JSON.stringify(doc));
  if(bytes.length>4_000_000)throw new Error('Combined archive exceeds bound');
  verifyArchive(doc, original);
  mkdirSync(join(root,'archive'),{recursive:true});const temp=archiveFile+'.pack-tmp';writeFileSync(temp,bytes,{flag:'wx'});renameSync(temp,archiveFile);
  const restored = JSON.parse(readFileSync(archiveFile,'utf8'));verifyArchive(restored,original);
  // Preserve build replicas outside the served tree, in addition to canonical public/ and package.
  const retained = join(dirname(root),'retired-evidence-originals-'+Date.now());
  for (const item of original) { if (sha(readFileSync(item.file)) !== restored.members['/'+item.path].sha256) throw new Error('Concurrent evidence mutation'); }
  for (const item of original) { const dest=join(retained,item.path);mkdirSync(dirname(dest),{recursive:true});renameSync(item.file,dest); }
  return {state:'PACKED_AND_READ_BACK',members:original.length,archive_bytes:bytes.length,archive_sha256:sha(bytes),retained_build_replicas:retained,canonical_sources_removed:0};
}
export function projection(root, physicalCount) {
  if (!existsSync(join(REPO,'functions/interop/[[path]].ts'))) throw new Error('Historical URL reader missing');
  const {doc,bytes}=makeArchive(root);const count=verifyArchive(doc,entries(root));
  return {physical:physicalCount,projected:physicalCount-count+(count&&!existsSync(join(root,ARCHIVE_PATH))?1:0),archived_members:count,archive_bytes:bytes.length,meaning:'SOURCE_PROJECTION_ONLY; final built-tree physical cap remains mandatory'};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const at=process.argv.indexOf('--dir');if(at<0||!process.argv[at+1])throw new Error('--dir required');
  console.log(JSON.stringify(pack(process.argv[at+1]),null,2));
}
