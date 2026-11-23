#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Historical 3-around-1 SOURCE audit: never run original entrypoint or model.
// Evaluate only two explicitly extracted, bounded trusted-source JS expressions
// in a disposable VM. Not a safe parser for adversarial arbitrary JavaScript.
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';

export const SCHEMA = 'csoai.historical-triad-oracle-leak-audit/0.1';

const sha = b => crypto.createHash('sha256').update(b).digest('hex');

function extractExpression(source, begin, end) {
  const s = source.indexOf(begin);
  if (s < 0 || source.indexOf(begin, s + begin.length) !== -1) throw Error('ambiguous source expression marker');
  const a = s + begin.length, b = source.indexOf(end, a);
  if (b < a || b - a > 100000) throw Error('source expression extraction failed or exceeded cap');
  return source.slice(a, b + end.length).trim().replace(/;\s*$/, '');
}

function checkedItemsAndReferee(source) {
  if (typeof source !== 'string' || source.length > 200000) throw Error('unbounded/truncated source');
  const itemExpression = extractExpression(source,'const FROZEN_TIMELINE_ITEMS = ','\n];');
  const fnStart = source.indexOf('function gspcCenterReferee(');
  if (fnStart < 0 || source.indexOf('function gspcCenterReferee(',fnStart+20)>=0) throw Error('missing or repeated referee function');
  const fnEnd = source.indexOf('\n}', fnStart);
  if (fnEnd < 0 || fnEnd - fnStart > 20000) throw Error('unbounded referee function');
  const functionExpression = source.slice(fnStart,fnEnd+2);
  // The program file is an explicitly authorized locally trusted project asset.
  // No imports, private keys, network or code outside these expressions execute.
  const items = vm.runInNewContext('('+itemExpression+')',Object.create(null),{timeout:1000});
  const referee = vm.runInNewContext('('+functionExpression+')',Object.create(null),{timeout:1000});
  if (!Array.isArray(items) || typeof referee !== 'function' || items.length<1 || items.length>64) throw Error('bad extracted fixture');
  return {items,referee};
}

function expectedMetaChoice(item) {
  if (!item || typeof item!=='object' || !item.meta || typeof item.meta!=='object') throw Error('missing meta');
  const {type}=item.meta;
  const field=type==='supersession'?'newest_active_option':
    type==='genesis_floor'?'genesis_floor':
    type==='bidirectional_drift'?'synthesized_option':null;
  if (!field) throw Error('unsupported meta type');
  return {field,choice:item.meta[field]};
}

function validateSignedRecord(record) {
  if (!record || typeof record!=='object' || record.schema!=='csoai.capability-verdict/0.1' ||
      record.axis!=='meok-backward-3around1-temporal') throw Error('incorrect signed record schema');
  const {signature,...payload}=record;
  if (!signature || signature.alg!=='Ed25519' || typeof signature.public_key_pem!=='string' ||
      typeof signature.value_b64!=='string') throw Error('missing signed evidence');
  const valid=crypto.verify(null,Buffer.from(JSON.stringify(payload)),signature.public_key_pem,Buffer.from(signature.value_b64,'base64'));
  if (!valid) throw Error('record does not verify with its supplied public key');
  const rows=payload.part2_live_ollama_temporal_bench?.items;
  const history=payload.part1_real_frozen_ledger?.query_rows;
  if (!Array.isArray(rows)||!Array.isArray(history)) throw Error('no historical item evidence');
  const evidence=sha(JSON.stringify({ledgerEval:payload.part1_real_frozen_ledger,itemResults:rows}));
  if (evidence!==payload.evidence_sha256) throw Error('recorded evidence digest does not match data');
  return {payload,rows,history};
}

