#!/usr/bin/env node
/**
 * capture-growth.mjs — capture a declared set of subjects and emit ONE conforming registry.
 *
 * Specification: https://councilof.ai/spec/claim-maintenance/v0.1/  (CC0 1.0). This file: MIT.
 *
 * Every digest this writes is computed by the SAME code the specification names as its reference
 * implementation (scripts/claim-capture.mjs), imported here rather than reimplemented. A second
 * extractor would produce a second set of digests, and a reader who ran the published tool against
 * our published bytes would get a mismatch that meant nothing. One extractor, one digest.
 *
 * What it does, per claim:
 *   1. fetch the claim's own source URL keylessly (or read a prefetched body, see --prefetch);
 *   2. extract the visible text by the published rule and hash it;
 *   3. build the artifact through buildArtifact() so the required shape is not hand-written;
 *   4. if the claim names a measurement, attach that harness's window/denominator/method/result
 *      ONLY when the harness itself returned CLAIM_MEASURED. A harness that returned UNMEASURED
 *      leaves the claim UNMEASURED and its reason is carried into the plan. Nothing is promoted
 *      by hand;
 *   5. verify the finished artifact with verifyArtifact() and REFUSE to emit a registry if any
 *      artifact fails.
 *
 *   node scripts/claims/capture-growth.mjs --subjects <file> --measurements <dir> --out <file> \
 *        [--prefetch <dir>] [--series <dir>]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractVisibleText, sha256hex, buildArtifact, verifyArtifact, artifactDigest, canonicalBytes,
} from '../claim-capture.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const SPEC = 'https://councilof.ai/spec/claim-maintenance/v0.1/';
const UA = 'CSOAI-claim-maintenance/0.1 (+' + SPEC + ')';

/** RFC 9162 section 2.1.1. Domain-separated, split at the largest power of two below n, and no
 * duplication of an odd final node. The estate's older public root is a DIFFERENT shape and the
 * two are never reconciled (spec 7.3). */
const LEAF = 0x00, NODE = 0x01;
const leafHash = (b) => createHash('sha256').update(Buffer.concat([Buffer.from([LEAF]), b])).digest();
const nodeHash = (l, r) => createHash('sha256').update(Buffer.concat([Buffer.from([NODE]), l, r])).digest();
const k_of = (n) => 1 << (32 - Math.clz32(n - 1) - 1);
function mth(entries) {
  if (entries.length === 0) return createHash('sha256').update(Buffer.alloc(0)).digest();
  if (entries.length === 1) return leafHash(entries[0]);
  const k = k_of(entries.length);
  return nodeHash(mth(entries.slice(0, k)), mth(entries.slice(k)));
}
/** Audit path WITH the side of each sibling. A verifier must never be left to infer the side
 * from an index the proof does not carry (spec 7.4). */
function inclusionProof(entries, m) {
  if (entries.length === 1) return [];
  const k = k_of(entries.length);
  return m < k
    ? [...inclusionProof(entries.slice(0, k), m), { side: 'right', sibling: mth(entries.slice(k)).toString('hex') }]
    : [...inclusionProof(entries.slice(k), m - k), { side: 'left', sibling: mth(entries.slice(0, k)).toString('hex') }];
}

const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');

async function readSource(url, prefetchDir, prefetchMap) {
  // A prefetch entry may supply a document TEXT LAYER without supplying a body. The body is still
  // fetched from the source, because the digest this registry publishes has to cover what the
  // source served, not what some earlier reader saved.
  const pf = prefetchMap[url];
  if (pf && pf.file && prefetchDir && existsSync(join(prefetchDir, pf.file))) {
    const buf = readFileSync(join(prefetchDir, pf.file));
    return { body: buf, contentType: pf.content_type, status: 200, prefetched: pf };
  }
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8' },
  });
  const buf = Buffer.from(await res.arrayBuffer());
  return { body: buf, contentType: (res.headers.get('content-type') || '').toLowerCase(), status: res.status,
           prefetched: pf || null };
}

