#!/usr/bin/env node
/**
 * rebaseline-extractor.mjs — supersede a registry whose visible-text digests were taken by
 * csoai-visible-text/1 with a dated revision whose digests are taken by csoai-visible-text/2.
 *
 * Specification: https://councilof.ai/spec/claim-maintenance/v0.2/ (CC0 1.0), 5.6.1 and 6.3.1.
 * Plan of record: docs/claims/extractor-supersession-2026-09-25.md. This file: MIT.
 *
 * WHY THIS EXISTS. The v0.1 reference extractor departed from spec 6.3 (it left `&#x27;` as six
 * characters, decoded `&amp;#39;` twice, and so on). The v0.2 reference fixes that. On a page that
 * carries one of those references the two extractors give different text from the same bytes, so a
 * rule-1 digest compared against a rule-2 digest "changes" although the page did not. A watcher
 * that switched rules silently would record every such page as an observed change. This script is
 * the other way: it re-reads each page ONCE, extracts it with BOTH rules, and sorts every
 * visible-text digest into exactly one of these, measured and never assumed:
 *
 *   UNCHANGED_SAME_UNDER_BOTH_RULES   rule 1 today = recorded, and rule 2 gives the same digest;
 *   UNCHANGED_EXTRACTOR_DIFFERS       rule 1 today = recorded, rule 2 differs. The page did not
 *                                     change; only the reader did. Re-baselined, and NOT an
 *                                     observed change (spec v0.2 6.3.1);
 *   CHANGED_AT_SOURCE_SINCE_CAPTURE   rule 1 today != recorded. Compared like with like, the page
 *                                     differs from the capture. Recorded as an ordinary observed
 *                                     change under rule 1, in neutral words, then re-baselined;
 *   RULE_1_CANNOT_READ                rule 1 throws on today's bytes (it throws on a decimal
 *                                     reference above U+10FFFF), so no like-with-like comparison
 *                                     exists and none is asserted. Re-baselined under rule 2;
 *   NOT_REREAD                        the page could not be obtained from this host. The recorded
 *                                     rule-1 digest is carried unchanged, and says so by naming no
 *                                     extractor (spec v0.2 5.6.1).
 *
 * Digests that are not visible-text (raw-bytes, response-json-canonical) involve no extractor and
 * are carried unchanged, with their original access_date.
 *
 * It never edits the registry it supersedes. It writes a NEW file that names the old one by
 * registry_id, path and sha256, exactly as the ondo-chainlink -rev2 did (spec 9.4, 12).
 *
 *   node scripts/claims/rebaseline-extractor.mjs --registry public/claims/<file>.json \
 *        --out public/claims/<file>-rev2.json [--created 2026-09-25]
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import {
  SCHEMA, SPEC_URL, EXTRACTOR_RULE_1, EXTRACTOR_RULE_2, CURRENT_EXTRACTOR,
  extractVisibleTextRule1, extractVisibleText, sha256hex, canonicalBytes, artifactDigest, verifyArtifact,
} from '../claim-capture.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const UA = 'CSOAI-claim-maintenance/0.2 (+' + SPEC_URL + ')';
const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const REFERENCE_URL = 'https://councilof.ai/spec/claim-maintenance/v0.2/reference/claim-capture.mjs';
const RULE_1_REFERENCE = {
  url: 'https://councilof.ai/spec/claim-maintenance/v0.1/reference/claim-capture.mjs',
  sha256: 'a634515bec5e8999d73bf55d2e2c8641351fe0070d40596afa4877f2f3e86f60',
};

/** RFC 9162 2.1.1, as capture-growth.mjs builds it: domain-separated, split at the largest power
 * of two below n, no duplication of an odd final node. */
const leafHash = (b) => createHash('sha256').update(Buffer.concat([Buffer.from([0x00]), b])).digest();
const nodeHash = (l, r) => createHash('sha256').update(Buffer.concat([Buffer.from([0x01]), l, r])).digest();
const kOf = (n) => 1 << (32 - Math.clz32(n - 1) - 1);
function mth(entries) {
  if (entries.length === 0) return createHash('sha256').update(Buffer.alloc(0)).digest();
  if (entries.length === 1) return leafHash(entries[0]);
  const k = kOf(entries.length);
  return nodeHash(mth(entries.slice(0, k)), mth(entries.slice(k)));
}
function inclusionProof(entries, m) {
  if (entries.length === 1) return [];
  const k = kOf(entries.length);
  return m < k
    ? [...inclusionProof(entries.slice(0, k), m), { side: 'right', sibling: mth(entries.slice(k)).toString('hex') }]
    : [...inclusionProof(entries.slice(k), m - k), { side: 'left', sibling: mth(entries.slice(0, k)).toString('hex') }];
}

