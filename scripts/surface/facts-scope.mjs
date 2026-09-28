import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';

// These six published snapshots have timestamp sidecars. Their bytes are retained;
// an exact-byte correction document scopes only the named, superseded fields.
const HISTORICAL_FIELDS = new Map([
 ['interop/continuous-churn-engine-v0.1.json', ['/adapters/27/source']],
 ['interop/master-harness-index-v0.1.json', ['/sources_bound_to_harness/24/source', '/sources_bound_to_harness/27/source']],
 ['interop/master-harness-index-v0.2.json', ['/sources_bound_to_harness/24/source', '/sources_bound_to_harness/27/source']],
 ['interop/master-harness-index-v0.3.json', ['/sources_bound_to_harness/24/source', '/sources_bound_to_harness/27/source']],
 ['interop/master-harness-index-v0.4.json', ['/sources_bound_to_harness/24/source', '/sources_bound_to_harness/27/source']],
 ['interop/master-consolidation-rollup-v0.1.json', ['/purpose']],
]);
const CORRECTION = 'interop/historical-interop-correction-2026-09-23.json';
const sha256 = value => createHash('sha256').update(value).digest('hex');

/** Return a scan copy with only corrected historical fields masked. Original bytes stay untouched. */
export function correctedHistoricalContent(raw, rel, rootDir) {
 const allowed = HISTORICAL_FIELDS.get(rel);
 if (!allowed) return raw;
 let correction, doc;
 try {
  correction = JSON.parse(readFileSync(join(rootDir, CORRECTION), 'utf8'));
  doc = JSON.parse(raw);
 } catch { return raw; }
 if (correction?.schema !== 'csoai.historical-interop-correction/1'
     || correction.status !== 'CORRECTION_TO_HISTORICAL_SNAPSHOTS') return raw;
 const record = correction.records?.find(row => row.path === rel);
 if (!record || record.source_sha256 !== sha256(raw)
     || record.original_bytes_preserved !== true
     || !Array.isArray(record.historical_fields)
     || record.historical_fields.length !== allowed.length
     || record.historical_fields.some((field, i) => field.json_pointer !== allowed[i])) return raw;
 const targets = [];
 for (const field of record.historical_fields) {
  const parts = field.json_pointer.split('/').slice(1);
  let parent = doc;
  for (const token of parts.slice(0, -1)) parent = parent?.[token];
  const key = parts.at(-1);
  const value = parent?.[key];
  if (typeof value !== 'string' || sha256(value) !== field.value_sha256) return raw;
  targets.push([parent, key]);
 }
 for (const [parent, key] of targets)
  parent[key] = '[Historical assertion superseded; see /' + CORRECTION + ']';
 return JSON.stringify(doc);
}

/** Isolate explicit quoted correction text from current-count claims.
 * Only two named historical-quotation fields within a valid correction record are
 * withheld from the axis-count rule. Current summaries and all other rules still run.
 */
export function currentCountContent(raw) {
 let doc;try{doc=JSON.parse(raw);}catch{return raw;}
 if(doc?.schema!=='csoai.correction-watch/0.1'||!Array.isArray(doc.scans))return raw;
 const copy=structuredClone(doc);
 for(const row of copy.scans){
  if(!row||typeof row!=='object'||!/^C-\d{4}-\d{4}-\d{2}$/.test(row.id??'')||typeof row.first_observed_at!=='string'||!Number.isFinite(Date.parse(row.first_observed_at)))continue;
  for(const key of ['what_was_wrong','why_it_was_wrong'])if(typeof row[key]==='string')row[key]='[Historical quotation for '+row.id+'; not a present board-count claim.]';
 }
 return JSON.stringify(copy);
}
/** An explicitly bank-qualified subset is not a whole-board count. */
export function isFrozenBankSubset(n,total,following){return Number.isSafeInteger(n)&&n>=0&&n<=total&&/^\s+carrying\s+(?:a|the)\s+frozen\s+bank\b/i.test(following);}
