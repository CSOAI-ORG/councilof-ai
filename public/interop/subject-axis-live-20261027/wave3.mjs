#!/usr/bin/env node
// wave3.mjs — claim-maintenance wave 3. The first wave whose delta is ATTRIBUTABLE.
// wave 1 (2026-10-24) captured only a raw sha256, so wave 1 is not retro-fittable.
// wave 2 (2026-10-27) captured an extracted-text digest; wave 3 compares against it.
// Node fetch, not urllib: councilof.ai's Cloudflare rule `public-data: no BIC`
// returns 403 to urllib and 200 to every other client — that is why the estate's
// own urllib-based builders read as "unreachable".

import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const MAX_BYTES = 400_000;
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 8;

const sha256hex = (b) => createHash('sha256').update(b).digest('hex');
function extractText(html) {
  let s = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
  return s.replace(/\s+/g, ' ').trim();
}

const w2 = JSON.parse(readFileSync('out/claim-maintenance.wave2-20261027.json', 'utf8'));
const targets = w2.records.map((r) => r.url);

async function fetchOne(url) {
  const t0 = Date.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ac.signal, headers: { 'User-Agent': UA, Accept: 'text/html,*/*' } });
    const buf = Buffer.from(await res.arrayBuffer());
    const raw = buf.subarray(0, MAX_BYTES);
    const text = extractText(raw.toString('utf8'));
    return {
      status: res.status, ok: res.status === 200, bytes: raw.length,
      sha256: sha256hex(raw), text_sha256: sha256hex(Buffer.from(text, 'utf8')),
      ms: Math.round((Date.now() - t0) * 10) / 10, error: '',
    };
  } catch (e) {
    return { status: null, ok: false, bytes: 0, sha256: null, text_sha256: null, ms: Math.round((Date.now() - t0) * 10) / 10, error: `${e.name}: ${e.message}` };
  } finally { clearTimeout(timer); }
}

const out = new Array(targets.length);
let i = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (i < targets.length) { const k = i++; out[k] = await fetchOne(targets[k]); }
}));

const rows = [];
const counts = {};
for (let k = 0; k < w2.records.length; k++) {
  const b = w2.records[k], live = out[k];
  let outcome, materiality, adj;
  if (!live.text_sha256) { outcome = 'UNREADABLE'; materiality = 'UNREADABLE'; adj = 'RETRY'; }
  else if (b.text_sha256_read1 && live.text_sha256 === b.text_sha256_read1) { outcome = 'TEXT_UNCHANGED'; materiality = 'NOT_MATERIAL_TEXT_IDENTICAL'; adj = 'NOT_REQUIRED'; }
  else { outcome = 'TEXT_CHANGED'; materiality = 'MATERIAL_CHANGE_CANDIDATE'; adj = 'PENDING_HUMAN_REVIEW'; }
  counts[outcome] = (counts[outcome] || 0) + 1;
  rows.push({
    url: b.url, subject: b.subject, axis: b.axis,
    baseline_text_sha256: b.text_sha256_read1 ?? null,
    observed_text_sha256: live.text_sha256,
    baseline_bytes: b.live_bytes ?? null, observed_bytes: live.bytes,
    http_status: live.status, latency_ms: live.ms,
    wave2_outcome_vs_wave1: b.outcome_vs_wave1,
    wave3_outcome_vs_wave2: outcome,
    materiality: materiality,
    human_adjudication_state: adj,
  });
}

const result = {
  schema: 'csoai.claim-maintenance-wave/1.2',
  axis: 'claim-maintenance', wave: 3, run_id: 'claim-maintenance-wave3-20261028',
  observed_at: new Date().toISOString(),
  authority_state: 'measurement_only_not_a_certification', signed: false, writes_ledger: false,
  baseline_wave2_file: 'out/claim-maintenance.wave2-20261027.json',
  baseline_wave2_observed_at: w2.observed_at,
  method: 'The same 77 public claim URLs, the same reader, the same 400000-byte cap. The extracted visible text is hashed with sha256 and compared to the wave-2 text digest. This is the first wave whose delta is attributable: wave 1 captured no text digest and is therefore not retro-fittable; wave 2 captured one; wave 3 uses it.',
  transport_note: 'Node fetch. councilof.ai answers 200 here and 403 to urllib under the Cloudflare rule `public-data: no BIC`; the estate\'s own urllib builders read as "unreachable" for that reason.',
  n_subjects: rows.length,
  n_valid: rows.filter((r) => r.observed_text_sha256).length,
  n_valid_min: 30,
  counts,
  materiality_statement: `${counts.TEXT_CHANGED || 0} of ${rows.length} monitored public claims changed their VISIBLE TEXT between wave 2 (2026-10-27) and wave 3 (2026-10-28). A text change is a change; materiality is a human adjudication, and no third party is named from a delta.`,
  limitations: [
    'A visible-text change is a candidate material change, not a material change. Human adjudication is required.',
    'Text extraction strips markup; a change confined to markup, scripts or styling is not a text change.',
    'A page that renders its content client-side reads UNREADABLE here and is not counted as unchanged.',
  ],
  records: rows,
};
writeFileSync('out/claim-maintenance.wave3-20261028.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ counts, n_valid: result.n_valid, meets_n30: result.n_valid >= 30 }, null, 1));