export function auditHistoricalTriad(source,record,profile='local-historical') {
  const {items,referee}=checkedItemsAndReferee(source);
  const {payload,rows,history}=validateSignedRecord(record);
  if (rows.length!==items.length) throw Error('source and result task counts differ');
  const byId=new Map(rows.map(x=>[x.id,x]));
  if(byId.size!==rows.length)throw Error('duplicate item id');
  let answerMetaMatches=0, forcedCorrect=0, strippedCorrect=0, recordedModelOnlyCorrect=0, recordedCenterCorrect=0;
  const leakageByType={};
  for (const item of items) {
    const row=byId.get(item.id);
    if (!row || !['A','B','C','D'].includes(item.gold)) throw Error('unmatched or invalid item');
    const {field,choice}=expectedMetaChoice(item);
    if(!['A','B','C','D'].includes(choice))throw Error('missing/invalid meta choice');
    if(row.gold!==item.gold)throw Error('source/result gold mismatch');
    const match=choice===item.gold;
    if(match)answerMetaMatches++;
    const key=item.meta.type;
    if(!leakageByType[key])leakageByType[key]={count:0,meta_equals_gold:0};
    leakageByType[key].count++;
    leakageByType[key].meta_equals_gold+=Number(match);
    const definitelyWrong=['A','B','C','D'].find(v=>v!==item.gold);
    forcedCorrect+=Number(referee(item,definitelyWrong,definitelyWrong,definitelyWrong)===item.gold);
    const blinded={...item,meta:{type:item.meta.type}};
    strippedCorrect+=Number(referee(blinded,definitelyWrong,definitelyWrong,definitelyWrong)===item.gold);
    recordedModelOnlyCorrect+=Number(row.seat3_merger_llm?.choice===item.gold);
    recordedCenterCorrect+=Number(row.center_referee_3around1?.choice===item.gold);
  }
  const historyTriadCorrect=history.filter(r=>r.triad_ok===true).length;
  const historyFwdCorrect=history.filter(r=>r.forward_ok===true).length;
  const combined=payload.combined_32_item_summary;
  const totalN=history.length+items.length;
  if (combined.total_n!==totalN ||
      combined.triad_3around1_bidirectional.pass!==historyTriadCorrect+recordedCenterCorrect ||
      combined.normal_forward_oldest_first.pass!==historyFwdCorrect+rows.filter(r=>r.seat1_forward?.correct===true).length) {
    throw Error('historical result does not replay its own summary');
  }
  const result={
    schema:SCHEMA,
    state:'RETROSPECTIVE_AUTHORISED_LOCAL_SOURCE_AUDIT',
    original_script_sha256:sha(source),
    original_record_sha256:sha(JSON.stringify(record)),
    signed_record_valid_with_record_embedded_public_key:true,
    external_signer_identity_authenticated:false,
    embedded_evidence_sha256_valid:true,
    n_live_model_items:items.length,
    n_historical_ledger_queries:history.length,
    n_meta_answer_choice_equal_to_gold:answerMetaMatches,
    all_model_seats_forced_wrong_referee_still_correct:forcedCorrect,
    all_model_seats_forced_wrong_and_meta_choice_removed_correct:strippedCorrect,
    recorded_model_only_synth_correct:recordedModelOnlyCorrect,
    recorded_center_referee_correct:recordedCenterCorrect,
    recorded_ledger_triad_correct:historyTriadCorrect,
    recorded_combined_total_n:totalN,
    recorded_combined_correct:historyTriadCorrect+recordedCenterCorrect,
    by_rule_type:leakageByType,
    max_observed_referee_claim:'ORACLE_LABEL_EXPOSURE'===('ORACLE_LABEL_EXPOSURE'), // stable boolean flag
    not_independent_hidden_test:true,
    never_scored_by_new_model:false===true,
    conclusion:answerMetaMatches===items.length && forcedCorrect===items.length ?
      'PERFECT_REPORTED_REFEREE_ACCURACY_IS_FULLY_EXPLAINABLE_BY_ANSWER_BEARING_RULE_METADATA' :
      'META_ANSWER_OVERLAP_PARTIAL_IN_THIS_ARCHIVE',
    limitations:[
      'Signature verified only with public key embedded in the same artifact; outside signer/key custody not authenticated',
      'The original live Ollama calls were not repeated; frozen output correctness is a retrospective source assertion',
      'Questions and answer labels were available to the original fixed referee metadata before grading',
      'Removing the answer-bearing fields is a destructive counterfactual, not a repaired runtime or blind model study',
      'The historical ledger queries were source-authored cases; 20/20 on those does not confer hidden-task generalization',
      'The original 32/32 and its p value are not a valid independent blinded-council efficacy claim',
      'No production model, human decision, GSPC axis, BFT quorum or signed public board was modified',
    ],
  };
  result.report_sha256=sha(JSON.stringify(result));
  return result;
}

if (process.argv[1]?.endsWith('audit_historical_triad.mjs')) {
  const args=process.argv.slice(2);
  if(args.length!==4||args[0]!=='--source'||args[2]!=='--record') {
    console.error('Usage: node audit_historical_triad.mjs --source LOCALLY_AUTHORISED_MJS --record MATCHING_JSON');
    process.exit(2);
  }
  const source=fs.readFileSync(args[1],'utf8');
  if(source.length>200000)throw Error('source limit');
  const raw=fs.readFileSync(args[3],'utf8');
  if(raw.length>200000)throw Error('record limit');
  const record=JSON.parse(raw);
  console.log(JSON.stringify(auditHistoricalTriad(source,record),null,2));
}