/** The same locating rule capture-growth.mjs uses, so a mode here means what it means there. */
const norm = (x) => x.replace(/\[\s*\d+\s*\]/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/\s+/g, ' ').trim();
const locate = (text, verbatim) => (text.includes(verbatim) ? 'EXACT'
  : norm(text).includes(norm(verbatim)) ? 'MATCHED_AFTER_NORMALISING_EXTRACTOR_ARTEFACTS' : 'NOT_LOCATED');

async function read(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8' },
    });
    const body = Buffer.from(await res.arrayBuffer());
    return { status: res.status, body, read_utc: nowIso() };
  } catch (e) {
    return { status: null, error: String(e).slice(0, 200), read_utc: nowIso() };
  }
}

/**
 * signature_state and timestamp_state, written by this producer and by nothing else, so the words
 * in a registry and the words this script emits cannot drift apart. `sidecar` false: what a fresh
 * revision says before anyone signs it. `sidecar` true: what it says once it is signed by sidecar
 * and submitted for a timestamp. `--restate-signed` rewrites ONLY these two fields (and so the
 * registry_digest) of a revision that has never been signed or published, immediately before it
 * is signed; it never touches signed or published bytes (spec 9.4, 12).
 */
export function stateTexts(registryId, sidecar) {
  if (!sidecar) {
    return {
      signature_state: 'UNSIGNED. This revision has not been signed. It has no .signed.json sidecar, and nothing in it may '
        + 'be described as signed until a sidecar that pins these bytes by sha256 exists (spec 9.1, 9.4). A signature, '
        + 'when one exists, will prove only that these bytes were committed to at that time; it grades nothing and '
        + 'certifies nobody (spec 9.5).',
      timestamp_state: 'NOT SUBMITTED. No OpenTimestamps receipt has been requested for this file. The three words of spec '
        + '8.1 are reserved, and none of them applies to this file yet.',
    };
  }
  return {
    signature_state: 'SIGNED BY SIDECAR. The signature is over these bytes, not inside them, because signed bytes are '
      + 'superseded and never edited (spec 9.4). See /claims/' + registryId + '.signed.json, which pins this file by '
      + 'sha256 and carries the Ed25519 signature by did:web:csoai.org#board-attestation-1. A signature proves these '
      + 'bytes were signed at that time; it grades nothing, certifies nobody, and says nothing about any party named '
      + 'here (spec 9.5).',
    timestamp_state: 'SUBMITTED, and therefore PENDING. An OpenTimestamps receipt is written beside this file at /claims/'
      + registryId + '.json.ots. At the time of writing it carries a calendar commitment and no attestation path, its '
      + 'upgrade has not been run, and nothing has been verified. The specification reserves a third word for a receipt '
      + 'that has been upgraded AND whose path has been checked, and that word is not used of this receipt (spec 8.1-8.3). '
      + 'A file extension is not a proof.',
  };
}

/** --restate-signed <file>: see stateTexts. Refuses a file that already names a sidecar. */
function restateSigned(path) {
  const reg = JSON.parse(readFileSync(path, 'utf8'));
  const id = basename(path).replace(/\.json$/, '');
  if (reg.registry_id !== id) throw new Error(`${path}: registry_id ${reg.registry_id} does not match the file name`);
  if (!String(reg.signature_state || '').startsWith('UNSIGNED')) throw new Error(`${path}: not an unsigned revision; signed bytes are never edited`);
  const check = sha256hex(canonicalBytes({ ...reg, registry_digest: undefined }));
  if (check !== reg.registry_digest) throw new Error(`${path}: registry_digest does not reproduce before restating`);
  Object.assign(reg, stateTexts(id, true));
  reg.registry_digest = sha256hex(canonicalBytes({ ...reg, registry_digest: undefined }));
  writeFileSync(path, JSON.stringify(reg, null, 1) + '\n');
  console.log(`restated ${path} as signed by sidecar; registry_digest=${reg.registry_digest}`);
}

