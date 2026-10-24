#!/usr/bin/env node
// Read one immutable public dataset artifact. No ledger requests, signing or writes.
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const SOURCE = Object.freeze({
  repository: 'csoai/cross-ledger-supply',
  revision: 'b4f117431874d07b074524a6dcaa14a00bbcbb8e',
  path: 'interop/cross-ledger-benji-2026-09-25.json',
  sha256: '51ec46fbe5ab0d30d0a68ed35bb63ee48517a08a9f7cc4b751b415c9544fed77',
});
export const MAX_BYTES = 512 * 1024;
export const SOURCE_URL = 'https://huggingface.co/datasets/' + SOURCE.repository + '/resolve/' + SOURCE.revision + '/' + SOURCE.path;

export async function fetchBytes(fetcher = globalThis.fetch) {
  const response = await fetcher(SOURCE_URL, {
    headers: { 'User-Agent': 'csoai-read-only-reuse/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error('Dataset read failed: HTTP ' + response.status);
  if (!response.body) throw new Error('Dataset read returned no body');
  const reader = response.body.getReader();
  const parts = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error('Dataset exceeds the 512 KiB read limit');
      parts.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  return Buffer.concat(parts, size);
}

export function projectRecord(record) {
  if (record.schema !== 'csoai.cross-ledger-supply/0.2' || !Array.isArray(record.per_ledger)) {
    throw new Error('Unsupported cross-ledger artifact schema');
  }
  if (typeof record.as_of !== 'string') throw new Error('Artifact observation date is missing');
  const rows = record.per_ledger.map((row) => {
    const supply = row.supply_decimal ?? null;
    if (supply !== null && (typeof supply !== 'string' || !/^[0-9]+(?:\.[0-9]+)?$/.test(supply))) {
      throw new Error('Supply must remain a decimal string or null');
    }
    return {
      product: row.product ?? null,
      ledger: row.ledger ?? null,
      supply_decimal: supply,
      reported_evidence_kind: row.evidence_kind ?? null,
      reported_two_operators_agree: row.two_operators_agree ?? null,
      recorded_height: row.height ?? null,
    };
  });
  return {
    record_as_of: record.as_of,
    asset: record.asset,
    reported_reconciliation_state: record.reconciliation_state ?? null,
    issuer_reported: record.issuer_reported ?? null,
    rows,
    checks: {
      signature: 'NOT_PERFORMED',
      issuer_authentication: 'NOT_PERFORMED',
      ledger_proof: 'NOT_PERFORMED',
      bitcoin_anchor: 'NOT_PERFORMED',
    },
    limitation: 'Historical producer-reported ledger observations; no AUM, NAV, backing, ownership or current supply is established.',
  };
}

export function inspectBytes(bytes) {
  if (bytes.length > MAX_BYTES) throw new Error('Dataset exceeds the 512 KiB read limit');
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== SOURCE.sha256) throw new Error('Pinned artifact SHA256 mismatch');
  return {
    source: { ...SOURCE, url: SOURCE_URL, actual_sha256: digest, bytes: bytes.length },
    ...projectRecord(JSON.parse(bytes.toString('utf8'))),
    artifact_sha256_check: 'MATCH',
  };
}

export async function main(args = process.argv.slice(2)) {
  const help = 'Usage: node scripts/readers/read-hf-cross-ledger.mjs [--file PATH]\nReads one pinned historical artifact; prints JSON only. Node 20+.';
  if (args.length === 1 && args[0] === '--help') {
    process.stdout.write(help + '\n');
    return;
  }
  if (args.length && !(args.length === 2 && args[0] === '--file')) throw new Error(help);
  let bytes;
  if (args.length) {
    if ((await stat(args[1])).size > MAX_BYTES) throw new Error('Dataset exceeds the 512 KiB read limit');
    bytes = await readFile(args[1]);
  } else {
    bytes = await fetchBytes();
  }
  const output = inspectBytes(bytes);
  output.read_origin = args.length ? 'LOCAL_COPY' : 'PINNED_HF_URL';
  output.retrieved_at = new Date().toISOString();
  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    process.stderr.write('UNCHECKABLE: ' + error.message + '\n');
    process.exitCode = 1;
  });
}
