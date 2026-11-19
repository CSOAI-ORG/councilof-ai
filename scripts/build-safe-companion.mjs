#!/usr/bin/env node
// Canonical source lives in packages/safe-companion. Public files are generated mirrors.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'packages/safe-companion');
const target = resolve(root, 'public/safe-companion');
const files = ['element.mjs', 'reader.mjs', 'schemas.mjs', 'examples.mjs', 'index.html', 'embed.mjs', 'integration.html'];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--check') || args.length > 1) {
  console.error('Usage: node scripts/build-safe-companion.mjs [--check]'); process.exit(64);
}
const check = args.includes('--check');
const outputs = new Map();
for (const file of files) outputs.set(file, await readFile(resolve(source, file)));
outputs.set('LICENSE', await readFile(resolve(source, 'vendor/LICENSE')));
const manifest = {
  generated_from: 'packages/safe-companion',
  component_version: '0.2.1',
  upstream_commit: '80605915dccf98b9b07e91a621170306d0a4ac58',
  role: 'Council-owned local reader; not an upstream-endorsed implementation or authority service.',
  sha256: Object.fromEntries([...outputs].map(([path, bytes]) => [path, sha256(bytes)])),
};
outputs.set('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2) + '\n'));
if (!check) await mkdir(target, { recursive: true });
const errors = [];
for (const [file, bytes] of outputs) {
  if (check) {
    try { if (!(await readFile(resolve(target, file))).equals(bytes)) errors.push(file); }
    catch { errors.push(file); }
  } else await writeFile(resolve(target, file), bytes);
}
for (const file of await readdir(target).catch(() => [])) {
  if (!outputs.has(file)) errors.push('unexpected file: ' + file);
}
if (errors.length) {
  console.error('SAFE companion mirror mismatch: ' + errors.join(', ')); process.exitCode = 1;
} else console.log(`SAFE companion: ${outputs.size} files ${check ? 'match canonical source' : 'generated'}.`);
