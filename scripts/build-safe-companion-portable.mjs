#!/usr/bin/env node
// Optional single-file review copy. Uses the monorepo's existing esbuild dependency.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (process.argv.length !== 3) {
  console.error('Usage: node scripts/build-safe-companion-portable.mjs OUTPUT.html'); process.exit(64);
}
const output = resolve(process.argv[2]);
const result = await build({ entryPoints: [resolve(root, 'packages/safe-companion/element.mjs')], bundle: true,
  format: 'iife', platform: 'browser', target: 'es2022', write: false, minify: false, legalComments: 'inline' });
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const hash = createHash('sha256').update(js).digest('base64');
let html = await readFile(resolve(root, 'packages/safe-companion/index.html'), 'utf8');
const licence = await readFile(resolve(root, 'packages/safe-companion/vendor/LICENSE'), 'utf8');
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
html = html.replace("script-src 'self'", `script-src 'sha256-${hash}'`)
  .replace('<script type="module" src="./element.mjs"></script>', `<script>${js}</script>`)
  .replace('</main>', `<details style="max-width:1140px;margin:20px auto;color:#183c38"><summary>Source attribution and Apache-2.0 licence</summary><p>Includes unmodified project schemas and synthetic examples from Theseus Guard's osaa-safe-starter-kit at commit 80605915dccf98b9b07e91a621170306d0a4ac58, bundled by the independent Council of AI companion.</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${escape(licence)}</pre></details></main>`);
if (!html.includes(`script-src 'sha256-${hash}'`) || html.includes('src="./element.mjs"')) throw new Error('Portable template changed; review the build script.');
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
console.log('Portable SAFE reader built with a content-hashed script policy.');
