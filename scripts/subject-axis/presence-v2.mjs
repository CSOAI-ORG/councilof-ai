// csoai.subject-axis-presence/2.0
//
// WHY THIS EXISTS (2026-11-18):
// Presence v1 compiled each class as `new RegExp(alternatives, 'i')`, and in
// subject-axis-live-run.mjs it was tested against the RAW HTML of the landing page.
// Measured on the published 2026-11-02 banks:
//   1. Short alternatives matched inside ordinary words: `act` (contact, impact),
//      `sla` (legislation, translate), `api` (capital, rapid), `itl` (title),
//      `sse` (assessment), `imu` (simulation), `eval` (retrieval), `rsp`
//      (perspective), `acl` (oracle). A benign bakery paragraph met the 3-of-5
//      bar on regulator-transparency and watchdog-ingest.
//   2. Raw HTML carries script bundles, CSS and URLs, so `json`, `api`, `sse`
//      and `act` were present on almost every page regardless of content.
//   3. The v1 "must-fail negative control" flipped one digest byte and checked the
//      hash changed. It tests sha256, not the detector, and cannot fail.
// v2: bounded alternatives (explicit stems end in `*`), a corpus of visible text
// plus link targets (never raw HTML), and a discriminating self-test that runs the
// SAME detector over must-PASS and must-FAIL text and refuses to run if either
// direction is wrong (fail-closed).
//
// Measurement only. Presence of a string is not quality, truth or compliance.

export function extractText(html) {
  let s = String(html);
  s = s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<!--[\s\S]*?-->/gi, ' ');
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
  return s.replace(/\s+/g, ' ').trim();
}

/** href values of <a> elements only — what a "link class" refers to. */
export function extractHrefs(html) {
  const out = [];
  const re = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(String(html))) !== null) out.push(m[1]);
  return out.join(' ');
}

/** The corpus the detector reads: visible text + link targets. Never raw HTML. */
export function presenceCorpus(html) {
  return (extractText(html) + ' \n ' + extractHrefs(html)).toLowerCase();
}

const L = '(?<![a-z0-9])';
// Right boundary admits common inflections so `benchmarks`, `incidents`, `regulations`
// still match, while `act` no longer matches inside `contact` or `impact`.
const R = '(?:s|es|ed|ing)?(?![a-z0-9])';
const startsAlnum = (a) => /^[a-z0-9]/i.test(a);
const endsAlnum = (a) => /[a-z0-9]$/i.test(a);

/**
 * Compile an alternatives string into one bounded RegExp. Every alternative gets
 * a left boundary; a right boundary is added unless it ends with `*` (explicit stem).
 */
export function compileClass(alternatives) {
  const parts = String(alternatives).split('|').map((a) => a.trim()).filter(Boolean)
    .map((a) => {
      const stem = a.endsWith('*');
      const body = stem ? a.slice(0, -1) : a;
      // Alternatives that begin or end with punctuation (\\.json, /api/, draft-)
      // carry their own delimiter and get no boundary on that side.
      return (startsAlnum(body) ? L : '') + body + (stem || !endsAlnum(body) ? '' : R);
    });
  return new RegExp('(?:' + parts.join('|') + ')', 'i');
}

export const compileAxis = (pats) =>
  Object.fromEntries(Object.entries(pats).map(([k, p]) => [k, compileClass(p)]));

export function presence(corpus, compiled) {
  const out = {};
  for (const [k, re] of Object.entries(compiled)) out[k] = re.test(corpus);
  return out;
}

/** Ordinary text containing the substrings that broke v1, plus framework residue. */
export const BENIGN_CORPUS = [
  'Our bakery recipe blog. We love baking bread and cakes. Contact the team for catering.',
  'Island holidays, translation services and legislation news for the village.',
  'Impact of flour prices on a capital idea; rapid delivery of fresh produce.',
  'Simulation games, maximum fun, retrieval of lost dogs, a fresh perspective on tea.',
  'Subtitle and title of the oracle cookbook; an assessment of the possessive cat.',
  'react-dom production bundle loaded. classname layout grid flex.',
  'Make sure you order early; we act fast and react to every comment with a smile.',
].join(' ').toLowerCase();

/** First alternative in a class that is plain text (after unescaping `\.`), for the must-PASS fixture. */
function plainSample(alternatives) {
  for (const a of String(alternatives).split('|')) {
    const s = a.trim().replace(/\*$/, '').replace(/\\\./g, '.');
    if (/^[a-z0-9 ./'_-]+$/i.test(s)) return s;
  }
  return null;
}

/**
 * Discriminating-power self-test (SAFE v1: a verification method states its known
 * systematic errors; see docs/standards/osaia-safe-reverification/
 * safe-discriminating-power-v0.1.schema.json). Per axis:
 *   must-FAIL: the benign corpus meets the bar on no axis;
 *   must-PASS: a fixture holding one plain alternative per class meets the bar.
 * Callers MUST abort the run when `ok` is false.
 */
export function discriminatingSelfTest(PATTERNS, bar = 3) {
  const results = {};
  let ok = true;
  for (const [axis, pats] of Object.entries(PATTERNS)) {
    const compiled = compileAxis(pats);
    const benign = presence(BENIGN_CORPUS, compiled);
    const benignHits = Object.keys(benign).filter((k) => benign[k]);
    const fixture = Object.values(pats).map((p) => 'section ' + (plainSample(p) ?? '') + ' end').join('. ').toLowerCase();
    const pos = presence(fixture, compiled);
    const posCount = Object.values(pos).filter(Boolean).length;
    const r = { benign_classes_hit: benignHits, benign_meets_bar: benignHits.length >= bar,
      positive_classes_hit: posCount, positive_meets_bar: posCount >= bar };
    if (r.benign_meets_bar || !r.positive_meets_bar) ok = false;
    results[axis] = r;
  }
  return { ok, bar, results };
}
