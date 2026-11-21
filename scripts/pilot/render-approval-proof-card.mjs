#!/usr/bin/env node
// Claim-bounded public pack for EXISTING synthetic approval-to-effect replay.
// Never treats synthetic fixtures as independent GSPC, human, or production proof.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';

export function render(report, commit) {
  const refuse = reason => { throw Error('Evidence pack refused: ' + reason); };
  if (report?.schema !== 'csoai.pilot-demo/0.1') refuse('unknown schema');
  if (report.outcome !== 'PASS' || !report.results || Object.values(report.results).some(v => v !== true))
    refuse('not all upstream controls passed');
  if (report.production_authority !== false || report.independent_review !== 'NOT_CONDUCTED' ||
      report.human_approval !== 'SYNTHETIC_KEY_ONLY' || report.gspc_measurement_admission !== false)
    refuse('scope and authority must remain synthetic');
  if (!Array.isArray(report.cases) || report.fixture_count !== 14 || report.cases.length !== 14)
    refuse('unexpected denominator');
  const positive = report.cases.filter(c => c.scenario === 'pass');
  const negative = report.cases.filter(c => c.scenario !== 'pass');
  if (positive.length !== 1 || negative.length !== 13 ||
      positive[0].execution !== 'EXECUTED' || positive[0].observer !== 'EFFECT_READBACK_MATCHED' ||
      positive[0].actual_effect_written !== true ||
      negative.some(c => c.execution !== 'DENIED' || c.observer !== 'NO_EFFECT' || c.actual_effect_written !== false))
    refuse('effect evidence disagrees with proposed claim');
  if (!/^[a-f0-9]{64}$/.test(report.source_sha256 ?? '')) refuse('missing source hash');
  if (!Number.isFinite(Date.parse(report.ran_at ?? ''))) refuse('missing run time');
  if (!/^[a-f0-9]{40}$/.test(commit ?? '')) refuse('source commit must be exact');
  const card = {
    schema:'csoai.synthetic-proof-card/0.1',
    title:'Approval to effect: bounded synthetic replay',
    status:'LOCAL_REPLAY_PASSED',
    observed_at:report.ran_at,
    source_commit:commit,
    harness_sha256:report.source_sha256,
    denominator:14,
    intentionally_invalid_fixtures:13,
    invalid_fixtures_denied_without_effect:13,
    valid_synthetic_fixtures:1,
    valid_synthetic_effects_observed:1,
    independent_review:'NOT_CONDUCTED',
    human_approval:'SYNTHETIC_KEY_ONLY',
    production_authority:false,
    gspc_measurement_admission:false,
    model_attack_detection_tested:false,
    third_party_endorsement:false,
    limitations:[
      'Test-generated key, not authenticated human authorization.',
      'Only bounded local temporary file effects were exercised.',
      'No remote production action, customer traffic, or model attack detection.',
      'No external institution independently reviewed or endorsed this result.',
      'File hashes identify bytes, not independent truth or external witnessing.'
    ]
  };
  const markdown = [
    '# Reproducible synthetic approval-to-effect experiment',
    '',
    '**Result:** 13 of 13 intentionally invalid approval fixtures produced no effect. One of one approved synthetic fixtures produced the bounded file effect and matched local independent-process readback.',
    '',
    '**Run:** ' + report.ran_at,
    '**Source commit:** ' + commit,
    '**Harness SHA-256:** ' + report.source_sha256,
    '',
    '**Limits:** No authenticated human, live production control, external incident prevention, independent institutional review, third-party endorsement, or GSPC measurement admission.',
    '',
    'The machine-readable card and upstream replay JSON must travel with any public claim.',
    ''
  ].join('\n');
  return { card, markdown };
}

if (process.argv[1] && import.meta.url === new URL('file://' + resolve(process.argv[1])).href) {
  if (process.argv.length !== 5) throw Error('Usage: node render-approval-proof-card.mjs INPUT_JSON SOURCE_SHA OUTPUT_DIR');
  const [input, commit, dir] = process.argv.slice(2);
  const { card, markdown } = render(JSON.parse(readFileSync(input,'utf8')), commit);
  mkdirSync(dir,{recursive:true});
  const bytes = JSON.stringify(card,null,2) + '\n';
  writeFileSync(join(dir,'pilot-proof-card.json'),bytes,{flag:'wx'});
  writeFileSync(join(dir,'pilot-proof-card.md'),markdown,{flag:'wx'});
  console.log(JSON.stringify({status:card.status, sha256:createHash('sha256').update(bytes).digest('hex')}));
}
