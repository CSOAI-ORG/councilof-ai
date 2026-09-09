#!/usr/bin/env node
// Packaging only: all card cryptography stays in the existing verifier package.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, lstatSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SELF), '..');
const PACKAGE = 'packages/gspc-card-verifier';
const SOURCES = ['src/verify.mjs', 'src/canonical.mjs', 'profile/csoai-gspc-1.json', 'LICENSE', 'NOTICE'];
const HEX = /^[a-f0-9]{64}$/;
const LIMITS = [
  'Signature verification authenticates the signed statement, not measurement correctness.',
  'Selected records only: no claim of corpus completeness or current applicability.',
  'No independent model re-execution, legal conclusion, certification, underwriting decision, or insurance acceptance.',
  'No timestamp, Bitcoin anchoring, revocation, or issuer-identity investigation is performed by this kit.',
  'A mutable model name is not an exact weights or API revision; absent fields remain null.',
];
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);

export function publicCardURL(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || !['councilof.ai', 'csoai.org'].includes(u.hostname)
      || u.port || u.username || u.password || u.search || u.hash
      || !/^\/signed\/cards\/[a-f0-9]{64}\.json$/.test(u.pathname)) {
    throw new Error('Only explicit public Council HTTPS signed-card URLs are supported');
  }
  return u.href;
}

async function getCard(url, fetcher) {
  const r = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(20000), credentials: 'omit' });
  if (!r.ok) throw new Error(`Card request failed: HTTP ${r.status}`);
  const chunks = []; let size = 0;
  for await (const chunk of r.body) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error('Card exceeds 1 MiB limit');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function summary(card) {
  const b = card.body;
  return {
    card_id: card.id, axis: b.axis ?? null, model: b.model ?? null,
    measured_at_as_declared: b.measured_at ?? b.created ?? b.ts ?? null,
    sample_size_as_declared: b.n ?? b.n_items ?? null,
    status_as_declared: b.status ?? null, exact_model_revision_as_declared: b.model_revision ?? null,
    measurement_body: b, scope_note: 'Fields copied from the signed body; not independently validated facts.',
    missing_information: ['sample size', 'exact model revision', 'measurement limits'].filter((_, i) =>
      [b.n ?? b.n_items, b.model_revision, b.limits][i] == null),
  };
}

async function checkCard(bytes, verifyCard, profile) {
  const card = JSON.parse(bytes);
  const original = await verifyCard(card, profile);
  if (original.state !== 'VALID') throw new Error(`Card ${original.state}: ${original.code}`);
  // Change a signed string, not numeric formatting. No signature or id is repaired.
  const tampered = structuredClone(card);
  tampered.body.axis = `${tampered.body.axis ?? ''} [tampered]`;
  const negative = await verifyCard(tampered, profile);
  if (negative.state !== 'INVALID') throw new Error('Tamper control did not return INVALID');
  return { card, original, negative };
}

export async function capture({ out, commit, urls, fetcher = fetch, repo = ROOT }) {
  if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('A full reviewed verifier commit SHA is required');
  if (!Array.isArray(urls) || !urls.length || urls.length > 8) throw new Error('Select between 1 and 8 card URLs');
  urls = urls.map(publicCardURL);
  if (new Set(urls).size !== urls.length) throw new Error('Duplicate card URLs');
  const snapshots = [];
  for (const url of urls) snapshots.push({ url, bytes: await getCard(url, fetcher) });
  const sourceBytes = SOURCES.map(name => ({ name, bytes: execFileSync('git', ['show', `${commit}:${PACKAGE}/${name}`], { cwd: repo, maxBuffer: 1024 * 1024 }) }));
  // Refuse to replace any existing directory or file. Failed captures remain local diagnostics.
  mkdirSync(out, { mode: 0o700 });
  mkdirSync(join(out, 'verifier')); mkdirSync(join(out, 'verifier/src'));
  mkdirSync(join(out, 'verifier/profile')); mkdirSync(join(out, 'cards'));
  const files = {};
  const put = (name, bytes) => { writeFileSync(join(out, name), bytes, { flag: 'wx' }); files[name] = sha256(bytes); };
  for (const s of sourceBytes) put(`verifier/${s.name}`, s.bytes);
  const { verifyCard } = await import(pathToFileURL(join(resolve(out), 'verifier/src/verify.mjs')).href);
  const profile = JSON.parse(readFileSync(join(out, 'verifier/profile/csoai-gspc-1.json')));
  const records = [];
  for (const { url, bytes } of snapshots) {
    const { card, original, negative } = await checkCard(bytes, verifyCard, profile);
    if (!url.endsWith(`/${card.id}.json`)) throw new Error('Requested content id differs from returned card id');
    const file = `cards/${card.id}.json`;
    put(file, bytes);
    records.push({ url, file, file_sha256: sha256(bytes), verification: original, tamper_control: negative, ...summary(card) });
  }
  const exportBody = { kind: 'csoai.buyer-evidence-export', version: 1, purpose: 'Procurement / underwriting evidence review only',
    decision: 'NOT_ASSESSED', limits: LIMITS, records };
  put('buyer-evidence.json', json(exportBody));
  put('replay.mjs', readFileSync(SELF));
  const manifest = { kind: 'csoai.replay-kit', version: 1, captured_at: new Date().toISOString(),
    verifier: { repository: 'https://github.com/CSOAI-ORG/councilof-ai', commit, package: PACKAGE,
      source_files: Object.fromEntries(sourceBytes.map(s => [`${PACKAGE}/${s.name}`, sha256(s.bytes)])),
      pinned_key_id: profile.pinnedKeyId, pinned_public_key: profile.pinnedPubkeyHex },
    files, records: records.map(r => ({ url: r.url, file: r.file, file_sha256: r.file_sha256 })),
    manifest_signature: 'UNSIGNED_LOCAL_MANIFEST', limits: LIMITS };
  const bytes = json(manifest);
  writeFileSync(join(out, 'manifest.json'), bytes, { flag: 'wx' });
  return { state: 'CAPTURED', records: records.length, manifest_sha256: sha256(bytes), out: resolve(out) };
}

