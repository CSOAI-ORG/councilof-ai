#!/usr/bin/env node
import { open } from 'node:fs/promises';
import { constants } from 'node:fs';
import { inspectExport, compareExports, verifySavedReport, LIMITS } from './reader.mjs';

async function readBounded(path) {
  // Nonblocking open prevents a selected FIFO from hanging before regular-file
  // validation. No create, truncate or write flag is present.
  const file = await open(path, constants.O_RDONLY | (constants.O_NONBLOCK ?? 0));
  try {
    const info = await file.stat();
    if (!info.isFile() || info.size > LIMITS.bytes) throw new Error('Input must be a regular file no larger than 1 MiB.');
    // Read at most limit+1 even if a file grows after stat. No file is written.
    const buffer = new Uint8Array(LIMITS.bytes + 1); let used = 0;
    while (used < buffer.length) {
      const { bytesRead } = await file.read(buffer, used, buffer.length - used, null);
      if (!bytesRead) break; used += bytesRead;
    }
    if (used > LIMITS.bytes) throw new Error('Input grew beyond the 1 MiB limit.');
    return buffer.slice(0, used);
  } finally { await file.close(); }
}
try {
  const [command, first, second, ...extra] = process.argv.slice(2);
  if (extra.length || !first || !['inspect', 'compare', 'verify-saved'].includes(command) || (command === 'inspect' ? second !== undefined : !second)) {
    process.stderr.write('Usage: node cli.mjs inspect EXPORT.json | compare OLD.json NEW.json | verify-saved EXPORT.json DIAGNOSTIC.json\n');
    process.exitCode = 64;
  } else {
    const a = await readBounded(first);
    let output;
    if (command === 'inspect') {
      output = (await inspectExport(a)).report;
      if (!output.accepted_for_reading) process.exitCode = 2;
    } else if (command === 'compare') {
      output = await compareExports(a, await readBounded(second));
      if (['NOT_COMPARABLE', 'UNRELATED', 'CONFLICT'].includes(output.decision)) process.exitCode = 2;
    } else {
      output = await verifySavedReport(a, await readBounded(second));
      if (!output.matches) process.exitCode = 2;
    }
    process.stdout.write(JSON.stringify(output, null, 2) + '\n');
  }
} catch {
  // Do not expose input names, paths, contents or exception text in diagnostics.
  process.stderr.write('Local read failed. Check the file, size limit and WebCrypto support. No output file was written.\n');
  process.exitCode = 1;
}
