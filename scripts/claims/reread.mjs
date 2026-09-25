#!/usr/bin/env node
/**
 * reread.mjs — re-read every claim in a published registry and report the digest that comes back.
 *
 * Specification: https://councilof.ai/spec/claim-maintenance/v0.2/  (CC0 1.0). This file: MIT.
 *
 * This is the "re-read on a schedule" half of the specification (§1.7), and it exists as a separate
 * Node module for one reason: the digest a re-read produces MUST be computed by the same extractor
 * that produced the digest it is compared against. A second implementation of §6.3 would disagree
 * with the first on stray whitespace and entity decoding, and every disagreement would surface as
 * an observed change that carried no information about the claim. One extractor, imported from the
 * reference implementation, for both the capture and the re-read.
 *
 * LIKE WITH LIKE (spec v0.2 6.3). Since 2026-09-25 the reference has two extractors: rule 1, frozen
 * in the v0.1 reference, and rule 2, which decodes each character reference once. A recorded
 * digest is recomputed by the extractor that made it: the one its source_content_hash.extractor
 * names, or rule 1 when it names none. A rule-1 digest compared against a rule-2 digest of the same
 * bytes differs on any page carrying `&#x27;` or `&rsquo;`, and that difference is a change of
 * reader, not of page, so it is never reported as `changed`. The current rule-2 digest is reported
 * beside it as `current_hash_current_extractor`, for re-baselining, and compared with nothing.
 *
 * It states a difference between two digests and nothing else. It reaches no conclusion, it uses no
 * word of motive, and it does not care why a page changed — a subject may change its website for
 * any reason, including a better reason than ours (spec §4.9).
 *
 *   node scripts/claims/reread.mjs --registry <file> [--only CL-1,CL-2] > readings.json
 *
 * Output: {"registry_id":…, "read_at_utc":…, "readings":[{claim_id, url, covers, extractor,
 *          recorded_hash, current_hash, changed, current_hash_current_extractor, http_status, reason}]}
 */
import { readFileSync } from 'node:fs';
import { CURRENT_EXTRACTOR, EXTRACTOR_RULE_1, extractorFor, sha256hex } from '../claim-capture.mjs';

const SPEC = 'https://councilof.ai/spec/claim-maintenance/v0.2/';
const UA = `CSOAI-claim-maintenance/0.2 (+${SPEC})`;
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d;
};

const registryPath = arg('registry');
if (!registryPath) {
  console.error('usage: reread.mjs --registry <published registry json> [--only ID,ID]');
  process.exit(2);
}
const reg = JSON.parse(readFileSync(registryPath, 'utf8'));
const only = arg('only') ? new Set(arg('only').split(',')) : null;

/** Both registry shapes, because the estate holds one of each and a watch that reads only the
 * newer shape silently stops watching the older subjects. */
function claimsOf(doc) {
  if (Array.isArray(doc.claims)) {
    return doc.claims.map((c) => ({
      claim_id: c.claim_id,
      subject: c.subject?.name ?? null,
      url: c.source_url,
      covers: c.source_content_hash?.covers ?? 'visible-text',
      // The extractor that made the RECORDED digest. Absent means rule 1: every digest taken
      // before spec v0.2 was taken by rule 1, and none of them names it.
      extractor: (c.source_content_hash?.covers ?? 'visible-text') === 'visible-text'
        ? (c.source_content_hash?.extractor ?? EXTRACTOR_RULE_1) : null,
      recorded_hash: c.source_content_hash?.value ?? null,
      state: c.state,
    }));
  }
  const out = [];
  for (const [key, s] of Object.entries(doc.subjects || {})) {
    for (const c of s.claims || []) {
      const src = (c.sources || [])[0] || {};
      out.push({
        claim_id: c.id ?? c.claim_id,
        subject: key,
        url: src.url ?? s.source ?? null,
        covers: 'visible-text',
        extractor: CURRENT_EXTRACTOR,
        // The pre-specification registry records the digest of the RAW response, not of the
        // extracted text. Comparing a fresh visible-text digest against it would report a change
        // on every read, so the recorded digest is carried as null and the reading is published
        // as a new baseline rather than as a comparison.
        recorded_hash: null,
        recorded_hash_absent_because:
          'this registry predates the specification and records a response-body digest rather than '
          + 'a visible-text digest; the two are not comparable and no comparison is asserted',
        state: c.state,
      });
    }
  }
  return out;
}

const readings = [];
for (const c of claimsOf(reg)) {
  if (only && !only.has(c.claim_id)) continue;
  if (!c.url) {
    readings.push({ ...c, current_hash: null, changed: null, reason: 'no source url recorded' });
    continue;
  }
  let res;
  try {
    res = await fetch(c.url, {
      redirect: 'follow',
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8' },
    });
  } catch (e) {
    readings.push({
      ...c, current_hash: null, changed: null, http_status: null,
      reason: `transport failure from this host: ${String(e).slice(0, 120)}`,
      recorded_as: 'SEARCH_INCONCLUSIVE',
    });
    continue;
  }
  if (!res.ok) {
    readings.push({
      ...c, current_hash: null, changed: null, http_status: res.status,
      reason: `HTTP ${res.status}`,
      recorded_as: 'SEARCH_INCONCLUSIVE',
      note: 'a page this reader could not obtain is inconclusive with its status recorded. It is not '
          + 'an absence and it is not a statement about the subject',
    });
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  let extract;
  try {
    extract = c.covers === 'visible-text' ? extractorFor(c.extractor) : null;
  } catch (e) {
    // A digest whose extractor this reader does not hold cannot be recomputed like with like, so
    // no comparison is made and none is implied.
    readings.push({ ...c, http_status: res.status, current_hash: null, changed: null,
      reason: String(e.message || e).slice(0, 160) });
    continue;
  }
  const digestOf = (fn) => sha256hex(Buffer.from(fn(buf.toString('utf8')), 'utf8'));
  const hash = extract ? digestOf(extract) : sha256hex(buf);
  readings.push({
    ...c, http_status: res.status, current_hash: hash,
    changed: c.recorded_hash ? hash !== c.recorded_hash : null,
    ...(extract && c.extractor !== CURRENT_EXTRACTOR
      ? { current_extractor: CURRENT_EXTRACTOR, current_hash_current_extractor: digestOf(extractorFor(CURRENT_EXTRACTOR)) }
      : {}),
  });
}

process.stdout.write(JSON.stringify({
  registry_id: reg.registry_id ?? null,
  registry_file: registryPath,
  read_at_utc: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  extractor: 'scripts/claim-capture.mjs :: extractorFor(recorded extractor) — each recorded digest is '
    + 'recomputed by the rule that produced it (rule 1 when the artifact names none), imported rather '
    + 'than reimplemented, so a difference between two digests is a difference in the source and never '
    + 'a difference between two readers (spec v0.2 6.3)',
  readings,
}, null, 1) + '\n');
