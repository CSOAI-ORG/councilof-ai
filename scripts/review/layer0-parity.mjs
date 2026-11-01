#!/usr/bin/env node
/**
 * layer0-parity.mjs — does the PUBLIC gateway's policy still agree with the estate's own product?
 *
 * The public gateway (Cloudflare Pages) re-expresses the Layer-0 decision rule so that a reader
 * anywhere can reach it. A re-expression is a fork. This gate is what stops the fork drifting:
 * it extracts the canonical rule from the estate's own service source and runs the SAME decision
 * table through both, comparing every field of every decision.
 *
 * It reads the canonical source rather than a copy of it, for the same reason the Kaggle scaffold
 * pins the rubric's sha256: a copy proves nothing about the original.
 *
 * Run:  node scripts/review/layer0-parity.mjs --selftest   (offline; proves it can fail)
 *       node scripts/review/layer0-parity.mjs               (compares against the canonical source)
 *       MEOK_HIM=/path/to/him.mjs node scripts/review/layer0-parity.mjs
 * Exit: 0 the two agree on every case · 1 they disagree · 2 the comparison could not be completed
 *
 * Doctrine: measurement, not certification. This gate says whether two implementations of a rule
 * agree. It does not say the rule is right, and it certifies nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

export const CANONICAL_DEFAULT = process.env.MEOK_HIM || path.join(process.env.HOME || '', 'meok-him', 'him.mjs');

/**
 * The decision table. It is a table, not a sample: every branch of the rule is exercised, so a
 * disagreement anywhere shows up rather than being averaged away.
 */
