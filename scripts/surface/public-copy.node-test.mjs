import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Source-copy regressions run without a browser or network. They do not establish
// deployment, measurement validity, customer acceptance or a completed UI journey.
const root = new URL('../../', import.meta.url);
const source = (path) => readFileSync(new URL(path, root), 'utf8');
const publicCopy = (path) => source(path)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const boardPath = 'client/src/pages/MeasurementBoard.tsx';
const scopePath = 'client/src/pages/Honesty.tsx';

test('board enquiry explains scope without selling an evidence gap', () => {
  const board = publicCopy(boardPath);
  assert.doesNotMatch(board, /the gap is the product|any hosted model through the x402 rail|GPT, Claude and Gemini are UNMEASURED here/i);
  assert.match(board, /Need evidence for a specific model or system/);
  assert.match(board, /Explore measurement services/);
  assert.match(board, /Results apply to the subjects, methods and dates shown below/);
  assert.match(board, /href="\/services\/"/);
});

test('board retains measurement, evidence and uncertainty boundaries', () => {
  const board = source(boardPath);
  assert.match(board, /Measurement, not certification/);
  assert.match(board, /active\.doesNotEstablish\.map/);
  assert.match(board, /active\.establishes\.map/);
  assert.match(board, /unmeasuredCount/);
  assert.match(board, /a content ID is not a\s+signature/);
  assert.match(board, /signature label alone did not establish cryptographic verification/);
  assert.match(board, /Its measurement date is not established/);
});

test('shared navigation keeps limitations and corrections accessible', () => {
  const footer = source('client/src/components/Footer.tsx');
  assert.match(footer, /name: 'Measurement scope and limitations', href: '\/honesty\/'/);
  assert.match(footer, /href: '\/corrections\/'/);
  assert.doesNotMatch(footer, /What we cannot measure yet/);
  assert.match(source('client/src/pages/DocsHub.tsx'), /measurement scope and limitations/);
});

test('model updates disclose missing dates without editorial criticism', () => {
  const text = publicCopy('client/src/components/gspc/LivingBoard.tsx');
  assert.doesNotMatch(text, /nothing honest to list/i);
  assert.match(text, /A dated update feed is not currently available/);
  assert.match(text, /do not establish\s+a publication date/);
  assert.match(text, /href="\/models-measured"/);
});

test('scope page retains negative findings, corrections and distinct evidence states', () => {
  const text = publicCopy(scopePath);
  assert.match(text, /below the base models used to build them/);
  assert.match(text, /\/arena\/elo_reference\.json/);
  assert.match(text, /\/interop\/card-store-verification\.json/);
  assert.match(text, /\/api\/corrections/);
  for (const state of ['MEASURED', 'UNMEASURED', 'REPORTED']) assert.ok(text.includes(state));
  assert.match(text, /specific to the roster, not\s+a universal statistical sufficiency rule/);
  assert.match(text, /not a failing grade or a zero score/);
  assert.doesNotMatch(text, /results that embarrass|What we publish against ourselves|it caught us/i);
});

test('methodology explains reproducibility without disparaging human review', () => {
  const method = publicCopy('client/src/data/deckWorlds/predicateCompiler.ts');
  const trust = publicCopy('client/src/data/deckWorlds/verifiableTrust.ts');
  assert.match(method, /Human review remains important/);
  assert.match(method, /a test result is not a legal determination/);
  assert.doesNotMatch(method, /by assessor and by mood|useless as evidence/);
  assert.doesNotMatch(trust, /Certification theatre|Unsigned measurement dies/);
  assert.match(trust, /does not by itself establish correctness/);
});

test('learning copy distinguishes practice from measurements and conformity', () => {
  const text = publicCopy('client/src/pages/TrainingHub.tsx');
  assert.doesNotMatch(text, /Addictive games|Not boring courses|Your game scores feed your GSPC axes|learning without knowing it/);
  assert.match(text, /Practice is not a compliance determination/);
  assert.match(text, /separate from published model measurements/);
  assert.match(text, /does not certify competence or legal conformity/);
});

test('homepage report link avoids a hardcoded axis count or guaranteed daily delivery', () => {
  const home = publicCopy('client/src/pages/HomeVerify.tsx');
  const updates = publicCopy('client/src/components/home/HomeUpdates.tsx');
  // The report contract follows the component actually mounted by the front door; a
  // correct orphan component must not hide a missing homepage route to the reports.
  assert.match(home, /from ["']@\/components\/home\/HomeUpdates["']/);
  assert.match(home, /<HomeUpdates\s*\/>/);
  assert.doesNotMatch(home + updates, /\b\d+\s*[- ]\s*(?:axis|axes)\b/i);
  assert.doesNotMatch(home + updates, /published before we pitch|have it find you|guaranteed\s+daily|daily\s+(?:delivery|email|inbox)|delivered\s+(?:every|each)\s+day|every\s+day/i);
  assert.match(updates, /Measurement reports/);
  assert.match(updates, /Every source has a date and a scope/);
  assert.match(updates, /Dated summaries and their evidence status/);
  assert.match(updates, /href="https:\/\/huggingface.co\/datasets\/csoai\/gspc-daily-reports"/);
});


test('legacy benchmark pages retain recorded qualifications without editorial slogans', () => {
  const care = source('public/carebench.html');
  const xr = source('public/xrbench.html');
  assert.doesNotMatch(care + xr, /the honest statement|the honest state|truthful count|measured live, not asserted/i);
  assert.match(care, /measured at n = 1491, not quotable/);
  assert.match(care, /Implementation status — 9 of 10 complete/);
  assert.match(xr, /MEASURED at n = 32 and below that floor/);
  assert.match(xr, /Implementation status — 5 of 10 complete/);
  assert.match(xr, /not a live availability check/);
});

test('public deployment comparison excludes operator instructions and gap-as-product copy', () => {
  const text = source('public/genai-mil.html');
  assert.doesNotMatch(text, /That gap is us|honest state today|frontier-inference key|queued as an owner step|queued, not done/);
  assert.match(text, /Behavioural evaluation addresses a separate question/);
  assert.match(text, /not a live inventory of current measurement coverage/);
  assert.match(text, /not zero scores or failing grades/);
  assert.match(text, /UNCHECKABLE/);
  assert.match(text, /UNMEASURED/);
  assert.match(text, /FR2533155773/);
});
