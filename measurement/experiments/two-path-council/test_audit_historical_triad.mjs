#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {auditHistoricalTriad} from './audit_historical_triad.mjs';

const sha = x => crypto.createHash('sha256').update(x).digest('hex');

function fixture(mutate = null) {
  const items = [
    {id:'T01',gold:'B',meta:{type:'supersession',newest_active_option:'B'}},
    {id:'T02',gold:'C',meta:{type:'genesis_floor',genesis_floor:'C'}},
    {id:'T03',gold:'D',meta:{type:'bidirectional_drift',synthesized_option:'D'}},
  ];
  if (mutate) mutate(items);
  const fn = [
    'function gspcCenterReferee(item,fLabel,bLabel,synthLabel) {',
    "  if(item.meta.type==='supersession') return synthLabel===item.meta.newest_active_option?synthLabel:(bLabel===item.meta.newest_active_option?bLabel:item.meta.newest_active_option);",
    "  if(item.meta.type==='genesis_floor') return synthLabel===item.meta.genesis_floor?synthLabel:(fLabel===item.meta.genesis_floor?fLabel:item.meta.genesis_floor);",
    "  if(item.meta.type==='bidirectional_drift') return synthLabel===item.meta.synthesized_option?synthLabel:item.meta.synthesized_option;",
    '  return synthLabel;',
    '}',
  ].join('\n');
  const arr=JSON.stringify(items,null,2).replace(/\]$/, '\n]');
  const source = 'const FROZEN_TIMELINE_ITEMS = '+arr+';\n'+fn+'\n';
  const history=[{id:'L01',forward_ok:false,triad_ok:true},{id:'L02',forward_ok:true,triad_ok:true}];
  const rows=items.map((it,i)=>({
    id:it.id,gold:it.gold,
    seat1_forward:{choice:'A',correct:false},
    seat2_backward:{choice:'A',correct:false},
    seat3_merger_llm:{choice:i===0?it.gold:'A',correct:i===0},
    center_referee_3around1:{choice:it.gold,correct:true},
  }));
  const ledgerEval={query_rows:history};
  const part2={items:rows};
  const payload={
    schema:'csoai.capability-verdict/0.1',
    axis:'meok-backward-3around1-temporal',
    part1_real_frozen_ledger:ledgerEval,
    part2_live_ollama_temporal_bench:part2,
    combined_32_item_summary:{total_n:5,triad_3around1_bidirectional:{pass:5},
                              normal_forward_oldest_first:{pass:1}},
    evidence_sha256:sha(JSON.stringify({ledgerEval,itemResults:rows})),
  };
  const {privateKey,publicKey}=crypto.generateKeyPairSync('ed25519');
  const signature={
    alg:'Ed25519',
    value_b64:crypto.sign(null,Buffer.from(JSON.stringify(payload)),privateKey).toString('base64'),
    public_key_pem:publicKey.export({type:'spki',format:'pem'}),
  };
  return {source,record:{...payload,signature},items};
}

test('all wrong seats still get gold when referee metadata carries answer',()=>{
  const {source,record}=fixture();
  const x=auditHistoricalTriad(source,record,'synthetic-fixture');
  assert.equal(x.n_meta_answer_choice_equal_to_gold,3);
  assert.equal(x.all_model_seats_forced_wrong_referee_still_correct,3);
  assert.equal(x.all_model_seats_forced_wrong_and_meta_choice_removed_correct,0);
  assert.equal(x.recorded_model_only_synth_correct,1);
  assert.equal(x.recorded_center_referee_correct,3);
  assert.equal(x.recorded_combined_correct,5);
  assert.equal(x.external_signer_identity_authenticated,false);
  assert.equal(x.original_script_bound_by_signed_record,false);
  assert.equal(x.new_model_calls_performed,false);
  assert.match(x.conclusion,/FULLY_EXPLAINABLE_BY_ANSWER_BEARING_RULE_METADATA/);
});

test('modified record cannot pass signed evidence check',()=>{
  const {source,record}=fixture();
  record.part2_live_ollama_temporal_bench.items[0].gold='A';
  assert.throws(()=>auditHistoricalTriad(source,record),/does not verify/);
});

test('original source gold must equal signed result gold',()=>{
  const {source,record}=fixture(x=>x[1].gold='A');
  assert.throws(()=>auditHistoricalTriad(source,record),/source\/result gold mismatch/);
});

test('source with partial meta answer overlap is not a perfect outcome',()=>{
  const {source,record}=fixture(x=>x[1].meta.genesis_floor='A');
  const x=auditHistoricalTriad(source,record);
  assert.equal(x.n_meta_answer_choice_equal_to_gold,2);
  assert.equal(x.all_model_seats_forced_wrong_referee_still_correct,2);
  assert.equal(x.answer_key_exposure_observed,false);
});

test('unknown meta class rejected',()=>{
  const {source,record}=fixture(x=>x[1].meta.type='unknown');
  assert.throws(()=>auditHistoricalTriad(source,record),/unsupported meta type/);
});

test('same source digest and findings reproduce',()=>{
  const {source,record}=fixture();
  assert.deepEqual(auditHistoricalTriad(source,record),auditHistoricalTriad(source,record));
});

test('source extraction fails closed on unbounded fixture',()=>{
  const {source,record}=fixture();
  assert.throws(()=>auditHistoricalTriad(source+'x'.repeat(200001),record),/unbounded/);
});
