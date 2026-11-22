#!/usr/bin/env node
// Prepare a human review queue from a retained daily signal; never create mappings.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const hash = b => createHash('sha256').update(b).digest('hex');
export function buildQueue(reportBytes, crosswalkBytes) {
  const report = JSON.parse(reportBytes), crosswalk = JSON.parse(crosswalkBytes);
  if (report.schema !== 'csoai.daily-signal/0.1' || !Array.isArray(report.signals)) throw new Error('unsupported daily signal');
  if (!Array.isArray(crosswalk.frameworks)) throw new Error('invalid crosswalk');
  const crosswalkHash = hash(crosswalkBytes);
  if (report.generated_from?.crosswalk?.sha256 !== crosswalkHash) throw new Error('crosswalk bytes do not match report');
  const items = report.signals.filter(s => s.mapping?.state !== 'REVIEWED_DECLARATION').map(s => {
    if (!/^[a-f0-9]{64}$/.test(s.event_sha256 ?? '')) throw new Error('invalid event digest');
    return { event_sha256: s.event_sha256, source_index: s.source_index, date: s.date,
      jurisdiction: s.jurisdiction, instrument: s.instrument, provision: s.provision,
      clock_source_status: s.source_status, current_mapping_state: s.mapping?.state ?? 'UNKNOWN',
      review_status: 'PENDING', official_source_url: null, official_source_version: null,
      candidate_framework: null, candidate_provision_ids: [], reviewer: null, review_ref: null };
  });
  return {schema:'csoai.daily-mapping-review-queue/0.1', report_sha256:hash(reportBytes),
    report_as_of:report.as_of, crosswalk_sha256:crosswalkHash, items,
    limitations:['Review queue only: no mapping has been made or approved.',
      'Check the official version, effective date and applicability separately.',
      'A report refresh is not a measurement, legal assessment or certification.']};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 5) throw new Error('usage: node build.mjs REPORT CROSSWALK OUTPUT');
    const [report, crosswalk, out] = process.argv.slice(2).map(p => resolve(p));
    if (out === report || out === crosswalk) throw new Error('output must not overwrite an input');
    writeFileSync(out, JSON.stringify(buildQueue(readFileSync(report), readFileSync(crosswalk)), null, 2)+'\n', {flag:'wx'});
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
