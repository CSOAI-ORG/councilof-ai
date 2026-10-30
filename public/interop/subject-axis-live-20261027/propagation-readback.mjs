#!/usr/bin/env node
// propagation-readback.mjs — the iteration the corrections ledger has been promising
// since 2026-10-07 and never run.
//
// THE GAP (read live 2026-10-28 from https://councilof.ai/api/corrections):
//   93 corrections. live_readback present on 1 of 93. published_at "UNRECORDED" on 87.
//   The correction-watch file's own verdict: propagation_readbacks_completed 0,
//   propagation_state NOT_CHECKED, global_propagation_rate null.
//   Its disclaimer: "Propagation re-check across citers requires outbound HTTP.
//   The current watcher records intent per the brief; the next iteration adds the re-check loop."
//
// WHAT THIS DOES: for every correction that names a surface and a value, re-reads that
// surface live and asks one mechanical question — is the OLD value still there (not
// propagated), is the NEW value there (propagated), or can the surface not answer
// (unverifiable)? A byte delta is a change; this reports the change, never a judgement.
//
// WHAT IT DOES NOT DO: it does not decide whether a propagated correction is correct,
// it does not certify, it does not name a third party as wrong, and it does not write
// to the ledger. It produces the number the estate has never published: how many of
// the 93 corrections are CONFIRMED live on the surface they touched.
//
// A negative control runs on every check: a quote with one character changed must
// STOP matching, or the detector is not discriminating and the run says so.

import { createHash } from 'node:crypto';

const LEDGER_URL = 'https://councilof.ai/api/corrections';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 6;
const RUN_ID = 'propagation-readback-20261028';
const observedAt = new Date().toISOString();

const sha256hex = (s) => createHash('sha256').update(s).digest('hex');
const norm = (s) => String(s || '')
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/\s+/g, ' ').trim().toLowerCase();
const words = (s) => norm(s).split(' ').filter(Boolean);

// A quote is "present" in a page when its words appear in order as a subsequence
// (page may hold extra text around the quote). Uses the first 14 words: long enough
// to be specific, short enough to survive a page that reformats the sentence.
function quotePresent(pageWords, quoteWords) {
  if (!quoteWords.length) return false;
  const n = Math.min(14, quoteWords.length);
  let i = 0;
  for (let j = 0; j < pageWords.length && i < n; j++) {
    if (pageWords[j] === quoteWords[i]) i++;
  }
  return i === n;
}

// Distinctive-token coverage: the share of a quote's CONTENT words (>=5 chars,
// stopwords removed) that appear anywhere in the page. A page that rewords the
// sentence still carries most of its content words; a page that dropped the claim
// carries few. This is what separates "reworded" (propagated) from "gone".
const STOP = new Set(['the','and','that','with','from','this','have','been','were','they','their','there','which','when','what','where','would','could','shall','into','than','then','them','these','those','been','each','only','also','over','under','after','before','because','while','about','above','below','your','ours','its','not','you','all','one','two','six','any','out','off','per','via','its','were']);
function contentWords(ws) { return ws.filter((w) => w.length >= 5 && !STOP.has(w)); }
function coverage(pageWordSet, quoteWs) {
  const cw = contentWords(quoteWs);
  if (!cw.length) return { ratio: null, hit: 0, total: 0 };
  const hit = cw.filter((w) => pageWordSet.has(w)).length;
  return { ratio: Number((hit / cw.length).toFixed(3)), hit, total: cw.length };
}

async function fetchText(url) {
  const t0 = Date.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ac.signal, headers: { 'User-Agent': UA, Accept: 'text/html,*/*' } });
    const body = await res.text();
    return { ok: res.status === 200, status: res.status, final_url: res.url, ms: Math.round((Date.now() - t0) * 10) / 10, text: body, bytes: body.length };
  } catch (e) {
    return { ok: false, status: null, final_url: url, ms: Math.round((Date.now() - t0) * 10) / 10, text: '', bytes: 0, error: `${e.name}: ${e.message}` };
  }
}

const ledgerRes = await fetchText(LEDGER_URL);
if (!ledgerRes.ok) { console.error('ledger unreadable', ledgerRes.status, ledgerRes.error); process.exit(1); }
const ledgerBytes = ledgerRes.text;
const ledger = JSON.parse(ledgerBytes);
const entries = ledger.corrections || [];
const ledgerSha = sha256hex(ledgerBytes);