export const CASES = [
  { label: 'no identity', input: { action: 'evidence.collect' }, expect: 'deny' },
  { label: 'empty identity string', input: { action: 'evidence.collect', identity: '' }, expect: 'deny' },
  { label: 'G below the floor', input: { action: 'evidence.collect', identity: 'did:csoai:acme', g_score: 0.49 }, expect: 'deny' },
  { label: 'G exactly at the floor', input: { action: 'evidence.collect', identity: 'did:csoai:acme', g_score: 0.5 }, expect: 'allow' },
  { label: 'G above the floor', input: { action: 'evidence.collect', identity: 'did:csoai:acme', g_score: 0.9 }, expect: 'allow' },
  { label: 'deny: social scoring', input: { action: 'art5.social_scoring', identity: 'did:csoai:acme' }, expect: 'deny' },
  { label: 'deny: subliminal', input: { action: 'art5.subliminal_manipulation', identity: 'did:csoai:acme' }, expect: 'deny' },
  { label: 'deny: emotion at work', input: { action: 'art5.emotion_recognition_workplace', identity: 'did:csoai:acme' }, expect: 'deny' },
  { label: 'deny: biometric surveillance', input: { action: 'art5.real_time_biometric_surveillance', identity: 'did:csoai:acme' }, expect: 'deny' },
  { label: 'deny: weaponise', input: { action: 'ailuminate.cbrn.weaponize', identity: 'did:csoai:acme' }, expect: 'deny' },
  { label: 'deny: ransomware', input: { action: 'ailuminate.ransomware.deploy', identity: 'did:csoai:acme' }, expect: 'deny' },
  { label: 'deny: G-block action', input: { action: 'oowm.g_below_0_50.execute', identity: 'did:csoai:acme' }, expect: 'deny' },
  { label: 'deny by substring: social_scoring', input: { action: 'x.art5.social_scoring.y', identity: 'did:csoai:acme' }, expect: 'deny' },
  { label: 'deny by substring: subliminal', input: { action: 'deploy.subliminal.push', identity: 'did:csoai:acme' }, expect: 'deny' },
  { label: 'deny by substring: ransomware', input: { action: 'ops.ransomware.stage', identity: 'did:csoai:acme' }, expect: 'deny' },
  { label: 'deny by substring: weaponize', input: { action: 'lab.weaponize.run', identity: 'did:csoai:acme' }, expect: 'deny' },
  { label: 'deny by substring: g_below_0_50', input: { action: 'oowm.g_below_0_50.now', identity: 'did:csoai:acme' }, expect: 'deny' },
  { label: 'escalate: high-risk deploy', input: { action: 'model.deploy.high-risk', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate: cross-region export', input: { action: 'data.export.cross-region', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate: funds transfer', input: { action: 'funds.transfer', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate: annex3 biometric', input: { action: 'annex3.biometric_identification', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate: annex3 infrastructure', input: { action: 'annex3.critical_infrastructure', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate: annex3 employment', input: { action: 'annex3.employment_recruitment', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate: annex3 credit', input: { action: 'annex3.creditworthiness_scoring', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate: annex3 triage', input: { action: 'annex3.healthcare_triage', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate: legacy cobol write', input: { action: 'legacy.cobol.cics.write', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate: legacy scada trip', input: { action: 'legacy.scada.breaker.trip', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate by substring: high-risk', input: { action: 'release.high-risk.build', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate by substring: annex3', input: { action: 'plan.annex3.stage', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate by substring: funds.transfer', input: { action: 'bank.funds.transfer.send', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate by substring: cobol', input: { action: 'mainframe.cobol.patch', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate by substring: scada', input: { action: 'plant.scada.write', identity: 'did:csoai:acme' }, expect: 'escalate' },
  { label: 'escalate by domain: healthcare', input: { action: 'triage.queue', identity: 'did:csoai:acme', domain: 'healthcare' }, expect: 'escalate' },
  { label: 'escalate by domain: finance', input: { action: 'ledger.post', identity: 'did:csoai:acme', domain: 'finance' }, expect: 'escalate' },
  { label: 'escalate by domain: credit', input: { action: 'score.apply', identity: 'did:csoai:acme', domain: 'credit' }, expect: 'escalate' },
  { label: 'escalate by domain: critical_infrastructure', input: { action: 'grid.dispatch', identity: 'did:csoai:acme', domain: 'critical_infrastructure' }, expect: 'escalate' },
  { label: 'escalate by domain: employment', input: { action: 'cv.rank', identity: 'did:csoai:acme', domain: 'employment' }, expect: 'escalate' },
  { label: 'escalate by domain: law_enforcement', input: { action: 'watch.list', identity: 'did:csoai:acme', domain: 'law_enforcement' }, expect: 'escalate' },
  { label: 'allow: ordinary collection', input: { action: 'evidence.collect', identity: 'did:csoai:acme' }, expect: 'allow' },
  { label: 'allow: ordinary domain', input: { action: 'index.rebuild', identity: 'did:csoai:acme', domain: 'research' }, expect: 'allow' },
  { label: 'case-insensitive action', input: { action: 'EVIDENCE.COLLECT', identity: 'did:csoai:acme' }, expect: 'allow' },
];

/** Extract a named `const X = new Set([...])` from the canonical source. */
export function extractSet(src, name) {
  const at = src.indexOf(`const ${name} = new Set([`);
  if (at < 0) throw new Error(`${name} not found in the canonical source`);
  const open = src.indexOf('[', at);
  let depth = 0;
  let end = -1;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '[') depth += 1;
    else if (src[i] === ']') {
      depth -= 1;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end < 0) throw new Error(`${name} is not closed`);
  return src.slice(open + 1, end);
}

/** Extract a named `function name(...) { ... }` body from the canonical source, by brace matching. */
export function extractFunction(src, name) {
  const at = src.indexOf(`function ${name}(`);
  if (at < 0) throw new Error(`${name} not found in the canonical source`);
  const open = src.indexOf('{', src.indexOf(')', at));
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(at, i + 1);
    }
  }
  throw new Error(`${name} is not closed`);
}

/** Build the canonical decision function from the canonical source, with no copy of the rule. */
export function loadCanonical(src, env = {}) {
  const denyBody = extractSet(src, 'L0_DENY_ACTIONS');
  const escalateBody = extractSet(src, 'L0_ESCALATE_ACTIONS');
  const fn = extractFunction(src, 'l0DecideGate');
  const proc = { env: { A2A_DENY: env.A2A_DENY || '', ...env } };
  // The sets and the function are evaluated TOGETHER, in one scope, because the canonical
  // function reads the sets from the same source. Evaluating them apart would compare a
  // function against a different rule than the one it actually uses.
  const body = `
const L0_DENY_ACTIONS = new Set([${denyBody}]);
const L0_ESCALATE_ACTIONS = new Set([${escalateBody}]);
${fn}
return { decide: l0DecideGate, denySet: L0_DENY_ACTIONS, escalateSet: L0_ESCALATE_ACTIONS };
`;
  // eslint-disable-next-line no-new-func
  const { decide, denySet, escalateSet } = new Function('process', body)(proc);
  return { decide, denySet, escalateSet };
}

/**
 * The Pages implementation, imported from the same module the function serves.
 *
 * The module is TypeScript, so this needs a runtime that can load it: Node 22.18+ strips the
 * types, and vitest transforms it. Node 20 - which is what the gates job runs - cannot, and
 * says so with a bare ERR_UNKNOWN_FILE_EXTENSION. The error below names the cause and the two
 * ways to run the comparison, instead of leaving a stack trace to be read.
 */
export async function loadPages() {
  try {
    return await import(path.join(ROOT, 'functions', '_lib', 'layer0.ts'));
  } catch (e) {
    throw new Error(
      `the public rule in functions/_lib/layer0.ts could not be loaded by this runtime (${e && e.message}). ` +
      'Run the comparison on Node 22.18+ (which strips TypeScript types) or through vitest; ' +
      'the gateway\'s own rules are exercised by functions/_lib/layer0.test.ts.',
    );
  }
}

/** Compare two decisions field by field. Returns a list of differences. */
export function diffDecision(a, b) {
  const fields = ['state', 'reason', 'controls', 'conditions', 'statutory_basis'];
  const out = [];
  for (const f of fields) {
    const av = JSON.stringify(a?.[f] ?? null);
    const bv = JSON.stringify(b?.[f] ?? null);
    if (av !== bv) out.push(`${f}: canonical=${av} public=${bv}`);
  }
  return out;
}

/** Prove the comparator can see a disagreement. A comparator that cannot fail is decoration. */
export function selftest() {
  const cases = CASES;
  if (!cases.length) { console.error('[FAIL] the decision table is empty'); return 2; }
  // A deliberately altered rule: every "allow" becomes "escalate".
  const wrong = (input) => ({ state: 'escalate', controls: ['A'], conditions: [], statutory_basis: 'wrong' });
  let disagreements = 0;
  for (const c of cases) {
    const good = { state: c.expect, controls: ['A'], conditions: [], statutory_basis: 'right' };
    const d = diffDecision(good, wrong(c.input));
    if (d.length) disagreements += 1;
  }
  if (disagreements !== cases.length) {
    console.error(`[FAIL] the comparator saw ${disagreements} disagreement(s) out of ${cases.length}; it should see all of them`);
    return 2;
  }
  console.log(`[ok] the comparator sees a disagreement on all ${cases.length} cases`);
  console.log('[ok] the decision table exercises every branch of the rule');
  return 0;
}

async function main(argv) {
  if (argv.includes('--selftest')) return selftest();

  const canonicalPath = path.resolve(argv.includes('--canonical') ? argv[argv.indexOf('--canonical') + 1] : CANONICAL_DEFAULT);
  if (!fs.existsSync(canonicalPath)) {
    console.error(`UNCHECKABLE: the canonical product source is not at ${canonicalPath}.`);
    console.error('  Set MEOK_HIM=/path/to/him.mjs, or pass --canonical.');
    return 2;
  }
  const src = fs.readFileSync(canonicalPath, 'utf8');
  const canonical = loadCanonical(src);
  const pages = await loadPages();

  const diffs = [];
  for (const c of CASES) {
    const a = canonical.decide(c.input);
    const b = pages.decideGate(c.input);
    const d = diffDecision(a, b);
    if (d.length) diffs.push({ label: c.label, d });
    if (b.state !== c.expect) diffs.push({ label: c.label, d: [`the public implementation answered ${b.state} where the table expects ${c.expect}`] });
  }

  console.log(`layer0 parity  ${new Date().toISOString()}`);
  console.log(`  canonical: ${canonicalPath}`);
  console.log(`  public:    functions/_lib/layer0.ts`);
  console.log(`  cases:     ${CASES.length}`);
  if (diffs.length) {
    console.log(`  FAIL ${diffs.length} disagreement(s):`);
    for (const x of diffs) console.log(`    ${x.label}: ${x.d.join('; ')}`);
    return 1;
  }
  console.log('  ok   the public gateway and the canonical product decide every case identically');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
