/** Deterministic local generator for the MEOK public Ask mirror; never publishes. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const args = process.argv.slice(2), index = args.indexOf('--target');
if (index < 0 || !args[index + 1] || !path.isAbsolute(args[index + 1]) || args.length !== 3 || !['--check', '--write'].includes(args[2])) throw new Error('Use --target /absolute/meok-workspace.js --check|--write.');
const canonical = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'publicAsk.mjs')), hash = createHash('sha256').update(canonical).digest('hex');
const source = canonical.toString('utf8'), trailer = /^export \{ [^\n]+ \};\n$/m;
if (!trailer.test(source) || source.match(/^export /gm)?.length !== 1 || !source.endsWith(source.match(trailer)[0])) throw new Error('Unexpected canonical export shape.');
const body = source.replace(trailer, '').replace(/\n$/, '').split('\n').map(line => '  ' + line).join('\n');
const begin = '  // BEGIN GENERATED PUBLIC ASK CORE', end = '  // END GENERATED PUBLIC ASK CORE', target = args[index + 1], current = fs.readFileSync(target, 'utf8');
if (current.split(begin).length !== 2 || current.split(end).length !== 2 || current.indexOf(begin) >= current.indexOf(end)) throw new Error('Expected exactly one ordered public Ask generated region.');
const first = current.indexOf(begin), last = current.indexOf(end) + end.length;
const generated = `${begin}\n  // canonical-sha256: ${hash}\n${body}\n${end}`;
const next = current.slice(0, first) + generated + current.slice(last);
if (args[2] === '--check' && next !== current) throw new Error('The public Ask mirror does not match the canonical source.');
if (args[2] === '--write') fs.writeFileSync(target, next);
process.stdout.write(JSON.stringify({ state: args[2] === '--check' ? 'MATCH' : 'GENERATED', canonical_sha256: hash, mode: args[2] === '--check' ? 'read-only-check' : 'local-generation' }) + '\n');