async function main() {
  if (arg('restate-signed')) { restateSigned(arg('restate-signed')); return; }
  const inPath = arg('registry');
  const outPath = arg('out');
  if (!inPath || !outPath) {
    console.error('usage: rebaseline-extractor.mjs --registry <published registry> --out <new file> [--created YYYY-MM-DD]');
    process.exit(2);
  }
  const rawIn = readFileSync(inPath);
  const prior = JSON.parse(rawIn.toString('utf8'));
  if (!Array.isArray(prior.claims)) throw new Error('only the artifact-array registry shape carries visible-text digests');
  const created = arg('created', nowIso().slice(0, 10));
  const registryId = basename(outPath).replace(/\.json$/, '');

  const pages = new Map();
  const rows = [];
  const claims = [];
  const captureNotes = { ...(prior.capture_notes || {}) };
  const notLocated = [];

  for (const a0 of prior.claims) {
    const h = a0.source_content_hash || {};
    let a = { ...a0, schema: SCHEMA };
    delete a.artifact_sha256;
    if (h.covers !== 'visible-text') {
      claims.push(a);
      continue;
    }
    if (h.extractor && h.extractor !== EXTRACTOR_RULE_1) {
      throw new Error(`${a0.claim_id}: recorded digest already names ${h.extractor}; nothing to re-baseline`);
    }
    if (!pages.has(a0.source_url)) pages.set(a0.source_url, await read(a0.source_url));
    const p = pages.get(a0.source_url);
    const row = { claim_id: a0.claim_id, url: a0.source_url, recorded_access_date: a0.access_date,
      recorded_hash_rule_1: h.value, http_status: p.status ?? null };
    if (!p.body || p.status >= 400) {
      rows.push({ ...row, classification: 'NOT_REREAD', reason: p.error || `HTTP ${p.status}`,
        carried: 'the recorded rule-1 digest and access_date, unchanged; the artifact names no extractor, which means rule 1' });
      claims.push(a);
      continue;
    }
    const html = p.body.toString('utf8');
    const t2 = extractVisibleText(html);
    const d2 = sha256hex(Buffer.from(t2, 'utf8'));
    let t1 = null;
    let d1 = null;
    try {
      t1 = extractVisibleTextRule1(html);
      d1 = sha256hex(Buffer.from(t1, 'utf8'));
    } catch (e) {
      row.rule_1_error = String(e.message || e).slice(0, 120);
    }
    const classification = d1 === null ? 'RULE_1_CANNOT_READ'
      : d1 !== h.value ? 'CHANGED_AT_SOURCE_SINCE_CAPTURE'
        : d1 === d2 ? 'UNCHANGED_SAME_UNDER_BOTH_RULES' : 'UNCHANGED_EXTRACTOR_DIFFERS';
    rows.push({ ...row, read_utc: p.read_utc, body_sha256: sha256hex(p.body),
      today_hash_rule_1: d1, today_hash_rule_2: d2, classification });

    const observed = [...(a0.observed_changes || [])];
    if (classification === 'CHANGED_AT_SOURCE_SINCE_CAPTURE') {
      observed.push({
        observed_utc: p.read_utc,
        previous_access_date: a0.access_date,
        previous_hash: h.value,
        current_hash: d1,
        extractor: EXTRACTOR_RULE_1,
        claim_present: t1.includes(a0.claim_verbatim),
        note: 'The visible text of this page, extracted by csoai-visible-text/1 as at the previous read, '
          + 'differs from the text recorded at that read. That is the entire content of this statement. '
          + 'It was observed while re-baselining this registry to csoai-visible-text/2, and it holds no '
          + 'view about why a page changes.',
      });
    }
    a = {
      ...a,
      access_date: p.read_utc,
      source_content_hash: { alg: 'sha256', value: d2, covers: 'visible-text', extracted_chars: t2.length,
        extractor: CURRENT_EXTRACTOR },
      observed_changes: observed,
    };
    claims.push(a);
    const mode = locate(t2, a0.claim_verbatim);
    captureNotes[a0.claim_id] = {
      claim_located: mode,
      searched_in: 'the visible text extracted from this page by csoai-visible-text/2 at the re-baselining read',
      source_content_hash_covers: 'visible-text',
      extractor: CURRENT_EXTRACTOR,
      ...(prior.capture_notes?.[a0.claim_id]?.claim_located
        ? { located_at_first_capture: prior.capture_notes[a0.claim_id].claim_located + ' (csoai-visible-text/1)' } : {}),
    };
    if (mode === 'NOT_LOCATED') {
      notLocated.push({
        subject: a0.subject?.name, claim_id: a0.claim_id, url: a0.source_url,
        recorded_as: 'READ_BUT_STRING_NOT_LOCATED', claim_located: mode,
        searched_in: captureNotes[a0.claim_id].searched_in,
        note: 'the source was read and hashed at the re-baselining read, but this reader could not locate this string '
          + 'inside what it read. That is an observation about this read and this extractor, never a statement '
          + 'about the subject, and never an absence from the source',
      });
    }
  }

  // Every artifact is digested last, over everything else, and verified before anything is written.
  let refused = 0;
  for (const a of claims) {
    a.artifact_sha256 = artifactDigest(a);
    const v = verifyArtifact(a);
    if (!v.ok) {
      refused++;
      console.error('REFUSING ' + a.claim_id + ':\n  · ' + v.errors.join('\n  · '));
    }
  }
  if (refused) {
    console.error(`\nnot writing ${outPath}: ${refused} artifact(s) failed verification.`);
    process.exit(1);
  }

  const count = (c) => rows.filter((r) => r.classification === c).length;
  const counts = {
    visible_text_digests: rows.length,
    reread: rows.filter((r) => r.classification !== 'NOT_REREAD').length,
    unchanged_same_under_both_rules: count('UNCHANGED_SAME_UNDER_BOTH_RULES'),
    unchanged_extractor_differs: count('UNCHANGED_EXTRACTOR_DIFFERS'),
    changed_at_source_since_capture: count('CHANGED_AT_SOURCE_SINCE_CAPTURE'),
    rule_1_cannot_read: count('RULE_1_CANNOT_READ'),
    not_reread: count('NOT_REREAD'),
    re_baselined_to_rule_2: rows.filter((r) => r.classification !== 'NOT_REREAD').length,
    distinct_urls_read: new Set(rows.filter((r) => r.classification !== 'NOT_REREAD').map((r) => r.url)).size,
    digests_not_visible_text_carried_unchanged: claims.length - rows.length,
  };

  const leaves = claims.map((a) => canonicalBytes({ ...a, sig: undefined }));
  const byState = {};
  for (const st of ['CLAIM_CAPTURED', 'CLAIM_MEASURED', 'UNMEASURED', 'UNCHECKABLE']) byState[st] = claims.filter((a) => a.state === st).length;

  const registry = {
    schema: prior.schema,
    registry_id: registryId,
    created_utc: created,
    built_at_utc: nowIso(),
    maintainer: prior.maintainer,
    conforms_to: SPEC_URL,
    conforms_to_licence: prior.conforms_to_licence,
    artifact_schema: SCHEMA,
    supersedes: {
      registry_id: prior.registry_id,
      file: '/claims/' + basename(inPath),
      sha256: sha256hex(rawIn),
      rule: 'supersede by reference, never edit: the prior file\'s bytes are unchanged, still served at their own '
        + 'URL, and still covered by whatever signature and timestamp receipt they had',
    },
    superseded_because:
      'The visible-text digests of the prior registry were taken by csoai-visible-text/1, the extractor of the '
      + 'v0.1 reference, which departed from spec 6.3 step 2 (spec v0.2 section 16). This revision re-reads every '
      + 'visible-text source once, re-baselines its digest under csoai-visible-text/2 and names that extractor in '
      + 'the artifact (spec v0.2 5.6.1). Nothing in it says any subject\'s page changed except where rule 1, '
      + 'compared with itself, says so; those are listed under extractor_rebaseline and recorded as observed '
      + 'changes in neutral words.',
    extractor_rebaseline: {
      date: created,
      specification: SPEC_URL + '#6-canonicalisation-and-hashing',
      from_extractor: EXTRACTOR_RULE_1,
      from_reference: RULE_1_REFERENCE,
      to_extractor: EXTRACTOR_RULE_2,
      to_reference: REFERENCE_URL,
      method: 'one live read per distinct URL from this host; both extractors applied to the same response bytes; '
        + 'rule 1 today compared with the recorded rule-1 digest (like with like), and rule 2 today compared with '
        + 'rule 1 today (same bytes, different reader). Every classification below is that comparison, not an estimate.',
      counts,
      classifications: {
        UNCHANGED_SAME_UNDER_BOTH_RULES: 'the page is unchanged since capture under rule 1, and the two rules agree on it',
        UNCHANGED_EXTRACTOR_DIFFERS: 'the page is unchanged since capture under rule 1, and rule 2 extracts different '
          + 'text from the same bytes. A watcher that switched rules silently would have recorded each of these as an '
          + 'observed change. They are a change of reader, not of page, and are recorded as none (spec v0.2 6.3.1)',
        CHANGED_AT_SOURCE_SINCE_CAPTURE: 'rule 1 today differs from the recorded rule-1 digest: compared like with like, '
          + 'the page differs from the capture. Recorded as an observed change in the artifact, naming rule 1',
        RULE_1_CANNOT_READ: 'rule 1 throws on today\'s bytes, so no like-with-like comparison exists and none is asserted',
        NOT_REREAD: 'the page could not be obtained from this host; the recorded rule-1 digest is carried unchanged',
      },
      digests: rows,
      does_not_prove: [
        'that any page changed where the classification is UNCHANGED_EXTRACTOR_DIFFERS; it did not, under the rule that recorded it',
        'why any page changed where one did; a subject may change its website for any reason (spec 4.9)',
        'that the counts above describe any page as served on a day other than the read_utc recorded per row',
      ],
    },
    selection_rule: prior.selection_rule,
    totals: { subjects: new Set(claims.map((a) => a.subject.identifier)).size, claims: claims.length, by_state: byState },
    claims,
    resolution_calendar: prior.resolution_calendar || [],
    resolution_calendar_note: prior.resolution_calendar_note,
    measurements_referenced: prior.measurements_referenced,
    not_captured: [...(prior.not_captured || []), ...notLocated],
    capture_notes: captureNotes,
    capture_notes_explained: prior.capture_notes_explained
      + ' In this revision every re-read visible-text claim was located in text extracted by csoai-visible-text/2, '
      + 'and its mode at first capture is kept beside it as located_at_first_capture.',
    merkle: {
      ...(prior.merkle || {}),
      root: mth(leaves).toString('hex'),
      tree_size: leaves.length,
      inclusion_proofs: Object.fromEntries(claims.map((a, i) => [a.claim_id, {
        leaf_index: i, tree_size: leaves.length, audit_path: inclusionProof(leaves, i),
      }])),
    },
    boundaries: prior.boundaries,
    how_to_rerun: {
      ...(prior.how_to_rerun || {}),
      rebaseline: 'node scripts/claims/rebaseline-extractor.mjs --registry public/claims/' + basename(inPath)
        + ' --out public/claims/' + basename(outPath),
      verify_any_artifact: 'node scripts/claim-capture.mjs --verify <file containing the artifact>  (the v0.2 reference; '
        + 'it verifies v0.1 and v0.2 artifacts)',
    },
    ...stateTexts(registryId, false),
    does_not_prove: [
      ...(prior.does_not_prove || []),
      'that a page changed because its digest was re-baselined. A re-baselined digest is a change of extractor, recorded '
      + 'as such under extractor_rebaseline and never as an observed change (spec v0.2 6.3.1).',
    ],
  };
  registry.registry_digest = sha256hex(canonicalBytes({ ...registry, registry_digest: undefined }));
  writeFileSync(outPath, JSON.stringify(registry, null, 1) + '\n');
  console.log('wrote ' + outPath);
  console.log('  supersedes ' + prior.registry_id + ' sha256=' + registry.supersedes.sha256);
  console.log('  ' + JSON.stringify(counts));
  console.log('  merkle_root=' + registry.merkle.root + ' tree_size=' + leaves.length);
}
await main();