export async function replay({ dir, expectedManifestSha }) {
  if (!HEX.test(expectedManifestSha ?? '')) throw new Error('Supply the manifest SHA-256 kept outside the kit');
  const bytes = readFileSync(join(dir, 'manifest.json'));
  if (sha256(bytes) !== expectedManifestSha) throw new Error('Manifest digest mismatch');
  const m = JSON.parse(bytes);
  if (m.kind !== 'csoai.replay-kit' || m.version !== 1 || !/^[a-f0-9]{40}$/.test(m.verifier?.commit ?? '')) throw new Error('Unsupported manifest');
  const expectedFiles = new Set(['buyer-evidence.json', 'replay.mjs', ...SOURCES.map(s => `verifier/${s}`), ...m.records.map(r => r.file)]);
  if (Object.keys(m.files).length !== expectedFiles.size) throw new Error('Unexpected file manifest');
  // Authenticate every copied executable/profile before importing any of it.
  for (const [name, digest] of Object.entries(m.files)) {
    if (!expectedFiles.has(name) || !/^(?:verifier\/(?:src\/[a-z]+\.mjs|profile\/csoai-gspc-1\.json|LICENSE|NOTICE)|cards\/[a-f0-9]{64}\.json|buyer-evidence\.json|replay\.mjs)$/.test(name)) throw new Error('Unsafe file path');
    const p = join(dir, name);
    if (!lstatSync(p).isFile() || sha256(readFileSync(p)) !== digest) throw new Error(`File digest mismatch: ${name}`);
  }
  const { verifyCard } = await import(pathToFileURL(join(resolve(dir), 'verifier/src/verify.mjs')).href);
  const profile = JSON.parse(readFileSync(join(dir, 'verifier/profile/csoai-gspc-1.json')));
  const results = [];
  const buyer = JSON.parse(readFileSync(join(dir, 'buyer-evidence.json')));
  for (const r of m.records) {
    publicCardURL(r.url);
    if (r.file_sha256 !== m.files[r.file]) throw new Error('Record digest disagreement');
    const checked = await checkCard(readFileSync(join(dir, r.file)), verifyCard, profile);
    if (!r.url.endsWith(`/${checked.card.id}.json`)) throw new Error('Record URL/id disagreement');
    const exported = buyer.records.find(x => x.card_id === checked.card.id);
    if (!exported || JSON.stringify(exported.measurement_body) !== JSON.stringify(checked.card.body)) throw new Error('Buyer export differs from signed body');
    results.push({ id: checked.card.id, original: checked.original.state, tampered: checked.negative.state });
  }
  return { state: 'VERIFIED_SELECTED_RECORDS', verifier_commit: m.verifier.commit, records: results,
    measurement_correctness: 'NOT_TESTED', completeness: 'NOT_TESTED', bitcoin_anchor: 'NOT_TESTED' };
}

async function main() {
  const [mode, ...args] = process.argv.slice(2); const options = {}; const urls = [];
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i + 1]) throw new Error('Missing option value');
    if (args[i] === '--url') urls.push(args[i + 1]);
    else if (['--out', '--commit', '--dir', '--manifest-sha256'].includes(args[i])) options[args[i]] = args[i + 1];
    else throw new Error('Unknown option');
  }
  const result = mode === 'capture' ? await capture({ out: options['--out'], commit: options['--commit'], urls })
    : mode === 'verify' ? await replay({ dir: options['--dir'], expectedManifestSha: options['--manifest-sha256'] })
    : (() => { throw new Error('Usage: capture --out NEW_DIR --commit FULL_SHA --url PUBLIC_CARD_URL | verify --dir KIT --manifest-sha256 SHA'); })();
  console.log(JSON.stringify(result, null, 2));
}
if (process.argv[1] && resolve(process.argv[1]) === SELF) main().catch(error => { console.error(error.message); process.exitCode = 1; });