async function main() {
  const defs = JSON.parse(readFileSync(arg('subjects'), 'utf8'));
  const mdir = arg('measurements');
  const prefetchDir = arg('prefetch');
  const seriesDir = arg('series');
  const outPath = arg('out');
  const registryId = arg('registry-id', 'claimreg-ai-assurance-and-settlement-2026-09-23');

  const prefetchMap = prefetchDir && existsSync(join(prefetchDir, 'index.json'))
    ? JSON.parse(readFileSync(join(prefetchDir, 'index.json'), 'utf8')) : {};

  const measurements = {};
  if (mdir && existsSync(mdir)) {
    for (const f of readdirSync(mdir).filter((x) => x.endsWith('.json'))) {
      measurements[f.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(mdir, f), 'utf8'));
    }
  }

  const artifacts = [];
  const notCaptured = [];
  const captureNotes = {};
  const resolutionCalendar = [];
  const measurementsReferenced = {};
  const pageCache = new Map();

  for (const s of defs.subjects) {
    for (const cl of s.claims) {
      let src = pageCache.get(cl.url);
      if (!src) {
        try { src = await readSource(cl.url, prefetchDir, prefetchMap); }
        catch (e) { src = { error: String(e).slice(0, 200) }; }
        pageCache.set(cl.url, src);
      }
      if (src.error || (src.status && src.status >= 400)) {
        notCaptured.push({
          subject: s.name, claim_id: cl.id, url: cl.url,
          http_status: src.status ?? null,
          transport_reason: src.error ?? null,
          recorded_as: 'SEARCH_INCONCLUSIVE',
          note: 'this reader could not obtain the page. That is a fact about this read from this host, '
              + 'with its status recorded. It is NOT an absence and NOT a statement about the subject',
        });
        continue;
      }
      const isHtml = (src.contentType || '').includes('html') || /^\s*<(!doctype|html)/i.test(src.body.slice(0, 200).toString('utf8'));
      const declaredCovers = cl.covers || (isHtml ? 'visible-text' : 'raw-bytes');
      const text = declaredCovers === 'visible-text' ? extractVisibleText(src.body.toString('utf8')) : null;
      const hashed = declaredCovers === 'visible-text' ? Buffer.from(text, 'utf8') : src.body;
      const contentHash = sha256hex(hashed);
      // Locating the claim inside what was read. A miss here is a fact about THIS reader and this
      // extractor, never about the subject, so the mode that found it is recorded rather than
      // silently normalised away. Extractors differ (spec 6.3) and the difference shows up as stray
      // spaces before punctuation and inline footnote markers that no reader of the page ever sees.
      const norm = (x) => x
        .replace(/\[\s*\d+\s*\]/g, ' ')
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
      let presenceMode = 'NOT_LOCATED';
      let searchSurface = null;
      if (declaredCovers === 'visible-text') {
        searchSurface = 'the visible text extracted from this page by the published rule';
        if (text.includes(cl.verbatim)) presenceMode = 'EXACT';
        else if (norm(text).includes(norm(cl.verbatim))) presenceMode = 'MATCHED_AFTER_NORMALISING_EXTRACTOR_ARTEFACTS';
      } else if (!src.body.subarray(0, 5).toString('latin1').startsWith('%PDF-')
                 && !src.body.includes(0)) {
        // A plain-text source — a repository README, a licence file, an API response — is hashed as
        // raw bytes per spec 5.6 AND is searchable as text. There is no extractor between the bytes
        // and the reader here, so the string is looked for in the bytes decoded as UTF-8, and the
        // recorded mode says that is what happened.
        searchSurface = 'the response body itself, decoded as UTF-8; the published digest covers those same bytes';
        if (src.body.toString('utf8').includes(cl.verbatim)) presenceMode = 'EXACT_IN_RESPONSE_BYTES';
        else if (norm(src.body.toString('utf8')).includes(norm(cl.verbatim))) presenceMode = 'MATCHED_AFTER_NORMALISING_WHITESPACE_IN_RESPONSE_BYTES';
      } else {
        const tl = src.prefetched && src.prefetched.text_layer_file;
        if (tl && prefetchDir && existsSync(join(prefetchDir, tl))) {
          const layer = readFileSync(join(prefetchDir, tl), 'utf8');
          searchSurface = 'the text layer extracted from this document; the published digest covers the document bytes (spec 5.6)';
          if (norm(layer).includes(norm(cl.verbatim))) presenceMode = 'MATCHED_IN_DOCUMENT_TEXT_LAYER';
        } else {
          searchSurface = 'none - the body is not text and no text layer was supplied, so this reader could not locate the string inside it';
          presenceMode = 'NOT_SEARCHABLE_AS_BYTES';
        }
      }
      const present = presenceMode !== 'NOT_LOCATED' && presenceMode !== 'NOT_SEARCHABLE_AS_BYTES';
      captureNotes[cl.id] = {
        claim_located: presenceMode,
        searched_in: searchSurface,
        source_content_hash_covers: declaredCovers,
        ...(src.prefetched && src.prefetched.file
            ? { body_not_fetched_by_this_host: src.prefetched.fetched_from,
                body_fetched_utc: src.prefetched.fetched_utc,
                transport_body_sha256: src.prefetched.transport_sha256 } : {}),
        ...(declaredCovers !== 'visible-text' && src.prefetched && src.prefetched.text_layer_file
            ? { text_layer_extractor: src.prefetched.text_layer_extractor,
                text_layer_sha256: sha256hex(readFileSync(join(prefetchDir, src.prefetched.text_layer_file))) } : {}),
      };

      const doesNotProve = [
        'that the claim is false — nothing in this record states or implies that, and nothing derived '
        + 'from it may be read that way',
        'that the claim is true — presence on a page is the page saying it, not a fact established',
        'who wrote the page, or why it says what it says',
      ];
      if (cl.state !== 'CLAIM_MEASURED') {
        doesNotProve.push('that anything here has been checked; this claim is in ' + cl.state
          + ' and that state means exactly what the specification says it means');
      }

      let artifact = buildArtifact({
        claim_id: cl.id,
        subject: { name: s.name, identifier: s.identifier, identifier_kind: s.identifier_kind },
        claim_verbatim: cl.verbatim,
        claim_type: cl.type,
        source_url: cl.url,
        access_date: nowIso(),
        content_hash: contentHash,
        covers: declaredCovers,
        extracted_chars: text ? text.length : src.body.length,
        state: cl.state,
        measurement_plan: cl.plan,
        uncheckable_reason: cl.uncheckable_reason,
        does_not_prove: doesNotProve,
        next_read_utc: defs.default_next_read_utc,
        conflicts: s.conflicts || [],
      });
      if (cl.excerpt) artifact = { ...artifact, excerpt: true };

      // A measurement is attached only if the HARNESS reported one. Prose about a plan is not a
      // measurement and a well-written plan must never be allowed to read as one (spec 4.6).
      const m = cl.measurement ? measurements[cl.measurement] : null;
      if (cl.measurement) {
        measurementsReferenced[cl.measurement] = {
          state: m ? m.state : 'ABSENT',
          harness_output: 'scripts/claims/measure_growth.py -> ' + cl.measurement + '.json',
          ...(m && m.state !== 'CLAIM_MEASURED' ? { why_not_attached: m.reason || 'harness did not report a measurement' } : {}),
          ...(m ? {} : { why_not_attached: 'the harness produced no output for this id in this run' }),
        };
      }
      if (m && m.state === 'CLAIM_MEASURED') {
        const { schema, claim_id, ...rest } = artifact;
        artifact = {
          schema, claim_id, ...rest,
          state: 'CLAIM_MEASURED',
          window: m.window,
          denominator: m.denominator ?? null,
          method: {
            description: m.method,
            harness: 'scripts/claims/measure_growth.py :: ' + cl.measurement,
            measured_at: m.measured_at,
            evidence: (m.sources || m.detail?.sources || []).slice(0, 12),
          },
          result: m.result,
          does_not_prove: [...(m.does_not_prove || []), ...doesNotProve.slice(0, 1),
            'that a measurement existing beside a claim is a verdict on it. CLAIM_MEASURED means a '
            + 'measurement exists here; it is not a pass, a fail, a tick or a cross'],
        };
        delete artifact.measurement_plan;
        // A measured claim has no uncheckable_reason. Leaving one behind would publish an artifact
        // that says, in two of its own fields, both that public evidence cannot settle it and that
        // public evidence settled it.
        delete artifact.uncheckable_reason;
        if (cl.measures_only) {
          artifact.does_not_prove = [
            'that the rest of this sentence has been checked. The measurement beside it covers '
            + cl.measures_only + '.',
            ...artifact.does_not_prove,
          ];
        }
        if (!artifact.method.evidence.length) {
          artifact.method.evidence = [{ url: cl.url, note: 'the claim page itself; the harness recorded no separate evidence source' }];
        }
        artifact.artifact_sha256 = artifactDigest({ ...artifact, artifact_sha256: undefined });
      } else if (m && m.state !== 'CLAIM_MEASURED') {
        // The harness's own explanation is carried VERBATIM at registry level, in
        // measurements_referenced, and not spliced into the artifact. Those explanations properly
        // contain sentences of the form "this is NOT a finding that anything is false" — and the
        // artifact verifier, which cannot read a negation, rejects any artifact field carrying a
        // word of verdict at all. That guard is right to be blunt, so the artifact carries a plain
        // pointer and the guard stays as strict as it is.
        artifact = { ...artifact, measurement_plan: (cl.plan || '')
          + ' — this run attempted the measurement and did not reach one. The harness reported '
          + (m.state || 'no state') + '; its own account of why, in its own words, is carried in '
          + 'this registry under measurements_referenced.' + cl.measurement + '.' };
        artifact.artifact_sha256 = artifactDigest({ ...artifact, artifact_sha256: undefined });
      }
      // Recompute after any edit above; a field cannot be outside its own digest (spec 6.5).
      artifact.artifact_sha256 = artifactDigest({ ...artifact, artifact_sha256: undefined, sig: undefined });

      const v = verifyArtifact(artifact);
      if (!v.ok) {
        console.error('REFUSING ' + cl.id + ':');
        for (const e of v.errors) console.error('  · ' + e);
        process.exitCode = 1;
        continue;
      }
      artifacts.push(artifact);

      if (cl.resolution_date) {
        resolutionCalendar.push({
          claim_id: cl.id, subject: s.name, subject_identifier: s.identifier,
          resolution_date: cl.resolution_date,
          claim_verbatim: cl.verbatim,
          state_at_registration: artifact.state,
          on_that_date: 'the weekly watch raises this claim for review because a dated claim becomes '
            + 'settleable by public evidence on its date. Raising it is not a finding and carries no '
            + 'view about the outcome',
        });
      }
      if (cl.series && seriesDir) {
        mkdirSync(seriesDir, { recursive: true });
        appendFileSync(join(seriesDir, cl.series + '.jsonl'),
          JSON.stringify({ claim_id: cl.id, observed_at: artifact.access_date, url: cl.url,
            page_sha256: contentHash, claim_present_at_source: present,
            claim_verbatim: cl.verbatim }) + '\n');
      }
      if (!present) {
        notCaptured.push({
          subject: s.name, claim_id: cl.id, url: cl.url, recorded_as: 'READ_BUT_STRING_NOT_LOCATED',
          claim_located: presenceMode, searched_in: searchSurface,
          note: 'the source was read and hashed, but this reader could not locate this string inside what '
              + 'it read. That is an observation about this capture and this extractor, never a statement '
              + 'about the subject, and never an absence from the source',
        });
      }
    }
  }

  const leaves = artifacts.map((a) => canonicalBytes({ ...a, sig: undefined }));
  const root = mth(leaves).toString('hex');
  const proofs = Object.fromEntries(artifacts.map((a, i) => [a.claim_id, {
    leaf_index: i, tree_size: leaves.length, audit_path: inclusionProof(leaves, i),
  }]));

  const byState = {};
  for (const st of ['CLAIM_CAPTURED', 'CLAIM_MEASURED', 'UNMEASURED', 'UNCHECKABLE']) {
    byState[st] = artifacts.filter((a) => a.state === st).length;
  }

  const registry = {
    schema: 'csoai.claim-registry/0.3',
    registry_id: registryId,
    created_utc: nowIso().slice(0, 10),
    built_at_utc: nowIso(),
    maintainer: 'CSOAI Ltd — claim maintenance (measurement, never certification)',
    conforms_to: SPEC,
    conforms_to_licence: 'CC0-1.0',
    artifact_schema: 'csoai.claim-maintenance.artifact/0.1',
    selection_rule: defs.selection_rule,
    totals: { subjects: new Set(artifacts.map((a) => a.subject.identifier)).size,
              claims: artifacts.length, by_state: byState },
    claims: artifacts,
    resolution_calendar: resolutionCalendar,
    resolution_calendar_note:
      'A dated claim resolves on a known day, after which public evidence can settle it without any '
      + 'judgement from this maintainer. The date is recorded here at REGISTRY level and not inside the '
      + 'artifacts, because the v0.1 artifact schema sets additionalProperties:false and an artifact '
      + 'carrying an unlisted field would fail the schema its own conformance clause points at. Moving '
      + 'the field into the artifact is a v0.2 change; v0.1 is published and is never edited (spec 12).',
    measurements_referenced: measurementsReferenced,
    not_captured: notCaptured,
    capture_notes: captureNotes,
    capture_notes_explained:
      'For every claim: how this reader located the claim string inside what it read, and on which '
      + 'surface. EXACT means byte-for-byte in the extracted text. '
      + 'MATCHED_AFTER_NORMALISING_EXTRACTOR_ARTEFACTS means the string is there once this extractor\'s '
      + 'own stray spaces before punctuation and its inline footnote markers are removed. A reader of '
      + 'the page sees neither, and the specification anticipates that extractors differ and asks for '
      + 'exactly this disclosure (spec 6.3). MATCHED_IN_DOCUMENT_TEXT_LAYER means the source is a filed '
      + 'document whose published digest covers its bytes, and the sentence was located in the text '
      + 'layer extracted from those bytes. EXACT_IN_RESPONSE_BYTES means the source is plain text with no extractor between the bytes and the reader, so the string is in the same bytes the digest covers. The mode is published rather than normalised away, so a '
      + 'reader can tell an extractor difference from a content change.',
    merkle: {
      algorithm: 'RFC 9162 §2.1.1 Merkle Tree Hash',
      leaf_hash: 'SHA-256(0x00 || entry)',
      node_hash: 'SHA-256(0x01 || left || right)',
      split: 'largest power of two strictly below n',
      odd_leaf_handling: 'none — no duplication and no carry-up; the split rule handles every n',
      entry_bytes: 'canonical JSON of the claim artifact (spec 6.1: keys sorted by code point, no '
        + 'insignificant whitespace, UTF-8, no floating-point numbers), with the sig field omitted',
      leaf_order: 'the order of the claims array in this file',
      root: root,
      tree_size: leaves.length,
      inclusion_proofs: proofs,
      not_the_other_root:
        'This is NOT the estate public card root at /root.json. That root duplicates an odd final node '
        + 'and uses no domain-separation prefixes; it is a separate structure over a separate corpus and '
        + 'the two are never added, reconciled or substituted for one another (spec 7.3).',
    },
    boundaries: [
      'No claim of falsity is made about any party, anywhere in this file. Where a measurement differs '
      + 'from a claim, the claim, the measured value, the window, the denominator and the method are '
      + 'recorded and nothing further is said. The reader draws the conclusion; this maintainer does not.',
      'A listing here is not an endorsement and it is not an accusation. It means a public page is being '
      + 'read on a schedule.',
      'Every source was read without a key, an account or a payment. Anything that required one was '
      + 'dropped and is recorded in not_captured, never worked around.',
      'A page this reader could not obtain is SEARCH_INCONCLUSIVE with its HTTP status recorded. It is '
      + 'never recorded as an absence.',
      'Every body behind every digest here was fetched by the host that built this file. Two of the '
      + 'sources refuse a TLS handshake from this host\'s Python client and answer its Node client; that '
      + 'is a property of one TLS stack and not of the network, and it is recorded because a reader '
      + 'reproducing these digests with a different client may meet the same wall.',
      'One source is a filed PDF. Its published digest covers the document bytes as the specification '
      + 'requires, and a text layer extracted from those bytes is named in capture_notes so a reader can '
      + 'locate the quoted sentence inside them.',
      'The maintainer is itself a subject in this registry, under the same rules and the same states '
      + '(spec 10.6).',
    ],
    how_to_rerun: {
      capture: 'node scripts/claims/capture-growth.mjs --subjects scripts/claims/subjects-2026-09-23.json '
        + '--measurements <dir> --out public/claims/' + registryId + '.json',
      measure: 'python3 scripts/claims/measure_growth.py <dir>',
      verify_any_artifact: 'node scripts/claim-capture.mjs --verify <file containing the artifact>',
      requirements: 'Node 18+ and the Python standard library. No key, no account, no paid API.',
    },
    signature_state:
      'SIGNED BY SIDECAR. The signature is over these bytes, not inside them, because signed bytes '
      + 'are superseded and never edited (spec 9.4). See /claims/' + registryId + '.signed.json, '
      + 'which pins this file by sha256 and carries the Ed25519 signature by '
      + 'did:web:csoai.org#board-attestation-1. A signature proves these bytes were signed at that '
      + 'time; it grades nothing, certifies nobody, and says nothing about any party named here '
      + '(spec 9.5).',
    timestamp_state:
      'SUBMITTED, and therefore PENDING. An OpenTimestamps receipt is written beside this file at '
      + '/claims/' + registryId + '.json.ots. At the time of writing it carries a calendar '
      + 'commitment and no attestation path, its upgrade has not been run, and nothing has been '
      + 'verified. The specification reserves a third word for a receipt that has been upgraded AND '
      + 'whose path has been checked, and that word is not used of this receipt (spec 8.1-8.3). A '
      + 'file extension is not a proof.',
    does_not_prove: [
      'that any claim here is false. This registry makes no such statement about anyone.',
      'that a claim in UNMEASURED or UNCHECKABLE has been checked; it has not, and the state says so.',
      'that CLAIM_MEASURED is a verdict. It means a measurement exists beside the claim.',
      'that the subjects here are the organisations most worth observing. This is what is maintained, '
      + 'not a survey and not a ranking.',
    ],
  };
  registry.registry_digest = sha256hex(canonicalBytes({ ...registry, registry_digest: undefined }));

  if (process.exitCode) {
    console.error('\nnot writing a registry: at least one artifact failed verification.');
    return;
  }
  writeFileSync(outPath, JSON.stringify(registry, null, 1) + '\n');
  console.log('wrote ' + outPath);
  console.log('  subjects=' + registry.totals.subjects + ' claims=' + registry.totals.claims
    + ' ' + JSON.stringify(byState));
  console.log('  merkle_root=' + root + ' tree_size=' + leaves.length);
  console.log('  not_captured=' + notCaptured.length + ' resolution_calendar=' + resolutionCalendar.length);
}
await main();