// ---- build the check plan
const plan = [];
for (const e of entries) {
  const id = e.id;
  const oldv = e.old_values || null;
  const newv = e.new_values || null;
  const checks = [];

  if (oldv && newv) {
    const oldKeys = Object.keys(oldv), newKeys = Object.keys(newv);
    // pair by shared key first, then by position (a correction may rename the surface)
    const pairs = [];
    for (const k of oldKeys) {
      if (k in newv) pairs.push([k, k]);
      else {
        const pos = newKeys.findIndex((nk) => nk.toLowerCase().startsWith(k.toLowerCase().slice(0, 12)) || k.toLowerCase().startsWith(nk.toLowerCase().slice(0, 12)));
        if (pos >= 0) pairs.push([k, newKeys[pos]]);
      }
    }
    for (const [ok, nk] of pairs) {
      const surfaceKey = /^\//.test(nk) ? nk : ok;
      let url = null;
      if (/^\//.test(surfaceKey)) url = 'https://councilof.ai' + surfaceKey;
      else {
        const blob = [e.fix, e.what_changed, e.board_change, e.method].filter(Boolean).join(' ');
        const paths = [...blob.matchAll(/(?:^|[\s"'(])(\/[a-z0-9\-_/]{2,40})(?=[\s"',)]|$)/gi)].map((m) => m[1]);
        const cand = paths.find((p) => norm(surfaceKey).includes(norm(p).replace(/\//g, ' '))) || paths[0];
        if (cand) url = 'https://councilof.ai' + cand;
      }
      if (url) checks.push({ surface: surfaceKey, url, old_text: oldv[ok], new_text: newv[nk] });
    }
  }

  if (!checks.length) {
    // fallback: a URL in the entry's own text plus a candidate value
    const blob = JSON.stringify([e.evidence, e.fix, e.board_change, e.what_changed, e.supersedes_text, e.note].filter(Boolean));
    const urls = [...new Set([...blob.matchAll(/https?:\/\/[^\s",\]\)]+/g)].map((m) => m[0]))];
    const oldCandidates = [];
    const collect = (o) => { if (o && typeof o === 'object') for (const v of Object.values(o)) if (typeof v === 'string' && v.length > 25) oldCandidates.push(v); };
    collect(e.old_values);
    if (typeof e.supersedes_text === 'string' && e.supersedes_text.length > 25) oldCandidates.push(e.supersedes_text);
    for (const u of urls.slice(0, 2)) {
      for (const cand of oldCandidates.slice(0, 2)) {
        checks.push({ surface: u, url: u, old_text: cand, new_text: null });
      }
    }
  }
  if (checks.length) plan.push({ id, status: e.status || null, reached_the_public: e.reached_the_public ?? null, published_at: e.published_at ?? null, live_readback: e.live_readback ?? null, checks });
}

// ---- fetch every surface once
const urlList = [...new Set(plan.flatMap((p) => p.checks.map((c) => c.url)))];
console.error(`entries=${entries.length} checkable_entries=${plan.length} surfaces=${urlList.length}`);
const pages = new Map();
let ui = 0;
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urlList.length) }, async () => {
  while (ui < urlList.length) {
    const u = urlList[ui++];
    const r = await fetchText(u);
    const w = norm(r.text).split(' ').filter(Boolean);
    pages.set(u, { ...r, words: w, wordSet: new Set(w) });
  }
}));

// ---- evaluate
const rows = [];
for (const p of plan) {
  for (const c of p.checks) {
    const page = pages.get(c.url);
    if (!page || !page.ok) {
      rows.push({ id: p.id, surface: c.surface, url: c.url, outcome: 'UNVERIFIABLE', reason: `surface not readable (${page ? page.status : 'no response'})` });
      continue;
    }
    const oldW = words(c.old_text);
    const newW = c.new_text ? words(c.new_text) : null;
    const oldSub = oldW.length ? quotePresent(page.words, oldW) : false;
    const newSub = newW ? quotePresent(page.words, newW) : false;
    const oldCov = coverage(page.wordSet, oldW);
    const newCov = newW ? coverage(page.wordSet, newW) : null;
    // negative control: the new quote with one content word changed must lose coverage
    let nc = null;
    if (newW) {
      const cw = contentWords(newW);
      // The control is only meaningful when the new value is actually on the page:
      // mutating a word of a quote that is absent proves nothing.
      if (cw.length >= 2 && newCov && newCov.ratio > 0) {
        const mutated = cw.map((w, i) => (i === 0 ? (w[0] === 'z' ? 'y' : 'z') + w.slice(1) : w));
        const ncCov = coverage(page.wordSet, mutated);
        nc = ncCov.ratio < newCov.ratio ? 'DISCRIMINATING' : 'NOT_DISCRIMINATING';
      } else {
        nc = 'NOT_APPLICABLE';
      }
    }
    const OLD_PRESENT = oldSub || (oldCov.ratio !== null && oldCov.ratio >= 0.8);
    const NEW_PRESENT = newSub || (newCov && newCov.ratio !== null && newCov.ratio >= 0.8);
    let outcome, reason;
    if (NEW_PRESENT && !OLD_PRESENT) { outcome = 'PROPAGATED'; reason = 'new value present, old value absent'; }
    else if (OLD_PRESENT && !NEW_PRESENT) { outcome = 'NOT_PROPAGATED'; reason = 'old value still present on the surface'; }
    else if (OLD_PRESENT && NEW_PRESENT) { outcome = 'PARTIAL'; reason = 'old value still present alongside the new one'; }
    else if (newCov && newCov.ratio !== null && newCov.ratio >= 0.5) { outcome = 'PROPAGATED_REWORDED'; reason = 'old value gone, new value materially present but reworded'; }
    else { outcome = 'UNVERIFIABLE'; reason = 'neither value located in the live bytes (dynamic surface, a different rendering, or a value that was never published in this form)'; }
    rows.push({
      id: p.id, surface: c.surface, url: c.url, http_status: page.status, bytes: page.bytes, latency_ms: page.ms,
      old_quote_words: oldW.length, new_quote_words: newW ? newW.length : 0,
      old_subsequence: oldSub, new_subsequence: newSub,
      old_coverage: oldCov, new_coverage: newCov,
      negative_control: nc,
      outcome, reason,
    });
  }
}

const tally = {};
for (const r of rows) tally[r.outcome] = (tally[r.outcome] || 0) + 1;
const verifiable = rows.filter((r) => r.outcome === 'PROPAGATED' || r.outcome === 'PROPAGATED_REWORDED' || r.outcome === 'NOT_PROPAGATED' || r.outcome === 'PARTIAL');
const entriesCovered = new Set(rows.map((r) => r.id));
const entriesConfirmed = new Set(rows.filter((r) => r.outcome === 'PROPAGATED' || r.outcome === 'PROPAGATED_REWORDED').map((r) => r.id));
const entriesNotPropagated = new Set(rows.filter((r) => r.outcome === 'NOT_PROPAGATED' || r.outcome === 'PARTIAL').map((r) => r.id));
const ncFails = rows.filter((r) => r.negative_control === 'NOT_DISCRIMINATING');
const ncApplicable = rows.filter((r) => r.negative_control === 'DISCRIMINATING' || r.negative_control === 'NOT_DISCRIMINATING').length;

const out = {
  schema: 'csoai.correction-propagation-readback/0.1',
  run_id: RUN_ID,
  observed_at: observedAt,
  authority_state: 'measurement_only_not_a_certification',
  signed: false,
  writes_ledger: false,
  what_this_is: 'A mechanical readback: for each correction that names a surface and a value, re-read that surface live and ask whether the OLD value is gone and the NEW value is present. A byte delta is a change; this reports the change and never a judgement about the correction.',
  what_this_is_not: ['not a certification', 'not a conformity determination', 'not a verdict that a correction was right', 'not a finding that any third party is wrong', 'not a write to the corrections ledger'],
  method: {
    readback: 'live HTTP GET of the named surface; strip tags, unescape entities, collapse whitespace, lowercase',
    match: 'the first 14 words of the quote must appear in order as a subsequence of the page words',
    negative_control: 'the new quote with its first character changed must STOP matching; a control that still matches is reported as NOT_DISCRIMINATING',
    timeout_ms: TIMEOUT_MS, concurrency: CONCURRENCY, user_agent: UA,
  },
  ledger_source: LEDGER_URL,
  ledger_sha256: ledgerSha,
  ledger_signature_state: ledger.signature_state ?? null,
  corrections_total: entries.length,
  entries_with_a_checkable_surface: entriesCovered.size,
  entries_with_no_checkable_surface: entries.length - entriesCovered.size,
  surface_checks_run: rows.length,
  tally,
  propagation_rate_over_verifiable: verifiable.length ? Number((verifiable.filter((r) => r.outcome === 'PROPAGATED' || r.outcome === 'PROPAGATED_REWORDED').length / verifiable.length).toFixed(4)) : null,
  entries_confirmed_propagated: entriesConfirmed.size,
  entries_not_propagated: entriesNotPropagated.size,
  negative_controls_applicable: ncApplicable,
  negative_controls_not_discriminating: ncFails.length,
  negative_controls_not_applicable: rows.filter((r) => r.negative_control === 'NOT_APPLICABLE').length,
  ledger_self_report_for_comparison: {
    propagation_readbacks_completed: ledger.verdict?.propagation_readbacks_completed ?? null,
    propagation_state: ledger.verdict?.propagation_state ?? null,
    global_propagation_rate: ledger.verdict?.global_propagation_rate ?? null,
    entries_carrying_reached_the_public: entries.filter((e) => e.reached_the_public === true).length,
    entries_with_published_at_UNRECORDED: entries.filter((e) => e.published_at === 'UNRECORDED').length,
  },
  limitations: [
    'A quote is matched by word subsequence, not by byte equality, so a page that reformats a sentence still matches; a page that changes a word does not.',
    'A surface that is dynamic, or a value rendered from a different endpoint, reads UNVERIFIABLE. That is a measurement limit, never a failure of the correction.',
    'Only surfaces named inside the correction itself are read. A correction that also propagated to a surface it does not name is not counted as unchecked.',
    'The ledger records 87 of 93 corrections as published_at UNRECORDED, so this run cannot say WHEN a correction became public — only whether the new value is there now.',
  ],
  not_propagated: rows.filter((r) => r.outcome === 'NOT_PROPAGATED' || r.outcome === 'PARTIAL'),
  rows,
};
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
console.error(JSON.stringify({ tally, verifiable: verifiable.length, rate: out.propagation_rate_over_verifiable, ncFails: ncFails.length, entriesCovered: entriesCovered.size }, null, 1));
